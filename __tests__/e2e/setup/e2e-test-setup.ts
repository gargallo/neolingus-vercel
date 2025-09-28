/**
 * E2E Test Setup and Utilities
 * Provides common setup, mock data, and helper functions for E2E tests
 */

import { Page, Browser, BrowserContext } from '@playwright/test';

// Test environment configuration
export const E2E_CONFIG = {
  baseUrl: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
  adminEmail: process.env.TEST_ADMIN_EMAIL || 'admin@neolingus.com',
  adminPassword: process.env.TEST_ADMIN_PASSWORD || 'admin123',
  userEmail: process.env.TEST_USER_EMAIL || 'user@neolingus.com',
  userPassword: process.env.TEST_USER_PASSWORD || 'user123',
  timeout: 30000,
  retries: 2
};

// Mock data for consistent testing
export const mockPlanData = {
  basic: {
    id: 'plan-basic',
    name: 'Basic Plan',
    tier: 'basic',
    description: 'Perfect for beginners',
    pricing: { monthly_price: 1999, yearly_price: 19999, currency: 'EUR' },
    features: { ai_tutor: true, custom_plans: false, progress_analytics: true },
    trial_enabled: true,
    trial_duration_days: 7,
    is_active: true,
    is_featured: false
  },
  standard: {
    id: 'plan-standard',
    name: 'Standard Plan',
    tier: 'standard',
    description: 'For serious learners',
    pricing: { monthly_price: 2999, yearly_price: 29999, currency: 'EUR' },
    features: { ai_tutor: true, custom_plans: true, progress_analytics: true },
    trial_enabled: true,
    trial_duration_days: 10,
    is_active: true,
    is_featured: false
  },
  premium: {
    id: 'plan-premium',
    name: 'Premium Plan',
    tier: 'premium',
    description: 'Complete learning experience',
    pricing: { monthly_price: 4999, yearly_price: 49999, currency: 'EUR' },
    features: { ai_tutor: true, custom_plans: true, progress_analytics: true, priority_support: true },
    trial_enabled: true,
    trial_duration_days: 14,
    is_active: true,
    is_featured: true
  }
};

export const mockUserData = {
  admin: {
    id: 'admin-1',
    email: 'admin@neolingus.com',
    full_name: 'Admin User',
    role: 'admin'
  },
  regular: {
    id: 'user-1',
    email: 'user@neolingus.com',
    full_name: 'Regular User',
    role: 'user'
  }
};

export const mockCourseData = [
  {
    id: 'course-1',
    title: 'English B2 Preparation',
    language: 'English',
    level: 'B2',
    description: 'Comprehensive B2 level preparation'
  },
  {
    id: 'course-2',
    title: 'Valenciano B2',
    language: 'Valenciano',
    level: 'B2',
    description: 'Valenciano language preparation'
  }
];

// Authentication helpers
export class AuthHelpers {
  static async loginAsAdmin(page: Page): Promise<void> {
    await page.goto(`${E2E_CONFIG.baseUrl}/login`);
    await page.fill('[data-testid="email-input"]', E2E_CONFIG.adminEmail);
    await page.fill('[data-testid="password-input"]', E2E_CONFIG.adminPassword);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/admin/, { timeout: E2E_CONFIG.timeout });
  }

  static async loginAsUser(page: Page): Promise<void> {
    await page.goto(`${E2E_CONFIG.baseUrl}/login`);
    await page.fill('[data-testid="email-input"]', E2E_CONFIG.userEmail);
    await page.fill('[data-testid="password-input"]', E2E_CONFIG.userPassword);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/dashboard/, { timeout: E2E_CONFIG.timeout });
  }

  static async logout(page: Page): Promise<void> {
    if (await page.locator('[data-testid="user-menu"]').isVisible()) {
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      await page.waitForURL(/\/(login|home)/, { timeout: E2E_CONFIG.timeout });
    }
  }

  static async ensureLoggedOut(page: Page): Promise<void> {
    await page.goto(E2E_CONFIG.baseUrl);
    if (await page.locator('[data-testid="user-menu"]').isVisible()) {
      await this.logout(page);
    }
  }
}

