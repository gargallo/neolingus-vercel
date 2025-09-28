"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  TrendingUp,
  Calendar,
  Play,
  RotateCcw,
  Award,
  Target,
  BookOpen,
  Brain,
  Zap
} from "lucide-react";

interface TaskHistory {
  id: string;
  task_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  score?: number;
  started_at: string;
  completed_at?: string;
  attempts: number;
  task_results?: {
    total_score: number;
    time_spent: number;
    correct_answers: number;
    total_questions: number;
  };
}

interface TareasSectionProps {
  taskHistory: TaskHistory[];
}

export function TareasSection({ taskHistory }: TareasSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useEnhancedTheme();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isDark = resolvedTheme === "dark";

  // Extract course info from pathname
  const pathSegments = pathname.split('/');
  const language = pathSegments[2];
  const level = pathSegments[3];

  // Mock available tasks data
  const availableTasks = [
    {
      id: "grammar-basics",
      title: "Gramática Básica",
      description: "Fundamentos gramaticales del idioma",
      category: "Gramática",
      difficulty: "Beginner",
      estimatedTime: 30,
      totalQuestions: 20,
      icon: "📝",
      color: "bg-blue-500",
      progress: 75
    },
    {
      id: "vocabulary-common",
      title: "Vocabulario Común",
      description: "Palabras y expresiones de uso frecuente",
      category: "Vocabulario",
      difficulty: "Beginner",
      estimatedTime: 25,
      totalQuestions: 15,
      icon: "📚",
      color: "bg-green-500",
      progress: 60
    },
    {
      id: "reading-comprehension",
      title: "Comprensión Lectora",
      description: "Ejercicios de comprensión de textos",
      category: "Comprensión",
      difficulty: "Intermediate",
      estimatedTime: 45,
      totalQuestions: 10,
      icon: "📖",
      color: "bg-purple-500",
      progress: 40
    },
    {
      id: "listening-practice",
      title: "Práctica Auditiva",
      description: "Ejercicios de comprensión auditiva",
      category: "Comprensión",
      difficulty: "Intermediate",
      estimatedTime: 35,
      totalQuestions: 12,
      icon: "🎧",
      color: "bg-orange-500",
      progress: 20
    },
    {
      id: "writing-exercises",
      title: "Ejercicios de Escritura",
      description: "Práctica de expresión escrita",
      category: "Escritura",
      difficulty: "Advanced",
      estimatedTime: 60,
      totalQuestions: 8,
      icon: "✍️",
      color: "bg-red-500",
      progress: 0
    },
    {
      id: "conversation-topics",
      title: "Temas de Conversación",
      description: "Práctica de expresión oral",
      category: "Conversación",
      difficulty: "Advanced",
      estimatedTime: 40,
      totalQuestions: 6,
      icon: "💬",
      color: "bg-indigo-500",
      progress: 10
    }
  ];

  const categories = ["all", "Gramática", "Vocabulario", "Comprensión", "Escritura", "Conversación"];

  const filteredTasks = availableTasks.filter(task => {
    const matchesCategory = selectedCategory === "all" || task.category === selectedCategory;
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleStartTask = (taskId: string) => {
    // Navigate to task practice page
    router.push(`/dashboard/${language}/${level}/tareas/${taskId}`);
  };

  return (
    <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Tareas de Práctica
              </h1>
              <p className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Ejercicios interactivos para mejorar tus habilidades
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">6</p>
                    <p className="text-sm text-gray-500">Tareas Disponibles</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">2</p>
                    <p className="text-sm text-gray-500">Completadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">85%</p>
                    <p className="text-sm text-gray-500">Promedio</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">4h</p>
                    <p className="text-sm text-gray-500">Tiempo Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="search"
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full px-4 py-2 pl-10 rounded-xl border ${
                  isDark
                    ? "bg-slate-800 border-slate-700 text-white placeholder-slate-400"
                    : "bg-white border-slate-300 text-slate-900 placeholder-slate-500"
                }`}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <BookOpen className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category === "all" ? "Todas" : category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
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
                    <div className="flex items-center gap-3">
                      <div className={`${task.color} w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl`}>
                        {task.icon}
                      </div>
                      <div>
                        <CardTitle className={`text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
                          {task.title}
                        </CardTitle>
                        <Badge className={getDifficultyColor(task.difficulty)}>
                          {task.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardDescription className="mt-2">
                    {task.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Progreso</span>
                      <span className="font-medium">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${task.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Task Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">{task.estimatedTime} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-500">{task.totalQuestions} preguntas</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleStartTask(task.id)}
                    className="w-full"
                    variant={task.progress > 0 ? "outline" : "default"}
                  >
                    {task.progress === 0 ? (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Comenzar
                      </>
                    ) : task.progress === 100 ? (
                      <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Repetir
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Continuar
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              No se encontraron tareas
            </h3>
            <p className="text-gray-500">
              Intenta ajustar los filtros o buscar con otros términos
            </p>
          </div>
        )}
      </div>
  );
}