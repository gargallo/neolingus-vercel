"use client";

import { useState } from "react";

export interface ExamGenerationRequest {
  examType: "reading" | "listening" | "writing" | "speaking";
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  language: "english" | "valenciano" | "spanish";
  topic?: string;
  questionCount?: number;
  provider?: "cambridge" | "cieacova" | "cervantes";
}

export interface ExamQuestion {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: string | number;
  explanation?: string;
  difficulty: string;
  points: number;
}

export interface ExamContent {
  title: string;
  instructions: string;
  timeLimit: number;
  questions: ExamQuestion[];
  totalPoints: number;
}

export interface GeneratedExam {
  success: boolean;
  exam: ExamContent;
  metadata: {
    examType: string;
    level: string;
    language: string;
    provider: string;
    generatedAt: string;
    questionCount: number;
  };
}

export function useExamGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedExam, setGeneratedExam] = useState<GeneratedExam | null>(
    null
  );

  const generateExam = async (
    request: ExamGenerationRequest
  ): Promise<GeneratedExam | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }

      const data: GeneratedExam = await response.json();
      setGeneratedExam(data);
      return data;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate exam";
      setError(errorMessage);
      console.error("Exam generation error:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const reset = () => {
    setGeneratedExam(null);
    setError(null);
    setIsGenerating(false);
  };

  return {
    generateExam,
    isGenerating,
    error,
    generatedExam,
    reset,
  };
}

// Hook for streaming AI responses (for tutoring features)
export function useAIStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const streamResponse = async (prompt: string) => {
    setIsStreaming(true);
    setError(null);
    setStreamedContent("");

    try {
      const response = await fetch(
        `/api/generator?prompt=${encodeURIComponent(prompt)}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No reader available");
      }

      const decoder = new TextDecoder();
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        content += chunk;
        setStreamedContent(content);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to stream response";
      setError(errorMessage);
      console.error("Streaming error:", err);
    } finally {
      setIsStreaming(false);
    }
  };

  const resetStream = () => {
    setStreamedContent("");
    setError(null);
    setIsStreaming(false);
  };

  return {
    streamResponse,
    isStreaming,
    streamedContent,
    error,
    resetStream,
  };
}
