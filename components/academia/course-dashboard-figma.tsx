"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useCourseContext } from "@/components/academia/course-context-provider";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressAnalytics } from "@/components/academia/progress-analytics";
import AITutor from "@/components/academia/ai-tutor";
import { Achievements } from "@/components/academia/achievements";
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
} from "lucide-react";

interface DashboardOverviewProps {
  courseData: any;
  progressData: any;
  achievements: any[];
  availableExams: any[];
  user: any;
}

const DashboardOverview = memo(function DashboardOverview({
  courseData,
  progressData,
  achievements,
  availableExams,
  user,
}: DashboardOverviewProps) {
  const router = useRouter();
  const { resolvedTheme } = useEnhancedTheme();
  const { selectedProvider, setSelectedProvider } = useCourseContext();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("week");

  // Mock data for Figma design adaptation
  const mockCourses = [
    {
      id: 1,
      name: "French",
      level: "B2",
      progress: 75,
      color: "bg-blue-500",
      icon: "🇫🇷",
      lessons: 24,
      completed: 18,
    },
    {
      id: 2,
      name: "Portuguese",
      level: "A2",
      progress: 45,
      color: "bg-orange-500",
      icon: "🇵🇹",
      lessons: 20,
      completed: 9,
    },
    {
      id: 3,
      name: "Italian",
      level: "B1",
      progress: 60,
      color: "bg-green-500",
      icon: "🇮🇹",
      lessons: 22,
      completed: 13,
    },
    {
      id: 4,
      name: "German",
      level: "A1",
      progress: 30,
      color: "bg-yellow-500",
      icon: "🇩🇪",
      lessons: 18,
      completed: 5,
    },
  ];

  const mockTasks = [
    {
      id: 1,
      title: "Reading",
      time: "09:00",
      icon: "📖",
      completed: false,
    },
    {
      id: 2,
      title: "Listening",
      time: "10:30",
      icon: "🎧",
      completed: true,
    },
    {
      id: 3,
      title: "Speaking",
      time: "14:00",
      icon: "🗣️",
      completed: false,
    },
    {
      id: 4,
      title: "Grammar",
      time: "16:00",
      icon: "📝",
      completed: false,
    },
  ];

  const mockStats = [
    {
      title: "Courses Completed",
      value: "3",
      icon: "🎓",
      color: "text-blue-600",
    },
    {
      title: "Total Points Gained",
      value: "2,450",
      icon: "⭐",
      color: "text-yellow-600",
    },
    {
      title: "Courses In Progress",
      value: "4",
      icon: "📚",
      color: "text-green-600",
    },
    {
      title: "Tasks Finished",
      value: "127",
      icon: "✅",
      color: "text-purple-600",
    },
  ];

  const mockActivity = [
    { day: "Mon", value: 8 },
    { day: "Tue", value: 12 },
    { day: "Wed", value: 6 },
    { day: "Thu", value: 15 },
    { day: "Fri", value: 10 },
    { day: "Sat", value: 4 },
    { day: "Sun", value: 7 },
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
        resolvedTheme === "dark" ? "bg-slate-900" : "bg-slate-50"
      }`}
    >
      {/* Left Sidebar - Navigation */}
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
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span
              className={`text-xl font-bold ${
                resolvedTheme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              NeoLingus
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          <Link
            href="#"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              resolvedTheme === "dark"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-600"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Overview</span>
            <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
          </Link>

          <Link
            href="#"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              resolvedTheme === "dark"
                ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="font-medium">Course</span>
          </Link>

          <Link
            href="#"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              resolvedTheme === "dark"
                ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Resources</span>
          </Link>

          <Link
            href="#"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              resolvedTheme === "dark"
                ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Message</span>
          </Link>

          <Link
            href="#"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              resolvedTheme === "dark"
                ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Setting</span>
          </Link>
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
          <p className="text-white/80 text-sm mb-3">
            Unlock premium features and advanced courses
          </p>
          <Button className="bg-white text-blue-600 hover:bg-blue-50 transition-colors w-full">
            Go to PRO
          </Button>
        </div>

        {/* Illustration */}
        <div className="mt-8 text-center">
          <div className="text-6xl">🧘‍♀️</div>
          <p
            className={`text-sm mt-2 ${
              resolvedTheme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Stay focused and learn
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1
            className={`text-3xl font-bold mb-2 ${
              resolvedTheme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            Hello {user?.user_metadata?.full_name || "Student"}, welcome back!
          </h1>
          <p
            className={`text-lg ${
              resolvedTheme === "dark" ? "text-slate-400" : "text-slate-600"
            }`}
          >
            Continue your language learning journey
          </p>
        </div>

        {/* My Courses Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2
              className={`text-2xl font-bold ${
                resolvedTheme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              My Courses
            </h2>
            <Link
              href="/dashboard/courses"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="search"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-3 pl-10 rounded-xl border ${
                  resolvedTheme === "dark"
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                    : "bg-white border-slate-300 text-slate-900 placeholder-slate-500"
                }`}
              />
            </div>
          </div>

          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockCourses.map((course) => (
              <motion.div
                key={course.id}
                className={`${course.color} rounded-2xl p-6 text-white relative overflow-hidden cursor-pointer`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleViewCourse(course.id.toString())}
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">{course.icon}</div>
                    <div className="text-right">
                      <div className="text-sm opacity-80">
                        Level {course.level}
                      </div>
                      <div className="text-xs opacity-60">
                        {course.completed}/{course.lessons} lessons
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{course.name}</h3>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    Continue Learning
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
                resolvedTheme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              Planning
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span
                  className={`text-sm ${
                    resolvedTheme === "dark"
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
              resolvedTheme === "dark"
                ? "bg-slate-800 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
          >
            <div className="space-y-4">
              {mockTasks.map((task) => (
                <motion.div
                  key={task.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  whileHover={{ x: 4 }}
                >
                  <div className="text-2xl">{task.icon}</div>
                  <div className="flex-1">
                    <h4
                      className={`font-medium ${
                        resolvedTheme === "dark"
                          ? "text-white"
                          : "text-slate-900"
                      }`}
                    >
                      {task.title}
                    </h4>
                    <p
                      className={`text-sm ${
                        resolvedTheme === "dark"
                          ? "text-slate-400"
                          : "text-slate-600"
                      }`}
                    >
                      {task.time}
                    </p>
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
          resolvedTheme === "dark"
            ? "bg-slate-800 border-l border-slate-700"
            : "bg-white border-l border-slate-200"
        }`}
      >
        {/* User Profile */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {user?.user_metadata?.full_name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1">
            <h3
              className={`font-bold ${
                resolvedTheme === "dark" ? "text-white" : "text-slate-900"
              }`}
            >
              {user?.user_metadata?.full_name || "User"}
            </h3>
            <p
              className={`text-sm ${
                resolvedTheme === "dark" ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {user?.user_metadata?.subscription_type || "Basic Plan"}
            </p>
          </div>
          <button className="text-slate-400 hover:text-slate-600">
            <Bell className="w-5 h-5" />
          </button>
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
            {mockStats.map((stat, index) => (
              <motion.div
                key={index}
                className={`p-4 rounded-xl text-center ${
                  resolvedTheme === "dark" ? "bg-slate-700" : "bg-slate-100"
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <div
                  className={`text-xs ${
                    resolvedTheme === "dark"
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
              resolvedTheme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            Activity
          </h3>

          {/* Time Period Selector */}
          <div className="flex gap-2 mb-4">
            {["day", "week", "month"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimePeriod(period)}
                className={`px-3 py-1 rounded-lg text-sm capitalize ${
                  selectedTimePeriod === period
                    ? "bg-blue-600 text-white"
                    : resolvedTheme === "dark"
                    ? "text-slate-400 hover:text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {period}
              </button>
            ))}
          </div>

          {/* Activity Chart */}
          <div
            className={`p-4 rounded-xl ${
              resolvedTheme === "dark" ? "bg-slate-700" : "bg-slate-100"
            }`}
          >
            <div className="flex items-end justify-between h-32 gap-1">
              {mockActivity.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <div
                    className={`w-6 rounded-t transition-all duration-300 ${
                      resolvedTheme === "dark" ? "bg-blue-400" : "bg-blue-500"
                    }`}
                    style={{ height: `${(item.value / 15) * 100}%` }}
                  ></div>
                  <span
                    className={`text-xs ${
                      resolvedTheme === "dark"
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
