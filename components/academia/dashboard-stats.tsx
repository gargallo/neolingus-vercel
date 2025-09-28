'use client';

import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BookOpen,
  Target,
  Trophy,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { DashboardStatsProps, StatCard } from './types/dashboard-interfaces';
import { dashboardAnimations, hoverVariants, tapVariants, willChangeStyles } from '@/lib/animations/dashboard-animations';
import { useAnimationPreferences } from '@/lib/hooks/useAnimationPreferences';
import '../../styles/dashboard-layouts.css';

/**
 * Individual stat card component with loading and error states
 */
interface StatCardComponentProps {
  stat: StatCard;
  index: number;
  loading?: boolean;
  disabled?: boolean;
  onClick?: (id: string) => void;
}

const StatCardComponent = memo(({
  stat,
  index,
  loading = false,
  disabled = false,
  onClick
}: StatCardComponentProps) => {
  const { getReducedVariants, getDuration, shouldAnimate } = useAnimationPreferences();
  const getThemeClasses = (variant?: string) => {
    switch (variant) {
      case 'progress':
        return 'dashboard-card--blue border-blue-200 dark:border-blue-800';
      case 'exams':
        return 'dashboard-card--green border-green-200 dark:border-green-800';
      case 'score':
        return 'dashboard-card--orange border-orange-200 dark:border-orange-800';
      case 'hours':
        return 'dashboard-card--purple border-purple-200 dark:border-purple-800';
      default:
        return 'dashboard-card--blue border-blue-200 dark:border-blue-800';
    }
  };

  const getBackgroundClasses = (variant?: string) => {
    switch (variant) {
      case 'progress':
        return 'bg-blue-50';
      case 'exams':
        return 'bg-green-50';
      case 'score':
        return 'bg-orange-50';
      case 'hours':
        return 'bg-purple-50';
      default:
        return 'bg-blue-50';
    }
  };

  const getIcon = (variant?: string) => {
    switch (variant) {
      case 'progress':
        return Target;
      case 'exams':
        return BookOpen;
      case 'score':
        return Trophy;
      case 'hours':
        return Clock;
      default:
        return Target;
    }
  };

  const getTrendIcon = (direction?: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4" data-icon="arrow-up" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" data-icon="arrow-down" />;
      case 'stable':
      default:
        return <Minus className="w-4 h-4" data-icon="minus" />;
    }
  };

  const IconComponent = stat.icon || getIcon(stat.variant);

  const handleClick = () => {
    if (!disabled && onClick && stat.id) {
      onClick(stat.id);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled && onClick) {
      event.preventDefault();
      onClick(stat.id);
    }
  };

  if (loading) {
    return (
      <motion.div
        data-testid={`stat-skeleton-${stat.variant || stat.id}`}
        className="dashboard-card dashboard-card--loading p-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: getDuration(0.2),
          delay: index * 0.05,
          ease: "easeOut"
        }}
        style={willChangeStyles.transform}
      >
        <motion.div
          className="dashboard-skeleton dashboard-skeleton--title mb-4"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="dashboard-skeleton dashboard-skeleton--value mb-2"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.1
          }}
        />
        <motion.div
          className="dashboard-skeleton dashboard-skeleton--text"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={getReducedVariants(dashboardAnimations.statsCard)}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{
        duration: getDuration(0.2),
        delay: index * 0.05,
        ease: 'easeOut'
      }}
      whileHover={shouldAnimate && !disabled ? hoverVariants.lift : undefined}
      whileTap={shouldAnimate && onClick && !disabled ? tapVariants.press : undefined}
      className={`
        dashboard-card text-gray-900 dark:text-white
        ${getThemeClasses(stat.variant)}
        ${onClick ? 'dashboard-card--interactive cursor-pointer' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick && !disabled ? 0 : -1}
      role={onClick ? 'button' : 'article'}
      aria-label={stat.ariaLabel || `${stat.label}: ${stat.displayValue || stat.value}`}
      aria-describedby={`${stat.id}-description ${stat.id}-context`}
      aria-disabled={disabled}
      aria-keyshortcuts={onClick ? 'Enter Space' : undefined}
      aria-pressed={onClick ? 'false' : undefined}
      data-testid={`stat-card-${stat.variant || stat.id}`}
      style={willChangeStyles.transform}
    >
      <div className="dashboard-card__header">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-lg ${getBackgroundClasses(stat.variant)}`}
            role="img"
            aria-label={`${stat.variant} icon`}
          >
            <IconComponent
              className="w-5 h-5 dashboard-card__accent"
              aria-hidden="true"
              role="presentation"
            />
          </div>
          <h3
            className="dashboard-card__title"
            id={`${stat.id}-title`}
          >
            {stat.label}
          </h3>
        </div>
        {stat.change && (
          <div
            className={`flex items-center gap-1 ${
              stat.change.direction === 'up' ? 'text-green-500' :
              stat.change.direction === 'down' ? 'text-red-500' :
              'text-gray-500'
            }`}
            data-testid={`trend-icon-${stat.variant || stat.id}`}
            role="img"
            aria-label={`Trend: ${stat.change.direction === 'up' ? 'increasing' : stat.change.direction === 'down' ? 'decreasing' : 'stable'}`}
          >
            {getTrendIcon(stat.change.direction)}
          </div>
        )}
      </div>

      <div className="dashboard-card__body">
        <div
          className="dashboard-card__value"
          role="text"
          aria-label={`Current value: ${stat.displayValue || stat.value}`}
        >
          {stat.displayValue || stat.value}
        </div>
        {stat.change && stat.change.period && (
          <div
            className="dashboard-card__subtitle"
            id={`${stat.id}-description`}
          >
            {stat.change.period}
          </div>
        )}
      </div>

      {/* Enhanced screen reader context */}
      <div id={`${stat.id}-context`} className="sr-only">
        {stat.variant === 'progress' && `Course progress: ${stat.value} percent completed. ${stat.change ? `${stat.change.direction === 'up' ? 'Increased' : stat.change.direction === 'down' ? 'Decreased' : 'No change'} from ${stat.change.period || 'previous period'}` : ''}`}
        {stat.variant === 'exams' && `Total exams completed: ${stat.value}. ${stat.change ? `${stat.change.direction === 'up' ? 'More' : stat.change.direction === 'down' ? 'Fewer' : 'Same number'} compared to ${stat.change.period || 'previous period'}` : ''}`}
        {stat.variant === 'score' && `Average exam score: ${stat.value} percent. ${stat.change ? `Performance ${stat.change.direction === 'up' ? 'improved' : stat.change.direction === 'down' ? 'declined' : 'remained stable'} from ${stat.change.period || 'previous period'}` : ''}`}
        {stat.variant === 'hours' && `Total study time: ${stat.value} hours. ${stat.change ? `Study time ${stat.change.direction === 'up' ? 'increased' : stat.change.direction === 'down' ? 'decreased' : 'remained the same'} from ${stat.change.period || 'previous period'}` : ''}`}
        {onClick ? '. Press Enter or Space to view detailed information.' : ''}
      </div>
    </motion.div>
  );
});

