/**
 * Component tests for PlanFormModal component
 * Tests plan creation/editing form functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import PlanFormModal from '../../../../components/admin/plans/plan-form-modal';
import { 
  mockPlanData, 
  componentTestHelpers, 
  a11yTestHelpers,
  userInteractionHelpers 
} from '../../setup/component-test-setup';

describe('PlanFormModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    initialData: undefined,
    isEditing: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering New Plan Form', () => {
    it('should render create form when not editing', () => {
      render(<PlanFormModal {...defaultProps} />);
      
      expect(screen.getByText('Create New Plan')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create plan/i })).toBeInTheDocument();
    });

    it('should render all form tabs', () => {
      render(<PlanFormModal {...defaultProps} />);
      
      expect(screen.getByRole('tab', { name: /basic info/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /pricing/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /features/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /settings/i })).toBeInTheDocument();
    });

    it('should show default form values', () => {
      render(<PlanFormModal {...defaultProps} />);
      
      // Check default values
      expect(screen.getByDisplayValue('EUR')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // Display order
      
      // Check default switches
      const activeSwitch = screen.getByLabelText(/active plan/i);
      expect(activeSwitch).toBeChecked();
      
      const trialSwitch = screen.getByLabelText(/enable trial/i);
      expect(trialSwitch).toBeChecked();
    });
  });

  describe('Rendering Edit Form', () => {
    const editProps = {
      ...defaultProps,
      isEditing: true,
      initialData: mockPlanData.basic
    };

    it('should render edit form with initial data', () => {
      render(<PlanFormModal {...editProps} />);
      
      expect(screen.getByText('Edit Plan')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update plan/i })).toBeInTheDocument();
      
      // Should populate with existing data
      expect(screen.getByDisplayValue('Basic Plan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Perfect for beginners')).toBeInTheDocument();
    });

    it('should populate all form fields with initial data', () => {
      render(<PlanFormModal {...editProps} />);
      
      // Basic info
      expect(screen.getByDisplayValue('Basic Plan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('basic')).toBeInTheDocument();
      
      // Pricing (navigate to pricing tab first)
      fireEvent.click(screen.getByRole('tab', { name: /pricing/i }));
      expect(screen.getByDisplayValue('1999')).toBeInTheDocument();
      expect(screen.getByDisplayValue('19999')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable save button when required fields are empty', () => {
      render(<PlanFormModal {...defaultProps} />);
      
      const saveButton = screen.getByRole('button', { name: /create plan/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when required fields are filled', async () => {
      const user = userEvent.setup();
      render(<PlanFormModal {...defaultProps} />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/plan name/i), 'Test Plan');
      
      const saveButton = screen.getByRole('button', { name: /create plan/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should validate plan name is required', async () => {
      const user = userEvent.setup();
      render(<PlanFormModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/plan name/i);
      await user.type(nameInput, 'Test');
      await user.clear(nameInput);
      
      const saveButton = screen.getByRole('button', { name: /create plan/i });
      expect(saveButton).toBeDisabled();
    });
  });

  describe('Basic Info Tab', () => {
    it('should handle plan name input', async () => {
      const user = userEvent.setup();
      render(<PlanFormModal {...defaultProps} />);
      
      const nameInput = screen.getByLabelText(/plan name/i);
      await user.type(nameInput, 'Professional Plan');
      
      expect(nameInput).toHaveValue('Professional Plan');
    });

    it('should handle tier selection', async () => {
      const user = userEvent.setup();
      render(<PlanFormModal {...defaultProps} />);
      
      const tierSelect = screen.getByRole('combobox', { name: /tier/i });
      await user.click(tierSelect);
      
      const premiumOption = screen.getByRole('option', { name: /premium/i });
      await user.click(premiumOption);
      
      expect(tierSelect).toHaveValue('premium');
    });

    it('should handle description input', async () => {
      const user = userEvent.setup();
      render(<PlanFormModal {...defaultProps} />);
      
      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'A comprehensive plan for professionals');
      
      expect(descriptionInput).toHaveValue('A comprehensive plan for professionals');
    });

    it('should handle display order input', async () => {
      const user = userEvent.setup();
      render(<PlanFormModal {...defaultProps} />);
      
      const displayOrderInput = screen.getByLabelText(/display order/i);
      await user.clear(displayOrderInput);
      await user.type(displayOrderInput, '5');
      
      expect(displayOrderInput).toHaveValue(5);
    });
  });

  describe('Pricing Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<PlanFormModal {...defaultProps} />);
      
      // Navigate to pricing tab
      await user.click(screen.getByRole('tab', { name: /pricing/i }));
    });

    it('should handle monthly price input', async () => {
      const user = userEvent.setup();
      
      const monthlyPriceInput = screen.getByLabelText(/monthly price/i);
      await user.clear(monthlyPriceInput);
      await user.type(monthlyPriceInput, '2999');
      
      expect(monthlyPriceInput).toHaveValue(2999);
      
      // Should show formatted display
      expect(screen.getByText('€29.99')).toBeInTheDocument();
    });

    it('should handle yearly price input and show discount', async () => {
      const user = userEvent.setup();
      
      // Set monthly price first
      const monthlyPriceInput = screen.getByLabelText(/monthly price/i);
      await user.clear(monthlyPriceInput);
      await user.type(monthlyPriceInput, '2999');
      
      // Set yearly price
      const yearlyPriceInput = screen.getByLabelText(/yearly price/i);
      await user.type(yearlyPriceInput, '29999');
      
      expect(yearlyPriceInput).toHaveValue(29999);
      
      // Should show discount badge
      await waitFor(() => {
        expect(screen.getByText(/17% off/)).toBeInTheDocument();
      });
    });

    it('should handle currency selection', async () => {
      const user = userEvent.setup();
      
      const currencySelect = screen.getByRole('combobox', { name: /currency/i });
      await user.click(currencySelect);
      
      const usdOption = screen.getByRole('option', { name: /USD/i });
      await user.click(usdOption);
      
      expect(currencySelect).toHaveValue('USD');
    });

    it('should handle usage limits', async () => {
      const user = userEvent.setup();
      
      const maxCoursesInput = screen.getByLabelText(/max courses/i);
      await user.type(maxCoursesInput, '5');
      
      expect(maxCoursesInput).toHaveValue(5);
    });
  });

  describe('Features Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<PlanFormModal {...defaultProps} />);
      
      // Navigate to features tab
      await user.click(screen.getByRole('tab', { name: /features/i }));
    });

    it('should toggle default features', async () => {
      const user = userEvent.setup();
      
      const aiTutorSwitch = screen.getByRole('switch', { name: /ai tutoring sessions/i });
      
      // Should be off by default
      expect(aiTutorSwitch).not.toBeChecked();
      
      await user.click(aiTutorSwitch);
      expect(aiTutorSwitch).toBeChecked();
    });

    it('should add custom features', async () => {
      const user = userEvent.setup();
      
      const featureNameInput = screen.getByPlaceholderText(/feature name/i);
      const featureDescInput = screen.getByPlaceholderText(/feature description/i);
      const addButton = screen.getByRole('button', { name: /add feature/i });
      
      await user.type(featureNameInput, 'Premium Support');
      await user.type(featureDescInput, '24/7 premium customer support');
      await user.click(addButton);
      
      // Should add the feature to the list
      expect(screen.getByText('Premium Support')).toBeInTheDocument();
      expect(screen.getByText('24/7 premium customer support')).toBeInTheDocument();
      
      // Should clear the input fields
      expect(featureNameInput).toHaveValue('');
      expect(featureDescInput).toHaveValue('');
    });

    it('should remove custom features', async () => {
      const user = userEvent.setup();
      
      // First add a custom feature
      const featureNameInput = screen.getByPlaceholderText(/feature name/i);
      const addButton = screen.getByRole('button', { name: /add feature/i });
      
      await user.type(featureNameInput, 'Custom Feature');
      await user.click(addButton);
      
      // Then remove it
      const removeButton = screen.getByRole('button', { name: /remove/i });
      await user.click(removeButton);
      
      expect(screen.queryByText('Custom Feature')).not.toBeInTheDocument();
    });

    it('should not allow removing default features', () => {
      // Default features should not have remove buttons
      const defaultFeatureItems = screen.getAllByText(/AI Tutoring Sessions|Custom Study Plans|Progress Analytics/);
      
      defaultFeatureItems.forEach(item => {
        const container = item.closest('[data-feature]');
        expect(container?.querySelector('button[aria-label*="remove"]')).not.toBeInTheDocument();
      });
    });
  });

  describe('Settings Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<PlanFormModal {...defaultProps} />);
      
      // Navigate to settings tab
      await user.click(screen.getByRole('tab', { name: /settings/i }));
    });

    it('should toggle plan active status', async () => {
      const user = userEvent.setup();
      
      const activeSwitch = screen.getByRole('switch', { name: /active plan/i });
      expect(activeSwitch).toBeChecked(); // Default is active
      
      await user.click(activeSwitch);
      expect(activeSwitch).not.toBeChecked();
    });

    it('should toggle featured status', async () => {
      const user = userEvent.setup();
      
      const featuredSwitch = screen.getByRole('switch', { name: /featured plan/i });
      expect(featuredSwitch).not.toBeChecked(); // Default is not featured
      
      await user.click(featuredSwitch);
      expect(featuredSwitch).toBeChecked();
    });

    it('should toggle trial settings', async () => {
      const user = userEvent.setup();
      
      const trialSwitch = screen.getByRole('switch', { name: /enable trial/i });
      expect(trialSwitch).toBeChecked(); // Default is enabled
      
      await user.click(trialSwitch);
      expect(trialSwitch).not.toBeChecked();
      
      // Trial duration input should be hidden when disabled
      expect(screen.queryByLabelText(/trial duration/i)).not.toBeInTheDocument();
    });

    it('should show trial duration when trial enabled', async () => {
      const user = userEvent.setup();
      
      const trialDurationInput = screen.getByLabelText(/trial duration/i);
      expect(trialDurationInput).toHaveValue(7); // Default
      
      await user.clear(trialDurationInput);
      await user.type(trialDurationInput, '14');
      
      expect(trialDurationInput).toHaveValue(14);
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with form data when submitted', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn().mockResolvedValue(undefined);
      
      render(<PlanFormModal {...defaultProps} onSave={mockOnSave} />);
      
      // Fill required fields
      await user.type(screen.getByLabelText(/plan name/i), 'Test Plan');
      await user.type(screen.getByLabelText(/description/i), 'Test description');
      
      // Submit form
      const saveButton = screen.getByRole('button', { name: /create plan/i });
      await user.click(saveButton);
      
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Plan',
          description: 'Test description',
          tier: 'basic'
        })
      );
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<PlanFormModal {...defaultProps} onSave={mockOnSave} />);
      
      // Fill required fields and submit
      await user.type(screen.getByLabelText(/plan name/i), 'Test Plan');
      const saveButton = screen.getByRole('button', { name: /create plan/i });
      await user.click(saveButton);
      
      // Should show loading state
      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const mockOnSave = vi.fn().mockRejectedValue(new Error('Save failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<PlanFormModal {...defaultProps} onSave={mockOnSave} />);
      
      // Fill required fields and submit
      await user.type(screen.getByLabelText(/plan name/i), 'Test Plan');
      const saveButton = screen.getByRole('button', { name: /create plan/i });
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error saving plan:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      
      render(<PlanFormModal {...defaultProps} />);
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('should not render when isOpen is false', () => {
      const { container } = render(<PlanFormModal {...defaultProps} isOpen={false} />);
      
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form structure', () => {
      const { container } = render(<PlanFormModal {...defaultProps} />);
      
      a11yTestHelpers.expectAccessibleForm(container);
      a11yTestHelpers.expectAccessibleButtons(container);
      a11yTestHelpers.expectKeyboardNavigation(container);
    });

    it('should have proper ARIA labels', () => {
      render(<PlanFormModal {...defaultProps} />);
      
      // Check dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      
      // Check form inputs have labels
      expect(screen.getByLabelText(/plan name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tier/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    it('should support keyboard navigation between tabs', async () => {
      const user = userEvent.setup();
      render(<PlanFormModal {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      
      // Should be able to navigate between tabs
      tabs.forEach(tab => {
        expect(tab).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Data Persistence', () => {
    it('should maintain form data when switching tabs', async () => {
      const user = userEvent.setup();
      render(<PlanFormModal {...defaultProps} />);
      
      // Enter data in basic info
      await user.type(screen.getByLabelText(/plan name/i), 'Test Plan');
      
      // Switch to pricing tab and back
      await user.click(screen.getByRole('tab', { name: /pricing/i }));
      await user.click(screen.getByRole('tab', { name: /basic info/i }));
      
      // Data should be preserved
      expect(screen.getByDisplayValue('Test Plan')).toBeInTheDocument();
    });
  });
});