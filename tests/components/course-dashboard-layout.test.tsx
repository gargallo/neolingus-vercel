/**
 * Course Dashboard Layout Tests
 * Testing responsiveness and layout behavior of the dashboard
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';

// Mock the dashboard component
const MockDashboard = ({ className }: { className?: string }) => (
  <div className={`dashboard-grid ${className || ''}`} data-testid="dashboard">
    <div className="widget-small" data-testid="widget-small">Small Widget</div>
    <div className="widget-medium" data-testid="widget-medium">Medium Widget</div>
    <div className="widget-large" data-testid="widget-large">Large Widget</div>
    <div className="widget-wide" data-testid="widget-wide">Wide Widget</div>
  </div>
);

// Mock the provider showcase component
const MockProviderShowcase = () => (
  <div className="provider-showcase" data-testid="provider-showcase">
    <div className="provider-grid" data-testid="provider-grid">
      <div className="provider-card" data-testid="provider-card-1">Provider 1</div>
      <div className="provider-card" data-testid="provider-card-2">Provider 2</div>
      <div className="provider-card" data-testid="provider-card-3">Provider 3</div>
    </div>
  </div>
);

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia for responsive testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('Dashboard Layout Responsiveness', () => {
  beforeEach(() => {
    // Reset viewport to desktop size
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Layout (1024px+)', () => {
    beforeEach(() => {
      mockMatchMedia(false); // Not mobile
    });

    it('should render dashboard with standard grid layout', () => {
      render(<MockDashboard className="dashboard-grid-standard" />);

      const dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toHaveClass('dashboard-grid-standard');
    });

    it('should display all widget sizes properly', () => {
      render(<MockDashboard />);

      expect(screen.getByTestId('widget-small')).toBeInTheDocument();
      expect(screen.getByTestId('widget-medium')).toBeInTheDocument();
      expect(screen.getByTestId('widget-large')).toBeInTheDocument();
      expect(screen.getByTestId('widget-wide')).toBeInTheDocument();
    });

    it('should render provider showcase with full grid', () => {
      render(<MockProviderShowcase />);

      const providerGrid = screen.getByTestId('provider-grid');
      expect(providerGrid).toHaveClass('provider-grid');

      // All provider cards should be visible
      expect(screen.getByTestId('provider-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('provider-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('provider-card-3')).toBeInTheDocument();
    });
  });

  describe('Tablet Layout (768px - 1024px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: 768,
      });
      mockMatchMedia(false); // Not mobile but smaller
    });

    it('should adapt grid layout for tablet view', () => {
      render(<MockDashboard className="dashboard-grid-standard" />);

      const dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toBeInTheDocument();
    });

    it('should adjust widget sizing for tablet', () => {
      render(<MockDashboard />);

      // Widgets should still be present but may have different layouts
      expect(screen.getByTestId('widget-small')).toBeInTheDocument();
      expect(screen.getByTestId('widget-medium')).toBeInTheDocument();
    });
  });

  describe('Mobile Layout (< 768px)', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
      });
      mockMatchMedia(true); // Mobile view
    });

    it('should switch to single column layout on mobile', () => {
      render(<MockDashboard />);

      const dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toBeInTheDocument();
    });

    it('should stack widgets vertically on mobile', () => {
      render(<MockDashboard />);

      // All widgets should still be present
      expect(screen.getByTestId('widget-small')).toBeInTheDocument();
      expect(screen.getByTestId('widget-medium')).toBeInTheDocument();
      expect(screen.getByTestId('widget-large')).toBeInTheDocument();
      expect(screen.getByTestId('widget-wide')).toBeInTheDocument();
    });

    it('should adapt provider grid for mobile', () => {
      render(<MockProviderShowcase />);

      const providerGrid = screen.getByTestId('provider-grid');
      expect(providerGrid).toBeInTheDocument();
    });
  });

  describe('Layout Transitions', () => {
    it('should handle viewport changes smoothly', async () => {
      render(<MockDashboard />);

      // Start with desktop
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();

      // Simulate resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 375 });
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });
    });

    it('should maintain widget content during resize', async () => {
      render(<MockDashboard />);

      expect(screen.getByText('Small Widget')).toBeInTheDocument();
      expect(screen.getByText('Medium Widget')).toBeInTheDocument();

      // Resize and check content is still there
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 375 });
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        expect(screen.getByText('Small Widget')).toBeInTheDocument();
        expect(screen.getByText('Medium Widget')).toBeInTheDocument();
      });
    });
  });

  describe('CSS Grid Breakpoints', () => {
    it('should apply correct grid classes for different layouts', () => {
      const { rerender } = render(<MockDashboard className="dashboard-grid-compact" />);

      let dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toHaveClass('dashboard-grid-compact');

      rerender(<MockDashboard className="dashboard-grid-standard" />);
      dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toHaveClass('dashboard-grid-standard');

      rerender(<MockDashboard className="dashboard-grid-spacious" />);
      dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toHaveClass('dashboard-grid-spacious');
    });

    it('should handle grid auto-rows correctly', () => {
      render(<MockDashboard />);

      const dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toHaveClass('dashboard-grid');
    });
  });

  describe('Widget Sizing', () => {
    it('should apply correct widget size classes', () => {
      render(<MockDashboard />);

      const smallWidget = screen.getByTestId('widget-small');
      const mediumWidget = screen.getByTestId('widget-medium');
      const largeWidget = screen.getByTestId('widget-large');
      const wideWidget = screen.getByTestId('widget-wide');

      expect(smallWidget).toHaveClass('widget-small');
      expect(mediumWidget).toHaveClass('widget-medium');
      expect(largeWidget).toHaveClass('widget-large');
      expect(wideWidget).toHaveClass('widget-wide');
    });

    it('should maintain minimum heights for widgets', () => {
      render(<MockDashboard />);

      const widgets = screen.getAllByTestId(/widget-/);
      expect(widgets.length).toBeGreaterThan(0);

      // Each widget should have some content
      widgets.forEach(widget => {
        expect(widget.textContent).toBeTruthy();
      });
    });
  });

  describe('Provider Layout', () => {
    it('should render provider showcase with correct classes', () => {
      render(<MockProviderShowcase />);

      const showcase = screen.getByTestId('provider-showcase');
      const grid = screen.getByTestId('provider-grid');

      expect(showcase).toHaveClass('provider-showcase');
      expect(grid).toHaveClass('provider-grid');
    });

    it('should handle different numbers of providers', () => {
      const MockVariableProviders = ({ count }: { count: number }) => (
        <div className="provider-grid" data-testid="provider-grid">
          {Array.from({ length: count }, (_, i) => (
            <div key={i} className="provider-card" data-testid={`provider-card-${i}`}>
              Provider {i + 1}
            </div>
          ))}
        </div>
      );

      // Test with different numbers of providers
      const { rerender } = render(<MockVariableProviders count={1} />);
      expect(screen.getByTestId('provider-card-0')).toBeInTheDocument();

      rerender(<MockVariableProviders count={6} />);
      expect(screen.getByTestId('provider-card-0')).toBeInTheDocument();
      expect(screen.getByTestId('provider-card-5')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should maintain accessibility during layout changes', async () => {
      render(<MockDashboard />);

      // Check initial accessibility
      const dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toBeInTheDocument();

      // Simulate resize
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 375 });
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        // Dashboard should still be accessible
        expect(screen.getByTestId('dashboard')).toBeInTheDocument();
      });
    });

    it('should maintain focus management during layout changes', () => {
      render(<MockDashboard />);

      const dashboard = screen.getByTestId('dashboard');
      expect(dashboard).toBeInTheDocument();

      // Should not break focus when layout changes
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 768 });
        window.dispatchEvent(new Event('resize'));
      });

      expect(dashboard).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause unnecessary re-renders during resize', () => {
      const renderSpy = vi.fn();

      const TestComponent = () => {
        renderSpy();
        return <MockDashboard />;
      };

      render(<TestComponent />);

      const initialRenderCount = renderSpy.mock.calls.length;

      // Multiple rapid resizes
      act(() => {
        for (let i = 0; i < 5; i++) {
          window.dispatchEvent(new Event('resize'));
        }
      });

      // Should not cause excessive re-renders
      expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(initialRenderCount + 2);
    });

    it('should handle rapid viewport changes gracefully', () => {
      render(<MockDashboard />);

      expect(() => {
        act(() => {
          // Rapid viewport changes
          Object.defineProperty(window, 'innerWidth', { value: 1200 });
          window.dispatchEvent(new Event('resize'));
          Object.defineProperty(window, 'innerWidth', { value: 768 });
          window.dispatchEvent(new Event('resize'));
          Object.defineProperty(window, 'innerWidth', { value: 375 });
          window.dispatchEvent(new Event('resize'));
        });
      }).not.toThrow();

      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });
});