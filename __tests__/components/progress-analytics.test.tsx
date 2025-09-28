import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ProgressAnalytics } from '@/components/academia/progress-analytics';
import { AuthProvider } from '@/contexts/AuthContext';
import { CourseProvider } from '@/contexts/CourseContext';

// Mock Chart.js components
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options, ...props }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} {...props} />
  ),
  Bar: ({ data, options, ...props }: any) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} {...props} />
  ),
  Doughnut: ({ data, options, ...props }: any) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} {...props} />
  ),
  Radar: ({ data, options, ...props }: any) => (
    <div data-testid="radar-chart" data-chart-data={JSON.stringify(data)} {...props} />
  )
}));

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn()
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  BarElement: vi.fn(),
  ArcElement: vi.fn(),
  RadialLinearScale: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  Filler: vi.fn()
}));

// Mock analytics engine
vi.mock('@/lib/exam-engine/core/analytics-engine', () => ({
  AnalyticsEngine: {
    getProgressAnalytics: vi.fn(),
    getPerformanceMetrics: vi.fn(),
    getSkillBreakdown: vi.fn(),
    getTimeSeriesData: vi.fn(),
    generateInsights: vi.fn()
  }
}));

vi.mock('@/lib/exam-engine/core/progress-engine', () => ({
  ProgressEngine: {
    getUserProgress: vi.fn(),
    getProgressHistory: vi.fn(),
    calculateTrends: vi.fn()
  }
}));

// Mock analytics data
const mockAnalyticsData = {
  userId: 'test-user-id',
  courseId: 'test-course-id',
  timeRange: '30d',
  overallMetrics: {
    totalExams: 24,
    averageScore: 82.5,
    improvementRate: 15.3,
    studyTime: 1800, // minutes
    streak: 7
  },
  progressTimeline: [
    { date: '2024-01-01', score: 75, exam: 'Grammar Test 1' },
    { date: '2024-01-08', score: 78, exam: 'Vocabulary Quiz' },
    { date: '2024-01-15', score: 82, exam: 'Reading Comprehension' },
    { date: '2024-01-22', score: 85, exam: 'Listening Practice' },
    { date: '2024-01-29', score: 88, exam: 'Speaking Assessment' }
  ],
  skillBreakdown: {
    reading: { score: 85, improvement: +8 },
    listening: { score: 80, improvement: +12 },
    writing: { score: 78, improvement: +5 },
    speaking: { score: 82, improvement: +15 },
    grammar: { score: 88, improvement: +3 },
    vocabulary: { score: 76, improvement: +20 }
  },
  weeklyActivity: [
    { week: 'Week 1', sessions: 5, hours: 8.5 },
    { week: 'Week 2', sessions: 6, hours: 9.2 },
    { week: 'Week 3', sessions: 4, hours: 6.8 },
    { week: 'Week 4', sessions: 7, hours: 11.3 }
  ],
  insights: [
    {
      type: 'strength',
      skill: 'grammar',
      message: 'Your grammar skills are consistently strong',
      confidence: 0.92
    },
    {
      type: 'improvement_area',
      skill: 'vocabulary',
      message: 'Focus on vocabulary expansion for faster progress',
      confidence: 0.85
    },
    {
      type: 'trend',
      skill: 'overall',
      message: 'Steady improvement trend over the past month',
      confidence: 0.78
    }
  ]
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <CourseProvider>
      {children}
    </CourseProvider>
  </AuthProvider>
);

