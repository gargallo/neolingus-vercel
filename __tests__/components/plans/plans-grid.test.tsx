/**
 * Component tests for PlansGrid component
 * Tests plan display, selection, and user interactions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import PlansGrid from '../../../components/plans/plans-grid';
import { 
  mockPlanData, 
  componentTestHelpers, 
  a11yTestHelpers 
} from '../setup/component-test-setup';

const mockPlans = [mockPlanData.basic, mockPlanData.premium];

describe('PlansGrid Component', () => {
  const defaultProps = {
    plans: mockPlans,
    billingCycle: 'monthly' as const,
    onBillingCycleChange: vi.fn(),
    onSelectPlan: vi.fn(),
    currentUserPlan: undefined,
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all provided plans', () => {
      render(<PlansGrid {...defaultProps} />);
      
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      expect(screen.getByText('Perfect for beginners')).toBeInTheDocument();
      expect(screen.getByText('Complete learning experience')).toBeInTheDocument();
    });

    it('should display pricing correctly', () => {
      render(<PlansGrid {...defaultProps} />);
      
      // Check basic plan pricing (1999 cents = €19.99)
      expect(screen.getByText('€20')).toBeInTheDocument(); // Formatted without decimals
      
      // Check premium plan pricing (4999 cents = €49.99) 
      expect(screen.getByText('€50')).toBeInTheDocument(); // Formatted without decimals
    });

    it('should show billing cycle toggle', () => {
      render(<PlansGrid {...defaultProps} />);
      
      expect(screen.getByRole('tab', { name: /monthly/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /yearly/i })).toBeInTheDocument();
    });

    it('should highlight featured plans', () => {
      render(<PlansGrid {...defaultProps} />);
      
      // Premium plan is featured
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
    });

    it('should display trial information', () => {
      render(<PlansGrid {...defaultProps} />);
      
      expect(screen.getByText('Start 7-Day Free Trial')).toBeInTheDocument();
      expect(screen.getByText('Start 14-Day Free Trial')).toBeInTheDocument();
    });

    it('should show tier badges', () => {
      render(<PlansGrid {...defaultProps} />);
      
      const basicBadge = screen.getByText('basic');
      const premiumBadge = screen.getByText('premium');
      
      expect(basicBadge).toBeInTheDocument();
      expect(premiumBadge).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle billing cycle change', async () => {
      const user = userEvent.setup();
      render(<PlansGrid {...defaultProps} />);
      
      const yearlyTab = screen.getByRole('tab', { name: /yearly/i });
      await user.click(yearlyTab);
      
      expect(defaultProps.onBillingCycleChange).toHaveBeenCalledWith('yearly');
    });

    it('should handle plan selection', async () => {
      const user = userEvent.setup();
      render(<PlansGrid {...defaultProps} />);
      
      const choosePlanButton = screen.getAllByText('Choose Plan')[0];
      await user.click(choosePlanButton);
      
      expect(defaultProps.onSelectPlan).toHaveBeenCalledWith('plan-basic');
    });

    it('should handle trial selection', async () => {
      const user = userEvent.setup();
      render(<PlansGrid {...defaultProps} />);
      
      const trialButton = screen.getByText('Start 7-Day Free Trial');
      await user.click(trialButton);
      
      expect(defaultProps.onSelectPlan).toHaveBeenCalledWith('plan-basic', true);
    });

    it('should disable buttons when loading', () => {
      render(<PlansGrid {...defaultProps} loading={true} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        if (button.textContent?.includes('Loading')) {
          expect(button).toBeDisabled();
        }
      });
    });
  });

  describe('Billing Cycle Display', () => {
    it('should show monthly pricing by default', () => {
      render(<PlansGrid {...defaultProps} />);
      
      expect(screen.getByText('/month')).toBeInTheDocument();
    });

    it('should show yearly pricing when yearly selected', () => {
      render(<PlansGrid {...defaultProps} billingCycle="yearly" />);
      
      expect(screen.getByText('/year')).toBeInTheDocument();
    });

    it('should show savings badge for yearly billing', () => {
      render(<PlansGrid {...defaultProps} billingCycle="yearly" />);
      
      // Should show savings for plans that have yearly pricing
      expect(screen.getByText('Save up to 20%')).toBeInTheDocument();
    });

    it('should calculate monthly equivalent for yearly plans', () => {
      render(<PlansGrid {...defaultProps} billingCycle="yearly" />);
      
      // Should show monthly equivalent price for yearly billing
      const monthlyEquivalents = screen.getAllByText(/month/);
      expect(monthlyEquivalents.length).toBeGreaterThan(0);
    });
  });

  describe('Current User Plan', () => {
    it('should show current plan state', () => {
      render(<PlansGrid {...defaultProps} currentUserPlan="plan-basic" />);
      
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
    });

    it('should disable current plan selection', () => {
      render(<PlansGrid {...defaultProps} currentUserPlan="plan-basic" />);
      
      const currentPlanButton = screen.getByText('Current Plan');
      expect(currentPlanButton).toBeDisabled();
    });

    it('should allow selection of other plans', () => {
      render(<PlansGrid {...defaultProps} currentUserPlan="plan-basic" />);
      
      // Premium plan should still be selectable
      const premiumPlanButton = screen.getAllByText('Choose Plan').find(
        button => button.closest('[data-plan-id="plan-premium"]')
      );
      expect(premiumPlanButton).not.toBeDisabled();
    });
  });

  describe('Features Display', () => {
    it('should show plan features', () => {
      render(<PlansGrid {...defaultProps} />);
      
      // Check for feature items (converted from snake_case)
      expect(screen.getByText('Ai Tutor')).toBeInTheDocument();
      expect(screen.getByText('Progress Analytics')).toBeInTheDocument();
    });

    it('should show feature count for plans with many features', () => {
      // Create a plan with many features to test the "+X more features" display
      const planWithManyFeatures = {
        ...mockPlanData.premium,
        features: {
          ai_tutor: true,
          custom_plans: true,
          progress_analytics: true,
          offline_access: true,
          priority_support: true,
          certificates: true,
          advanced_analytics: true,
          premium_content: true
        }
      };

      render(<PlansGrid {...defaultProps} plans={[planWithManyFeatures]} />);
      
      // Should show "+X more features" for plans with >6 features
      expect(screen.getByText(/\+\d+ more features/)).toBeInTheDocument();
    });
  });

  describe('Trust Indicators', () => {
    it('should display trust indicators', () => {
      render(<PlansGrid {...defaultProps} />);
      
      expect(screen.getByText('Cancel anytime')).toBeInTheDocument();
      expect(screen.getByText('14-day money-back guarantee')).toBeInTheDocument();
      expect(screen.getByText('Secure payment')).toBeInTheDocument();
    });

    it('should show pricing disclaimer', () => {
      render(<PlansGrid {...defaultProps} />);
      
      expect(screen.getByText(/Prices are in EUR/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty plans array', () => {
      render(<PlansGrid {...defaultProps} plans={[]} />);
      
      // Should render without crashing
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    it('should handle plans without yearly pricing', () => {
      const plansWithoutYearly = mockPlans.map(plan => ({
        ...plan,
        pricing: {
          ...plan.pricing,
          yearly_price: undefined
        }
      }));

      render(<PlansGrid {...defaultProps} plans={plansWithoutYearly} />);
      
      // Should not show savings badge
      expect(screen.queryByText('Save up to 20%')).not.toBeInTheDocument();
    });

    it('should handle plans without trial', () => {
      const plansWithoutTrial = mockPlans.map(plan => ({
        ...plan,
        trial_enabled: false
      }));

      render(<PlansGrid {...defaultProps} plans={plansWithoutTrial} />);
      
      // Should not show trial buttons
      expect(screen.queryByText(/Free Trial/)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible structure', () => {
      const { container } = render(<PlansGrid {...defaultProps} />);
      
      a11yTestHelpers.expectAccessibleButtons(container);
      a11yTestHelpers.expectKeyboardNavigation(container);
    });

    it('should have proper ARIA labels', () => {
      render(<PlansGrid {...defaultProps} />);
      
      // Check for tab navigation
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab')).toHaveLength(2);
    });

    it('should have descriptive button texts', () => {
      render(<PlansGrid {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.textContent?.trim()).toBeTruthy();
      });
    });
  });

  describe('Performance', () => {
    it('should handle large number of plans', () => {
      const manyPlans = Array.from({ length: 10 }, (_, i) => ({
        ...mockPlanData.basic,
        id: `plan-${i}`,
        name: `Plan ${i}`,
        display_order: i
      }));

      const { container } = render(<PlansGrid {...defaultProps} plans={manyPlans} />);
      
      // Should render without performance issues
      expect(container.querySelectorAll('[role="button"]')).toHaveLength(
        manyPlans.length * 2 + 2 // Each plan has 2 buttons + 2 tabs
      );
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes', () => {
      const { container } = render(<PlansGrid {...defaultProps} />);
      
      // Check for responsive grid classes
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
    });
  });
});