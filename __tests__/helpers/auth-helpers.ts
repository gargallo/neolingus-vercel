/**
 * Authentication Test Helpers
 * Utilities for creating authenticated requests in tests
 */

import type { NextRequest } from 'next/server';

export interface MockUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
  full_name?: string;
}

export const mockUsers: Record<string, MockUser> = {
  admin: {
    id: '12345678-1234-1234-1234-123456789012',
    email: 'admin@test.com',
    role: 'admin',
    full_name: 'Test Admin'
  },
  user: {
    id: '87654321-4321-4321-4321-210987654321',
    email: 'user@test.com', 
    role: 'user',
    full_name: 'Test User'
  },
  user2: {
    id: '11111111-2222-3333-4444-555555555555',
    email: 'user2@test.com',
    role: 'user',
    full_name: 'Test User 2'
  }
};

/**
 * Creates a mock JWT token for testing
 * In real tests, this would create a proper JWT, but for unit tests we use simple strings
 */
export function createMockJWT(user: MockUser): string {
  // In a real implementation, this would create a proper JWT
  // For testing purposes, we use a simple format that our middleware can parse
  return `mock-jwt-${user.role}-${user.id}`;
}

/**
 * Creates an authenticated request for API testing
 */
export function createAuthenticatedRequest(
  method: string, 
  url: string, 
  role: 'admin' | 'user' = 'admin',
  userId?: string
): NextRequest {
  const user = userId 
    ? { ...mockUsers[role], id: userId }
    : mockUsers[role];
    
  const token = createMockJWT(user);
  
  const req = new Request(`http://localhost:3000${url}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }) as NextRequest;
  
  return req;
}

/**
 * Creates an authenticated request with a body payload
 */
export function createAuthenticatedRequestWithBody(
  method: string,
  url: string,
  body: any,
  role: 'admin' | 'user' = 'admin',
  userId?: string
): NextRequest {
  const user = userId 
    ? { ...mockUsers[role], id: userId }
    : mockUsers[role];
    
  const token = createMockJWT(user);
  
  const req = new Request(`http://localhost:3000${url}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }) as NextRequest;
  
  return req;
}

/**
 * Creates an unauthenticated request
 */
export function createUnauthenticatedRequest(
  method: string,
  url: string,
  body?: any
): NextRequest {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    requestInit.body = JSON.stringify(body);
  }
  
  return new Request(`http://localhost:3000${url}`, requestInit) as NextRequest;
}

/**
 * Mock authentication middleware that can be used in tests
 */
export async function mockAuthMiddleware(request: NextRequest): Promise<{
  user: MockUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      user: null,
      isAuthenticated: false,
      isAdmin: false
    };
  }
  
  const token = authHeader.substring(7); // Remove "Bearer "
  
  // Parse mock JWT
  if (token.startsWith('mock-jwt-')) {
    const parts = token.split('-');
    if (parts.length >= 4) {
      const role = parts[2] as 'admin' | 'user';
      const userId = parts[3];
      
      const user = Object.values(mockUsers).find(u => 
        u.role === role && (u.id === userId || !userId)
      );
      
      if (user) {
        return {
          user: { ...user, id: userId },
          isAuthenticated: true,
          isAdmin: role === 'admin'
        };
      }
    }
  }
  
  return {
    user: null,
    isAuthenticated: false,
    isAdmin: false
  };
}

/**
 * Mock database data for testing
 */
export const mockPlanData = {
  basic: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Basic',
    slug: 'basic',
    tier: 'basic' as const,
    description: 'Essential features for language learning',
    pricing: {
      monthly_price: 999,
      yearly_price: 9999,
      currency: 'EUR'
    },
    features: {
      max_courses: 1,
      ai_tutor_enabled: false,
      progress_analytics: 'basic',
      custom_study_plans: false
    },
    trial_enabled: true,
    trial_duration_days: 7,
    is_active: true,
    sort_order: 1
  },
  standard: {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Standard',
    slug: 'standard',
    tier: 'standard' as const,
    description: 'Advanced features with AI tutoring',
    pricing: {
      monthly_price: 1999,
      yearly_price: 19999,
      currency: 'EUR'
    },
    features: {
      max_courses: 3,
      ai_tutor_enabled: true,
      progress_analytics: 'advanced',
      custom_study_plans: true
    },
    trial_enabled: true,
    trial_duration_days: 7,
    is_active: true,
    sort_order: 2,
    is_featured: true
  },
  premium: {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Premium',
    slug: 'premium',
    tier: 'premium' as const,
    description: 'Complete access with unlimited features',
    pricing: {
      monthly_price: 2999,
      yearly_price: 29999,
      currency: 'EUR'
    },
    features: {
      max_courses: null,
      ai_tutor_enabled: true,
      progress_analytics: 'premium',
      custom_study_plans: true,
      priority_support: true
    },
    trial_enabled: true,
    trial_duration_days: 7,
    is_active: true,
    sort_order: 3
  }
};

