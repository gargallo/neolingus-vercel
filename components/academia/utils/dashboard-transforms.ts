/**
 * Dashboard Data Transformation Utilities
 *
 * Comprehensive utility functions for transforming raw course and progress data
 * into formats suitable for the new dashboard components. These utilities handle
 * data validation, type safety, and performance optimization for the academia
 * dashboard system.
 *
 * @author Claude Code
 * @version 1.0.0
 * @since 2025-09-17
 */

import {
  StatCard,
  Activity,
  QuickAction,
  RawDashboardData,
  TransformedDashboardData,
  DataTransformer,
  TransformOptions
} from '../types/dashboard-interfaces';

import {
  CourseComponent,
  ComponentProgress,
  UserCourseProgress,
  ExamSession,
  ProgressValue
} from '../../../lib/types/academia';

import {
  getCachedStats,
  getCachedActivities,
  getCachedProgress,
  generateStatsKey,
  generateActivitiesKey,
  generateProgressKey
} from '../../../lib/utils/dashboard-cache';

import {
  Clock,
  Trophy,
  Target,
  TrendingUp,
  BookOpen,
  Award,
  Play,
  User,
  Users,
  Calendar,
  CheckCircle,
  Star,
  Zap,
  BarChart3
} from 'lucide-react';

// =============================================================================
// CORE TRANSFORMATION FUNCTIONS
// =============================================================================

/**
 * Transform course data, progress, and exam sessions into dashboard statistics
 *
 * @param courseData - Course information and metadata
 * @param progress - User progress data with component breakdown
 * @param examSessions - Array of completed exam sessions
 * @param options - Optional transformation settings
 * @returns Array of StatCard objects for dashboard display
 */
export function transformStats(
  courseData: any,
  progress: UserCourseProgress | null,
  examSessions: ExamSession[],
  options: Partial<TransformOptions> = {}
): StatCard[] {
  // Use caching for expensive transformations
  const cacheKey = generateStatsKey(
    courseData?.id || 'unknown',
    progress,
    examSessions.length
  );

  return getCachedStats(cacheKey, () => {
    const stats: StatCard[] = [];

    try {
    // Overall Progress Stat
    const overallProgress = calculateProgressPercentage(progress?.component_progress);
    stats.push({
      id: 'overall-progress',
      label: 'Overall Progress',
      value: overallProgress,
      displayValue: `${overallProgress}%`,
      change: {
        value: progress?.analytics?.weekly_progress_rate || 0,
        direction: (progress?.analytics?.weekly_progress_rate || 0) >= 0 ? 'up' : 'down',
        period: 'vs last week'
      },
      icon: Target,
      variant: overallProgress >= 80 ? 'success' : overallProgress >= 60 ? 'info' : 'warning',
      ariaLabel: `Overall course progress: ${overallProgress} percent`
    });

    // Completed Exams Stat
    const completedExams = examSessions.filter(session => session.is_completed).length;
    const totalExams = courseData?.totalExams || examSessions.length || 0;
    stats.push({
      id: 'completed-exams',
      label: 'Completed Exams',
      value: completedExams,
      displayValue: `${completedExams}/${totalExams}`,
      change: {
        value: completedExams,
        direction: completedExams > 0 ? 'up' : 'stable',
        period: 'this session'
      },
      icon: CheckCircle,
      variant: completedExams >= totalExams * 0.8 ? 'success' : 'default',
      ariaLabel: `Completed ${completedExams} out of ${totalExams} exams`
    });

    // Average Score Stat
    const averageScore = calculateAverageScore(examSessions);
    stats.push({
      id: 'average-score',
      label: 'Average Score',
      value: averageScore,
      displayValue: `${averageScore}%`,
      change: {
        value: calculateScoreImprovement(examSessions),
        direction: calculateScoreImprovement(examSessions) >= 0 ? 'up' : 'down',
        period: 'recent sessions'
      },
      icon: Trophy,
      variant: averageScore >= 85 ? 'success' : averageScore >= 70 ? 'info' : 'warning',
      ariaLabel: `Average exam score: ${averageScore} percent`
    });

    // Study Hours Stat
    const studyHours = calculateTotalStudyHours(examSessions);
    stats.push({
      id: 'study-hours',
      label: 'Study Hours',
      value: studyHours,
      displayValue: `${studyHours}h`,
      change: {
        value: calculateWeeklyStudyHours(examSessions),
        direction: calculateWeeklyStudyHours(examSessions) > 0 ? 'up' : 'stable',
        period: 'this week'
      },
      icon: Clock,
      variant: studyHours >= 10 ? 'success' : 'default',
      ariaLabel: `Total study time: ${studyHours} hours`
    });

    // Readiness Score (if available)
    if (progress?.readiness_score !== undefined) {
      const readinessScore = Math.round(progress.readiness_score * 100);
      stats.push({
        id: 'readiness-score',
        label: 'Exam Readiness',
        value: readinessScore,
        displayValue: `${readinessScore}%`,
        icon: Star,
        variant: readinessScore >= 80 ? 'success' : readinessScore >= 60 ? 'info' : 'warning',
        ariaLabel: `Exam readiness score: ${readinessScore} percent`
      });
    }

    } catch (error) {
      console.error('Error transforming stats:', error);
      // Return minimal error state
      stats.push({
        id: 'error-stat',
        label: 'Statistics',
        value: '—',
        displayValue: 'Error loading stats',
        icon: BarChart3,
        variant: 'error',
        ariaLabel: 'Statistics unavailable due to error'
      });
    }

    return stats;
  });
}

