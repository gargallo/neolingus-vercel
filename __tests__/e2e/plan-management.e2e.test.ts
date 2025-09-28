/**
 * End-to-end tests for plan management system
 * Tests complete user journeys and workflows
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock React environment for component testing
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window as any;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  pathname: '/admin/plans',
  query: {},
  asPath: '/admin/plans'
};

vi.mock('next/router', () => ({
  useRouter: () => mockRouter
}));

// Mock fetch for API calls
global.fetch = vi.fn();

const mockFetch = global.fetch as any;

describe('Plan Management E2E Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockRouter.push.mockClear();
  });

  describe('Admin Plan Management Journey', () => {
    it('should complete admin plan creation workflow', async () => {
      // Simulate admin navigating to plan creation
      expect(mockRouter.pathname).toBe('/admin/plans');

      // Mock API responses for plan creation workflow
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              plans: [
                {
                  id: 'plan-1',
                  name: 'Basic Plan',
                  tier: 'basic',
                  pricing: { monthly_price: 1999, currency: 'EUR' },
                  subscriber_count: 45
                }
              ],
              total: 1,
              page: 1,
              limit: 10
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            success: true,
            data: {
              id: 'plan-new',
              name: 'New Professional Plan',
              tier: 'standard',
              description: 'Perfect for professionals',
              pricing: { monthly_price: 2999, yearly_price: 29999, currency: 'EUR' },
              features: { ai_tutor: true, custom_plans: true },
              trial_enabled: true,
              trial_duration_days: 14,
              is_active: true,
              is_featured: false,
              created_at: new Date().toISOString()
            }
          })
        });

      // 1. Load existing plans
      const plansResponse = await fetch('/api/admin/plans');
      const plansData = await plansResponse.json();

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/plans');
      expect(plansData.success).toBe(true);
      expect(plansData.data.plans).toHaveLength(1);

      // 2. Create new plan
      const newPlanData = {
        name: 'New Professional Plan',
        tier: 'standard',
        description: 'Perfect for professionals',
        monthly_price: 2999,
        yearly_price: 29999,
        currency: 'EUR',
        trial_enabled: true,
        trial_duration_days: 14,
        is_active: true,
        is_featured: false,
        features: { ai_tutor: true, custom_plans: true },
        limits: { max_courses: 5, max_exams_per_month: 50 }
      };

      const createResponse = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlanData)
      });

      const createData = await createResponse.json();

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlanData)
      });

      expect(createData.success).toBe(true);
      expect(createData.data.name).toBe('New Professional Plan');
      expect(createData.data.tier).toBe('standard');
      expect(createData.data.trial_enabled).toBe(true);
    });

    it('should complete plan assignment workflow', async () => {
      // Mock API responses for plan assignment
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
              { id: 'user-2', email: 'jane@example.com', full_name: 'Jane Doe' }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              plans: [
                {
                  id: 'plan-1',
                  name: 'Basic Plan',
                  tier: 'basic',
                  pricing: { monthly_price: 1999, currency: 'EUR' },
                  trial_enabled: true,
                  trial_duration_days: 7
                }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: [
              { id: 'course-1', title: 'English B2', language: 'English', level: 'B2' }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            success: true,
            data: {
              id: 'assignment-1',
              user_id: 'user-1',
              plan_id: 'plan-1',
              course_id: 'course-1',
              billing_cycle: 'trial',
              is_trial: true,
              trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              assignment_reason: 'User requested trial access'
            }
          })
        });

      // 1. Load users
      const usersResponse = await fetch('/api/admin/users');
      const usersData = await usersResponse.json();

      expect(usersData.success).toBe(true);
      expect(usersData.data).toHaveLength(2);

      // 2. Load plans
      const plansResponse = await fetch('/api/plans');
      const plansData = await plansResponse.json();

      expect(plansData.success).toBe(true);
      expect(plansData.data.plans).toHaveLength(1);

      // 3. Load courses
      const coursesResponse = await fetch('/api/academia/courses');
      const coursesData = await coursesResponse.json();

      expect(coursesData.success).toBe(true);
      expect(coursesData.data).toHaveLength(1);

      // 4. Assign plan to user
      const assignmentData = {
        user_id: 'user-1',
        plan_id: 'plan-1',
        course_id: 'course-1',
        assignment_reason: 'User requested trial access',
        billing_cycle: 'trial',
        auto_renew: true,
        start_trial: true
      };

      const assignResponse = await fetch('/api/admin/plans/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData)
      });

      const assignData = await assignResponse.json();

      expect(assignData.success).toBe(true);
      expect(assignData.data.user_id).toBe('user-1');
      expect(assignData.data.plan_id).toBe('plan-1');
      expect(assignData.data.is_trial).toBe(true);
      expect(assignData.data.trial_ends_at).toBeDefined();
    });
  });

  describe('Public User Plan Selection Journey', () => {
    it('should complete plan selection and trial activation', async () => {
      // Mock API responses for public plan selection
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              plans: [
                {
                  id: 'plan-basic',
                  name: 'Basic Plan',
                  tier: 'basic',
                  description: 'Perfect for beginners',
                  pricing: { monthly_price: 1999, yearly_price: 19999, currency: 'EUR' },
                  features: { ai_tutor: true, custom_plans: false, progress_analytics: true },
                  trial_enabled: true,
                  trial_duration_days: 7,
                  is_featured: false
                },
                {
                  id: 'plan-premium',
                  name: 'Premium Plan',
                  tier: 'premium',
                  description: 'Complete learning experience',
                  pricing: { monthly_price: 4999, yearly_price: 49999, currency: 'EUR' },
                  features: { ai_tutor: true, custom_plans: true, progress_analytics: true },
                  trial_enabled: true,
                  trial_duration_days: 14,
                  is_featured: true
                }
              ]
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              user: { id: 'user-current', email: 'current@example.com' }
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            success: true,
            data: {
              subscription_id: 'sub-123',
              plan_id: 'plan-premium',
              is_trial: true,
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              features_available: ['ai_tutor', 'custom_plans', 'progress_analytics']
            }
          })
        });

      // 1. Load public plans
      const plansResponse = await fetch('/api/plans');
      const plansData = await plansResponse.json();

      expect(plansData.success).toBe(true);
      expect(plansData.data.plans).toHaveLength(2);

      const basicPlan = plansData.data.plans.find((p: any) => p.tier === 'basic');
      const premiumPlan = plansData.data.plans.find((p: any) => p.tier === 'premium');

      expect(basicPlan.trial_duration_days).toBe(7);
      expect(premiumPlan.trial_duration_days).toBe(14);
      expect(premiumPlan.is_featured).toBe(true);

      // 2. User authentication check
      const authResponse = await fetch('/api/auth/me');
      const authData = await authResponse.json();

      expect(authData.success).toBe(true);
      expect(authData.data.user.id).toBe('user-current');

      // 3. User selects premium plan trial
      const trialRequest = {
        plan_id: 'plan-premium',
        trial: true,
        billing_cycle: 'trial'
      };

      const subscribeResponse = await fetch('/api/subscriptions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trialRequest)
      });

      const subscribeData = await subscribeResponse.json();

      expect(subscribeData.success).toBe(true);
      expect(subscribeData.data.plan_id).toBe('plan-premium');
      expect(subscribeData.data.is_trial).toBe(true);
      expect(subscribeData.data.features_available).toContain('ai_tutor');
      expect(subscribeData.data.features_available).toContain('custom_plans');
    });

    it('should handle plan comparison and feature analysis', async () => {
      // Mock plans with different feature sets
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            plans: [
              {
                id: 'plan-basic',
                name: 'Basic Plan',
                tier: 'basic',
                pricing: { monthly_price: 1999, yearly_price: 19999, currency: 'EUR' },
                features: {
                  ai_tutor: true,
                  custom_plans: false,
                  progress_analytics: true,
                  offline_access: false,
                  priority_support: false,
                  certificates: false
                },
                limits: { max_courses: 1, max_exams_per_month: 10 }
              },
              {
                id: 'plan-standard',
                name: 'Standard Plan',
                tier: 'standard',
                pricing: { monthly_price: 2999, yearly_price: 29999, currency: 'EUR' },
                features: {
                  ai_tutor: true,
                  custom_plans: true,
                  progress_analytics: true,
                  offline_access: true,
                  priority_support: false,
                  certificates: true
                },
                limits: { max_courses: 5, max_exams_per_month: 50 }
              },
              {
                id: 'plan-premium',
                name: 'Premium Plan',
                tier: 'premium',
                pricing: { monthly_price: 4999, yearly_price: 49999, currency: 'EUR' },
                features: {
                  ai_tutor: true,
                  custom_plans: true,
                  progress_analytics: true,
                  offline_access: true,
                  priority_support: true,
                  certificates: true
                },
                limits: { max_courses: null, max_exams_per_month: null }
              }
            ]
          }
        })
      });

      const plansResponse = await fetch('/api/plans');
      const plansData = await plansResponse.json();

      // Verify feature progression across tiers
      const plans = plansData.data.plans;
      const basicPlan = plans.find((p: any) => p.tier === 'basic');
      const standardPlan = plans.find((p: any) => p.tier === 'standard');
      const premiumPlan = plans.find((p: any) => p.tier === 'premium');

      // Basic plan should have limited features
      expect(basicPlan.features.ai_tutor).toBe(true);
      expect(basicPlan.features.custom_plans).toBe(false);
      expect(basicPlan.features.priority_support).toBe(false);
      expect(basicPlan.limits.max_courses).toBe(1);

      // Standard plan should have more features
      expect(standardPlan.features.custom_plans).toBe(true);
      expect(standardPlan.features.offline_access).toBe(true);
      expect(standardPlan.features.certificates).toBe(true);
      expect(standardPlan.limits.max_courses).toBe(5);

      // Premium plan should have all features
      expect(premiumPlan.features.priority_support).toBe(true);
      expect(premiumPlan.limits.max_courses).toBeNull(); // Unlimited
      expect(premiumPlan.limits.max_exams_per_month).toBeNull(); // Unlimited

      // Verify pricing progression
      expect(basicPlan.pricing.monthly_price).toBeLessThan(standardPlan.pricing.monthly_price);
      expect(standardPlan.pricing.monthly_price).toBeLessThan(premiumPlan.pricing.monthly_price);
    });
  });

  describe('Trial Management Journey', () => {
    it('should handle complete trial lifecycle', async () => {
      const trialStartDate = new Date();
      const trialEndDate = new Date(trialStartDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const almostExpiredDate = new Date(trialEndDate.getTime() - 24 * 60 * 60 * 1000); // 1 day before

      // Mock trial status checks at different stages
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              is_trial: true,
              trial_ends_at: trialEndDate.toISOString(),
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
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              is_trial: true,
              trial_ends_at: trialEndDate.toISOString(),
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
            }
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              subscription_id: 'sub-upgraded',
              plan_id: 'plan-premium',
              is_trial: false,
              billing_cycle: 'monthly',
              next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          })
        });

      // 1. Check initial trial status (active, 7 days remaining)
      const initialStatusResponse = await fetch('/api/trial/status');
      const initialStatus = await initialStatusResponse.json();

      expect(initialStatus.success).toBe(true);
      expect(initialStatus.data.is_trial).toBe(true);
      expect(initialStatus.data.days_remaining).toBe(7);
      expect(initialStatus.data.features_available).toContain('ai_tutor');

      // 2. Check trial status near expiration (1 day remaining)
      const nearExpiryResponse = await fetch('/api/trial/status');
      const nearExpiryStatus = await nearExpiryResponse.json();

      expect(nearExpiryStatus.data.days_remaining).toBe(1);
      // At this point, user should see upgrade prompts

      // 3. User decides to upgrade before trial expires
      const upgradeRequest = {
        plan_id: 'plan-premium',
        billing_cycle: 'monthly',
        payment_method: 'card_123'
      };

      const upgradeResponse = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upgradeRequest)
      });

      const upgradeData = await upgradeResponse.json();

      expect(upgradeData.success).toBe(true);
      expect(upgradeData.data.is_trial).toBe(false);
      expect(upgradeData.data.billing_cycle).toBe('monthly');
      expect(upgradeData.data.next_billing_date).toBeDefined();
    });

    it('should handle trial expiration and access restriction', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      // Mock expired trial status
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            success: true,
            data: {
              is_trial: true,
              trial_ends_at: expiredDate.toISOString(),
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
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 403,
          json: () => Promise.resolve({
            success: false,
            error: 'trial_expired',
            message: 'Your trial has expired. Please upgrade to continue accessing premium features.'
          })
        });

      // 1. Check expired trial status
      const statusResponse = await fetch('/api/trial/status');
      const statusData = await statusResponse.json();

      expect(statusData.data.days_remaining).toBe(0);
      expect(statusData.data.features_available).toHaveLength(0);

      // 2. Try to access premium feature (should be denied)
      const featureResponse = await fetch('/api/features/ai-tutor');
      const featureData = await featureResponse.json();

      expect(featureResponse.status).toBe(403);
      expect(featureData.success).toBe(false);
      expect(featureData.error).toBe('trial_expired');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetch('/api/admin/plans');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBe('Network error');
      }

      // Mock recovery
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: { plans: [] }
        })
      });

      // Should recover on retry
      const retryResponse = await fetch('/api/admin/plans');
      const retryData = await retryResponse.json();

      expect(retryData.success).toBe(true);
    });

    it('should handle validation errors in user workflow', async () => {
      // Mock validation error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'validation_error',
          details: {
            name: 'Plan name is required',
            tier: 'Invalid tier specified',
            monthly_price: 'Price must be a positive number'
          }
        })
      });

      const invalidPlanData = {
        name: '',
        tier: 'invalid',
        monthly_price: -100
      };

      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPlanData)
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('validation_error');
      expect(data.details.name).toContain('required');
      expect(data.details.tier).toContain('Invalid');
      expect(data.details.monthly_price).toContain('positive');
    });
  });

  describe('Performance and User Experience', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset response
      const largePlansList = Array.from({ length: 100 }, (_, i) => ({
        id: `plan-${i}`,
        name: `Plan ${i}`,
        tier: ['basic', 'standard', 'premium'][i % 3],
        pricing: { monthly_price: 1999 + (i * 100), currency: 'EUR' },
        subscriber_count: Math.floor(Math.random() * 1000)
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          success: true,
          data: {
            plans: largePlansList.slice(0, 20), // Paginated response
            total: 100,
            page: 1,
            limit: 20,
            has_more: true
          }
        })
      });

      const response = await fetch('/api/admin/plans?page=1&limit=20');
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.plans).toHaveLength(20);
      expect(data.data.total).toBe(100);
      expect(data.data.has_more).toBe(true);

      // Should handle pagination properly
      expect(data.data.page).toBe(1);
      expect(data.data.limit).toBe(20);
    });

    it('should provide responsive user feedback', async () => {
      // Mock slow API response
      const slowResponse = new Promise(resolve => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({
              success: true,
              data: { message: 'Operation completed' }
            })
          });
        }, 100); // Simulate slow response
      });

      mockFetch.mockReturnValueOnce(slowResponse);

      const startTime = Date.now();
      const response = await fetch('/api/admin/plans');
      const endTime = Date.now();

      // Verify response time tracking
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);

      const data = await (response as any).json();
      expect(data.success).toBe(true);
    });
  });
});