export const mockCourseData = {
  english_b2: {
    id: '44444444-4444-4444-4444-444444444444',
    language: 'english',
    level: 'B2',
    title: 'English B2 Certification',
    is_active: true
  },
  valenciano_c1: {
    id: '55555555-5555-5555-5555-555555555555',
    language: 'valenciano',
    level: 'C1',
    title: 'Valencià C1 Certification',
    is_active: true
  }
};

/**
 * Validates API response format
 */
export function validateApiResponse(response: any, expectedStatus: number) {
  expect(response.status).toBe(expectedStatus);
  
  if (expectedStatus >= 200 && expectedStatus < 300) {
    // Success response
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(true);
    expect(response.body).toHaveProperty('data');
  } else {
    // Error response
    expect(response.body).toHaveProperty('success');
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty('error');
    expect(typeof response.body.error).toBe('string');
  }
}

/**
 * Validates plan object structure
 */
export function validatePlanObject(plan: any, includeAdminData = false) {
  expect(plan).toHaveProperty('id');
  expect(plan).toHaveProperty('name');
  expect(plan).toHaveProperty('tier');
  expect(plan).toHaveProperty('description');
  expect(plan).toHaveProperty('pricing');
  expect(plan).toHaveProperty('features');
  
  // Pricing validation
  expect(plan.pricing).toHaveProperty('monthly_price');
  expect(plan.pricing).toHaveProperty('currency');
  expect(typeof plan.pricing.monthly_price).toBe('number');
  expect(plan.pricing.monthly_price).toBeGreaterThan(0);
  
  // Features validation
  expect(typeof plan.features).toBe('object');
  expect(plan.features).toHaveProperty('ai_tutor_enabled');
  expect(typeof plan.features.ai_tutor_enabled).toBe('boolean');
  
  if (includeAdminData) {
    expect(plan).toHaveProperty('subscriber_count');
    expect(typeof plan.subscriber_count).toBe('number');
  } else {
    // Public data should not include admin fields
    expect(plan).not.toHaveProperty('created_by');
    expect(plan).not.toHaveProperty('updated_by');
    expect(plan).not.toHaveProperty('subscriber_count');
  }
}

/**
 * Validates user plan assignment object
 */
export function validateUserPlanAssignment(assignment: any) {
  expect(assignment).toHaveProperty('id');
  expect(assignment).toHaveProperty('user_id');
  expect(assignment).toHaveProperty('plan_id');
  expect(assignment).toHaveProperty('status');
  expect(assignment).toHaveProperty('subscription_tier');
  expect(assignment).toHaveProperty('billing_cycle');
  
  // Status should be valid
  expect(['active', 'trial', 'expired', 'cancelled', 'suspended'])
    .toContain(assignment.status);
    
  // Tier should be valid
  expect(['basic', 'standard', 'premium'])
    .toContain(assignment.subscription_tier);
    
  // Billing cycle should be valid
  expect(['monthly', 'yearly', 'trial'])
    .toContain(assignment.billing_cycle);
}

/**
 * Helper to create mock plan assignment data
 */
export function createMockPlanAssignment(overrides: Partial<any> = {}) {
  return {
    id: '66666666-6666-6666-6666-666666666666',
    user_id: mockUsers.user.id,
    plan_id: mockPlanData.standard.id,
    course_id: mockCourseData.english_b2.id,
    status: 'active',
    subscription_tier: 'standard',
    billing_cycle: 'monthly',
    assignment_reason: 'Test assignment',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
    ...overrides
  };
}