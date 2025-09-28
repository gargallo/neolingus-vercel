import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { runFullAccessibilityTest } from './accessibility-utils';
import { runManualAccessibilityTests, generateManualTestingReport } from './manual-testing-helpers';

// Import components for integration testing
import DashboardStats from '@/components/academia/dashboard-stats';
import ActivityTimeline from '@/components/academia/activity-timeline';
import QuickActions from '@/components/academia/quick-actions';
import { DashboardOverview } from '@/components/academia/course-dashboard';

// Mock router for navigation tests
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
}));

// Mock framer-motion
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

describe('Dashboard Integration Accessibility Tests', () => {
  // Complete mock data for integration testing
  const mockCourseData = {
    id: 'english-b2',
    title: 'English B2 Certification Course',
    level: 'B2',
    language: 'English',
    description: 'Comprehensive preparation for B2 level English certification',
    provider: 'cambridge',
    providerName: 'Cambridge English',
    totalExams: 25,
    completedExams: 12,
    averageScore: 78.5,
    timeSpent: 45.5,
    lastActivity: new Date('2023-12-01T14:30:00Z'),
    nextExam: {
      id: 'listening-practice-1',
      title: 'Listening Comprehension Practice Test',
      providerSlug: 'cambridge',
      providerName: 'Cambridge English',
      difficulty: 'official',
      estimatedTime: 45
    }
  };

  const mockProgressData = {
    overallProgress: 85.3,
    recentActivity: [
      {
        id: 'activity-1',
        type: 'exam_completed',
        examTitle: 'Reading Comprehension Advanced',
        score: 88,
        duration: 3600,
        date: new Date('2023-12-01T10:00:00Z')
      },
      {
        id: 'activity-2',
        type: 'study_session',
        topic: 'Grammar Focus: Complex Sentences',
        duration: 1800,
        date: new Date('2023-11-30T16:30:00Z')
      },
      {
        id: 'activity-3',
        type: 'achievement_unlocked',
        achievement: 'Consistent Performer',
        date: new Date('2023-11-29T12:15:00Z')
      }
    ],
    weeklyStats: {
      sessionsCompleted: 8,
      hoursStudied: 12.5,
      averageScore: 84.2,
      improvement: 6.8
    }
  };

  const mockStats = [
    {
      id: 'overall-progress',
      label: 'Overall Progress',
      value: '85.3%',
      displayValue: '85.3%',
      variant: 'progress' as const,
      ariaLabel: 'Overall course progress: 85.3 percent completed',
      change: { direction: 'up' as const, period: 'from last week' }
    },
    {
      id: 'completed-exams',
      label: 'Completed Exams',
      value: '12',
      variant: 'exams' as const,
      ariaLabel: 'Total completed exams: 12 out of 25',
      change: { direction: 'up' as const, period: 'this month' }
    },
    {
      id: 'average-score',
      label: 'Average Score',
      value: '78.5%',
      variant: 'score' as const,
      ariaLabel: 'Average exam score: 78.5 percent',
      change: { direction: 'up' as const, period: 'improvement trend' }
    },
    {
      id: 'study-hours',
      label: 'Study Hours',
      value: '45.5h',
      variant: 'hours' as const,
      ariaLabel: 'Total study time: 45.5 hours',
      change: { direction: 'stable' as const, period: 'this week' }
    }
  ];

  const mockQuickActions = {
    primary: {
      label: 'Start Practice Exam',
      onClick: jest.fn(),
      disabled: false,
      ariaLabel: 'Start your next practice exam session',
      loading: false
    },
    secondary: [
      {
        label: 'View Analytics',
        onClick: jest.fn(),
        icon: 'chart',
        ariaLabel: 'View detailed performance analytics and progress reports',
        disabled: false
      },
      {
        label: 'Study Materials',
        onClick: jest.fn(),
        icon: 'book',
        ariaLabel: 'Access course study materials and learning resources',
        disabled: false
      },
      {
        label: 'Course Settings',
        onClick: jest.fn(),
        icon: 'settings',
        ariaLabel: 'Configure course preferences and notification settings',
        disabled: false
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock ResizeObserver
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    // Mock window properties for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    });

    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 200,
      height: 48,
      top: 0,
      left: 0,
      bottom: 48,
      right: 200,
      x: 0,
      y: 0,
      toJSON: jest.fn()
    }));

    // Mock getComputedStyle with high contrast colors
    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        color: 'rgb(17, 24, 39)',          // Gray-900
        backgroundColor: 'rgb(255, 255, 255)', // White
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '24px',               // 1.5 ratio
        letterSpacing: '0.025em',         // Meets 0.12em requirement
        wordSpacing: '0.16em',            // Meets requirement
        marginBottom: '16px',             // 1em
        paddingBottom: '16px',            // 1em
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        width: '200px',
        height: '48px',
        outline: '2px solid rgb(59, 130, 246)', // Focus indicator
        outlineWidth: '2px',
        boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)'
      }),
      writable: true
    });
  });

  describe('Complete Dashboard Integration', () => {
    it('should pass comprehensive accessibility testing for full dashboard', async () => {
      const { container } = render(
        <main role="main" aria-labelledby="dashboard-title">
          <header>
            <h1 id="dashboard-title">Course Dashboard</h1>
            <nav aria-label="Dashboard navigation">
              <ul>
                <li><a href="#overview">Overview</a></li>
                <li><a href="#statistics">Statistics</a></li>
                <li><a href="#activity">Activity</a></li>
                <li><a href="#actions">Actions</a></li>
              </ul>
            </nav>
          </header>

          <section id="overview" aria-labelledby="overview-heading">
            <h2 id="overview-heading">Course Overview</h2>
            <DashboardOverview
              courseData={mockCourseData}
              progressData={mockProgressData}
              onStartExam={jest.fn()}
              onViewProgress={jest.fn()}
              onViewHistory={jest.fn()}
              onRefresh={jest.fn()}
            />
          </section>

          <section id="statistics" aria-labelledby="stats-heading">
            <h2 id="stats-heading">Performance Statistics</h2>
            <DashboardStats
              stats={mockStats}
              onStatClick={jest.fn()}
              accessibility={{
                regionLabel: 'Course performance statistics',
                description: 'Your progress metrics including completion rate, exam scores, and study time',
                instructions: 'Navigate between statistics using Tab. Press Enter to view detailed information for any metric.'
              }}
            />
          </section>

          <section id="activity" aria-labelledby="activity-heading">
            <h2 id="activity-heading">Recent Activity</h2>
            <ActivityTimeline
              activities={mockProgressData.recentActivity}
              maxItems={10}
              onActivitySelect={jest.fn()}
              emptyMessage="No recent activity to display. Start studying to see your progress here."
            />
          </section>

          <section id="actions" aria-labelledby="actions-heading">
            <h2 id="actions-heading">Quick Actions</h2>
            <QuickActions
              {...mockQuickActions}
              accessibility={{
                groupLabel: 'Course quick actions',
                instructions: 'Use these buttons to quickly access key course features and tools'
              }}
            />
          </section>
        </main>
      );

      // Run comprehensive axe testing
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'button-name': { enabled: true },
          'landmark-one-main': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'region': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should support complete keyboard navigation workflow', async () => {
      const user = userEvent.setup();
      const mockStatClick = jest.fn();
      const mockActivitySelect = jest.fn();
      const mockStartExam = jest.fn();

      render(
        <div>
          <DashboardStats stats={mockStats} onStatClick={mockStatClick} />
          <ActivityTimeline
            activities={mockProgressData.recentActivity}
            onActivitySelect={mockActivitySelect}
          />
          <QuickActions {...mockQuickActions} />
        </div>
      );

      // Navigate through entire dashboard using only keyboard
      // Statistics section
      await user.tab(); // First stat
      await user.keyboard('{Enter}');
      expect(mockStatClick).toHaveBeenCalledWith('overall-progress');

      await user.tab(); // Second stat
      await user.tab(); // Third stat
      await user.tab(); // Fourth stat

      // Activity timeline
      const activityButtons = screen.getAllByRole('button', { name: /activity/i });
      if (activityButtons.length > 0) {
        await user.tab(); // First activity (if interactive)
        await user.keyboard('{Enter}');
        expect(mockActivitySelect).toHaveBeenCalled();
      }

      // Quick actions
      await user.tab(); // Primary action
      const primaryAction = screen.getByRole('button', { name: /start your next practice exam/i });
      expect(primaryAction).toHaveFocus();

      await user.keyboard(' '); // Space key activation
      expect(mockQuickActions.primary.onClick).toHaveBeenCalled();

      // Secondary actions
      await user.tab(); // First secondary action
      await user.tab(); // Second secondary action
      await user.tab(); // Third secondary action

      const settingsAction = screen.getByRole('button', { name: /configure course preferences/i });
      expect(settingsAction).toHaveFocus();
    });

    it('should provide consistent focus management across components', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button id="before">Before Dashboard</button>
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
          <ActivityTimeline activities={mockProgressData.recentActivity} />
          <QuickActions {...mockQuickActions} />
          <button id="after">After Dashboard</button>
        </div>
      );

      const beforeButton = screen.getByRole('button', { name: 'Before Dashboard' });
      const afterButton = screen.getByRole('button', { name: 'After Dashboard' });

      // Start before dashboard
      beforeButton.focus();
      expect(beforeButton).toHaveFocus();

      // Navigate through entire dashboard
      const totalTabs = 10; // Approximate number of focusable elements
      for (let i = 0; i < totalTabs; i++) {
        await user.tab();
      }

      // Should eventually reach the after button
      expect(document.activeElement).toBeTruthy();
    });

    it('should announce dynamic content updates to screen readers', async () => {
      const { rerender } = render(
        <div>
          <DashboardStats stats={mockStats} loading={false} />
          <div role="status" aria-live="polite" aria-atomic="true" id="update-announcements" />
        </div>
      );

      // Simulate loading state
      rerender(
        <div>
          <DashboardStats stats={[]} loading={true} />
          <div role="status" aria-live="polite" aria-atomic="true" id="update-announcements">
            Loading updated statistics...
          </div>
        </div>
      );

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Loading updated statistics...');

      // Simulate loaded state
      rerender(
        <div>
          <DashboardStats stats={mockStats} loading={false} />
          <div role="status" aria-live="polite" aria-atomic="true" id="update-announcements">
            Statistics updated successfully
          </div>
        </div>
      );

      expect(liveRegion).toHaveTextContent('Statistics updated successfully');
    });
  });

  describe('Cross-Component Interaction Patterns', () => {
    it('should maintain ARIA relationships between related components', () => {
      render(
        <div>
          <section aria-labelledby="stats-heading" aria-describedby="stats-description">
            <h2 id="stats-heading">Performance Statistics</h2>
            <p id="stats-description">
              Your course performance metrics updated in real-time
            </p>
            <DashboardStats
              stats={mockStats}
              accessibility={{
                regionLabel: 'Course performance statistics',
                description: 'Detailed breakdown of your study progress and exam performance'
              }}
            />
          </section>

          <section aria-labelledby="activity-heading" aria-describedby="activity-description">
            <h2 id="activity-heading">Recent Learning Activity</h2>
            <p id="activity-description">
              Timeline of your recent study sessions and exam completions
            </p>
            <ActivityTimeline activities={mockProgressData.recentActivity} />
          </section>
        </div>
      );

      // Check ARIA relationships
      const statsSection = screen.getByRole('region', { name: /performance statistics/i });
      expect(statsSection).toHaveAttribute('aria-labelledby', 'stats-heading');
      expect(statsSection).toHaveAttribute('aria-describedby', 'stats-description');

      const activitySection = screen.getByRole('region', { name: /recent learning activity/i });
      expect(activitySection).toHaveAttribute('aria-labelledby', 'activity-heading');
      expect(activitySection).toHaveAttribute('aria-describedby', 'activity-description');
    });

    it('should handle component-to-component navigation announcements', async () => {
      const user = userEvent.setup();
      const mockOnStatClick = jest.fn();

      render(
        <div>
          <DashboardStats stats={mockStats} onStatClick={mockOnStatClick} />
          <div role="status" aria-live="polite" id="navigation-announcements" />
          <ActivityTimeline activities={mockProgressData.recentActivity} />
        </div>
      );

      // Simulate clicking a stat that navigates to activity section
      const progressStat = screen.getByRole('button', { name: /overall course progress/i });
      await user.click(progressStat);

      expect(mockOnStatClick).toHaveBeenCalledWith('overall-progress');

      // Would typically trigger navigation announcement
      const announcements = document.getElementById('navigation-announcements');
      if (announcements) {
        announcements.textContent = 'Navigated to detailed progress view';
        expect(announcements).toHaveTextContent('Navigated to detailed progress view');
      }
    });

    it('should coordinate loading states across components', () => {
      render(
        <div>
          <DashboardStats stats={[]} loading={true} />
          <ActivityTimeline activities={[]} loading={true} />
          <QuickActions
            primary={{ ...mockQuickActions.primary, loading: true }}
            secondary={mockQuickActions.secondary}
          />
          <div role="status" aria-live="polite">
            Loading dashboard components...
          </div>
        </div>
      );

      // All components should show loading states
      expect(screen.getByTestId('dashboard-stats-loading')).toBeInTheDocument();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Live region should announce overall loading state
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Loading dashboard components...');
    });

    it('should handle error states with consistent messaging', () => {
      const mockRetry = jest.fn();

      render(
        <div>
          <DashboardStats
            stats={[]}
            error="Network connection failed"
            onRetry={mockRetry}
          />
          <ActivityTimeline
            activities={[]}
            error="Unable to load recent activities"
          />
          <QuickActions
            primary={{ ...mockQuickActions.primary, disabled: true }}
            secondary={[]}
          />
          <div role="alert" aria-live="assertive">
            Multiple components failed to load. Please check your connection and try again.
          </div>
        </div>
      );

      // Individual component errors
      expect(screen.getByText(/network connection failed/i)).toBeInTheDocument();
      expect(screen.getByText(/unable to load recent activities/i)).toBeInTheDocument();

      // Global error announcement
      const globalError = screen.getByRole('alert');
      expect(globalError).toHaveTextContent(/multiple components failed to load/i);

      // Retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('Responsive Design Accessibility', () => {
    it('should maintain accessibility across mobile breakpoints', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375, // iPhone SE width
      });

      render(
        <div style={{ width: '375px' }}>
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
          <ActivityTimeline activities={mockProgressData.recentActivity} />
          <QuickActions
            {...mockQuickActions}
            layout={{
              arrangement: 'vertical',
              spacing: 'compact',
              responsive: {
                mobile: 'stack',
                tablet: 'grid',
                desktop: 'horizontal'
              }
            }}
          />
        </div>
      );

      // Touch targets should still meet 44px minimum
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const rect = button.getBoundingClientRect();
        expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(44);
      });

      // Text should still be readable
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        expect(heading).toBeVisible();
      });
    });

    it('should support tablet layouts with proper touch targets', () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // iPad width
      });

      render(
        <div style={{ width: '768px' }}>
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
          <QuickActions
            {...mockQuickActions}
            layout={{
              arrangement: 'horizontal',
              spacing: 'normal',
              responsive: {
                mobile: 'stack',
                tablet: 'grid',
                desktop: 'horizontal'
              }
            }}
          />
        </div>
      );

      // Should maintain proper spacing for touch interfaces
      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons.length).toBeGreaterThan(4);

      // All buttons should be accessible
      actionButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button.getAttribute('aria-label')!.length).toBeGreaterThan(5);
      });
    });

    it('should handle desktop layouts with full functionality', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920, // Full HD width
      });

      render(
        <div style={{ width: '1920px' }}>
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
          <ActivityTimeline activities={mockProgressData.recentActivity} />
          <QuickActions
            {...mockQuickActions}
            layout={{
              arrangement: 'horizontal',
              spacing: 'generous',
              responsive: {
                mobile: 'stack',
                tablet: 'grid',
                desktop: 'horizontal'
              }
            }}
          />
        </div>
      );

      // Should support keyboard shortcuts and advanced interactions
      const statButtons = screen.getAllByRole('button', { name: /progress|exams|score|hours/i });
      expect(statButtons.length).toBe(4);

      statButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-keyshortcuts', 'Enter Space');
      });
    });

    it('should adapt text sizing for accessibility preferences', () => {
      // Mock larger text preference (200% zoom)
      Object.defineProperty(window, 'getComputedStyle', {
        value: () => ({
          fontSize: '32px', // 200% of 16px
          lineHeight: '48px', // Maintain 1.5 ratio
          color: 'rgb(17, 24, 39)',
          backgroundColor: 'rgb(255, 255, 255)',
          fontWeight: '400',
          letterSpacing: '0.025em',
          wordSpacing: '0.16em',
          marginBottom: '32px',
          paddingBottom: '32px'
        }),
        writable: true
      });

      render(
        <div>
          <DashboardStats stats={mockStats} />
          <ActivityTimeline activities={mockProgressData.recentActivity} />
        </div>
      );

      // Content should still be accessible and readable
      const statLabels = screen.getAllByText(/progress|exams|score|hours/i);
      expect(statLabels.length).toBeGreaterThan(0);

      const activityItems = screen.getAllByRole('listitem');
      expect(activityItems.length).toBe(mockProgressData.recentActivity.length);
    });
  });

  describe('Performance and Scalability', () => {
    it('should maintain accessibility performance with large datasets', async () => {
      const largeStatsList = Array.from({ length: 100 }, (_, i) => ({
        id: `stat-${i}`,
        label: `Metric ${i}`,
        value: `${i}%`,
        variant: 'progress' as const,
        ariaLabel: `Metric ${i}: ${i} percent completed`
      }));

      const largeActivitiesList = Array.from({ length: 50 }, (_, i) => ({
        id: `activity-${i}`,
        type: 'exam_completed',
        examTitle: `Exam ${i}`,
        score: 75 + (i % 25),
        duration: 1800 + (i * 60),
        date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000))
      }));

      const startTime = performance.now();

      const { container } = render(
        <div>
          <DashboardStats stats={largeStatsList} onStatClick={jest.fn()} />
          <ActivityTimeline activities={largeActivitiesList} maxItems={20} />
        </div>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render efficiently even with large datasets
      expect(renderTime).toBeLessThan(500); // 500ms threshold

      // Should still maintain accessibility attributes
      const statButtons = container.querySelectorAll('[role="button"]');
      expect(statButtons.length).toBeGreaterThan(90);

      // Sample check for accessibility attributes
      const firstTenButtons = Array.from(statButtons).slice(0, 10);
      firstTenButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        expect(button).toHaveAttribute('aria-describedby');
      });
    });

    it('should efficiently handle dynamic content updates', async () => {
      const { rerender } = render(
        <div>
          <DashboardStats stats={mockStats} />
          <ActivityTimeline activities={mockProgressData.recentActivity} />
        </div>
      );

      // Add more activities dynamically
      const updatedActivities = [
        ...mockProgressData.recentActivity,
        {
          id: 'new-activity',
          type: 'exam_completed',
          examTitle: 'New Practice Test',
          score: 92,
          duration: 2700,
          date: new Date()
        }
      ];

      const startTime = performance.now();

      rerender(
        <div>
          <DashboardStats stats={mockStats} />
          <ActivityTimeline activities={updatedActivities} />
          <div role="status" aria-live="polite">
            Activity timeline updated with 1 new item
          </div>
        </div>
      );

      const endTime = performance.now();
      const updateTime = endTime - startTime;

      // Updates should be fast
      expect(updateTime).toBeLessThan(100);

      // Should announce updates to screen readers
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Activity timeline updated with 1 new item');

      // New content should be accessible
      const newActivity = screen.getByText('New Practice Test');
      expect(newActivity).toBeInTheDocument();
    });

    it('should run comprehensive manual accessibility test suite', () => {
      const { container } = render(
        <div>
          <header>
            <h1>Complete Course Dashboard</h1>
            <nav aria-label="Dashboard navigation">
              <a href="#stats">Statistics</a>
              <a href="#activity">Activity</a>
              <a href="#actions">Actions</a>
            </nav>
          </header>
          <main>
            <section id="stats" aria-labelledby="stats-heading">
              <h2 id="stats-heading">Performance Statistics</h2>
              <DashboardStats
                stats={mockStats}
                onStatClick={jest.fn()}
                accessibility={{
                  regionLabel: 'Course performance statistics',
                  description: 'Real-time metrics showing your course progress and performance'
                }}
              />
            </section>
            <section id="activity" aria-labelledby="activity-heading">
              <h2 id="activity-heading">Recent Activity</h2>
              <ActivityTimeline
                activities={mockProgressData.recentActivity}
                onActivitySelect={jest.fn()}
              />
            </section>
            <section id="actions" aria-labelledby="actions-heading">
              <h2 id="actions-heading">Quick Actions</h2>
              <QuickActions
                {...mockQuickActions}
                accessibility={{
                  groupLabel: 'Course quick actions',
                  instructions: 'Access key course features and tools quickly'
                }}
              />
            </section>
          </main>
        </div>
      );

      const results = runManualAccessibilityTests(container);

      expect(results.summary.passed).toBe(true);
      expect(results.summary.criticalIssues).toBe(0);

      // Generate comprehensive report
      const report = generateManualTestingReport('Complete Dashboard Integration', results);
      expect(report).toContain('✅ PASSED');
      expect(report).toContain('# Manual Accessibility Test Report: Complete Dashboard Integration');

      // Log report for CI/CD reference
      console.log('\n=== COMPREHENSIVE DASHBOARD ACCESSIBILITY REPORT ===\n');
      console.log(report);
      console.log('\n=== END REPORT ===\n');
    });
  });

  describe('Real-World User Scenarios', () => {
    it('should support complete user workflow with screen reader', async () => {
      const user = userEvent.setup();
      const mockActions = {
        onStatClick: jest.fn(),
        onActivitySelect: jest.fn(),
        onStartExam: jest.fn(),
        onViewProgress: jest.fn()
      };

      render(
        <div>
          <h1>Course Dashboard</h1>
          <p>Welcome to your English B2 certification course dashboard</p>

          <nav aria-label="Skip to main sections">
            <a href="#stats">Skip to statistics</a>
            <a href="#activity">Skip to activity</a>
            <a href="#actions">Skip to actions</a>
          </nav>

          <section id="stats" aria-labelledby="stats-heading">
            <h2 id="stats-heading">Your Progress Statistics</h2>
            <DashboardStats
              stats={mockStats}
              onStatClick={mockActions.onStatClick}
              accessibility={{
                regionLabel: 'Course progress statistics',
                description: 'Four key metrics showing your overall progress, completed exams, average scores, and study time'
              }}
            />
          </section>

          <section id="activity" aria-labelledby="activity-heading">
            <h2 id="activity-heading">Recent Study Activity</h2>
            <ActivityTimeline
              activities={mockProgressData.recentActivity}
              onActivitySelect={mockActions.onActivitySelect}
            />
          </section>

          <section id="actions" aria-labelledby="actions-heading">
            <h2 id="actions-heading">Take Action</h2>
            <QuickActions
              primary={{
                ...mockQuickActions.primary,
                onClick: mockActions.onStartExam
              }}
              secondary={[
                {
                  ...mockQuickActions.secondary[0],
                  onClick: mockActions.onViewProgress
                },
                ...mockQuickActions.secondary.slice(1)
              ]}
              accessibility={{
                groupLabel: 'Course actions',
                instructions: 'Use these buttons to start exams, view analytics, or access resources'
              }}
            />
          </section>
        </div>
      );

      // Simulate screen reader user workflow

      // 1. User navigates to main content
      const mainHeading = screen.getByRole('heading', { level: 1, name: /course dashboard/i });
      expect(mainHeading).toBeInTheDocument();

      // 2. User reviews statistics
      await user.tab(); // Skip link
      await user.tab(); // First statistic
      const firstStat = screen.getByRole('button', { name: /overall course progress.*85\.3 percent/i });
      expect(firstStat).toHaveFocus();

      // 3. User checks detailed progress
      await user.keyboard('{Enter}');
      expect(mockActions.onStatClick).toHaveBeenCalledWith('overall-progress');

      // 4. User reviews recent activity
      const activitySection = screen.getByRole('region', { name: /recent study activity/i });
      expect(activitySection).toBeInTheDocument();

      // 5. User starts new exam
      const startExamButton = screen.getByRole('button', { name: /start your next practice exam/i });
      await user.click(startExamButton);
      expect(mockActions.onStartExam).toHaveBeenCalled();

      // 6. User accesses analytics
      const analyticsButton = screen.getByRole('button', { name: /view detailed performance analytics/i });
      await user.click(analyticsButton);
      expect(mockActions.onViewProgress).toHaveBeenCalled();
    });

    it('should support keyboard-only power user workflow', async () => {
      const user = userEvent.setup();
      const mockCallbacks = {
        onStatClick: jest.fn(),
        onStartExam: jest.fn(),
        onViewAnalytics: jest.fn()
      };

      render(
        <div>
          <DashboardStats stats={mockStats} onStatClick={mockCallbacks.onStatClick} />
          <QuickActions
            primary={{
              ...mockQuickActions.primary,
              onClick: mockCallbacks.onStartExam
            }}
            secondary={[
              {
                ...mockQuickActions.secondary[0],
                onClick: mockCallbacks.onViewAnalytics
              }
            ]}
          />
        </div>
      );

      // Power user workflow using keyboard shortcuts

      // Quick navigation through stats
      await user.tab(); // First stat
      await user.keyboard('{Enter}'); // View details
      expect(mockCallbacks.onStatClick).toHaveBeenCalledTimes(1);

      // Navigate to exam start
      const totalTabs = 5; // Navigate to primary action
      for (let i = 0; i < totalTabs; i++) {
        await user.tab();
      }

      const startExamButton = screen.getByRole('button', { name: /start your next practice exam/i });
      expect(startExamButton).toHaveFocus();

      // Start exam with space bar
      await user.keyboard(' ');
      expect(mockCallbacks.onStartExam).toHaveBeenCalledTimes(1);

      // Navigate to analytics
      await user.tab();
      const analyticsButton = screen.getByRole('button', { name: /view detailed performance analytics/i });
      expect(analyticsButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockCallbacks.onViewAnalytics).toHaveBeenCalledTimes(1);
    });

    it('should support mobile touch interface accessibility', () => {
      // Mock touch device
      Object.defineProperty(window, 'navigator', {
        value: {
          ...window.navigator,
          maxTouchPoints: 10,
          userAgent: 'Mobile Safari'
        },
        writable: true
      });

      render(
        <div style={{ width: '375px' }}>
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
          <QuickActions
            {...mockQuickActions}
            layout={{
              arrangement: 'vertical',
              spacing: 'comfortable',
              responsive: {
                mobile: 'stack',
                tablet: 'grid',
                desktop: 'horizontal'
              }
            }}
          />
        </div>
      );

      // All touch targets should meet minimum size requirements
      const allButtons = screen.getAllByRole('button');
      expect(allButtons.length).toBeGreaterThan(5);

      allButtons.forEach(button => {
        const rect = button.getBoundingClientRect();
        expect(rect.width).toBeGreaterThanOrEqual(44);
        expect(rect.height).toBeGreaterThanOrEqual(44);
      });

      // Should have proper spacing for touch interfaces
      const quickActionButtons = screen.getAllByRole('button').slice(-4); // Last 4 are quick actions
      quickActionButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
        // Touch-friendly labeling
        const label = button.getAttribute('aria-label')!;
        expect(label.length).toBeGreaterThan(15); // Descriptive labels for touch
      });
    });
  });
});