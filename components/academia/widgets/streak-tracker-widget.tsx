"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StreakTrackerWidgetProps {
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

export function StreakTrackerWidget({ 
  config, 
  settings, 
  dashboardData, 
  userId,
  demoMode = false,
  onToggleVisibility 
}: StreakTrackerWidgetProps) {
  const { user_stats } = dashboardData;

  // Calculate streak data
  const streakData = useMemo(() => {
    const currentStreak = user_stats?.engagement?.current_streak || 0;
    const longestStreak = user_stats?.engagement?.longest_streak || 0;
    const lastActivity = user_stats?.engagement?.last_activity_at;
    const todaySessions = user_stats?.engagement?.session_count_today || 0;

    // Calculate streak status
    let streakStatus: {
      level: 'cold' | 'warming' | 'hot' | 'fire' | 'legendary';
      message: string;
      color: string;
      emoji: string;
    };

    if (currentStreak === 0) {
      streakStatus = {
        level: 'cold',
        message: 'Ready to start your streak?',
        color: 'text-gray-600',
        emoji: '❄️'
      };
    } else if (currentStreak < 3) {
      streakStatus = {
        level: 'warming',
        message: 'Building momentum!',
        color: 'text-blue-600',
        emoji: '🌡️'
      };
    } else if (currentStreak < 7) {
      streakStatus = {
        level: 'hot',
        message: 'You\'re on fire!',
        color: 'text-orange-600',
        emoji: '🔥'
      };
    } else if (currentStreak < 30) {
      streakStatus = {
        level: 'fire',
        message: 'Incredible dedication!',
        color: 'text-red-600',
        emoji: '🚀'
      };
    } else {
      streakStatus = {
        level: 'legendary',
        message: 'Legendary commitment!',
        color: 'text-purple-600',
        emoji: '👑'
      };
    }

    // Generate activity calendar (last 30 days)
    const activityCalendar = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      // Mock activity data - in real app, this would come from the database
      const hasActivity = i < currentStreak + Math.floor(Math.random() * 10) || Math.random() > 0.6;
      
      return {
        date: date.toISOString().split('T')[0],
        hasActivity,
        dayOfWeek: date.getDay(),
        dayOfMonth: date.getDate()
      };
    });

    // Calculate weekly streak pattern
    const weeklyPattern = Array.from({ length: 7 }, (_, i) => {
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];
      const activeDays = activityCalendar.filter(day => day.dayOfWeek === i && day.hasActivity).length;
      const totalDays = activityCalendar.filter(day => day.dayOfWeek === i).length;
      
      return {
        day: dayName,
        percentage: (activeDays / totalDays) * 100,
        activeDays,
        totalDays
      };
    });

    // Next milestone
    const nextMilestone = currentStreak < 7 ? 7 : 
                         currentStreak < 30 ? 30 : 
                         currentStreak < 100 ? 100 : 365;

    const milestoneProgress = (currentStreak / nextMilestone) * 100;

    return {
      currentStreak,
      longestStreak,
      lastActivity,
      todaySessions,
      streakStatus,
      activityCalendar,
      weeklyPattern,
      nextMilestone,
      milestoneProgress
    };
  }, [user_stats]);

  if (settings.is_collapsed) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">
            {settings.custom_title || config.title}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-lg">{streakData.streakStatus.emoji}</span>
            <Badge variant="secondary" className="text-xs">
              {streakData.currentStreak}d
            </Badge>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 border-orange-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {settings.custom_title || config.title}
        </h3>
        <div className="text-2xl">{streakData.streakStatus.emoji}</div>
      </div>

      {/* Current Streak Display */}
      <div className="text-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-block"
        >
          <div className={`text-5xl font-bold ${streakData.streakStatus.color} mb-2`}>
            {streakData.currentStreak}
          </div>
          <div className="text-sm text-gray-600 mb-1">Day Streak</div>
          <div className={`text-sm font-medium ${streakData.streakStatus.color}`}>
            {streakData.streakStatus.message}
          </div>
        </motion.div>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-600">
            {streakData.longestStreak}
          </div>
          <div className="text-xs text-gray-600">Best Streak</div>
        </div>
        <div className="bg-white rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-600">
            {streakData.todaySessions}
          </div>
          <div className="text-xs text-gray-600">Today</div>
        </div>
      </div>

      {/* Activity Calendar (Last 30 days) */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Last 30 Days</h4>
        <div className="grid grid-cols-6 gap-1">
          {streakData.activityCalendar.map((day, index) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className={`aspect-square rounded-sm flex items-center justify-center text-xs ${
                day.hasActivity 
                  ? 'bg-orange-400 text-white' 
                  : 'bg-gray-100 text-gray-400'
              }`}
              title={`${day.date}: ${day.hasActivity ? 'Active' : 'No activity'}`}
            >
              {day.dayOfMonth}
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Weekly Pattern */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Pattern</h4>
        <div className="grid grid-cols-7 gap-1">
          {streakData.weeklyPattern.map((day, index) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-xs font-medium text-gray-600 mb-1">
                {day.day}
              </div>
              <div className="h-8 bg-gray-100 rounded-full relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-t from-orange-400 to-red-400 transition-all duration-500"
                  style={{ height: `${day.percentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(day.percentage)}%
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Next Milestone */}
      {streakData.nextMilestone > streakData.currentStreak && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Next Milestone: {streakData.nextMilestone} Days
          </h4>
          <div className="bg-white rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Progress</span>
              <span className="text-sm font-medium text-gray-900">
                {streakData.currentStreak} / {streakData.nextMilestone}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${streakData.milestoneProgress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              {streakData.nextMilestone - streakData.currentStreak} days to go
            </div>
          </div>
        </div>
      )}

      {/* Motivation Section */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="text-center">
          <div className="text-sm font-medium text-gray-900 mb-2">
            {streakData.currentStreak === 0 ? 'Start Your Journey' :
             streakData.todaySessions > 0 ? 'Keep It Going!' :
             'Don\'t Break the Chain!'}
          </div>
          <p className="text-xs text-gray-600 mb-3">
            {streakData.currentStreak === 0 ? 
              'Complete one lesson today to start your learning streak.' :
              streakData.todaySessions > 0 ?
              'Great work today! Your streak is safe.' :
              'Complete a lesson today to maintain your streak.'}
          </p>
          
          {streakData.todaySessions === 0 && (
            <Button size="sm" className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Learning
            </Button>
          )}
          
          {streakData.todaySessions > 0 && (
            <Button variant="outline" size="sm" className="w-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Streak Safe for Today
            </Button>
          )}
        </div>
      </div>

      {/* Fun Facts */}
      {streakData.currentStreak > 0 && (
        <div className="text-center">
          <div className="text-xs text-gray-500">
            🏆 You've learned {streakData.currentStreak} days in a row!{' '}
            {streakData.currentStreak >= 7 && (
              <span>That's {Math.floor(streakData.currentStreak / 7)} week{Math.floor(streakData.currentStreak / 7) !== 1 ? 's' : ''}!</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}