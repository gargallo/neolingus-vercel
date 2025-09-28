import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { runFullAccessibilityTest } from './accessibility-utils';
import { testKeyboardInteraction, testScreenReaderContent, testTouchTargets } from './manual-testing-helpers';

// Import components for testing
import DashboardStats from '@/components/academia/dashboard-stats';
import ActivityTimeline from '@/components/academia/activity-timeline';
import QuickActions from '@/components/academia/quick-actions';

// Mock dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

jest.mock('@/lib/hooks/useAnimationPreferences', () => ({
  useAnimationPreferences: () => ({
    getReducedVariants: (variants: any) => variants,
    getDuration: (duration: number) => duration,
    shouldAnimate: false,
    getStaggerDelay: (index: number) => index * 0.1,
  }),
}));

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Component-Specific Accessibility Tests', () => {
  // Mock data
  const mockStats = [
    {
      id: 'overall-progress',
      label: 'Overall Progress',
      value: '85%',
      displayValue: '85%',
      variant: 'progress' as const,
      ariaLabel: 'Overall course progress: 85 percent completed',
      change: {
        direction: 'up' as const,
        period: 'from last week'
      }
    },
    {
      id: 'completed-exams',
      label: 'Completed Exams',
      value: '12',
      variant: 'exams' as const,
      ariaLabel: 'Total completed exams: 12'
    },
    {
      id: 'average-score',
      label: 'Average Score',
      value: '78%',
      variant: 'score' as const,
      ariaLabel: 'Average exam score: 78 percent',
      change: {
        direction: 'down' as const,
        period: 'from last month'
      }
    },
    {
      id: 'study-hours',
      label: 'Study Hours',
      value: '45h',
      variant: 'hours' as const,
      ariaLabel: 'Total study time: 45 hours',
      change: {
        direction: 'stable' as const,
        period: 'this week'
      }
    }
  ];

  const mockActivities = [
    {
      id: '1',
      type: 'exam_completed',
      examTitle: 'Listening Comprehension Practice',
      score: 85,
      duration: 2400,
      date: new Date('2023-12-01'),
      formattedDate: '1 Dec 2023',
      formattedDuration: '40 min'
    },
    {
      id: '2',
      type: 'study_session',
      topic: 'Grammar Review',
      duration: 1800,
      date: new Date('2023-11-30'),
      formattedDate: '30 Nov 2023',
      formattedDuration: '30 min'
    },
    {
      id: '3',
      type: 'achievement_unlocked',
      achievement: 'First Perfect Score',
      date: new Date('2023-11-29'),
      formattedDate: '29 Nov 2023'
    }
  ];

  const mockQuickActions = {
    primary: {
      label: 'Start Practice Exam',
      onClick: jest.fn(),
      disabled: false,
      ariaLabel: 'Start a new practice exam session',
      loading: false
    },
    secondary: [
      {
        label: 'View Progress',
        onClick: jest.fn(),
        icon: 'chart',
        ariaLabel: 'View detailed progress analytics',
        disabled: false
      },
      {
        label: 'Study Resources',
        onClick: jest.fn(),
        icon: 'book',
        ariaLabel: 'Access study materials and resources',
        disabled: false
      },
      {
        label: 'Settings',
        onClick: jest.fn(),
        icon: 'settings',
        ariaLabel: 'Open course settings',
        disabled: true
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getBoundingClientRect for touch target tests
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 48,
      height: 48,
      top: 0,
      left: 0,
      bottom: 48,
      right: 48,
      x: 0,
      y: 0,
      toJSON: jest.fn()
    }));

    // Mock getComputedStyle for consistent test results
    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        color: 'rgb(15, 23, 42)',
        backgroundColor: 'rgb(255, 255, 255)',
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '24px',
        letterSpacing: '0.02em',
        wordSpacing: '0.16em',
        marginBottom: '16px',
        paddingBottom: '0px',
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        width: '200px',
        height: '48px',
        outline: '2px solid rgb(59, 130, 246)',
        outlineWidth: '2px',
        boxShadow: '0 0 0 2px rgb(59, 130, 246)'
      }),
      writable: true
    });
  });

  describe('DashboardStats Component Specific Tests', () => {
    describe('Statistical Data Accessibility', () => {
      it('should announce percentage values clearly to screen readers', () => {
        render(<DashboardStats stats={mockStats} onStatClick={jest.fn()} />);

        const progressStat = screen.getByRole('button', { name: /overall course progress.*85 percent/i });
        expect(progressStat).toBeInTheDocument();

        const scoreStat = screen.getByRole('button', { name: /average exam score.*78 percent/i });
        expect(scoreStat).toBeInTheDocument();
      });

      it('should provide context for numerical values', () => {
        render(<DashboardStats stats={mockStats} />);

        const examsStat = screen.getByRole('button', { name: /total completed exams.*12/i });
        expect(examsStat).toBeInTheDocument();

        const hoursStat = screen.getByRole('button', { name: /total study time.*45 hours/i });
        expect(hoursStat).toBeInTheDocument();
      });

      it('should announce trend changes accessibly', () => {
        render(<DashboardStats stats={mockStats} />);

        // Check trend indicators
        const upTrend = screen.getByTestId('trend-icon-progress');
        expect(upTrend).toHaveAttribute('aria-label', 'Trend: increasing');

        const downTrend = screen.getByTestId('trend-icon-score');
        expect(downTrend).toHaveAttribute('aria-label', 'Trend: decreasing');

        const stableTrend = screen.getByTestId('trend-icon-hours');
        expect(stableTrend).toHaveAttribute('aria-label', 'Trend: stable');
      });

      it('should provide detailed context in screen reader content', () => {
        render(<DashboardStats stats={mockStats} />);

        // Check for enhanced screen reader descriptions
        const progressButton = screen.getByRole('button', { name: /overall course progress/i });
        const contextId = progressButton.getAttribute('aria-describedby')?.split(' ')[1];

        if (contextId) {
          const contextElement = document.getElementById(contextId);
          expect(contextElement).toHaveTextContent(/course progress.*85 percent completed.*increased.*from last week/i);
        }
      });

      it('should handle empty or zero values accessibly', () => {
        const emptyStats = [
          {
            id: 'no-progress',
            label: 'Progress',
            value: '0%',
            variant: 'progress' as const,
            ariaLabel: 'No progress yet'
          }
        ];

        render(<DashboardStats stats={emptyStats} />);

        const emptyStat = screen.getByRole('button', { name: /no progress yet/i });
        expect(emptyStat).toBeInTheDocument();
      });
    });

    describe('Loading and Error States', () => {
      it('should provide accessible loading indicators', () => {
        render(<DashboardStats stats={[]} loading={true} />);

        const loadingRegion = screen.getByTestId('dashboard-stats-loading');
        expect(loadingRegion).toBeInTheDocument();

        // Check for skeleton screens with proper ARIA
        const skeletons = screen.getAllByTestId(/stat-skeleton/);
        expect(skeletons.length).toBeGreaterThan(0);

        skeletons.forEach(skeleton => {
          expect(skeleton).toHaveClass('dashboard-card--loading');
        });
      });

      it('should announce loading state to screen readers', () => {
        render(<DashboardStats stats={[]} loading={true} />);

        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveTextContent('Loading statistics...');
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      });

      it('should provide actionable error messages', () => {
        const mockRetry = jest.fn();
        render(
          <DashboardStats
            stats={[]}
            error="Connection timeout. Unable to load statistics."
            onRetry={mockRetry}
          />
        );

        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveTextContent(/connection timeout/i);

        const retryButton = screen.getByRole('button', { name: /retry loading statistics/i });
        expect(retryButton).toBeInTheDocument();

        fireEvent.click(retryButton);
        expect(mockRetry).toHaveBeenCalled();
      });
    });

    describe('Interactive Behaviors', () => {
      it('should support all keyboard interactions', async () => {
        const user = userEvent.setup();
        const mockOnStatClick = jest.fn();

        render(<DashboardStats stats={mockStats} onStatClick={mockOnStatClick} />);

        const firstStat = screen.getAllByRole('button')[0];

        // Test focus
        await user.tab();
        expect(firstStat).toHaveFocus();

        // Test Enter key
        await user.keyboard('{Enter}');
        expect(mockOnStatClick).toHaveBeenCalledWith(mockStats[0].id);

        // Test Space key
        mockOnStatClick.mockClear();
        await user.keyboard(' ');
        expect(mockOnStatClick).toHaveBeenCalledWith(mockStats[0].id);
      });

      it('should handle disabled states properly', () => {
        render(<DashboardStats stats={mockStats} disabled={true} />);

        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAttribute('aria-disabled', 'true');
          expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
        });
      });

      it('should maintain focus management', async () => {
        const user = userEvent.setup();

        render(
          <div>
            <button>Before</button>
            <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
            <button>After</button>
          </div>
        );

        // Should maintain logical tab order
        await user.tab(); // Before button
        await user.tab(); // First stat
        await user.tab(); // Second stat
        await user.tab(); // Third stat
        await user.tab(); // Fourth stat
        await user.tab(); // After button

        const afterButton = screen.getByRole('button', { name: 'After' });
        expect(afterButton).toHaveFocus();
      });
    });
  });

  describe('ActivityTimeline Component Specific Tests', () => {
    describe('Temporal Data Accessibility', () => {
      it('should provide accessible date and time information', () => {
        render(<ActivityTimeline activities={mockActivities} />);

        // Check for proper time element usage
        const timeElements = screen.getAllByText(/\d{1,2} \w{3} \d{4}/); // Date format
        expect(timeElements.length).toBeGreaterThan(0);

        // Check for duration information
        const durationElements = screen.getAllByText(/\d+\s+min/);
        expect(durationElements.length).toBeGreaterThan(0);
      });

      it('should provide semantic structure for timeline', () => {
        render(<ActivityTimeline activities={mockActivities} />);

        const listContainer = screen.getByRole('list');
        expect(listContainer).toBeInTheDocument();

        const listItems = screen.getAllByRole('listitem');
        expect(listItems.length).toBe(mockActivities.length);
      });

      it('should announce activity types clearly', () => {
        render(<ActivityTimeline activities={mockActivities} onActivitySelect={jest.fn()} />);

        // Check for activity type announcements
        const examActivity = screen.getByText(/listening comprehension practice/i);
        expect(examActivity).toBeInTheDocument();

        const studyActivity = screen.getByText(/grammar review/i);
        expect(studyActivity).toBeInTheDocument();

        const achievementActivity = screen.getByText(/first perfect score/i);
        expect(achievementActivity).toBeInTheDocument();
      });

      it('should provide score information accessibly', () => {
        render(<ActivityTimeline activities={mockActivities} />);

        // Should announce scores with context
        const scoreElement = screen.getByText('85%');
        expect(scoreElement).toBeInTheDocument();

        // Score should be associated with its activity
        const examContainer = scoreElement.closest('[role="listitem"]');
        expect(examContainer).toHaveTextContent(/listening comprehension practice/i);
      });
    });

    describe('Interactive Timeline Behaviors', () => {
      it('should support keyboard navigation through activities', async () => {
        const user = userEvent.setup();
        const mockOnActivitySelect = jest.fn();

        render(<ActivityTimeline activities={mockActivities} onActivitySelect={mockOnActivitySelect} />);

        const activityButtons = screen.getAllByRole('button');

        if (activityButtons.length > 0) {
          await user.tab();
          expect(activityButtons[0]).toHaveFocus();

          await user.keyboard('{Enter}');
          expect(mockOnActivitySelect).toHaveBeenCalledWith(mockActivities[0]);
        }
      });

      it('should handle empty timeline state', () => {
        render(
          <ActivityTimeline
            activities={[]}
            emptyMessage="No recent activity to display"
          />
        );

        const emptyMessage = screen.getByText(/no recent activity to display/i);
        expect(emptyMessage).toBeInTheDocument();
      });

      it('should support activity filtering announcements', () => {
        render(<ActivityTimeline activities={mockActivities} maxItems={2} />);

        // Should only show limited items
        const listItems = screen.getAllByRole('listitem');
        expect(listItems.length).toBe(2);
      });
    });

    describe('Loading and Error States', () => {
      it('should provide accessible loading state', () => {
        render(<ActivityTimeline activities={[]} loading={true} />);

        // Should announce loading to screen readers
        const loadingIndicator = screen.getByText(/loading/i);
        expect(loadingIndicator).toBeInTheDocument();
      });

      it('should handle error states accessibly', () => {
        render(
          <ActivityTimeline
            activities={[]}
            error="Failed to load recent activities"
          />
        );

        const errorMessage = screen.getByText(/failed to load recent activities/i);
        expect(errorMessage).toBeInTheDocument();
      });
    });
  });

  describe('QuickActions Component Specific Tests', () => {
    describe('Action Button Accessibility', () => {
      it('should provide clear action descriptions', () => {
        render(<QuickActions {...mockQuickActions} />);

        const primaryButton = screen.getByRole('button', { name: /start a new practice exam session/i });
        expect(primaryButton).toBeInTheDocument();

        const progressButton = screen.getByRole('button', { name: /view detailed progress analytics/i });
        expect(progressButton).toBeInTheDocument();

        const resourcesButton = screen.getByRole('button', { name: /access study materials and resources/i });
        expect(resourcesButton).toBeInTheDocument();
      });

      it('should handle primary vs secondary action hierarchy', () => {
        render(<QuickActions {...mockQuickActions} />);

        const primaryButton = screen.getByRole('button', { name: /start a new practice exam session/i });
        const secondaryButtons = screen.getAllByRole('button').filter(btn =>
          btn.getAttribute('aria-label')?.includes('view') ||
          btn.getAttribute('aria-label')?.includes('access')
        );

        // Primary button should be prominently styled
        expect(primaryButton).toBeInTheDocument();
        expect(secondaryButtons.length).toBeGreaterThan(0);
      });

      it('should provide proper grouping for related actions', () => {
        render(
          <QuickActions
            {...mockQuickActions}
            accessibility={{
              groupLabel: 'Course Quick Actions',
              instructions: 'Use these buttons to quickly access key course features'
            }}
          />
        );

        const actionGroup = screen.getByRole('group', { name: /course quick actions/i });
        expect(actionGroup).toBeInTheDocument();

        const instructions = screen.getByText(/use these buttons to quickly access/i);
        expect(instructions).toHaveClass('sr-only');
      });

      it('should handle disabled actions accessibly', () => {
        render(<QuickActions {...mockQuickActions} />);

        const disabledButton = screen.getByRole('button', { name: /open course settings/i });
        expect(disabledButton).toBeDisabled();
        expect(disabledButton).toHaveAttribute('aria-disabled', 'true');
      });
    });

    describe('Loading and Interactive States', () => {
      it('should handle loading states for actions', () => {
        const loadingActions = {
          ...mockQuickActions,
          primary: {
            ...mockQuickActions.primary,
            loading: true
          }
        };

        render(<QuickActions {...loadingActions} />);

        const primaryButton = screen.getByRole('button', { name: /start a new practice exam session/i });
        expect(primaryButton).toBeDisabled();
        expect(primaryButton).toHaveAttribute('aria-disabled', 'true');
      });

      it('should support keyboard activation for all actions', async () => {
        const user = userEvent.setup();

        render(<QuickActions {...mockQuickActions} />);

        const primaryButton = screen.getByRole('button', { name: /start a new practice exam session/i });

        await user.tab();
        expect(primaryButton).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(mockQuickActions.primary.onClick).toHaveBeenCalled();

        // Test secondary actions
        await user.tab();
        const secondaryButton = screen.getByRole('button', { name: /view detailed progress analytics/i });
        expect(secondaryButton).toHaveFocus();

        await user.keyboard(' ');
        expect(mockQuickActions.secondary[0].onClick).toHaveBeenCalled();
      });

      it('should meet touch target requirements', () => {
        const { container } = render(<QuickActions {...mockQuickActions} />);

        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
          const touchTargetResult = testTouchTargets(button);
          expect(touchTargetResult.meetsMinimumSize).toBe(true);
          expect(touchTargetResult.width).toBeGreaterThanOrEqual(44);
          expect(touchTargetResult.height).toBeGreaterThanOrEqual(44);
        });
      });
    });

    describe('Responsive Behavior', () => {
      it('should maintain accessibility across different layouts', () => {
        render(
          <QuickActions
            {...mockQuickActions}
            layout={{
              arrangement: 'vertical',
              spacing: 'compact',
              responsive: {
                mobile: 'stack',
                tablet: 'vertical',
                desktop: 'horizontal'
              }
            }}
          />
        );

        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
          expect(button.getAttribute('aria-label')!.length).toBeGreaterThan(10);
        });
      });

      it('should handle overflow scenarios accessibly', () => {
        const manyActions = {
          primary: mockQuickActions.primary,
          secondary: Array.from({ length: 10 }, (_, i) => ({
            label: `Action ${i + 1}`,
            onClick: jest.fn(),
            icon: 'generic',
            ariaLabel: `Perform action ${i + 1}`,
            disabled: false
          }))
        };

        render(<QuickActions {...manyActions} />);

        const allButtons = screen.getAllByRole('button');
        expect(allButtons.length).toBe(11); // 1 primary + 10 secondary

        // All should be accessible
        allButtons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
        });
      });
    });
  });

  describe('Cross-Component Integration Tests', () => {
    it('should maintain consistent accessibility patterns across components', async () => {
      const { container } = render(
        <div>
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
          <ActivityTimeline activities={mockActivities} onActivitySelect={jest.fn()} />
          <QuickActions {...mockQuickActions} />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support consistent keyboard navigation patterns', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
          <ActivityTimeline activities={mockActivities} onActivitySelect={jest.fn()} />
          <QuickActions {...mockQuickActions} />
        </div>
      );

      // Should be able to navigate through all components
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThan(5);

      // Test navigation through all buttons
      for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
        await user.tab();
        expect(document.activeElement).toBeTruthy();
      }
    });

    it('should provide consistent screen reader experience', () => {
      const { container } = render(
        <div>
          <DashboardStats
            stats={mockStats}
            accessibility={{
              regionLabel: 'Course Statistics',
              description: 'Overview of your course progress and performance'
            }}
          />
          <ActivityTimeline activities={mockActivities} />
          <QuickActions
            {...mockQuickActions}
            accessibility={{
              groupLabel: 'Quick Actions',
              instructions: 'Access key course features quickly'
            }}
          />
        </div>
      );

      // Check for consistent labeling patterns
      const region = screen.getByRole('region', { name: /course statistics/i });
      expect(region).toBeInTheDocument();

      const group = screen.getByRole('group', { name: /quick actions/i });
      expect(group).toBeInTheDocument();

      // Check for consistent instruction patterns
      const statsInstructions = screen.getByText(/overview of your course progress/i);
      expect(statsInstructions).toBeInTheDocument();

      const actionsInstructions = screen.getByText(/access key course features/i);
      expect(actionsInstructions).toBeInTheDocument();
    });

    it('should handle error states consistently across components', () => {
      render(
        <div>
          <DashboardStats
            stats={[]}
            error="Failed to load statistics"
            onRetry={jest.fn()}
          />
          <ActivityTimeline
            activities={[]}
            error="Failed to load activities"
          />
          <QuickActions
            primary={{ ...mockQuickActions.primary, disabled: true }}
            secondary={[]}
          />
        </div>
      );

      // All error states should be announced as alerts
      const statsError = screen.getByText(/failed to load statistics/i);
      expect(statsError.closest('[role="alert"]')).toBeInTheDocument();

      const activitiesError = screen.getByText(/failed to load activities/i);
      expect(activitiesError).toBeInTheDocument();

      // Disabled states should be properly marked
      const disabledAction = screen.getByRole('button', { name: /start a new practice exam session/i });
      expect(disabledAction).toBeDisabled();
    });

    it('should run comprehensive component accessibility test suite', async () => {
      const testResults = await runFullAccessibilityTest(
        <div>
          <h1>Course Dashboard</h1>
          <main>
            <section aria-labelledby="stats-heading">
              <h2 id="stats-heading">Course Statistics</h2>
              <DashboardStats
                stats={mockStats}
                onStatClick={jest.fn()}
                accessibility={{
                  regionLabel: 'Course Statistics Dashboard',
                  description: 'Complete overview of your course progress and performance metrics'
                }}
              />
            </section>
            <section aria-labelledby="timeline-heading">
              <h2 id="timeline-heading">Recent Activity</h2>
              <ActivityTimeline activities={mockActivities} onActivitySelect={jest.fn()} />
            </section>
            <section aria-labelledby="actions-heading">
              <h2 id="actions-heading">Quick Actions</h2>
              <QuickActions
                {...mockQuickActions}
                accessibility={{
                  groupLabel: 'Course Quick Actions',
                  instructions: 'Use these buttons to quickly access key course features'
                }}
              />
            </section>
          </main>
        </div>
      );

      expect(testResults.summary.passed).toBe(true);
      expect(testResults.summary.errors).toHaveLength(0);

      // Should have proper keyboard navigation
      expect(testResults.keyboardResults?.success).toBe(true);
      expect(testResults.keyboardResults?.focusOrder.length).toBeGreaterThan(5);

      // Should have comprehensive screen reader support
      expect(testResults.screenReaderResults).toBeDefined();
      expect(testResults.screenReaderResults?.length).toBeGreaterThan(0);

      // No color contrast violations
      expect(testResults.colorContrastResults?.length).toBe(0);
    });
  });

  describe('Performance Impact of Accessibility Features', () => {
    it('should not significantly impact component render performance', () => {
      const startTime = performance.now();

      render(
        <div>
          <DashboardStats
            stats={mockStats}
            onStatClick={jest.fn()}
            accessibility={{
              regionLabel: 'Course Statistics Dashboard',
              description: 'Complete overview of your course progress and performance metrics',
              instructions: 'Navigate using Tab and Shift+Tab. Press Enter or Space on any statistic to view detailed information.'
            }}
          />
          <ActivityTimeline activities={mockActivities} onActivitySelect={jest.fn()} />
          <QuickActions
            {...mockQuickActions}
            accessibility={{
              groupLabel: 'Course Quick Actions',
              instructions: 'Use these buttons to quickly access key course features and tools'
            }}
          />
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Accessibility features should not add significant overhead
      expect(renderTime).toBeLessThan(150); // 150ms threshold for complex components
    });

    it('should efficiently handle large datasets with accessibility features', () => {
      const largeStatsList = Array.from({ length: 50 }, (_, i) => ({
        id: `stat-${i}`,
        label: `Statistic ${i}`,
        value: `${i * 2}%`,
        variant: 'progress' as const,
        ariaLabel: `Statistic ${i}: ${i * 2} percent completed`
      }));

      const { container } = render(
        <DashboardStats
          stats={largeStatsList}
          onStatClick={jest.fn()}
          accessibility={{
            regionLabel: 'Large Statistics Dashboard',
            description: 'Comprehensive overview of all course metrics and progress indicators'
          }}
        />
      );

      // Should render all stats efficiently
      const statCards = container.querySelectorAll('[data-testid^="stat-card-"]');
      expect(statCards).toHaveLength(50);

      // Should maintain accessibility attributes efficiently
      statCards.forEach(card => {
        expect(card).toHaveAttribute('role');
        expect(card).toHaveAttribute('aria-label');
        expect(card).toHaveAttribute('aria-describedby');
      });
    });
  });
});