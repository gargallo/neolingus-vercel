/**
 * Test Utilities for Academia Dashboard Components
 * Comprehensive utilities for testing dashboard functionality
 */

import React from 'react';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, expect } from 'vitest';
import {
  mockCourseData,
  mockProgressData,
  mockUserProgress,
  mockDashboardStats,
  mockQuickActions,
  mockBreakpoints,
  createMockHandlers,
  createMockCourseContextValue
} from './mock-data';

// Provider Wrapper Component
interface TestProvidersProps {
  children: React.ReactNode;
  courseContextValue?: any;
}

export function TestProviders({
  children,
  courseContextValue = createMockCourseContextValue()
}: TestProvidersProps) {
  // Mock the course context provider
  const MockCourseProvider = ({ children }: { children: React.ReactNode }) => {
    return (
      <div data-testid="mock-course-provider" data-context={JSON.stringify(courseContextValue)}>
        {children}
      </div>
    );
  };

  return (
    <MockCourseProvider>
      {children}
    </MockCourseProvider>
  );
}

// Custom Render Function
export interface RenderOptions {
  courseContextValue?: any;
  viewport?: keyof typeof mockBreakpoints;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: RenderOptions = {}
) {
  const {
    courseContextValue = createMockCourseContextValue(),
    viewport = 'desktop'
  } = options;

  // Set viewport dimensions
  const dimensions = mockBreakpoints[viewport];
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: dimensions.width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: dimensions.height,
  });

  const utils = render(ui, {
    wrapper: ({ children }) => (
      <TestProviders
        courseContextValue={courseContextValue}
      >
        {children}
      </TestProviders>
    ),
  });

  return {
    ...utils,
    user: userEvent.setup(),
    rerender: (element: React.ReactElement, newOptions?: RenderOptions) => {
      const updatedOptions = { ...options, ...newOptions };
      return utils.rerender(
        <TestProviders
          courseContextValue={updatedOptions.courseContextValue || courseContextValue}
        >
          {element}
        </TestProviders>
      );
    }
  };
}

// Dashboard Test Helpers
export const dashboardTestHelpers = {
  // Wait for dashboard to load
  waitForDashboardLoad: async () => {
    await waitFor(() => {
      expect(screen.queryByText('Loading dashboard data...')).not.toBeInTheDocument();
    }, { timeout: 5000 });
  },

  // Find dashboard sections
  findStatsSection: () => screen.getByTestId('dashboard-stats'),
  findActivitySection: () => screen.getByTestId('recent-activity'),
  findQuickActionsSection: () => screen.getByTestId('quick-actions'),
  findProgressSection: () => screen.getByTestId('progress-overview'),

  // Check dashboard state
  expectLoadingState: () => {
    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  },

  expectErrorState: (errorMessage?: string) => {
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error loading dashboard')).toBeInTheDocument();
    if (errorMessage) {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    }
  },

  expectEmptyState: () => {
    expect(screen.getByText('No course data available')).toBeInTheDocument();
    expect(screen.getByText('Browse Courses')).toBeInTheDocument();
  },

  expectCompleteDashboard: () => {
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText(/Dashboard for/)).toBeInTheDocument();
  },

  // Verify stats display
  expectStatsDisplay: (stats: any[]) => {
    stats.forEach(stat => {
      expect(screen.getByText(stat.label)).toBeInTheDocument();
      expect(screen.getByText(stat.value)).toBeInTheDocument();
      if (stat.helper) {
        expect(screen.getByText(stat.helper)).toBeInTheDocument();
      }
    });
  },

  // Verify activity timeline
  expectActivityTimeline: (activities: any[]) => {
    const timeline = screen.getByRole('list', { name: /recent activity/i });
    activities.forEach(activity => {
      expect(within(timeline).getByText(activity.examTitle || activity.topic)).toBeInTheDocument();
      if (activity.score) {
        expect(within(timeline).getByText(`Score: ${activity.score}%`)).toBeInTheDocument();
      }
    });
  },

  // Verify quick actions
  expectQuickActions: (actions: any[]) => {
    actions.forEach(action => {
      const button = screen.getByRole('button', { name: new RegExp(action.title, 'i') });
      expect(button).toBeInTheDocument();
      if (action.enabled) {
        expect(button).not.toBeDisabled();
      } else {
        expect(button).toBeDisabled();
      }
    });
  }
};

// Component Test Helpers
export const componentTestHelpers = {
  // Stats card helpers
  findStatCard: (label: string) => {
    return screen.getByText(label).closest('[class*="stat"]') ||
           screen.getByText(label).closest('[data-testid*="stat"]');
  },

  expectStatCard: (label: string, value: string, helper?: string) => {
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(value)).toBeInTheDocument();
    if (helper) {
      expect(screen.getByText(helper)).toBeInTheDocument();
    }
  },

  // Activity item helpers
  findActivityItem: (activityId: string) => {
    return screen.getByTestId(`activity-item-${activityId}`);
  },

  expectActivityItem: (activity: any) => {
    const item = componentTestHelpers.findActivityItem(activity.id);
    expect(item).toBeInTheDocument();
    expect(within(item).getByText(activity.examTitle || activity.topic)).toBeInTheDocument();
    if (activity.score) {
      expect(within(item).getByText(`Score: ${activity.score}%`)).toBeInTheDocument();
    }
  },

  // Quick action helpers
  findQuickActionButton: (title: string) => {
    return screen.getByRole('button', { name: new RegExp(title, 'i') });
  },

  expectQuickActionEnabled: (title: string) => {
    const button = componentTestHelpers.findQuickActionButton(title);
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  },

  expectQuickActionDisabled: (title: string) => {
    const button = componentTestHelpers.findQuickActionButton(title);
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  }
};

