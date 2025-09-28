/**
 * Dashboard Widget Utilities
 * Provides common utilities for dashboard widgets and layouts
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility function for conditional classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Widget size configurations
export const WIDGET_SIZES = {
  small: {
    className: "col-span-1 row-span-1",
    minHeight: "min-h-[200px]",
    padding: "p-4"
  },
  medium: {
    className: "col-span-2 row-span-1",
    minHeight: "min-h-[250px]",
    padding: "p-6"
  },
  large: {
    className: "col-span-3 row-span-2",
    minHeight: "min-h-[400px]",
    padding: "p-8"
  },
  wide: {
    className: "col-span-4 row-span-1",
    minHeight: "min-h-[200px]",
    padding: "p-6"
  },
  tall: {
    className: "col-span-2 row-span-3",
    minHeight: "min-h-[600px]",
    padding: "p-6"
  }
} as const;

export type WidgetSize = keyof typeof WIDGET_SIZES;

// Widget types and configurations
export interface WidgetConfig {
  id: string;
  title: string;
  description?: string;
  size: WidgetSize;
  priority: number;
  category: WidgetCategory;
  isCollapsible?: boolean;
  hasActions?: boolean;
  refreshInterval?: number; // in seconds
  dataSources?: string[];
}

export type WidgetCategory =
  | "overview"
  | "progress"
  | "providers"
  | "analytics"
  | "achievements"
  | "activity"
  | "recommendations";

// Dashboard layout configurations
export const DASHBOARD_LAYOUTS = {
  compact: {
    columns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    gap: "gap-4",
    maxWidth: "max-w-6xl"
  },
  standard: {
    columns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    gap: "gap-6",
    maxWidth: "max-w-7xl"
  },
  spacious: {
    columns: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6",
    gap: "gap-8",
    maxWidth: "max-w-8xl"
  }
} as const;

export type DashboardLayout = keyof typeof DASHBOARD_LAYOUTS;

// Animation presets for widgets
export const WIDGET_ANIMATIONS = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  },
  slideIn: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3 }
  },
  staggerChildren: {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }
} as const;

// Color themes for different widget categories
export const WIDGET_THEMES = {
  overview: {
    gradient: "from-blue-500 to-indigo-600",
    background: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-900 dark:text-blue-100",
    accent: "text-blue-600 dark:text-blue-400"
  },
  progress: {
    gradient: "from-emerald-500 to-teal-600",
    background: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-900 dark:text-emerald-100",
    accent: "text-emerald-600 dark:text-emerald-400"
  },
  providers: {
    gradient: "from-purple-500 to-pink-600",
    background: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-900 dark:text-purple-100",
    accent: "text-purple-600 dark:text-purple-400"
  },
  analytics: {
    gradient: "from-amber-500 to-orange-600",
    background: "bg-amber-50 dark:bg-amber-900/20",
    border: "border-amber-200 dark:border-amber-800",
    text: "text-amber-900 dark:text-amber-100",
    accent: "text-amber-600 dark:text-amber-400"
  },
  achievements: {
    gradient: "from-yellow-500 to-amber-600",
    background: "bg-yellow-50 dark:bg-yellow-900/20",
    border: "border-yellow-200 dark:border-yellow-800",
    text: "text-yellow-900 dark:text-yellow-100",
    accent: "text-yellow-600 dark:text-yellow-400"
  },
  activity: {
    gradient: "from-slate-500 to-gray-600",
    background: "bg-slate-50 dark:bg-slate-900/20",
    border: "border-slate-200 dark:border-slate-800",
    text: "text-slate-900 dark:text-slate-100",
    accent: "text-slate-600 dark:text-slate-400"
  },
  recommendations: {
    gradient: "from-rose-500 to-pink-600",
    background: "bg-rose-50 dark:bg-rose-900/20",
    border: "border-rose-200 dark:border-rose-800",
    text: "text-rose-900 dark:text-rose-100",
    accent: "text-rose-600 dark:text-rose-400"
  }
} as const;

// Utility functions for widget management
export function getWidgetClasses(config: WidgetConfig): string {
  const size = WIDGET_SIZES[config.size];
  const theme = WIDGET_THEMES[config.category];

  return cn(
    "rounded-2xl border shadow-lg transition-all duration-300 hover:shadow-xl",
    size.className,
    size.minHeight,
    size.padding,
    theme.background,
    theme.border
  );
}

export function getWidgetHeaderClasses(category: WidgetCategory): string {
  const theme = WIDGET_THEMES[category];
  return cn("text-lg font-semibold", theme.text);
}

export function getWidgetAccentClasses(category: WidgetCategory): string {
  const theme = WIDGET_THEMES[category];
  return cn("font-medium", theme.accent);
}

export function sortWidgetsByPriority(widgets: WidgetConfig[]): WidgetConfig[] {
  return widgets.sort((a, b) => a.priority - b.priority);
}

export function filterWidgetsByCategory(
  widgets: WidgetConfig[],
  category: WidgetCategory
): WidgetConfig[] {
  return widgets.filter(widget => widget.category === category);
}

// Data formatting utilities
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

export function formatPercentage(value: number, precision: number = 1): string {
  return `${value.toFixed(precision)}%`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m`;
  }
  if (seconds < 86400) {
    return `${Math.round(seconds / 3600)}h`;
  }
  return `${Math.round(seconds / 86400)}d`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Hace unos segundos';
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} hora${hours !== 1 ? 's' : ''}`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `Hace ${days} día${days !== 1 ? 's' : ''}`;
  }

  return formatDate(d);
}

// Provider-specific utilities
export interface ProviderTheme {
  name: string;
  gradient: string;
  background: string;
  border: string;
  text: string;
  accent: string;
}

export const PROVIDER_THEMES: Record<string, ProviderTheme> = {
  cambridge: {
    name: "Cambridge",
    gradient: "from-blue-600 to-blue-800",
    background: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-200 dark:border-blue-800",
    text: "text-blue-900 dark:text-blue-100",
    accent: "text-blue-600 dark:text-blue-400"
  },
  eoi: {
    name: "EOI",
    gradient: "from-emerald-600 to-green-800",
    background: "bg-emerald-50 dark:bg-emerald-900/20",
    border: "border-emerald-200 dark:border-emerald-800",
    text: "text-emerald-900 dark:text-emerald-100",
    accent: "text-emerald-600 dark:text-emerald-400"
  },
  jqcv: {
    name: "JQCV",
    gradient: "from-orange-600 to-red-800",
    background: "bg-orange-50 dark:bg-orange-900/20",
    border: "border-orange-200 dark:border-orange-800",
    text: "text-orange-900 dark:text-orange-100",
    accent: "text-orange-600 dark:text-orange-400"
  },
  toefl: {
    name: "TOEFL",
    gradient: "from-purple-600 to-indigo-800",
    background: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-200 dark:border-purple-800",
    text: "text-purple-900 dark:text-purple-100",
    accent: "text-purple-600 dark:text-purple-400"
  },
  ielts: {
    name: "IELTS",
    gradient: "from-red-600 to-pink-800",
    background: "bg-red-50 dark:bg-red-900/20",
    border: "border-red-200 dark:border-red-800",
    text: "text-red-900 dark:text-red-100",
    accent: "text-red-600 dark:text-red-400"
  },
  default: {
    name: "Default",
    gradient: "from-gray-600 to-slate-800",
    background: "bg-gray-50 dark:bg-gray-900/20",
    border: "border-gray-200 dark:border-gray-800",
    text: "text-gray-900 dark:text-gray-100",
    accent: "text-gray-600 dark:text-gray-400"
  }
};

export function getProviderTheme(providerSlug: string): ProviderTheme {
  return PROVIDER_THEMES[providerSlug.toLowerCase()] || PROVIDER_THEMES.default;
}

export function getProviderClasses(providerSlug: string): {
  gradient: string;
  background: string;
  border: string;
  text: string;
  accent: string;
} {
  const theme = getProviderTheme(providerSlug);
  return {
    gradient: theme.gradient,
    background: theme.background,
    border: theme.border,
    text: theme.text,
    accent: theme.accent
  };
}

// Widget loading and error states
export const WIDGET_STATES = {
  loading: {
    className: "animate-pulse",
    skeleton: "bg-gray-200 dark:bg-gray-700 rounded"
  },
  error: {
    className: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    iconColor: "text-red-500",
    textColor: "text-red-700 dark:text-red-300"
  },
  empty: {
    className: "bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-700",
    iconColor: "text-gray-400",
    textColor: "text-gray-600 dark:text-gray-400"
  }
} as const;

// Responsive breakpoints for widgets
export const WIDGET_BREAKPOINTS = {
  mobile: "grid-cols-1",
  tablet: "md:grid-cols-2",
  desktop: "lg:grid-cols-4",
  wide: "xl:grid-cols-6"
} as const;

// Dashboard refresh utilities
export function shouldRefreshWidget(
  lastRefresh: Date,
  refreshInterval: number
): boolean {
  const now = new Date();
  const diffInSeconds = (now.getTime() - lastRefresh.getTime()) / 1000;
  return diffInSeconds >= refreshInterval;
}

export function getNextRefreshTime(
  lastRefresh: Date,
  refreshInterval: number
): Date {
  return new Date(lastRefresh.getTime() + refreshInterval * 1000);
}

// Widget configuration presets
export const WIDGET_PRESETS: Record<string, WidgetConfig> = {
  overviewStats: {
    id: "overview-stats",
    title: "Course Overview",
    description: "General course statistics and progress",
    size: "wide",
    priority: 1,
    category: "overview",
    refreshInterval: 300
  },
  progressChart: {
    id: "progress-chart",
    title: "Learning Progress",
    description: "Visual progress tracking",
    size: "medium",
    priority: 2,
    category: "progress",
    refreshInterval: 600
  },
  providerStats: {
    id: "provider-stats",
    title: "Exam Providers",
    description: "Available exam providers and statistics",
    size: "medium",
    priority: 3,
    category: "providers",
    refreshInterval: 900
  },
  recentActivity: {
    id: "recent-activity",
    title: "Recent Activity",
    description: "Latest exam sessions and activities",
    size: "tall",
    priority: 4,
    category: "activity",
    refreshInterval: 180
  },
  achievements: {
    id: "achievements",
    title: "Achievements",
    description: "Earned badges and milestones",
    size: "small",
    priority: 5,
    category: "achievements",
    refreshInterval: 1800
  },
  recommendations: {
    id: "recommendations",
    title: "Recommendations",
    description: "Personalized study recommendations",
    size: "medium",
    priority: 6,
    category: "recommendations",
    refreshInterval: 3600
  }
};

export default {
  cn,
  WIDGET_SIZES,
  DASHBOARD_LAYOUTS,
  WIDGET_ANIMATIONS,
  WIDGET_THEMES,
  PROVIDER_THEMES,
  WIDGET_STATES,
  WIDGET_BREAKPOINTS,
  WIDGET_PRESETS,
  getWidgetClasses,
  getWidgetHeaderClasses,
  getWidgetAccentClasses,
  getProviderTheme,
  getProviderClasses,
  sortWidgetsByPriority,
  filterWidgetsByCategory,
  formatNumber,
  formatPercentage,
  formatDuration,
  formatDate,
  formatRelativeTime,
  shouldRefreshWidget,
  getNextRefreshTime
};