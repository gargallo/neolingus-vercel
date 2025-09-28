/**
 * Test setup configuration for plan management tests
 */

import { beforeAll, afterAll, vi } from 'vitest';

// Global test setup
beforeAll(async () => {
  // Setup global mocks
  global.console = {
    ...console,
    // Suppress console.error in tests unless we're testing error cases
    error: vi.fn(),
    warn: vi.fn(),
  };

  // Mock environment variables
  process.env.NODE_ENV = 'test';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
});

afterAll(async () => {
  // Cleanup
  vi.restoreAllMocks();
});

// Mock fetch globally for all tests
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Export mock for use in tests
export { mockFetch };

// Common test utilities
export const createMockRequest = (url: string, options: RequestInit = {}) => {
  return new Request(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
};

export const createMockResponse = (data: any, status = 200) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
};

// Mock authentication helpers
export const mockAdminAuth = {
  user: { id: 'admin-user', email: 'admin@example.com', role: 'admin' },
  error: null,
  status: 200,
};

export const mockUserAuth = {
  user: { id: 'regular-user', email: 'user@example.com', role: 'user' },
  error: null,
  status: 200,
};

export const mockUnauthenticated = {
  user: null,
  error: 'authentication_required',
  status: 401,
};

// Mock Supabase data
export const mockPlansData = [
  {
    id: 'plan-basic',
    name: 'Basic Plan',
    slug: 'basic-plan',
    tier: 'basic',
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
  {
    id: 'plan-standard',
    name: 'Standard Plan',
    slug: 'standard-plan',
    tier: 'standard',
    description: 'Great for regular learners',
    pricing: {
      monthly_price: 2999,
      yearly_price: 29999,
      currency: 'EUR'
    },
    features: {
      ai_tutor: true,
      custom_plans: true,
      progress_analytics: true,
      offline_access: true,
      priority_support: false,
      certificates: true
    },
    limits: {
      max_courses: 5,
      max_exams_per_month: 50,
      ai_tutoring_sessions: 25,
      storage_gb: 5,
      concurrent_sessions: 2
    },
    trial_enabled: true,
    trial_duration_days: 14,
    is_active: true,
    is_featured: true,
    subscriber_count: 123,
    display_order: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'plan-premium',
    name: 'Premium Plan',
    slug: 'premium-plan',
    tier: 'premium',
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
    is_featured: false,
    subscriber_count: 78,
    display_order: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockUsersData = [
  {
    id: 'user-1',
    email: 'test@example.com',
    full_name: 'Test User',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    full_name: 'Jane Doe',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockCoursesData = [
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

// Test data factories
export const createMockPlan = (overrides: any = {}) => ({
  id: `plan-${Date.now()}`,
  name: 'Test Plan',
  slug: 'test-plan',
  tier: 'basic',
  description: 'Test plan description',
  pricing: {
    monthly_price: 1999,
    yearly_price: 19999,
    currency: 'EUR'
  },
  features: {
    ai_tutor: true,
    custom_plans: false
  },
  limits: {
    max_courses: 1,
    max_exams_per_month: 10
  },
  trial_enabled: true,
  trial_duration_days: 7,
  is_active: true,
  is_featured: false,
  subscriber_count: 0,
  display_order: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const createMockAssignment = (overrides: any = {}) => ({
  id: `assignment-${Date.now()}`,
  user_id: 'user-1',
  plan_id: 'plan-basic',
  course_id: 'course-1',
  assignment_reason: 'Test assignment',
  billing_cycle: 'monthly',
  auto_renew: true,
  is_trial: false,
  trial_ends_at: null,
  subscription_starts_at: new Date().toISOString(),
  subscription_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'admin-user',
  ...overrides
});

// Validation helpers
export const validatePlanStructure = (plan: any) => {
  expect(plan).toHaveProperty('id');
  expect(plan).toHaveProperty('name');
  expect(plan).toHaveProperty('tier');
  expect(plan).toHaveProperty('pricing');
  expect(plan.pricing).toHaveProperty('monthly_price');
  expect(plan.pricing).toHaveProperty('currency');
  expect(plan).toHaveProperty('features');
  expect(plan).toHaveProperty('trial_enabled');
  expect(plan).toHaveProperty('is_active');
  expect(typeof plan.pricing.monthly_price).toBe('number');
  expect(['basic', 'standard', 'premium']).toContain(plan.tier);
};

export const validateAssignmentStructure = (assignment: any) => {
  expect(assignment).toHaveProperty('id');
  expect(assignment).toHaveProperty('user_id');
  expect(assignment).toHaveProperty('plan_id');
  expect(assignment).toHaveProperty('course_id');
  expect(assignment).toHaveProperty('billing_cycle');
  expect(assignment).toHaveProperty('is_trial');
  expect(assignment).toHaveProperty('is_active');
  expect(['monthly', 'yearly', 'trial']).toContain(assignment.billing_cycle);
  expect(typeof assignment.is_trial).toBe('boolean');
  expect(typeof assignment.is_active).toBe('boolean');
};

// Error simulation helpers
export const simulateNetworkError = () => {
  mockFetch.mockRejectedValueOnce(new Error('Network error'));
};

export const simulateServerError = () => {
  mockFetch.mockResolvedValueOnce(
    createMockResponse({
      success: false,
      error: 'internal_server_error',
      message: 'Internal server error'
    }, 500)
  );
};

export const simulateValidationError = (details: Record<string, string>) => {
  mockFetch.mockResolvedValueOnce(
    createMockResponse({
      success: false,
      error: 'validation_error',
      message: 'Validation failed',
      details
    }, 400)
  );
};

export const simulateAuthenticationError = () => {
  mockFetch.mockResolvedValueOnce(
    createMockResponse({
      success: false,
      error: 'authentication_required',
      message: 'Authentication required'
    }, 401)
  );
};