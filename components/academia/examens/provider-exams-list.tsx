"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Play, BookOpen, Award, Users, Calendar } from 'lucide-react';
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import { motion } from "framer-motion";

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  total_questions: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  exam_type: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

interface Provider {
  id: string;
  name: string;
  description: string;
  official?: boolean;
  website?: string | null;
  logo_url?: string | null;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  time_spent: number;
  status: "in_progress" | "completed" | "abandoned";
}

interface ProviderExamsListProps {
  exams: Exam[];
  provider: Provider;
  examAttempts: ExamAttempt[];
  courseId: string;
}

export function ProviderExamsList({
  exams,
  provider,
  examAttempts,
  courseId
}: ProviderExamsListProps) {
  const { resolvedTheme } = useEnhancedTheme();
  const isDark = resolvedTheme === "dark";

  const [language, level] = courseId.split('_');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "Principiante";
      case "intermediate": return "Intermedio";
      case "advanced": return "Avanzado";
      default: return difficulty;
    }
  };

  if (exams.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
          <FileText className="w-12 h-12 text-slate-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
          No hay exámenes disponibles
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Actualmente no hay exámenes disponibles para {provider.name} en este nivel.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {exams.map((exam, index) => {
        const attempts = examAttempts.filter(attempt => attempt.exam_id === exam.id);
        const lastAttempt = attempts[0];
        const bestScore = attempts.reduce((best, attempt) => {
          const score = attempt.score || 0;
          return Math.max(best, score);
        }, 0);

        return (
          <motion.div
            key={exam.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              isDark
                ? "bg-slate-800 border-slate-700 hover:bg-slate-750"
                : "bg-white hover:shadow-xl"
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className={`text-lg mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                      {exam.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getDifficultyColor(exam.difficulty)}>
                        {getDifficultyLabel(exam.difficulty)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {exam.exam_type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {exam.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                {/* Exam Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{exam.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <FileText className="w-4 h-4" />
                    <span>{exam.total_questions} preguntas</span>
                  </div>
                </div>

                {/* User Performance (only show if has attempts) */}
                {attempts.length > 0 && (
                  <div className={`p-3 rounded-lg ${isDark ? "bg-slate-700" : "bg-slate-50"}`}>
                    <h4 className="text-sm font-medium mb-2">Tu progreso</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Intentos:</span>
                        <span className="font-medium ml-2">{attempts.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Mejor:</span>
                        <span className="font-medium ml-2">{bestScore}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button - Fixed routing to exam simulator */}
                <Link href={`/dashboard/${language}/${level}/examens/${provider.id}/examen/${exam.id}/simulador`}>
                  <Button className="w-full">
                    <Play className="w-4 h-4 mr-2" />
                    {attempts.length > 0 ? 'Continuar Examen' : 'Comenzar Simulador'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}