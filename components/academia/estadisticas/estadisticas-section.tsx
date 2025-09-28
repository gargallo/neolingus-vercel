"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Award,
  Brain,
  CheckCircle,
  Star,
  Calendar,
  Activity,
  Zap,
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  Timer,
  Trophy,
  LineChart,
  PieChart
} from "lucide-react";

interface StatsData {
  exams: any[];
  practice: any[];
  progress: any;
  timeSpent: any[];
}

interface EstadisticasSectionProps {
  statsData: StatsData;
}

export function EstadisticasSection({ statsData }: EstadisticasSectionProps) {
  const pathname = usePathname();
  const { resolvedTheme } = useEnhancedTheme();
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const isDark = resolvedTheme === "dark";

  // Extract course info from pathname
  const pathSegments = pathname.split('/');
  const language = pathSegments[2];
  const level = pathSegments[3];

  // Mock comprehensive statistics
  const statistics = {
    overview: {
      totalStudyTime: 147, // hours
      averageScore: 87,
      totalExams: 23,
      totalPractice: 156,
      currentStreak: 12,
      longestStreak: 28,
      achievementsEarned: 18,
      skillLevel: "Intermediate-Advanced"
    },
    skillProgress: {
      listening: { current: 85, target: 90, improvement: 12 },
      speaking: { current: 78, target: 85, improvement: 8 },
      reading: { current: 92, target: 95, improvement: 15 },
      writing: { current: 74, target: 80, improvement: 6 }
    },
    weeklyActivity: [
      { day: "Lun", practice: 45, exams: 2, total: 47 },
      { day: "Mar", practice: 30, exams: 1, total: 31 },
      { day: "Mié", practice: 60, exams: 0, total: 60 },
      { day: "Jue", practice: 25, exams: 3, total: 28 },
      { day: "Vie", practice: 40, exams: 1, total: 41 },
      { day: "Sáb", practice: 70, exams: 0, total: 70 },
      { day: "Dom", practice: 35, exams: 2, total: 37 }
    ],
    monthlyProgress: [
      { month: "Ene", score: 72, hours: 28 },
      { month: "Feb", score: 76, hours: 32 },
      { month: "Mar", score: 81, hours: 35 },
      { month: "Abr", score: 85, hours: 38 },
      { month: "May", score: 87, hours: 42 }
    ],
    examPerformance: [
      { category: "Gramática", score: 89, attempts: 12 },
      { category: "Vocabulario", score: 91, attempts: 15 },
      { category: "Comprensión", score: 84, attempts: 8 },
      { category: "Expresión", score: 82, attempts: 6 }
    ]
  };

  const skillAreas = [
    { key: "listening", name: "Comprensión Auditiva", icon: <Headphones className="w-5 h-5" />, color: "text-blue-600" },
    { key: "speaking", name: "Expresión Oral", icon: <Mic className="w-5 h-5" />, color: "text-green-600" },
    { key: "reading", name: "Comprensión Lectora", icon: <BookOpen className="w-5 h-5" />, color: "text-purple-600" },
    { key: "writing", name: "Expresión Escrita", icon: <PenTool className="w-5 h-5" />, color: "text-orange-600" }
  ];

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "text-green-600";
    if (progress >= 75) return "text-blue-600";
    if (progress >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const renderOverviewCard = (title: string, value: string | number, subtitle: string, icon: any, color: string) => (
    <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          </div>
          <div className={`p-3 rounded-full bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderActivityChart = () => (
    <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Actividad Semanal
        </CardTitle>
        <CardDescription>
          Minutos de estudio por día en la última semana
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-48 gap-2">
          {statistics.weeklyActivity.map((day, index) => (
            <div key={day.day} className="flex flex-col items-center gap-2 flex-1">
              <div className="flex flex-col gap-1 w-full">
                <div
                  className="bg-blue-500 rounded-t w-full transition-all duration-300"
                  style={{ height: `${(day.practice / 70) * 140}px` }}
                  title={`Práctica: ${day.practice} min`}
                />
                <div
                  className="bg-green-500 w-full"
                  style={{ height: `${(day.exams / 70) * 40}px` }}
                  title={`Exámenes: ${day.exams} intentos`}
                />
              </div>
              <span className="text-xs text-gray-500 font-medium">{day.day}</span>
              <span className="text-xs text-gray-400">{day.total}m</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Práctica</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Exámenes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSkillProgress = () => (
    <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Progreso por Habilidad
        </CardTitle>
        <CardDescription>
          Tu nivel actual en cada área de competencia
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {skillAreas.map((skill) => {
          const progress = statistics.skillProgress[skill.key as keyof typeof statistics.skillProgress];
          return (
            <div key={skill.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${skill.color}`}>
                    {skill.icon}
                  </div>
                  <span className="font-medium">{skill.name}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${getProgressColor(progress.current)}`}>
                    {progress.current}%
                  </span>
                  <span className="text-gray-500 text-sm ml-1">/ {progress.target}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.current >= 90 ? 'bg-green-500' :
                      progress.current >= 75 ? 'bg-blue-500' :
                      progress.current >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${progress.current}%` }}
                  />
                </div>
                <span className="text-xs text-green-600 font-medium">
                  +{progress.improvement}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  const renderMonthlyTrend = () => (
    <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Tendencia Mensual
        </CardTitle>
        <CardDescription>
          Evolución de tu rendimiento en los últimos meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statistics.monthlyProgress.map((month, index) => (
            <div key={month.month} className="flex items-center gap-4">
              <div className="w-12 text-sm font-medium text-gray-500">
                {month.month}
              </div>
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Puntuación</span>
                    <span className="text-sm font-medium">{month.score}%</span>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${month.score}%` }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Horas</span>
                    <span className="text-sm font-medium">{month.hours}h</span>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(month.hours / 50) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-xl">
              <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                Estadísticas y Progreso
              </h1>
              <p className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                Analiza tu rendimiento y evolución en el curso
              </p>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {renderOverviewCard(
              "Tiempo Total",
              `${statistics.overview.totalStudyTime}h`,
              "Horas de estudio",
              <Clock className="w-6 h-6" />,
              "text-blue-600"
            )}
            {renderOverviewCard(
              "Puntuación Media",
              `${statistics.overview.averageScore}%`,
              "En todos los exámenes",
              <Star className="w-6 h-6" />,
              "text-yellow-600"
            )}
            {renderOverviewCard(
              "Racha Actual",
              statistics.overview.currentStreak,
              "Días consecutivos",
              <Zap className="w-6 h-6" />,
              "text-green-600"
            )}
            {renderOverviewCard(
              "Logros",
              statistics.overview.achievementsEarned,
              "Medallas obtenidas",
              <Trophy className="w-6 h-6" />,
              "text-purple-600"
            )}
          </div>
        </div>

        {/* Main Statistics */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Progreso
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Actividad
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" />
              Rendimiento
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Tendencias
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderSkillProgress()}
              <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Logros Recientes
                  </CardTitle>
                  <CardDescription>
                    Tus últimas medallas y certificaciones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { title: "Maestro de Vocabulario", description: "Completa 100 ejercicios de vocabulario", earned: true },
                    { title: "Racha de Fuego", description: "Estudia 7 días consecutivos", earned: true },
                    { title: "Perfeccionista", description: "Obtén 100% en un examen", earned: true },
                    { title: "Maratonista", description: "Estudia 5 horas en un día", earned: false }
                  ].map((achievement, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        achievement.earned ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-medium ${achievement.earned ? '' : 'text-gray-500'}`}>
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-gray-500">{achievement.description}</p>
                      </div>
                      {achievement.earned && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderActivityChart()}
              <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Calendario de Estudio
                  </CardTitle>
                  <CardDescription>
                    Tu patrón de estudio en las últimas semanas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                    {["L", "M", "X", "J", "V", "S", "D"].map(day => (
                      <div key={day} className="p-1">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 28 }, (_, i) => {
                      const intensity = Math.random();
                      return (
                        <div
                          key={i}
                          className={`aspect-square rounded text-xs flex items-center justify-center ${
                            intensity > 0.7 ? 'bg-green-500 text-white' :
                            intensity > 0.4 ? 'bg-green-300 text-green-800' :
                            intensity > 0.1 ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 dark:bg-gray-800'
                          }`}
                          title={`${Math.floor(intensity * 60)} minutos`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                    <span>Menos</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded"></div>
                      <div className="w-3 h-3 bg-green-100 rounded"></div>
                      <div className="w-3 h-3 bg-green-300 rounded"></div>
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                    </div>
                    <span>Más</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Rendimiento por Categoría
                  </CardTitle>
                  <CardDescription>
                    Tu puntuación promedio en diferentes áreas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statistics.examPerformance.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.category}</span>
                        <div className="text-right">
                          <span className={`font-bold ${getProgressColor(category.score)}`}>
                            {category.score}%
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            ({category.attempts} intentos)
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            category.score >= 90 ? 'bg-green-500' :
                            category.score >= 75 ? 'bg-blue-500' :
                            category.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${category.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              {renderMonthlyTrend()}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Análisis de Aprendizaje
                  </CardTitle>
                  <CardDescription>
                    Insights personalizados sobre tu progreso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">Mañana</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Mejor momento para estudiar</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">Lectura</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Tu habilidad más fuerte</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600 mb-1">Escritura</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Área de mejora</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Recomendaciones Personalizadas</h4>
                    <div className="space-y-2">
                      {[
                        "Dedica 15 minutos extra diarios a ejercicios de escritura",
                        "Practica conversación los martes y jueves por la mañana",
                        "Revisa vocabulario nuevo antes de dormir para mejor retención"
                      ].map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}