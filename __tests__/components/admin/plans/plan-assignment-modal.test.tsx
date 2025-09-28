/**
 * Component tests for PlanAssignmentModal component
 * Tests plan assignment form functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import PlanAssignmentModal from '../../../../components/admin/plans/plan-assignment-modal';
import { 
  mockPlanData, 
  mockUserData, 
  mockCourseData,
  componentTestHelpers, 
  a11yTestHelpers 
} from '../../setup/component-test-setup';

const mockUsers = [mockUserData.admin, mockUserData.regular];
const mockPlans = [mockPlanData.basic, mockPlanData.premium];

describe('PlanAssignmentModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onAssign: vi.fn(),
    users: mockUsers,
    plans: mockPlans,
    courses: mockCourseData,
    selectedUserId: undefined,
    loading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render assignment form when open', () => {
      render(<PlanAssignmentModal {...defaultProps} />);
      
      expect(screen.getByText('Assign Plan to User')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /assign plan/i })).toBeInTheDocument();
    });

    it('should render all form sections', () => {
      render(<PlanAssignmentModal {...defaultProps} />);
      
      expect(screen.getByText('Select User')).toBeInTheDocument();
      expect(screen.getByText('Select Plan')).toBeInTheDocument();
      expect(screen.getByText('Select Course')).toBeInTheDocument();
      expect(screen.getByText('Assignment Reason')).toBeInTheDocument();
      expect(screen.getByText('Billing Configuration')).toBeInTheDocument();
    });

    it('should pre-select user when selectedUserId provided', () => {
      render(<PlanAssignmentModal {...defaultProps} selectedUserId="user-1" />);
      
      // Should show the selected user card
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByText('Regular User')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      const { container } = render(<PlanAssignmentModal {...defaultProps} isOpen={false} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('User Selection', () => {
    it('should display all available users in dropdown', async () => {
      const user = userEvent.setup();
      render(<PlanAssignmentModal {...defaultProps} />);
      
      const userSelect = screen.getByRole('combobox', { name: /select user/i });
      await user.click(userSelect);
      
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    it('should show user details when selected', async () => {
      const user = userEvent.setup();
      render(<PlanAssignmentModal {...defaultProps} />);
      
      const userSelect = screen.getByRole('combobox', { name: /select user/i });
      await user.click(userSelect);
      
      const regularUser = screen.getByRole('option', { name: /user@example.com/ });
      await user.click(regularUser);
      
      // Should show user card with details
      expect(screen.getByText('user@example.com')).toBeInTheDocument();
      expect(screen.getByText('Regular User')).toBeInTheDocument();
    });
  });

  describe('Plan Selection', () => {
    it('should display all available plans with pricing', async () => {
      const user = userEvent.setup();
      render(<PlanAssignmentModal {...defaultProps} />);
      
      const planSelect = screen.getByRole('combobox', { name: /select plan/i });
      await user.click(planSelect);
      
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      expect(screen.getByText('€19.99/month')).toBeInTheDocument();
      expect(screen.getByText('€49.99/month')).toBeInTheDocument();
    });

    it('should show plan details when selected', async () => {
      const user = userEvent.setup();
      render(<PlanAssignmentModal {...defaultProps} />);
      
      const planSelect = screen.getByRole('combobox', { name: /select plan/i });
      await user.click(planSelect);
      
      const premiumPlan = screen.getByRole('option', { name: /Premium Plan/ });
      await user.click(premiumPlan);
      
      // Should show plan card with details
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      expect(screen.getByText('€49.99/month')).toBeInTheDocument();
      expect(screen.getByText('14d trial')).toBeInTheDocument(); // Trial badge
    });

    it('should auto-enable trial for plans with trial available', async () => {
      const user = userEvent.setup();
      render(<PlanAssignmentModal {...defaultProps} />);
      
      const planSelect = screen.getByRole('combobox', { name: /select plan/i });
      await user.click(planSelect);
      
      const basicPlan = screen.getByRole('option', { name: /Basic Plan/ });
      await user.click(basicPlan);
      
      // Should auto-enable trial toggle
      const trialSwitch = screen.getByRole('switch', { name: /start with trial/i });
      expect(trialSwitch).toBeChecked();
    });
  });

  describe('Course Selection', () => {
    it('should display all available courses', async () => {
      const user = userEvent.setup();
      render(<PlanAssignmentModal {...defaultProps} />);
      
      const courseSelect = screen.getByRole('combobox', { name: /select course/i });
      await user.click(courseSelect);
      
      expect(screen.getByText('English B2 Preparation')).toBeInTheDocument();
      expect(screen.getByText('English - B2')).toBeInTheDocument();
      expect(screen.getByText('Valenciano B2')).toBeInTheDocument();
      expect(screen.getByText('Valenciano - B2')).toBeInTheDocument();
    });

    it('should show course details when selected', async () => {
      const user = userEvent.setup();
      render(<PlanAssignmentModal {...defaultProps} />);
      
      const courseSelect = screen.getByRole('combobox', { name: /select course/i });
      await user.click(courseSelect);
      
      const englishCourse = screen.getByRole('option', { name: /English B2/ });
      await user.click(englishCourse);
      
      // Should show course card
      expect(screen.getByText('English B2 Preparation')).toBeInTheDocument();
      expect(screen.getByText('English - B2')).toBeInTheDocument();
    });
  });

  describe('Assignment Reason', () => {
    it('should handle assignment reason input', async () => {
      const user = userEvent.setup();
      render(<PlanAssignmentModal {...defaultProps} />);
      
      const reasonTextarea = screen.getByLabelText(/assignment reason/i);
      await user.type(reasonTextarea, 'User requested premium access for advanced features');
      
      expect(reasonTextarea).toHaveValue('User requested premium access for advanced features');
    });

    it('should require assignment reason for form submission', () => {
      render(<PlanAssignmentModal {...defaultProps} />);
      
      const assignButton = screen.getByRole('button', { name: /assign plan/i });
      expect(assignButton).toBeDisabled();
    });
  });

  describe('Billing Configuration', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<PlanAssignmentModal {...defaultProps} />);
      
      // Select a plan to enable billing options
      const planSelect = screen.getByRole('combobox', { name: /select plan/i });
      await user.click(planSelect);
      const basicPlan = screen.getByRole('option', { name: /Basic Plan/ });
      await user.click(basicPlan);
    });

    it('should show trial option for trial-enabled plans', () => {
      expect(screen.getByText('Start with Trial')).toBeInTheDocument();
      expect(screen.getByText('Begin with 7-day free trial')).toBeInTheDocument();
    });

    it('should toggle trial mode', async () => {
      const user = userEvent.setup();
      
      const trialSwitch = screen.getByRole('switch', { name: /start with trial/i });
      expect(trialSwitch).toBeChecked(); // Auto-enabled
      
      await user.click(trialSwitch);
      expect(trialSwitch).not.toBeChecked();
      
      // Should show billing cycle options when trial disabled
      expect(screen.getByText('Billing Cycle')).toBeInTheDocument();
    });

    it('should handle billing cycle selection', async () => {
      const user = userEvent.setup();
      
      // Disable trial first to show billing options
      const trialSwitch = screen.getByRole('switch', { name: /start with trial/i });
      await user.click(trialSwitch);
      
      const billingSelect = screen.getByRole('combobox', { name: /billing cycle/i });
      await user.click(billingSelect);
      
      const yearlyOption = screen.getByRole('option', { name: /yearly/i });
      await user.click(yearlyOption);
      
      expect(billingSelect).toHaveValue('yearly');
    });

    it('should toggle auto-renewal setting', async () => {
      const user = userEvent.setup();
      
      const autoRenewSwitch = screen.getByRole('switch', { name: /auto-renewal/i });
      expect(autoRenewSwitch).toBeChecked(); // Default enabled
      
      await user.click(autoRenewSwitch);
      expect(autoRenewSwitch).not.toBeChecked();
    });

    it('should show custom date pickers when enabled', async () => {
      const user = userEvent.setup();
      
      const customDatesSwitch = screen.getByRole('switch', { name: /custom period dates/i });
      await user.click(customDatesSwitch);
      
      expect(screen.getByText('Start Date')).toBeInTheDocument();
      expect(screen.getByText('End Date')).toBeInTheDocument();
      expect(screen.getAllByText('Pick a date')).toHaveLength(2);
    });
  });

  describe('Form Validation', () => {
    it('should require all required fields before enabling submit', async () => {
      const user = userEvent.setup();
      render(<PlanAssignmentModal {...defaultProps} />);
      
      const assignButton = screen.getByRole('button', { name: /assign plan/i });
      expect(assignButton).toBeDisabled();
      
      // Fill user
      const userSelect = screen.getByRole('combobox', { name: /select user/i });
      await user.click(userSelect);
      await user.click(screen.getByRole('option', { name: /user@example.com/ }));
      
      expect(assignButton).toBeDisabled(); // Still missing other fields
      
      // Fill plan
      const planSelect = screen.getByRole('combobox', { name: /select plan/i });
      await user.click(planSelect);
      await user.click(screen.getByRole('option', { name: /Basic Plan/ }));
      
      expect(assignButton).toBeDisabled(); // Still missing other fields
      
      // Fill course
      const courseSelect = screen.getByRole('combobox', { name: /select course/i });
      await user.click(courseSelect);
      await user.click(screen.getByRole('option', { name: /English B2/ }));
      
      expect(assignButton).toBeDisabled(); // Still missing reason
      
      // Fill reason
      const reasonTextarea = screen.getByLabelText(/assignment reason/i);
      await user.type(reasonTextarea, 'Test assignment');
      
      expect(assignButton).not.toBeDisabled(); // Now should be enabled
    });
  });

  describe('Form Submission', () => {
    it('should call onAssign with form data when submitted', async () => {
      const user = userEvent.setup();
      const mockOnAssign = vi.fn().mockResolvedValue(undefined);
      
      render(<PlanAssignmentModal {...defaultProps} onAssign={mockOnAssign} />);
      
      // Fill all required fields
      const userSelect = screen.getByRole('combobox', { name: /select user/i });
      await user.click(userSelect);
      await user.click(screen.getByRole('option', { name: /user@example.com/ }));
      
      const planSelect = screen.getByRole('combobox', { name: /select plan/i });
      await user.click(planSelect);
      await user.click(screen.getByRole('option', { name: /Basic Plan/ }));
      
      const courseSelect = screen.getByRole('combobox', { name: /select course/i });
      await user.click(courseSelect);
      await user.click(screen.getByRole('option', { name: /English B2/ }));
      
      const reasonTextarea = screen.getByLabelText(/assignment reason/i);
      await user.type(reasonTextarea, 'Test assignment reason');
      
      // Submit form
      const assignButton = screen.getByRole('button', { name: /assign plan/i });
      await user.click(assignButton);
      
      expect(mockOnAssign).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          plan_id: 'plan-basic',
          course_id: 'course-1',
          assignment_reason: 'Test assignment reason',
          billing_cycle: 'trial',
          start_trial: true,
          auto_renew: true
        })
      );
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const mockOnAssign = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<PlanAssignmentModal {...defaultProps} onAssign={mockOnAssign} />);
      
      // Fill required fields and submit
      await fillRequiredFields(user);
      
      const assignButton = screen.getByRole('button', { name: /assign plan/i });
      await user.click(assignButton);
      
      // Should show loading state
      expect(screen.getByText('Assigning...')).toBeInTheDocument();
      expect(assignButton).toBeDisabled();
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const mockOnAssign = vi.fn().mockRejectedValue(new Error('Assignment failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<PlanAssignmentModal {...defaultProps} onAssign={mockOnAssign} />);
      
      // Fill required fields and submit
      await fillRequiredFields(user);
      
      const assignButton = screen.getByRole('button', { name: /assign plan/i });
      await user.click(assignButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error assigning plan:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('should reset form after successful submission', async () => {
      const user = userEvent.setup();
      const mockOnAssign = vi.fn().mockResolvedValue(undefined);
      const mockOnClose = vi.fn();
      
      render(<PlanAssignmentModal {...defaultProps} onAssign={mockOnAssign} onClose={mockOnClose} />);
      
      // Fill and submit form
      await fillRequiredFields(user);
      
      const assignButton = screen.getByRole('button', { name: /assign plan/i });
      await user.click(assignButton);
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      
      render(<PlanAssignmentModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form structure', () => {
      const { container } = render(<PlanAssignmentModal {...defaultProps} />);
      
      a11yTestHelpers.expectAccessibleForm(container);
      a11yTestHelpers.expectAccessibleButtons(container);
      a11yTestHelpers.expectKeyboardNavigation(container);
    });

    it('should have proper ARIA labels', () => {
      render(<PlanAssignmentModal {...defaultProps} />);
      
      // Check dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Check form controls have labels
      expect(screen.getByLabelText(/assignment reason/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/auto-renewal/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large user lists efficiently', () => {
      const manyUsers = Array.from({ length: 100 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`,
        full_name: `User ${i}`
      }));

      const { container } = render(
        <PlanAssignmentModal {...defaultProps} users={manyUsers} />
      );
      
      // Should render without performance issues
      expect(container.querySelector('[role="combobox"]')).toBeInTheDocument();
    });
  });

  // Helper function for filling required fields
  async function fillRequiredFields(user: any) {
    const userSelect = screen.getByRole('combobox', { name: /select user/i });
    await user.click(userSelect);
    await user.click(screen.getByRole('option', { name: /user@example.com/ }));
    
    const planSelect = screen.getByRole('combobox', { name: /select plan/i });
    await user.click(planSelect);
    await user.click(screen.getByRole('option', { name: /Basic Plan/ }));
    
    const courseSelect = screen.getByRole('combobox', { name: /select course/i });
    await user.click(courseSelect);
    await user.click(screen.getByRole('option', { name: /English B2/ }));
    
    const reasonTextarea = screen.getByLabelText(/assignment reason/i);
    await user.type(reasonTextarea, 'Test assignment reason');
  }
});