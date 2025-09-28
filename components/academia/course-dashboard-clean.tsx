"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useCourseContext } from "@/components/academia/course-context-provider";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressAnalytics } from "@/components/academia/progress-analytics";
import AITutor from "@/components/academia/ai-tutor";
import { Achievements } from "@/components/academia/achievements";
import DashboardStats from "@/components/academia/dashboard-stats";
import ActivityTimeline from "@/components/academia/activity-timeline";
import QuickActions from "@/components/academia/quick-actions";
import {
  transformStats,
  transformActivities,
  generateQuickActions,
} from "@/components/academia/utils/dashboard-transforms";
import {
  usePerformanceMonitor,
  useDashboardPerformance,
} from "@/lib/hooks/usePerformanceMonitor";
import { warmDashboardCache } from "@/lib/utils/dashboard-cache";
import { FullDashboardSkeleton } from "@/components/academia/skeleton-components";
import { usePerformanceDashboard } from "@/components/academia/performance-dashboard";
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
} from "lucide-react";
import "../../styles/dashboard-layouts.css";

// Types for dashboard data
interface CourseData {
  id: string;
  language: string;
  level: string;
  title: string;
  description: string;
  provider: string;
  providerName: string;
  totalExams: number;
  completedExams: number;
  averageScore: number;
  timeSpent: number;
  lastActivity: Date | null;
}

interface ProgressData {
  overallProgress: number;
  recentActivity: Array<{
    id: string;
    type: string;
    examTitle: string;
    score: number;
    duration: number;
    date: Date;
  }>;
  weeklyStats: {
    sessionsCompleted: number;
    hoursStudied: number;
    averageScore: number;
    improvement: number;
  };
}

interface DashboardOverviewProps {
  courseData: CourseData;
  progressData: ProgressData | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

const DashboardOverview = memo<DashboardOverviewProps>(
  ({
    courseData,
    progressData,
    isLoading = false,
    error = null,
    onRefresh,
  }: DashboardOverviewProps) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const router = useRouter();
    const { resolvedTheme } = useEnhancedTheme();

    // Debug logs
    console.log("🎨 Dashboard Theme Debug:", {
      resolvedTheme,
      timestamp: new Date().toISOString(),
      component: "DashboardOverview",
      window: typeof window !== "undefined" ? "available" : "unavailable",
      document: typeof document !== "undefined" ? "available" : "unavailable",
    });

    // Force re-render on theme change
    useEffect(() => {
      console.log("🔄 Theme changed to:", resolvedTheme);
    }, [resolvedTheme]);

    useEffect(() => {
      const checkScreenSize = () => {
        const width = window.innerWidth;
        setIsMobile(width < 640); // sm breakpoint
        setIsTablet(width >= 640 && width < 1024); // md breakpoint
      };

      checkScreenSize();
      window.addEventListener("resize", checkScreenSize);
      return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // Dashboard stats based on Figma design
    const dashboardStats = useMemo(
      () => [
        {
          id: "courses-completed",
          label: "Courses Completed",
          value: "02",
          description: "Total completed",
          change: "+2 this month",
          icon: <Trophy className="w-6 h-6 text-blue-600" />,
          iconBg: "bg-blue-100 dark:bg-blue-900",
        },
        {
          id: "total-points",
          label: "Total Points Gained",
          value: "250",
          description: "Points earned",
          change: "+50 this week",
          icon: <Award className="w-6 h-6 text-green-600" />,
          iconBg: "bg-green-100 dark:bg-green-900",
        },
        {
          id: "tasks-finished",
          label: "Tasks Finished",
          value: "05",
          description: "Tasks completed",
          change: "+3 today",
          icon: <Target className="w-6 h-6 text-orange-600" />,
          iconBg: "bg-orange-100 dark:bg-orange-900",
        },
        {
          id: "courses-in-progress",
          label: "Courses In Progress",
          value: "03",
          description: "Active courses",
          change: "2 new this week",
          icon: <BookOpen className="w-6 h-6 text-purple-600" />,
          iconBg: "bg-purple-100 dark:bg-purple-900",
        },
      ],
      []
    );

    if (isLoading) {
      return <FullDashboardSkeleton />;
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              Try Again
            </Button>
          )}
        </div>
      );
    }

