"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Circle,
  Flag,
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/services/exam-data.service';

interface ExamNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredIndexes: number[];
  flaggedQuestionIds: string[];
  questions: Question[];
  onNavigate: (questionNumber: number) => void;
}

export function ExamNavigation({
  currentQuestion,
  totalQuestions,
  answeredIndexes,
  flaggedQuestionIds,
  questions,
  onNavigate
}: ExamNavigationProps) {
  const getQuestionStatus = (questionIndex: number) => {
    const question = questions[questionIndex];
    const questionId = question?.id;
    const isAnswered = answeredIndexes.includes(questionIndex);
    const isCurrent = questionIndex === currentQuestion;
    const isFlagged = questionId ? flaggedQuestionIds.includes(questionId) : false;

    return {
      isAnswered,
      isCurrent,
      isFlagged,
    };
  };

  const getQuestionButtonClass = (questionIndex: number) => {
    const { isAnswered, isCurrent } = getQuestionStatus(questionIndex);

    const baseClass = "relative w-10 h-10 rounded-lg transition-all duration-200 flex items-center justify-center text-sm font-medium";

    if (isCurrent) {
      return cn(baseClass, "bg-blue-600 text-white ring-2 ring-blue-300 shadow-lg");
    }

    if (isAnswered) {
      return cn(baseClass, "bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700");
    }

    return cn(baseClass, "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600");
  };

  const answeredCount = answeredIndexes.length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = flaggedQuestionIds.length;

  return (
    <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Navegación
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Respondidas</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400">
              {answeredCount}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sin responder</span>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300">
              {unansweredCount}
            </Badge>
          </div>
          {flaggedCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Marcadas</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
                {flaggedCount}
              </Badge>
            </div>
          )}
        </div>

        {/* Question Grid */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Preguntas
          </h4>

          <div className="h-64 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2 pr-2">
              {Array.from({ length: totalQuestions }, (_, index) => {
                const { isAnswered, isFlagged } = getQuestionStatus(index);

                return (
                  <div key={index} className="relative">
                    <Button
                      variant="ghost"
                      className={getQuestionButtonClass(index)}
                      onClick={() => onNavigate(index)}
                    >
                      {index + 1}
                      {isAnswered && (
                        <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-green-600 bg-white rounded-full" />
                      )}
                    </Button>
                    {isFlagged && (
                      <Flag className="absolute -top-1 -left-1 w-3 h-3 text-yellow-600 fill-current" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Leyenda
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded"></div>
              <span className="text-gray-600 dark:text-gray-400">Pregunta actual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded dark:bg-green-900/20 dark:border-green-700"></div>
              <span className="text-gray-600 dark:text-gray-400">Respondida</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"></div>
              <span className="text-gray-600 dark:text-gray-400">Sin responder</span>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-yellow-600 fill-current" />
              <span className="text-gray-600 dark:text-gray-400">Marcada para revisar</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const firstUnanswered = Array.from({ length: totalQuestions }, (_, i) => i)
                  .find(index => !answeredIndexes.includes(index));
                if (firstUnanswered !== undefined) {
                  onNavigate(firstUnanswered);
                }
              }}
              disabled={unansweredCount === 0}
            >
            <Circle className="w-4 h-4 mr-2" />
            Ir a sin responder
          </Button>

          {flaggedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                const firstFlaggedIndex = questions.findIndex(question => flaggedQuestionIds.includes(question.id));
                if (firstFlaggedIndex !== -1) {
                  onNavigate(firstFlaggedIndex);
                }
              }}
            >
              <Flag className="w-4 h-4 mr-2" />
              Ir a marcadas
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
