"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  useExamGenerator,
  type ExamGenerationRequest,
} from "@/hooks/use-exam-generator";

export function AIExamGenerator() {
  const { generateExam, isGenerating, error, generatedExam, reset } =
    useExamGenerator();
  const [formData, setFormData] = useState<ExamGenerationRequest>({
    examType: "reading",
    level: "B2",
    language: "english",
    questionCount: 10,
    provider: "cambridge",
  });

  const handleInputChange = (
    field: keyof ExamGenerationRequest,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerate = async () => {
    await generateExam(formData);
  };

  const handleReset = () => {
    reset();
  };

  if (generatedExam) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Generated Exam</h2>
          <Button onClick={handleReset} variant="outline">
            Generate New Exam
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{generatedExam.exam.title}</CardTitle>
            <CardDescription>
              {generatedExam.metadata.level} level •{" "}
              {generatedExam.metadata.questionCount} questions •
              {generatedExam.exam.timeLimit} minutes •{" "}
              {generatedExam.exam.totalPoints} points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Instructions:</h3>
                <p className="text-sm text-gray-600">
                  {generatedExam.exam.instructions}
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Questions:</h3>
                <div className="space-y-6">
                  {generatedExam.exam.questions.map((question, index) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">Question {index + 1}</h4>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {question.points} point
                          {question.points !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <p className="mb-3">{question.question}</p>

                      {question.options && question.options.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-2 rounded border ${
                                question.correctAnswer === optionIndex
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <span className="font-medium mr-2">
                                {String.fromCharCode(65 + optionIndex)})
                              </span>
                              {option}
                              {question.correctAnswer === optionIndex && (
                                <span className="ml-2 text-green-600 text-sm font-medium">
                                  ✓ Correct
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.explanation && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <h5 className="font-medium text-blue-800 mb-1">
                            Explanation:
                          </h5>
                          <p className="text-sm text-blue-700">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI Exam Generator</CardTitle>
        <CardDescription>
          Generate customized language exams using AI. Perfect for creating
          practice tests tailored to specific levels and topics.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="examType">Exam Type</Label>
            <select
              id="examType"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              value={formData.examType}
              onChange={(e) =>
                handleInputChange("examType", e.target.value as "reading" | "listening" | "writing" | "speaking")
              }
            >
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
              <option value="writing">Writing</option>
              <option value="speaking">Speaking</option>
            </select>
          </div>

          <div>
            <Label htmlFor="level">Level</Label>
            <select
              id="level"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              value={formData.level}
              onChange={(e) =>
                handleInputChange("level", e.target.value as "A1" | "A2" | "B1" | "B2" | "C1" | "C2")
              }
            >
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper Intermediate</option>
              <option value="C1">C1 - Advanced</option>
              <option value="C2">C2 - Proficiency</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="language">Language</Label>
            <select
              id="language"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              value={formData.language}
              onChange={(e) =>
                handleInputChange("language", e.target.value as "english" | "valenciano" | "spanish")
              }
            >
              <option value="english">English</option>
              <option value="valenciano">Valenciano</option>
              <option value="spanish">Spanish</option>
            </select>
          </div>

          <div>
            <Label htmlFor="provider">Provider</Label>
            <select
              id="provider"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md"
              value={formData.provider}
              onChange={(e) =>
                handleInputChange("provider", e.target.value as "cambridge" | "cieacova" | "cervantes")
              }
            >
              <option value="cambridge">Cambridge</option>
              <option value="cieacova">CIEACOVA</option>
              <option value="cervantes">Cervantes</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="questionCount">Number of Questions</Label>
            <Input
              id="questionCount"
              type="number"
              min="5"
              max="25"
              value={formData.questionCount}
              onChange={(e) =>
                handleInputChange(
                  "questionCount",
                  parseInt(e.target.value) || 10
                )
              }
            />
          </div>

          <div>
            <Label htmlFor="topic">Topic (Optional)</Label>
            <Input
              id="topic"
              placeholder="e.g., Travel, Business, Environment"
              value={formData.topic || ""}
              onChange={(e) => handleInputChange("topic", e.target.value)}
            />
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Generating Exam...
            </>
          ) : (
            "Generate AI Exam"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
