"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useAIStreaming } from "@/hooks/use-exam-generator";

interface TutorSession {
  id: string;
  question: string;
  response: string;
  timestamp: Date;
}

export function AITutor() {
  const { streamResponse, isStreaming, streamedContent, error, resetStream } =
    useAIStreaming();
  const [question, setQuestion] = useState("");
  const [sessions, setSessions] = useState<TutorSession[]>([]);

  const predefinedPrompts = [
    "Explain the difference between present perfect and past simple tense",
    "Help me with pronunciation of difficult English sounds",
    "What are the key grammar rules for B2 level writing?",
    "Give me tips for improving my listening comprehension",
    "How can I expand my vocabulary effectively?",
  ];

  const handleAskQuestion = async (customQuestion?: string) => {
    const questionToAsk = customQuestion || question;
    if (!questionToAsk.trim()) return;

    resetStream();
    await streamResponse(questionToAsk);

    // After streaming is complete, save the session
    if (streamedContent) {
      const newSession: TutorSession = {
        id: Date.now().toString(),
        question: questionToAsk,
        response: streamedContent,
        timestamp: new Date(),
      };
      setSessions((prev) => [newSession, ...prev]);
    }

    if (!customQuestion) {
      setQuestion("");
    }
  };

  const handlePredefinedPrompt = (prompt: string) => {
    handleAskQuestion(prompt);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Language Tutor</CardTitle>
          <CardDescription>
            Get personalized help with language learning. Ask questions about
            grammar, vocabulary, pronunciation, and more.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="question">Ask your question:</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="question"
                placeholder="e.g., How do I use conditional sentences?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !isStreaming && handleAskQuestion()
                }
                disabled={isStreaming}
              />
              <Button
                onClick={() => handleAskQuestion()}
                disabled={isStreaming || !question.trim()}
              >
                {isStreaming ? <Spinner className="h-4 w-4" /> : "Ask"}
              </Button>
            </div>
          </div>

          <div>
            <Label>Quick questions:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {predefinedPrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePredefinedPrompt(prompt)}
                  disabled={isStreaming}
                  className="text-xs"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Streaming Response */}
      {(isStreaming || streamedContent) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              AI Tutor Response
              {isStreaming && <Spinner className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {streamedContent}
                {isStreaming && <span className="animate-pulse">▊</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Previous Sessions */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Previous Sessions</h3>
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-medium">
                    Q: {session.question}
                  </CardTitle>
                  <span className="text-xs text-gray-500">
                    {session.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {session.response}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