// API Mock helpers
export class ApiMockHelpers {
  static async mockSuccessfulPlanCreation(page: Page): Promise<void> {
    await page.route('/api/admin/plans', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            success: true,
            data: {
              ...mockPlanData.premium,
              id: 'plan-new-' + Date.now(),
              created_at: new Date().toISOString()
            }
          })
        });
      } else {
        route.continue();
      }
    });
  }

  static async mockPlanAssignmentSuccess(page: Page): Promise<void> {
    await page.route('/api/admin/plans/assign', (route) => {
      route.fulfill({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {
            id: 'assignment-' + Date.now(),
            user_id: mockUserData.regular.id,
            plan_id: mockPlanData.basic.id,
            course_id: mockCourseData[0].id,
            is_trial: true,
            trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            assignment_reason: 'E2E test assignment'
          }
        })
      });
    });
  }

  static async mockTrialActivation(page: Page, planId: string): Promise<void> {
    await page.route('/api/academia/trials/activate', (route) => {
      route.fulfill({
        status: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {
            subscription_id: 'sub-trial-' + Date.now(),
            plan_id: planId,
            is_trial: true,
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            features_available: Object.keys(mockPlanData.premium.features).filter(
              key => mockPlanData.premium.features[key as keyof typeof mockPlanData.premium.features]
            )
          }
        })
      });
    });
  }

  static async mockPaymentSuccess(page: Page): Promise<void> {
    await page.route('/api/payments/process', (route) => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {
            transaction_id: 'txn_test_' + Date.now(),
            amount: 4999,
            currency: 'EUR',
            status: 'succeeded'
          }
        })
      });
    });
  }

  static async mockPaymentFailure(page: Page, errorCode = 'card_declined'): Promise<void> {
    await page.route('/api/payments/process', (route) => {
      route.fulfill({
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: 'payment_failed',
          details: {
            code: errorCode,
            message: 'Your card was declined'
          }
        })
      });
    });
  }

  static async mockTrialStatus(page: Page, options: {
    isActive: boolean;
    daysRemaining: number;
    planTier: string;
  }): Promise<void> {
    const { isActive, daysRemaining, planTier } = options;
    const endDate = new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000);

    await page.route('/api/academia/user/trial-status', (route) => {
      route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          data: {
            is_trial: isActive,
            trial_ends_at: endDate.toISOString(),
            days_remaining: Math.max(0, daysRemaining),
            plan_name: `${planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan`,
            plan_tier: planTier,
            features_available: daysRemaining > 0 ? ['ai_tutor', 'progress_analytics'] : [],
            course_info: mockCourseData[0]
          }
        })
      });
    });
  }

  static async mockApiError(page: Page, endpoint: string, statusCode = 500, errorMessage = 'Internal server error'): Promise<void> {
    await page.route(endpoint, (route) => {
      route.fulfill({
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString()
        })
      });
    });
  }
}

// UI Interaction helpers
export class UIHelpers {
  static async fillPlanForm(page: Page, planData: Partial<typeof mockPlanData.basic>): Promise<void> {
    // Basic info
    if (planData.name) {
      await page.fill('[data-testid="plan-name-input"]', planData.name);
    }
    if (planData.tier) {
      await page.selectOption('[data-testid="plan-tier-select"]', planData.tier);
    }
    if (planData.description) {
      await page.fill('[data-testid="plan-description-input"]', planData.description);
    }

    // Pricing tab
    if (planData.pricing) {
      await page.click('[data-testid="pricing-tab"]');
      if (planData.pricing.monthly_price) {
        await page.fill('[data-testid="monthly-price-input"]', planData.pricing.monthly_price.toString());
      }
      if (planData.pricing.yearly_price) {
        await page.fill('[data-testid="yearly-price-input"]', planData.pricing.yearly_price.toString());
      }
      if (planData.pricing.currency) {
        await page.selectOption('[data-testid="currency-select"]', planData.pricing.currency);
      }
    }

    // Features tab
    if (planData.features) {
      await page.click('[data-testid="features-tab"]');
      for (const [feature, enabled] of Object.entries(planData.features)) {
        const checkbox = `[data-testid="feature-${feature.replace('_', '-')}"]`;
        if (enabled) {
          await page.check(checkbox);
        } else {
          await page.uncheck(checkbox);
        }
      }
    }

    // Settings tab
    await page.click('[data-testid="settings-tab"]');
    if (planData.is_active !== undefined) {
      const toggle = '[data-testid="plan-active-switch"]';
      if (planData.is_active) {
        await page.check(toggle);
      } else {
        await page.uncheck(toggle);
      }
    }
    if (planData.is_featured !== undefined) {
      const toggle = '[data-testid="plan-featured-switch"]';
      if (planData.is_featured) {
        await page.check(toggle);
      } else {
        await page.uncheck(toggle);
      }
    }
    if (planData.trial_enabled !== undefined) {
      const toggle = '[data-testid="enable-trial-switch"]';
      if (planData.trial_enabled) {
        await page.check(toggle);
        if (planData.trial_duration_days) {
          await page.fill('[data-testid="trial-duration-input"]', planData.trial_duration_days.toString());
        }
      } else {
        await page.uncheck(toggle);
      }
    }
  }

  static async fillAssignmentForm(page: Page, assignment: {
    userEmail: string;
    planName: string;
    courseTitle: string;
    reason: string;
  }): Promise<void> {
    await page.selectOption('[data-testid="user-select"]', { label: assignment.userEmail });
    await page.selectOption('[data-testid="plan-select"]', { label: assignment.planName });
    await page.selectOption('[data-testid="course-select"]', { label: assignment.courseTitle });
    await page.fill('[data-testid="assignment-reason"]', assignment.reason);
  }

