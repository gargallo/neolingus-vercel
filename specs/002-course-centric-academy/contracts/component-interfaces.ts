/**
 * Course Dashboard Redesign - Component Interface Contracts
 *
 * This file defines the TypeScript interfaces for the new dashboard components
 * that replace the provider showcase section with a modern card-based layout.
 *
 * Date: 2025-09-17
 * Specification: Course Dashboard Redesign
 */

// =============================================================================
// DASHBOARD STATISTICS COMPONENT
// =============================================================================

export interface DashboardStatsProps {
  /** Statistics data to display in cards */
  stats: {
    /** Overall course progress percentage (0-100) */
    overallProgress: number;
    /** Number of completed exam sessions */
    completedExams: number;
    /** Total number of available exams */
    totalExams: number;
    /** Average score across all completed exams */
    averageScore: number;
    /** Total study hours accumulated */
    studyHours: number;
    /** Current study streak in days */
    currentStreak?: number;
    /** Readiness score for the target exam */
    readinessScore?: number;
  };
  /** Optional CSS class name for styling */
  className?: string;
  /** Loading state for async data */
  isLoading?: boolean;
  /** Error state with message */
  error?: string | null;
}

export interface StatCard {
  /** Unique identifier for the stat card */
  id: string;
  /** Display title for the statistic */
  title: string;
  /** Main value to display */
  value: number | string;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Icon component to display with the stat */
  icon: React.ComponentType<{ className?: string }>;
  /** Color theme for the card ('blue' | 'green' | 'orange' | 'purple') */
  color: 'blue' | 'green' | 'orange' | 'purple';
  /** Optional trend indicator */
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    label: string;
  };
  /** Click handler for card interaction */
  onClick?: () => void;
}

// =============================================================================
// ACTIVITY TIMELINE COMPONENT
// =============================================================================

export interface ActivityTimelineProps {
  /** Array of recent activities to display */
  activities: Activity[];
  /** Maximum number of activities to show (default: 5) */
  maxItems?: number;
  /** Optional CSS class name for styling */
  className?: string;
  /** Loading state for async data */
  isLoading?: boolean;
  /** Empty state message when no activities */
  emptyMessage?: string;
}

export interface Activity {
  /** Unique identifier for the activity */
  id: string;
  /** Type of activity performed */
  type: 'exam_completed' | 'session_started' | 'achievement_earned' | 'streak_milestone';
  /** Display title for the activity */
  title: string;
  /** Optional score achieved (for exams) */
  score?: number;
  /** When the activity occurred */
  date: Date;
  /** Duration of the activity in minutes */
  duration?: number;
  /** Additional metadata for the activity */
  metadata?: {
    component?: string;
    provider?: string;
    difficulty?: string;
    achievementType?: string;
  };
}

// =============================================================================
// QUICK ACTIONS COMPONENT
// =============================================================================

export interface QuickActionsProps {
  /** Primary action button (most prominent) */
  primaryAction: QuickAction;
  /** Array of secondary action buttons */
  secondaryActions: QuickAction[];
  /** Optional CSS class name for styling */
  className?: string;
  /** Disabled state for all actions */
  disabled?: boolean;
}

export interface QuickAction {
  /** Unique identifier for the action */
  id: string;
  /** Display label for the action button */
  label: string;
  /** Click handler for the action */
  onClick: () => void;
  /** Optional icon component */
  icon?: React.ComponentType<{ className?: string }>;
  /** Disabled state for this specific action */
  disabled?: boolean;
  /** Loading state for async actions */
  loading?: boolean;
  /** Visual variant ('primary' | 'secondary' | 'outline') */
  variant?: 'primary' | 'secondary' | 'outline';
  /** Optional tooltip text */
  tooltip?: string;
}

// =============================================================================
// ENHANCED COURSE DASHBOARD COMPONENT
// =============================================================================

export interface CourseDashboardProps {
  /** Course information */
  courseData: {
    id: string;
    title: string;
    language: string;
    level: string;
    description?: string;
    imageUrl?: string;
  };
  /** User progress data */
  progress: {
    overallProgress: number;
    componentProgress?: {
      reading?: number;
      writing?: number;
      listening?: number;
      speaking?: number;
    };
    strengths?: string[];
    weaknesses?: string[];
    readinessScore?: number;
    estimatedStudyHours?: number;
    targetExamDate?: string | null;
  };
  /** Recent exam sessions */
  examSessions: {
    id: string;
    component: string;
    provider: string;
    score: number;
    startedAt: string;
    completedAt: string | null;
    durationSeconds: number;
    isCompleted: boolean;
    sessionType: string;
  }[];
  /** Available exam providers (for header dropdown, not dashboard display) */
  availableProviders: string[];
  /** Selected provider from header */
  selectedProvider?: string;
  /** Dashboard configuration */
  config?: {
    showProviderSection: boolean; // Should be false for redesign
    enableAnimations: boolean;
    compactLayout: boolean;
  };
  /** Event handlers */
  onStartExam?: (provider: string, component: string) => void;
  onProviderChange?: (provider: string) => void;
  /** Optional CSS class name for styling */
  className?: string;
}

