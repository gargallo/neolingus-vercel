/**
 * TypeScript Interface Definitions for Course Dashboard Components
 *
 * This file contains comprehensive type definitions for the course dashboard redesign,
 * including component props, data structures, accessibility configurations, and
 * responsive design patterns following the project's established conventions.
 *
 * @author Claude Code
 * @version 1.0.0
 * @since 2025-09-17
 */

import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

// =============================================================================
// CORE DATA TYPES
// =============================================================================

/**
 * Statistical information displayed on dashboard cards
 */
export interface StatCard {
  /** Unique identifier for the stat */
  id: string;
  /** Display label for the statistic */
  label: string;
  /** Numerical value of the statistic */
  value: number | string;
  /** Optional formatted display value (e.g., "85%", "2.5 hrs") */
  displayValue?: string;
  /** Change from previous period */
  change?: {
    /** Percentage or absolute change value */
    value: number;
    /** Direction of change */
    direction: 'up' | 'down' | 'stable';
    /** Period for comparison (e.g., "vs last week") */
    period?: string;
  };
  /** Associated icon for visual representation */
  icon?: LucideIcon;
  /** Visual styling variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Loading state for individual stat */
  isLoading?: boolean;
  /** Click handler for interactive stats */
  onClick?: () => void;
  /** Accessibility description */
  ariaLabel?: string;
}

/**
 * Individual activity entry in the timeline
 */
export interface Activity {
  /** Unique identifier for the activity */
  id: string;
  /** Type of activity performed */
  type: 'exam' | 'study' | 'achievement' | 'progress' | 'note' | 'system';
  /** Main title/description of the activity */
  title: string;
  /** Additional descriptive text */
  description?: string;
  /** Score achieved (for exam activities) */
  score?: number;
  /** Maximum possible score */
  maxScore?: number;
  /** Formatted score display (e.g., "85/100", "B+") */
  scoreDisplay?: string;
  /** Activity timestamp */
  date: Date;
  /** Duration of activity in minutes */
  duration?: number;
  /** Associated course or exam identifier */
  courseId?: string;
  /** Provider identifier (for exams) */
  providerId?: string;
  /** Activity metadata */
  metadata?: {
    /** Exam difficulty level */
    difficulty?: string;
    /** Study topic covered */
    topic?: string;
    /** Improvement indicators */
    improvement?: number;
    /** Additional context data */
    [key: string]: any;
  };
  /** Visual priority/importance */
  priority?: 'low' | 'medium' | 'high';
  /** Associated icon */
  icon?: LucideIcon;
  /** Color theme for activity */
  color?: string;
  /** Click handler for activity details */
  onClick?: () => void;
}

/**
 * Quick action button configuration
 */
