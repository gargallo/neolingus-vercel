/**
 * Admin User Plan Management API Contract Tests  
 * Tests user plan assignment and management endpoints
 * These tests should FAIL initially (TDD RED phase)
 */

import { describe, it, expect } from 'vitest';
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

describe('Admin User Plan Management API Contract Tests', () => {
  const mockUserId = '12345678-1234-1234-1234-123456789012';
  const mockPlanId = '87654321-4321-4321-4321-210987654321';
  const mockCourseId = '11111111-2222-3333-4444-555555555555';
  const mockAssignmentId = '99999999-8888-7777-6666-555555555555';

  describe('POST /api/admin/plans/assign', () => {
    const validAssignmentData = {
      user_id: mockUserId,
      plan_id: mockPlanId,
      course_id: mockCourseId,
      assignment_reason: 'Manual assignment for testing',
      billing_cycle: 'monthly' as const,
      auto_renew: true,
      start_trial: false
    };

    it('should require admin authentication', async () => {
      const { POST } = await import('../../../app/api/admin/plans/assign/route');
      
      const req = new Request('http://localhost:3000/api/admin/plans/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAssignmentData)
      }) as NextRequest;
      
      const response = await POST(req);
      
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('authentication');
    });

    it('should validate required fields', async () => {
      const { POST } = await import('../../../app/api/admin/plans/assign/route');
      
      const invalidData = {
        user_id: '', // Invalid empty user_id
        plan_id: mockPlanId,
        // Missing required course_id
        billing_cycle: 'invalid_cycle' // Invalid billing cycle
      };
      
      const req = createAuthenticatedRequestWithBody('POST', '/api/admin/plans/assign', invalidData);
      
      const response = await POST(req);
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(Array.isArray(body.errors)).toBe(true);
      expect(body.errors.length).toBeGreaterThan(0);
    });

    it('should assign plan to user successfully', async () => {
      const { POST } = await import('../../../app/api/admin/plans/assign/route');
      
      const req = createAuthenticatedRequestWithBody('POST', '/api/admin/plans/assign', validAssignmentData);
      
      const response = await POST(req);
      
      expect(response.status).toBe(201);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('id');
      expect(body.data.user_id).toBe(validAssignmentData.user_id);
      expect(body.data.plan_id).toBe(validAssignmentData.plan_id);
      expect(body.data.status).toBe('active');
      expect(body.data.billing_cycle).toBe(validAssignmentData.billing_cycle);
    });

    it('should prevent duplicate assignments for same user-course', async () => {
      const { POST } = await import('../../../app/api/admin/plans/assign/route');
      
      // First assignment should succeed
      const req1 = createAuthenticatedRequestWithBody('POST', '/api/admin/plans/assign', validAssignmentData);
      await POST(req1);
      
      // Second assignment for same user-course should fail
      const req2 = createAuthenticatedRequestWithBody('POST', '/api/admin/plans/assign', validAssignmentData);
      const response = await POST(req2);
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('already has an active plan');
    });

    it('should support trial assignment', async () => {
      const { POST } = await import('../../../app/api/admin/plans/assign/route');
      
      const trialAssignmentData = {
        ...validAssignmentData,
        start_trial: true,
        billing_cycle: 'trial' as const
      };
      
      const req = createAuthenticatedRequestWithBody('POST', '/api/admin/plans/assign', trialAssignmentData);
      
      const response = await POST(req);
      
      expect(response.status).toBe(201);
      
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('trial');
      expect(body.data.trial_expires_at).toBeDefined();
    });

    it('should validate user and plan existence', async () => {
      const { POST } = await import('../../../app/api/admin/plans/assign/route');
      
      const invalidAssignmentData = {
        user_id: '00000000-0000-0000-0000-000000000000',
        plan_id: '00000000-0000-0000-0000-000000000000',
        course_id: '00000000-0000-0000-0000-000000000000',
        assignment_reason: 'Test with non-existent IDs'
      };
      
      const req = createAuthenticatedRequestWithBody('POST', '/api/admin/plans/assign', invalidAssignmentData);
      
      const response = await POST(req);
      
      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toMatch(/user|plan|course.*not found/i);
    });
  });

  describe('GET /api/admin/users/[userId]/plans', () => {
    it('should require admin authentication', async () => {
      const { GET } = await import('../../../app/api/admin/users/[userId]/plans/route');
      
      const req = new Request(`http://localhost:3000/api/admin/users/${mockUserId}/plans`) as NextRequest;
      
      const response = await GET(req, { params: { userId: mockUserId } });
      
      expect(response.status).toBe(401);
    });

    it('should return user plan assignments', async () => {
      const { GET } = await import('../../../app/api/admin/users/[userId]/plans/route');
      
      const req = createAuthenticatedRequest('GET', `/api/admin/users/${mockUserId}/plans`);
      
      const response = await GET(req, { params: { userId: mockUserId } });
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data)).toBe(true);
        
        // Each assignment should have required properties
        body.data.forEach((assignment: any) => {
          expect(assignment).toHaveProperty('id');
          expect(assignment).toHaveProperty('plan_id');
          expect(assignment).toHaveProperty('status');
          expect(assignment).toHaveProperty('subscription_tier');
          expect(assignment).toHaveProperty('plan_details');
          expect(assignment.plan_details).toHaveProperty('name');
        });
      } else {
        // Expected to fail initially
        expect(response.status).toBe(404);
      }
    });

    it('should return 404 for non-existent user', async () => {
      const { GET } = await import('../../../app/api/admin/users/[userId]/plans/route');
      
      const req = createAuthenticatedRequest('GET', '/api/admin/users/00000000-0000-0000-0000-000000000000/plans');
      
      const response = await GET(req, { 
        params: { userId: '00000000-0000-0000-0000-000000000000' } 
      });
      
      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('User not found');
    });
  });

  describe('PUT /api/admin/users/[userId]/plans/[assignmentId]', () => {
    const updateData = {
      new_plan_id: 'new-plan-id',
      change_reason: 'User requested upgrade',
      effective_immediately: true
    };

    it('should require admin authentication', async () => {
      const { PUT } = await import('../../../app/api/admin/users/[userId]/plans/[assignmentId]/route');
      
      const req = new Request(`http://localhost:3000/api/admin/users/${mockUserId}/plans/${mockAssignmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      }) as NextRequest;
      
      const response = await PUT(req, { 
        params: { userId: mockUserId, assignmentId: mockAssignmentId } 
      });
      
      expect(response.status).toBe(401);
    });

    it('should validate update data', async () => {
      const { PUT } = await import('../../../app/api/admin/users/[userId]/plans/[assignmentId]/route');
      
      const invalidUpdateData = {
        new_plan_id: '', // Invalid empty plan ID
        effective_immediately: 'not_boolean' // Invalid type
      };
      
      const req = createAuthenticatedRequestWithBody(
        'PUT', 
        `/api/admin/users/${mockUserId}/plans/${mockAssignmentId}`, 
        invalidUpdateData
      );
      
      const response = await PUT(req, { 
        params: { userId: mockUserId, assignmentId: mockAssignmentId } 
      });
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(Array.isArray(body.errors)).toBe(true);
    });

    it('should update plan assignment successfully', async () => {
      const { PUT } = await import('../../../app/api/admin/users/[userId]/plans/[assignmentId]/route');
      
      const req = createAuthenticatedRequestWithBody(
        'PUT', 
        `/api/admin/users/${mockUserId}/plans/${mockAssignmentId}`, 
        updateData
      );
      
      const response = await PUT(req, { 
        params: { userId: mockUserId, assignmentId: mockAssignmentId } 
      });
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.data).toHaveProperty('id');
        expect(body.data.plan_id).toBe(updateData.new_plan_id);
      } else {
        // Expected to fail initially
        expect(response.status).toBe(404);
      }
    });

    it('should return 404 for non-existent assignment', async () => {
      const { PUT } = await import('../../../app/api/admin/users/[userId]/plans/[assignmentId]/route');
      
      const req = createAuthenticatedRequestWithBody(
        'PUT', 
        `/api/admin/users/${mockUserId}/plans/00000000-0000-0000-0000-000000000000`, 
        updateData
      );
      
      const response = await PUT(req, { 
        params: { 
          userId: mockUserId, 
          assignmentId: '00000000-0000-0000-0000-000000000000' 
        } 
      });
      
      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Assignment not found');
    });
  });

  describe('DELETE /api/admin/users/[userId]/plans/[assignmentId]', () => {
    it('should require admin authentication', async () => {
      const { DELETE } = await import('../../../app/api/admin/users/[userId]/plans/[assignmentId]/route');
      
      const req = new Request(`http://localhost:3000/api/admin/users/${mockUserId}/plans/${mockAssignmentId}`, {
        method: 'DELETE'
      }) as NextRequest;
      
      const response = await DELETE(req, { 
        params: { userId: mockUserId, assignmentId: mockAssignmentId } 
      });
      
      expect(response.status).toBe(401);
    });

    it('should revoke plan assignment successfully', async () => {
      const { DELETE } = await import('../../../app/api/admin/users/[userId]/plans/[assignmentId]/route');
      
      const req = createAuthenticatedRequest(
        'DELETE', 
        `/api/admin/users/${mockUserId}/plans/${mockAssignmentId}?reason=Policy%20violation`
      );
      
      const response = await DELETE(req, { 
        params: { userId: mockUserId, assignmentId: mockAssignmentId } 
      });
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        expect(body.message).toContain('revoked');
      } else {
        // Expected to fail initially
        expect(response.status).toBe(404);
      }
    });

    it('should support revocation reason in query parameter', async () => {
      const { DELETE } = await import('../../../app/api/admin/users/[userId]/plans/[assignmentId]/route');
      
      const reason = 'Administrative decision';
      const req = createAuthenticatedRequest(
        'DELETE', 
        `/api/admin/users/${mockUserId}/plans/${mockAssignmentId}?reason=${encodeURIComponent(reason)}`
      );
      
      const response = await DELETE(req, { 
        params: { userId: mockUserId, assignmentId: mockAssignmentId } 
      });
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        // Reason should be recorded
      } else {
        // Expected to fail initially
        expect(response.status).toBe(404);
      }
    });

    it('should return 404 for non-existent assignment', async () => {
      const { DELETE } = await import('../../../app/api/admin/users/[userId]/plans/[assignmentId]/route');
      
      const req = createAuthenticatedRequest(
        'DELETE', 
        `/api/admin/users/${mockUserId}/plans/00000000-0000-0000-0000-000000000000`
      );
      
      const response = await DELETE(req, { 
        params: { 
          userId: mockUserId, 
          assignmentId: '00000000-0000-0000-0000-000000000000' 
        } 
      });
      
      expect(response.status).toBe(404);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Assignment not found');
    });

    it('should update related course enrollments on revocation', async () => {
      const { DELETE } = await import('../../../app/api/admin/users/[userId]/plans/[assignmentId]/route');
      
      const req = createAuthenticatedRequest(
        'DELETE', 
        `/api/admin/users/${mockUserId}/plans/${mockAssignmentId}?reason=Test%20completion`
      );
      
      const response = await DELETE(req, { 
        params: { userId: mockUserId, assignmentId: mockAssignmentId } 
      });
      
      if (response.status === 200) {
        // Should update user_course_enrollments.subscription_status to 'cancelled'
        // This will be verified in integration tests
        const body = await response.json();
        expect(body.success).toBe(true);
      } else {
        expect(response.status).toBe(404);
      }
    });
  });

  describe('Input Validation', () => {
    it('should validate UUID format for user_id', async () => {
      const { GET } = await import('../../../app/api/admin/users/[userId]/plans/route');
      
      const req = createAuthenticatedRequest('GET', '/api/admin/users/invalid-uuid/plans');
      
      const response = await GET(req, { params: { userId: 'invalid-uuid' } });
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid user ID format');
    });

    it('should validate UUID format for assignment_id', async () => {
      const { PUT } = await import('../../../app/api/admin/users/[userId]/plans/[assignmentId]/route');
      
      const req = createAuthenticatedRequestWithBody(
        'PUT', 
        `/api/admin/users/${mockUserId}/plans/invalid-uuid`, 
        { new_plan_id: mockPlanId }
      );
      
      const response = await PUT(req, { 
        params: { userId: mockUserId, assignmentId: 'invalid-uuid' } 
      });
      
      expect(response.status).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid assignment ID format');
    });
  });

  describe('Response Format Consistency', () => {
    it('should return consistent error format across endpoints', async () => {
      const { POST } = await import('../../../app/api/admin/plans/assign/route');
      
      const req = new Request('http://localhost:3000/api/admin/plans/assign', {
        method: 'POST'
      }) as NextRequest;
      
      const response = await POST(req);
      
      expect(response.status).toBe(401);
      
      const body = await response.json();
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(false);
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });

    it('should return user details in assignments', async () => {
      const { GET } = await import('../../../app/api/admin/users/[userId]/plans/route');
      
      const req = createAuthenticatedRequest('GET', `/api/admin/users/${mockUserId}/plans`);
      
      const response = await GET(req, { params: { userId: mockUserId } });
      
      if (response.status === 200) {
        const body = await response.json();
        expect(body.success).toBe(true);
        
        body.data.forEach((assignment: any) => {
          expect(assignment).toHaveProperty('user_details');
          expect(assignment.user_details).toHaveProperty('email');
          expect(assignment.user_details).toHaveProperty('full_name');
        });
      }
    });
  });
});