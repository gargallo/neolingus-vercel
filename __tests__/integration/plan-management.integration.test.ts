/**
 * Integration tests for plan management system
 * Tests complete flow from frontend to backend
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '../../utils/supabase/client';

// Import API route handlers
import { GET as AdminPlansGET, POST as AdminPlansPOST } from '../../app/api/admin/plans/route';
import { PUT as AdminPlanPUT, DELETE as AdminPlanDELETE } from '../../app/api/admin/plans/[planId]/route';
import { GET as PublicPlansGET } from '../../app/api/plans/route';
import { POST as AssignPlanPOST } from '../../app/api/admin/plans/assign/route';

// Mock Supabase client
let mockSupabaseData = {
  plans: [
    {
      id: 'plan-1',
      name: 'Basic Plan',
      slug: 'basic-plan',
      tier: 'basic',
      description: 'Perfect for beginners',
      pricing: { monthly_price: 1999, yearly_price: 19999, currency: 'EUR' },
      features: { ai_tutor: true, custom_plans: false, progress_analytics: true },
      limits: { max_courses: 1, max_exams_per_month: 10 },
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
      id: 'plan-2',
      name: 'Premium Plan',
      slug: 'premium-plan',
      tier: 'premium',
      description: 'Complete learning experience',
      pricing: { monthly_price: 4999, yearly_price: 49999, currency: 'EUR' },
      features: { ai_tutor: true, custom_plans: true, progress_analytics: true },
      limits: { max_courses: null, max_exams_per_month: null },
      trial_enabled: true,
      trial_duration_days: 14,
      is_active: true,
      is_featured: true,
      subscriber_count: 123,
      display_order: 2,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ],
  users: [
    {
      id: 'user-1',
      email: 'test@example.com',
      full_name: 'Test User',
      created_at: '2024-01-01T00:00:00Z'
    }
  ],
  assignments: [],
  nextId: 3
};

const mockSupabase = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: () => Promise.resolve({
          data: table === 'plans' ? mockSupabaseData.plans[0] : mockSupabaseData.users[0],
          error: null
        }),
        data: table === 'plans' ? mockSupabaseData.plans : mockSupabaseData.users,
        error: null
      }),
      data: table === 'plans' ? mockSupabaseData.plans : mockSupabaseData.users,
      error: null
    }),
    insert: (data: any) => ({
      select: () => ({
        single: () => {
          const newItem = { ...data, id: `${table}-${mockSupabaseData.nextId++}` };
          if (table === 'plans') {
            mockSupabaseData.plans.push(newItem);
          } else if (table === 'user_plan_assignments') {
            mockSupabaseData.assignments.push(newItem);
          }
          return Promise.resolve({ data: newItem, error: null });
        }
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        select: () => ({
          single: () => {
            if (table === 'plans') {
              const planIndex = mockSupabaseData.plans.findIndex(p => p.id === value);
              if (planIndex >= 0) {
                mockSupabaseData.plans[planIndex] = { ...mockSupabaseData.plans[planIndex], ...data };
                return Promise.resolve({ data: mockSupabaseData.plans[planIndex], error: null });
              }
            }
            return Promise.resolve({ data: null, error: { message: 'Not found' } });
          }
        })
      })
    }),
    delete: () => ({
      eq: (column: string, value: any) => {
        if (table === 'plans') {
          const planIndex = mockSupabaseData.plans.findIndex(p => p.id === value);
          if (planIndex >= 0) {
            const deletedPlan = mockSupabaseData.plans.splice(planIndex, 1)[0];
            return Promise.resolve({ data: deletedPlan, error: null });
          }
        }
        return Promise.resolve({ data: null, error: { message: 'Not found' } });
      }
    })
  }),
  auth: {
    getUser: () => Promise.resolve({
      data: { user: { id: 'user-admin', email: 'admin@example.com' } },
      error: null
    })
  }
};

// Mock the Supabase client
vi.mock('../../utils/supabase/client', () => ({
  createSupabaseClientFromRequest: () => mockSupabase
}));

// Mock authentication
vi.mock('../../utils/auth', () => ({
  authenticateAdmin: () => Promise.resolve({ 
    user: { id: 'user-admin', email: 'admin@example.com' },
    error: null,
    status: 200 
  }),
  authenticateUser: () => Promise.resolve({ 
    user: { id: 'user-1', email: 'test@example.com' },
    error: null,
    status: 200 
  })
}));

describe('Plan Management Integration Tests', () => {
  beforeEach(() => {
    // Reset mock data before each test
    mockSupabaseData = {
      plans: [
        {
          id: 'plan-1',
          name: 'Basic Plan',
          slug: 'basic-plan',
          tier: 'basic',
          description: 'Perfect for beginners',
          pricing: { monthly_price: 1999, yearly_price: 19999, currency: 'EUR' },
          features: { ai_tutor: true, custom_plans: false, progress_analytics: true },
          limits: { max_courses: 1, max_exams_per_month: 10 },
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
          id: 'plan-2',
          name: 'Premium Plan',
          slug: 'premium-plan',
          tier: 'premium',
          description: 'Complete learning experience',
          pricing: { monthly_price: 4999, yearly_price: 49999, currency: 'EUR' },
          features: { ai_tutor: true, custom_plans: true, progress_analytics: true },
          limits: { max_courses: null, max_exams_per_month: null },
          trial_enabled: true,
          trial_duration_days: 14,
          is_active: true,
          is_featured: true,
          subscriber_count: 123,
          display_order: 2,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ],
      users: [
        {
          id: 'user-1',
          email: 'test@example.com',
          full_name: 'Test User',
          created_at: '2024-01-01T00:00:00Z'
        }
      ],
      assignments: [],
      nextId: 3
    };
  });

  describe('Admin Plan Management Flow', () => {
    it('should complete full CRUD cycle for plans', async () => {
      // 1. Create a new plan
      const createRequest = new Request('http://localhost:3000/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Integration Test Plan',
          tier: 'standard',
          description: 'Plan created during integration testing',
          monthly_price: 2999,
          yearly_price: 29999,
          currency: 'EUR',
          trial_enabled: true,
          trial_duration_days: 7,
          is_active: true,
          is_featured: false,
          display_order: 3,
          features: { ai_tutor: true, custom_plans: true },
          limits: { max_courses: 5, max_exams_per_month: 50 }
        })
      }) as NextRequest;

      const createResponse = await AdminPlansPOST(createRequest);
      const createResult = await createResponse.json();

      expect(createResponse.status).toBe(201);
      expect(createResult.success).toBe(true);
      expect(createResult.data.name).toBe('Integration Test Plan');
      
      const newPlanId = createResult.data.id;

      // 2. Read all plans
      const listRequest = new Request('http://localhost:3000/api/admin/plans') as NextRequest;
      const listResponse = await AdminPlansGET(listRequest);
      const listResult = await listResponse.json();

      expect(listResponse.status).toBe(200);
      expect(listResult.success).toBe(true);
      expect(listResult.data.plans).toHaveLength(3); // 2 original + 1 new
      expect(listResult.data.plans.some((p: any) => p.id === newPlanId)).toBe(true);

      // 3. Update the plan
      const updateRequest = new Request(`http://localhost:3000/api/admin/plans/${newPlanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Integration Plan',
          description: 'Updated during integration testing',
          monthly_price: 3499
        })
      }) as NextRequest;

      const updateResponse = await AdminPlanPUT(updateRequest, { params: { planId: newPlanId } });
      const updateResult = await updateResponse.json();

      expect(updateResponse.status).toBe(200);
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.name).toBe('Updated Integration Plan');
      expect(updateResult.data.pricing.monthly_price).toBe(3499);

      // 4. Delete the plan
      const deleteRequest = new Request(`http://localhost:3000/api/admin/plans/${newPlanId}`, {
        method: 'DELETE'
      }) as NextRequest;

      const deleteResponse = await AdminPlanDELETE(deleteRequest, { params: { planId: newPlanId } });
      const deleteResult = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleteResult.success).toBe(true);

      // 5. Verify deletion
      const finalListRequest = new Request('http://localhost:3000/api/admin/plans') as NextRequest;
      const finalListResponse = await AdminPlansGET(finalListRequest);
      const finalListResult = await finalListResponse.json();

      expect(finalListResponse.status).toBe(200);
      expect(finalListResult.data.plans).toHaveLength(2); // Back to original 2
      expect(finalListResult.data.plans.some((p: any) => p.id === newPlanId)).toBe(false);
    });

    it('should handle plan assignment workflow', async () => {
      // 1. Assign a plan to a user
      const assignRequest = new Request('http://localhost:3000/api/admin/plans/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'user-1',
          plan_id: 'plan-1',
          course_id: 'course-1',
          assignment_reason: 'Integration test assignment',
          billing_cycle: 'monthly',
          auto_renew: true,
          start_trial: true
        })
      }) as NextRequest;

      const assignResponse = await AssignPlanPOST(assignRequest);
      const assignResult = await assignResponse.json();

      expect(assignResponse.status).toBe(201);
      expect(assignResult.success).toBe(true);
      expect(assignResult.data.plan_id).toBe('plan-1');
      expect(assignResult.data.user_id).toBe('user-1');
      expect(assignResult.data.billing_cycle).toBe('monthly');
      expect(assignResult.data.is_trial).toBe(true);

      // 2. Verify assignment appears in mock data
      expect(mockSupabaseData.assignments).toHaveLength(1);
      expect(mockSupabaseData.assignments[0].plan_id).toBe('plan-1');
      expect(mockSupabaseData.assignments[0].user_id).toBe('user-1');
    });
  });

  describe('Public Plan Display Flow', () => {
    it('should retrieve and format public plans correctly', async () => {
      const publicRequest = new Request('http://localhost:3000/api/plans') as NextRequest;
      const publicResponse = await PublicPlansGET(publicRequest);
      const publicResult = await publicResponse.json();

      expect(publicResponse.status).toBe(200);
      expect(publicResult.success).toBe(true);
      expect(publicResult.data.plans).toHaveLength(2);

      // Verify plan data structure for public consumption
      const basicPlan = publicResult.data.plans.find((p: any) => p.tier === 'basic');
      const premiumPlan = publicResult.data.plans.find((p: any) => p.tier === 'premium');

      expect(basicPlan).toBeDefined();
      expect(basicPlan.name).toBe('Basic Plan');
      expect(basicPlan.pricing.monthly_price).toBe(1999);
      expect(basicPlan.trial_enabled).toBe(true);
      expect(basicPlan.trial_duration_days).toBe(7);

      expect(premiumPlan).toBeDefined();
      expect(premiumPlan.name).toBe('Premium Plan');
      expect(premiumPlan.is_featured).toBe(true);
      expect(premiumPlan.trial_duration_days).toBe(14);

      // Verify only active plans are returned
      publicResult.data.plans.forEach((plan: any) => {
        expect(plan.is_active).toBe(true);
      });
    });

    it('should handle trial activation flow', async () => {
      // This would typically involve more complex frontend interaction
      // For integration testing, we verify the API can handle trial requests
      
      const trialRequest = new Request('http://localhost:3000/api/admin/users/user-1/assign-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: 'plan-2',
          course_id: 'course-1',
          assignment_reason: 'User started trial',
          billing_cycle: 'trial',
          auto_renew: true,
          start_trial: true
        })
      }) as NextRequest;

      const trialResponse = await AssignPlanPOST(trialRequest, { params: { userId: 'user-1' } });
      const trialResult = await trialResponse.json();

      expect(trialResponse.status).toBe(201);
      expect(trialResult.success).toBe(true);
      expect(trialResult.data.is_trial).toBe(true);
      expect(trialResult.data.billing_cycle).toBe('trial');

      // Verify trial end date calculation
      expect(trialResult.data.trial_ends_at).toBeDefined();
      const trialEndDate = new Date(trialResult.data.trial_ends_at);
      const expectedEndDate = new Date();
      expectedEndDate.setDate(expectedEndDate.getDate() + 14); // Premium plan has 14-day trial
      
      // Allow for small time differences in test execution
      const timeDiff = Math.abs(trialEndDate.getTime() - expectedEndDate.getTime());
      expect(timeDiff).toBeLessThan(60000); // Less than 1 minute difference
    });
  });

  describe('Data Consistency and Validation', () => {
    it('should maintain referential integrity', async () => {
      // Create a plan
      const createRequest = new Request('http://localhost:3000/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Consistency Test Plan',
          tier: 'basic',
          description: 'Testing data consistency',
          monthly_price: 1999,
          currency: 'EUR',
          trial_enabled: false,
          is_active: true,
          features: {},
          limits: {}
        })
      }) as NextRequest;

      const createResponse = await AdminPlansPOST(createRequest);
      const createResult = await createResponse.json();
      const planId = createResult.data.id;

      // Assign the plan to a user
      const assignRequest = new Request('http://localhost:3000/api/admin/plans/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'user-1',
          plan_id: planId,
          course_id: 'course-1',
          assignment_reason: 'Consistency test',
          billing_cycle: 'monthly',
          auto_renew: false,
          start_trial: false
        })
      }) as NextRequest;

      const assignResponse = await AssignPlanPOST(assignRequest);
      expect(assignResponse.status).toBe(201);

      // Verify assignment references the correct plan
      const assignResult = await assignResponse.json();
      expect(assignResult.data.plan_id).toBe(planId);

      // Verify the plan still exists and has correct data
      const listRequest = new Request('http://localhost:3000/api/admin/plans') as NextRequest;
      const listResponse = await AdminPlansGET(listRequest);
      const listResult = await listResponse.json();
      
      const assignedPlan = listResult.data.plans.find((p: any) => p.id === planId);
      expect(assignedPlan).toBeDefined();
      expect(assignedPlan.name).toBe('Consistency Test Plan');
    });

    it('should validate plan data integrity', async () => {
      // Test with invalid data
      const invalidRequest = new Request('http://localhost:3000/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '', // Invalid: empty name
          tier: 'invalid_tier', // Invalid tier
          monthly_price: -100, // Invalid: negative price
          currency: 'INVALID'
        })
      }) as NextRequest;

      const invalidResponse = await AdminPlansPOST(invalidRequest);
      
      // Should reject invalid data
      expect(invalidResponse.status).toBe(400);
      
      const invalidResult = await invalidResponse.json();
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain('validation');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle non-existent plan operations gracefully', async () => {
      // Try to update non-existent plan
      const updateRequest = new Request('http://localhost:3000/api/admin/plans/non-existent-id', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name' })
      }) as NextRequest;

      const updateResponse = await AdminPlanPUT(updateRequest, { params: { id: 'non-existent-id' } });
      expect(updateResponse.status).toBe(404);

      // Try to delete non-existent plan
      const deleteRequest = new Request('http://localhost:3000/api/admin/plans/non-existent-id', {
        method: 'DELETE'
      }) as NextRequest;

      const deleteResponse = await AdminPlanDELETE(deleteRequest, { params: { id: 'non-existent-id' } });
      expect(deleteResponse.status).toBe(404);
    });

    it('should handle malformed requests appropriately', async () => {
      // Request with malformed JSON
      const malformedRequest = new Request('http://localhost:3000/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      }) as NextRequest;

      const malformedResponse = await AdminPlansPOST(malformedRequest);
      expect(malformedResponse.status).toBe(400);

      const malformedResult = await malformedResponse.json();
      expect(malformedResult.success).toBe(false);
      expect(malformedResult.error).toContain('Invalid JSON');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent plan operations', async () => {
      // Create multiple plans concurrently
      const planPromises = Array.from({ length: 5 }, (_, i) =>
        AdminPlansPOST(new Request('http://localhost:3000/api/admin/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Concurrent Plan ${i + 1}`,
            tier: 'basic',
            description: `Plan created concurrently ${i + 1}`,
            monthly_price: 1999 + (i * 100),
            currency: 'EUR',
            trial_enabled: true,
            is_active: true,
            features: {},
            limits: {}
          })
        }) as NextRequest)
      );

      const responses = await Promise.all(planPromises);
      
      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all plans were created
      const listRequest = new Request('http://localhost:3000/api/admin/plans') as NextRequest;
      const listResponse = await AdminPlansGET(listRequest);
      const listResult = await listResponse.json();

      expect(listResult.data.plans.length).toBeGreaterThanOrEqual(7); // 2 original + 5 new
    });
  });
});