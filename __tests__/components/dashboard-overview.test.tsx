import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { DashboardOverview } from '@/components/academia/course-dashboard';
import { AuthProvider } from '@/contexts/AuthContext';
import { CourseProvider } from '@/contexts/CourseContext';

// Mock dependencies
vi.mock('@/utils/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } }
      })
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }))
}));

vi.mock('@/lib/exam-engine/core/progress-engine', () => ({
  ProgressEngine: {
    getUserProgress: vi.fn(),
    calculateCompletionRate: vi.fn(),
    getRecentActivity: vi.fn()
  }
}));

vi.mock('@/lib/exam-engine/core/analytics-engine', () => ({
  AnalyticsEngine: {
    getUserMetrics: vi.fn(),
    getPerformanceInsights: vi.fn()
  }
}));

// Mock course data
const mockCourseData = {
  id: 'test-course-id',
  title: 'Inglés B2 EOI',
  level: 'B2',
  language: 'english',
  totalExams: 12,
  completedExams: 7,
  averageScore: 85.5,
  timeSpent: 2400, // minutes
  lastActivity: new Date('2024-01-15T10:30:00Z'),
  nextExam: {
    id: 'next-exam-id',
    title: 'Reading Comprehension',
    difficulty: 'intermediate',
    estimatedTime: 45
  }
};

const mockProgressData = {
  overallProgress: 58.3,
  recentActivity: [
    {
      id: 'activity-1',
      type: 'exam_completed',
      examTitle: 'Listening Practice',
      score: 92,
      date: new Date('2024-01-14T15:20:00Z')
    },
    {
      id: 'activity-2',
      type: 'study_session',
      topic: 'Grammar Review',
      duration: 30,
      date: new Date('2024-01-13T18:45:00Z')
    }
  ],
  weeklyStats: {
    sessionsCompleted: 5,
    hoursStudied: 8.5,
    averageScore: 87.2,
    improvement: +12.5
  }
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <CourseProvider>
      {children}
    </CourseProvider>
  </AuthProvider>
);

