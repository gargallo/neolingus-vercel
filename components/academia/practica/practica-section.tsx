"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import {
  Target,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  Play,
  RotateCcw,
  Brain,
  Zap,
  Headphones,
  Mic,
  PenTool,
  Eye,
  MessageSquare,
  BookOpen,
  Trophy,
  Activity,
  Timer,
  Volume2
} from "lucide-react";

interface PracticeHistory {
  id: string;
  practice_type: string;
  skill_area: string;
  status: 'pending' | 'in_progress' | 'completed';
  score?: number;
  started_at: string;
  completed_at?: string;
  duration?: number;
  practice_results?: {
    accuracy: number;
    speed: number;
    consistency: number;
    improvement_areas: string[];
  };
}

interface PracticaSectionProps {
  practiceHistory: PracticeHistory[];
}

export function PracticaSection({ practiceHistory }: PracticaSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useEnhancedTheme();
  const [selectedSkill, setSelectedSkill] = useState("all");

  const isDark = resolvedTheme === "dark";

  // Extract course info from pathname
  const pathSegments = pathname.split('/');
  const language = pathSegments[2];
  const level = pathSegments[3];

  // Practice activities organized by skill area
  const practiceActivities = {
    listening: [
      {
        id: "audio-comprehension",
        title: "Comprensión Auditiva",
        description: "Escucha y responde preguntas sobre conversaciones",
        duration: 20,
        difficulty: "Intermediate",
        icon: <Headphones className="w-6 h-6" />,
        color: "bg-blue-500",
        progress: 65
      },
      {
        id: "pronunciation-practice",
        title: "Práctica de Pronunciación",
        description: "Mejora tu pronunciación con ejercicios guiados",
        duration: 15,
        difficulty: "Beginner",
        icon: <Volume2 className="w-6 h-6" />,
        color: "bg-green-500",
        progress: 40
      },
      {
        id: "accent-training",
        title: "Entrenamiento de Acento",
        description: "Trabaja en tu acento y entonación",
        duration: 25,
        difficulty: "Advanced",
        icon: <Mic className="w-6 h-6" />,
        color: "bg-purple-500",
        progress: 20
      }
    ],
    speaking: [
      {
        id: "conversation-simulator",
        title: "Simulador de Conversación",
        description: "Practica conversaciones reales con IA",
        duration: 30,
        difficulty: "Intermediate",
        icon: <MessageSquare className="w-6 h-6" />,
        color: "bg-orange-500",
        progress: 50
      },
      {
        id: "speech-fluency",
        title: "Fluidez del Habla",
        description: "Mejora tu velocidad y naturalidad al hablar",
        duration: 20,
        difficulty: "Advanced",
        icon: <Activity className="w-6 h-6" />,
        color: "bg-red-500",
        progress: 30
      },
      {
        id: "presentation-skills",
        title: "Habilidades de Presentación",
        description: "Aprende a presentar ideas con confianza",
        duration: 35,
        difficulty: "Advanced",
        icon: <Trophy className="w-6 h-6" />,
        color: "bg-indigo-500",
        progress: 10
      }
    ],
    reading: [
      {
        id: "speed-reading",
        title: "Lectura Rápida",
        description: "Mejora tu velocidad de lectura manteniendo comprensión",
        duration: 25,
        difficulty: "Intermediate",
        icon: <Timer className="w-6 h-6" />,
        color: "bg-cyan-500",
        progress: 75
      },
      {
        id: "critical-reading",
        title: "Lectura Crítica",
        description: "Analiza y evalúa textos complejos",
        duration: 40,
        difficulty: "Advanced",
        icon: <Eye className="w-6 h-6" />,
        color: "bg-teal-500",
        progress: 45
      },
      {
        id: "vocabulary-context",
        title: "Vocabulario en Contexto",
        description: "Aprende nuevas palabras a través de la lectura",
        duration: 15,
        difficulty: "Beginner",
        icon: <BookOpen className="w-6 h-6" />,
        color: "bg-emerald-500",
        progress: 80
      }
    ],
    writing: [
      {
        id: "creative-writing",
        title: "Escritura Creativa",
        description: "Desarrolla tu creatividad escribiendo historias",
        duration: 45,
        difficulty: "Intermediate",
        icon: <PenTool className="w-6 h-6" />,
        color: "bg-pink-500",
        progress: 35
      },
      {
        id: "formal-writing",
        title: "Escritura Formal",
        description: "Aprende a escribir cartas y documentos formales",
        duration: 30,
        difficulty: "Advanced",
        icon: <Brain className="w-6 h-6" />,
        color: "bg-violet-500",
        progress: 55
      },
      {
        id: "grammar-exercises",
        title: "Ejercicios de Gramática",
        description: "Practica estructuras gramaticales específicas",
        duration: 20,
        difficulty: "Beginner",
        icon: <Zap className="w-6 h-6" />,
        color: "bg-yellow-500",
        progress: 90
      }
    ]
  };

  const skillAreas = [
    { key: "listening", name: "Comprensión Auditiva", icon: <Headphones className="w-5 h-5" />, count: practiceActivities.listening.length },
    { key: "speaking", name: "Expresión Oral", icon: <Mic className="w-5 h-5" />, count: practiceActivities.speaking.length },
    { key: "reading", name: "Comprensión Lectora", icon: <BookOpen className="w-5 h-5" />, count: practiceActivities.reading.length },
    { key: "writing", name: "Expresión Escrita", icon: <PenTool className="w-5 h-5" />, count: practiceActivities.writing.length }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleStartPractice = (activityId: string) => {
    router.push(`/dashboard/${language}/${level}/practica/${activityId}`);
  };

  const renderActivityCard = (activity: any, index: number) => (
    <motion.div
      key={activity.id}
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
              <div className={`${activity.color} w-12 h-12 rounded-xl flex items-center justify-center text-white`}>
                {activity.icon}
              </div>
              <div>
                <CardTitle className={`text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
                  {activity.title}
                </CardTitle>
                <Badge className={getDifficultyColor(activity.difficulty)}>
                  {activity.difficulty}
                </Badge>
              </div>
            </div>
          </div>
          <CardDescription className="mt-2">
            {activity.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Progreso</span>
              <span className="font-medium">{activity.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`${activity.color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${activity.progress}%` }}
              />
            </div>
          </div>

          {/* Activity Info */}
          <div className="flex items-center justify-between mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{activity.duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(activity.progress / 20)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => handleStartPractice(activity.id)}
            className="w-full"
            variant={activity.progress > 0 ? "outline" : "default"}
          >
            {activity.progress === 0 ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Comenzar
              </>
            ) : activity.progress === 100 ? (
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
  );

  return (
    <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-xl">
              <Target className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Práctica Interactiva
              </h1>
              <p className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Mejora tus habilidades con ejercicios personalizados
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
                    <p className="text-2xl font-bold text-blue-600">12</p>
                    <p className="text-sm text-gray-500">Actividades</p>
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
                    <p className="text-2xl font-bold text-green-600">8</p>
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
                    <p className="text-2xl font-bold text-purple-600">92%</p>
                    <p className="text-sm text-gray-500">Precisión</p>
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
                    <p className="text-2xl font-bold text-orange-600">6h</p>
                    <p className="text-sm text-gray-500">Esta Semana</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Practice Activities by Skill */}
        <Tabs defaultValue="listening" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            {skillAreas.map((skill) => (
              <TabsTrigger key={skill.key} value={skill.key} className="flex items-center gap-2">
                {skill.icon}
                <span className="hidden sm:inline">{skill.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {skill.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {skillAreas.map((skill) => (
            <TabsContent key={skill.key} value={skill.key} className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  {skill.icon}
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    {skill.name}
                  </h2>
                  <p className="text-gray-500">
                    {skill.count} actividades disponibles para mejorar tu {skill.name.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {practiceActivities[skill.key as keyof typeof practiceActivities].map((activity, index) =>
                  renderActivityCard(activity, index)
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
  );
}