/**
 * Transform exam sessions into activity timeline entries
 *
 * @param examSessions - Array of exam sessions
 * @param maxItems - Maximum number of activities to return
 * @returns Array of Activity objects sorted by date (newest first)
 */
export function transformActivities(
  examSessions: ExamSession[],
  maxItems: number = 10
): Activity[] {
  // Use caching for activity transformations
  const cacheKey = generateActivitiesKey(examSessions, maxItems);

  return getCachedActivities(cacheKey, () => {
    const activities: Activity[] = [];

    try {
    const completedSessions = examSessions
      .filter(session => session.is_completed)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
      .slice(0, maxItems);

    for (const session of completedSessions) {
      const activity: Activity = {
        id: session.id,
        type: 'exam',
        title: session.exam_title || formatSessionTitle(session),
        description: formatSessionDescription(session),
        score: session.score ? Math.round(session.score) : undefined,
        maxScore: 100,
        scoreDisplay: session.score ? `${Math.round(session.score)}%` : undefined,
        date: new Date(session.started_at),
        duration: session.duration_seconds ? Math.round(session.duration_seconds / 60) : undefined,
        courseId: session.course_id,
        metadata: {
          difficulty: session.exam_difficulty || 'standard',
          topic: session.session_type || 'general',
          improvement: calculateSessionImprovement(session, examSessions)
        },
        priority: determineActivityPriority(session),
        icon: getActivityIcon(session),
        color: getActivityColor(session),
        onClick: () => {
          // Could be used for navigation to session details
          console.log('Navigate to session:', session.id);
        }
      };

      activities.push(activity);
    }

    // Add achievement activities if any major milestones reached
    const achievementActivities = generateAchievementActivities(examSessions);
    activities.push(...achievementActivities);

    // Sort by date and return limited results
    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, maxItems);

    } catch (error) {
      console.error('Error transforming activities:', error);
      return [];
    }
  });
}

/**
 * Generate quick action buttons based on course state and available providers
 *
 * @param providers - Available exam providers
 * @param selectedProvider - Currently selected provider
 * @param course - Course information
 * @param onStartExam - Callback for starting an exam
 * @returns Object with primary and secondary actions
 */