StatCardComponent.displayName = 'StatCardComponent';

/**
 * Error display component
 */
interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

const ErrorDisplay = ({ error, onRetry }: ErrorDisplayProps) => (
  <div
    data-testid="dashboard-stats-error"
    className="dashboard-card border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/20 p-6 text-center"
  >
    <AlertCircle
      className="w-8 h-8 text-red-500 mx-auto mb-4"
      data-testid="error-icon"
    />
    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
      Error loading statistics
    </h3>
    <p className="text-red-600 dark:text-red-300 mb-4">
      {error}
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="dashboard-btn dashboard-btn--secondary flex items-center gap-2 mx-auto"
        aria-label="Retry loading statistics"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    )}
  </div>
);

/**
 * Empty state component
 */
const EmptyDisplay = () => (
  <div
    data-testid="dashboard-stats-empty"
    className="dashboard-card p-6 text-center"
  >
    <Target className="w-8 h-8 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
      No statistics available
    </h3>
    <p className="text-gray-500 dark:text-gray-400">
      Start studying to see your progress here
    </p>
  </div>
);

/**
 * DashboardStats Component
 *
 * Displays course statistics in a responsive grid layout with loading states,
 * error handling, and accessibility features.
 */
const DashboardStats: React.FC<DashboardStatsProps & {
  onRetry?: () => void;
  disabled?: boolean;
}> = ({
  stats,
  loading = false,
  error = null,
  className = '',
  layout = {},
  animation = { enabled: true, duration: 200, stagger: 50 },
  accessibility = {},
  onStatClick,
  onRetry,
  disabled = false
}) => {
  const { getReducedVariants, getStaggerDelay, shouldAnimate } = useAnimationPreferences();
  // Handle error state
  if (error) {
    return (
      <div className={`dashboard-grid--stats ${className}`}>
        <ErrorDisplay error={error} onRetry={onRetry} />
      </div>
    );
  }

  // Handle empty state - check if stats is falsy, null, or not an array, or empty array
  if (!stats || !Array.isArray(stats) || stats.length === 0) {
    return (
      <div className={`dashboard-grid--stats ${className}`}>
        <EmptyDisplay />
      </div>
    );
  }

  // Handle loading state
  if (loading) {
    const skeletonStats = Array.from({ length: 4 }, (_, index) => ({
      id: `skeleton-${index}`,
      label: '',
      value: '',
      variant: ['progress', 'exams', 'score', 'hours'][index] as any
    }));

    return (
      <div
        data-testid="dashboard-stats-loading"
        className={`dashboard-grid--stats dashboard-stagger ${className}`}
      >
        {skeletonStats.map((stat, index) => (
          <StatCardComponent
            key={stat.id}
            stat={stat}
            index={index}
            loading={true}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={shouldAnimate ? getReducedVariants(dashboardAnimations.statsContainer) : undefined}
      initial={shouldAnimate ? "hidden" : false}
      animate={shouldAnimate ? "visible" : false}
      exit={shouldAnimate ? "exit" : false}
      className={`dashboard-grid--stats dashboard-stagger ${className}`}
      role="region"
      aria-label={accessibility?.regionLabel || "Course statistics dashboard"}
      aria-describedby="dashboard-stats-description dashboard-stats-instructions"
      aria-live="polite"
      aria-atomic="false"
      data-testid="dashboard-stats"
    >
      {/* Screen reader description */}
      <div id="dashboard-stats-description" className="sr-only">
        {accessibility?.description || "Dashboard showing course progress, completed exams, average scores, and study time"}
      </div>

      {/* Navigation instructions */}
      <div id="dashboard-stats-instructions" className="sr-only">
        {onStatClick ? 'Navigate using Tab and Shift+Tab. Press Enter or Space on any statistic to view detailed information. Use arrow keys to move between cards.' : 'Navigate using Tab and Shift+Tab to review statistics.'}
      </div>

      {/* Skip link for keyboard users */}
      {onStatClick && (
        <a
          href="#quick-actions"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          tabIndex={0}
        >
          Skip to actions
        </a>
      )}

      {/* Live region for dynamic updates */}
      <div
        id="stats-live-region"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="live-region"
      >
        {loading ? 'Loading statistics...' : error ? `Error: ${error}` : accessibility?.liveRegion ? 'Statistics updated successfully' : ''}
      </div>

      <AnimatePresence mode="popLayout">
        {stats.map((stat, index) => (
          <StatCardComponent
            key={stat.id}
            stat={stat}
            index={index}
            loading={false}
            disabled={disabled}
            onClick={onStatClick}
          />
        ))}
      </AnimatePresence>

      {/* Enhanced keyboard shortcuts help */}
      {onStatClick && (
        <div className="sr-only">
          <div id="keyboard-shortcuts" role="complementary" aria-label="Keyboard shortcuts">
            <h4>Keyboard shortcuts:</h4>
            <ul>
              <li>Tab / Shift+Tab: Navigate between statistics</li>
              <li>Enter or Space: Open detailed view</li>
              <li>Arrow keys: Quick navigation between cards</li>
              <li>Escape: Return to main navigation</li>
            </ul>
          </div>
        </div>
      )}
    </motion.div>
  );
};

DashboardStats.displayName = 'DashboardStats';

export default memo(DashboardStats);

// Named export for convenience
export { DashboardStats };