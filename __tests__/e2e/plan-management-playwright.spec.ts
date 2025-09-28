/**
 * Playwright E2E tests for Plan Management system
 * Tests complete user journeys in real browser environment
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@neolingus.com';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'admin123';
const USER_EMAIL = process.env.TEST_USER_EMAIL || 'user@neolingus.com';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'user123';

test.describe('Plan Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test.describe('Admin Plan Management Workflow', () => {
    test('admin can create, edit, and manage plans', async ({ page }) => {
      // Login as admin
      await loginAsAdmin(page);
      
      // Navigate to admin plans page
      await page.click('[data-testid="admin-nav-plans"]');
      await expect(page).toHaveURL(/\/admin\/plans/);
      
      // Create new plan
      await page.click('[data-testid="create-plan-button"]');
      
      // Fill plan creation form
      await page.fill('[data-testid="plan-name-input"]', 'E2E Test Plan');
      await page.selectOption('[data-testid="plan-tier-select"]', 'premium');
      await page.fill('[data-testid="plan-description-input"]', 'E2E test plan description');
      
      // Switch to pricing tab
      await page.click('[data-testid="pricing-tab"]');
      await page.fill('[data-testid="monthly-price-input"]', '4999');
      await page.fill('[data-testid="yearly-price-input"]', '49999');
      
      // Switch to features tab
      await page.click('[data-testid="features-tab"]');
      await page.check('[data-testid="feature-ai-tutor"]');
      await page.check('[data-testid="feature-custom-plans"]');
      
      // Add custom feature
      await page.fill('[data-testid="custom-feature-name"]', 'E2E Custom Feature');
      await page.fill('[data-testid="custom-feature-desc"]', 'Custom feature for E2E testing');
      await page.click('[data-testid="add-custom-feature"]');
      
      // Switch to settings tab
      await page.click('[data-testid="settings-tab"]');
      await page.check('[data-testid="plan-active-switch"]');
      await page.check('[data-testid="plan-featured-switch"]');
      
      // Save plan
      await page.click('[data-testid="save-plan-button"]');
      
      // Verify plan was created
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      await expect(page.locator('text=E2E Test Plan')).toBeVisible();
      
      // Edit the created plan
      await page.click('[data-testid="plan-menu-E2E Test Plan"] [data-testid="edit-plan"]');
      await page.fill('[data-testid="plan-name-input"]', 'E2E Test Plan - Updated');
      await page.click('[data-testid="save-plan-button"]');
      
      // Verify plan was updated
      await expect(page.locator('text=E2E Test Plan - Updated')).toBeVisible();
      
      // Test plan assignment
      await page.click('[data-testid="assign-plan-button"]');
      
      // Fill assignment form
      await page.selectOption('[data-testid="user-select"]', { label: USER_EMAIL });
      await page.selectOption('[data-testid="plan-select"]', { label: 'E2E Test Plan - Updated' });
      await page.selectOption('[data-testid="course-select"]', { index: 0 });
      await page.fill('[data-testid="assignment-reason"]', 'E2E test assignment');
      
      // Submit assignment
      await page.click('[data-testid="assign-plan-submit"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Verify assignment appears in user assignments
      await page.click('[data-testid="admin-nav-users"]');
      await page.click(`[data-testid="user-row-${USER_EMAIL}"]`);
      await expect(page.locator('text=E2E Test Plan - Updated')).toBeVisible();
    });

    test('admin can view plan analytics and metrics', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Navigate to admin analytics
      await page.click('[data-testid="admin-nav-analytics"]');
      await expect(page).toHaveURL(/\/admin\/analytics/);
      
      // Check plan performance section
      await expect(page.locator('[data-testid="plan-performance-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="subscriber-growth-chart"]')).toBeVisible();
      
      // Check plan comparison metrics
      await expect(page.locator('[data-testid="plan-comparison-table"]')).toBeVisible();
      
      // Filter by date range
      await page.click('[data-testid="date-range-picker"]');
      await page.click('[data-testid="last-30-days"]');
      
      // Verify charts update
      await expect(page.locator('[data-testid="plan-performance-chart"]')).toBeVisible();
      
      // Export analytics data
      await page.click('[data-testid="export-analytics"]');
      await expect(page.locator('[data-testid="export-success-toast"]')).toBeVisible();
    });

    test('admin can manage trial configurations', async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('[data-testid="admin-nav-plans"]');
      
      // Create plan with custom trial settings
      await page.click('[data-testid="create-plan-button"]');
      await page.fill('[data-testid="plan-name-input"]', 'Trial Test Plan');
      
      // Configure trial settings
      await page.click('[data-testid="settings-tab"]');
      await page.check('[data-testid="enable-trial-switch"]');
      await page.fill('[data-testid="trial-duration-input"]', '14');
      
      await page.click('[data-testid="save-plan-button"]');
      
      // Verify trial configuration
      await page.click('[data-testid="plan-menu-Trial Test Plan"] [data-testid="view-details"]');
      await expect(page.locator('text=14-day trial')).toBeVisible();
    });
  });

  test.describe('Public Plan Selection Workflow', () => {
    test('user can view and select plans', async ({ page }) => {
      // Navigate to public plans page
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Wait for plans to load
      await expect(page.locator('[data-testid="plans-grid"]')).toBeVisible();
      
      // Check plan cards are displayed
      const planCards = page.locator('[data-testid^="plan-card-"]');
      await expect(planCards).toHaveCount.greaterThan(0);
      
      // Test billing cycle toggle
      await page.click('[data-testid="billing-cycle-yearly"]');
      await expect(page.locator('[data-testid="yearly-pricing"]').first()).toBeVisible();
      
      await page.click('[data-testid="billing-cycle-monthly"]');
      await expect(page.locator('[data-testid="monthly-pricing"]').first()).toBeVisible();
      
      // Test plan comparison
      await page.click('[data-testid="compare-plans-button"]');
      await expect(page.locator('[data-testid="plan-comparison-modal"]')).toBeVisible();
      
      // Select a plan
      await page.click('[data-testid="plan-card-basic"] [data-testid="select-plan-button"]');
      
      // Should redirect to signup/login if not authenticated
      await expect(page).toHaveURL(/\/(login|signup)/);
    });

    test('authenticated user can start trial', async ({ page }) => {
      // Login as regular user
      await loginAsUser(page);
      
      // Navigate to plans
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Select a plan with trial
      await page.click('[data-testid="plan-card-premium"] [data-testid="start-trial-button"]');
      
      // Confirm trial activation
      await page.click('[data-testid="confirm-trial-button"]');
      
      // Verify trial started
      await expect(page.locator('[data-testid="trial-status-banner"]')).toBeVisible();
      await expect(page.locator('text=trial active')).toBeVisible();
      
      // Check trial details
      await page.click('[data-testid="trial-status-details"]');
      await expect(page.locator('[data-testid="trial-end-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="trial-features-list"]')).toBeVisible();
    });

    test('user can upgrade from trial to paid plan', async ({ page }) => {
      await loginAsUser(page);
      
      // Assuming user has an active trial (from previous test or setup)
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Check trial status
      if (await page.locator('[data-testid="trial-status-banner"]').isVisible()) {
        // Upgrade from trial
        await page.click('[data-testid="upgrade-trial-button"]');
        
        // Select billing cycle
        await page.click('[data-testid="billing-cycle-yearly"]');
        
        // Proceed to payment (mock)
        await page.click('[data-testid="proceed-to-payment"]');
        
        // Mock payment success
        await mockPaymentSuccess(page);
        
        // Verify upgrade
        await expect(page.locator('[data-testid="upgrade-success-toast"]')).toBeVisible();
        await expect(page.locator('[data-testid="active-plan-badge"]')).toBeVisible();
      }
    });
  });

  test.describe('User Plan Management Workflow', () => {
    test('user can view current plan and usage', async ({ page }) => {
      await loginAsUser(page);
      
      // Navigate to user dashboard
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Check current plan display
      await expect(page.locator('[data-testid="current-plan-card"]')).toBeVisible();
      
      // View plan details
      await page.click('[data-testid="view-plan-details"]');
      await expect(page.locator('[data-testid="plan-features-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="usage-statistics"]')).toBeVisible();
      
      // Check billing information
      await page.click('[data-testid="billing-tab"]');
      await expect(page.locator('[data-testid="next-billing-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="billing-history"]')).toBeVisible();
    });

    test('user can manage plan settings', async ({ page }) => {
      await loginAsUser(page);
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Access plan settings
      await page.click('[data-testid="plan-settings-button"]');
      
      // Toggle auto-renewal
      await page.click('[data-testid="auto-renewal-toggle"]');
      await expect(page.locator('[data-testid="settings-saved-toast"]')).toBeVisible();
      
      // Change billing cycle (if applicable)
      if (await page.locator('[data-testid="change-billing-cycle"]').isVisible()) {
        await page.click('[data-testid="change-billing-cycle"]');
        await page.selectOption('[data-testid="new-billing-cycle"]', 'yearly');
        await page.click('[data-testid="confirm-billing-change"]');
        await expect(page.locator('[data-testid="billing-change-success"]')).toBeVisible();
      }
    });

    test('user can cancel subscription', async ({ page }) => {
      await loginAsUser(page);
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Access cancellation
      await page.click('[data-testid="plan-settings-button"]');
      await page.click('[data-testid="cancel-subscription"]');
      
      // Provide cancellation reason
      await page.selectOption('[data-testid="cancellation-reason"]', 'cost');
      await page.fill('[data-testid="cancellation-feedback"]', 'E2E test cancellation');
      
      // Confirm cancellation
      await page.click('[data-testid="confirm-cancellation"]');
      
      // Verify cancellation
      await expect(page.locator('[data-testid="cancellation-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="plan-cancelled-status"]')).toBeVisible();
    });
  });

  test.describe('Trial Management Workflow', () => {
    test('trial countdown and expiration handling', async ({ page }) => {
      await loginAsUser(page);
      
      // Mock trial with 1 day remaining
      await mockTrialExpiringSoon(page);
      
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Check trial warning
      await expect(page.locator('[data-testid="trial-expiring-warning"]')).toBeVisible();
      await expect(page.locator('text=1 day remaining')).toBeVisible();
      
      // Mock trial expiration
      await mockTrialExpired(page);
      await page.reload();
      
      // Check expired trial state
      await expect(page.locator('[data-testid="trial-expired-banner"]')).toBeVisible();
      await expect(page.locator('[data-testid="upgrade-now-button"]')).toBeVisible();
      
      // Verify limited access
      await page.click('[data-testid="restricted-feature"]');
      await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
    });

    test('trial feature restrictions', async ({ page }) => {
      await loginAsUser(page);
      
      // Mock basic trial (limited features)
      await mockBasicTrial(page);
      
      await page.goto(`${BASE_URL}/dashboard/english/b2`);
      
      // Try to access premium feature
      await page.click('[data-testid="ai-tutor-button"]');
      
      // Should show upgrade prompt
      await expect(page.locator('[data-testid="feature-locked-modal"]')).toBeVisible();
      await expect(page.locator('text=Upgrade to access AI Tutor')).toBeVisible();
      
      // Check available features work
      await page.click('[data-testid="basic-practice-button"]');
      await expect(page.locator('[data-testid="practice-interface"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('handles plan assignment errors gracefully', async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('[data-testid="admin-nav-plans"]');
      
      // Mock API error
      await page.route('/api/admin/plans/assign', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Assignment failed' })
        });
      });
      
      // Try to assign plan
      await page.click('[data-testid="assign-plan-button"]');
      await page.selectOption('[data-testid="user-select"]', { index: 0 });
      await page.selectOption('[data-testid="plan-select"]', { index: 0 });
      await page.click('[data-testid="assign-plan-submit"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-toast"]')).toBeVisible();
      await expect(page.locator('text=Assignment failed')).toBeVisible();
    });

    test('handles payment failures during upgrade', async ({ page }) => {
      await loginAsUser(page);
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Start upgrade process
      await page.click('[data-testid="upgrade-plan-button"]');
      await page.click('[data-testid="proceed-to-payment"]');
      
      // Mock payment failure
      await mockPaymentFailure(page);
      
      // Verify error handling
      await expect(page.locator('[data-testid="payment-error-modal"]')).toBeVisible();
      await expect(page.locator('text=Payment failed')).toBeVisible();
      
      // User should remain on current plan
      await page.click('[data-testid="close-error-modal"]');
      await expect(page.locator('[data-testid="current-plan-unchanged"]')).toBeVisible();
    });

    test('handles concurrent plan modifications', async ({ page, browser }) => {
      // Create two admin sessions
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      
      // Login both sessions
      await loginAsAdmin(page1);
      await loginAsAdmin(page2);
      
      // Navigate to same plan edit
      await page1.goto(`${BASE_URL}/admin/plans`);
      await page2.goto(`${BASE_URL}/admin/plans`);
      
      await page1.click('[data-testid="edit-plan-basic"]');
      await page2.click('[data-testid="edit-plan-basic"]');
      
      // Both modify the plan
      await page1.fill('[data-testid="plan-name-input"]', 'Modified by Admin 1');
      await page2.fill('[data-testid="plan-name-input"]', 'Modified by Admin 2');
      
      // First saves successfully
      await page1.click('[data-testid="save-plan-button"]');
      await expect(page1.locator('[data-testid="success-toast"]')).toBeVisible();
      
      // Second should get conflict error
      await page2.click('[data-testid="save-plan-button"]');
      await expect(page2.locator('[data-testid="conflict-error"]')).toBeVisible();
      
      await context1.close();
      await context2.close();
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('plan management pages load within performance budgets', async ({ page }) => {
      // Monitor performance
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/dashboard`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 second budget
      
      // Check Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise(resolve => {
          new PerformanceObserver(list => {
            const entries = list.getEntries();
            resolve(entries);
          }).observe({ entryTypes: ['measure', 'navigation'] });
        });
      });
      
      expect(metrics).toBeDefined();
    });

    test('plan forms are accessible via keyboard navigation', async ({ page }) => {
      await loginAsAdmin(page);
      await page.click('[data-testid="admin-nav-plans"]');
      await page.click('[data-testid="create-plan-button"]');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="plan-name-input"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="plan-tier-select"]')).toBeFocused();
      
      // Test tab switching via keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Should switch to pricing tab
      
      await expect(page.locator('[data-testid="monthly-price-input"]')).toBeVisible();
    });

    test('plans display correctly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Check mobile-responsive plan cards
      const planCards = page.locator('[data-testid^="plan-card-"]');
      await expect(planCards.first()).toBeVisible();
      
      // Check mobile navigation
      await page.click('[data-testid="mobile-menu-trigger"]');
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Test plan selection on mobile
      await page.click('[data-testid="plan-card-basic"] [data-testid="select-plan-button"]');
      await expect(page).toHaveURL(/\/(login|signup)/);
    });
  });
});

// Helper functions
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[data-testid="email-input"]', ADMIN_EMAIL);
  await page.fill('[data-testid="password-input"]', ADMIN_PASSWORD);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/\/admin/);
}

async function loginAsUser(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('[data-testid="email-input"]', USER_EMAIL);
  await page.fill('[data-testid="password-input"]', USER_PASSWORD);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/\/dashboard/);
}

async function mockPaymentSuccess(page: Page) {
  await page.route('/api/payments/process', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({ success: true, transaction_id: 'test_txn_123' })
    });
  });
}

async function mockPaymentFailure(page: Page) {
  await page.route('/api/payments/process', route => {
    route.fulfill({
      status: 400,
      body: JSON.stringify({ error: 'Payment failed', code: 'card_declined' })
    });
  });
}

async function mockTrialExpiringSoon(page: Page) {
  await page.route('/api/academia/user/trial-status', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        is_trial: true,
        trial_ends_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        days_remaining: 1,
        plan_name: 'Premium Plan',
        plan_tier: 'premium'
      })
    });
  });
}

async function mockTrialExpired(page: Page) {
  await page.route('/api/academia/user/trial-status', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        is_trial: true,
        trial_ends_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        days_remaining: 0,
        plan_name: 'Premium Plan',
        plan_tier: 'premium',
        expired: true
      })
    });
  });
}

async function mockBasicTrial(page: Page) {
  await page.route('/api/academia/user/trial-status', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify({
        is_trial: true,
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        days_remaining: 7,
        plan_name: 'Basic Plan',
        plan_tier: 'basic',
        features_available: ['basic_practice', 'progress_tracking'],
        features_restricted: ['ai_tutor', 'custom_plans', 'priority_support']
      })
    });
  });
}