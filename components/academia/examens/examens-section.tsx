'use client';

import { useState } from 'react';
import { useCourseContext } from '@/components/academia/course-context-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import {
  Clock, FileText, Play, TrendingUp, Award, Shield, Trophy, BookOpen, Users, Target,
  ChevronRight, ExternalLink, Star, Zap, CheckCircle2, ArrowUpRight, Sparkles,
  GraduationCap, Medal, Crown, Flame, BarChart3, Calendar, Clock3, Brain, ChevronLeft,
  PenTool, Headphones, Mic, Eye, MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { providerSkills, type SkillDefinition } from './skill-definitions';

interface ExamAttempt {
  id: string;
  exam_id?: string;
  provider_id?: string;
  status: string;
  score?: number;
  started_at: string;
  finished_at?: string;
  time_remaining?: number;
  is_completed?: boolean;
  passed?: boolean;
  component?: string;
  exam_results?: {
    total_score: number;
    section_scores: Record<string, number>;
    passed: boolean;
  }[];
}

interface ExamensSectionProps {
  examHistory: ExamAttempt[];
}

// Provider brand colors and configurations
const providerConfigs: Record<string, {
  primary: string;
  secondary: string;
  accent: string;
  icon: React.ComponentType<any>;
  badge: string;
  pattern: string;
}> = {
  cambridge: {
    primary: "from-blue-600 to-blue-700",
    secondary: "from-blue-50 to-blue-100",
    accent: "blue",
    icon: Crown,
    badge: "Cambridge Assessment",
    pattern: "bg-gradient-to-br from-blue-500/10 to-indigo-500/10"
  },
  eoi: {
    primary: "from-emerald-600 to-green-700",
    secondary: "from-emerald-50 to-green-100",
    accent: "emerald",
    icon: GraduationCap,
    badge: "Escuela Oficial",
    pattern: "bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
  },
  cieacova: {
    primary: "from-purple-600 to-violet-700",
    secondary: "from-purple-50 to-violet-100",
    accent: "purple",
    icon: Medal,
    badge: "Certificación Oficial",
    pattern: "bg-gradient-to-br from-purple-500/10 to-pink-500/10"
  },
  jqcv: {
    primary: "from-orange-600 to-red-600",
    secondary: "from-orange-50 to-red-100",
    accent: "orange",
    icon: Flame,
    badge: "Junta Qualificadora",
    pattern: "bg-gradient-to-br from-orange-500/10 to-red-500/10"
  }
};

