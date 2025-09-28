"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface StudyAnalyticsWidgetProps {
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

export function StudyAnalyticsWidget({ 
  config, 
  settings, 
  dashboardData, 
  userId,
  demoMode = false,
  onToggleVisibility 
}: StudyAnalyticsWidgetProps) {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'time' | 'sessions' | 'scores'>('time');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/dashboard/analytics/${userId}?timeframe=${timeframe}&metrics=engagement,performance`);
        if (response.ok) {
          const result = await response.json();
          setAnalyticsData(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId, timeframe]);

  // Calculate analytics metrics
  const metrics = useMemo(() => {
    if (!analyticsData || !dashboardData) {
      return null;
    }

    const { user_stats } = dashboardData;
    const { engagement_trend, performance_metrics } = analyticsData;

    // Time-based metrics
    const totalMinutes = user_stats?.engagement?.total_study_minutes || 0;
    const weeklyMinutes = user_stats?.engagement?.weekly_study_minutes || [0,0,0,0,0,0,0];
    const thisWeekMinutes = weeklyMinutes.reduce((sum: number, minutes: number) => sum + minutes, 0);
    const dailyAverage = thisWeekMinutes / 7;
    const dailyGoal = user_stats?.preferences?.study_goal_minutes_daily || 30;
    const goalProgress = (dailyAverage / dailyGoal) * 100;

    // Session metrics
    const totalSessions = engagement_trend?.reduce((sum: number, day: any) => sum + day.sessions, 0) || 0;
    const avgSessionsPerDay = totalSessions / (engagement_trend?.length || 1);
    const bestDay = engagement_trend?.reduce((best: any, day: any) => 
      day.sessions > (best?.sessions || 0) ? day : best, null
    );

    // Performance metrics
    const averageScore = performance_metrics?.average_score || 0;
    const improvementRate = performance_metrics?.improvement_rate || 0;
    const strongAreas = performance_metrics?.strong_areas || [];
    const weakAreas = performance_metrics?.weak_areas || [];

    // Weekly pattern analysis
    const weeklyPattern = weeklyMinutes.map((minutes, dayIndex) => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        day: dayNames[dayIndex],
        minutes,
        percentage: minutes > 0 ? (minutes / Math.max(...weeklyMinutes)) * 100 : 0,
        isToday: dayIndex === new Date().getDay()
      };
    });

    return {
      totalMinutes,
      thisWeekMinutes,
      dailyAverage,
      goalProgress,
      totalSessions,
      avgSessionsPerDay,
      bestDay,
      averageScore,
      improvementRate,
      strongAreas,
      weakAreas,
      weeklyPattern,
      engagement_trend: engagement_trend || []
    };
  }, [analyticsData, dashboardData]);

  // Chart data for visualization
  const chartData = useMemo(() => {
    if (!metrics) return null;

    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        day: date.getDate(),
        value: Math.random() * (selectedMetric === 'time' ? 60 : selectedMetric === 'sessions' ? 5 : 100)
      };
    });

    return days;
  }, [metrics, selectedMetric]);

  if (settings.is_collapsed) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">
            {settings.custom_title || config.title}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {Math.round((metrics?.thisWeekMinutes || 0) / 60)}h this week
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

  if (isLoading || !metrics) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {settings.custom_title || config.title}
        </h3>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 border-green-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {settings.custom_title || config.title}
        </h3>
        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-white rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((option) => (
              <Button
                key={option}
                variant={timeframe === option ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeframe(option)}
                className="text-xs px-3"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Study Time</h4>
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-green-600 mb-1">
            {Math.round(metrics.thisWeekMinutes / 60)}h
          </div>
          <div className="text-xs text-gray-600">
            This week • {Math.round(metrics.dailyAverage)} min/day avg
          </div>
          <div className="mt-2">
            <Progress value={metrics.goalProgress} className="h-1" />
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(metrics.goalProgress)}% of daily goal
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Sessions</h4>
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {metrics.totalSessions}
          </div>
          <div className="text-xs text-gray-600">
            Total sessions • {metrics.avgSessionsPerDay.toFixed(1)}/day avg
          </div>
          {metrics.bestDay && (
            <div className="text-xs text-green-600 mt-2">
              Best day: {metrics.bestDay.sessions} sessions
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">Performance</h4>
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {Math.round(metrics.averageScore)}%
          </div>
          <div className="text-xs text-gray-600">
            Average score
          </div>
          <div className={`text-xs mt-2 ${metrics.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {metrics.improvementRate >= 0 ? '↗' : '↘'} {Math.abs(metrics.improvementRate).toFixed(1)}% trend
          </div>
        </div>
      </div>

      {/* Weekly Pattern */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Weekly Study Pattern</h4>
        <div className="bg-white rounded-lg p-4">
          <div className="grid grid-cols-7 gap-2">
            {metrics.weeklyPattern.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`text-center p-2 rounded-lg ${
                  day.isToday 
                    ? 'bg-blue-100 border-2 border-blue-300' 
                    : 'bg-gray-50'
                }`}
              >
                <div className="text-xs font-medium text-gray-600 mb-2">
                  {day.day}
                </div>
                <div className="h-12 bg-gray-100 rounded relative overflow-hidden">
                  <motion.div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-green-400 to-blue-400"
                    initial={{ height: 0 }}
                    animate={{ height: `${day.percentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  />
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {day.minutes}m
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Study Trend Chart */}
      {chartData && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Study Trend</h4>
            <div className="flex items-center gap-1 bg-white rounded-lg p-1">
              {(['time', 'sessions', 'scores'] as const).map((metric) => (
                <Button
                  key={metric}
                  variant={selectedMetric === metric ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedMetric(metric)}
                  className="text-xs px-3"
                >
                  {metric}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="h-32 flex items-end justify-between gap-1">
              {chartData.map((point, index) => (
                <motion.div
                  key={point.date}
                  initial={{ height: 0 }}
                  animate={{ height: `${(point.value / Math.max(...chartData.map(p => p.value))) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.02 }}
                  className="bg-gradient-to-t from-blue-400 to-green-400 rounded-sm min-w-[3px] flex-1"
                  title={`${point.date}: ${Math.round(point.value)}${
                    selectedMetric === 'time' ? ' min' : 
                    selectedMetric === 'sessions' ? ' sessions' : '%'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      )}

      {/* Skills Analysis */}
      {(metrics.strongAreas.length > 0 || metrics.weakAreas.length > 0) && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Skills Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.strongAreas.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h5 className="text-sm font-medium text-green-800 mb-2">
                  💪 Strong Areas
                </h5>
                <div className="flex flex-wrap gap-1">
                  {metrics.strongAreas.slice(0, 3).map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {metrics.weakAreas.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h5 className="text-sm font-medium text-orange-800 mb-2">
                  🎯 Focus Areas
                </h5>
                <div className="flex flex-wrap gap-1">
                  {metrics.weakAreas.slice(0, 3).map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Total: {Math.round(metrics.totalMinutes / 60)}h of study time
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export Data
          </Button>
          <Button size="sm">
            Detailed Analytics
          </Button>
        </div>
      </div>
    </Card>
  );
}