export function generateQuickActions(
  providers: Array<{ slug: string; name: string }>,
  selectedProvider: string | null,
  course: any,
  onStartExam: (examId?: string, providerSlug?: string) => void
): { primary?: QuickAction; secondary: QuickAction[] } {
  const actions: { primary?: QuickAction; secondary: QuickAction[] } = {
    secondary: []
  };

  try {
    // Primary Action: Start Exam
    if (providers.length > 0) {
      const primaryProvider = selectedProvider
        ? providers.find(p => p.slug === selectedProvider)
        : providers[0];

      if (primaryProvider) {
        actions.primary = {
          id: 'start-exam',
          label: `Start ${primaryProvider.name} Exam`,
          description: 'Begin your next exam session',
          icon: Play,
          onClick: () => onStartExam(undefined, primaryProvider.slug),
          variant: 'primary',
          size: 'default',
          className: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
        };
      }
    }

    // Secondary Actions
    actions.secondary = [
      {
        id: 'review-progress',
        label: 'Review Progress',
        description: 'View detailed analytics',
        icon: TrendingUp,
        onClick: () => {
          // Navigate to analytics tab
          console.log('Navigate to analytics');
        },
        variant: 'outline',
        size: 'default'
      },
      {
        id: 'study-materials',
        label: 'Study Materials',
        description: 'Access learning resources',
        icon: BookOpen,
        onClick: () => {
          // Navigate to resources
          console.log('Navigate to resources');
        },
        variant: 'ghost',
        size: 'default'
      },
      {
        id: 'ai-tutor',
        label: 'AI Tutor',
        description: 'Get personalized help',
        icon: Users,
        onClick: () => {
          // Open AI tutor
          console.log('Open AI tutor');
        },
        variant: 'ghost',
        size: 'default',
        badge: 'New'
      }
    ];

    // Add provider-specific actions if multiple providers
    if (providers.length > 1) {
      actions.secondary.push({
        id: 'choose-provider',
        label: 'Change Provider',
        description: 'Select different exam provider',
        icon: Zap,
        onClick: () => {
          // Open provider selection
          console.log('Open provider selection');
        },
        variant: 'outline',
        size: 'sm'
      });
    }

  } catch (error) {
    console.error('Error generating quick actions:', error);
    // Return minimal actions on error
    actions.secondary = [{
      id: 'error-action',
      label: 'Refresh',
      description: 'Reload dashboard data',
      icon: TrendingUp,
      onClick: () => window.location.reload(),
      variant: 'outline',
      size: 'default'
    }];
  }

  return actions;
}

// =============================================================================
// DATA PROCESSING FUNCTIONS
// =============================================================================

/**
 * Calculate weighted overall progress from component progress
 *
 * @param componentProgress - Progress data for each course component
 * @returns Progress percentage (0-100)
 */
export function calculateProgressPercentage(
  componentProgress?: ComponentProgress | null
): number {
  if (!componentProgress) return 0;

  // Use caching for expensive progress calculations
  const cacheKey = generateProgressKey(componentProgress);

  return getCachedProgress(cacheKey, () => {
    try {
    const values = Object.values(componentProgress).filter(
      (value): value is number => typeof value === 'number' && !Number.isNaN(value)
    );

    if (values.length === 0) return 0;

    // Calculate weighted average (all components equal weight for now)
    const sum = values.reduce((total, value) => total + value, 0);
    const average = sum / values.length;

    // Convert to percentage and ensure valid range
    const percentage = Math.round(Math.min(100, Math.max(0, average * 100)));
    return percentage;

    } catch (error) {
      console.error('Error calculating progress percentage:', error);
      return 0;
    }
  });
}

