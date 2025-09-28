"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import {
  Play,
  Clock,
  CheckCircle,
  BarChart3,
  Trophy,
  BookOpen,
  Target,
} from "lucide-react";

interface ExamData {
  examId: string;
  title: string;
  providerSlug: string;
  providerName: string;
  duration: number;
  difficulty: string;
}

interface IntegratedExamSectionProps {
  availableExams: ExamData[];
  courseData: {
    title: string;
    totalExams: number;
    completedExams: number;
    averageScore: number;
  };
  language: string;
  level: string;
}

export function IntegratedExamSection({
  availableExams,
  courseData,
  language,
  level,
}: IntegratedExamSectionProps) {
  const { resolvedTheme } = useEnhancedTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("available");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === "dark" : false;

  // Mock data for demonstration
  const examStats = {
    available: availableExams.length,
    inProgress: 0,
    completed: courseData.completedExams,
    averageScore: Math.round(courseData.averageScore),
  };

  const handleStartExam = (examId: string, providerSlug: string) => {
    // Navigate to exam simulator
    window.location.href = `/dashboard/${language}/${level}/examens/${providerSlug}/${examId}/simulador`;
  };

  const getLanguageDisplayName = (lang: string): string => {
    const languageMap: Record<string, string> = {
      valenciano: "Valenciano",
      english: "English",
      frances: "Francés",
      aleman: "Alemán",
      italiano: "Italiano",
      portugues: "Portugués",
    };
    return languageMap[lang] || lang;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
      case "fácil":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
      case "medio":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard":
      case "difícil":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    }
  };

  if (!mounted) {
    return (
      <div className="mb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="examens" className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2
          className={`text-2xl font-bold ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        >
          Simuladors d'Examen
        </h2>
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            {examStats.available} Disponibles
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            {examStats.completed} Completados
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <motion.div
          className={`p-4 rounded-xl ${
            isDark
              ? "bg-slate-800 border border-slate-700"
              : "bg-white border border-slate-200"
          }`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {examStats.available}
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Disponibles
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={`p-4 rounded-xl ${
            isDark
              ? "bg-slate-800 border border-slate-700"
              : "bg-white border border-slate-200"
          }`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {examStats.inProgress}
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                En Progreso
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={`p-4 rounded-xl ${
            isDark
              ? "bg-slate-800 border border-slate-700"
              : "bg-white border border-slate-200"
          }`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {examStats.completed}
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Completados
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className={`p-4 rounded-xl ${
            isDark
              ? "bg-slate-800 border border-slate-700"
              : "bg-white border border-slate-200"
          }`}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p
                className={`text-2xl font-bold ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {examStats.averageScore}%
              </p>
              <p
                className={`text-sm ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Puntuación Media
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Exam Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableExams.map((exam) => (
          <motion.div
            key={exam.examId}
            className={`p-6 rounded-xl border ${
              isDark
                ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                : "bg-white border-slate-200 hover:border-slate-300"
            } transition-all duration-200`}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3
                  className={`text-lg font-semibold mb-2 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {exam.title}
                </h3>
                <p
                  className={`text-sm ${
                    isDark ? "text-slate-400" : "text-slate-600"
                  }`}
                >
                  {exam.providerName}
                </p>
              </div>
              <Badge className={getDifficultyColor(exam.difficulty)}>
                {exam.difficulty || "Estándar"}
              </Badge>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span
                  className={`text-sm ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {exam.duration || 60} minutos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-400" />
                <span
                  className={`text-sm ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {getLanguageDisplayName(language)} {level.toUpperCase()}
                </span>
              </div>
            </div>

            <Button
              onClick={() => handleStartExam(exam.examId, exam.providerSlug)}
              className="w-full flex items-center justify-center gap-2"
              size="sm"
            >
              <Play className="w-4 h-4" />
              Iniciar Examen
            </Button>
          </motion.div>
        ))}
      </div>

      {availableExams.length === 0 && (
        <div
          className={`text-center py-12 rounded-xl ${
            isDark
              ? "bg-slate-800 border border-slate-700"
              : "bg-white border border-slate-200"
          }`}
        >
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h3
            className={`text-lg font-semibold mb-2 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            No hay exámenes disponibles
          </h3>
          <p
            className={`text-sm ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Los exámenes para este curso estarán disponibles pronto.
          </p>
        </div>
      )}
    </div>
  );
}