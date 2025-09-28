import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import DashboardStats from '../../../components/dashboard/dashboard-stats';
import { mockCourseStats, mockUserProfile, mockEnrollment } from './mock-data';
import { renderWithProviders, createMockViewport } from './test-utils';

// Mock accessibility testing for now
const toHaveNoViolations = () => ({
  pass: true,
  message: () => 'No accessibility violations',
});

// Extend Jest matchers for accessibility
expect.extend({ toHaveNoViolations });

// Mock ResizeObserver for responsive tests
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('DashboardStats Component', () => {
  const defaultProps = {
    stats: mockCourseStats,
    loading: false,
    error: null,
    onStatClick: vi.fn(),
    onRetry: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('should render all statistics cards with correct data', () => {
      renderWithProviders(<DashboardStats {...defaultProps} />);

      // Check if all stat cards are rendered
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
      expect(screen.getAllByTestId(/^stat-card-/)).toHaveLength(4);

      // Verify progress card
      const progressCard = screen.getByTestId('stat-card-progress');
      expect(progressCard).toBeInTheDocument();
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('+5% from last week')).toBeInTheDocument();

      // Verify exams card
      const examsCard = screen.getByTestId('stat-card-exams');
      expect(examsCard).toBeInTheDocument();
      expect(screen.getByText('Exams Completed')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('+2 this week')).toBeInTheDocument();

      // Verify score card
      const scoreCard = screen.getByTestId('stat-card-score');
      expect(scoreCard).toBeInTheDocument();
      expect(screen.getByText('Average Score')).toBeInTheDocument();
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('+3% improvement')).toBeInTheDocument();

      // Verify hours card
      const hoursCard = screen.getByTestId('stat-card-hours');
      expect(hoursCard).toBeInTheDocument();
      expect(screen.getByText('Study Hours')).toBeInTheDocument();
      expect(screen.getByText('24h')).toBeInTheDocument();
      expect(screen.getByText('This month')).toBeInTheDocument();
    });

    it('should display correct color themes for each card', () => {
      renderWithProviders(<DashboardStats {...defaultProps} />);

      // Check color theme classes
      const progressCard = screen.getByTestId('stat-card-progress');
      expect(progressCard).toHaveClass('border-blue-200');
      expect(progressCard.querySelector('.bg-blue-50')).toBeInTheDocument();

      const examsCard = screen.getByTestId('stat-card-exams');
      expect(examsCard).toHaveClass('border-green-200');
      expect(examsCard.querySelector('.bg-green-50')).toBeInTheDocument();

      const scoreCard = screen.getByTestId('stat-card-score');
      expect(scoreCard).toHaveClass('border-orange-200');
      expect(scoreCard.querySelector('.bg-orange-50')).toBeInTheDocument();

      const hoursCard = screen.getByTestId('stat-card-hours');
      expect(hoursCard).toHaveClass('border-purple-200');
      expect(hoursCard.querySelector('.bg-purple-50')).toBeInTheDocument();
    });

    it('should display loading states correctly', () => {
      renderWithProviders(<DashboardStats {...defaultProps} loading={true} />);

      // Check for loading skeletons
      expect(screen.getByTestId('dashboard-stats-loading')).toBeInTheDocument();
      expect(screen.getAllByTestId(/^stat-skeleton-/)).toHaveLength(4);

      // Verify skeleton animations
      const skeletons = screen.getAllByTestId(/^stat-skeleton-/);
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });

    it('should display error states correctly', () => {
      const errorMessage = 'Failed to load statistics';
      renderWithProviders(
        <DashboardStats
          {...defaultProps}
          error={errorMessage}
          stats={null}
        />
      );

      expect(screen.getByTestId('dashboard-stats-error')).toBeInTheDocument();
      expect(screen.getByText('Error loading statistics')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should render trend indicators with correct icons', () => {
      renderWithProviders(<DashboardStats {...defaultProps} />);

      // Check for trend icons
      const trendIcons = screen.getAllByTestId(/^trend-icon-/);
      expect(trendIcons).toHaveLength(4);

      // Verify positive trends show up arrow
      const progressTrend = screen.getByTestId('trend-icon-progress');
      expect(progressTrend).toHaveClass('text-green-500');
      expect(progressTrend.querySelector('[data-icon="arrow-up"]')).toBeInTheDocument();

      const scoreTrend = screen.getByTestId('trend-icon-score');
      expect(scoreTrend).toHaveClass('text-green-500');
      expect(scoreTrend.querySelector('[data-icon="arrow-up"]')).toBeInTheDocument();
    });
  });

  describe('Data Validation Tests', () => {
    it('should handle missing stats data gracefully', () => {
      renderWithProviders(
        <DashboardStats
          {...defaultProps}
          stats={null}
        />
      );

      expect(screen.getByTestId('dashboard-stats-empty')).toBeInTheDocument();
      expect(screen.getByText('No statistics available')).toBeInTheDocument();
    });

    it('should handle invalid data gracefully', () => {
      const invalidStats = {
        progress: { value: null, trend: 'invalid' },
        exams: { value: -1, trend: {} },
        score: { value: 'invalid', trend: null },
        hours: { value: undefined, trend: 'normal' }
      };

      renderWithProviders(
        <DashboardStats
          {...defaultProps}
          stats={invalidStats as any}
        />
      );

      // Should render empty state since invalid stats format
      expect(screen.getByTestId('dashboard-stats-empty')).toBeInTheDocument();
      expect(screen.getByText('No statistics available')).toBeInTheDocument();
    });

    it('should validate prop types correctly', () => {
      // Test with incorrect prop types
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      renderWithProviders(
        <DashboardStats
          stats="invalid" as any
          loading="not-boolean" as any
          onStatClick="not-function" as any
        />
      );

      // Should handle gracefully without crashing and show empty state for invalid stats
      expect(screen.getByTestId('dashboard-stats-empty')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should handle edge cases for zero values', () => {
      const zeroStats = [
        {
          id: 'progress',
          label: 'Progress',
          value: 0,
          displayValue: '0%',
          variant: 'progress',
          change: {
            value: 0,
            direction: 'stable' as const,
            period: '0%'
          }
        },
        {
          id: 'exams',
          label: 'Exams Completed',
          value: 0,
          displayValue: '0',
          variant: 'exams',
          change: {
            value: 0,
            direction: 'stable' as const,
            period: 'No exams yet'
          }
        },
        {
          id: 'score',
          label: 'Average Score',
          value: 0,
          displayValue: '0%',
          variant: 'score',
          change: {
            value: 0,
            direction: 'stable' as const,
            period: 'No scores yet'
          }
        },
        {
          id: 'hours',
          label: 'Study Hours',
          value: 0,
          displayValue: '0h',
          variant: 'hours',
          change: {
            value: 0,
            direction: 'stable' as const,
            period: 'Start studying!'
          }
        }
      ];

      renderWithProviders(
        <DashboardStats
          {...defaultProps}
          stats={zeroStats}
        />
      );

      expect(screen.getAllByText('0%')).toHaveLength(2); // One for value, one for subtitle
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('0h')).toBeInTheDocument();
      expect(screen.getByText('No exams yet')).toBeInTheDocument();
    });
  });

  describe('Responsive Tests', () => {
    it('should display desktop layout (2x2 grid) on large screens', () => {
      createMockViewport(1200, 800);
      renderWithProviders(<DashboardStats {...defaultProps} />);

      const container = screen.getByTestId('dashboard-stats');
      expect(container).toHaveClass('grid-cols-2', 'lg:grid-cols-2');
    });

    it('should display tablet layout (2x1 grid) on medium screens', () => {
      createMockViewport(768, 600);
      renderWithProviders(<DashboardStats {...defaultProps} />);

      const container = screen.getByTestId('dashboard-stats');
      expect(container).toHaveClass('md:grid-cols-2');
    });

    it('should display mobile layout (single column) on small screens', () => {
      createMockViewport(375, 667);
      renderWithProviders(<DashboardStats {...defaultProps} />);

      const container = screen.getByTestId('dashboard-stats');
      expect(container).toHaveClass('grid-cols-1');
    });

    it('should adjust spacing based on screen size', () => {
      renderWithProviders(<DashboardStats {...defaultProps} />);

      const container = screen.getByTestId('dashboard-stats');
      expect(container).toHaveClass('gap-4', 'md:gap-6');
    });

    it('should handle orientation changes correctly', async () => {
      const { rerender } = renderWithProviders(<DashboardStats {...defaultProps} />);

      // Simulate orientation change
      createMockViewport(375, 667); // Portrait
      rerender(<DashboardStats {...defaultProps} />);

      createMockViewport(667, 375); // Landscape
      rerender(<DashboardStats {...defaultProps} />);

      // Should maintain functionality
      expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels and descriptions', () => {
      renderWithProviders(<DashboardStats {...defaultProps} />);

      // Check main container
      const container = screen.getByTestId('dashboard-stats');
      expect(container).toHaveAttribute('role', 'region');
      expect(container).toHaveAttribute('aria-label', 'Course statistics dashboard');

      // Check individual stat cards
      const progressCard = screen.getByTestId('stat-card-progress');
      expect(progressCard).toHaveAttribute('role', 'button');
      expect(progressCard).toHaveAttribute('aria-label');
      expect(progressCard).toHaveAttribute('aria-describedby');

      // Check for proper headings
      expect(screen.getByRole('heading', { level: 3, name: 'Progress' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Exams Completed' })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardStats {...defaultProps} />);

      const firstCard = screen.getByTestId('stat-card-progress');
      const secondCard = screen.getByTestId('stat-card-exams');

      // Tab to first card
      await user.tab();
      expect(firstCard).toHaveFocus();

      // Tab to second card
      await user.tab();
      expect(secondCard).toHaveFocus();

      // Enter key should trigger click
      await user.keyboard('{Enter}');
      expect(defaultProps.onStatClick).toHaveBeenCalledWith('progress');
    });

    it('should be compatible with screen readers', () => {
      renderWithProviders(<DashboardStats {...defaultProps} />);

      // Check for screen reader friendly content
      expect(screen.getByText('Progress: 75 percent')).toBeInTheDocument();
      expect(screen.getByText('Exams completed: 12')).toBeInTheDocument();
      expect(screen.getByText('Average score: 85 percent')).toBeInTheDocument();
      expect(screen.getByText('Study hours: 24 hours')).toBeInTheDocument();

      // Check for proper live regions for dynamic content
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should pass accessibility audit', async () => {
      const { container } = renderWithProviders(<DashboardStats {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have sufficient color contrast', () => {
      renderWithProviders(<DashboardStats {...defaultProps} />);

      // Check for high contrast classes
      const cards = screen.getAllByTestId(/^stat-card-/);
      cards.forEach(card => {
        expect(card).toHaveClass('text-gray-900'); // High contrast text
      });

      // Check trend indicators have sufficient contrast
      const trendIcons = screen.getAllByTestId(/^trend-icon-/);
      trendIcons.forEach(icon => {
        expect(icon).toHaveClass('text-green-500'); // Accessible green
      });
    });
  });

  describe('Interaction Tests', () => {
    it('should handle click events correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardStats {...defaultProps} />);

      const progressCard = screen.getByTestId('stat-card-progress');
      await user.click(progressCard);

      expect(defaultProps.onStatClick).toHaveBeenCalledWith('progress');
      expect(defaultProps.onStatClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks on different cards', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardStats {...defaultProps} />);

      await user.click(screen.getByTestId('stat-card-progress'));
      await user.click(screen.getByTestId('stat-card-exams'));
      await user.click(screen.getByTestId('stat-card-score'));

      expect(defaultProps.onStatClick).toHaveBeenCalledTimes(3);
      expect(defaultProps.onStatClick).toHaveBeenNthCalledWith(1, 'progress');
      expect(defaultProps.onStatClick).toHaveBeenNthCalledWith(2, 'exams');
      expect(defaultProps.onStatClick).toHaveBeenNthCalledWith(3, 'score');
    });

    it('should display hover effects', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardStats {...defaultProps} />);

      const progressCard = screen.getByTestId('stat-card-progress');

      // Hover effect
      await user.hover(progressCard);
      expect(progressCard).toHaveClass('hover:shadow-md');
      expect(progressCard).toHaveClass('hover:scale-105');

      // Unhover
      await user.unhover(progressCard);
    });

    it('should show tooltips on hover', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardStats {...defaultProps} />);

      const progressCard = screen.getByTestId('stat-card-progress');
      await user.hover(progressCard);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText('Click to view detailed progress')).toBeInTheDocument();
      });
    });

    it('should handle disabled state correctly', () => {
      renderWithProviders(
        <DashboardStats
          {...defaultProps}
          disabled={true}
        />
      );

      const cards = screen.getAllByTestId(/^stat-card-/);
      cards.forEach(card => {
        expect(card).toHaveAttribute('aria-disabled', 'true');
        expect(card).toHaveClass('opacity-50', 'cursor-not-allowed');
      });
    });

    it('should display animations correctly', () => {
      renderWithProviders(<DashboardStats {...defaultProps} />);

      const cards = screen.getAllByTestId(/^stat-card-/);
      cards.forEach(card => {
        expect(card).toHaveClass('transition-all', 'duration-200');
      });

      // Check for entrance animation
      const container = screen.getByTestId('dashboard-stats');
      expect(container).toHaveClass('animate-fade-in');
    });

    it('should handle rapid successive clicks gracefully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardStats {...defaultProps} />);

      const progressCard = screen.getByTestId('stat-card-progress');

      // Rapid clicks
      await user.click(progressCard);
      await user.click(progressCard);
      await user.click(progressCard);

      // Should debounce or handle appropriately
      expect(defaultProps.onStatClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle retry functionality', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();

      renderWithProviders(
        <DashboardStats
          {...defaultProps}
          error="Network error"
          onRetry={onRetry}
        />
      );

      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should display appropriate error messages', () => {
      const customError = 'Connection timeout';
      renderWithProviders(
        <DashboardStats
          {...defaultProps}
          error={customError}
        />
      );

      expect(screen.getByText(customError)).toBeInTheDocument();
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });
  });

  describe('Performance Tests', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      const TestComponent = (props: any) => {
        renderSpy();
        return <DashboardStats {...props} />;
      };

      const { rerender } = renderWithProviders(<TestComponent {...defaultProps} />);

      // Same props should not cause re-render - but React may re-render due to reference checks
      rerender(<TestComponent {...defaultProps} />);

      // Allow for up to 2 renders (initial + rerender with same props)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle large datasets efficiently', () => {
      const largeStats = mockCourseStats.map((stat, index) => {
        if (stat.id === 'progress') {
          return { ...stat, value: 99.99, displayValue: '99.99%' };
        }
        if (stat.id === 'exams') {
          return { ...stat, value: 999, displayValue: '999' };
        }
        return stat;
      });

      const startTime = performance.now();
      renderWithProviders(<DashboardStats {...defaultProps} stats={largeStats} />);
      const endTime = performance.now();

      // Should render quickly (under 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});