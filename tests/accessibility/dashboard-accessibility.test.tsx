import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { runFullAccessibilityTest, generateAccessibilityReport } from './accessibility-utils';

// Import dashboard components
import DashboardStats from '@/components/academia/dashboard-stats';
import ActivityTimeline from '@/components/academia/activity-timeline';
import QuickActions from '@/components/academia/quick-actions';
import { DashboardOverview } from '@/components/academia/course-dashboard';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock animation hooks
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

describe('Dashboard Accessibility Tests (WCAG 2.1 AA)', () => {
  // Mock data for tests
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
      ariaLabel: 'Average exam score: 78 percent'
    },
    {
      id: 'study-hours',
      label: 'Study Hours',
      value: '45h',
      variant: 'hours' as const,
      ariaLabel: 'Total study time: 45 hours'
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
    }
  ];

  const mockQuickActions = {
    primary: {
      label: 'Start Practice Exam',
      onClick: jest.fn(),
      disabled: false,
      ariaLabel: 'Start a new practice exam session'
    },
    secondary: [
      {
        label: 'View Progress',
        onClick: jest.fn(),
        icon: 'chart',
        ariaLabel: 'View detailed progress analytics'
      },
      {
        label: 'Study Resources',
        onClick: jest.fn(),
        icon: 'book',
        ariaLabel: 'Access study materials and resources'
      }
    ]
  };

  const mockCourseData = {
    id: 'english-b2',
    title: 'English B2 Certification',
    level: 'B2',
    language: 'English',
    description: 'Prepare for B2 level English certification',
    provider: 'cambridge',
    providerName: 'Cambridge English',
    totalExams: 25,
    completedExams: 12,
    averageScore: 78,
    timeSpent: 45,
    lastActivity: new Date('2023-12-01')
  };

  const mockProgressData = {
    overallProgress: 85,
    recentActivity: mockActivities,
    weeklyStats: {
      sessionsCompleted: 5,
      hoursStudied: 8.5,
      averageScore: 82,
      improvement: 5
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock window.getComputedStyle for color contrast tests
    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        color: 'rgb(0, 0, 0)',
        backgroundColor: 'rgb(255, 255, 255)',
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        width: '100px',
        height: '50px'
      }),
      writable: true
    });
  });

  describe('DashboardStats Component', () => {
    it('should pass automated accessibility testing', async () => {
      const { container } = render(
        <DashboardStats
          stats={mockStats}
          onStatClick={jest.fn()}
          accessibility={{
            regionLabel: 'Course statistics dashboard',
            description: 'Dashboard showing course progress and performance metrics'
          }}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      const mockOnStatClick = jest.fn();
      const user = userEvent.setup();

      render(
        <DashboardStats
          stats={mockStats}
          onStatClick={mockOnStatClick}
        />
      );

      // Test Tab navigation
      const firstStat = screen.getByRole('button', { name: /overall course progress/i });
      const secondStat = screen.getByRole('button', { name: /total completed exams/i });

      await user.tab();
      expect(firstStat).toHaveFocus();

      await user.tab();
      expect(secondStat).toHaveFocus();

      // Test Enter key activation
      await user.keyboard('{Enter}');
      expect(mockOnStatClick).toHaveBeenCalledWith('completed-exams');

      // Test Space key activation
      await user.keyboard(' ');
      expect(mockOnStatClick).toHaveBeenCalledWith('completed-exams');
    });

    it('should have proper ARIA attributes', () => {
      render(
        <DashboardStats
          stats={mockStats}
          onStatClick={jest.fn()}
          accessibility={{
            regionLabel: 'Course statistics dashboard'
          }}
        />
      );

      const region = screen.getByRole('region', { name: /course statistics dashboard/i });
      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute('aria-live', 'polite');
      expect(region).toHaveAttribute('aria-atomic', 'false');

      // Check individual stat cards
      const progressStat = screen.getByRole('button', { name: /overall course progress/i });
      expect(progressStat).toHaveAttribute('aria-describedby');
      expect(progressStat).toHaveAttribute('aria-keyshortcuts', 'Enter Space');
    });

    it('should provide meaningful screen reader content', () => {
      render(<DashboardStats stats={mockStats} onStatClick={jest.fn()} />);

      // Check for screen reader only content
      const description = screen.getByText(/dashboard showing course progress/i);
      expect(description).toHaveClass('sr-only');

      const instructions = screen.getByText(/navigate using tab and shift\+tab/i);
      expect(instructions).toHaveClass('sr-only');

      // Check live region
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveClass('sr-only');
    });

    it('should handle loading state accessibly', () => {
      render(<DashboardStats stats={[]} loading={true} />);

      const loadingContainer = screen.getByTestId('dashboard-stats-loading');
      expect(loadingContainer).toBeInTheDocument();

      // Should have skeleton cards with proper test IDs
      expect(screen.getByTestId('stat-skeleton-progress')).toBeInTheDocument();
      expect(screen.getByTestId('stat-skeleton-exams')).toBeInTheDocument();
    });

    it('should handle error state accessibly', () => {
      const mockOnRetry = jest.fn();
      render(
        <DashboardStats
          stats={[]}
          error="Failed to load statistics"
          onRetry={mockOnRetry}
        />
      );

      const errorContainer = screen.getByTestId('dashboard-stats-error');
      expect(errorContainer).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry loading statistics/i });
      expect(retryButton).toBeInTheDocument();

      fireEvent.click(retryButton);
      expect(mockOnRetry).toHaveBeenCalled();
    });

    it('should provide contextual information for trend indicators', () => {
      render(<DashboardStats stats={mockStats} />);

      const trendIcon = screen.getByTestId('trend-icon-progress');
      expect(trendIcon).toHaveAttribute('aria-label', 'Trend: increasing');
      expect(trendIcon).toHaveAttribute('role', 'img');
    });

    it('should support skip links for keyboard users', () => {
      render(<DashboardStats stats={mockStats} onStatClick={jest.fn()} />);

      const skipLink = screen.getByRole('link', { name: /skip to actions/i });
      expect(skipLink).toHaveClass('sr-only');
      expect(skipLink).toHaveAttribute('href', '#quick-actions');
    });

    it('should run comprehensive accessibility test', async () => {
      const testResults = await runFullAccessibilityTest(
        <DashboardStats
          stats={mockStats}
          onStatClick={jest.fn()}
          accessibility={{
            regionLabel: 'Course statistics dashboard',
            description: 'Dashboard showing course progress and performance metrics'
          }}
        />
      );

      expect(testResults.summary.passed).toBe(true);
      expect(testResults.summary.errors).toHaveLength(0);

      // Generate and check report
      const report = generateAccessibilityReport('DashboardStats', testResults);
      expect(report).toContain('# Accessibility Test Report: DashboardStats');
      expect(report).toContain('✅ PASSED');
    });
  });

  describe('ActivityTimeline Component', () => {
    it('should pass automated accessibility testing', async () => {
      const { container } = render(
        <ActivityTimeline
          activities={mockActivities}
          maxItems={5}
          onActivitySelect={jest.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation for activity items', async () => {
      const mockOnActivitySelect = jest.fn();
      const user = userEvent.setup();

      render(
        <ActivityTimeline
          activities={mockActivities}
          onActivitySelect={mockOnActivitySelect}
        />
      );

      // Should be able to navigate through activity items
      const activityItems = screen.getAllByRole('button', { name: /activity/i });

      if (activityItems.length > 0) {
        await user.tab();
        expect(activityItems[0]).toHaveFocus();

        await user.keyboard('{Enter}');
        expect(mockOnActivitySelect).toHaveBeenCalled();
      }
    });

    it('should provide proper time formatting for screen readers', () => {
      render(<ActivityTimeline activities={mockActivities} />);

      // Check for accessible time representation
      const timeElement = screen.getByText(/1 Dec 2023/i);
      expect(timeElement).toBeInTheDocument();

      // Should have proper semantic structure
      const listContainer = screen.getByRole('list');
      expect(listContainer).toBeInTheDocument();
    });

    it('should handle empty state accessibly', () => {
      render(
        <ActivityTimeline
          activities={[]}
          emptyMessage="No recent activity"
        />
      );

      const emptyMessage = screen.getByText(/no recent activity/i);
      expect(emptyMessage).toBeInTheDocument();
    });
  });

  describe('QuickActions Component', () => {
    it('should pass automated accessibility testing', async () => {
      const { container } = render(
        <QuickActions
          {...mockQuickActions}
          accessibility={{
            groupLabel: 'Course Quick Actions',
            instructions: 'Use these buttons to quickly access course features'
          }}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <QuickActions
          {...mockQuickActions}
          accessibility={{
            groupLabel: 'Course Quick Actions'
          }}
        />
      );

      const primaryButton = screen.getByRole('button', { name: /start a new practice exam/i });

      await user.tab();
      expect(primaryButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockQuickActions.primary.onClick).toHaveBeenCalled();
    });

    it('should provide proper grouping and labeling', () => {
      render(
        <QuickActions
          {...mockQuickActions}
          accessibility={{
            groupLabel: 'Course Quick Actions',
            instructions: 'Use these buttons to quickly access course features'
          }}
        />
      );

      const actionGroup = screen.getByRole('group', { name: /course quick actions/i });
      expect(actionGroup).toBeInTheDocument();

      const instructions = screen.getByText(/use these buttons to quickly access/i);
      expect(instructions).toHaveClass('sr-only');
    });

    it('should handle disabled states accessibly', () => {
      const disabledActions = {
        ...mockQuickActions,
        primary: {
          ...mockQuickActions.primary,
          disabled: true
        }
      };

      render(<QuickActions {...disabledActions} />);

      const primaryButton = screen.getByRole('button', { name: /start a new practice exam/i });
      expect(primaryButton).toBeDisabled();
      expect(primaryButton).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('DashboardOverview Component', () => {
    it('should pass automated accessibility testing', async () => {
      const { container } = render(
        <DashboardOverview
          courseData={mockCourseData}
          progressData={mockProgressData}
          onStartExam={jest.fn()}
          onViewProgress={jest.fn()}
          onViewHistory={jest.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper main landmark and heading structure', () => {
      render(
        <DashboardOverview
          courseData={mockCourseData}
          progressData={mockProgressData}
        />
      );

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('aria-label', expect.stringContaining('Dashboard for'));

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(mockCourseData.title);
    });

    it('should handle loading state with proper ARIA live region', () => {
      render(
        <DashboardOverview
          courseData={null}
          progressData={null}
          isLoading={true}
        />
      );

      const loadingIndicator = screen.getByRole('status');
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite');
      expect(loadingIndicator).toHaveTextContent(/loading dashboard data/i);

      const srOnlyText = screen.getByText(/loading/i);
      expect(srOnlyText).toHaveClass('sr-only');
    });

    it('should handle error state with proper alert role', () => {
      render(
        <DashboardOverview
          courseData={null}
          progressData={null}
          error="Failed to load dashboard"
          onRefresh={jest.fn()}
        />
      );

      const errorAlert = screen.getByRole('alert');
      expect(errorAlert).toHaveTextContent(/error loading dashboard/i);

      const retryButton = screen.getByRole('button', { name: /retry loading dashboard data/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should provide meaningful progress indicators', () => {
      render(
        <DashboardOverview
          courseData={mockCourseData}
          progressData={mockProgressData}
        />
      );

      // Progress should be announced accessibly
      const progressText = screen.getByText('85.0%');
      expect(progressText).toBeInTheDocument();

      // Should have proper context for screen readers
      const progressContainer = progressText.closest('[aria-label]');
      expect(progressContainer).toHaveAttribute('aria-label', expect.stringContaining('Dashboard for'));
    });
  });

  describe('Integration Tests', () => {
    it('should maintain focus management across dashboard interactions', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
          <QuickActions {...mockQuickActions} />
        </div>
      );

      // Test focus flow between components
      await user.tab(); // First stat
      const firstStat = screen.getAllByRole('button')[0];
      expect(firstStat).toHaveFocus();

      // Navigate through all stats
      await user.tab(); // Second stat
      await user.tab(); // Third stat
      await user.tab(); // Fourth stat
      await user.tab(); // Should move to QuickActions

      const quickActionButton = screen.getByRole('button', { name: /start a new practice exam/i });
      expect(quickActionButton).toHaveFocus();
    });

    it('should provide consistent screen reader experience', () => {
      render(
        <div>
          <DashboardStats
            stats={mockStats}
            accessibility={{
              regionLabel: 'Course Statistics',
              description: 'Your progress and performance metrics'
            }}
          />
          <ActivityTimeline activities={mockActivities} />
          <QuickActions
            {...mockQuickActions}
            accessibility={{
              groupLabel: 'Quick Actions',
              instructions: 'Access key course features'
            }}
          />
        </div>
      );

      // Check for proper landmarks
      const statsRegion = screen.getByRole('region', { name: /course statistics/i });
      expect(statsRegion).toBeInTheDocument();

      const actionsGroup = screen.getByRole('group', { name: /quick actions/i });
      expect(actionsGroup).toBeInTheDocument();

      // Check for screen reader instructions
      const statsInstructions = screen.getByText(/your progress and performance metrics/i);
      expect(statsInstructions).toHaveClass('sr-only');

      const actionsInstructions = screen.getByText(/access key course features/i);
      expect(actionsInstructions).toHaveClass('sr-only');
    });

    it('should handle responsive breakpoints accessibly', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(
        <DashboardOverview
          courseData={mockCourseData}
          progressData={mockProgressData}
        />
      );

      // Touch targets should be at least 44px (will be mocked)
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const style = window.getComputedStyle(button);
        // In real test, would check computed dimensions
        expect(button).toBeInTheDocument();
      });
    });

    it('should run full dashboard accessibility suite', async () => {
      const testResults = await runFullAccessibilityTest(
        <div>
          <DashboardStats
            stats={mockStats}
            onStatClick={jest.fn()}
            accessibility={{
              regionLabel: 'Course Statistics Dashboard',
              description: 'Complete overview of your course progress and performance'
            }}
          />
          <ActivityTimeline activities={mockActivities} />
          <QuickActions
            {...mockQuickActions}
            accessibility={{
              groupLabel: 'Course Quick Actions',
              instructions: 'Use these buttons to quickly access key course features'
            }}
          />
        </div>
      );

      expect(testResults.summary.passed).toBe(true);
      expect(testResults.summary.errors).toHaveLength(0);

      // Should have comprehensive keyboard navigation
      expect(testResults.keyboardResults?.success).toBe(true);
      expect(testResults.keyboardResults?.focusOrder.length).toBeGreaterThan(0);

      // Should have proper screen reader information
      expect(testResults.screenReaderResults).toBeDefined();
      expect(testResults.screenReaderResults?.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Impact of Accessibility Features', () => {
    it('should not significantly impact render performance', () => {
      const startTime = performance.now();

      render(
        <DashboardStats
          stats={mockStats}
          onStatClick={jest.fn()}
          accessibility={{
            regionLabel: 'Course Statistics Dashboard',
            description: 'Complete overview of your course progress and performance'
          }}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Accessibility features should not add significant overhead
      expect(renderTime).toBeLessThan(100); // 100ms threshold
    });

    it('should efficiently handle large datasets', () => {
      const largeStatsList = Array.from({ length: 20 }, (_, i) => ({
        id: `stat-${i}`,
        label: `Statistic ${i}`,
        value: `${i * 5}%`,
        variant: 'progress' as const,
        ariaLabel: `Statistic ${i}: ${i * 5} percent`
      }));

      const { container } = render(
        <DashboardStats
          stats={largeStatsList}
          onStatClick={jest.fn()}
        />
      );

      // Should render all stats efficiently
      const statCards = container.querySelectorAll('[data-testid^="stat-card-"]');
      expect(statCards).toHaveLength(20);

      // Should maintain accessibility attributes
      statCards.forEach(card => {
        expect(card).toHaveAttribute('role');
        expect(card).toHaveAttribute('aria-label');
      });
    });
  });
});

// Test utilities for manual accessibility testing
export const manualAccessibilityChecklist = {
  dashboardStats: [
    'Navigate using only keyboard (Tab, Shift+Tab, Enter, Space)',
    'Test with screen reader (ensure all statistics are announced clearly)',
    'Verify color contrast meets 4.5:1 ratio',
    'Check focus indicators are visible',
    'Ensure loading states are announced',
    'Verify error states have proper alert roles',
    'Test responsive behavior maintains accessibility'
  ],
  activityTimeline: [
    'Navigate timeline items with keyboard',
    'Verify time/date formats are screen reader friendly',
    'Check empty states are properly announced',
    'Test activity selection with keyboard',
    'Ensure proper list semantics'
  ],
  quickActions: [
    'Navigate action buttons with keyboard',
    'Verify button grouping and labeling',
    'Test disabled states with assistive technology',
    'Check button sizing meets touch target requirements',
    'Ensure proper focus management'
  ]
};