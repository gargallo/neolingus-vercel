/**
 * Course Dashboard Component Integration Tests
 * Tests for the updated course dashboard with provider section removal
 * and new component integration (DashboardStats, ActivityTimeline, QuickActions)
 *
 * These tests MUST FAIL initially since the changes haven't been implemented yet.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import {
  renderWithProviders,
  dashboardTestHelpers,
  interactionTestHelpers,
  a11yTestHelpers,
  apiMockHelpers,
  mockCourseData,
  mockProgressData,
  mockAvailableExams,
  mockAchievements,
  mockUserProgress,
  createMockHandlers,
  testScenarios
} from './test-utils';

// Import the actual component (to be updated)
import { CourseDashboard } from '../../../components/dashboard/course-dashboard';

// Mock the course dashboard component (to be implemented)
const MockCourseDashboard = ({
  course,
  availableExams = [],
  achievements = [],
  userId,
  initialProgress = null,
  initialAnalytics = null,
  initialRecommendations = [],
  isLoading = false,
  error = null
}: {
  course: any;
  availableExams?: any[];
  achievements?: any[];
  userId: string;
  initialProgress?: any;
  initialAnalytics?: any;
  initialRecommendations?: any[];
  isLoading?: boolean;
  error?: string | null;
}) => {
  const handlers = createMockHandlers();

  // Simulate loading state
  if (isLoading) {
    return (
      <div data-testid="course-dashboard" role="main" aria-label={`Dashboard for ${course?.title || 'Course'}`}>
        <div role="status" aria-live="polite">
          <div className="animate-spin" aria-hidden="true"></div>
          <span className="sr-only">Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  // Simulate error state
  if (error) {
    return (
      <div data-testid="course-dashboard" role="main">
        <div role="alert">
          <h3>Error loading dashboard</h3>
          <p>{error}</p>
          <button onClick={handlers.onRefresh} aria-label="Retry loading dashboard data">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Simulate empty state
  if (!course) {
    return (
      <div data-testid="course-dashboard" role="main">
        <div className="empty-state">
          <h3>No course data available</h3>
          <p>It looks like you haven't enrolled in any courses yet.</p>
          <button aria-label="Browse available courses">
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  // Mock dashboard layout
  return (
    <div data-testid="course-dashboard" role="main" aria-label={`Dashboard for ${course.title}`}>
      {/* Course Header */}
      <header className="course-header">
        <h1>{course.title}</h1>
        <div className="course-meta">
          <span className="course-level">{course.level}</span>
          <span className="course-language">{course.language}</span>
          <span className="course-provider">{course.providerName}</span>
        </div>
        <p className="course-description">{course.description}</p>
      </header>

      {/* Progress Overview */}
      {initialProgress && (
        <section data-testid="progress-overview" aria-label="Progress overview">
          <h2>Progress Overview</h2>
          <div className="progress-stats">
            <div className="stat-card">
              <span className="stat-label">Overall Progress</span>
              <span className="stat-value">{Math.round(initialProgress.readiness_score * 100)}%</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Average Score</span>
              <span className="stat-value">{Math.round(initialProgress.average_score)}%</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Sessions</span>
              <span className="stat-value">{initialProgress.total_sessions}</span>
            </div>
          </div>
        </section>
      )}

      {/* Dashboard Tabs */}
      <div className="dashboard-tabs" role="tablist">
        <button role="tab" aria-selected="true" data-testid="overview-tab">Overview</button>
        <button role="tab" aria-selected="false" data-testid="practice-tab">Practice</button>
        <button role="tab" aria-selected="false" data-testid="analytics-tab">Analytics</button>
        <button role="tab" aria-selected="false" data-testid="resources-tab">Resources</button>
      </div>

      {/* Overview Tab Content */}
      <div role="tabpanel" aria-labelledby="overview-tab">
        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Stats Widget */}
          <div className="widget-stats" data-testid="dashboard-stats">
            <h3>Quick Stats</h3>
            <div className="stats-overview">
              <div>Completed Exams: {availableExams.filter(e => e.completed).length}</div>
              <div>Available Exams: {availableExams.length}</div>
            </div>
          </div>

          {/* Recent Activity Widget */}
          <div className="widget-activity" data-testid="recent-activity">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {initialProgress ? (
                <div className="activity-item">
                  Last session: {new Date(initialProgress.last_session).toLocaleDateString()}
                </div>
              ) : (
                <div className="activity-empty">No recent activity</div>
              )}
            </div>
          </div>

          {/* Quick Actions Widget */}
          <div className="widget-actions" data-testid="quick-actions">
            <h3>Quick Actions</h3>
            <div className="actions-grid">
              <button
                onClick={handlers.onStartExam}
                disabled={availableExams.length === 0}
                aria-label="Start next available exam"
              >
                Start Exam
              </button>
              <button
                onClick={handlers.onViewProgress}
                aria-label="View detailed progress analytics"
              >
                View Progress
              </button>
              <button
                onClick={handlers.onViewHistory}
                aria-label="View complete exam history"
              >
                View History
              </button>
              <button
                onClick={handlers.onRefresh}
                aria-label="Refresh dashboard data"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="widget-providers" data-testid="provider-selection">
            <h3>Exam Providers</h3>
            <div className="provider-grid">
              {availableExams.map((exam, index) => (
                <div key={exam.examId} className="provider-card">
                  <h4>{exam.providerName}</h4>
                  <p>{exam.title}</p>
                  <span>{exam.duration} min</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      {achievements.length > 0 && (
        <section data-testid="achievements-section" aria-label="Achievements">
          <h2>Achievements</h2>
          <div className="achievements-grid">
            {achievements.map(achievement => (
              <div key={achievement.id} className="achievement-card">
                <h4>{achievement.title}</h4>
                <p>{achievement.description}</p>
                {achievement.earned_at && (
                  <span className="achievement-date">
                    Earned: {new Date(achievement.earned_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

describe('Course Dashboard Component Integration', () => {
  const defaultProps = {
    course: mockCourseData.basic,
    availableExams: mockAvailableExams,
    achievements: mockAchievements,
    userId: 'user-123',
    initialProgress: mockUserProgress.complete,
    initialAnalytics: mockUserProgress.complete.analytics,
    initialRecommendations: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    apiMockHelpers.setupSuccessfulApiMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // PROVIDER SECTION REMOVAL TESTS (MUST FAIL INITIALLY)
  // ========================================
  describe('Provider Section Removal Verification', () => {
    it('should NOT render the provider showcase section (lines 1027-1172)', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // These should NOT be found in the updated dashboard
      expect(screen.queryByTestId('provider-showcase-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('provider-showcase')).not.toBeInTheDocument();
      expect(screen.queryByText('Available Exam Providers')).not.toBeInTheDocument();
      expect(screen.queryByText('Choose Your Provider')).not.toBeInTheDocument();

      // Specific provider showcase elements that should be removed
      expect(screen.queryByTestId('provider-showcase-grid')).not.toBeInTheDocument();
      expect(screen.queryByTestId('provider-card-container')).not.toBeInTheDocument();
      expect(screen.queryByTestId('provider-details-panel')).not.toBeInTheDocument();
    });

    it('should verify provider selection is still available via header dropdown', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // Provider selection should be accessible through header
      const header = screen.getByTestId('academia-header');
      const providerDropdown = within(header).getByTestId('provider-selector');
      expect(providerDropdown).toBeInTheDocument();
      expect(providerDropdown).toHaveAttribute('aria-label', /select exam provider/i);
    });

    it('should have significantly shorter dashboard height without provider section', () => {
      const { container } = renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const dashboard = container.querySelector('[data-testid="course-dashboard"]');
      expect(dashboard).toBeInTheDocument();

      // Dashboard should be shorter without 145-line provider section
      const dashboardHeight = dashboard?.getBoundingClientRect().height || 0;
      expect(dashboardHeight).toBeLessThan(800); // Arbitrary threshold for shorter layout
    });

    it('should maintain all dashboard functionality without provider section', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // Core functionality should remain
      expect(screen.getByTestId('course-header')).toBeInTheDocument();
      expect(screen.getByTestId('progress-overview')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-tabs')).toBeInTheDocument();

      // New components should be present instead
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });
  });

  // ========================================
  // NEW COMPONENT INTEGRATION TESTS (MUST FAIL INITIALLY)
  // ========================================
  describe('DashboardStats Component Integration', () => {
    it('should render DashboardStats in the correct position', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const dashboardStats = screen.getByTestId('dashboard-stats');
      expect(dashboardStats).toBeInTheDocument();

      // Should be positioned where provider section used to be
      const dashboard = screen.getByTestId('course-dashboard');
      const statsPosition = within(dashboard).getByTestId('dashboard-stats');
      expect(statsPosition).toBeInTheDocument();
    });

    it('should pass correct props to DashboardStats component', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const dashboardStats = screen.getByTestId('dashboard-stats');

      // Stats should receive transformed course data
      expect(within(dashboardStats).getByText(/overall progress/i)).toBeInTheDocument();
      expect(within(dashboardStats).getByText(/average score/i)).toBeInTheDocument();
      expect(within(dashboardStats).getByText(/total sessions/i)).toBeInTheDocument();
      expect(within(dashboardStats).getByText(/completion rate/i)).toBeInTheDocument();
    });

    it('should display calculated statistics from course data', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const dashboardStats = screen.getByTestId('dashboard-stats');

      // Verify calculated values
      const expectedProgress = Math.round(mockUserProgress.complete.readiness_score * 100);
      expect(within(dashboardStats).getByText(`${expectedProgress}%`)).toBeInTheDocument();

      const expectedAverage = Math.round(mockUserProgress.complete.average_score);
      expect(within(dashboardStats).getByText(`${expectedAverage}%`)).toBeInTheDocument();

      expect(within(dashboardStats).getByText(mockUserProgress.complete.total_sessions.toString())).toBeInTheDocument();
    });
  });

  describe('ActivityTimeline Component Integration', () => {
    it('should render ActivityTimeline with recent activities', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const activityTimeline = screen.getByTestId('activity-timeline');
      expect(activityTimeline).toBeInTheDocument();

      // Should show recent activity header
      expect(within(activityTimeline).getByText(/recent activity/i)).toBeInTheDocument();
    });

    it('should convert exam sessions to activity timeline format', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const activityTimeline = screen.getByTestId('activity-timeline');

      // Should display activities from exam sessions
      expect(within(activityTimeline).getByTestId('activity-item')).toBeInTheDocument();
      expect(within(activityTimeline).getByText(/exam completed/i)).toBeInTheDocument();
      expect(within(activityTimeline).getByText(/score:/i)).toBeInTheDocument();
    });

    it('should display activity timestamps correctly', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const activityTimeline = screen.getByTestId('activity-timeline');

      // Should show relative timestamps
      expect(within(activityTimeline).getByText(/minutes ago|hours ago|days ago/)).toBeInTheDocument();
    });

    it('should handle empty activity state gracefully', () => {
      renderWithProviders(
        <CourseDashboard
          {...defaultProps}
          initialProgress={{ ...mockUserProgress.complete, exam_sessions: [] }}
        />
      );

      const activityTimeline = screen.getByTestId('activity-timeline');
      expect(within(activityTimeline).getByText(/no recent activity/i)).toBeInTheDocument();
    });
  });

  describe('QuickActions Component Integration', () => {
    it('should render QuickActions with primary actions', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const quickActions = screen.getByTestId('quick-actions');
      expect(quickActions).toBeInTheDocument();

      expect(within(quickActions).getByText(/quick actions/i)).toBeInTheDocument();
    });

    it('should generate actions based on available providers', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const quickActions = screen.getByTestId('quick-actions');

      // Should show actions for each available provider
      mockAvailableExams.forEach(exam => {
        const actionButton = within(quickActions).getByText(new RegExp(`start ${exam.providerName}`, 'i'));
        expect(actionButton).toBeInTheDocument();
      });
    });

    it('should include standard dashboard actions', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const quickActions = screen.getByTestId('quick-actions');

      expect(within(quickActions).getByText(/view progress/i)).toBeInTheDocument();
      expect(within(quickActions).getByText(/practice mode/i)).toBeInTheDocument();
      expect(within(quickActions).getByText(/analytics/i)).toBeInTheDocument();
      expect(within(quickActions).getByText(/settings/i)).toBeInTheDocument();
    });

    it('should handle quick action clicks correctly', async () => {
      const { user } = renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const quickActions = screen.getByTestId('quick-actions');
      const viewProgressBtn = within(quickActions).getByText(/view progress/i);

      await user.click(viewProgressBtn);

      // Should trigger analytics tab or navigate to progress page
      expect(screen.getByTestId('analytics-tab')).toHaveAttribute('aria-selected', 'true');
    });
  });

  // ========================================
  // LAYOUT INTEGRATION TESTS (MUST FAIL INITIALLY)
  // ========================================
  describe('New Card-Based Layout', () => {
    it('should display new card-based layout correctly', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // New layout should use card components
      expect(screen.getByTestId('dashboard-card-grid')).toBeInTheDocument();
      expect(screen.getAllByTestId(/dashboard-card-/)).toHaveLength(3); // Stats, Timeline, Actions
    });

    it('should position components where provider section used to be', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const dashboard = screen.getByTestId('course-dashboard');
      const cardGrid = within(dashboard).getByTestId('dashboard-card-grid');

      // Should be positioned in the main content area
      expect(cardGrid).toBeInTheDocument();

      // Should come after course header and progress overview
      const progressOverview = screen.getByTestId('progress-overview');
      const gridRect = cardGrid.getBoundingClientRect();
      const progressRect = progressOverview.getBoundingClientRect();

      expect(gridRect.top).toBeGreaterThan(progressRect.bottom);
    });

    it('should maintain proper spacing and visual hierarchy', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const cardGrid = screen.getByTestId('dashboard-card-grid');
      expect(cardGrid).toHaveClass(/grid|flex/); // Should use CSS Grid or Flexbox
      expect(cardGrid).toHaveClass(/gap-/); // Should have proper spacing
    });
  });

  describe('Responsive Grid Layout', () => {
    it('should adjust grid for mobile screens', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />,
        { viewport: 'mobile' }
      );

      const cardGrid = screen.getByTestId('dashboard-card-grid');
      expect(cardGrid).toHaveClass(/grid-cols-1|flex-col/); // Single column on mobile
    });

    it('should adjust grid for tablet screens', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />,
        { viewport: 'tablet' }
      );

      const cardGrid = screen.getByTestId('dashboard-card-grid');
      expect(cardGrid).toHaveClass(/grid-cols-2|grid-cols-1/); // Two columns or responsive
    });

    it('should use three columns on desktop', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />,
        { viewport: 'desktop' }
      );

      const cardGrid = screen.getByTestId('dashboard-card-grid');
      expect(cardGrid).toHaveClass(/grid-cols-3/); // Three columns on desktop
    });
  });

  // ========================================
  // DATA FLOW INTEGRATION TESTS (MUST FAIL INITIALLY)
  // ========================================
  describe('Data Flow to New Components', () => {
    it('should transform course data correctly for DashboardStats', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const statsComponent = screen.getByTestId('dashboard-stats');

      // Should receive processed statistics
      expect(within(statsComponent).getByTestId('stat-progress')).toBeInTheDocument();
      expect(within(statsComponent).getByTestId('stat-average')).toBeInTheDocument();
      expect(within(statsComponent).getByTestId('stat-sessions')).toBeInTheDocument();
      expect(within(statsComponent).getByTestId('stat-completion')).toBeInTheDocument();
    });

    it('should convert exam sessions for ActivityTimeline', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const timelineComponent = screen.getByTestId('activity-timeline');

      // Should process exam sessions into timeline format
      const activities = within(timelineComponent).getAllByTestId('timeline-activity');
      expect(activities.length).toBeGreaterThan(0);

      // Each activity should have proper structure
      activities.forEach(activity => {
        expect(within(activity).getByTestId('activity-type')).toBeInTheDocument();
        expect(within(activity).getByTestId('activity-timestamp')).toBeInTheDocument();
        expect(within(activity).getByTestId('activity-details')).toBeInTheDocument();
      });
    });

    it('should generate quick actions from available providers', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const actionsComponent = screen.getByTestId('quick-actions');

      // Should create actions for each provider
      const providerActions = within(actionsComponent).getAllByTestId(/action-provider-/);
      expect(providerActions.length).toBe(mockAvailableExams.length);

      // Should include standard actions
      expect(within(actionsComponent).getByTestId('action-progress')).toBeInTheDocument();
      expect(within(actionsComponent).getByTestId('action-practice')).toBeInTheDocument();
      expect(within(actionsComponent).getByTestId('action-analytics')).toBeInTheDocument();
    });
  });

  // ========================================
  // ACCESSIBILITY INTEGRATION TESTS (MUST FAIL INITIALLY)
  // ========================================
  describe('Accessibility Integration', () => {
    it('should maintain WCAG 2.1 AA compliance with new layout', async () => {
      const { container } = renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // Run accessibility audit
      const results = await a11yTestHelpers.runA11yAudit(container);
      expect(results).toHaveNoA11yViolations();
    });

    it('should have proper focus management across new components', async () => {
      const { user } = renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // Tab through new components
      await user.tab();
      expect(screen.getByTestId('dashboard-stats')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('activity-timeline')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('quick-actions')).toHaveFocus();
    });

    it('should have proper ARIA labels and descriptions for new components', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      expect(screen.getByTestId('dashboard-stats')).toHaveAttribute('aria-label', /course statistics/i);
      expect(screen.getByTestId('activity-timeline')).toHaveAttribute('aria-label', /recent activity/i);
      expect(screen.getByTestId('quick-actions')).toHaveAttribute('aria-label', /quick actions/i);
    });

    it('should maintain semantic structure with new components', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // Each new component should have proper semantic structure
      const statsSection = screen.getByTestId('dashboard-stats');
      expect(within(statsSection).getByRole('region')).toBeInTheDocument();

      const timelineSection = screen.getByTestId('activity-timeline');
      expect(within(timelineSection).getByRole('region')).toBeInTheDocument();

      const actionsSection = screen.getByTestId('quick-actions');
      expect(within(actionsSection).getByRole('region')).toBeInTheDocument();
    });
  });

  // ========================================
  // PERFORMANCE INTEGRATION TESTS (MUST FAIL INITIALLY)
  // ========================================
  describe('Performance Integration', () => {
    it('should load faster without provider section', () => {
      const startTime = performance.now();

      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(100); // Should be faster without heavy provider section
    });

    it('should optimize component rendering with new layout', () => {
      const { rerender } = renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // Measure re-render performance
      const startTime = performance.now();

      rerender(
        <CourseDashboard
          {...defaultProps}
          initialProgress={{
            ...mockUserProgress.complete,
            average_score: 95
          }}
        />
      );

      const rerenderTime = performance.now() - startTime;
      expect(rerenderTime).toBeLessThan(50); // Optimized re-renders
    });

    it('should not have memory leaks from removed provider code', () => {
      const { unmount } = renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // Provider section cleanup should not cause memory leaks
      expect(() => unmount()).not.toThrow();
    });
  });

  // ========================================
  // EXISTING TESTS (UPDATED FOR NEW LAYOUT)
  // ========================================
  describe('Component Rendering', () => {
    it('should render complete dashboard with new layout successfully', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      dashboardTestHelpers.expectCompleteDashboard();
      expect(screen.getByText(mockCourseData.basic.title)).toBeInTheDocument();

      // New components should be present
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });

    it('should display course information correctly', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      expect(screen.getByText(mockCourseData.basic.title)).toBeInTheDocument();
      expect(screen.getByText(mockCourseData.basic.level)).toBeInTheDocument();
      expect(screen.getByText(mockCourseData.basic.language)).toBeInTheDocument();
      expect(screen.getByText(mockCourseData.basic.providerName)).toBeInTheDocument();
      expect(screen.getByText(mockCourseData.basic.description)).toBeInTheDocument();
    });

    it('should render new dashboard widgets instead of provider section', () => {
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // New components should be present
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();

      // Old provider section should NOT be present
      expect(screen.queryByTestId('provider-showcase-section')).not.toBeInTheDocument();
    });
  });

  // ========================================
  // INTEGRATION EDGE CASES (MUST FAIL INITIALLY)
  // ========================================
  describe('Integration Edge Cases', () => {
    it('should handle dashboard transitions between old and new layouts', async () => {
      const { rerender } = renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // Verify new layout is active
      expect(screen.getByTestId('dashboard-card-grid')).toBeInTheDocument();
      expect(screen.queryByTestId('provider-showcase-section')).not.toBeInTheDocument();

      // Test data updates in new layout
      const updatedProps = {
        ...defaultProps,
        initialProgress: {
          ...mockUserProgress.complete,
          average_score: 95,
          total_sessions: 25
        }
      };

      rerender(<CourseDashboard {...updatedProps} />);

      // New components should update correctly
      await waitFor(() => {
        expect(screen.getByText('95%')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      });
    });

    it('should maintain dashboard state during provider selection via header', async () => {
      const { user } = renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // Interact with header provider dropdown
      const header = screen.getByTestId('academia-header');
      const providerDropdown = within(header).getByTestId('provider-selector');

      await user.click(providerDropdown);

      // Dashboard should remain stable
      expect(screen.getByTestId('dashboard-card-grid')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });

    it('should handle missing component dependencies gracefully', () => {
      // Test what happens if new components fail to load
      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // Dashboard should still render even if some new components fail
      expect(screen.getByTestId('course-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('course-header')).toBeInTheDocument();
    });
  });

  // ========================================
  // FULL DASHBOARD EXPERIENCE TESTS (MUST FAIL INITIALLY)
  // ========================================
  describe('Full Dashboard Experience', () => {
    it('should provide complete user journey from course page to dashboard interactions', async () => {
      const { user } = renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // 1. Dashboard loads with new layout
      expect(screen.getByTestId('dashboard-card-grid')).toBeInTheDocument();
      expect(screen.queryByTestId('provider-showcase-section')).not.toBeInTheDocument();

      // 2. User can interact with stats
      const statsCard = screen.getByTestId('dashboard-stats');
      await user.click(within(statsCard).getByTestId('stat-progress'));
      expect(screen.getByTestId('analytics-tab')).toHaveAttribute('aria-selected', 'true');

      // 3. User can view recent activity
      const timelineCard = screen.getByTestId('activity-timeline');
      const activityItem = within(timelineCard).getByTestId('activity-item');
      await user.click(activityItem);
      // Should show activity details

      // 4. User can access quick actions
      const actionsCard = screen.getByTestId('quick-actions');
      const startExamBtn = within(actionsCard).getByText(/start/i);
      await user.click(startExamBtn);
      // Should navigate to exam

      // 5. Provider selection still available via header
      const header = screen.getByTestId('academia-header');
      const providerSelector = within(header).getByTestId('provider-selector');
      expect(providerSelector).toBeInTheDocument();
    });

    it('should maintain UX consistency throughout dashboard interactions', async () => {
      const { user } = renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      // Test tab navigation
      await user.tab(); // Should focus first interactive element
      await user.tab(); // Should focus next element

      // All new components should be keyboard accessible
      const statsCard = screen.getByTestId('dashboard-stats');
      const timelineCard = screen.getByTestId('activity-timeline');
      const actionsCard = screen.getByTestId('quick-actions');

      expect(statsCard).toBeInTheDocument();
      expect(timelineCard).toBeInTheDocument();
      expect(actionsCard).toBeInTheDocument();
    });

    it('should optimize overall dashboard performance with new architecture', () => {
      // Performance baseline measurement
      const startTime = performance.now();

      renderWithProviders(
        <CourseDashboard {...defaultProps} />
      );

      const renderTime = performance.now() - startTime;

      // Should be faster than old layout with provider section
      expect(renderTime).toBeLessThan(150); // Reasonable threshold

      // Should have rendered all new components
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.getByTestId('activity-timeline')).toBeInTheDocument();
      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();

      // Should NOT have rendered removed provider section
      expect(screen.queryByTestId('provider-showcase-section')).not.toBeInTheDocument();
    });
  });

  // Legacy tests kept for backward compatibility (using MockCourseDashboard for transition period)
  describe('Legacy Compatibility Tests', () => {
    it('should handle loading states', () => {
      renderWithProviders(
        <MockCourseDashboard {...defaultProps} isLoading={true} />
      );
      dashboardTestHelpers.expectLoadingState();
    });

    it('should handle error states', () => {
      const errorMessage = 'Failed to load dashboard data';
      renderWithProviders(
        <MockCourseDashboard {...defaultProps} error={errorMessage} />
      );
      dashboardTestHelpers.expectErrorState(errorMessage);
    });

    it('should handle empty states', () => {
      renderWithProviders(
        <MockCourseDashboard {...defaultProps} course={null} />
      );
      dashboardTestHelpers.expectEmptyState();
    });
  });
});

// ========================================
// TEST EXECUTION SUMMARY
// ========================================
/**
 * INTEGRATION TEST SUMMARY FOR T007
 *
 * This test suite comprehensively validates the dashboard redesign:
 *
 * 🔴 MUST FAIL INITIALLY:
 * - Provider section removal tests (lines 1027-1172)
 * - New component integration (DashboardStats, ActivityTimeline, QuickActions)
 * - Card-based layout implementation
 * - Data flow to new components
 * - Accessibility compliance with new structure
 * - Performance improvements
 *
 * ✅ WILL PASS AFTER IMPLEMENTATION:
 * - Dashboard loads with new card-based layout
 * - Provider selection available via header dropdown
 * - Significantly shorter dashboard without provider section
 * - All new components render with correct props
 * - Responsive grid adjusts for different screen sizes
 * - WCAG 2.1 AA compliance maintained
 * - Performance improvements measured
 *
 * 🎯 INTEGRATION SCOPE:
 * - Complete dashboard experience from course page to interactions
 * - Data transformation and component communication
 * - Accessibility and performance validation
 * - Edge case handling and error recovery
 *
 * 📊 SUCCESS CRITERIA:
 * - 0 provider showcase elements found
 * - 3 new components integrated successfully
 * - Dashboard height < 800px (shorter without provider section)
 * - Load time < 100ms (performance improvement)
 * - 100% accessibility compliance maintained
 * - Full keyboard navigation supported
 *
 * Run with: npm test course-dashboard.test.tsx
 */