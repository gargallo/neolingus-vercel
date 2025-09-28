"use client";

import React, { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/theme-utils';
import {
  Play,
  BarChart3,
  BookOpen,
  Settings,
  HelpCircle,
  Download,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { QuickActionsProps, QuickAction } from '@/components/academia/types/dashboard-interfaces';
import { dashboardAnimations, hoverVariants, tapVariants } from '@/lib/animations/dashboard-animations';
import { useAnimationPreferences } from '@/lib/hooks/useAnimationPreferences';

/**
 * QuickActions Component
 *
 * Displays primary and secondary action buttons for course dashboard interactions.
 * Features responsive layout, loading states, accessibility support, and smooth animations.
 *
 * @param props - QuickActionsProps interface
 * @returns JSX element for the quick actions section
 */
const QuickActions: React.FC<QuickActionsProps> = memo(({
  primaryAction,
  secondaryActions = [],
  disabled = false,
  loading = false,
  className,
  layout = {
    arrangement: 'horizontal',
    responsive: {
      mobile: 'stack',
      tablet: 'horizontal',
      desktop: 'horizontal'
    },
    spacing: 'normal'
  },
  accessibility = {
    groupLabel: 'Quick Actions',
    instructions: 'Use these buttons to perform common course actions',
    keyboardHints: true
  }
}) => {
  // Animation preferences for accessibility
  const {
    shouldAnimate,
    getReducedVariants,
    getStaggerDelay,
    getDuration
  } = useAnimationPreferences();
  // Handle action click with loading debouncing
  const handleActionClick = useCallback((action: QuickAction, event: React.MouseEvent) => {
    if (disabled || action.disabled || action.isLoading || loading) {
      event.preventDefault();
      return;
    }

    action.onClick();
  }, [disabled, loading]);

  // Render individual action button
  const renderActionButton = useCallback((action: QuickAction, isPrimary = false) => {
    const isDisabled = disabled || action.disabled || loading;
    const isButtonLoading = action.isLoading || loading;

    return (
      <motion.div
        key={action.id}
        variants={shouldAnimate ? getReducedVariants(
          isPrimary ? dashboardAnimations.primaryAction : dashboardAnimations.secondaryAction
        ) : undefined}
        initial={shouldAnimate ? "hidden" : false}
        animate={shouldAnimate ? "visible" : false}
        exit={shouldAnimate ? "exit" : false}
        whileHover={shouldAnimate && !isDisabled ? hoverVariants.lift : undefined}
        whileTap={shouldAnimate && !isDisabled ? tapVariants.press : undefined}
        className={cn(
          "relative",
          isPrimary ? "flex-shrink-0" : "flex-1 min-w-0",
          shouldAnimate && "will-change-transform"
        )}
        style={{
          willChange: shouldAnimate ? 'transform, opacity' : 'auto'
        }}
      >
        <Button
          variant={action.variant || (isPrimary ? 'construction' : 'outline')}
          size={action.size || (isPrimary ? 'lg' : 'default')}
          disabled={isDisabled}
          onClick={(e) => handleActionClick(action, e)}
          className={cn(
            "dashboard-btn w-full relative",
            shouldAnimate ? `transition-all duration-${getDuration('medium')}` : "transition-all duration-300",
            isPrimary && [
              "dashboard-btn--primary dashboard-btn--lg h-12 px-6 font-semibold",
              "shadow-construction-medium hover:shadow-construction-heavy",
              !shouldAnimate && "transform hover:scale-105 active:scale-95"
            ],
            !isPrimary && [
              "dashboard-btn--secondary h-10",
              !shouldAnimate && "hover:scale-102 active:scale-98"
            ],
            isButtonLoading && "cursor-wait dashboard-btn--loading",
            action.className
          )}
          aria-label={action.description || action.label}
          aria-describedby={[
            action.shortcut ? `${action.id}-shortcut` : null,
            `${action.id}-state`,
            isPrimary ? 'primary-action-help' : 'secondary-action-help'
          ].filter(Boolean).join(' ')}
          aria-keyshortcuts={action.shortcut}
          aria-pressed={action.variant === 'construction' ? 'false' : undefined}
          data-primary={isPrimary}
          role="button"
        >
          <div className="flex items-center justify-center gap-2">
            {/* Loading spinner or icon */}
            <AnimatePresence mode="wait">
              {isButtonLoading ? (
                <motion.div
                  key="loading"
                  initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
                  animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
                  exit={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
                  transition={shouldAnimate ? { duration: getDuration('fast') } : undefined}
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                </motion.div>
              ) : action.icon ? (
                <motion.div
                  key="icon"
                  initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
                  animate={shouldAnimate ? { opacity: 1, scale: 1 } : false}
                  exit={shouldAnimate ? { opacity: 0, scale: 0.8 } : false}
                  transition={shouldAnimate ? { duration: getDuration('fast') } : undefined}
                >
                  <action.icon className="w-4 h-4" />
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Button label */}
            <span className={cn(
              "truncate",
              isPrimary && "font-semibold"
            )}>
              {action.label}
            </span>

            {/* Primary action arrow */}
            {isPrimary && !isButtonLoading && (
              <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
            )}
          </div>

          {/* Badge indicator */}
          {action.badge && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 min-w-[1.25rem] h-5 text-xs"
            >
              {action.badge}
            </Badge>
          )}
        </Button>

        {/* Enhanced accessibility context */}
        <div id={`${action.id}-state`} className="sr-only">
          {isButtonLoading ? 'Loading...' : isDisabled ? 'Currently unavailable' : 'Ready'}
          {action.badge ? `. Has ${action.badge} notifications` : ''}
          {isPrimary ? '. Primary action' : '. Secondary action'}
        </div>

        {/* Keyboard shortcut hint */}
        {action.shortcut && accessibility.keyboardHints && (
          <span
            id={`${action.id}-shortcut`}
            className="sr-only"
            aria-label={`Keyboard shortcut available`}
          >
            Keyboard shortcut: {action.shortcut}
          </span>
        )}
      </motion.div>
    );
  }, [disabled, loading, handleActionClick, accessibility.keyboardHints]);

  // Get layout classes based on configuration
  const getLayoutClasses = () => {
    const { arrangement, responsive, spacing } = layout;

    let classes = [];

    // Base arrangement
    switch (arrangement) {
      case 'vertical':
        classes.push('flex flex-col');
        break;
      case 'grid':
        classes.push('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3');
        break;
      default:
        classes.push('flex');
    }

    // Responsive behavior
    if (responsive?.mobile === 'stack') {
      classes.push('flex-col sm:flex-row');
    }

    // Spacing
    switch (spacing) {
      case 'tight':
        classes.push('gap-2');
        break;
      case 'loose':
        classes.push('gap-6');
        break;
      default:
        classes.push('gap-4');
    }

    return classes.join(' ');
  };

  // Show enhanced loading state
  if (loading && !primaryAction && secondaryActions.length === 0) {
    return (
      <div
        className={cn("dashboard-actions space-y-4", className)}
        role="region"
        aria-label={accessibility.groupLabel}
        aria-describedby="quick-actions-loading"
        aria-live="polite"
        aria-busy="true"
        id="quick-actions"
      >
        <div className="dashboard-skeleton flex items-center justify-center py-8">
          <Loader2
            className="w-6 h-6 animate-spin text-construction-primary"
            aria-hidden="true"
            role="presentation"
          />
          <span id="quick-actions-loading" className="sr-only">
            Loading quick actions. Please wait.
          </span>
        </div>
      </div>
    );
  }

  return (
    <section
      className={cn("dashboard-actions space-y-4", className)}
      role="region"
      aria-label={accessibility.groupLabel}
      aria-describedby="quick-actions-description quick-actions-instructions"
      id="quick-actions"
    >
      {/* Enhanced accessibility descriptions */}
      <div id="quick-actions-description" className="sr-only">
        {accessibility.instructions}
        {primaryAction ? ` Primary action available: ${primaryAction.label}.` : ''}
        {secondaryActions.length > 0 ? ` ${secondaryActions.length} secondary actions available.` : ''}
      </div>

      <div id="quick-actions-instructions" className="sr-only">
        Navigate using Tab and Shift+Tab. Activate buttons with Enter or Space.
        {accessibility.keyboardHints ? ' Some actions have keyboard shortcuts.' : ''}
      </div>

      {/* Action type helpers */}
      <div id="primary-action-help" className="sr-only">
        This is the main action for this section.
      </div>
      <div id="secondary-action-help" className="sr-only">
        This is an additional action option.
      </div>

      {/* Primary Action */}
      <AnimatePresence>
        {primaryAction && (
          <motion.div
            variants={shouldAnimate ? getReducedVariants(dashboardAnimations.actionContainer) : undefined}
            initial={shouldAnimate ? "hidden" : false}
            animate={shouldAnimate ? "visible" : false}
            exit={shouldAnimate ? "exit" : false}
            className="w-full"
          >
            {renderActionButton(primaryAction, true)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secondary Actions */}
      {secondaryActions.length > 0 && (
        <motion.div
          variants={shouldAnimate ? getReducedVariants(dashboardAnimations.actionContainer) : undefined}
          initial={shouldAnimate ? "hidden" : false}
          animate={shouldAnimate ? "visible" : false}
          transition={shouldAnimate ? {
            duration: getDuration('medium'),
            delay: getStaggerDelay('medium')
          } : undefined}
          className={cn(
            "w-full",
            getLayoutClasses()
          )}
          role="group"
          aria-label="Secondary actions"
          aria-describedby="secondary-actions-count"
        >
          {/* Secondary actions count for screen readers */}
          <div id="secondary-actions-count" className="sr-only">
            {secondaryActions.length} secondary actions available
          </div>

          <AnimatePresence>
            {secondaryActions.map((action, index) => (
              <motion.div
                key={action.id}
                variants={shouldAnimate ? getReducedVariants(dashboardAnimations.secondaryAction) : undefined}
                initial={shouldAnimate ? "hidden" : false}
                animate={shouldAnimate ? "visible" : false}
                exit={shouldAnimate ? "exit" : false}
                transition={shouldAnimate ? {
                  duration: getDuration('fast'),
                  delay: index * getStaggerDelay('fast')
                } : undefined}
                className="flex-1"
              >
                {renderActionButton(action, false)}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Enhanced empty state */}
      {!primaryAction && secondaryActions.length === 0 && !loading && (
        <div
          className="dashboard-empty-state text-center py-8"
          role="status"
          aria-label="No actions available"
        >
          <HelpCircle
            className="w-12 h-12 mx-auto text-gray-400 mb-4"
            aria-hidden="true"
            role="presentation"
          />
          <p
            className="dashboard-empty-state__title text-gray-600"
            id="empty-actions-title"
          >
            No actions available
          </p>
          <p
            className="dashboard-empty-state__subtitle text-sm text-gray-500 mt-1"
            aria-describedby="empty-actions-title"
          >
            Actions will appear here when course data is loaded
          </p>
        </div>
      )}
    </section>
  );
});

QuickActions.displayName = 'QuickActions';

export default QuickActions;

// Default action configurations for common use cases with enhanced accessibility
export const defaultQuickActions = {
  startExam: (onClick: () => void, loading = false): QuickAction => ({
    id: 'start-exam',
    label: 'Start Exam',
    description: 'Begin a new exam session for this course',
    icon: Play,
    onClick,
    variant: 'construction' as const,
    isLoading: loading,
    shortcut: 'Ctrl+Enter'
  }),

  viewProgress: (onClick: () => void): QuickAction => ({
    id: 'view-progress',
    label: 'Review Progress',
    description: 'View detailed progress analytics and performance metrics',
    icon: BarChart3,
    onClick,
    variant: 'outline' as const
  }),

  studyMaterials: (onClick: () => void): QuickAction => ({
    id: 'study-materials',
    label: 'Study Materials',
    description: 'Access course resources, guides, and learning materials',
    icon: BookOpen,
    onClick,
    variant: 'secondary' as const
  }),

  settings: (onClick: () => void): QuickAction => ({
    id: 'settings',
    label: 'Settings',
    description: 'Configure course preferences and account settings',
    icon: Settings,
    onClick,
    variant: 'ghost' as const,
    size: 'sm' as const
  }),

  help: (onClick: () => void): QuickAction => ({
    id: 'help',
    label: 'Help',
    description: 'Get help, support, and frequently asked questions',
    icon: HelpCircle,
    onClick,
    variant: 'ghost' as const,
    size: 'sm' as const
  }),

  exportData: (onClick: () => void, loading = false): QuickAction => ({
    id: 'export-data',
    label: 'Export Data',
    description: 'Download your progress data and learning history',
    icon: Download,
    onClick,
    variant: 'outline' as const,
    size: 'sm' as const,
    isLoading: loading
  })
};