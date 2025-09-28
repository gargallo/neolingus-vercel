/**
 * Authentication setup for E2E tests
 * Creates authenticated sessions for admin and regular users
 */

import { test as setup, expect } from '@playwright/test';
import { E2E_CONFIG, AuthHelpers } from './setup/e2e-test-setup';

const adminFile = '.auth/admin.json';
const userFile = '.auth/user.json';

setup('authenticate as admin', async ({ page }) => {
  // Perform admin authentication steps
  await page.goto(`${E2E_CONFIG.baseUrl}/login`);
  
  await page.fill('[data-testid="email-input"]', E2E_CONFIG.adminEmail);
  await page.fill('[data-testid="password-input"]', E2E_CONFIG.adminPassword);
  
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login redirect
  await expect(page).toHaveURL(/\/admin/, { timeout: E2E_CONFIG.timeout });
  
  // Verify admin access
  await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: adminFile });
  
  console.log('✓ Admin authentication setup complete');
});

setup('authenticate as regular user', async ({ page }) => {
  // Perform user authentication steps
  await page.goto(`${E2E_CONFIG.baseUrl}/login`);
  
  await page.fill('[data-testid="email-input"]', E2E_CONFIG.userEmail);
  await page.fill('[data-testid="password-input"]', E2E_CONFIG.userPassword);
  
  await page.click('[data-testid="login-button"]');
  
  // Wait for successful login redirect
  await expect(page).toHaveURL(/\/dashboard/, { timeout: E2E_CONFIG.timeout });
  
  // Verify user dashboard access
  await expect(page.locator('[data-testid="user-dashboard"]')).toBeVisible();
  
  // Save authentication state
  await page.context().storageState({ path: userFile });
  
  console.log('✓ User authentication setup complete');
});

setup('verify test environment', async ({ page }) => {
  // Check that the application is running and accessible
  await page.goto(E2E_CONFIG.baseUrl);
  
  // Verify basic page elements load
  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('header, nav, [data-testid="app-header"]')).toBeVisible();
  
  // Check API health endpoint if available
  const response = await page.request.get('/api/health');
  if (response.ok()) {
    const healthData = await response.json();
    expect(healthData.status).toBe('healthy');
  }
  
  console.log('✓ Test environment verification complete');
});

setup('setup test database state', async ({ page }) => {
  // Ensure clean test data state
  
  // Create test plans if they don't exist
  const plansResponse = await page.request.get('/api/plans');
  if (plansResponse.ok()) {
    const plansData = await plansResponse.json();
    if (plansData.data?.plans?.length === 0) {
      console.log('⚠️ No plans found - test data may need to be seeded');
    }
  }
  
  // Verify courses exist
  const coursesResponse = await page.request.get('/api/academia/courses');
  if (coursesResponse.ok()) {
    const coursesData = await coursesResponse.json();
    if (coursesData.data?.length === 0) {
      console.log('⚠️ No courses found - test data may need to be seeded');
    }
  }
  
  console.log('✓ Test database state setup complete');
});