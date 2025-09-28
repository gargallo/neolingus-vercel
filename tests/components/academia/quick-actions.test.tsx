import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuickActions } from '../../../components/dashboard/quick-actions';
import { mockQuickActionsProps, mockUser, mockCourseProgress } from './mock-data';
import { createTestWrapper, mockSupabaseClient } from './test-utils';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
  useParams: () => ({
    idioma: 'english',
    nivel: 'b2',
  }),
}));

// Mock Supabase client
vi.mock('../../../utils/supabase/client', () => ({
  createSupabaseClient: () => mockSupabaseClient,
}));

describe('QuickActions Component', () => {
  const defaultProps = {
    primaryAction: {
      id: 'start-exam',
      label: 'Iniciar Examen',
      icon: 'Play',
      variant: 'primary' as const,
      onClick: vi.fn(),
      isLoading: false,
      disabled: false,
      tooltip: 'Comenzar un nuevo examen de práctica',
    },
    secondaryActions: [
      {
        id: 'view-progress',
        label: 'Ver Progreso',
        icon: 'TrendingUp',
        variant: 'secondary' as const,
        onClick: vi.fn(),
        isLoading: false,
        disabled: false,
        tooltip: 'Revisar tu progreso de aprendizaje',
      },
      {
        id: 'analytics',
        label: 'Análisis',
        icon: 'BarChart',
        variant: 'outline' as const,
        onClick: vi.fn(),
        isLoading: false,
        disabled: false,
        tooltip: 'Ver estadísticas detalladas',
      },
    ],
    isGlobalLoading: false,
    className: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Button Rendering Tests', () => {
    it('renders primary action button prominently', () => {
      render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      const primaryButton = screen.getByRole('button', { name: /iniciar examen/i });
      expect(primaryButton).toBeInTheDocument();
      expect(primaryButton).toHaveClass('btn-primary');
      expect(primaryButton).toHaveAttribute('data-testid', 'primary-action-start-exam');
    });

    it('displays secondary action buttons with proper styling', () => {
      render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      const progressButton = screen.getByRole('button', { name: /ver progreso/i });
      const analyticsButton = screen.getByRole('button', { name: /análisis/i });

      expect(progressButton).toBeInTheDocument();
      expect(progressButton).toHaveClass('btn-secondary');
      expect(progressButton).toHaveAttribute('data-testid', 'secondary-action-view-progress');

      expect(analyticsButton).toBeInTheDocument();
      expect(analyticsButton).toHaveClass('btn-outline');
      expect(analyticsButton).toHaveAttribute('data-testid', 'secondary-action-analytics');
    });

    it('shows icons, labels, and tooltips correctly', async () => {
      const user = userEvent.setup();
      render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      // Check icons are present
      expect(screen.getByTestId('icon-play')).toBeInTheDocument();
      expect(screen.getByTestId('icon-trending-up')).toBeInTheDocument();
      expect(screen.getByTestId('icon-bar-chart')).toBeInTheDocument();

      // Check labels are present
      expect(screen.getByText('Iniciar Examen')).toBeInTheDocument();
      expect(screen.getByText('Ver Progreso')).toBeInTheDocument();
      expect(screen.getByText('Análisis')).toBeInTheDocument();

      // Check tooltips appear on hover
      const primaryButton = screen.getByRole('button', { name: /iniciar examen/i });
      await user.hover(primaryButton);

      await waitFor(() => {
        expect(screen.getByText('Comenzar un nuevo examen de práctica')).toBeInTheDocument();
      });
    });

    it('handles different button variants correctly', () => {
      const propsWithVariants = {
        ...defaultProps,
        secondaryActions: [
          { ...defaultProps.secondaryActions[0], variant: 'primary' as const },
          { ...defaultProps.secondaryActions[1], variant: 'destructive' as const },
        ],
      };

      render(<QuickActions {...propsWithVariants} />, { wrapper: createTestWrapper() });

      const buttons = screen.getAllByRole('button');
      expect(buttons[1]).toHaveClass('btn-primary');
      expect(buttons[2]).toHaveClass('btn-destructive');
    });
  });

  describe('Interaction Tests', () => {
    it('calls click handlers with correct arguments', async () => {
      const user = userEvent.setup();
      const primaryOnClick = vi.fn();
      const secondaryOnClick = vi.fn();

      const props = {
        ...defaultProps,
        primaryAction: { ...defaultProps.primaryAction, onClick: primaryOnClick },
        secondaryActions: [
          { ...defaultProps.secondaryActions[0], onClick: secondaryOnClick },
        ],
      };

      render(<QuickActions {...props} />, { wrapper: createTestWrapper() });

      await user.click(screen.getByRole('button', { name: /iniciar examen/i }));
      await user.click(screen.getByRole('button', { name: /ver progreso/i }));

      expect(primaryOnClick).toHaveBeenCalledWith({
        actionId: 'start-exam',
        timestamp: expect.any(Number),
      });
      expect(secondaryOnClick).toHaveBeenCalledWith({
        actionId: 'view-progress',
        timestamp: expect.any(Number),
      });
    });

    it('shows loading states and disables interactions', () => {
      const props = {
        ...defaultProps,
        primaryAction: { ...defaultProps.primaryAction, isLoading: true },
        secondaryActions: [
          { ...defaultProps.secondaryActions[0], isLoading: true },
        ],
      };

      render(<QuickActions {...props} />, { wrapper: createTestWrapper() });

      const primaryButton = screen.getByRole('button', { name: /iniciar examen/i });
      const secondaryButton = screen.getByRole('button', { name: /ver progreso/i });

      expect(primaryButton).toBeDisabled();
      expect(secondaryButton).toBeDisabled();
      expect(screen.getByTestId('loading-spinner-start-exam')).toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner-view-progress')).toBeInTheDocument();
    });

    it('handles disabled states and prevents clicks', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();

      const props = {
        ...defaultProps,
        primaryAction: { ...defaultProps.primaryAction, disabled: true, onClick },
      };

      render(<QuickActions {...props} />, { wrapper: createTestWrapper() });

      const primaryButton = screen.getByRole('button', { name: /iniciar examen/i });
      expect(primaryButton).toBeDisabled();
      expect(primaryButton).toHaveClass('btn-disabled');

      await user.click(primaryButton);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('supports keyboard navigation correctly', async () => {
      const user = userEvent.setup();
      const primaryOnClick = vi.fn();
      const secondaryOnClick = vi.fn();

      const props = {
        ...defaultProps,
        primaryAction: { ...defaultProps.primaryAction, onClick: primaryOnClick },
        secondaryActions: [
          { ...defaultProps.secondaryActions[0], onClick: secondaryOnClick },
        ],
      };

      render(<QuickActions {...props} />, { wrapper: createTestWrapper() });

      // Tab to primary button and activate with Enter
      await user.tab();
      expect(screen.getByRole('button', { name: /iniciar examen/i })).toHaveFocus();
      await user.keyboard('{Enter}');
      expect(primaryOnClick).toHaveBeenCalled();

      // Tab to secondary button and activate with Space
      await user.tab();
      expect(screen.getByRole('button', { name: /ver progreso/i })).toHaveFocus();
      await user.keyboard(' ');
      expect(secondaryOnClick).toHaveBeenCalled();
    });
  });

  describe('Layout Tests', () => {
    it('displays primary button prominently', () => {
      render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      const container = screen.getByTestId('quick-actions-container');
      const primaryButton = screen.getByTestId('primary-action-start-exam');

      expect(container).toHaveClass('quick-actions-layout');
      expect(primaryButton.parentElement).toHaveClass('primary-action-wrapper');
    });

    it('properly groups secondary buttons', () => {
      render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      const secondaryGroup = screen.getByTestId('secondary-actions-group');
      expect(secondaryGroup).toBeInTheDocument();
      expect(secondaryGroup).toHaveClass('secondary-actions-grid');

      const secondaryButtons = screen.getAllByTestId(/secondary-action-/);
      expect(secondaryButtons).toHaveLength(2);
    });

    it('applies responsive layout adjustments for mobile', () => {
      // Mock window.matchMedia for mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      const container = screen.getByTestId('quick-actions-container');
      expect(container).toHaveClass('mobile-layout');

      const secondaryGroup = screen.getByTestId('secondary-actions-group');
      expect(secondaryGroup).toHaveClass('mobile-grid');
    });

    it('maintains proper spacing and alignment', () => {
      render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      const container = screen.getByTestId('quick-actions-container');
      expect(container).toHaveClass('gap-4', 'p-6');

      const primaryWrapper = screen.getByTestId('primary-action-start-exam').parentElement;
      expect(primaryWrapper).toHaveClass('mb-4');

      const secondaryGroup = screen.getByTestId('secondary-actions-group');
      expect(secondaryGroup).toHaveClass('gap-3');
    });
  });

  describe('Accessibility Tests', () => {
    it('provides proper ARIA labels and button roles', () => {
      render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      const primaryButton = screen.getByRole('button', { name: /iniciar examen/i });
      expect(primaryButton).toHaveAttribute('aria-label', 'Iniciar Examen');
      expect(primaryButton).toHaveAttribute('role', 'button');

      const secondaryButtons = screen.getAllByRole('button');
      secondaryButtons.slice(1).forEach(button => {
        expect(button).toHaveAttribute('role', 'button');
        expect(button).toHaveAttribute('aria-label');
      });
    });

    it('manages keyboard focus correctly', async () => {
      const user = userEvent.setup();
      render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      // Test tab order
      await user.tab();
      expect(screen.getByTestId('primary-action-start-exam')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('secondary-action-view-progress')).toHaveFocus();

      await user.tab();
      expect(screen.getByTestId('secondary-action-analytics')).toHaveFocus();
    });

    it('announces state changes to screen readers', async () => {
      const { rerender } = render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      const primaryButton = screen.getByTestId('primary-action-start-exam');
      expect(primaryButton).toHaveAttribute('aria-busy', 'false');

      // Simulate loading state
      const loadingProps = {
        ...defaultProps,
        primaryAction: { ...defaultProps.primaryAction, isLoading: true },
      };

      rerender(<QuickActions {...loadingProps} />);

      expect(primaryButton).toHaveAttribute('aria-busy', 'true');
      expect(primaryButton).toHaveAttribute('aria-describedby', 'loading-message-start-exam');
      expect(screen.getById('loading-message-start-exam')).toHaveTextContent('Cargando...');
    });

    it('supports high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      const container = screen.getByTestId('quick-actions-container');
      expect(container).toHaveClass('high-contrast');
    });
  });

  describe('State Management Tests', () => {
    it('manages loading state per individual action', () => {
      const props = {
        ...defaultProps,
        primaryAction: { ...defaultProps.primaryAction, isLoading: true },
        secondaryActions: [
          { ...defaultProps.secondaryActions[0], isLoading: false },
          { ...defaultProps.secondaryActions[1], isLoading: true },
        ],
      };

      render(<QuickActions {...props} />, { wrapper: createTestWrapper() });

      expect(screen.getByTestId('loading-spinner-start-exam')).toBeInTheDocument();
      expect(screen.queryByTestId('loading-spinner-view-progress')).not.toBeInTheDocument();
      expect(screen.getByTestId('loading-spinner-analytics')).toBeInTheDocument();
    });

    it('applies global disabled state to all actions', () => {
      const props = {
        ...defaultProps,
        isGlobalLoading: true,
      };

      render(<QuickActions {...props} />, { wrapper: createTestWrapper() });

      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(button => {
        expect(button).toBeDisabled();
        expect(button).toHaveClass('global-loading');
      });
    });

    it('displays and positions tooltips correctly', async () => {
      const user = userEvent.setup();
      render(<QuickActions {...defaultProps} />, { wrapper: createTestWrapper() });

      const primaryButton = screen.getByTestId('primary-action-start-exam');
      await user.hover(primaryButton);

      await waitFor(() => {
        const tooltip = screen.getByRole('tooltip');
        expect(tooltip).toBeInTheDocument();
        expect(tooltip).toHaveTextContent('Comenzar un nuevo examen de práctica');
        expect(tooltip).toHaveAttribute('data-position', 'top');
      });

      await user.unhover(primaryButton);

      await waitFor(() => {
        expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      });
    });

    it('handles icon and label combinations correctly', () => {
      const propsWithoutIcons = {
        ...defaultProps,
        primaryAction: { ...defaultProps.primaryAction, icon: undefined },
        secondaryActions: [
          { ...defaultProps.secondaryActions[0], icon: undefined },
        ],
      };

      render(<QuickActions {...propsWithoutIcons} />, { wrapper: createTestWrapper() });

      expect(screen.queryByTestId('icon-play')).not.toBeInTheDocument();
      expect(screen.queryByTestId('icon-trending-up')).not.toBeInTheDocument();
      expect(screen.getByText('Iniciar Examen')).toBeInTheDocument();
      expect(screen.getByText('Ver Progreso')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles no secondary actions provided', () => {
      const props = {
        ...defaultProps,
        secondaryActions: [],
      };

      render(<QuickActions {...props} />, { wrapper: createTestWrapper() });

      expect(screen.getByTestId('primary-action-start-exam')).toBeInTheDocument();
      expect(screen.queryByTestId('secondary-actions-group')).not.toBeInTheDocument();
    });

    it('handles actions with very long labels', () => {
      const longLabel = 'Esta es una etiqueta muy larga que debería truncarse correctamente en la interfaz de usuario';
      const props = {
        ...defaultProps,
        primaryAction: { ...defaultProps.primaryAction, label: longLabel },
      };

      render(<QuickActions {...props} />, { wrapper: createTestWrapper() });

      const primaryButton = screen.getByTestId('primary-action-start-exam');
      expect(primaryButton).toHaveClass('text-truncate');
      expect(primaryButton).toHaveAttribute('title', longLabel);
    });

    it('handles actions without icons gracefully', () => {
      const propsWithoutAllIcons = {
        ...defaultProps,
        primaryAction: { ...defaultProps.primaryAction, icon: undefined },
        secondaryActions: defaultProps.secondaryActions.map(action => ({
          ...action,
          icon: undefined,
        })),
      };

      render(<QuickActions {...propsWithoutAllIcons} />, { wrapper: createTestWrapper() });

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('icon-less');
        expect(button.querySelector('[data-testid^="icon-"]')).not.toBeInTheDocument();
      });
    });

    it('handles multiple actions in loading state simultaneously', () => {
      const props = {
        ...defaultProps,
        primaryAction: { ...defaultProps.primaryAction, isLoading: true },
        secondaryActions: defaultProps.secondaryActions.map(action => ({
          ...action,
          isLoading: true,
        })),
      };

      render(<QuickActions {...props} />, { wrapper: createTestWrapper() });

      const loadingSpinners = screen.getAllByTestId(/loading-spinner-/);
      expect(loadingSpinners).toHaveLength(3);

      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(button => {
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
      });
    });

    it('applies custom className correctly', () => {
      const props = {
        ...defaultProps,
        className: 'custom-quick-actions additional-class',
      };

      render(<QuickActions {...props} />, { wrapper: createTestWrapper() });

      const container = screen.getByTestId('quick-actions-container');
      expect(container).toHaveClass('custom-quick-actions', 'additional-class');
    });
  });

  describe('Course-Specific Action Configurations', () => {
    it('renders exam starting actions correctly', () => {
      const examProps = {
        primaryAction: {
          id: 'start-cambridge-exam',
          label: 'Iniciar Examen Cambridge',
          icon: 'BookOpen',
          variant: 'primary' as const,
          onClick: vi.fn(),
          tooltip: 'Comenzar examen de práctica Cambridge',
        },
        secondaryActions: [
          {
            id: 'exam-history',
            label: 'Historial de Exámenes',
            icon: 'History',
            variant: 'secondary' as const,
            onClick: vi.fn(),
            tooltip: 'Ver exámenes anteriores',
          },
        ],
      };

      render(<QuickActions {...examProps} />, { wrapper: createTestWrapper() });

      expect(screen.getByRole('button', { name: /iniciar examen cambridge/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /historial de exámenes/i })).toBeInTheDocument();
      expect(screen.getByTestId('icon-book-open')).toBeInTheDocument();
      expect(screen.getByTestId('icon-history')).toBeInTheDocument();
    });

    it('renders progress review actions correctly', () => {
      const progressProps = {
        primaryAction: {
          id: 'detailed-progress',
          label: 'Ver Progreso Detallado',
          icon: 'TrendingUp',
          variant: 'primary' as const,
          onClick: vi.fn(),
          tooltip: 'Análisis completo de tu progreso',
        },
        secondaryActions: [
          {
            id: 'export-progress',
            label: 'Exportar Datos',
            icon: 'Download',
            variant: 'outline' as const,
            onClick: vi.fn(),
            tooltip: 'Descargar reporte de progreso',
          },
          {
            id: 'share-progress',
            label: 'Compartir',
            icon: 'Share',
            variant: 'secondary' as const,
            onClick: vi.fn(),
            tooltip: 'Compartir tu progreso',
          },
        ],
      };

      render(<QuickActions {...progressProps} />, { wrapper: createTestWrapper() });

      expect(screen.getByRole('button', { name: /ver progreso detallado/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /exportar datos/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /compartir/i })).toBeInTheDocument();
    });

    it('renders analytics viewing actions correctly', () => {
      const analyticsProps = {
        primaryAction: {
          id: 'open-analytics',
          label: 'Abrir Panel de Análisis',
          icon: 'BarChart3',
          variant: 'primary' as const,
          onClick: vi.fn(),
          tooltip: 'Ver estadísticas detalladas de rendimiento',
        },
        secondaryActions: [
          {
            id: 'performance-trends',
            label: 'Tendencias',
            icon: 'TrendingUp',
            variant: 'secondary' as const,
            onClick: vi.fn(),
            tooltip: 'Ver tendencias de rendimiento',
          },
          {
            id: 'compare-scores',
            label: 'Comparar',
            icon: 'BarChart2',
            variant: 'outline' as const,
            onClick: vi.fn(),
            tooltip: 'Comparar con otros usuarios',
          },
        ],
      };

      render(<QuickActions {...analyticsProps} />, { wrapper: createTestWrapper() });

      expect(screen.getByRole('button', { name: /abrir panel de análisis/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /tendencias/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /comparar/i })).toBeInTheDocument();
      expect(screen.getByTestId('icon-bar-chart3')).toBeInTheDocument();
    });
  });
});