  static async waitForToast(page: Page, type: 'success' | 'error', message?: string): Promise<void> {
    const toastSelector = `[data-testid="${type}-toast"]`;
    await page.waitForSelector(toastSelector, { timeout: E2E_CONFIG.timeout });
    
    if (message) {
      await page.waitForSelector(`${toastSelector}:has-text("${message}")`, { timeout: E2E_CONFIG.timeout });
    }
  }

  static async dismissToast(page: Page): Promise<void> {
    const dismissButton = '[data-testid="toast-dismiss"]';
    if (await page.locator(dismissButton).isVisible()) {
      await page.click(dismissButton);
    }
  }

  static async expectLoadingState(page: Page, selector: string): Promise<void> {
    await page.waitForSelector(`${selector}[data-loading="true"]`, { timeout: 5000 });
  }

  static async expectNoLoadingState(page: Page, selector: string): Promise<void> {
    await page.waitForSelector(`${selector}[data-loading="false"]`, { timeout: E2E_CONFIG.timeout });
  }
}

// Performance monitoring helpers
export class PerformanceHelpers {
  static async measurePageLoad(page: Page, url: string): Promise<number> {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  static async getCoreWebVitals(page: Page): Promise<any> {
    return await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {} as any;
        let metricsCount = 0;
        const expectedMetrics = 3; // LCP, FID, CLS

        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'largest-contentful-paint') {
              vitals.LCP = entry.startTime;
              metricsCount++;
            } else if (entry.name === 'first-input') {
              vitals.FID = entry.processingStart - entry.startTime;
              metricsCount++;
            } else if (entry.name === 'cumulative-layout-shift') {
              vitals.CLS = entry.value;
              metricsCount++;
            }

            if (metricsCount >= expectedMetrics) {
              resolve(vitals);
            }
          });
        });

        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

        // Fallback timeout
        setTimeout(() => {
          resolve(vitals);
        }, 5000);
      });
    });
  }

  static async measureApiResponseTime(page: Page, apiEndpoint: string): Promise<number> {
    let responseTime = 0;

    await page.route(apiEndpoint, async (route) => {
      const startTime = Date.now();
      const response = await route.fetch();
      responseTime = Date.now() - startTime;
      route.fulfill({ response });
    });

    return responseTime;
  }
}

// Accessibility testing helpers
export class AccessibilityHelpers {
  static async checkKeyboardNavigation(page: Page, selectors: string[]): Promise<void> {
    for (const selector of selectors) {
      await page.keyboard.press('Tab');
      await page.waitForFunction(
        (sel) => document.activeElement?.matches(sel),
        selector,
        { timeout: 1000 }
      );
    }
  }

  static async checkAriaLabels(page: Page, requiredLabels: string[]): Promise<void> {
    for (const label of requiredLabels) {
      const element = await page.locator(`[aria-label="${label}"]`);
      await element.isVisible();
    }
  }

  static async checkColorContrast(page: Page): Promise<boolean> {
    return await page.evaluate(() => {
      // Simple color contrast check
      const elements = document.querySelectorAll('*');
      let hasIssues = false;

      elements.forEach((el) => {
        const styles = window.getComputedStyle(el);
        const backgroundColor = styles.backgroundColor;
        const color = styles.color;
        
        // Basic contrast ratio calculation would go here
        // This is a simplified version for demonstration
        if (color && backgroundColor && color !== 'rgb(0, 0, 0)' && backgroundColor !== 'rgba(0, 0, 0, 0)') {
          // Simplified check - in real implementation, calculate actual contrast ratio
          const isLowContrast = color === backgroundColor;
          if (isLowContrast) {
            hasIssues = true;
          }
        }
      });

      return !hasIssues;
    });
  }
}

// Test data cleanup helpers
export class CleanupHelpers {
  static async cleanupTestPlans(page: Page): Promise<void> {
    // Clean up any plans created during testing
    await page.goto(`${E2E_CONFIG.baseUrl}/admin/plans`);
    
    const testPlanRows = page.locator('[data-testid^="plan-row-"]:has-text("E2E")');
    const count = await testPlanRows.count();
    
    for (let i = 0; i < count; i++) {
      await testPlanRows.nth(i).locator('[data-testid="delete-plan"]').click();
      await page.click('[data-testid="confirm-delete"]');
      await UIHelpers.waitForToast(page, 'success');
    }
  }

  static async cleanupTestAssignments(page: Page): Promise<void> {
    // Clean up any assignments created during testing
    await page.goto(`${E2E_CONFIG.baseUrl}/admin/users`);
    
    const testAssignmentRows = page.locator('[data-testid^="assignment-row-"]:has-text("E2E")');
    const count = await testAssignmentRows.count();
    
    for (let i = 0; i < count; i++) {
      await testAssignmentRows.nth(i).locator('[data-testid="revoke-assignment"]').click();
      await page.click('[data-testid="confirm-revoke"]');
      await UIHelpers.waitForToast(page, 'success');
    }
  }

  static async resetUserTrials(page: Page): Promise<void> {
    // Reset any trial states created during testing
    await ApiMockHelpers.mockTrialStatus(page, {
      isActive: false,
      daysRemaining: 0,
      planTier: 'basic'
    });
  }
}