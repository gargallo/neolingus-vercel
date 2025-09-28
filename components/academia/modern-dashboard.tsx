"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

// Import UI components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Import dashboard widgets
import { ProgressOverviewWidget } from "./widgets/progress-overview-widget";
import { CourseCardsWidget } from "./widgets/course-cards-widget";
import { AchievementShowcaseWidget } from "./widgets/achievement-showcase-widget";
import { StudyAnalyticsWidget } from "./widgets/study-analytics-widget";
import { StreakTrackerWidget } from "./widgets/streak-tracker-widget";

// Import new hero section
import StudentHeroSection from "./student-hero-section";
import { spanishTranslations } from "@/lib/translations/spanish";

// Types
interface DashboardData {
  user_stats: {
    engagement: {
      total_login_days: number;
      current_streak: number;
      longest_streak: number;
      last_activity_at: string | null;
      session_count_today: number;
      total_study_minutes: number;
      weekly_study_minutes: number[];
    };
    achievements: {
      total_xp: number;
      current_level: number;
      badges_earned: Badge[];
      milestones_reached: string[];
      next_milestone: {
        id: string;
        progress: number;
        required_xp: number;
      };
    };
    preferences: any;
    dashboard_config: {
      layout: 'compact' | 'comfortable' | 'spacious';
      theme: 'light' | 'dark' | 'auto';
      widget_order: string[];
      hidden_widgets: string[];
      quick_actions: string[];
    };
    performance: any;
  };
  widgets: ConfiguredWidget[];
  recent_progress: any[];
  achievements: {
    total_xp: number;
    current_level: number;
    badges: Badge[];
    milestones: any[];
    streaks: {
      current: number;
      longest: number;
      weekly_streak: boolean;
      monthly_streak: boolean;
    };
  };
  theme: {
    theme: 'light' | 'dark' | 'auto';
    layout: 'compact' | 'comfortable' | 'spacious';
    animations_enabled: boolean;
    notifications_enabled: boolean;
    accent_color: string | null;
    font_size: 'small' | 'medium' | 'large';
    high_contrast: boolean;
  };
}

interface ConfiguredWidget {
  widget: {
    id: string;
    widget_type: string;
    config: any;
    metadata: any;
    default_settings: any;
    is_active: boolean;
  };
  preferences: {
    id: string;
    position: {
      row: number;
      column: number;
      span_rows: number;
      span_columns: number;
    };
    settings: {
      is_visible: boolean;
      is_collapsed: boolean;
      custom_title?: string;
      filters?: any;
      display_options?: any;
    };
  };
}

interface ModernDashboardProps {
  userId: string;
  initialData?: DashboardData;
  className?: string;
  demoMode?: boolean;
}

