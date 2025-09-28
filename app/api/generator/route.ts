import { createUpdateClient } from "@/utils/update/server";
import { openai } from "@ai-sdk/openai";
import { generateText, streamText } from "ai";
import { NextRequest } from "next/server";

interface ExamGenerationRequest {
  examType: "reading" | "listening" | "writing" | "speaking";
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  language: "english" | "valenciano" | "spanish";
  topic?: string;
  questionCount?: number;
  provider?: "cambridge" | "cieacova" | "cervantes";
}

interface ExamQuestion {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  difficulty: string;
  points: number;
}

interface ExamContent {
  title: string;
  instructions: string;
  timeLimit: number;
  questions: ExamQuestion[];
  totalPoints: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check entitlements
    const client = await createUpdateClient();
    const { data, error } = await client.entitlements.check("premium");

    if (error) {
      return new Response("Error checking entitlements", { status: 500 });
    }

    if (!data.hasAccess) {
      return new Response(
        "Premium subscription required for AI exam generation",
        { status: 403 }
      );
    }

    // Parse request body
    const body: ExamGenerationRequest = await request.json();
    const {
      examType,
      level,
      language,
      topic,
      questionCount = 10,
      provider = "cambridge",
    } = body;

    if (!examType || !level || !language) {
      return new Response(
        "Missing required parameters: examType, level, language",
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return new Response("OpenAI API key not configured", { status: 500 });
    }

    // Generate exam content using AI
    const examPrompt = createExamPrompt(
      examType,
      level,
      language,
      topic,
      questionCount,
      provider
    );

    const { text } = await generateText({
      model: openai("gpt-4"),
      prompt: examPrompt,
      temperature: 0.7,
    });

    // Parse the generated content
    let examContent: ExamContent;
    try {
      examContent = JSON.parse(text);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response("Failed to generate valid exam content", {
        status: 500,
      });
    }

    // Validate and enhance the exam content
    const validatedExam = validateAndEnhanceExam(examContent, examType, level);

    return Response.json({
      success: true,
      exam: validatedExam,
      metadata: {
        examType,
        level,
        language,
        provider,
        generatedAt: new Date().toISOString(),
        questionCount: validatedExam.questions.length,
      },
    });
  } catch (error) {
    console.error("Exam generation error:", error);
    return new Response("Internal server error during exam generation", {
      status: 500,
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check entitlements for streaming demo
    const client = await createUpdateClient();
    const { data, error } = await client.entitlements.check("premium");

    if (error || !data.hasAccess) {
      return new Response("Premium subscription required", { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const prompt =
      searchParams.get("prompt") || "Generate a sample language learning tip";

    // Stream AI response for real-time feedback
    const result = await streamText({
      model: openai("gpt-4"),
      prompt: `You are a language learning expert. ${prompt}`,
      temperature: 0.8,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Streaming error:", error);
    return new Response("Error in streaming response", { status: 500 });
  }
}

function createExamPrompt(
  examType: string,
  level: string,
  language: string,
  topic: string | undefined,
  questionCount: number,
  provider: string
): string {
  const topicSection = topic ? ` focused on the topic "${topic}"` : "";

  return `Generate a ${level} level ${language} ${examType} exam${topicSection} with ${questionCount} questions following ${provider} standards.

Return ONLY a valid JSON object with this exact structure:
{
  "title": "${level} ${language.charAt(0).toUpperCase() + language.slice(1)} ${
    examType.charAt(0).toUpperCase() + examType.slice(1)
  } Test",
  "instructions": "Clear instructions for the exam",
  "timeLimit": 30,
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct",
      "difficulty": "${level}",
      "points": 1
    }
  ],
  "totalPoints": ${questionCount}
}

Ensure:
- Questions are appropriate for ${level} level
- Content matches ${language} language learning standards
- ${examType} exam type requirements are followed
- All questions have clear, unambiguous answers
- Explanations help learners understand the concepts
- JSON is properly formatted and valid`;
}

function validateAndEnhanceExam(
  examContent: ExamContent,
  examType: string,
  level: string
): ExamContent {
  // Ensure basic structure
  if (!examContent.questions || !Array.isArray(examContent.questions)) {
    throw new Error("Invalid exam structure: missing questions array");
  }

  // Validate and enhance each question
  examContent.questions = examContent.questions.map((question, index) => {
    return {
      id: question.id || `q${index + 1}`,
      type: question.type || "multiple-choice",
      question: question.question || `Question ${index + 1}`,
      options: question.options || [],
      correctAnswer: question.correctAnswer ?? 0,
      explanation: question.explanation || "Explanation not provided",
      difficulty: question.difficulty || level,
      points: question.points || 1,
    };
  });

  // Calculate total points
  examContent.totalPoints = examContent.questions.reduce(
    (sum, q) => sum + (q.points || 1),
    0
  );

  // Set reasonable time limit based on exam type and question count
  if (!examContent.timeLimit || examContent.timeLimit <= 0) {
    const baseTime =
      examType === "reading" ? 2 : examType === "writing" ? 3 : 1.5;
    examContent.timeLimit = Math.max(
      15,
      examContent.questions.length * baseTime
    );
  }

  return examContent;
}