export function ExamensSection({ examHistory }: ExamensSectionProps) {
  const { courseConfig } = useCourseContext();
  const { resolvedTheme } = useEnhancedTheme();
  const isDark = resolvedTheme === "dark";

  // State for provider selection
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const providers = Object.entries(courseConfig.providers);

  // Get language and level from courseConfig
  const language = courseConfig.metadata.language;
  const level = courseConfig.metadata.level;

  // Helper function to get provider-specific exam history
  const getProviderExamHistory = (providerId: string) => {
    const providerExamIds = courseConfig.providers[providerId]?.examIds || [];

    return examHistory.filter((attempt) => {
      const matchesProvider = attempt.provider_id === providerId;
      if (!providerExamIds.length) {
        return matchesProvider;
      }

      const matchesExamId = attempt.exam_id ? providerExamIds.includes(attempt.exam_id) : false;
      return matchesExamId || matchesProvider;
    });
  };

  // Calculate provider-specific statistics based on skills
  const getProviderStats = (providerId: string) => {
    const skills = providerSkills[providerId] || [];
    const providerHistory = getProviderExamHistory(providerId);
    const totalAttempts = providerHistory.length;
    const completedAttempts = providerHistory.filter((h) =>
      h.status === 'completed' || h.is_completed || Boolean(h.finished_at)
    ).length;
    const passedAttempts = providerHistory.filter((h) =>
      h.exam_results?.some(result => result.passed) || h.passed
    ).length;
    const averageScore = completedAttempts > 0
      ? providerHistory.reduce((sum, h) => {
          if (typeof h.score === 'number') {
            return sum + h.score;
          }
          const totalScore = h.exam_results?.[0]?.total_score;
          return sum + (typeof totalScore === 'number' ? totalScore : 0);
        }, 0) / completedAttempts
      : 0;

    const passRate = totalAttempts > 0 ? (passedAttempts / totalAttempts) * 100 : 0;
    const completionRate = totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;
    const streak = calculateProviderStreak(providerHistory);

    return {
      totalSkills: skills.length,
      totalAttempts,
      completedAttempts,
      passedAttempts,
      averageScore,
      passRate,
      completionRate,
      streak,
      history: providerHistory,
      skills
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-emerald-600/5 dark:from-blue-400/5 dark:via-purple-400/5 dark:to-emerald-400/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_70%)]" />

        <div className="relative p-8 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                Certificaciones Oficiales
              </h1>
            </div>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              {selectedProvider
                ? `Practica cada competencia individualmente con ${courseConfig.providers[selectedProvider]?.name}`
                : "Elige tu institución certificadora y practica cada competencia por separado"
              }
            </p>

            {/* Back to Selection Button */}
            {selectedProvider && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedProvider(null)}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 rounded-full text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 dark:border-slate-600/50"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver a proveedores
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Provider Selection or Provider Details */}
      <div className="px-8 pb-8">
        <AnimatePresence mode="wait">
          {!selectedProvider ? (
            /* Provider Selection View */
            <motion.div
              key="provider-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-4">
                  Elige tu Institución Certificadora
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Cada proveedor ofrece competencias específicas que puedes practicar individualmente
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {providers.map(([providerId, provider], index) => {
                const config = providerConfigs[providerId] || providerConfigs.cambridge;
                const IconComponent = config.icon;
                const providerStats = getProviderStats(providerId);

                return (
                  <motion.div
                    key={providerId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.6 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedProvider(providerId)}
                  >
                    <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-3xl transition-all duration-500 h-full">
                      {/* Premium background pattern */}
                      <div className={`absolute inset-0 ${config.pattern} opacity-50`} />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent dark:from-slate-800/10" />

                      {/* Premium badge */}
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className={`bg-gradient-to-r ${config.primary} text-white border-0 shadow-lg`}>
                          <Star className="w-3 h-3 mr-1" />
                          Oficial
                        </Badge>
                      </div>

                      <CardHeader className="relative pb-4 pt-6">
                        <div className="flex flex-col items-center text-center mb-4">
                          <div className={`p-6 rounded-3xl bg-gradient-to-br ${config.primary} shadow-xl shadow-${config.accent}-500/30 group-hover:scale-110 transition-transform duration-300 mb-4`}>
                            <IconComponent className="w-12 h-12 text-white" />
                          </div>
                          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                            {provider.name}
                          </CardTitle>
                          <p className={`text-sm font-medium text-${config.accent}-600 dark:text-${config.accent}-400 mb-3`}>
                            {config.badge}
                          </p>
                        </div>
                      </CardHeader>

                      <CardContent className="relative pt-0 pb-6">
                        {/* Quick Stats Preview */}
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2">
                              <Brain className={`w-4 h-4 text-${config.accent}-600 dark:text-${config.accent}-400`} />
                              <span className="text-sm text-slate-600 dark:text-slate-400">Competencias</span>
                            </div>
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {providerStats.totalSkills}
                            </span>
                          </div>

                          {providerStats.totalAttempts > 0 && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm">
                              <div className="flex items-center gap-2">
                                <BarChart3 className={`w-4 h-4 text-${config.accent}-600 dark:text-${config.accent}-400`} />
                                <span className="text-sm text-slate-600 dark:text-slate-400">Intentos</span>
                              </div>
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {providerStats.totalAttempts}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Selection CTA */}
                        <Button className={`w-full h-12 bg-gradient-to-r ${config.primary} hover:from-${config.accent}-700 hover:to-${config.accent}-800 text-white border-0 shadow-lg shadow-${config.accent}-500/25 group-hover:shadow-xl transition-all duration-300`}>
                          <Brain className="w-5 h-5 mr-2" />
                          Ver Competencias
                          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              </div>
            </motion.div>
        ) : (
          /* Provider Details View */
          <motion.div
            key="provider-details"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            {(() => {
              const provider = courseConfig.providers[selectedProvider];
              const config = providerConfigs[selectedProvider] || providerConfigs.cambridge;
              const IconComponent = config.icon;
              const stats = getProviderStats(selectedProvider);
              const isOnFire = stats.streak >= 3;

              return (
                <>
                  {/* Provider Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-12"
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`p-4 rounded-3xl bg-gradient-to-br ${config.primary} shadow-xl shadow-${config.accent}-500/30`}>
                        <IconComponent className="w-12 h-12 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                          {provider?.name}
                        </h2>
                        <p className={`text-lg font-medium text-${config.accent}-600 dark:text-${config.accent}-400`}>
                          {config.badge}
                        </p>
                      </div>

                      {/* Achievement Badge */}
                      {isOnFire && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-sm font-medium shadow-lg"
                        >
                          <Flame className="w-4 h-4" />
                          ¡Racha de {stats.streak}!
                          <Sparkles className="w-4 h-4" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
                      {provider?.description}
                    </p>
                  </motion.div>

                  {/* Provider-Specific Statistics */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                  >
                    {/* Total Attempts */}
                    <Card className="relative overflow-hidden border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                      <div className={`absolute inset-0 ${config.pattern} opacity-30`} />
                      <CardContent className="relative p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.primary} shadow-lg shadow-${config.accent}-500/25`}>
                            <BarChart3 className="w-6 h-6 text-white" />
                          </div>
                          <Badge className={`bg-${config.accent}-100 text-${config.accent}-700 dark:bg-${config.accent}-900 dark:text-${config.accent}-300 border-0`}>
                            Total
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-3xl font-bold bg-gradient-to-r ${config.primary} bg-clip-text text-transparent`}>
                            {stats.totalAttempts}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            Intentos realizados
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Completion Rate */}
                    <Card className="relative overflow-hidden border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                      <div className={`absolute inset-0 ${config.pattern} opacity-30`} />
                      <CardContent className="relative p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.primary} shadow-lg shadow-${config.accent}-500/25`}>
                            <CheckCircle2 className="w-6 h-6 text-white" />
                          </div>
                          <Badge className={`bg-${config.accent}-100 text-${config.accent}-700 dark:bg-${config.accent}-900 dark:text-${config.accent}-300 border-0`}>
                            Progreso
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-3xl font-bold bg-gradient-to-r ${config.primary} bg-clip-text text-transparent`}>
                            {Math.round(stats.completionRate)}%
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            Tasa de finalización
                          </p>
                        </div>
                        <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stats.completionRate}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full bg-gradient-to-r ${config.primary} rounded-full`}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pass Rate */}
                    <Card className="relative overflow-hidden border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                      <div className={`absolute inset-0 ${config.pattern} opacity-30`} />
                      <CardContent className="relative p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.primary} shadow-lg shadow-${config.accent}-500/25`}>
                            <Trophy className="w-6 h-6 text-white" />
                          </div>
                          <Badge className={`bg-${config.accent}-100 text-${config.accent}-700 dark:bg-${config.accent}-900 dark:text-${config.accent}-300 border-0`}>
                            Éxito
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-3xl font-bold bg-gradient-to-r ${config.primary} bg-clip-text text-transparent`}>
                            {Math.round(stats.passRate)}%
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            Tasa de aprobación
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Average Score */}
                    <Card className="relative overflow-hidden border-0 shadow-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl">
                      <div className={`absolute inset-0 ${config.pattern} opacity-30`} />
                      <CardContent className="relative p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.primary} shadow-lg shadow-${config.accent}-500/25`}>
                            <Star className="w-6 h-6 text-white" />
                          </div>
                          <Badge className={`bg-${config.accent}-100 text-${config.accent}-700 dark:bg-${config.accent}-900 dark:text-${config.accent}-300 border-0`}>
                            Media
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-3xl font-bold bg-gradient-to-r ${config.primary} bg-clip-text text-transparent`}>
                            {Math.round(stats.averageScore * 10) / 10}%
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                            Puntuación media
                          </p>
                        </div>
                        <div className="flex items-center gap-1 mt-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(stats.averageScore / 20)
                                  ? "text-yellow-400 fill-current"
                                  : "text-slate-300 dark:text-slate-600"
                              }`}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Individual Skills Section */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="mb-12"
                  >
                    <div className="flex items-center gap-3 mb-8">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${config.primary} shadow-lg`}>
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        Competencias por Evaluar
                      </h3>
                    </div>
                    <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                      Practica cada competencia individualmente. Cada skill simula el formato real del examen oficial.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {stats.skills.map((skill, index) => {
                        const SkillIcon = skill.icon;

                        return (
                          <motion.div
                            key={skill.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index, duration: 0.6 }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            className="group"
                          >
                            <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 h-full">
                              {/* Skill background pattern */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${skill.color} opacity-10`} />
                              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-slate-800/20" />

                              <CardHeader className="relative pb-4">
                                <div className="flex items-start justify-between mb-4">
                                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${skill.color} shadow-lg shadow-slate-500/20 group-hover:scale-110 transition-transform duration-300`}>
                                    <SkillIcon className="w-8 h-8 text-white" />
                                  </div>
                                  <Badge className={`bg-gradient-to-r ${skill.color} text-white border-0 shadow-lg px-3 py-1`}>
                                    {skill.difficulty}
                                  </Badge>
                                </div>

                                <CardTitle className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                                  {skill.name}
                                </CardTitle>

                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                  {skill.description}
                                </p>

                                {/* Skill metadata */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                    <Clock className="w-4 h-4" />
                                    <span>{skill.estimatedTime}</span>
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="relative pt-0 pb-6">
                                {/* Topics */}
                                <div className="mb-6">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Incluye:</p>
                                  <div className="flex flex-wrap gap-2">
                                    {skill.topics.slice(0, 3).map((topic, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg"
                                      >
                                        {topic}
                                      </span>
                                    ))}
                                    {skill.topics.length > 3 && (
                                      <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg">
                                        +{skill.topics.length - 3} más
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Practice Button */}
                                <Link href={`/dashboard/${language}/${level}/examens/${selectedProvider}/${skill.id}`}>
                                  <Button className={`w-full h-12 bg-gradient-to-r ${skill.color} hover:shadow-xl text-white border-0 shadow-lg transition-all duration-300 text-sm font-semibold group-hover:scale-105`}>
                                    <Play className="w-5 h-5 mr-2" />
                                    Practicar {skill.name}
                                    <ArrowUpRight className="w-5 h-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                                  </Button>
                                </Link>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* Premium Recent Activity - Provider-specific when provider selected */}
    {(() => {
      const displayHistory = selectedProvider
        ? getProviderExamHistory(selectedProvider)
        : examHistory;
      const config = selectedProvider
        ? (providerConfigs[selectedProvider] || providerConfigs.cambridge)
        : null;

      return displayHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="px-8 pb-12"
        >
          <Card className="border-0 shadow-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl overflow-hidden">
            {config && (
              <div className={`absolute inset-0 ${config.pattern} opacity-20`} />
            )}

            <CardHeader className="relative pb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-2xl ${config ? `bg-gradient-to-br ${config.primary}` : 'bg-gradient-to-br from-slate-600 to-slate-700'} shadow-lg`}>
                  <Clock3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
                    Actividad Reciente
                  </CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 text-base">
                    {selectedProvider
                      ? `Tu progreso con ${courseConfig.providers[selectedProvider]?.name}`
                      : "Tu progreso en los últimos exámenes realizados"
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative">
              <div className="space-y-4">
                <AnimatePresence>
                  {displayHistory.slice(0, 5).map((attempt, index) => (
                    <motion.div
                      key={attempt.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-6 rounded-2xl bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-600/50 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {attempt.status === 'completed' ? (
                            <div className={`p-3 rounded-xl ${config ? `bg-gradient-to-br ${config.primary}` : 'bg-gradient-to-br from-green-500 to-emerald-600'} shadow-lg`}>
                              <CheckCircle2 className="h-6 w-6 text-white" />
                            </div>
                          ) : attempt.status === 'in_progress' ? (
                            <div className={`p-3 rounded-xl ${config ? `bg-gradient-to-br ${config.primary}` : 'bg-gradient-to-br from-blue-500 to-indigo-600'} shadow-lg`}>
                              <Play className="h-6 w-6 text-white" />
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 shadow-lg">
                              <Clock className="h-6 w-6 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">
                            {courseConfig.examConfigs[attempt.exam_id]?.metadata.title || attempt.exam_id}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(attempt.started_at).toLocaleDateString('es', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        {attempt.exam_results?.[0] && (
                          <>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {Math.round(attempt.exam_results[0].total_score * 10) / 10}%
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.floor(attempt.exam_results[0].total_score / 20)
                                        ? "text-yellow-400 fill-current"
                                        : "text-slate-300 dark:text-slate-600"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <Badge
                              className={`px-4 py-2 text-sm font-medium border-0 ${
                                attempt.exam_results[0].passed
                                  ? config
                                    ? `bg-gradient-to-r ${config.primary} text-white shadow-lg shadow-${config.accent}-500/25`
                                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                                  : "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25"
                              }`}
                            >
                              {attempt.exam_results[0].passed ? (
                                <div className="flex items-center gap-1">
                                  <Trophy className="w-4 h-4" />
                                  Aprobado
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <Target className="w-4 h-4" />
                                  Seguir practicando
                                </div>
                              )}
                            </Badge>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    })()}
  </div>
);
}

// Helper function to calculate streak
function calculateStreak(examHistory: ExamAttempt[]): number {
  const completedExams = examHistory
    .filter((exam) => exam.status === 'completed' || exam.is_completed || Boolean(exam.finished_at))
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  let streak = 0;
  for (const exam of completedExams) {
    const passed =
      exam.exam_results?.some(result => result.passed) ??
      exam.passed ??
      (typeof exam.score === 'number' ? exam.score >= 60 : false);

    if (passed) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Helper function to calculate provider-specific streak
function calculateProviderStreak(examHistory: ExamAttempt[]): number {
  const completedExams = examHistory
    .filter((exam) => exam.status === 'completed' || exam.is_completed || Boolean(exam.finished_at))
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

  let streak = 0;
  for (const exam of completedExams) {
    const passed =
      exam.exam_results?.some(result => result.passed) ??
      exam.passed ??
      (typeof exam.score === 'number' ? exam.score >= 60 : false);

    if (passed) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