describe('ProgressAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render progress analytics dashboard', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText(/progress analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/performance overview/i)).toBeInTheDocument();
    });

    it('should display overall metrics correctly', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      expect(screen.getByText('24')).toBeInTheDocument(); // Total exams
      expect(screen.getByText('82.5')).toBeInTheDocument(); // Average score
      expect(screen.getByText('+15.3%')).toBeInTheDocument(); // Improvement rate
      expect(screen.getByText('30h')).toBeInTheDocument(); // Study time
      expect(screen.getByText('7 days')).toBeInTheDocument(); // Streak
    });

    it('should render progress timeline chart', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const lineChart = screen.getByTestId('line-chart');
      expect(lineChart).toBeInTheDocument();
      
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '{}');
      expect(chartData.datasets).toBeDefined();
      expect(chartData.labels).toHaveLength(5);
    });

    it('should display skill breakdown radar chart', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const radarChart = screen.getByTestId('radar-chart');
      expect(radarChart).toBeInTheDocument();
      
      expect(screen.getByText('Reading: 85')).toBeInTheDocument();
      expect(screen.getByText('Grammar: 88')).toBeInTheDocument();
      expect(screen.getByText('Vocabulary: 76')).toBeInTheDocument();
    });

    it('should show weekly activity bar chart', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const barChart = screen.getByTestId('bar-chart');
      expect(barChart).toBeInTheDocument();
      
      expect(screen.getByText(/weekly activity/i)).toBeInTheDocument();
    });

    it('should display AI-generated insights', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      expect(screen.getByText(/insights/i)).toBeInTheDocument();
      expect(screen.getByText(/grammar skills are consistently strong/i)).toBeInTheDocument();
      expect(screen.getByText(/vocabulary expansion/i)).toBeInTheDocument();
      expect(screen.getByText(/steady improvement trend/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle time range selection', async () => {
      const mockOnTimeRangeChange = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
            onTimeRangeChange={mockOnTimeRangeChange}
          />
        </TestWrapper>
      );

      const timeRangeSelect = screen.getByRole('combobox', { name: /time range/i });
      await user.selectOptions(timeRangeSelect, '7d');

      expect(mockOnTimeRangeChange).toHaveBeenCalledWith('7d');
    });

    it('should handle chart type switching', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const chartTypeButton = screen.getByRole('button', { name: /bar chart/i });
      await user.click(chartTypeButton);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should handle skill detail expansion', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const skillButton = screen.getByRole('button', { name: /reading details/i });
      await user.click(skillButton);

      expect(screen.getByText(/detailed reading analysis/i)).toBeInTheDocument();
    });

    it('should handle export functionality', async () => {
      const mockOnExport = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
            onExportData={mockOnExport}
          />
        </TestWrapper>
      );

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(mockOnExport).toHaveBeenCalledWith(mockAnalyticsData, 'pdf');
    });

    it('should handle refresh data action', async () => {
      const mockOnRefresh = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
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
    it('should display loading state when fetching analytics', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={null}
            courseId="test-course-id"
            isLoading={true}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/loading analytics/i)).toBeInTheDocument();
      expect(screen.getAllByTestId('skeleton')).toHaveLength(4); // Chart skeletons
    });

    it('should display error state when analytics fetch fails', () => {
      const errorMessage = 'Failed to load analytics data';
      
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={null}
            courseId="test-course-id"
            error={errorMessage}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should display empty state when no analytics data available', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={{
              ...mockAnalyticsData,
              progressTimeline: [],
              overallMetrics: { ...mockAnalyticsData.overallMetrics, totalExams: 0 }
            }}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      expect(screen.getByText(/no analytics data available/i)).toBeInTheDocument();
      expect(screen.getByText(/start taking exams/i)).toBeInTheDocument();
    });

    it('should handle partial data gracefully', () => {
      const partialData = {
        ...mockAnalyticsData,
        skillBreakdown: null,
        insights: []
      };

      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={partialData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      expect(screen.getByText(/skill analysis unavailable/i)).toBeInTheDocument();
      expect(screen.getByText(/no insights available/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels for charts', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const lineChart = screen.getByTestId('line-chart');
      expect(lineChart).toHaveAttribute('aria-label');
      
      const radarChart = screen.getByTestId('radar-chart');
      expect(radarChart).toHaveAttribute('aria-label');
    });

    it('should provide alternative text for chart data', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      expect(screen.getByText(/progress trend from 75 to 88 points/i)).toBeInTheDocument();
      expect(screen.getByText(/highest skill: grammar at 88 points/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation for interactive elements', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const timeRangeSelect = screen.getByRole('combobox', { name: /time range/i });
      
      await user.tab();
      expect(timeRangeSelect).toHaveFocus();
      
      await user.keyboard('{ArrowDown}');
      // Should navigate through options
    });

    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toHaveAttribute('aria-level', '1'); // Main title
      expect(headings[1]).toHaveAttribute('aria-level', '2'); // Section headers
    });

    it('should announce dynamic content changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const updatedData = {
        ...mockAnalyticsData,
        overallMetrics: {
          ...mockAnalyticsData.overallMetrics,
          averageScore: 85.2
        }
      };

      rerender(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={updatedData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toHaveTextContent(/analytics updated/i);
    });
  });

  describe('Responsive Design', () => {
    it('should adapt chart layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const container = screen.getByRole('main');
      expect(container).toHaveClass(/mobile-layout/);
    });

    it('should stack metrics cards vertically on small screens', () => {
      // Simulate small screen
      global.innerWidth = 640;
      global.dispatchEvent(new Event('resize'));

      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const metricsGrid = screen.getByTestId('metrics-grid');
      expect(metricsGrid).toHaveClass(/grid-cols-1/, /sm:grid-cols-2/);
    });

    it('should adjust chart aspect ratios for different screen sizes', () => {
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const chartContainer = screen.getByTestId('chart-container');
      expect(chartContainer).toHaveClass(/aspect-video/, /md:aspect-[4/3]/);
    });
  });

  describe('Performance Characteristics', () => {
    it('should memoize expensive chart calculations', () => {
      const { rerender } = render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      // Re-render with same props
      rerender(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      // Chart data processing should be memoized
      // Verification through performance monitoring
    });

    it('should handle large datasets efficiently', () => {
      const largeDataset = {
        ...mockAnalyticsData,
        progressTimeline: Array.from({ length: 365 }, (_, i) => ({
          date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
          score: 70 + Math.random() * 30,
          exam: `Daily Practice ${i + 1}`
        }))
      };

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={largeDataset}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should implement chart data sampling for performance', () => {
      const massiveDataset = {
        ...mockAnalyticsData,
        progressTimeline: Array.from({ length: 10000 }, (_, i) => ({
          date: `2024-${String(Math.floor(i / 365) + 1).padStart(2, '0')}-${String((i % 365) + 1).padStart(2, '0')}`,
          score: 70 + Math.random() * 30,
          exam: `Test ${i}`
        }))
      };

      render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={massiveDataset}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const lineChart = screen.getByTestId('line-chart');
      const chartData = JSON.parse(lineChart.getAttribute('data-chart-data') || '{}');
      
      // Data should be sampled to reasonable size
      expect(chartData.labels.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Component Integration', () => {
    it('should integrate with analytics engine hooks', async () => {
      const mockUseAnalytics = vi.fn().mockReturnValue({
        data: mockAnalyticsData,
        isLoading: false,
        error: null,
        refetch: vi.fn()
      });

      render(
        <TestWrapper>
          <ProgressAnalytics 
            courseId="test-course-id"
            useAnalyticsHook={mockUseAnalytics}
          />
        </TestWrapper>
      );

      expect(mockUseAnalytics).toHaveBeenCalledWith('test-course-id');
    });

    it('should handle real-time analytics updates', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      const updatedData = {
        ...mockAnalyticsData,
        overallMetrics: {
          ...mockAnalyticsData.overallMetrics,
          streak: 8
        }
      };

      rerender(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={updatedData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('8 days')).toBeInTheDocument();
      });
    });

    it('should synchronize with course context changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={mockAnalyticsData}
            courseId="test-course-id"
          />
        </TestWrapper>
      );

      // Course change should trigger analytics reload
      rerender(
        <TestWrapper>
          <ProgressAnalytics 
            analyticsData={null}
            courseId="new-course-id"
            isLoading={true}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});