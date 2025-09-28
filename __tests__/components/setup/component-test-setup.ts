/**
 * Component testing setup for React components
 * Configures testing environment for plan management components
 */

import { beforeAll, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }
};

vi.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock Next.js navigation (App Router)
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock React hooks that might cause issues in tests
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useLayoutEffect: (actual as any).useEffect, // Use useEffect in tests
  };
});

// Global test setup
beforeAll(() => {
  // Mock window APIs that might not be available in test environment
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock fetch for API calls
  global.fetch = vi.fn();
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Export utilities for use in tests
export { mockRouter };

// Mock plan data for component tests
export const mockPlanData = {
  basic: {
    id: 'plan-basic',
    name: 'Basic Plan',
    slug: 'basic-plan',
    tier: 'basic' as const,
    description: 'Perfect for beginners',
    pricing: {
      monthly_price: 1999,
      yearly_price: 19999,
      currency: 'EUR'
    },
    features: {
      ai_tutor: true,
      custom_plans: false,
      progress_analytics: true,
      offline_access: false,
      priority_support: false,
      certificates: false
    },
    limits: {
      max_courses: 1,
      max_exams_per_month: 10,
      ai_tutoring_sessions: 5,
      storage_gb: 1,
      concurrent_sessions: 1
    },
    trial_enabled: true,
    trial_duration_days: 7,
    is_active: true,
    is_featured: false,
    subscriber_count: 45,
    display_order: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  premium: {
    id: 'plan-premium',
    name: 'Premium Plan',
    slug: 'premium-plan',
    tier: 'premium' as const,
    description: 'Complete learning experience',
    pricing: {
      monthly_price: 4999,
      yearly_price: 49999,
      currency: 'EUR'
    },
    features: {
      ai_tutor: true,
      custom_plans: true,
      progress_analytics: true,
      offline_access: true,
      priority_support: true,
      certificates: true
    },
    limits: {
      max_courses: null,
      max_exams_per_month: null,
      ai_tutoring_sessions: null,
      storage_gb: 50,
      concurrent_sessions: 5
    },
    trial_enabled: true,
    trial_duration_days: 14,
    is_active: true,
    is_featured: true,
    subscriber_count: 123,
    display_order: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
};

export const mockUserData = {
  admin: {
    id: 'user-admin',
    email: 'admin@example.com',
    full_name: 'Admin User',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z'
  },
  regular: {
    id: 'user-1',
    email: 'user@example.com',
    full_name: 'Regular User',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z'
  }
};

export const mockCourseData = [
  {
    id: 'course-1',
    title: 'English B2 Preparation',
    language: 'English',
    level: 'B2',
    description: 'Comprehensive B2 level English course',
    is_active: true
  },
  {
    id: 'course-2',
    title: 'Valenciano B2',
    language: 'Valenciano',
    level: 'B2',
    description: 'Valenciano language B2 certification',
    is_active: true
  }
];

export const mockTrialData = {
  active: {
    is_trial: true,
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    days_remaining: 7,
    plan_name: 'Premium Plan',
    plan_tier: 'premium',
    features_available: ['ai_tutor', 'custom_plans', 'progress_analytics'],
    course_info: {
      id: 'course-1',
      language: 'English',
      level: 'B2',
      title: 'English B2 Preparation'
    }
  },
  expiring: {
    is_trial: true,
    trial_ends_at: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    days_remaining: 1,
    plan_name: 'Premium Plan',
    plan_tier: 'premium',
    features_available: ['ai_tutor', 'custom_plans', 'progress_analytics'],
    course_info: {
      id: 'course-1',
      language: 'English',
      level: 'B2',
      title: 'English B2 Preparation'
    }
  },
  expired: {
    is_trial: true,
    trial_ends_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    days_remaining: 0,
    plan_name: 'Premium Plan',
    plan_tier: 'premium',
    features_available: [],
    course_info: {
      id: 'course-1',
      language: 'English',
      level: 'B2',
      title: 'English B2 Preparation'
    }
  }
};

// Helper function to render components with providers
export const createComponentTestUtils = () => {
  // This would be extended to include providers like Theme, Auth, etc.
  const renderWithProviders = (ui: React.ReactElement, options?: any) => {
    // For now, just return the basic render
    // In a full implementation, this would wrap with providers:
    // - ThemeProvider
    // - AuthProvider  
    // - QueryClient (if using React Query)
    // - Router (if needed)
    return ui;
  };

  return { renderWithProviders };
};

// Test utilities for user interactions
export const userInteractionHelpers = {
  // Simulate form filling
  fillPlanForm: (formData: any) => ({
    name: formData.name || 'Test Plan',
    tier: formData.tier || 'basic',
    description: formData.description || 'Test description',
    monthly_price: formData.monthly_price || 1999,
    currency: formData.currency || 'EUR'
  }),

  // Simulate plan selection
  selectPlan: (planId: string, withTrial: boolean = false) => ({
    planId,
    trial: withTrial,
    timestamp: new Date().toISOString()
  }),

  // Simulate assignment creation
  createAssignment: (data: any) => ({
    user_id: data.user_id,
    plan_id: data.plan_id,
    course_id: data.course_id,
    assignment_reason: data.assignment_reason || 'Test assignment',
    billing_cycle: data.billing_cycle || 'monthly',
    auto_renew: data.auto_renew ?? true,
    start_trial: data.start_trial ?? false
  })
};

// Mock API responses for component testing
export const mockApiResponses = {
  plans: {
    success: {
      success: true,
      data: {
        plans: [mockPlanData.basic, mockPlanData.premium],
        total: 2,
        page: 1,
        limit: 10
      }
    },
    error: {
      success: false,
      error: 'Failed to fetch plans',
      message: 'Unable to retrieve plans at this time'
    }
  },
  
  createPlan: {
    success: (planData: any) => ({
      success: true,
      data: {
        id: 'plan-new',
        ...planData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        subscriber_count: 0,
        is_active: true
      }
    }),
    error: {
      success: false,
      error: 'validation_error',
      message: 'Invalid plan data',
      details: {
        name: 'Plan name is required',
        tier: 'Invalid tier specified'
      }
    }
  },

  assignment: {
    success: (assignmentData: any) => ({
      success: true,
      data: {
        id: 'assignment-new',
        ...assignmentData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      }
    }),
    error: {
      success: false,
      error: 'assignment_failed',
      message: 'Unable to assign plan to user'
    }
  },

  users: {
    success: {
      success: true,
      data: [mockUserData.admin, mockUserData.regular]
    }
  },

  courses: {
    success: {
      success: true,
      data: mockCourseData
    }
  }
};

// Component test helpers
export const componentTestHelpers = {
  // Wait for async operations to complete
  waitForAsync: () => new Promise(resolve => setTimeout(resolve, 0)),

  // Simulate loading states
  simulateLoading: (duration: number = 100) => 
    new Promise(resolve => setTimeout(resolve, duration)),

  // Generate test IDs for components
  generateTestId: (component: string, variant?: string) => 
    variant ? `${component}-${variant}` : component,

  // Create mock handlers for component props
  createMockHandlers: () => ({
    onSave: vi.fn(),
    onCancel: vi.fn(),
    onDelete: vi.fn(),
    onEdit: vi.fn(),
    onSelect: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    onUpgrade: vi.fn(),
    onViewPlans: vi.fn(),
    onAssign: vi.fn()
  })
};

// Accessibility testing helpers
export const a11yTestHelpers = {
  // Common accessibility expectations
  expectAccessibleForm: (container: HTMLElement) => {
    // Check for labels, ARIA attributes, etc.
    const inputs = container.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const hasLabel = input.getAttribute('aria-label') || 
                      input.getAttribute('aria-labelledby') ||
                      container.querySelector(`label[for="${input.id}"]`);
      expect(hasLabel).toBeTruthy();
    });
  },

  expectAccessibleButtons: (container: HTMLElement) => {
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button).not.toHaveAttribute('disabled', '');
      expect(button.textContent?.trim() || button.getAttribute('aria-label')).toBeTruthy();
    });
  },

  expectKeyboardNavigation: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements.forEach(element => {
      expect(element).not.toHaveAttribute('tabindex', '-1');
    });
  }
};