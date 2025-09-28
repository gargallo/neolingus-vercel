"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { spanishTranslations } from "@/lib/translations/spanish";
import { TrendingUp, Flame, Clock, Play, BarChart3, Target, Calendar } from "lucide-react";

interface ProgressOverviewWidgetProps {
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

export function ProgressOverviewWidget({ 
  config, 
  settings, 
  dashboardData, 
  userId,
  demoMode = false,
  onToggleVisibility 
}: ProgressOverviewWidgetProps) {
  const { user_stats, achievements } = dashboardData;
  const { progress: t } = spanishTranslations;

  // Calculate progress metrics
  const progressMetrics = useMemo(() => {
    const currentLevel = achievements?.current_level || 1;
    const totalXP = achievements?.total_xp || 0;
    const currentStreak = user_stats?.engagement?.current_streak || 0;
    const studyMinutes = user_stats?.engagement?.total_study_minutes || 0;
    
    // Calculate level progress (XP to next level)
    const baseXPForLevel = 100;
    const xpForCurrentLevel = Math.floor(baseXPForLevel * Math.pow(1.2, currentLevel - 1));
    const xpForNextLevel = Math.floor(baseXPForLevel * Math.pow(1.2, currentLevel));
    const xpInCurrentLevel = totalXP - Array.from({ length: currentLevel - 1 }, (_, i) => 
      Math.floor(baseXPForLevel * Math.pow(1.2, i))
    ).reduce((sum, xp) => sum + xp, 0);
    
    const levelProgress = (xpInCurrentLevel / (xpForNextLevel - xpForCurrentLevel)) * 100;
    
    // Weekly study goal progress
    const weeklyStudyMinutes = user_stats?.engagement?.weekly_study_minutes || [0,0,0,0,0,0,0];
    const thisWeekMinutes = weeklyStudyMinutes.reduce((sum: number, minutes: number) => sum + minutes, 0);
    const dailyGoal = user_stats?.preferences?.study_goal_minutes_daily || 30;
    const weeklyGoal = dailyGoal * 7;
    const weeklyProgress = Math.min((thisWeekMinutes / weeklyGoal) * 100, 100);
    
    return {
      currentLevel,
      totalXP,
      levelProgress: Math.min(levelProgress, 100),
      xpToNextLevel: xpForNextLevel - totalXP,
      currentStreak,
      longestStreak: user_stats?.engagement?.longest_streak || 0,
      studyHours: Math.round(studyMinutes / 60),
      thisWeekMinutes,
      weeklyProgress,
      weeklyGoal: Math.round(weeklyGoal / 60) // in hours
    };
  }, [achievements, user_stats]);

  // Get streak status and motivation
  const streakStatus = useMemo(() => {
    const streak = progressMetrics.currentStreak;
    if (streak === 0) {
      return { status: 'start', message: '¡Comienza tu racha de aprendizaje!', color: 'gray' };
    } else if (streak < 3) {
      return { status: 'building', message: '¡Construyendo impulso!', color: 'blue' };
    } else if (streak < 7) {
      return { status: 'strong', message: '¡Racha sólida!', color: 'green' };
    } else if (streak < 30) {
      return { status: 'excellent', message: '¡Excelente constancia!', color: 'purple' };
    } else {
      return { status: 'legendary', message: '¡Dedicación legendaria!', color: 'yellow' };
    }
  }, [progressMetrics.currentStreak]);

  if (settings.is_collapsed) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded">
              <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-medium text-sm">
              {settings.custom_title || t.title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
              {spanishTranslations.formatting.level} {progressMetrics.currentLevel}
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
    <Card className="p-6 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-green-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 border-green-200 dark:border-green-800/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {settings.custom_title || t.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* Handle settings */}}
            className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Level Progress Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {progressMetrics.currentLevel}
                </span>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{spanishTranslations.formatting.level} {progressMetrics.currentLevel}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{progressMetrics.totalXP} {spanishTranslations.formatting.xp} {spanishTranslations.formatting.total}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Siguiente Nivel
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {progressMetrics.xpToNextLevel} {spanishTranslations.formatting.xp} restantes
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>{spanishTranslations.formatting.level} {progressMetrics.currentLevel}</span>
              <span>{Math.round(progressMetrics.levelProgress)}%</span>
              <span>{spanishTranslations.formatting.level} {progressMetrics.currentLevel + 1}</span>
            </div>
            <Progress 
              value={progressMetrics.levelProgress} 
              className="h-3 bg-gray-200"
              style={{
                background: 'linear-gradient(to right, #3B82F6, #8B5CF6)'
              }}
            />
          </div>
        </motion.div>

        {/* Streak Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.01 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                streakStatus.color === 'gray' ? 'bg-gray-100' :
                streakStatus.color === 'blue' ? 'bg-blue-100' :
                streakStatus.color === 'green' ? 'bg-green-100' :
                streakStatus.color === 'purple' ? 'bg-purple-100' :
                'bg-yellow-100'
              }`}>
                <svg className={`w-5 h-5 ${
                  streakStatus.color === 'gray' ? 'text-gray-500' :
                  streakStatus.color === 'blue' ? 'text-blue-600' :
                  streakStatus.color === 'green' ? 'text-green-600' :
                  streakStatus.color === 'purple' ? 'text-purple-600' :
                  'text-yellow-600'
                }`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {progressMetrics.currentStreak} {spanishTranslations.time.days} de Racha
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{streakStatus.message}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Mejor</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {progressMetrics.longestStreak} {spanishTranslations.time.days}
              </div>
            </div>
          </div>
          
          {/* Streak visualization - last 7 days */}
          <div className="flex justify-between items-center mt-3">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
              const hasActivity = index < progressMetrics.currentStreak || Math.random() > 0.3;
              return (
                <div key={`${day}-${index}`} className="text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                    hasActivity 
                      ? 'bg-orange-100 text-orange-700 border-2 border-orange-300' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {hasActivity ? '🔥' : '○'}
                  </div>
                  <div className="text-xs text-gray-500">{day}</div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Weekly Study Goal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.01 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">{t.goals.weeklyGoal}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round(progressMetrics.thisWeekMinutes / 60)}h / {progressMetrics.weeklyGoal}h {spanishTranslations.time.thisWeek}
                </div>
              </div>
            </div>
            <Badge 
              variant={progressMetrics.weeklyProgress >= 100 ? "default" : "secondary"}
              className="text-xs"
            >
              {Math.round(progressMetrics.weeklyProgress)}%
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={progressMetrics.weeklyProgress} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-600">
              <span>0h</span>
              <span>{progressMetrics.weeklyGoal}h goal</span>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white">
            <Play className="w-4 h-4 mr-2" />
            {spanishTranslations.actions.start} Sesión
          </Button>
          <Button variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-300 dark:hover:bg-green-900/30">
            <BarChart3 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}