export interface QuickAction {
  /** Unique identifier for the action */
  id: string;
  /** Button label */
  label: string;
  /** Action description for accessibility */
  description?: string;
  /** Associated icon */
  icon?: LucideIcon;
  /** Click handler */
  onClick: () => void;
  /** Button variant styling */
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Button size */
  size?: 'sm' | 'default' | 'lg' | 'icon';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Keyboard shortcut hint */
  shortcut?: string;
  /** Badge count or indicator */
  badge?: number | string;
  /** Custom CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT PROPS INTERFACES
// =============================================================================

/**
 * Props for the DashboardStats component displaying key metrics
 */
export interface DashboardStatsProps {
  /** Array of statistics to display */
  stats: StatCard[];
  /** Loading state for the entire stats section */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
  /** Custom CSS classes */
  className?: string;
  /** Grid layout configuration */
  layout?: {
    /** Number of columns for desktop */
    columns?: number;
    /** Responsive breakpoints */
    responsive?: {
      /** Mobile columns (default: 1) */
      mobile?: number;
      /** Tablet columns (default: 2) */
      tablet?: number;
      /** Desktop columns (default: 4) */
      desktop?: number;
    };
  };
  /** Animation preferences */
  animation?: {
    /** Enable animations */
    enabled?: boolean;
    /** Animation duration in ms */
    duration?: number;
    /** Stagger delay between cards */
    stagger?: number;
  };
  /** Accessibility configuration */
  accessibility?: {
    /** Region label for screen readers */
    regionLabel?: string;
    /** Detailed description */
    description?: string;
    /** Live region for dynamic updates */
    liveRegion?: boolean;
  };
}

/**
 * Props for the ActivityTimeline component showing recent activities
 */
export interface ActivityTimelineProps {
  /** Array of activities to display */
  activities: Activity[];
  /** Maximum number of activities to show */
  maxItems?: number;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Custom CSS classes */
  className?: string;
  /** Message when no activities are present */
  emptyMessage?: string;
  /** Empty state illustration */
  emptyIcon?: LucideIcon;
  /** Group activities by date */
  groupByDate?: boolean;
  /** Show relative timestamps (e.g., "2 hours ago") */
  relativeTime?: boolean;
  /** Filter function for activities */
  filter?: (activity: Activity) => boolean;
  /** Sort function for activities */
  sort?: (a: Activity, b: Activity) => number;
  /** Pagination configuration */
  pagination?: {
    /** Enable pagination */
    enabled?: boolean;
    /** Items per page */
    pageSize?: number;
    /** Show page numbers */
    showPageNumbers?: boolean;
  };
  /** Accessibility configuration */
  accessibility?: {
    /** Timeline region label */
    regionLabel?: string;
    /** Detailed description */
    description?: string;
    /** Navigation instructions */
    navigationHint?: string;
  };
  /** Callback when activity is selected */
  onActivitySelect?: (activity: Activity) => void;
  /** Callback when load more is triggered */
  onLoadMore?: () => void;
}

/**
 * Props for the QuickActions component with action buttons
 */
export interface QuickActionsProps {
  /** Primary action button (prominently displayed) */
  primaryAction?: QuickAction;
  /** Secondary action buttons */
  secondaryActions?: QuickAction[];
  /** All actions are disabled */
  disabled?: boolean;
  /** Loading state for the entire component */
  loading?: boolean;
  /** Custom CSS classes */
  className?: string;
  /** Layout configuration */
  layout?: {
    /** Button arrangement */
    arrangement?: 'horizontal' | 'vertical' | 'grid';
    /** Responsive behavior */
    responsive?: {
      /** Mobile layout */
      mobile?: 'stack' | 'scroll' | 'grid';
      /** Tablet layout */
      tablet?: 'horizontal' | 'grid';
      /** Desktop layout */
      desktop?: 'horizontal' | 'grid';
    };
    /** Button spacing */
    spacing?: 'tight' | 'normal' | 'loose';
  };
  /** Accessibility configuration */
  accessibility?: {
    /** Action group label */
    groupLabel?: string;
    /** Instructions for screen readers */
    instructions?: string;
    /** Keyboard navigation hints */
    keyboardHints?: boolean;
  };
}

// =============================================================================
// DATA TRANSFORMATION INTERFACES
// =============================================================================

/**
 * Raw data structure from the API/database
 */
export interface RawDashboardData {
  /** User progress information */
  progress?: {
    /** Overall completion percentage */
    overall_progress?: number;
    /** Exams completed count */
    exams_completed?: number;
    /** Total exams available */
    total_exams?: number;
    /** Average score across all exams */
    average_score?: number;
    /** Total study time in minutes */
    total_study_time?: number;
    /** Weekly activity summary */
    weekly_stats?: {
      sessions_completed?: number;
      hours_studied?: number;
      average_score?: number;
      improvement?: number;
    };
  };
  /** Recent activity records */
  activities?: Array<{
    id: string;
    type: string;
    exam_title?: string;
    topic?: string;
    score?: number;
    max_score?: number;
    duration?: number;
    created_at: string;
    metadata?: Record<string, any>;
  }>;
  /** Available exam information */
  availableExams?: Array<{
    exam_id: string;
    title: string;
    provider_slug: string;
    provider_name: string;
    duration?: number;
    difficulty?: string;
  }>;
  /** Achievement data */
  achievements?: Array<{
    id: string;
    title: string;
    description: string;
    type?: string;
    earned_at?: string;
  }>;
}

/**
 * Transformed data ready for component consumption
 */
export interface TransformedDashboardData {
  /** Statistics for dashboard cards */
  stats: StatCard[];
  /** Timeline activities */
  activities: Activity[];
  /** Quick action buttons */
  quickActions: {
    primary?: QuickAction;
    secondary: QuickAction[];
  };
  /** Additional metadata */
  metadata: {
    /** Data freshness timestamp */
    lastUpdated: Date;
    /** Data completeness indicator */
    completeness: number;
    /** Performance metrics */
    performance?: {
      /** Data load time in ms */
      loadTime: number;
      /** Cache hit ratio */
      cacheHit: boolean;
    };
  };
}

/**
 * Data transformation utility interface
 */
export interface DataTransformer {
  /** Transform raw data to component format */
  transform: (raw: RawDashboardData, options?: TransformOptions) => TransformedDashboardData;
  /** Validate raw data structure */
  validate: (raw: unknown) => raw is RawDashboardData;
  /** Generate fallback data when transformation fails */
  fallback: (error: Error) => TransformedDashboardData;
}

/**
 * Options for data transformation
 */
export interface TransformOptions {
  /** Locale for formatting */
  locale?: string;
  /** Timezone for date formatting */
  timezone?: string;
  /** Maximum activities to include */
  maxActivities?: number;
  /** Stat card preferences */
  statPreferences?: {
    /** Show percentage changes */
    showChanges?: boolean;
    /** Round numbers to decimals */
    decimalPlaces?: number;
    /** Preferred units */
    units?: 'metric' | 'imperial';
  };
  /** Activity filtering */
  activityFilters?: {
    /** Include activity types */
    includeTypes?: Activity['type'][];
    /** Exclude activity types */
    excludeTypes?: Activity['type'][];
    /** Date range filter */
    dateRange?: {
      from: Date;
      to: Date;
    };
  };
}

// =============================================================================
// RESPONSIVE AND ACCESSIBILITY INTERFACES
// =============================================================================

/**
 * Responsive breakpoint configuration
 */
export interface ResponsiveConfig {
  /** Mobile breakpoint (default: 640px) */
  mobile?: number;
  /** Tablet breakpoint (default: 768px) */
  tablet?: number;
  /** Desktop breakpoint (default: 1024px) */
  desktop?: number;
  /** Large desktop breakpoint (default: 1280px) */
  lg?: number;
  /** Extra large breakpoint (default: 1536px) */
  xl?: number;
}

/**
 * Accessibility configuration for components
 */
export interface AccessibilityConfig {
  /** ARIA labels and descriptions */
  aria: {
    /** Main region label */
    regionLabel?: string;
    /** Detailed description */
    description?: string;
    /** Live region for updates */
    liveRegion?: 'polite' | 'assertive' | 'off';
    /** Expanded state for collapsible content */
    expanded?: boolean;
  };
  /** Keyboard navigation */
  keyboard: {
    /** Enable keyboard navigation */
    enabled?: boolean;
    /** Tab order customization */
    tabOrder?: number[];
    /** Custom key handlers */
    keyHandlers?: Record<string, (event: KeyboardEvent) => void>;
    /** Focus management */
    focusManagement?: {
      /** Auto-focus first element */
      autoFocus?: boolean;
      /** Focus trap for modals */
      trapFocus?: boolean;
      /** Return focus on close */
      returnFocus?: boolean;
    };
  };
  /** Screen reader optimizations */
  screenReader: {
    /** Skip links for navigation */
    skipLinks?: Array<{
      href: string;
      label: string;
    }>;
    /** Heading hierarchy validation */
    headingStructure?: boolean;
    /** Alternative text for images */
    altText?: Record<string, string>;
  };
  /** High contrast mode support */
  highContrast?: {
    /** Enable high contrast styles */
    enabled?: boolean;
    /** Custom contrast ratios */
    ratios?: {
      normal?: number;
      large?: number;
    };
  };
  /** Reduced motion preferences */
  reducedMotion?: {
    /** Respect user preference */
    respectPreference?: boolean;
    /** Fallback for disabled animations */
    fallbackStyles?: Record<string, any>;
  };
}

/**
 * Theme configuration for consistent styling
 */
export interface ThemeConfig {
  /** Color palette */
  colors: {
    /** Primary brand colors */
    primary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    /** Status colors */
    status: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    /** Semantic colors */
    semantic: {
      background: string;
      foreground: string;
      muted: string;
      accent: string;
      border: string;
    };
  };
  /** Typography scale */
  typography: {
    /** Font families */
    fonts: {
      sans: string[];
      serif: string[];
      mono: string[];
    };
    /** Font sizes */
    sizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    /** Line heights */
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  /** Spacing scale */
  spacing: {
    /** Base unit (default: 4px) */
    unit: number;
    /** Predefined spacing values */
    scale: number[];
  };
  /** Border radius values */
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  /** Shadow definitions */
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// =============================================================================
// ERROR HANDLING AND LOADING STATES
// =============================================================================

/**
 * Error state information
 */
export interface ErrorState {
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code?: string;
  /** Error severity level */
  severity?: 'low' | 'medium' | 'high' | 'critical';
  /** Recoverable error flag */
  recoverable?: boolean;
  /** Retry function */
  retry?: () => void;
  /** Error details for debugging */
  details?: {
    /** Stack trace */
    stack?: string;
    /** Request context */
    context?: Record<string, any>;
    /** Timestamp */
    timestamp: Date;
  };
}

/**
 * Loading state configuration
 */
export interface LoadingState {
  /** Global loading flag */
  isLoading: boolean;
  /** Specific component loading states */
  components?: {
    stats?: boolean;
    activities?: boolean;
    actions?: boolean;
  };
  /** Loading message */
  message?: string;
  /** Progress indicator (0-100) */
  progress?: number;
  /** Estimated completion time */
  estimatedTime?: number;
  /** Loading skeleton configuration */
  skeleton?: {
    /** Show skeleton instead of spinner */
    enabled?: boolean;
    /** Number of skeleton items */
    count?: number;
    /** Skeleton item height */
    height?: string;
  };
}

// =============================================================================
// EVENT HANDLING INTERFACES
// =============================================================================

/**
 * Dashboard event handlers
 */
export interface DashboardEventHandlers {
  /** Stat card interactions */
  onStatClick?: (stat: StatCard) => void;
  /** Activity timeline interactions */
  onActivityClick?: (activity: Activity) => void;
  /** Quick action button clicks */
  onActionClick?: (action: QuickAction) => void;
  /** Data refresh requests */
  onRefresh?: () => void;
  /** Error recovery actions */
  onErrorRetry?: (error: ErrorState) => void;
  /** Navigation events */
  onNavigate?: (path: string) => void;
  /** User preferences changes */
  onPreferenceChange?: (key: string, value: any) => void;
}

/**
 * Analytics event tracking
 */
export interface AnalyticsEvents {
  /** Track user interactions */
  trackInteraction: (event: {
    /** Event category */
    category: 'dashboard' | 'stats' | 'activities' | 'actions';
    /** Event action */
    action: string;
    /** Event label */
    label?: string;
    /** Event value */
    value?: number;
    /** Additional properties */
    properties?: Record<string, any>;
  }) => void;
  /** Track performance metrics */
  trackPerformance: (metrics: {
    /** Component name */
    component: string;
    /** Load time in milliseconds */
    loadTime: number;
    /** Data size in bytes */
    dataSize?: number;
    /** Cache status */
    cacheHit?: boolean;
  }) => void;
  /** Track errors */
  trackError: (error: {
    /** Error message */
    message: string;
    /** Error code */
    code?: string;
    /** Component where error occurred */
    component: string;
    /** Error severity */
    severity: ErrorState['severity'];
  }) => void;
}

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

/**
 * Component size variants
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Component variant types
 */
export type ComponentVariant = 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

/**
 * Responsive value type for props that can vary by breakpoint
 */
export type ResponsiveValue<T> = T | {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  lg?: T;
  xl?: T;
};

/**
 * Optional props type helper
 */
export type OptionalProps<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Conditional props based on variant
 */
export type ConditionalProps<T, K extends keyof T, V> = T[K] extends V
  ? T & { required?: boolean }
  : T;

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default responsive breakpoints
 */
export const DEFAULT_BREAKPOINTS: ResponsiveConfig = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  lg: 1280,
  xl: 1536,
};

/**
 * Default accessibility configuration
 */
export const DEFAULT_ACCESSIBILITY: AccessibilityConfig = {
  aria: {
    regionLabel: 'Course Dashboard',
    liveRegion: 'polite',
  },
  keyboard: {
    enabled: true,
    focusManagement: {
      autoFocus: false,
      trapFocus: false,
      returnFocus: true,
    },
  },
  screenReader: {
    headingStructure: true,
  },
  highContrast: {
    enabled: true,
    ratios: {
      normal: 4.5,
      large: 3.0,
    },
  },
  reducedMotion: {
    respectPreference: true,
  },
};

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION = {
  enabled: true,
  duration: 200,
  stagger: 50,
};

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  enabled: true,
  pageSize: 10,
  showPageNumbers: true,
};

// Re-export utility types for convenience
export type {
  ReactNode,
  LucideIcon,
};