export function ModernDashboard({ userId, initialData, className = "", demoMode = false }: ModernDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  // Fetch user data
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, [supabase]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const isMobile = window.innerWidth < 768;
      const demoParam = demoMode ? '&demo=true' : '';
      const response = await fetch(`/api/dashboard/user/${userId}?mobile=${isMobile}${demoParam}`, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred');
      }

      setDashboardData(result.data);
      
      if (!showLoader && result.data) {
        toast.success('Dashboard refreshed');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, demoMode]);

  // Initial load
  useEffect(() => {
    if (!initialData) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, initialData]);

  // Refresh interval for live data
  useEffect(() => {
    const interval = setInterval(() => {
      if (!editMode) {
        fetchDashboardData(false);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchDashboardData, editMode]);

  // Handle widget visibility toggle
  const toggleWidgetVisibility = useCallback(async (widgetId: string, isVisible: boolean) => {
    if (!dashboardData) return;

    try {
      const updatedWidgets = dashboardData.widgets.map(w => {
        if (w.widget.id === widgetId) {
          return {
            ...w,
            preferences: {
              ...w.preferences,
              settings: {
                ...w.preferences.settings,
                is_visible: isVisible
              }
            }
          };
        }
        return w;
      });

      setDashboardData({
        ...dashboardData,
        widgets: updatedWidgets
      });

      // Save to server
      const response = await fetch(`/api/dashboard/widgets/${userId}/preferences`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          widget_id: widgetId,
          settings: { is_visible: isVisible }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update widget visibility');
      }

      toast.success(`Widget ${isVisible ? 'shown' : 'hidden'}`);

    } catch (err) {
      console.error('Widget visibility error:', err);
      toast.error('Failed to update widget');
      // Revert optimistic update
      fetchDashboardData(false);
    }
  }, [dashboardData, userId, fetchDashboardData]);

  // Handle layout change
  const changeLayout = useCallback(async (layout: 'compact' | 'comfortable' | 'spacious') => {
    if (!dashboardData) return;

    try {
      const response = await fetch(`/api/dashboard/user/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dashboard_config: { layout }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update layout');
      }

      setDashboardData({
        ...dashboardData,
        user_stats: {
          ...dashboardData.user_stats,
          dashboard_config: {
            ...dashboardData.user_stats.dashboard_config,
            layout
          }
        },
        theme: {
          ...dashboardData.theme,
          layout
        }
      });

      toast.success('Layout updated');

    } catch (err) {
      console.error('Layout change error:', err);
      toast.error('Failed to change layout');
    }
  }, [dashboardData, userId]);

  // Memoized widget components
  const widgetComponents = useMemo(() => {
    const components: Record<string, React.ComponentType<any>> = {
      'progress_overview': ProgressOverviewWidget,
      'course_cards': CourseCardsWidget,
      'achievement_showcase': AchievementShowcaseWidget,
      'study_analytics': StudyAnalyticsWidget,
      'streak_tracker': StreakTrackerWidget
    };
    return components;
  }, []);

  // Sort and filter widgets with fallback to default widgets
  const visibleWidgets = useMemo(() => {
    // If we have dashboard data with widgets, use it
    if (dashboardData?.widgets && dashboardData.widgets.length > 0) {
      return dashboardData.widgets
        .filter(w => w.preferences?.settings?.is_visible !== false)
        .sort((a, b) => {
          const aRow = a.preferences?.position?.row || 1;
          const bRow = b.preferences?.position?.row || 1;
          if (aRow !== bRow) return aRow - bRow;

          const aCol = a.preferences?.position?.column || 1;
          const bCol = b.preferences?.position?.column || 1;
          return aCol - bCol;
        });
    }

    // Fallback to default widgets when no data is available
    const defaultWidgets = [
      {
        widget: {
          id: 'default-progress',
          widget_type: 'progress_overview',
          config: { title: 'Learning Progress', size: 'large' },
          metadata: { category: 'progress' },
          default_settings: { is_visible: true },
          is_active: true
        },
        preferences: {
          position: { row: 1, column: 1 },
          settings: { is_visible: true, is_collapsed: false }
        }
      },
      {
        widget: {
          id: 'default-courses',
          widget_type: 'course_cards',
          config: { title: 'Active Courses', size: 'medium' },
          metadata: { category: 'courses' },
          default_settings: { is_visible: true },
          is_active: true
        },
        preferences: {
          position: { row: 1, column: 2 },
          settings: { is_visible: true, is_collapsed: false }
        }
      },
      {
        widget: {
          id: 'default-achievements',
          widget_type: 'achievement_showcase',
          config: { title: 'Recent Achievements', size: 'medium' },
          metadata: { category: 'achievements' },
          default_settings: { is_visible: true },
          is_active: true
        },
        preferences: {
          position: { row: 2, column: 1 },
          settings: { is_visible: true, is_collapsed: false }
        }
      },
      {
        widget: {
          id: 'default-streak',
          widget_type: 'streak_tracker',
          config: { title: 'Study Streak', size: 'medium' },
          metadata: { category: 'progress' },
          default_settings: { is_visible: true },
          is_active: true
        },
        preferences: {
          position: { row: 2, column: 2 },
          settings: { is_visible: true, is_collapsed: false }
        }
      }
    ];

    return defaultWidgets;
  }, [dashboardData?.widgets]);

  // Layout spacing based on user preference
  const layoutClasses = useMemo(() => {
    const layout = dashboardData?.theme?.layout || 'comfortable';
    const baseClasses = "grid gap-6 auto-rows-min";
    
    switch (layout) {
      case 'compact':
        return `${baseClasses} gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
      case 'spacious':
        return `${baseClasses} gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
      default: // comfortable
        return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
    }
  }, [dashboardData?.theme?.layout]);

  // Loading skeleton
  if (isLoading && !dashboardData) {
    return (
      <div className={`max-w-7xl mx-auto p-6 ${className}`}>
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </Card>
            ))}
          </div>
          
          {/* Widgets skeleton */}
          <div className={layoutClasses}>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-32 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className={`max-w-7xl mx-auto p-6 ${className}`}>
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="text-red-600 text-lg font-medium">
              Failed to load dashboard
            </div>
            <p className="text-gray-600">{error}</p>
            <Button 
              onClick={() => fetchDashboardData()}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { user_stats, achievements } = dashboardData;

  // Prepare hero section stats
  const heroStats = {
    coursesActive: visibleWidgets.filter(w => w.widget.widget_type === 'course_cards').length || 2,
    studyStreak: achievements?.streaks?.current || user_stats?.engagement?.current_streak || 0,
    nextExam: {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      course: "Inglés B2",
      provider: "EOI"
    },
    totalProgress: Math.round((achievements?.current_level || 1) * 20) || 45,
    hoursStudied: Math.round((user_stats?.engagement?.total_study_minutes || 0) / 60),
    achievementsUnlocked: achievements?.badges?.length || 6
  };

  return (
    <div className={`max-w-7xl mx-auto space-y-8 ${className}`}>
      {/* Student Hero Section */}
      <StudentHeroSection
        user={user}
        stats={heroStats}
        onAction={(action) => {
          // Handle hero section actions
          console.log('Hero action:', action);
        }}
      />

      {/* Dashboard Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6"
      >
        
        <div className="flex items-center gap-3">
          {/* Layout selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['compact', 'comfortable', 'spacious'] as const).map((layoutOption) => (
              <Button
                key={layoutOption}
                variant={dashboardData.theme.layout === layoutOption ? "default" : "ghost"}
                size="sm"
                onClick={() => changeLayout(layoutOption)}
                className="text-xs"
              >
                {spanishTranslations.dashboard.layout[layoutOption]}
              </Button>
            ))}
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(false)}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.div>
            {isRefreshing ? spanishTranslations.status.loading : spanishTranslations.actions.refresh}
          </Button>
        </div>
      </motion.div>

      {/* Quick Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Current Level */}
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-700">
                Level {achievements.current_level}
              </div>
              <div className="text-sm text-blue-600">Current Level</div>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <Progress 
              value={(achievements.total_xp % 100)} 
              className="h-2"
            />
            <div className="text-xs text-blue-600 mt-1">
              {achievements.total_xp} XP total
            </div>
          </div>
        </Card>

        {/* Current Streak */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-700">
                {user_stats.engagement.current_streak}
              </div>
              <div className="text-sm text-orange-600">Day Streak</div>
            </div>
            <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
              </svg>
            </div>
          </div>
          <div className="text-xs text-orange-600 mt-2">
            Longest: {user_stats.engagement.longest_streak} days
          </div>
        </Card>

        {/* Study Time */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-700">
                {Math.round(user_stats.engagement.total_study_minutes / 60)}h
              </div>
              <div className="text-sm text-green-600">Total Study Time</div>
            </div>
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-xs text-green-600 mt-2">
            This week: {user_stats.engagement.weekly_study_minutes.reduce((a, b) => a + b, 0)} min
          </div>
        </Card>

        {/* Achievements */}
        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-700">
                {achievements.badges.length}
              </div>
              <div className="text-sm text-purple-600">Badges Earned</div>
            </div>
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 15.39l-3.76 2.27.99-4.28L5.82 10.08l4.4-.38L12 5.37l1.78 4.33 4.4.38-3.41 3.3.99 4.28z"/>
              </svg>
            </div>
          </div>
          <div className="text-xs text-purple-600 mt-2">
            Milestones: {achievements.milestones.length}
          </div>
        </Card>
      </motion.div>

      {/* Widgets Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={layoutClasses}
      >
        <AnimatePresence>
          {visibleWidgets.map((configuredWidget, index) => {
            const WidgetComponent = widgetComponents[configuredWidget.widget.widget_type];
            
            if (!WidgetComponent) {
              return (
                <motion.div
                  key={configuredWidget.widget.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="text-center text-gray-500">
                      <p>Unknown widget: {configuredWidget.widget.widget_type}</p>
                    </div>
                  </Card>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={configuredWidget.widget.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className={`${configuredWidget.preferences.position?.span_columns > 1 ? 'md:col-span-2' : ''} ${configuredWidget.preferences.position?.span_rows > 1 ? 'row-span-2' : ''}`}
              >
                <WidgetComponent
                  config={configuredWidget.widget.config}
                  settings={configuredWidget.preferences.settings}
                  dashboardData={dashboardData}
                  userId={userId}
                  demoMode={demoMode}
                  onToggleVisibility={(isVisible: boolean) => 
                    toggleWidgetVisibility(configuredWidget.widget.id, isVisible)
                  }
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty state if no widgets */}
      {visibleWidgets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Card className="p-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">No widgets to display</h3>
              <p className="text-gray-600">All dashboard widgets are currently hidden.</p>
              <Button onClick={() => fetchDashboardData()}>
                Reset Dashboard
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}