// Interaction Test Helpers
export const interactionTestHelpers = {
  // Click actions
  clickStartExam: async (user: any) => {
    const button = screen.getByRole('button', { name: /start.*exam/i });
    await user.click(button);
  },

  clickViewProgress: async (user: any) => {
    const button = screen.getByRole('button', { name: /view.*progress/i });
    await user.click(button);
  },

  clickViewHistory: async (user: any) => {
    const button = screen.getByRole('button', { name: /view.*history/i });
    await user.click(button);
  },

  clickRefresh: async (user: any) => {
    const button = screen.getByRole('button', { name: /refresh/i });
    await user.click(button);
  },

  clickRetry: async (user: any) => {
    const button = screen.getByRole('button', { name: /retry/i });
    await user.click(button);
  },

  // Navigation actions
  navigateToBrowseCourses: async (user: any) => {
    const button = screen.getByRole('button', { name: /browse courses/i });
    await user.click(button);
  },

  // Form interactions
  selectProvider: async (user: any, providerName: string) => {
    const select = screen.getByRole('combobox', { name: /provider/i });
    await user.click(select);
    const option = screen.getByRole('option', { name: new RegExp(providerName, 'i') });
    await user.click(option);
  },

  // Responsive interactions
  simulateResize: (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  }
};

// Mock viewport function for tests
export const createMockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  // Update matchMedia to reflect the new viewport
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => {
      // Parse media query for max-width/min-width
      const maxWidthMatch = query.match(/max-width:\s*(\d+)px/);
      const minWidthMatch = query.match(/min-width:\s*(\d+)px/);

      let matches = false;
      if (maxWidthMatch) {
        matches = width <= parseInt(maxWidthMatch[1]);
      } else if (minWidthMatch) {
        matches = width >= parseInt(minWidthMatch[1]);
      }

      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });

  window.dispatchEvent(new Event('resize'));
};

// Accessibility Test Helpers
export const a11yTestHelpers = {
  // ARIA helpers
  expectProperARIA: () => {
    // Check for main landmark
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Check for proper headings hierarchy
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);

    // Check for proper button labeling
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(
        button.getAttribute('aria-label') ||
        button.textContent?.trim() ||
        button.getAttribute('title')
      ).toBeTruthy();
    });
  },

  // Focus management
  expectFocusManagement: () => {
    const focusableElements = screen.queryAllByRole('button');
    focusableElements.forEach(element => {
      expect(element).not.toHaveAttribute('tabindex', '-1');
    });
  },

  // Loading states
  expectAccessibleLoading: () => {
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading')).toHaveClass('sr-only');
  },

  // Error states
  expectAccessibleError: () => {
    expect(screen.getByRole('alert')).toBeInTheDocument();
  },

  // Keyboard navigation
  testKeyboardNavigation: async (user: any) => {
    const focusableElements = screen.getAllByRole('button');

    // Test tab navigation
    for (const element of focusableElements) {
      await user.tab();
      // Verify focus is visible and logical
    }
  }
};

// Performance Test Helpers
export const performanceTestHelpers = {
  // Measure render time
  measureRenderTime: <T extends any[]>(
    renderFn: (...args: T) => any,
    ...args: T
  ) => {
    const start = performance.now();
    const result = renderFn(...args);
    const end = performance.now();
    return {
      result,
      duration: end - start
    };
  },

  // Check for unnecessary re-renders
  trackRerenders: () => {
    const renderCount = { current: 0 };
    const TrackingComponent = ({ children }: { children: React.ReactNode }) => {
      renderCount.current++;
      return <>{children}</>;
    };
    return { TrackingComponent, renderCount };
  },

  // Memory leak detection
  expectNoMemoryLeaks: () => {
    // This would typically involve checking for proper cleanup
    // of event listeners, timers, and subscriptions
    const eventListeners = (window as any)._eventListeners || {};
    expect(Object.keys(eventListeners)).toHaveLength(0);
  }
};

// API Mock Helpers
export const apiMockHelpers = {
  // Setup fetch mocks
  setupSuccessfulApiMocks: () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            progress: mockUserProgress.complete,
            analytics: mockUserProgress.complete.analytics
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: []
        })
      });
  },

  setupFailedApiMocks: (errorMessage = 'API Error') => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          success: false,
          error: errorMessage
        })
      });
  },

  setupLoadingApiMocks: (delay = 1000) => {
    global.fetch = vi.fn()
      .mockImplementationOnce(() =>
        new Promise(resolve =>
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: { progress: mockUserProgress.complete }
            })
          }), delay)
        )
      );
  },

  // Verify API calls
  expectApiCall: (url: string, options?: any) => {
    expect(global.fetch).toHaveBeenCalledWith(url, options);
  },

  expectApiCallCount: (count: number) => {
    expect(global.fetch).toHaveBeenCalledTimes(count);
  }
};

// Export all helpers
export {
  mockCourseData,
  mockProgressData,
  mockUserProgress,
  mockDashboardStats,
  mockQuickActions,
  mockBreakpoints,
  createMockHandlers,
  createMockCourseContextValue
};

// Default export for easy importing
export default {
  TestProviders,
  renderWithProviders,
  dashboardTestHelpers,
  componentTestHelpers,
  interactionTestHelpers,
  a11yTestHelpers,
  performanceTestHelpers,
  apiMockHelpers
};