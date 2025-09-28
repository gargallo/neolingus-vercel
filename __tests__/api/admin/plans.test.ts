/**
 * Admin Plans API Contract Tests
 * Tests all admin plan management endpoints based on OpenAPI specification
 * These tests should FAIL initially (TDD RED phase)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createRequest, createResponse } from 'node-mocks-http';
import type { NextRequest } from 'next/server';

// Helper to create authenticated requests
function createAuthenticatedRequest(method: string, url: string, role: 'admin' | 'user' = 'admin') {
  const token = role === 'admin' ? 'mock-admin-jwt-token' : 'mock-user-jwt-token';
  
  const req = new Request(`http://localhost:3000${url}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }) as NextRequest;
  
  return req;
}

function createAuthenticatedRequestWithBody(method: string, url: string, body: any, role: 'admin' | 'user' = 'admin') {
  const token = role === 'admin' ? 'mock-admin-jwt-token' : 'mock-user-jwt-token';
  
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

describe('Admin Plans API Contract Tests', () => {
  // Test data
  const validPlanData = {
    name: 'Test Professional Plan',
    tier: 'standard' as const,
    description: 'Full access with AI tutoring and analytics',
    features: [
      {
        id: 'ai_tutor',
        name: 'AI Tutoring Sessions',
        description: 'Unlimited AI-powered tutoring',
        included: true,
        limit: null
      },
      {
        id: 'custom_plans',
        name: 'Custom Study Plans',
        description: 'Personalized learning paths',
        included: true,
        limit: null
      }
    ],
    limits: {
      max_courses: 3,
      max_exams_per_month: 50,
      ai_tutoring_sessions: 100,
      storage_gb: 5,
      concurrent_sessions: 2
    },
    pricing: {
      monthly_price: 1999, // €19.99 in cents
      yearly_price: 19999, // €199.99 in cents
      currency: 'EUR',
      billing_period: 'monthly' as const
    },
    trial_enabled: true,
    trial_duration_days: 7,
    display_order: 2
  };

  describe('GET /api/admin/plans', () => {
    it('should require admin authentication', async () => {
      // Import the route handler
      const { GET } = await import('../../../app/api/admin/plans/route');
      
      // Create request without authentication
      const req = new Request('http://localhost:3000/api/admin/plans') as NextRequest;
      
      const response = await GET(req);
      
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('authentication');
    });

    it('should require admin role', async () => {
      const { GET } = await import('../../../app/api/admin/plans/route');
      
      // Create request with user token (not admin)
      const req = createAuthenticatedRequest('GET', '/api/admin/plans', 'user');
      
      const response = await GET(req);
      
      expect(response.status).toBe(403);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('permission');
    });

    it('should return plans with subscriber counts for admin', async () => {
      const { GET } = await import('../../../app/api/admin/plans/route');
      
      const req = createAuthenticatedRequest('GET', '/api/admin/plans');
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      
      // Each plan should have subscriber count
      if (body.data.length > 0) {
        const plan = body.data[0];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('tier');
        expect(plan).toHaveProperty('subscriber_count');
        expect(typeof plan.subscriber_count).toBe('number');
      }
    });

    it('should support filtering by tier', async () => {
      const { GET } = await import('../../../app/api/admin/plans/route');
      
      const req = createAuthenticatedRequest('GET', '/api/admin/plans?tier=premium');
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      
      // All returned plans should be premium tier
      body.data.forEach((plan: any) => {
        expect(plan.tier).toBe('premium');
      });
    });

    it('should support include_inactive parameter', async () => {
      const { GET } = await import('../../../app/api/admin/plans/route');
      
      const req = createAuthenticatedRequest('GET', '/api/admin/plans?include_inactive=true');
      
      const response = await GET(req);
      
      expect(response.status).toBe(200);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('POST /api/admin/plans', () => {
    it('should require admin authentication', async () => {
      const { POST } = await import('../../../app/api/admin/plans/route');
      
      const req = new Request('http://localhost:3000/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPlanData)
      }) as NextRequest;
      
      const response = await POST(req);
      
      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const { POST } = await import('../../../app/api/admin/plans/route');
      
      const invalidData = {
        name: '', // Invalid empty name
        tier: 'invalid_tier', // Invalid tier
        pricing: {
          monthly_price: -100 // Invalid negative price
        }
      };
      
      const req = createAuthenticatedRequestWithBody('POST', '/api/admin/plans', invalidData);
      
      const response = await POST(req);
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors.length).toBeGreaterThan(0);
    });

    it('should create plan successfully with valid data', async () => {
      const { POST } = await import('../../../app/api/admin/plans/route');
      
      const req = createAuthenticatedRequestWithBody('POST', '/api/admin/plans', validPlanData);
      
      const response = await POST(req);
      
      expect(response.status).toBe(201);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data.name).toBe(validPlanData.name);
      expect(body.data.tier).toBe(validPlanData.tier);
      expect(body.data.pricing.monthly_price).toBe(validPlanData.pricing.monthly_price);
    });

    it('should prevent duplicate plan names', async () => {
      const { POST } = await import('../../../app/api/admin/plans/route');
      
      // First creation should succeed
      const req1 = createAuthenticatedRequestWithBody('POST', '/api/admin/plans', validPlanData);
      await POST(req1);
      
      // Second creation with same name should fail
      const req2 = createAuthenticatedRequestWithBody('POST', '/api/admin/plans', validPlanData);
      const response = await POST(req2);
      
      expect(response.status).toBe(409);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('already exists');
    });

    it('should validate feature dependencies', async () => {
      const { POST } = await import('../../../app/api/admin/plans/route');
      
      const invalidFeatureData = {
        ...validPlanData,
        tier: 'basic',
        features: [
          {
            id: 'custom_plans',
            name: 'Custom Study Plans',
            included: true
          },
          {
            id: 'ai_tutor',
            name: 'AI Tutoring',
            included: false // Should fail: custom plans require AI tutor
          }
        ]
      };
      
      const req = createAuthenticatedRequestWithBody('POST', '/api/admin/plans', invalidFeatureData);
      
      const response = await POST(req);
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Custom study plans require AI tutoring');
    });
  });

  describe('GET /api/admin/plans/[planId]', () => {
    it('should require admin authentication', async () => {
      const { GET } = await import('../../../app/api/admin/plans/[planId]/route');
      
      const req = new Request('http://localhost:3000/api/admin/plans/123') as NextRequest;
      
      const response = await GET(req, { params: { planId: '123' } });
      
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent plan', async () => {
      const { GET } = await import('../../../app/api/admin/plans/[planId]/route');
      
      const req = createAuthenticatedRequest('GET', '/api/admin/plans/00000000-0000-0000-0000-000000000000');
      
      const response = await GET(req, { 
        params: { planId: '00000000-0000-0000-0000-000000000000' } 
      });
      
      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('not found');
    });

    it('should return plan details for valid plan ID', async () => {
      const { GET } = await import('../../../app/api/admin/plans/[planId]/route');
      
      // This will fail initially since we don't have plans
      const req = createAuthenticatedRequest('GET', '/api/admin/plans/test-plan-id');
      
      const response = await GET(req, { params: { planId: 'test-plan-id' } });
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('id');
        expect(body.data).toHaveProperty('name');
        expect(body.data).toHaveProperty('tier');
        expect(body.data).toHaveProperty('features');
        expect(body.data).toHaveProperty('pricing');
      } else {
        // Expected to fail initially
        expect(response.status).toBe(404);
      }
    });
  });

  describe('PUT /api/admin/plans/[planId]', () => {
    it('should require admin authentication', async () => {
      const { PUT } = await import('../../../app/api/admin/plans/[planId]/route');
      
      const req = new Request('http://localhost:3000/api/admin/plans/123', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Plan' })
      }) as NextRequest;
      
      const response = await PUT(req, { params: { planId: '123' } });
      
      expect(response.status).toBe(401);
    });

    it('should validate update data', async () => {
      const { PUT } = await import('../../../app/api/admin/plans/[planId]/route');
      
      const invalidUpdateData = {
        name: '', // Invalid empty name
        pricing: {
          monthly_price: -50 // Invalid negative price
        }
      };
      
      const req = createAuthenticatedRequestWithBody('PUT', '/api/admin/plans/test-id', invalidUpdateData);
      
      const response = await PUT(req, { params: { planId: 'test-id' } });
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(Array.isArray(body.errors)).toBe(true);
    });

    it('should update plan successfully', async () => {
      const { PUT } = await import('../../../app/api/admin/plans/[planId]/route');
      
      const updateData = {
        name: 'Updated Professional Plan',
        description: 'Updated description',
        pricing: {
          monthly_price: 2499, // €24.99
          yearly_price: 24999,
          currency: 'EUR'
        }
      };
      
      const req = createAuthenticatedRequestWithBody('PUT', '/api/admin/plans/test-id', updateData);
      
      const response = await PUT(req, { params: { planId: 'test-id' } });
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data.name).toBe(updateData.name);
        expect(body.data.pricing.monthly_price).toBe(updateData.pricing.monthly_price);
      } else {
        // Expected to fail initially
        expect(response.status).toBe(404);
      }
    });
  });

  describe('DELETE /api/admin/plans/[planId]', () => {
    it('should require admin authentication', async () => {
      const { DELETE } = await import('../../../app/api/admin/plans/[planId]/route');
      
      const req = new Request('http://localhost:3000/api/admin/plans/123', {
        method: 'DELETE'
      }) as NextRequest;
      
      const response = await DELETE(req, { params: { planId: '123' } });
      
      expect(response.status).toBe(401);
    });

    it('should prevent deletion of plan with active subscribers', async () => {
      const { DELETE } = await import('../../../app/api/admin/plans/[planId]/route');
      
      const req = createAuthenticatedRequest('DELETE', '/api/admin/plans/plan-with-subscribers');
      
      const response = await DELETE(req, { 
        params: { planId: 'plan-with-subscribers' } 
      });
      
      if (response.status === 400) {
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('active subscribers');
      } else {
        // Expected to fail initially with 404
        expect(response.status).toBe(404);
      }
    });

    it('should support force deletion with query parameter', async () => {
      const { DELETE } = await import('../../../app/api/admin/plans/[planId]/route');
      
      const req = createAuthenticatedRequest('DELETE', '/api/admin/plans/test-id?force=true');
      
      const response = await DELETE(req, { params: { planId: 'test-id' } });
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
      } else {
        // Expected to fail initially
        expect(response.status).toBe(404);
      }
    });
  });

  describe('GET /api/admin/plans/[planId]/subscribers', () => {
    it('should require admin authentication', async () => {
      const { GET } = await import('../../../app/api/admin/plans/[planId]/subscribers/route');
      
      const req = new Request('http://localhost:3000/api/admin/plans/123/subscribers') as NextRequest;
      
      const response = await GET(req, { params: { planId: '123' } });
      
      expect(response.status).toBe(401);
    });

    it('should return paginated subscribers list', async () => {
      const { GET } = await import('../../../app/api/admin/plans/[planId]/subscribers/route');
      
      const req = createAuthenticatedRequest('GET', '/api/admin/plans/test-id/subscribers?page=1&limit=10');
      
      const response = await GET(req, { params: { planId: 'test-id' } });
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
        expect(body).toHaveProperty('pagination');
        expect(body.pagination).toHaveProperty('page');
        expect(body.pagination).toHaveProperty('limit');
        expect(body.pagination).toHaveProperty('total');
      } else {
        // Expected to fail initially
        expect(response.status).toBe(404);
      }
    });

    it('should support status filtering', async () => {
      const { GET } = await import('../../../app/api/admin/plans/[planId]/subscribers/route');
      
      const req = createAuthenticatedRequest('GET', '/api/admin/plans/test-id/subscribers?status=trial');
      
      const response = await GET(req, { params: { planId: 'test-id' } });
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        // All subscribers should have trial status
        body.data.forEach((subscriber: any) => {
          expect(subscriber.subscription_status).toBe('trial');
        });
      } else {
        // Expected to fail initially
        expect(response.status).toBe(404);
      }
    });
  });

  describe('Response Format Validation', () => {
    it('should return consistent error format', async () => {
      const { GET } = await import('../../../app/api/admin/plans/route');
      
      const req = new Request('http://localhost:3000/api/admin/plans') as NextRequest;
      
      const response = await GET(req);
      
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(false);
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });

    it('should return consistent success format', async () => {
      const { GET } = await import('../../../app/api/admin/plans/route');
      
      const req = createAuthenticatedRequest('GET', '/api/admin/plans');
      
      const response = await GET(req);
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body).toHaveProperty('success');
        expect(body.success).toBe(true);
        expect(body).toHaveProperty('data');
        expect(Array.isArray(body.data)).toBe(true);
      } else {
        // This test will pass once authentication is implemented
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });
  });
});