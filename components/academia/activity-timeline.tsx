"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  CheckCircle,
  Play,
  Trophy,
  Flame,
  Clock,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Activity as ActivityIcon
} from 'lucide-react';
import { ActivityTimelineProps, Activity } from './types/dashboard-interfaces';
import { dashboardAnimations, hoverVariants, willChangeStyles } from '@/lib/animations/dashboard-animations';
import { useAnimationPreferences } from '@/lib/hooks/useAnimationPreferences';

// Date formatting utility functions
const formatRelativeTime = (date: Date): string => {
  try {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;

    const years = Math.floor(months / 12);
    return `${years}y ago`;
  } catch (error) {
    return 'Unknown time';
  }
};

const formatDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return '';

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (minutes < 60) return `${minutes}m`;
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// Activity type configuration
const activityTypeConfig = {
  exam: {
    icon: CheckCircle,
    label: 'Exam completed',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  study: {
    icon: Play,
    label: 'Session started',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  achievement: {
    icon: Trophy,
    label: 'Achievement earned',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  progress: {
    icon: Flame,
    label: 'Progress milestone',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  note: {
    icon: BookOpen,
    label: 'Note added',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  system: {
    icon: ActivityIcon,
    label: 'System update',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  }
};

// Legacy activity type mapping for backwards compatibility
const legacyTypeMapping: Record<string, keyof typeof activityTypeConfig> = {
  'exam_completed': 'exam',
  'session_started': 'study',
  'achievement_earned': 'achievement',
  'streak_milestone': 'progress',
  'practice_session': 'study'
};

interface ActivityItemProps {
  activity: Activity;
  isLast: boolean;
  onClick?: (activity: Activity) => void;
}

const ActivityItem = ({ activity, isLast, onClick }: ActivityItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const activityRef = useRef<HTMLLIElement>(null);
  const { getReducedVariants, shouldAnimate } = useAnimationPreferences();

  // Determine activity type configuration
  const activityType = activity.type in activityTypeConfig
    ? activity.type
    : legacyTypeMapping[activity.type] || 'system';

  const config = activityTypeConfig[activityType];
  const IconComponent = activity.icon || config.icon;

  // Format activity data
  const formattedDate = formatRelativeTime(activity.date);
  const formattedDuration = activity.duration ? formatDuration(activity.duration * 60) : '';

  // Score formatting
  const getScoreDisplay = () => {
    if (activity.scoreDisplay) return activity.scoreDisplay;
    if (activity.score !== undefined && activity.score !== null) {
      const maxScore = activity.maxScore || 100;
      return `${activity.score}/${maxScore}`;
    }
    return null;
  };

  const scoreDisplay = getScoreDisplay();

  // Score badge color
  const getScoreBadgeColor = () => {
    if (!activity.score) return 'secondary';
    const percentage = activity.maxScore
      ? (activity.score / activity.maxScore) * 100
      : activity.score;

    if (percentage >= 90) return 'default'; // Green
    if (percentage >= 75) return 'secondary'; // Blue
    if (percentage >= 60) return 'outline'; // Yellow
    return 'destructive'; // Red
  };

  // Generate unique ID for accessibility
  const activityId = `activity-${activity.id}`;
  const descriptionId = `activity-desc-${activity.id}`;

  // Comprehensive activity description for screen readers
  const screenReaderDescription = useMemo(() => {
    const parts = [
      config.label,
      activity.title,
      activity.description,
      scoreDisplay ? `Score: ${scoreDisplay}` : '',
      formattedDuration ? `Duration: ${formattedDuration}` : '',
      `Completed ${formattedDate}`
    ].filter(Boolean);

    return parts.join(', ');
  }, [config.label, activity.title, activity.description, scoreDisplay, formattedDuration, formattedDate]);

  // Enhanced keyboard navigation with additional shortcuts
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(activity);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'j' || event.key === 'k') {
      event.preventDefault();
      const timeline = activityRef.current?.closest('[role="list"]');
      const items = timeline?.querySelectorAll('[role="listitem"]:not([aria-hidden="true"])');
      if (!items) return;

      const currentIndex = Array.from(items).indexOf(activityRef.current!);
      let nextIndex;

      if (event.key === 'ArrowDown' || event.key === 'j') {
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0; // Wrap to beginning
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1; // Wrap to end
      }

      (items[nextIndex] as HTMLElement)?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      const timeline = activityRef.current?.closest('[role="list"]');
      const firstItem = timeline?.querySelector('[role="listitem"]:not([aria-hidden="true"])');
      (firstItem as HTMLElement)?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      const timeline = activityRef.current?.closest('[role="list"]');
      const items = timeline?.querySelectorAll('[role="listitem"]:not([aria-hidden="true"])');
      const lastItem = items?.[items.length - 1];
      (lastItem as HTMLElement)?.focus();
    }
  };

  return (
    <motion.li
      ref={activityRef}
      role="listitem"
      tabIndex={0}
      aria-label={`${config.label}: ${activity.title}`}
      aria-describedby={`${descriptionId} ${activityId}-metadata`}
      aria-keyshortcuts="Enter Space"
      aria-roledescription="Timeline activity"
      aria-setsize={-1}
      aria-posinset={-1}
      className={cn(
        "relative group transition-all duration-200 outline-none",
        "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg",
        onClick && "cursor-pointer"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      onClick={() => onClick?.(activity)}
      variants={shouldAnimate ? getReducedVariants(dashboardAnimations.timelineItem) : undefined}
      initial={shouldAnimate ? "hidden" : false}
      animate={shouldAnimate ? "visible" : false}
      exit={shouldAnimate ? "exit" : false}
      whileHover={shouldAnimate && onClick ? hoverVariants.lift : undefined}
      style={willChangeStyles.transform}
    >
      {/* Timeline connector line */}
      {!isLast && (
        <div
          className="absolute left-6 top-12 w-0.5 h-full bg-gray-200 dark:bg-gray-700"
          aria-label="Timeline connector"
          aria-hidden="true"
        />
      )}

      <Card className={cn(
        "dashboard-timeline__item relative p-4 transition-all duration-200",
        "hover:shadow-md border-l-4 dashboard-card--interactive",
        config.borderColor,
        isHovered && "shadow-lg transform translate-x-1"
      )}>
        <div className="flex items-start gap-4">
          {/* Activity icon */}
          <div
            className={cn(
              "dashboard-timeline__icon flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
              "border-2 border-white shadow-sm",
              config.bgColor,
              config.borderColor
            )}
            role="img"
            aria-label={`${config.label} icon`}
          >
            <IconComponent
              className={cn("w-6 h-6", config.color)}
              aria-hidden="true"
              role="presentation"
            />
          </div>

          <div className="flex-1 min-w-0">
            {/* Activity header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    "dashboard-timeline__title font-semibold text-gray-900 dark:text-gray-100",
                    "truncate break-words text-sm"
                  )}
                  id={`${activityId}-title`}
                >
                  {activity.title}
                </h3>
                {activity.description && (
                  <p className="dashboard-timeline__description text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                    {activity.description}
                  </p>
                )}
              </div>

              {/* Score badge */}
              {scoreDisplay && (
                <Badge
                  variant={getScoreBadgeColor()}
                  className="dashboard-timeline__badge ml-2 flex-shrink-0 badge badge-success"
                  role="img"
                  aria-label={`Score: ${activity.score !== undefined && activity.score !== null ? `${Math.round(activity.score)} percent` : scoreDisplay}`}
                >
                  {activity.score !== undefined && activity.score !== null
                    ? `${Math.round(activity.score)}%`
                    : scoreDisplay
                  }
                </Badge>
              )}
            </div>

            {/* Activity metadata */}
            <div
              className="dashboard-timeline__metadata flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400"
              id={`${activityId}-metadata`}
              role="group"
              aria-label="Activity details"
            >
              {/* Timestamp */}
              <div className="flex items-center gap-1" role="group" aria-label="Activity timestamp">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <time
                  dateTime={activity.date.toISOString()}
                  aria-label={`Completed ${formattedDate}`}
                >
                  {formattedDate}
                </time>
              </div>

              {/* Duration */}
              {formattedDuration && (
                <div className="flex items-center gap-1" role="group" aria-label="Activity duration">
                  <CalendarDays className="w-3 h-3" aria-hidden="true" />
                  <span aria-label={`Duration: ${formattedDuration}`}>{formattedDuration}</span>
                </div>
              )}

              {/* Additional metadata */}
              {activity.metadata?.difficulty && (
                <Badge
                  variant="outline"
                  className="text-xs"
                  role="img"
                  aria-label={`Difficulty level: ${activity.metadata.difficulty}`}
                >
                  {activity.metadata.difficulty}
                </Badge>
              )}

              {activity.metadata?.improvement && (
                <div
                  className="flex items-center gap-1 text-green-600"
                  role="img"
                  aria-label={`Improvement: ${activity.metadata.improvement} percent increase`}
                >
                  <span>+{activity.metadata.improvement}%</span>
                </div>
              )}
            </div>

            {/* Additional score details */}
            {activity.metadata?.correct_answers && activity.metadata?.total_questions && (
              <div
                className="mt-2 text-xs text-gray-500"
                role="text"
                aria-label={`Results: ${activity.metadata.correct_answers} correct answers out of ${activity.metadata.total_questions} total questions`}
              >
                {activity.metadata.correct_answers}/{activity.metadata.total_questions} correct
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Hidden description for screen readers */}
      <div
        id={descriptionId}
        className="sr-only"
        aria-hidden="true"
      >
        {screenReaderDescription}
      </div>
    </motion.li>
  );
};

// Loading skeleton component
const ActivitySkeleton = ({ count = 3 }: { count?: number }) => (
  <>
    {Array.from({ length: count }, (_, index) => (
      <li
        key={`skeleton-${index}`}
        aria-label={`Loading activity ${index + 1} of ${count}`}
        aria-busy="true"
        className="relative"
        role="listitem"
      >
        {index < count - 1 && (
          <div className="absolute left-6 top-12 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
        )}

        <Card className="dashboard-skeleton p-4 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 ml-2" />
              </div>
              <div className="flex gap-4">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12" />
              </div>
            </div>
          </div>
        </Card>
      </li>
    ))}
  </>
);

// Empty state component
const EmptyState = ({
  message = "No recent activity",
  icon: Icon = Activity
}: {
  message?: string;
  icon?: React.ComponentType<any>;
}) => (
  <div
    className="dashboard-empty-state text-center py-12"
    role="region"
    aria-label="Empty activity timeline"
  >
    <Icon
      className="w-16 h-16 text-gray-400 mx-auto mb-4"
      aria-hidden="true"
      role="presentation"
    />
    <h3
      className="dashboard-empty-state__title text-lg font-medium text-gray-900 dark:text-gray-100 mb-2"
      id="empty-state-title"
    >
      {message}
    </h3>
    <p
      className="dashboard-empty-state__subtitle text-gray-600 dark:text-gray-400 max-w-sm mx-auto"
      aria-describedby="empty-state-title"
    >
      Start learning to see your progress and activities appear here.
    </p>
  </div>
);

// Main ActivityTimeline component
export const ActivityTimeline = ({
  activities = [],
  maxItems = 5,
  loading = false,
  error = null,
  className,
  emptyMessage = "No recent activity",
  emptyIcon = ActivityIcon,
  groupByDate = false,
  relativeTime = true,
  filter,
  sort,
  pagination,
  accessibility,
  onActivitySelect,
  onLoadMore
}: ActivityTimelineProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Process and sort activities
  const processedActivities = useMemo(() => {
    let processed = [...activities];

    // Apply custom filter
    if (filter) {
      processed = processed.filter(filter);
    }

    // Apply custom sort or default to date descending
    if (sort) {
      processed.sort(sort);
    } else {
      processed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return processed;
  }, [activities, filter, sort]);

  // Determine displayed activities
  const displayedActivities = useMemo(() => {
    if (isExpanded) return processedActivities;
    return processedActivities.slice(0, maxItems);
  }, [processedActivities, maxItems, isExpanded]);

  const hasMore = processedActivities.length > maxItems;
  const remainingCount = processedActivities.length - maxItems;

  // Handle show more/less
  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
    // Trigger onLoadMore callback if expanding for the first time
    if (!isExpanded && onLoadMore) {
      onLoadMore();
    }
  }, [isExpanded, onLoadMore]);

  // Handle activity selection
  const handleActivitySelect = useCallback((activity: Activity) => {
    onActivitySelect?.(activity);
  }, [onActivitySelect]);

  // Error state
  if (error) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="text-red-600 dark:text-red-400 mb-2">
          <ActivityIcon className="w-12 h-12 mx-auto mb-2" />
          <p className="font-medium">Unable to load activities</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <ul
          role="list"
          aria-label="Loading activities"
          className="space-y-4"
        >
          <ActivitySkeleton count={3} />
        </ul>
      </div>
    );
  }

  // Empty state
  if (processedActivities.length === 0) {
    return (
      <div className={className}>
        <EmptyState message={emptyMessage} icon={emptyIcon} />
      </div>
    );
  }

  return (
    <div className={cn("dashboard-timeline-container space-y-4", className)}>
      {/* Timeline list */}
      <motion.ul
        role="list"
        aria-label={accessibility?.regionLabel || "Activity timeline"}
        aria-describedby={["timeline-description", "timeline-instructions", accessibility?.description ? "timeline-custom-description" : null].filter(Boolean).join(' ')}
        className="dashboard-timeline timeline space-y-4 relative"
        aria-live="polite"
        aria-relevant="additions removals"
        variants={shouldAnimate ? getReducedVariants(dashboardAnimations.timelineContainer) : undefined}
        initial={shouldAnimate ? "hidden" : false}
        animate={shouldAnimate ? "visible" : false}
      >
        <AnimatePresence mode="popLayout">
          {displayedActivities.map((activity, index) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              isLast={index === displayedActivities.length - 1 && !hasMore}
              onClick={onActivitySelect ? handleActivitySelect : undefined}
            />
          ))}
        </AnimatePresence>
      </motion.ul>

      {/* Show more/less button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleExpanded}
            className="flex items-center gap-2"
            aria-expanded={isExpanded}
            aria-controls="activity-timeline"
            aria-describedby="expand-button-description"
          >
            <span id="expand-button-description" className="sr-only">
              {isExpanded
                ? 'Click to show fewer activities and collapse the timeline'
                : `Click to show ${remainingCount} additional activities`
              }
            </span>
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show {remainingCount} more
              </>
            )}
          </Button>
        </div>
      )}

      {/* Enhanced accessibility descriptions */}
      <div id="timeline-description" className="sr-only">
        {displayedActivities.length > 0
          ? `Activity timeline showing ${displayedActivities.length} ${displayedActivities.length === 1 ? 'activity' : 'activities'}${hasMore ? ` of ${processedActivities.length} total` : ''}. Most recent activity first.`
          : 'Activity timeline is empty. No activities to display.'
        }
      </div>

      <div id="timeline-instructions" className="sr-only">
        {onActivitySelect
          ? 'Navigate using Tab and Shift+Tab, or Arrow keys and J/K shortcuts. Press Enter or Space to view activity details. Use Home and End keys to jump to first or last activity.'
          : 'Navigate using Tab and Shift+Tab to review activities.'
        }
      </div>

      {accessibility?.description && (
        <div id="timeline-custom-description" className="sr-only">
          {accessibility.description}
        </div>
      )}

      {accessibility?.navigationHint && (
        <div className="sr-only" role="complementary" aria-label="Additional navigation help">
          {accessibility.navigationHint}
        </div>
      )}

      {/* Keyboard shortcuts reference */}
      {onActivitySelect && (
        <div className="sr-only" role="complementary" aria-label="Keyboard shortcuts">
          <h4>Available keyboard shortcuts:</h4>
          <ul>
            <li>Tab/Shift+Tab: Navigate between activities</li>
            <li>Arrow Up/Down or J/K: Quick navigation with wrapping</li>
            <li>Home/End: Jump to first or last activity</li>
            <li>Enter/Space: View activity details</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;