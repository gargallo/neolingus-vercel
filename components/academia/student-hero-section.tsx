"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Target,
  Trophy,
  TrendingUp,
  Calendar,
  Flame,
  Star,
  Award,
  ChevronRight,
  Play,
  BarChart3,
  Clock
} from 'lucide-react';
import { spanishTranslations } from '@/lib/translations/spanish';

interface DashboardStats {
  coursesActive: number;
  studyStreak: number;
  nextExam?: {
    date: string;
    course: string;
    provider: string;
  };
  totalProgress: number;
  hoursStudied: number;
  achievementsUnlocked: number;
}

interface StudentHeroSectionProps {
  user?: {
    name?: string;
    firstName?: string;
  };
  stats: DashboardStats;
  onAction?: (action: string) => void;
  className?: string;
}

const StudentHeroSection: React.FC<StudentHeroSectionProps> = ({
  user,
  stats,
  onAction,
  className = ""
}) => {
  const [currentMotivation, setCurrentMotivation] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const { hero } = spanishTranslations;

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentMotivation((prev) =>
        (prev + 1) % hero.motivationalMessages.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [hero.motivationalMessages.length]);

  const userName = user?.firstName || user?.name || 'Estudiante';

  const quickStats = [
    {
      icon: BookOpen,
      value: stats.coursesActive,
      label: hero.stats.coursesActive,
      color: 'student-primary',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Flame,
      value: stats.studyStreak,
      label: hero.stats.studyStreak,
      color: 'student-celebration',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      iconColor: 'text-orange-500 dark:text-orange-400',
      suffix: ' días'
    },
    {
      icon: Calendar,
      value: stats.nextExam ? new Date(stats.nextExam.date).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      }) : 'N/A',
      label: hero.stats.nextExam,
      color: 'student-secondary',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      iconColor: 'text-green-600 dark:text-green-400',
      isDate: true
    },
    {
      icon: TrendingUp,
      value: `${stats.totalProgress}%`,
      label: hero.stats.totalProgress,
      color: 'student-success',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      iconColor: 'text-purple-600 dark:text-purple-400'
    }
  ];

  const quickActions = [
    {
      label: hero.quickActions.continueStudying,
      icon: Play,
      action: 'continue-studying',
      isPrimary: true,
      bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
      textColor: 'text-white'
    },
    {
      label: hero.quickActions.nextExam,
      icon: Target,
      action: 'next-exam',
      isPrimary: false,
      bgColor: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700',
      textColor: 'text-gray-700 dark:text-gray-300'
    },
    {
      label: hero.quickActions.viewProgress,
      icon: BarChart3,
      action: 'view-progress',
      isPrimary: false,
      bgColor: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700',
      textColor: 'text-gray-700 dark:text-gray-300'
    }
  ];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20" />
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-10" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">

          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="xl:col-span-2 space-y-6"
          >
            {/* Main Welcome */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="space-y-2"
              >
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                  ¡Bienvenido de vuelta,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    {userName}
                  </span>!
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 font-medium">
                  {hero.subtitle}
                </p>
              </motion.div>

              {/* Motivational Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="relative h-12 overflow-hidden"
              >
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentMotivation}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 flex items-center text-gray-500 dark:text-gray-400 text-sm sm:text-base italic"
                  >
                    "{hero.motivationalMessages[currentMotivation]}"
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-wrap gap-3 sm:gap-4"
            >
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.action}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAction?.(action.action)}
                  className={`
                    group flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium
                    shadow-sm hover:shadow-md transition-all duration-200
                    ${action.bgColor} ${action.textColor}
                  `}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                >
                  <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{action.label}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 xl:grid-cols-1 gap-4"
          >
            {quickStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`
                  relative p-4 sm:p-6 rounded-xl shadow-sm border
                  bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                  border-gray-200 dark:border-gray-700
                  hover:shadow-md transition-all duration-200
                  group overflow-hidden
                `}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 ${stat.bgColor} opacity-50 group-hover:opacity-70 transition-opacity duration-200`} />

                {/* Content */}
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                    </div>
                    {stat.label === hero.stats.studyStreak && stats.studyStreak > 0 && (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-orange-500"
                      >
                        <Flame className="w-4 h-4" />
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {typeof stat.value === 'number' && !stat.isDate
                          ? stat.value.toLocaleString('es-ES')
                          : stat.value
                        }
                      </span>
                      {stat.suffix && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {stat.suffix}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>

                {/* Achievement Badge */}
                {stat.label === hero.stats.totalProgress && stats.totalProgress >= 80 && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                    className="absolute top-2 right-2"
                  >
                    <div className="flex items-center justify-center w-6 h-6 bg-yellow-400 rounded-full">
                      <Star className="w-3 h-3 text-yellow-800" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}

            {/* Next Exam Details */}
            {stats.nextExam && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="xl:col-span-1 col-span-2 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      Próximo Examen
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {stats.nextExam.course}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stats.nextExam.provider} • {new Date(stats.nextExam.date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StudentHeroSection;