    return (
      <div
        className={`min-h-screen flex ${
          resolvedTheme === "dark" ? "bg-slate-900" : "bg-slate-50"
        }`}
      >
        {/* Debug Banner - Muy visible */}
        <div
          className={`fixed top-0 left-0 right-0 z-50 p-2 text-center font-bold text-sm ${
            resolvedTheme === "dark"
              ? "bg-red-600 text-white"
              : "bg-green-600 text-white"
          }`}
        >
          🚨 DEBUG: Tema actual = {resolvedTheme} |{" "}
          {resolvedTheme === "dark"
            ? "MODO OSCURO ACTIVO"
            : "MODO CLARO ACTIVO"}{" "}
          🚨
        </div>

        {/* Sidebar Izquierdo - Estilo Figma */}
        <aside
          className={`w-64 min-h-screen p-6 ${
            resolvedTheme === "dark"
              ? "bg-slate-800 border-r border-slate-700"
              : "bg-white border-r border-slate-200"
          }`}
        >
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">🧠</span>
              </div>
              <span
                className={`text-xl font-bold ${
                  resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Lingua
              </span>
            </div>
          </div>

          {/* Navegación */}
          <nav className="space-y-2">
            <a
              href="#"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                resolvedTheme === "dark"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <span className="text-lg">🏠</span>
              <span className="font-medium">Overview</span>
              <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
            </a>
            <a
              href="#"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                resolvedTheme === "dark"
                  ? "text-slate-300 hover:bg-slate-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-lg">📚</span>
              <span>Course</span>
            </a>
            <a
              href="#"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                resolvedTheme === "dark"
                  ? "text-slate-300 hover:bg-slate-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-lg">📁</span>
              <span>Resources</span>
            </a>
            <a
              href="#"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                resolvedTheme === "dark"
                  ? "text-slate-300 hover:bg-slate-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-lg">💬</span>
              <span>Message</span>
            </a>
            <a
              href="#"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                resolvedTheme === "dark"
                  ? "text-slate-300 hover:bg-slate-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="text-lg">⚙️</span>
              <span>Setting</span>
            </a>
          </nav>

          {/* Upgrade Section */}
          <div
            className={`mt-8 p-4 rounded-xl ${
              resolvedTheme === "dark"
                ? "bg-gradient-to-br from-blue-600 to-purple-600"
                : "bg-gradient-to-br from-blue-500 to-purple-500"
            }`}
          >
            <h3 className="text-white font-bold mb-2">Upgrade your plan</h3>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Go to PRO
            </button>
          </div>

          {/* Ilustración */}
          <div className="mt-8 text-center">
            <div className="text-6xl">🧘‍♀️</div>
          </div>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 p-8">
          {/* Header Principal */}
          <div className="mb-8">
            <h1
              className={`text-3xl font-bold mb-2 ${
                resolvedTheme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              Hello Ethan, welcome back!
            </h1>
          </div>

          {/* My Courses Section - Estilo Figma */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-2xl font-bold ${
                  resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                My Courses
              </h2>
              <a
                href="#"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </a>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search..."
                  className={`w-full px-4 py-3 pl-10 rounded-xl border ${
                    resolvedTheme === "dark"
                      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                      : "bg-white border-slate-300 text-slate-900 placeholder-slate-500"
                  }`}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                  🔍
                </span>
              </div>
            </div>

            {/* Course Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* French Card */}
              <div className="bg-blue-500 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <h3 className="text-xl font-bold mb-2">French</h3>
                  <p className="text-blue-100 mb-4">35 lessons</p>
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">75%</span>
                    </div>
                    <div className="text-4xl">🗼</div>
                  </div>
                </div>
              </div>

              {/* Portuguese Card */}
              <div className="bg-orange-500 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <h3 className="text-xl font-bold mb-2">Portuguese</h3>
                  <p className="text-orange-100 mb-4">30 lessons</p>
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">50%</span>
                    </div>
                    <div className="text-4xl">🚋</div>
                  </div>
                </div>
              </div>

              {/* Italian Card */}
              <div className="bg-green-500 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <h3 className="text-xl font-bold mb-2">Italian</h3>
                  <p className="text-green-100 mb-4">20 lessons</p>
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">25%</span>
                    </div>
                    <div className="text-4xl">🗼</div>
                  </div>
                </div>
              </div>

              {/* German Card */}
              <div className="bg-yellow-500 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative">
                  <h3 className="text-xl font-bold mb-2">German</h3>
                  <p className="text-yellow-100 mb-4">40 lessons</p>
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">75%</span>
                    </div>
                    <div className="text-4xl">🏛️</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Planning Section - Estilo Figma */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2
                className={`text-2xl font-bold ${
                  resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Planning
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <span
                    className={`text-sm ${
                      resolvedTheme === "dark"
                        ? "text-slate-300"
                        : "text-slate-600"
                    }`}
                  >
                    19 June 2025
                  </span>
                </div>
                <a
                  href="#"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All
                </a>
              </div>
            </div>

            {/* Planning Tasks List */}
            <div
              className={`rounded-2xl p-6 ${
                resolvedTheme === "dark"
                  ? "bg-slate-800 border border-slate-700"
                  : "bg-white border border-slate-200"
              }`}
            >
              <div className="space-y-4">
                {/* Task 1 */}
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📖</span>
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-medium ${
                        resolvedTheme === "dark"
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      Reading - Beginner Topic 1
                    </h3>
                    <p
                      className={`text-sm ${
                        resolvedTheme === "dark"
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                    >
                      8:00 AM - 10:00 AM
                    </p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    ⋮
                  </button>
                </div>

                {/* Task 2 */}
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎧</span>
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-medium ${
                        resolvedTheme === "dark"
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      Listening - Intermediate Topic 1
                    </h3>
                    <p
                      className={`text-sm ${
                        resolvedTheme === "dark"
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                    >
                      03:00 PM - 04:00 PM
                    </p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    ⋮
                  </button>
                </div>

                {/* Task 3 */}
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🎤</span>
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-medium ${
                        resolvedTheme === "dark"
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      Speaking - Beginner Topic 1
                    </h3>
                    <p
                      className={`text-sm ${
                        resolvedTheme === "dark"
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                    >
                      8:00 AM - 12:00 PM
                    </p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    ⋮
                  </button>
                </div>

                {/* Task 4 */}
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <span className="text-lg">✏️</span>
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-medium ${
                        resolvedTheme === "dark"
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      Grammar - Intermediate Topic 2
                    </h3>
                    <p
                      className={`text-sm ${
                        resolvedTheme === "dark"
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                    >
                      8:00 AM - 12:00 PM
                    </p>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600">
                    ⋮
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar Derecho - Statistics y Activity */}
        <aside
          className={`w-80 p-6 ${
            resolvedTheme === "dark"
              ? "bg-slate-800 border-l border-slate-700"
              : "bg-white border-l border-slate-200"
          }`}
        >
          {/* User Profile */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">E</span>
            </div>
            <div className="flex-1">
              <h3
                className={`font-bold ${
                  resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Ethan Maxwell
              </h3>
              <p
                className={`text-sm ${
                  resolvedTheme === "dark" ? "text-slate-400" : "text-slate-600"
                }`}
              >
                Basic Plan
              </p>
            </div>
            <button className="text-slate-400 hover:text-slate-600">🔔</button>
          </div>

          {/* Statistics Section */}
          <div className="mb-8">
            <h3
              className={`text-xl font-bold mb-4 ${
                resolvedTheme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              Statistics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Courses Completed */}
              <div
                className={`p-4 rounded-xl text-center ${
                  resolvedTheme === "dark" ? "bg-slate-700" : "bg-slate-100"
                }`}
              >
                <div
                  className={`text-2xl font-bold ${
                    resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  02
                </div>
                <div
                  className={`text-sm ${
                    resolvedTheme === "dark"
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  Courses Completed
                </div>
              </div>

              {/* Total Points */}
              <div
                className={`p-4 rounded-xl text-center ${
                  resolvedTheme === "dark" ? "bg-slate-700" : "bg-slate-100"
                }`}
              >
                <div
                  className={`text-2xl font-bold ${
                    resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  250
                </div>
                <div
                  className={`text-sm ${
                    resolvedTheme === "dark"
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  Total Points Gained
                </div>
              </div>

              {/* Courses In Progress */}
              <div
                className={`p-4 rounded-xl text-center ${
                  resolvedTheme === "dark" ? "bg-slate-700" : "bg-slate-100"
                }`}
              >
                <div
                  className={`text-2xl font-bold ${
                    resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  03
                </div>
                <div
                  className={`text-sm ${
                    resolvedTheme === "dark"
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  Courses In Progress
                </div>
              </div>

              {/* Tasks Finished */}
              <div
                className={`p-4 rounded-xl text-center ${
                  resolvedTheme === "dark" ? "bg-slate-700" : "bg-slate-100"
                }`}
              >
                <div
                  className={`text-2xl font-bold ${
                    resolvedTheme === "dark" ? "text-white" : "text-slate-900"
                  }`}
                >
                  05
                </div>
                <div
                  className={`text-sm ${
                    resolvedTheme === "dark"
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  Tasks Finished
                </div>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          <div>
            <h3
              className={`text-xl font-bold mb-4 ${
                resolvedTheme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              Activity
            </h3>

            {/* Time Period Selector */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-3 py-1 rounded-lg text-sm ${
                  resolvedTheme === "dark"
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Day
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm bg-blue-600 text-white`}
              >
                Week
              </button>
              <button
                className={`px-3 py-1 rounded-lg text-sm ${
                  resolvedTheme === "dark"
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Month
              </button>
            </div>

            {/* Activity Chart */}
            <div
              className={`p-4 rounded-xl ${
                resolvedTheme === "dark" ? "bg-slate-700" : "bg-slate-100"
              }`}
            >
              <div className="flex items-end justify-between h-32 gap-1">
                {/* Monday */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 bg-blue-300 rounded-t h-8"></div>
                  <span
                    className={`text-xs ${
                      resolvedTheme === "dark"
                        ? "text-slate-400"
                        : "text-slate-600"
                    }`}
                  >
                    Mon
                  </span>
                </div>
                {/* Tuesday */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 bg-blue-300 rounded-t h-12"></div>
                  <span
                    className={`text-xs ${
                      resolvedTheme === "dark"
                        ? "text-slate-400"
                        : "text-slate-600"
                    }`}
                  >
                    Tue
                  </span>
                </div>
                {/* Wednesday */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 bg-blue-300 rounded-t h-16"></div>
                  <span
                    className={`text-xs ${
                      resolvedTheme === "dark"
                        ? "text-slate-400"
                        : "text-slate-600"
                    }`}
                  >
                    Wed
                  </span>
                </div>
                {/* Thursday */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 bg-blue-600 rounded-t h-24"></div>
                  <span
                    className={`text-xs ${
                      resolvedTheme === "dark"
                        ? "text-slate-400"
                        : "text-slate-600"
                    }`}
                  >
                    Thu
                  </span>
                </div>
                {/* Friday */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 bg-blue-300 rounded-t h-10"></div>
                  <span
                    className={`text-xs ${
                      resolvedTheme === "dark"
                        ? "text-slate-400"
                        : "text-slate-600"
                    }`}
                  >
                    Fri
                  </span>
                </div>
                {/* Saturday */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 bg-blue-300 rounded-t h-6"></div>
                  <span
                    className={`text-xs ${
                      resolvedTheme === "dark"
                        ? "text-slate-400"
                        : "text-slate-600"
                    }`}
                  >
                    Sat
                  </span>
                </div>
                {/* Sunday */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 bg-blue-300 rounded-t h-4"></div>
                  <span
                    className={`text-xs ${
                      resolvedTheme === "dark"
                        ? "text-slate-400"
                        : "text-slate-600"
                    }`}
                  >
                    Sun
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    );
  }
);

DashboardOverview.displayName = "DashboardOverview";

export default DashboardOverview;