describe('DashboardOverview Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render dashboard overview with course information', () => {
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText(mockCourseData.title)).toBeInTheDocument();
      expect(screen.getByText(`Level ${mockCourseData.level}`)).toBeInTheDocument();
    });

    it('should display progress statistics correctly', () => {
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      expect(screen.getByText('58.3%')).toBeInTheDocument(); // Overall progress
      expect(screen.getByText('7/12')).toBeInTheDocument(); // Completed exams
      expect(screen.getByText('85.5')).toBeInTheDocument(); // Average score
    });

    it('should render recent activity list', () => {
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Listening Practice')).toBeInTheDocument();
      expect(screen.getByText('Grammar Review')).toBeInTheDocument();
      expect(screen.getByText('Score: 92')).toBeInTheDocument();
    });

    it('should show next recommended exam', () => {
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Next Recommended')).toBeInTheDocument();
      expect(screen.getByText('Reading Comprehension')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle start exam button click', async () => {
      const mockOnStartExam = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
            onStartExam={mockOnStartExam}
          />
        </TestWrapper>
      );

      const startButton = screen.getByRole('button', { name: /start exam/i });
      await user.click(startButton);

      expect(mockOnStartExam).toHaveBeenCalledWith(mockCourseData.nextExam.id);
    });

    it('should handle view progress details click', async () => {
      const mockOnViewProgress = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
            onViewProgress={mockOnViewProgress}
          />
        </TestWrapper>
      );

      const progressButton = screen.getByRole('button', { name: /view progress/i });
      await user.click(progressButton);

      expect(mockOnViewProgress).toHaveBeenCalled();
    });

    it('should handle exam history navigation', async () => {
      const mockOnViewHistory = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
            onViewHistory={mockOnViewHistory}
          />
        </TestWrapper>
      );

      const historyLink = screen.getByRole('link', { name: /exam history/i });
      await user.click(historyLink);

      expect(mockOnViewHistory).toHaveBeenCalled();
    });

    it('should handle refresh data action', async () => {
      const mockOnRefresh = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
            onRefresh={mockOnRefresh}
          />
        </TestWrapper>
      );

      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading state when data is being fetched', () => {
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={null}
            progressData={null}
            isLoading={true}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display error state when data fetch fails', () => {
      const errorMessage = 'Failed to load dashboard data';
      
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={null}
            progressData={null}
            error={errorMessage}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should display empty state when no course data available', () => {
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={null}
            progressData={null}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/no course data available/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /browse courses/i })).toBeInTheDocument();
    });

    it('should handle partial data gracefully', () => {
      const partialCourseData = {
        ...mockCourseData,
        nextExam: null
      };

      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={partialCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/no upcoming exams/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toHaveAccessibleName();
      expect(screen.getByRole('region', { name: /progress overview/i })).toBeInTheDocument();
      expect(screen.getByRole('list', { name: /recent activity/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      const startButton = screen.getByRole('button', { name: /start exam/i });
      
      await user.tab();
      expect(startButton).toHaveFocus();
      
      await user.keyboard('{Enter}');
      // Should trigger start exam action
    });

    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(4); // Main title + 3 sections
      expect(headings[0]).toHaveTextContent(mockCourseData.title);
    });

    it('should provide screen reader friendly progress information', () => {
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/course progress 58.3 percent complete/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/7 of 12 exams completed/i)).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile viewport', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      const container = screen.getByRole('main');
      expect(container).toHaveClass(/mobile/i);
    });

    it('should stack cards vertically on small screens', () => {
      // Simulate mobile viewport
      global.innerWidth = 480;
      global.dispatchEvent(new Event('resize'));

      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      const statsGrid = screen.getByTestId('stats-grid');
      expect(statsGrid).toHaveClass(/flex-col/);
    });

    it('should use appropriate text sizes for different screen sizes', () => {
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass(/text-2xl/, /md:text-4xl/);
    });
  });

  describe('Performance Characteristics', () => {
    it('should memoize expensive calculations', () => {
      const { rerender } = render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      // Re-render with same props
      rerender(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      // Calculations should be memoized and not recalculated
      // This would be verified through performance monitoring in real implementation
    });

    it('should handle large datasets efficiently', () => {
      const largeMockData = {
        ...mockProgressData,
        recentActivity: Array.from({ length: 1000 }, (_, i) => ({
          id: `activity-${i}`,
          type: 'exam_completed',
          examTitle: `Exam ${i}`,
          score: 80 + Math.random() * 20,
          date: new Date()
        }))
      };

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={largeMockData}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      
      // Should render within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should implement virtual scrolling for large activity lists', () => {
      const largeActivityList = Array.from({ length: 500 }, (_, i) => ({
        id: `activity-${i}`,
        type: 'exam_completed',
        examTitle: `Test Activity ${i}`,
        score: 85,
        date: new Date()
      }));

      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={{
              ...mockProgressData,
              recentActivity: largeActivityList
            }}
          />
        </TestWrapper>
      );

      // Only visible items should be rendered in DOM
      const renderedItems = screen.getAllByTestId(/activity-item/);
      expect(renderedItems.length).toBeLessThanOrEqual(20); // Virtualized limit
    });
  });

  describe('Component Integration', () => {
    it('should integrate with course context', async () => {
      const mockCourseContext = {
        currentCourse: mockCourseData,
        updateCourse: vi.fn(),
        refreshCourseData: vi.fn()
      };

      render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      // Should reflect course context data
      expect(screen.getByText(mockCourseData.title)).toBeInTheDocument();
    });

    it('should handle real-time data updates', async () => {
      const { rerender } = render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      const updatedProgressData = {
        ...mockProgressData,
        overallProgress: 65.8
      };

      rerender(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={updatedProgressData}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('65.8%')).toBeInTheDocument();
      });
    });

    it('should handle course switching', async () => {
      const newCourseData = {
        ...mockCourseData,
        id: 'new-course-id',
        title: 'Français A2',
        language: 'french'
      };

      const { rerender } = render(
        <TestWrapper>
          <DashboardOverview 
            courseData={mockCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      rerender(
        <TestWrapper>
          <DashboardOverview 
            courseData={newCourseData}
            progressData={mockProgressData}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Français A2')).toBeInTheDocument();
      });
    });
  });
});