// =============================================================================
// PROGRESS CHARTS COMPONENT (ENHANCED)
// =============================================================================

export interface ProgressChartsProps {
  /** Progress data for different skill components */
  componentProgress: {
    reading: number;
    writing: number;
    listening: number;
    speaking: number;
  };
  /** Historical progress data for trend visualization */
  historicalData?: {
    date: string;
    reading: number;
    writing: number;
    listening: number;
    speaking: number;
  }[];
  /** Chart configuration */
  config?: {
    showTrends: boolean;
    animationEnabled: boolean;
    colors: {
      reading: string;
      writing: string;
      listening: string;
      speaking: string;
    };
  };
  /** Optional CSS class name for styling */
  className?: string;
}

// =============================================================================
// DATA TRANSFORMATION UTILITIES
// =============================================================================

export interface DashboardTransforms {
  /** Transform course data into dashboard statistics */
  transformStats: (courseData: any, progress: any, examSessions: any[]) => DashboardStatsProps['stats'];

  /** Transform exam sessions into activity timeline */
  transformActivities: (examSessions: any[]) => Activity[];

  /** Generate quick actions based on available providers and course state */
  generateQuickActions: (
    availableProviders: string[],
    selectedProvider: string,
    onStartExam: (provider: string, component: string) => void
  ) => {
    primaryAction: QuickAction;
    secondaryActions: QuickAction[];
  };
}

// =============================================================================
// RESPONSIVE BREAKPOINTS AND LAYOUT
// =============================================================================

export interface ResponsiveConfig {
  /** Breakpoints for responsive design */
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  /** Grid configuration for different screen sizes */
  gridConfig: {
    mobile: {
      columns: number;
      gap: number;
    };
    tablet: {
      columns: number;
      gap: number;
    };
    desktop: {
      columns: number;
      gap: number;
    };
  };
}

// =============================================================================
// ACCESSIBILITY SUPPORT
// =============================================================================

export interface AccessibilityProps {
  /** ARIA label for screen readers */
  'aria-label'?: string;
  /** ARIA description for complex components */
  'aria-describedby'?: string;
  /** Tab index for keyboard navigation */
  tabIndex?: number;
  /** Role for semantic HTML */
  role?: string;
  /** Additional ARIA attributes */
  [key: `aria-${string}`]: string | number | boolean | undefined;
}

// =============================================================================
// ERROR HANDLING AND LOADING STATES
// =============================================================================

export interface AsyncComponentState {
  /** Loading state indicator */
  loading: boolean;
  /** Error state with optional message */
  error: Error | null;
  /** Data has been loaded at least once */
  initialized: boolean;
  /** Last successful update timestamp */
  lastUpdated?: Date;
}

export interface ErrorBoundaryProps {
  /** Fallback component to render on error */
  fallback: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Error handler callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Children components */
  children: React.ReactNode;
}

// =============================================================================
// ANIMATION AND TRANSITION CONFIGURATION
// =============================================================================

export interface AnimationConfig {
  /** Enable/disable animations globally */
  enabled: boolean;
  /** Duration for standard transitions (ms) */
  duration: number;
  /** Easing function for animations */
  easing: string;
  /** Reduced motion preference support */
  respectMotionPreference: boolean;
}

// Default animation configuration
export const defaultAnimationConfig: AnimationConfig = {
  enabled: true,
  duration: 300,
  easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  respectMotionPreference: true,
};

// =============================================================================
// THEME SUPPORT
// =============================================================================

export interface ThemeConfig {
  /** Color palette for different themes */
  colors: {
    light: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      text: string;
    };
    dark: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      surface: string;
      text: string;
    };
  };
  /** Typography scale */
  typography: {
    fontFamily: string;
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
    };
  };
  /** Spacing scale */
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export default {
  DashboardStatsProps,
  ActivityTimelineProps,
  QuickActionsProps,
  CourseDashboardProps,
  ProgressChartsProps,
  ResponsiveConfig,
  AnimationConfig,
  ThemeConfig,
} as const;