"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { spanishTranslations } from "@/lib/translations/spanish";
import { Trophy, Star, Zap, Users, Sparkles, Crown, Award } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  category: 'progress' | 'streak' | 'achievement' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned_at: string;
  xp_reward: number;
}

interface AchievementShowcaseWidgetProps {
  config: {
    title: string;
    size: string;
  };
  settings: {
    is_visible: boolean;
    is_collapsed: boolean;
    custom_title?: string;
  };
  dashboardData: any;
  userId: string;
  demoMode?: boolean;
  onToggleVisibility: (isVisible: boolean) => void;
}

export function AchievementShowcaseWidget({ 
  config, 
  settings, 
  dashboardData, 
  userId,
  demoMode = false,
  onToggleVisibility 
}: AchievementShowcaseWidgetProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  const { achievements: t } = spanishTranslations;

  // Generate achievement data (in real app, this would come from API)
  const achievements = useMemo(() => {
    const { user_stats } = dashboardData;
    const currentStreak = user_stats?.engagement?.current_streak || 0;
    const totalXP = user_stats?.achievements?.total_xp || 0;
    const currentLevel = user_stats?.achievements?.current_level || 1;
    const badgesEarned = user_stats?.achievements?.badges_earned || [];

    // Mock achievements based on user progress
    const mockAchievements: Achievement[] = [
      {
        id: 'first_session',
        name: t.names.firstSteps,
        description: 'Completa tu primera sesión de aprendizaje',
        category: 'progress',
        rarity: 'common',
        earned_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        xp_reward: 10
      },
      {
        id: 'streak_3',
        name: 'Guerrero de 3 Días',
        description: 'Estudia durante 3 días consecutivos',
        category: 'streak',
        rarity: 'common',
        earned_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        xp_reward: 25
      },
      {
        id: 'level_5',
        name: t.names.scholar,
        description: 'Alcanza el nivel 5',
        category: 'progress',
        rarity: 'rare',
        earned_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        xp_reward: 50
      },
      {
        id: 'perfect_score',
        name: t.names.perfectionist,
        description: 'Obtén una puntuación del 100% en cualquier examen',
        category: 'achievement',
        rarity: 'epic',
        earned_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        xp_reward: 100
      },
      {
        id: 'streak_7',
        name: t.names.weekWarrior,
        description: 'Mantén una racha de estudio de 7 días',
        category: 'streak',
        rarity: 'rare',
        earned_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        xp_reward: 75
      },
      {
        id: 'speed_demon',
        name: t.names.speedLearner,
        description: 'Completa un examen en menos de 10 minutos con más del 80% de puntuación',
        category: 'achievement',
        rarity: 'epic',
        earned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        xp_reward: 125
      }
    ];

    // Filter based on user progress
    return mockAchievements.filter(achievement => {
      switch (achievement.id) {
        case 'streak_3':
          return currentStreak >= 3;
        case 'streak_7':
          return currentStreak >= 7;
        case 'level_5':
          return currentLevel >= 5;
        default:
          return true;
      }
    });
  }, [dashboardData]);

  // Filter achievements by category
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter(a => a.category === selectedCategory);
  }, [achievements, selectedCategory]);

  // Recent achievements (last 7 days)
  const recentAchievements = useMemo(() => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return achievements.filter(a => new Date(a.earned_at) > weekAgo)
      .sort((a, b) => new Date(b.earned_at).getTime() - new Date(a.earned_at).getTime());
  }, [achievements]);

  // Achievement stats
  const achievementStats = useMemo(() => {
    const byRarity = achievements.reduce((acc, a) => {
      acc[a.rarity] = (acc[a.rarity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalXP = achievements.reduce((sum, a) => sum + a.xp_reward, 0);
    
    return { byRarity, totalXP, count: achievements.length };
  }, [achievements]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
      case 'rare':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-600';
      case 'epic':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/50 dark:text-purple-200 dark:border-purple-600';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-600';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
    }
  };

  const getRarityDisplayName = (rarity: string) => {
    return t.rarity[rarity] || rarity;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'progress':
        return Trophy;
      case 'streak':
        return Zap;
      case 'achievement':
        return Award;
      case 'social':
        return Users;
      case 'special':
        return Crown;
      default:
        return Star;
    }
  };

  const getCategoryDisplayName = (category: string) => {
    return t.categories[category] || category;
  };

  const categories = ['all', 'progress', 'streak', 'achievement', 'social', 'special'];

  if (settings.is_collapsed) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-yellow-100 dark:bg-yellow-900/30 rounded">
              <Trophy className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="font-medium text-sm">
              {settings.custom_title || t.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
              {achievements.length} {t.labels.earned}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* Handle expand */}}
              className="h-6 w-6 p-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-yellow-950/20 dark:via-orange-950/20 dark:to-red-950/20 border-yellow-200 dark:border-yellow-800/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Trophy className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {settings.custom_title || t.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
            {achievementStats.count} {t.labels.earned}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllAchievements(!showAllAchievements)}
            className="h-8 w-8 p-0 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
          >
            <svg className={`w-4 h-4 transition-transform ${showAllAchievements ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-yellow-100 dark:border-yellow-800/30"
        >
          <div className="flex items-center justify-center mb-2">
            <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{achievementStats.count}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{spanishTranslations.formatting.total} {t.labels.earned}</div>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm border border-orange-100 dark:border-orange-800/30"
        >
          <div className="flex items-center justify-center mb-2">
            <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{achievementStats.totalXP}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{spanishTranslations.formatting.xp} {t.labels.earnedXP}</div>
        </motion.div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Logros Recientes
          </h4>
          <div className="space-y-2">
            {recentAchievements.slice(0, 3).map((achievement, index) => {
              const CategoryIcon = getCategoryIcon(achievement.category);
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.01, y: -1 }}
                  className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center gap-3 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-yellow-200 dark:hover:border-yellow-800/50 transition-all duration-200"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 200 }}
                    className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white shadow-sm"
                  >
                    <CategoryIcon className="w-5 h-5" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm text-gray-900 dark:text-white">{achievement.name}</h5>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getRarityColor(achievement.rarity)}`}
                      >
                        {getRarityDisplayName(achievement.rarity)}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{achievement.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-orange-600 dark:text-orange-400">
                      +{achievement.xp_reward} {spanishTranslations.formatting.xp}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(achievement.earned_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  {/* Celebration sparkles for recent achievements */}
                  {index === 0 && (
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 180, 360],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                      className="absolute -top-1 -right-1"
                    >
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rarity Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Crown className="w-4 h-4 text-purple-500" />
          Por Rareza
        </h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(achievementStats.byRarity).map(([rarity, count]) => (
            <motion.div
              key={rarity}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Badge
                variant="outline"
                className={`text-xs cursor-default ${getRarityColor(rarity)}`}
              >
                {getRarityDisplayName(rarity)}: {count}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>

      {/* All Achievements (Expandable) */}
      <AnimatePresence>
        {showAllAchievements && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const CategoryIcon = category === 'all' ? Star : getCategoryIcon(category);
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`text-xs ${
                      selectedCategory === category
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
                    }`}
                  >
                    <CategoryIcon className="w-3 h-3 mr-1" />
                    {category === 'all' ? 'Todos' : getCategoryDisplayName(category)}
                  </Button>
                );
              })}
            </div>

            {/* Achievement Grid */}
            <div className="grid grid-cols-1 gap-3">
              {filteredAchievements.map((achievement, index) => {
                const CategoryIcon = getCategoryIcon(achievement.category);
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.01, y: -2 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-yellow-400 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: index * 0.05 + 0.2, type: "spring", stiffness: 200 }}
                          className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white shadow-md"
                        >
                          <CategoryIcon className="w-6 h-6" />
                        </motion.div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-gray-900 dark:text-white">{achievement.name}</h5>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getRarityColor(achievement.rarity)}`}
                            >
                              {getRarityDisplayName(achievement.rarity)}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{achievement.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              +{achievement.xp_reward} {spanishTranslations.formatting.xp}
                            </span>
                            <span>•</span>
                            <span>{t.labels.unlockedOn} {new Date(achievement.earned_at).toLocaleDateString('es-ES')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredAchievements.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Star className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                </div>
                <p>No hay logros en esta categoría aún.</p>
                <p className="text-sm mt-1">¡Sigue aprendiendo para desbloquear más insignias!</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Actions */}
      <div className="mt-6 pt-4 border-t border-yellow-100 dark:border-yellow-800/30">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            {achievementStats.totalXP} {spanishTranslations.formatting.xp} {t.labels.earnedXP}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-yellow-200 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
          >
            {t.actions.viewAll}
          </Button>
        </div>
      </div>
    </Card>
  );
}