/**
 * Format duration from seconds to human-readable string
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "—";

  try {
    const minutes = Math.round(seconds / 60);

    if (minutes < 1) return "<1m";
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;

  } catch (error) {
    console.error('Error formatting duration:', error);
    return "—";
  }
}

/**
 * Format timestamp to relative time string
 *
 * @param date - Date to format
 * @returns Relative time string ("2 hours ago", "3 days ago")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";

  try {
    const now = new Date();
    const targetDate = typeof date === 'string' ? new Date(date) : date;

    if (Number.isNaN(targetDate.getTime())) return "—";

    const diffMs = now.getTime() - targetDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSeconds < 60) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;

    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;

  } catch (error) {
    console.error('Error formatting relative time:', error);
    return "—";
  }
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate statistics data before display
 *
 * @param stats - Array of StatCard objects
 * @returns Validation result with errors if any
 */
export function validateStatsData(stats: StatCard[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    for (const stat of stats) {
      if (!stat.id || typeof stat.id !== 'string') {
        errors.push(`Invalid stat ID: ${stat.id}`);
      }

      if (!stat.label || typeof stat.label !== 'string') {
        errors.push(`Invalid stat label for ID ${stat.id}`);
      }

      if (stat.value === null || stat.value === undefined) {
        errors.push(`Missing value for stat ${stat.id}`);
      }

      if (stat.change && typeof stat.change.value !== 'number') {
        errors.push(`Invalid change value for stat ${stat.id}`);
      }
    }

  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate activity data structure
 *
 * @param activities - Array of Activity objects
 * @returns Validation result with errors if any
 */
export function validateActivityData(activities: Activity[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    for (const activity of activities) {
      if (!activity.id || typeof activity.id !== 'string') {
        errors.push(`Invalid activity ID: ${activity.id}`);
      }

      if (!activity.title || typeof activity.title !== 'string') {
        errors.push(`Invalid activity title for ID ${activity.id}`);
      }

      if (!activity.date || !(activity.date instanceof Date) || Number.isNaN(activity.date.getTime())) {
        errors.push(`Invalid activity date for ID ${activity.id}`);
      }

      if (!['exam', 'study', 'achievement', 'progress', 'note', 'system'].includes(activity.type)) {
        errors.push(`Invalid activity type for ID ${activity.id}: ${activity.type}`);
      }
    }

  } catch (error) {
    errors.push(`Activity validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize and validate user input data
 *
 * @param input - Raw input data
 * @returns Sanitized and validated data
 */
export function sanitizeUserInput(input: any): any {
  if (input === null || input === undefined) return null;

  try {
    if (typeof input === 'string') {
      // Basic XSS prevention
      return input
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .slice(0, 1000); // Limit length
    }

    if (typeof input === 'number') {
      if (Number.isNaN(input) || !Number.isFinite(input)) return 0;
      return Math.max(-1000000, Math.min(1000000, input)); // Reasonable bounds
    }

    if (Array.isArray(input)) {
      return input.slice(0, 100).map(sanitizeUserInput); // Limit array size
    }

    if (typeof input === 'object') {
      const sanitized: any = {};
      const keys = Object.keys(input).slice(0, 50); // Limit object size

      for (const key of keys) {
        const sanitizedKey = sanitizeUserInput(key);
        if (typeof sanitizedKey === 'string' && sanitizedKey.length > 0) {
          sanitized[sanitizedKey] = sanitizeUserInput(input[key]);
        }
      }

      return sanitized;
    }

    return input;

  } catch (error) {
    console.error('Error sanitizing input:', error);
    return null;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate average score from exam sessions
 */
function calculateAverageScore(sessions: ExamSession[]): number {
  const completedSessions = sessions.filter(s => s.is_completed && s.score !== null);
  if (completedSessions.length === 0) return 0;

  const total = completedSessions.reduce((sum, session) => sum + (session.score || 0), 0);
  return Math.round(total / completedSessions.length);
}

/**
 * Calculate score improvement from recent sessions
 */
function calculateScoreImprovement(sessions: ExamSession[]): number {
  const completedSessions = sessions
    .filter(s => s.is_completed && s.score !== null)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  if (completedSessions.length < 2) return 0;

  const recent = completedSessions.slice(-3);
  const previous = completedSessions.slice(-6, -3);

  if (previous.length === 0) return 0;

  const recentAvg = recent.reduce((sum, s) => sum + (s.score || 0), 0) / recent.length;
  const previousAvg = previous.reduce((sum, s) => sum + (s.score || 0), 0) / previous.length;

  return Math.round(recentAvg - previousAvg);
}

/**
 * Calculate total study hours from sessions
 */
function calculateTotalStudyHours(sessions: ExamSession[]): number {
  const totalSeconds = sessions
    .filter(s => s.is_completed)
    .reduce((sum, session) => sum + (session.duration_seconds || 0), 0);

  return Math.round((totalSeconds / 3600) * 10) / 10; // Round to 1 decimal
}

/**
 * Calculate weekly study hours
 */
function calculateWeeklyStudyHours(sessions: ExamSession[]): number {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const weeklySeconds = sessions
    .filter(s => s.is_completed && new Date(s.started_at) >= weekAgo)
    .reduce((sum, session) => sum + (session.duration_seconds || 0), 0);

  return Math.round((weeklySeconds / 3600) * 10) / 10;
}

/**
 * Format session title from session data
 */
function formatSessionTitle(session: ExamSession): string {
  if (session.exam_title) return session.exam_title;
  if (session.session_type) {
    return session.session_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'Practice Session';
}

/**
 * Format session description
 */
function formatSessionDescription(session: ExamSession): string {
  const parts: string[] = [];

  if (session.exam_provider) {
    parts.push(session.exam_provider);
  }

  if (session.duration_seconds) {
    parts.push(formatDuration(session.duration_seconds));
  }

  return parts.join(' • ') || 'Completed session';
}

/**
 * Calculate improvement for a specific session
 */
function calculateSessionImprovement(session: ExamSession, allSessions: ExamSession[]): number {
  const previousSessions = allSessions
    .filter(s =>
      s.is_completed &&
      s.score !== null &&
      new Date(s.started_at) < new Date(session.started_at)
    )
    .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
    .slice(0, 3);

  if (previousSessions.length === 0) return 0;

  const avgPrevious = previousSessions.reduce((sum, s) => sum + (s.score || 0), 0) / previousSessions.length;
  const currentScore = session.score || 0;

  return Math.round(currentScore - avgPrevious);
}

/**
 * Determine activity priority based on session performance
 */
function determineActivityPriority(session: ExamSession): Activity['priority'] {
  if (!session.score) return 'low';

  if (session.score >= 90) return 'high';
  if (session.score >= 75) return 'medium';
  return 'low';
}

/**
 * Get icon for activity based on session type
 */
function getActivityIcon(session: ExamSession) {
  if (session.session_type?.includes('mock')) return Trophy;
  if (session.session_type?.includes('practice')) return BookOpen;
  if (session.session_type?.includes('assessment')) return Target;
  return Play;
}

/**
 * Get color for activity based on performance
 */
function getActivityColor(session: ExamSession): string {
  if (!session.score) return '#6b7280'; // gray

  if (session.score >= 90) return '#10b981'; // green
  if (session.score >= 75) return '#3b82f6'; // blue
  if (session.score >= 60) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

/**
 * Generate achievement activities from exam sessions
 */
function generateAchievementActivities(sessions: ExamSession[]): Activity[] {
  const achievements: Activity[] = [];

  // Check for milestones
  const completedSessions = sessions.filter(s => s.is_completed);

  // First exam completion
  if (completedSessions.length === 1) {
    achievements.push({
      id: 'first-exam-achievement',
      type: 'achievement',
      title: 'First Exam Completed! 🎉',
      description: 'Congratulations on completing your first exam',
      date: new Date(completedSessions[0].started_at),
      icon: Award,
      color: '#10b981',
      priority: 'high'
    });
  }

  // Perfect score achievement
  const perfectSessions = completedSessions.filter(s => (s.score || 0) >= 100);
  if (perfectSessions.length > 0) {
    achievements.push({
      id: 'perfect-score-achievement',
      type: 'achievement',
      title: 'Perfect Score! ⭐',
      description: 'You achieved a perfect score on an exam',
      date: new Date(perfectSessions[perfectSessions.length - 1].started_at),
      icon: Star,
      color: '#f59e0b',
      priority: 'high'
    });
  }

  return achievements;
}

// =============================================================================
// PERFORMANCE OPTIMIZATIONS
// =============================================================================

/**
 * Memoized progress calculation for expensive operations
 */
const progressCalculationCache = new Map<string, number>();

export function memoizedProgressCalculation(
  componentProgress: ComponentProgress | null | undefined,
  cacheKey: string
): number {
  if (progressCalculationCache.has(cacheKey)) {
    return progressCalculationCache.get(cacheKey)!;
  }

  const result = calculateProgressPercentage(componentProgress);
  progressCalculationCache.set(cacheKey, result);

  // Clear cache after 5 minutes to prevent memory leaks
  setTimeout(() => {
    progressCalculationCache.delete(cacheKey);
  }, 5 * 60 * 1000);

  return result;
}

/**
 * Batch processing for large datasets
 */
export function processBatchData<T, R>(
  data: T[],
  processor: (item: T) => R,
  batchSize: number = 100
): R[] {
  const results: R[] = [];

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchResults = batch.map(processor);
    results.push(...batchResults);

    // Allow other operations to run between batches
    if (i + batchSize < data.length) {
      setTimeout(() => {}, 0);
    }
  }

  return results;
}

/**
 * Data transformer implementation
 */
export const dataTransformer: DataTransformer = {
  transform: (raw: RawDashboardData, options: TransformOptions = {}): TransformedDashboardData => {
    try {
      const now = new Date();

      // Transform stats
      const stats = transformStats(
        {
          totalExams: raw.availableExams?.length || 0,
          completedExams: raw.activities?.filter(a => a.type === 'exam_completed').length || 0,
          averageScore: raw.progress?.average_score || 0,
          timeSpent: raw.progress?.total_study_time || 0
        },
        raw.progress as any,
        (raw.activities || []) as any
      );

      // Transform activities
      const activities = transformActivities((raw.activities || []) as any, options.maxActivities);

      // Generate quick actions
      const quickActions = generateQuickActions(
        raw.availableExams?.map(exam => ({
          slug: exam.provider_slug,
          name: exam.provider_name
        })) || [],
        null,
        null,
        () => {}
      );

      return {
        stats,
        activities,
        quickActions,
        metadata: {
          lastUpdated: now,
          completeness: 1.0,
          performance: {
            loadTime: Date.now() - now.getTime(),
            cacheHit: false
          }
        }
      };

    } catch (error) {
      console.error('Data transformation error:', error);
      throw error;
    }
  },

  validate: (raw: unknown): raw is RawDashboardData => {
    try {
      return typeof raw === 'object' && raw !== null;
    } catch {
      return false;
    }
  },

  fallback: (error: Error): TransformedDashboardData => {
    console.error('Using fallback data due to error:', error);

    return {
      stats: [{
        id: 'error-stat',
        label: 'Dashboard Error',
        value: '—',
        displayValue: 'Unable to load data',
        icon: BarChart3,
        variant: 'error'
      }],
      activities: [],
      quickActions: {
        secondary: [{
          id: 'refresh',
          label: 'Refresh',
          description: 'Reload dashboard data',
          icon: TrendingUp,
          onClick: () => window.location.reload(),
          variant: 'outline'
        }]
      },
      metadata: {
        lastUpdated: new Date(),
        completeness: 0,
        performance: {
          loadTime: 0,
          cacheHit: false
        }
      }
    };
  }
};

export default {
  transformStats,
  transformActivities,
  generateQuickActions,
  calculateProgressPercentage,
  formatDuration,
  formatRelativeTime,
  validateStatsData,
  validateActivityData,
  sanitizeUserInput,
  memoizedProgressCalculation,
  processBatchData,
  dataTransformer
};