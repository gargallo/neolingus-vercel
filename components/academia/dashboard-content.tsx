"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import {
  Search,
  Calendar,
  CheckCircle,
  Circle,
  Target,
  BarChart3,
  FileText,
} from "lucide-react";

interface DashboardContentProps {
  courseData: {
    title: string;
    description: string;
    provider: string;
    providerName: string;
    totalExams: number;
    completedExams: number;
    averageScore: number;
    timeSpent: number;
    lastActivity: Date | null;
  };
  progressData: any;
  achievements: any[];
  availableExams: any[];
  user: any;
  language: string;
  level: string;
}

export function DashboardContent({
  courseData,
  progressData,
  achievements,
  availableExams,
  user,
  language,
  level,
}: DashboardContentProps) {
  const router = useRouter();
  const { resolvedTheme } = useEnhancedTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme helper to avoid hydration mismatches
  const isDark = mounted ? resolvedTheme === "dark" : false;

  // Course-specific data
  const getLanguageDisplayName = (lang: string): string => {
    const languageMap: Record<string, string> = {
      english: "English",
      valenciano: "Valencià",
      spanish: "Español",
      franceses: "Français",
      frances: "Français",
      french: "Français",
      aleman: "Deutsch",
      german: "Deutsch",
      italiano: "Italiano",
      italian: "Italiano",
      portugues: "Português",
      portuguese: "Português",
    };
    return languageMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const getLevelDisplayName = (lvl: string): string => {
    return lvl.toUpperCase();
  };



  // Course-specific learning sections
  const learningSections = [
    {
      id: 1,
      name: "Tareas",
      description: `Ejercicios de ${getLanguageDisplayName(language)}`,
      progress:
        Math.round((courseData.completedExams / courseData.totalExams) * 100) ||
        0,
      color: "bg-blue-500",
      icon: "📝",
      total: courseData.totalExams,
      completed: courseData.completedExams,
      route: `/dashboard/${language}/${level}/tareas`,
      category: "Práctica",
    },
    {
      id: 3,
      name: "Práctica",
      description: "Ejercicios interactivos",
      progress:
        Math.round((courseData.completedExams / courseData.totalExams) * 100) ||
        0,
      color: "bg-green-500",
      icon: "🎯",
      total: courseData.totalExams,
      completed: courseData.completedExams,
      route: `/dashboard/${language}/${level}/practica`,
      category: "Aprendizaje",
    },
    {
      id: 4,
      name: "Estadísticas",
      description: "Progreso y métricas",
      progress: 100,
      color: "bg-purple-500",
      icon: "📈",
      total: 1,
      completed: 1,
      route: `/dashboard/${language}/${level}/estadisticas`,
      category: "Análisis",
    },
  ];

  const scheduledTasks = [
    {
      id: 1,
      title: `Vocabulario ${getLanguageDisplayName(language)}`,
      time: "09:00",
      icon: "📚",
      completed: false,
      type: "Práctica",
    },
    {
      id: 2,
      title: `Examen ${getLevelDisplayName(level)}`,
      time: "10:30",
      icon: "📊",
      completed: courseData.completedExams > 0,
      type: "Evaluación",
    },
    {
      id: 3,
      title: "Conversación con IA",
      time: "14:00",
      icon: "🤖",
      completed: false,
      type: "Interactivo",
    },
    {
      id: 4,
      title: `Gramática ${getLevelDisplayName(level)}`,
      time: "16:00",
      icon: "📝",
      completed: false,
      type: "Teoría",
    },
  ];

  return (
    <div className="px-2 pt-4 pb-4">
      <div className="mb-4 space-y-3">
    <p
      className={`text-sm md:text-base ${
        isDark ? "text-slate-300" : "text-slate-600"
      }`}
    >
      {courseData.description}
    </p>
    <div className="flex flex-wrap items-center gap-4 md:gap-6">
      <div
        className={`rounded-lg px-4 py-2 shadow-sm ${
          isDark ? "bg-slate-800/80 border border-slate-700" : "bg-white/90 border border-slate-200"
        }`}
      >
        <span
          className={`text-sm font-medium ${
            isDark ? "text-slate-100" : "text-slate-700"
          }`}
        >
          Progreso {Math.round(
            (courseData.completedExams / courseData.totalExams) * 100
          )}%
        </span>
      </div>
      <div
        className={`rounded-lg px-4 py-2 shadow-sm ${
          isDark ? "bg-slate-800/80 border border-slate-700" : "bg-white/90 border border-slate-200"
        }`}
      >
        <span
          className={`text-sm font-medium ${
            isDark ? "text-slate-100" : "text-slate-700"
          }`}
        >
          Tiempo invertido {Math.round(courseData.timeSpent)}h
        </span>
      </div>
      <div
        className={`rounded-lg px-4 py-2 shadow-sm ${
          isDark ? "bg-slate-800/80 border border-slate-700" : "bg-white/90 border border-slate-200"
        }`}
      >
        <span
          className={`text-sm font-medium ${
            isDark ? "text-slate-100" : "text-slate-700"
          }`}
        >
          Puntuación media {Math.round(courseData.averageScore)}%
        </span>
      </div>
      <div
        className={`rounded-lg px-4 py-2 shadow-sm ${
          isDark ? "bg-slate-800/80 border border-slate-700" : "bg-white/90 border border-slate-200"
        }`}
      >
        <span
          className={`text-sm font-medium ${
            isDark ? "text-slate-100" : "text-slate-700"
          }`}
        >
          Certificación {courseData.providerName}
        </span>
      </div>
    </div>
  </div>

      {/* Learning Sections */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2
            className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Secciones de Aprendizaje
          </h2>
          <Link
            href="/dashboard/sections"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver Todas
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="search"
              placeholder="Buscar secciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-3 pl-10 rounded-xl border ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                  : "bg-white border-slate-300 text-slate-900 placeholder-slate-500"
              }`}
            />
          </div>
        </div>

        {/* Learning Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {learningSections.map((section) => (
            <motion.div
              key={section.id}
              className={`${section.color} rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(section.route)}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{section.icon}</div>
                  <div className="text-right">
                    <div className="text-sm opacity-80">
                      {section.category}
                    </div>
                    <div className="text-xs opacity-60">
                      {section.completed}/{section.total} completados
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-2">{section.name}</h3>
                <p className="text-sm opacity-80 mb-4">
                  {section.description}
                </p>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Progreso</span>
                    <span>{section.progress}%</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${section.progress}%` }}
                    ></div>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 w-full"
                >
                  {section.name === "Estadísticas"
                    ? "Ver Análisis"
                    : "Continuar"}
                </Button>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Planning Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2
            className={`text-2xl font-bold ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Planning
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <span
                className={`text-sm ${
                  isDark
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <Link
              href="/dashboard/planning"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Planning Tasks List */}
        <div
          className={`rounded-2xl p-6 ${
            isDark
              ? "bg-slate-800 border border-slate-700"
              : "bg-white border border-slate-200"
          }`}
        >
          <div className="space-y-4">
            {scheduledTasks.map((task) => (
              <motion.div
                key={task.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                whileHover={{ x: 4 }}
              >
                <div className="text-2xl">{task.icon}</div>
                <div className="flex-1">
                  <h4
                    className={`font-medium ${
                      isDark
                        ? "text-white"
                        : "text-slate-900"
                    }`}
                  >
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        isDark
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                    >
                      {task.time}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {task.type}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {task.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                  <button className="text-slate-400 hover:text-slate-600">
                    <span className="text-lg">⋮</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
