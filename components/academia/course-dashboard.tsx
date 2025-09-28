"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useCourseContext } from "@/components/academia/course-context-provider";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressAnalytics } from "@/components/academia/progress-analytics";
import AITutor from "@/components/academia/ai-tutor";
import { Achievements } from "@/components/academia/achievements";
import { IntegratedExamSection } from "@/components/academia/integrated-exam-section";
import { cn } from "@/lib/utils";
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import {
  ExamSession,
  UserProgress,
  ComponentAnalysis,
} from "@/lib/exam-engine/types";
import {
  Trophy,
  BookOpen,
  Sparkles,
  Target,
  Award,
  TrendingUp,
  Users,
  Play,
  BarChart3,
  ArrowRight,
  Search,
  Calendar,
  Bell,
  Settings,
  MessageSquare,
  FileText,
  Home,
  GraduationCap,
  Brain,
  Star,
  Clock,
  CheckCircle,
  Circle,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DashboardOverviewProps {
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

const DashboardOverview = memo(function DashboardOverview({
  courseData,
  progressData,
  achievements,
  availableExams,
  user,
  language,
  level,
}: DashboardOverviewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useEnhancedTheme();
  const { selectedProvider, setSelectedProvider } = useCourseContext();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("week");
  const [mounted, setMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme helper to avoid hydration mismatches
  const isDark = mounted ? resolvedTheme === "dark" : false;

  // Helper function to check if a route is active
  const isActiveRoute = (route: string) => {
    const basePath = `/dashboard/${language}/${level}`;
    if (route === basePath) {
      // Dashboard is active only on exact match
      return pathname === basePath;
    }
    // Other routes are active if pathname starts with the route
    return pathname.startsWith(route);
  };

  // Elegant tooltip component
  const TooltipWrapper = ({ children, tooltip }: { children: React.ReactNode; tooltip: string }) => (
    <div className="relative group">
      {children}
      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
        <div className="relative">
          <div className={`px-3 py-2 text-sm font-medium rounded-lg shadow-lg whitespace-nowrap ${
            isDark
              ? "bg-slate-700 text-white border border-slate-600"
              : "bg-white text-slate-900 border border-slate-200 shadow-xl"
          }`}>
            {tooltip}
          </div>
          <div className={`absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent ${
            isDark
              ? "border-r-slate-700"
              : "border-r-white"
          }`}></div>
        </div>
      </div>
    </div>
  );

  // Course-specific data
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

  const getLevelDisplayName = (lvl: string): string => {
    return lvl.toUpperCase();
  };

  const getLanguageFlag = (lang: string): string => {
    const flagMap: Record<string, string> = {
      valenciano: "🏴󠁥󠁳󠁣󠁴󠁿",
      english: "🇬🇧",
      frances: "🇫🇷",
      aleman: "🇩🇪",
      italiano: "🇮🇹",
      portugues: "🇵🇹",
    };
    return flagMap[lang] || "🌍";
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
      id: 2,
      name: "Exámenes",
      description: `Tests de ${getLevelDisplayName(level)}`,
      progress:
        Math.round((courseData.completedExams / courseData.totalExams) * 100) ||
        0,
      color: "bg-red-500",
      icon: "📊",
      total: courseData.totalExams,
      completed: courseData.completedExams,
      route: `/dashboard/${language}/${level}/examens`,
      category: "Evaluación",
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
      name: "Juegos",
      description: "Aprende jugando con IA",
      progress: 65,
      color: "bg-orange-500",
      icon: "🎮",
      total: 12,
      completed: 8,
      route: `/dashboard/${language}/${level}/juegos`,
      category: "Entretenimiento",
    },
    {
      id: 5,
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

  const learningStats = [
    {
      title: "Exámenes Completados",
      value: courseData.completedExams.toString(),
      icon: "🎓",
      color: "text-blue-600",
    },
    {
      title: "Puntuación Promedio",
      value: `${Math.round(courseData.averageScore)}%`,
      icon: "⭐",
      color: "text-yellow-600",
    },
    {
      title: "Tareas Pendientes",
      value: (courseData.totalExams - courseData.completedExams).toString(),
      icon: "📚",
      color: "text-green-600",
    },
    {
      title: "Horas de Estudio",
      value: courseData.timeSpent.toString(),
      icon: "⏱️",
      color: "text-purple-600",
    },
  ];

  const activityData = [
    { day: "Lun", value: 8 },
    { day: "Mar", value: 12 },
    { day: "Mié", value: 6 },
    { day: "Jue", value: 15 },
    { day: "Vie", value: 10 },
    { day: "Sáb", value: 4 },
    { day: "Dom", value: 7 },
  ];

  const handleStartExam = useCallback(
    (examId: string) => {
      setIsLoading(true);
      router.push(`/dashboard/exam/${examId}`);
    },
    [router]
  );

  const handleViewCourse = useCallback(
    (courseId: string) => {
      router.push(`/dashboard/course/${courseId}`);
    },
    [router]
  );

  return (
    <div
      className={`min-h-screen flex ${
        isDark ? "bg-slate-900" : "bg-slate-50"
      }`}
    >
      {/* Left Sidebar - Navigation */}
      <aside
        className={`${
          isSidebarCollapsed ? "w-16" : "w-64"
        } min-h-screen ${
          isSidebarCollapsed ? "px-3 py-6" : "p-6"
        } transition-all duration-300 ease-in-out ${
          isDark
            ? "bg-slate-800 border-r border-slate-700"
            : "bg-white border-r border-slate-200"
        }`}
      >
        {/* Logo and Toggle */}
        <div className="mb-8">
          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark
                    ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                    : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
                title="Expandir menú"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`text-xl font-bold transition-opacity duration-300 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  NeoLingus
                </span>
              </div>
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDark
                    ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                    : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                }`}
                title="Contraer menú"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`space-y-${isSidebarCollapsed ? "3" : "2"}`}>
          {isSidebarCollapsed ? (
            <TooltipWrapper tooltip="Dashboard">
              <Link
                href={`/dashboard/${language}/${level}`}
                className={`flex items-center justify-center w-10 h-10 rounded-xl mx-auto ${
                  isActiveRoute(`/dashboard/${language}/${level}`)
                    ? isDark
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-600"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                } transition-all duration-300 hover:scale-105`}
              >
                <Home className="w-5 h-5" />
              </Link>
            </TooltipWrapper>
          ) : (
            <Link
              href={`/dashboard/${language}/${level}`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActiveRoute(`/dashboard/${language}/${level}`)
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } transition-all duration-300`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
              {isActiveRoute(`/dashboard/${language}/${level}`) && (
                <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
              )}
            </Link>
          )}

          {isSidebarCollapsed ? (
            <TooltipWrapper tooltip="Exámenes">
              <Link
                href={`/dashboard/${language}/${level}/examens`}
                className={`flex items-center justify-center w-10 h-10 rounded-xl mx-auto ${
                  isActiveRoute(`/dashboard/${language}/${level}/examens`)
                    ? isDark
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-600"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                } transition-all duration-300 hover:scale-105`}
              >
                <GraduationCap className="w-5 h-5" />
              </Link>
            </TooltipWrapper>
          ) : (
            <Link
              href={`/dashboard/${language}/${level}/examens`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActiveRoute(`/dashboard/${language}/${level}/examens`)
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } transition-all duration-300`}
            >
              <GraduationCap className="w-5 h-5" />
              <span className="font-medium">Exámenes</span>
              {isActiveRoute(`/dashboard/${language}/${level}/examens`) && (
                <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
              )}
            </Link>
          )}

          {isSidebarCollapsed ? (
            <TooltipWrapper tooltip="Tareas">
              <Link
                href={`/dashboard/${language}/${level}/tareas`}
                className={`flex items-center justify-center w-10 h-10 rounded-xl mx-auto ${
                  isActiveRoute(`/dashboard/${language}/${level}/tareas`)
                    ? isDark
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-600"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                } transition-all duration-300 hover:scale-105`}
              >
                <FileText className="w-5 h-5" />
              </Link>
            </TooltipWrapper>
          ) : (
            <Link
              href={`/dashboard/${language}/${level}/tareas`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActiveRoute(`/dashboard/${language}/${level}/tareas`)
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } transition-all duration-300`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Tareas</span>
              {isActiveRoute(`/dashboard/${language}/${level}/tareas`) && (
                <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
              )}
            </Link>
          )}

          {isSidebarCollapsed ? (
            <TooltipWrapper tooltip="Práctica">
              <Link
                href={`/dashboard/${language}/${level}/practica`}
                className={`flex items-center justify-center w-10 h-10 rounded-xl mx-auto ${
                  isActiveRoute(`/dashboard/${language}/${level}/practica`)
                    ? isDark
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-600"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                } transition-all duration-300 hover:scale-105`}
              >
                <Target className="w-5 h-5" />
              </Link>
            </TooltipWrapper>
          ) : (
            <Link
              href={`/dashboard/${language}/${level}/practica`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActiveRoute(`/dashboard/${language}/${level}/practica`)
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } transition-all duration-300`}
            >
              <Target className="w-5 h-5" />
              <span className="font-medium">Práctica</span>
              {isActiveRoute(`/dashboard/${language}/${level}/practica`) && (
                <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
              )}
            </Link>
          )}

          {isSidebarCollapsed ? (
            <TooltipWrapper tooltip="Estadísticas">
              <Link
                href={`/dashboard/${language}/${level}/estadisticas`}
                className={`flex items-center justify-center w-10 h-10 rounded-xl mx-auto ${
                  isActiveRoute(`/dashboard/${language}/${level}/estadisticas`)
                    ? isDark
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-600"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                } transition-all duration-300 hover:scale-105`}
              >
                <BarChart3 className="w-5 h-5" />
              </Link>
            </TooltipWrapper>
          ) : (
            <Link
              href={`/dashboard/${language}/${level}/estadisticas`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                isActiveRoute(`/dashboard/${language}/${level}/estadisticas`)
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                    ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } transition-all duration-300`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Estadísticas</span>
              {isActiveRoute(`/dashboard/${language}/${level}/estadisticas`) && (
                <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
              )}
            </Link>
          )}
        </nav>

        {/* Upgrade Section */}
        {!isSidebarCollapsed && (
          <div
            className={`mt-8 p-4 rounded-xl ${
              isDark
                ? "bg-gradient-to-br from-blue-600 to-purple-600"
                : "bg-gradient-to-br from-blue-500 to-purple-500"
            }`}
          >
            <h3 className="text-white font-bold mb-2">Upgrade your plan</h3>
            <p className="text-white/80 text-sm mb-3">
              Unlock premium features and advanced courses
            </p>
            <Button className="bg-white text-blue-600 hover:bg-blue-50 transition-colors w-full">
              Go to PRO
            </Button>
          </div>
        )}

        {/* Collapsed upgrade button */}
        {isSidebarCollapsed && (
          <div className="mt-8">
            <TooltipWrapper tooltip="Upgrade to PRO">
              <Button
                className="w-10 h-10 mx-auto p-0 bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 rounded-xl hover:scale-105 transition-all duration-300"
              >
                <Star className="w-5 h-5" />
              </Button>
            </TooltipWrapper>
          </div>
        )}

        {/* Illustration */}
        {!isSidebarCollapsed && (
          <div className="mt-8 text-center">
            <div className="text-6xl">🧘‍♀️</div>
            <p
              className={`text-sm mt-2 ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Stay focused and learn
            </p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-6">
            <div
              className={`px-4 py-2 rounded-lg ${
                isDark ? "bg-slate-700" : "bg-slate-100"
              }`}
            >
              <span
                className={`text-sm ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Progreso:{" "}
                {Math.round(
                  (courseData.completedExams / courseData.totalExams) * 100
                )}
                %
              </span>
            </div>
            <div
              className={`px-4 py-2 rounded-lg ${
                isDark ? "bg-slate-700" : "bg-slate-100"
              }`}
            >
              <span
                className={`text-sm ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Puntuación: {Math.round(courseData.averageScore)}%
              </span>
            </div>
            <div
              className={`px-4 py-2 rounded-lg ${
                isDark ? "bg-slate-700" : "bg-slate-100"
              }`}
            >
              <span
                className={`text-sm ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Proveedor: {courseData.providerName}
              </span>
            </div>
          </div>
        </div>

        {/* Learning Sections */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
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
          <div className="mb-6">
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

          {/* Learning Sections Grid - Updated to show 4 cards, removing Exámenes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {learningSections.filter(section => section.name !== "Exámenes").map((section) => (
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
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
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
      </main>

      {/* Right Sidebar - Statistics and Activity */}
      <aside
        className={`w-80 p-6 ${
          isDark
            ? "bg-slate-800 border-l border-slate-700"
            : "bg-white border-l border-slate-200"
        }`}
      >
        {/* User Profile */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user?.user_metadata?.full_name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1">
            <h3
              className={`font-bold ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              {user?.user_metadata?.full_name || "User"}
            </h3>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {user?.user_metadata?.subscription_type || "Basic Plan"}
            </p>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <Bell className="w-5 h-5" />
          </button>
        </div>

        {/* Exit Course Button */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className={`w-full flex items-center gap-2 ${
              isDark
                ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Salir del Curso</span>
          </Button>
        </div>

        {/* Statistics Section */}
        <div className="mb-8">
          <h3
            className={`text-xl font-bold mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Estadísticas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {learningStats.map((stat, index) => (
              <motion.div
                key={index}
                className={`p-4 rounded-xl text-center ${
                  isDark ? "bg-slate-700" : "bg-slate-100"
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div
                  className={`text-xs ${
                    isDark
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  {stat.title}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activity Section */}
        <div>
          <h3
            className={`text-xl font-bold mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Actividad
          </h3>

          {/* Time Period Selector */}
          <div className="flex gap-2 mb-4">
            {[
              { key: "day", label: "Día" },
              { key: "week", label: "Semana" },
              { key: "month", label: "Mes" },
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedTimePeriod(period.key)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  selectedTimePeriod === period.key
                    ? "bg-blue-600 text-white"
                    : isDark
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Activity Chart */}
          <div
            className={`p-4 rounded-xl ${
              isDark ? "bg-slate-700" : "bg-slate-100"
            }`}
          >
            <div className="flex items-end justify-between h-32 gap-1">
              {activityData.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-6 rounded-t transition-all duration-300 ${
                      isDark ? "bg-blue-400" : "bg-blue-500"
                    }`}
                    style={{ height: `${(item.value / 15) * 100}%` }}
                  ></div>
                  <span
                    className={`text-xs ${
                      isDark
                        ? "text-slate-400"
                        : "text-slate-600"
                    }`}
                  >
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
});

export default DashboardOverview;
