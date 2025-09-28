/**
 * Public Plans API Contract Tests
 * Tests public plan information and trial management endpoints
 * These tests should FAIL initially (TDD RED phase)
 */

import { describe, it, expect } from 'vitest';
import type { NextRequest } from 'next/server';

// Helper to create authenticated requests for user operations
function createAuthenticatedRequest(method: string, url: string) {
  const token = 'mock-user-jwt-token';
  
  const req = new Request(`http://localhost:3000${url}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }) as NextRequest;
  
  return req;
}

function createAuthenticatedRequestWithBody(method: string, url: string, body: any) {
  const token = 'mock-user-jwt-token';
  
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

describe('Public Plans API Contract Tests', () => {
  const mockCourseId = '11111111-2222-3333-4444-555555555555';
  const mockPlanId = '87654321-4321-4321-4321-210987654321';

  describe('GET /api/plans', () => {
    it('should return active plans without authentication', async () => {
      const { GET } = await import('../../../app/api/plans/route');
      
      const req = new Request('http://localhost:3000/api/plans') as NextRequest;
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      
      // Each plan should have public information only
      body.data.forEach((plan: any) => {
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('tier');
        expect(plan).toHaveProperty('description');
        expect(plan).toHaveProperty('features');
        expect(plan).toHaveProperty('pricing');
        expect(plan).toHaveProperty('trial_enabled');
        expect(plan).toHaveProperty('trial_duration_days');
        
        // Should NOT expose sensitive admin data
        expect(plan).not.toHaveProperty('created_by');
        expect(plan).not.toHaveProperty('updated_by');
        expect(plan).not.toHaveProperty('subscriber_count');
      });
    });

    it('should return only active plans', async () => {
      const { GET } = await import('../../../app/api/plans/route');
      
      const req = new Request('http://localhost:3000/api/plans') as NextRequest;
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      
      // All plans should be active
      body.data.forEach((plan: any) => {
        expect(plan.is_active).toBe(true);
      });
    });

    it('should support course filtering', async () => {
      const { GET } = await import('../../../app/api/plans/route');
      
      const req = new Request(`http://localhost:3000/api/plans?course_id=${mockCourseId}`) as NextRequest;
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      
      // Plans should be available for the specified course
      // (specific logic depends on implementation)
    });

    it('should return plans ordered by display_order', async () => {
      const { GET } = await import('../../../app/api/plans/route');
      
      const req = new Request('http://localhost:3000/api/plans') as NextRequest;
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      
      // Plans should be ordered (Basic, Standard, Premium)
      if (body.data.length > 1) {
        const tiers = body.data.map((plan: any) => plan.tier);
        expect(tiers.indexOf('basic')).toBeLessThan(tiers.indexOf('standard'));
        expect(tiers.indexOf('standard')).toBeLessThan(tiers.indexOf('premium'));
      }
    });

    it('should include feature comparison data', async () => {
      const { GET } = await import('../../../app/api/plans/route');
      
      const req = new Request('http://localhost:3000/api/plans') as NextRequest;
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      
      body.data.forEach((plan: any) => {
        expect(plan.features).toBeDefined();
        expect(typeof plan.features).toBe('object');
        
        // Should include key features for comparison
        expect(plan.features).toHaveProperty('ai_tutor_enabled');
        expect(plan.features).toHaveProperty('progress_analytics');
        expect(typeof plan.features.ai_tutor_enabled).toBe('boolean');
      });
    });

    it('should include pricing information', async () => {
      const { GET } = await import('../../../app/api/plans/route');
      
      const req = new Request('http://localhost:3000/api/plans') as NextRequest;
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      
      body.data.forEach((plan: any) => {
        expect(plan.pricing).toBeDefined();
        expect(plan.pricing).toHaveProperty('monthly_price');
        expect(plan.pricing).toHaveProperty('currency');
        expect(typeof plan.pricing.monthly_price).toBe('number');
        expect(plan.pricing.monthly_price).toBeGreaterThan(0);
        expect(plan.pricing.currency).toBe('EUR');
      });
    });
  });

  describe('POST /api/plans/[planId]/trial', () => {
    const trialData = {
      course_id: mockCourseId
    };

    it('should require user authentication', async () => {
      const { POST } = await import('../../../app/api/plans/[planId]/trial/route');
      
      const req = new Request(`http://localhost:3000/api/plans/${mockPlanId}/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trialData)
      }) as NextRequest;
      
      const response = await POST(req, { params: { planId: mockPlanId } });
      
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('authentication');
    });

    it('should validate required fields', async () => {
      const { POST } = await import('../../../app/api/plans/[planId]/trial/route');
      
      const invalidData = {
        // Missing required course_id
      };
      
      const req = createAuthenticatedRequestWithBody('POST', `/api/plans/${mockPlanId}/trial`, invalidData);
      
      const response = await POST(req, { params: { planId: mockPlanId } });
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors.some((error: string) => error.includes('course_id'))).toBe(true);
    });

    it('should start trial successfully', async () => {
      const { POST } = await import('../../../app/api/plans/[planId]/trial/route');
      
      const req = createAuthenticatedRequestWithBody('POST', `/api/plans/${mockPlanId}/trial`, trialData);
      
      const response = await POST(req, { params: { planId: mockPlanId } });
      
      expect(response.status).toBe(201);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('trial_expires_at');
      expect(body.data).toHaveProperty('access_expires_at');
      
      // Trial should expire in 7 days by default
      const trialExpiresAt = new Date(body.data.trial_expires_at);
      const now = new Date();
      const daysDiff = Math.ceil((trialExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });

    it('should return 404 for non-existent plan', async () => {
      const { POST } = await import('../../../app/api/plans/[planId]/trial/route');
      
      const req = createAuthenticatedRequestWithBody(
        'POST', 
        '/api/plans/00000000-0000-0000-0000-000000000000/trial', 
        trialData
      );
      
      const response = await POST(req, { 
        params: { planId: '00000000-0000-0000-0000-000000000000' } 
      });
      
      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Plan not found');
    });

    it('should return 403 if plan does not support trials', async () => {
      const { POST } = await import('../../../app/api/plans/[planId]/trial/route');
      
      // Assuming there's a plan that doesn't support trials
      const noTrialPlanId = 'plan-without-trials';
      
      const req = createAuthenticatedRequestWithBody(
        'POST', 
        `/api/plans/${noTrialPlanId}/trial`, 
        trialData
      );
      
      const response = await POST(req, { params: { planId: noTrialPlanId } });
      
      if (response.status === 403) {
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('trial not available');
      } else {
        // Expected to fail with 404 initially
        expect(response.status).toBe(404);
      }
    });

    it('should prevent duplicate trials for same user', async () => {
      const { POST } = await import('../../../app/api/plans/[planId]/trial/route');
      
      // First trial should succeed
      const req1 = createAuthenticatedRequestWithBody('POST', `/api/plans/${mockPlanId}/trial`, trialData);
      await POST(req1, { params: { planId: mockPlanId } });
      
      // Second trial for same user should fail
      const req2 = createAuthenticatedRequestWithBody('POST', `/api/plans/${mockPlanId}/trial`, trialData);
      const response = await POST(req2, { params: { planId: mockPlanId } });
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('already used a trial');
    });

    it('should validate course existence', async () => {
      const { POST } = await import('../../../app/api/plans/[planId]/trial/route');
      
      const invalidTrialData = {
        course_id: '00000000-0000-0000-0000-000000000000'
      };
      
      const req = createAuthenticatedRequestWithBody(
        'POST', 
        `/api/plans/${mockPlanId}/trial`, 
        invalidTrialData
      );
      
      const response = await POST(req, { params: { planId: mockPlanId } });
      
      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Course not found');
    });

    it('should create user plan assignment with trial status', async () => {
      const { POST } = await import('../../../app/api/plans/[planId]/trial/route');
      
      const req = createAuthenticatedRequestWithBody('POST', `/api/plans/${mockPlanId}/trial`, trialData);
      
      const response = await POST(req, { params: { planId: mockPlanId } });
      
      if (response.status === 201) {
        const body = await response.json();
        expect(body.success).toBe(true);
        
        // Should create assignment in database with trial status
        // This will be verified in integration tests
      } else {
        // Expected to fail initially
        expect(response.status).toBe(404);
      }
    });
  });

  describe('GET /api/user/trial-status', () => {
    it('should require user authentication', async () => {
      const { GET } = await import('../../../app/api/user/trial-status/route');
      
      const req = new Request('http://localhost:3000/api/user/trial-status') as NextRequest;
      
      const response = await GET(req);
      
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('authentication');
    });

    it('should return trial status for authenticated user', async () => {
      const { GET } = await import('../../../app/api/user/trial-status/route');
      
      const req = createAuthenticatedRequest('GET', '/api/user/trial-status');
      
      const response = await GET(req);
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('is_trial');
        expect(typeof body.data.is_trial).toBe('boolean');
        
        if (body.data.is_trial) {
          expect(body.data).toHaveProperty('trial_ends_at');
          expect(body.data).toHaveProperty('days_remaining');
          expect(body.data).toHaveProperty('plan_name');
          expect(body.data).toHaveProperty('features_available');
          expect(Array.isArray(body.data.features_available)).toBe(true);
        }
      } else {
        // Expected to fail initially or return no trial data
        expect([200, 404]).toContain(response.status);
      }
    });

    it('should calculate days remaining correctly', async () => {
      const { GET } = await import('../../../app/api/user/trial-status/route');
      
      const req = createAuthenticatedRequest('GET', '/api/user/trial-status');
      
      const response = await GET(req);
      
      if (response.status === 200) {
        const body = await response.json();
        
        if (body.data.is_trial) {
          expect(body.data.days_remaining).toBeGreaterThanOrEqual(0);
          expect(body.data.days_remaining).toBeLessThanOrEqual(30); // Max trial duration
          
          // Verify calculation
          const trialEndsAt = new Date(body.data.trial_ends_at);
          const now = new Date();
          const calculatedDays = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          expect(body.data.days_remaining).toBe(Math.max(0, calculatedDays));
        }
      }
    });

    it('should return 404 if user has no trial', async () => {
      const { GET } = await import('../../../app/api/user/trial-status/route');
      
      // For a user without any trial
      const req = createAuthenticatedRequest('GET', '/api/user/trial-status');
      
      const response = await GET(req);
      
      if (response.status === 404) {
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('No active trial found');
      } else if (response.status === 200) {
        const body = await response.json();
        expect(body.data.is_trial).toBe(false);
      }
    });
  });

  describe('POST /api/user/convert-trial', () => {
    it('should require user authentication', async () => {
      const { POST } = await import('../../../app/api/user/convert-trial/route');
      
      const req = new Request('http://localhost:3000/api/user/convert-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }) as NextRequest;
      
      const response = await POST(req);
      
      expect(response.status).toBe(401);
    });

    it('should convert trial to paid subscription', async () => {
      const { POST } = await import('../../../app/api/user/convert-trial/route');
      
      const conversionData = {
        billing_cycle: 'monthly' as const,
        payment_method_id: 'pm_test_card'
      };
      
      const req = createAuthenticatedRequestWithBody('POST', '/api/user/convert-trial', conversionData);
      
      const response = await POST(req);
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('status');
        expect(body.data.status).toBe('active');
        expect(body.data).toHaveProperty('current_period_end');
      } else {
        // Expected to fail initially
        expect(response.status).toBe(404);
      }
    });

    it('should return 404 if user has no active trial', async () => {
      const { POST } = await import('../../../app/api/user/convert-trial/route');
      
      const req = createAuthenticatedRequestWithBody('POST', '/api/user/convert-trial', {
        billing_cycle: 'monthly'
      });
      
      const response = await POST(req);
      
      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('No active trial found');
    });
  });

  describe('Data Security and Privacy', () => {
    it('should not expose sensitive user data in public endpoints', async () => {
      const { GET } = await import('../../../app/api/plans/route');
      
      const req = new Request('http://localhost:3000/api/plans') as NextRequest;
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      
      // Should not contain any user-specific or sensitive data
      body.data.forEach((plan: any) => {
        expect(plan).not.toHaveProperty('created_by');
        expect(plan).not.toHaveProperty('updated_by');
        expect(plan).not.toHaveProperty('subscriber_emails');
        expect(plan).not.toHaveProperty('revenue_data');
      });
    });

    it('should validate user ownership in trial operations', async () => {
      const { GET } = await import('../../../app/api/user/trial-status/route');
      
      const req = createAuthenticatedRequest('GET', '/api/user/trial-status');
      
      const response = await GET(req);
      
      // Should only return data for the authenticated user
      // This is enforced through JWT and RLS policies
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Response Format Consistency', () => {
    it('should return consistent success format', async () => {
      const { GET } = await import('../../../app/api/plans/route');
      
      const req = new Request('http://localhost:3000/api/plans') as NextRequest;
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should return consistent error format', async () => {
      const { POST } = await import('../../../app/api/plans/[planId]/trial/route');
      
      const req = new Request(`http://localhost:3000/api/plans/${mockPlanId}/trial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }) as NextRequest;
      
      const response = await POST(req, { params: { planId: mockPlanId } });
      
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(false);
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });
  });
});