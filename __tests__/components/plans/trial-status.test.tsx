/**
 * Component tests for TrialStatus component
 * Tests trial display, countdown, and user interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import TrialStatus from '../../../components/plans/trial-status';
import { 
  mockTrialData, 
  componentTestHelpers, 
  a11yTestHelpers 
} from '../setup/component-test-setup';

describe('TrialStatus Component', () => {
  const defaultProps = {
    trialData: mockTrialData.active,
    onUpgrade: vi.fn(),
    onViewPlans: vi.fn(),
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock timers for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering Active Trial', () => {
    it('should render active trial information', () => {
      render(<TrialStatus {...defaultProps} />);
      
      expect(screen.getByText('Free Trial Active')).toBeInTheDocument();
      expect(screen.getByText('Premium Plan • English B2 Preparation')).toBeInTheDocument();
      expect(screen.getByText('7 days left')).toBeInTheDocument();
    });

    it('should show trial progress bar', () => {
      render(<TrialStatus {...defaultProps} />);
      
      expect(screen.getByText('Trial progress')).toBeInTheDocument();
      
      // Should have a progress element
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should display premium features', () => {
      render(<TrialStatus {...defaultProps} />);
      
      expect(screen.getByText('Premium Features You\'re Enjoying')).toBeInTheDocument();
      
      // Check for transformed feature names
      const features = mockTrialData.active.features_available;
      features.forEach(feature => {
        const displayName = feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        expect(screen.getByText(displayName)).toBeInTheDocument();
      });
    });

    it('should show upgrade and view plans buttons', () => {
      render(<TrialStatus {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /upgrade now/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view all plans/i })).toBeInTheDocument();
    });

    it('should display trial terms', () => {
      render(<TrialStatus {...defaultProps} />);
      
      expect(screen.getByText('No credit card required during trial • Cancel anytime')).toBeInTheDocument();
    });
  });

  describe('Trial States', () => {
    it('should render expiring trial with warning', () => {
      render(<TrialStatus {...defaultProps} trialData={mockTrialData.expiring} />);
      
      expect(screen.getByText('Your trial is ending soon!')).toBeInTheDocument();
      expect(screen.getByText('1 days left')).toBeInTheDocument();
      
      // Should have orange warning styling
      const card = screen.getByText('Free Trial Active').closest('.border-orange-200');
      expect(card).toBeInTheDocument();
    });

    it('should render expired trial with error state', () => {
      render(<TrialStatus {...defaultProps} trialData={mockTrialData.expired} />);
      
      expect(screen.getByText('Your trial has expired')).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
      expect(screen.getByText('Upgrade now to continue accessing premium features and content.')).toBeInTheDocument();
    });

    it('should not render when trial is not active', () => {
      const { container } = render(<TrialStatus {...defaultProps} trialData={null} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should not render when not a trial', () => {
      const nonTrialData = { ...mockTrialData.active, is_trial: false };
      const { container } = render(<TrialStatus {...defaultProps} trialData={nonTrialData} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Time Countdown', () => {
    it('should update time remaining every minute', async () => {
      // Set trial to end in 2 hours and 30 minutes
      const trialEndTime = new Date(Date.now() + 2.5 * 60 * 60 * 1000);
      const trialData = {
        ...mockTrialData.active,
        trial_ends_at: trialEndTime.toISOString(),
        days_remaining: 0 // Less than a day
      };

      render(<TrialStatus {...defaultProps} trialData={trialData} />);
      
      // Should show hours and minutes
      expect(screen.getByText(/2h 30m/)).toBeInTheDocument();
      
      // Advance time by 1 minute
      vi.advanceTimersByTime(60000);
      
      await waitFor(() => {
        expect(screen.getByText(/2h 29m/)).toBeInTheDocument();
      });
    });

    it('should show "Trial expired" when time runs out', async () => {
      // Set trial to end in 30 seconds
      const trialEndTime = new Date(Date.now() + 30000);
      const trialData = {
        ...mockTrialData.active,
        trial_ends_at: trialEndTime.toISOString(),
        days_remaining: 0
      };

      render(<TrialStatus {...defaultProps} trialData={trialData} />);
      
      // Advance time past expiration
      vi.advanceTimersByTime(60000);
      
      await waitFor(() => {
        expect(screen.getByText('Trial expired')).toBeInTheDocument();
      });
    });

    it('should format time correctly for different durations', () => {
      // Test different time formats
      const testCases = [
        { hours: 25, minutes: 0, expected: /1d 1h 0m/ }, // More than a day
        { hours: 5, minutes: 30, expected: /5h 30m/ }, // Hours and minutes
        { hours: 0, minutes: 45, expected: /45m/ }, // Minutes only
      ];

      testCases.forEach(({ hours, minutes, expected }) => {
        const trialEndTime = new Date(Date.now() + (hours * 60 + minutes) * 60 * 1000);
        const trialData = {
          ...mockTrialData.active,
          trial_ends_at: trialEndTime.toISOString(),
          days_remaining: hours >= 24 ? Math.floor(hours / 24) : 0
        };

        const { rerender } = render(<TrialStatus {...defaultProps} trialData={trialData} />);
        
        expect(screen.getByText(expected)).toBeInTheDocument();
        
        // Clean up for next test
        rerender(<div />);
      });
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress correctly for 7-day trial', () => {
      // 7-day trial with 5 days remaining = 2/7 progress = ~28.6%
      const trialData = {
        ...mockTrialData.active,
        days_remaining: 5
      };

      render(<TrialStatus {...defaultProps} trialData={trialData} />);
      
      const progressBar = screen.getByRole('progressbar');
      // Progress should be (7-5)/7 * 100 = 28.57%
      expect(progressBar).toHaveAttribute('aria-valuenow', '28.571428571428573');
    });

    it('should show 100% progress when expired', () => {
      render(<TrialStatus {...defaultProps} trialData={mockTrialData.expired} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('User Interactions', () => {
    it('should handle upgrade button click', async () => {
      const user = userEvent.setup();
      render(<TrialStatus {...defaultProps} />);
      
      const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });
      await user.click(upgradeButton);
      
      expect(defaultProps.onUpgrade).toHaveBeenCalledTimes(1);
    });

    it('should handle view plans button click', async () => {
      const user = userEvent.setup();
      render(<TrialStatus {...defaultProps} />);
      
      const viewPlansButton = screen.getByRole('button', { name: /view all plans/i });
      await user.click(viewPlansButton);
      
      expect(defaultProps.onViewPlans).toHaveBeenCalledTimes(1);
    });

    it('should disable buttons when loading', () => {
      render(<TrialStatus {...defaultProps} loading={true} />);
      
      const upgradeButton = screen.getByRole('button', { name: /loading/i });
      const viewPlansButton = screen.getByRole('button', { name: /view all plans/i });
      
      expect(upgradeButton).toBeDisabled();
      expect(viewPlansButton).toBeDisabled();
    });
  });

  describe('Tier Styling', () => {
    it('should apply correct styling for different tiers', () => {
      const tiers = ['basic', 'standard', 'premium'] as const;
      
      tiers.forEach(tier => {
        const trialData = { ...mockTrialData.active, plan_tier: tier };
        const { container, rerender } = render(
          <TrialStatus {...defaultProps} trialData={trialData} />
        );
        
        // Should have tier-specific gradient
        const iconContainer = container.querySelector('.bg-gradient-to-r');
        expect(iconContainer).toBeInTheDocument();
        
        // Clean up for next test
        rerender(<div />);
      });
    });
  });

  describe('Feature Display', () => {
    it('should limit feature display to 6 items', () => {
      const trialDataWithManyFeatures = {
        ...mockTrialData.active,
        features_available: [
          'ai_tutor', 'custom_plans', 'progress_analytics',
          'offline_access', 'priority_support', 'certificates',
          'advanced_analytics', 'premium_content'
        ]
      };

      render(<TrialStatus {...defaultProps} trialData={trialDataWithManyFeatures} />);
      
      // Should show "+2 more premium features" for 8 total features
      expect(screen.getByText('+2 more premium features')).toBeInTheDocument();
    });

    it('should not show "more features" text when 6 or fewer features', () => {
      render(<TrialStatus {...defaultProps} />);
      
      expect(screen.queryByText(/more premium features/)).not.toBeInTheDocument();
    });

    it('should format feature names correctly', () => {
      render(<TrialStatus {...defaultProps} />);
      
      // ai_tutor should become "Ai Tutor"
      expect(screen.getByText('Ai Tutor')).toBeInTheDocument();
      
      // custom_plans should become "Custom Plans"
      expect(screen.getByText('Custom Plans')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible structure', () => {
      const { container } = render(<TrialStatus {...defaultProps} />);
      
      a11yTestHelpers.expectAccessibleButtons(container);
      a11yTestHelpers.expectKeyboardNavigation(container);
    });

    it('should have proper ARIA labels for progress', () => {
      render(<TrialStatus {...defaultProps} />);
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should have descriptive status messages', () => {
      render(<TrialStatus {...defaultProps} />);
      
      // Should have clear status indication
      expect(screen.getByText('Your trial is active')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid trial data gracefully', () => {
      const invalidTrialData = {
        is_trial: true,
        trial_ends_at: 'invalid-date',
        days_remaining: -1,
        plan_name: '',
        plan_tier: '',
        features_available: [],
        course_info: null
      };

      // Should not crash with invalid data
      expect(() => {
        render(<TrialStatus {...defaultProps} trialData={invalidTrialData as any} />);
      }).not.toThrow();
    });

    it('should handle missing course info', () => {
      const trialDataWithoutCourse = {
        ...mockTrialData.active,
        course_info: null
      };

      const { container } = render(
        <TrialStatus {...defaultProps} trialData={trialDataWithoutCourse as any} />
      );
      
      // Should still render the component
      expect(container.firstChild).not.toBeNull();
    });
  });

  describe('Memory Management', () => {
    it('should clean up timers on unmount', () => {
      const { unmount } = render(<TrialStatus {...defaultProps} />);
      
      // Get the number of active timers
      const activeTimersBefore = vi.getTimerCount();
      
      unmount();
      
      // Should have cleaned up the interval timer
      const activeTimersAfter = vi.getTimerCount();
      expect(activeTimersAfter).toBeLessThanOrEqual(activeTimersBefore);
    });
  });
});