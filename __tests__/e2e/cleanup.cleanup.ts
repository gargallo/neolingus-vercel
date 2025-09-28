/**
 * Cleanup after E2E tests
 * Removes test data and resets environment state
 */

import { test as cleanup, expect } from '@playwright/test';
import { E2E_CONFIG, CleanupHelpers, AuthHelpers } from './setup/e2e-test-setup';
import fs from 'fs';
import path from 'path';

cleanup('cleanup test plans', async ({ page }) => {
  // Login as admin to access cleanup functions
  await AuthHelpers.loginAsAdmin(page);
  
  // Clean up any test plans created during E2E tests
  await CleanupHelpers.cleanupTestPlans(page);
  
  console.log('✓ Test plans cleanup complete');
});

cleanup('cleanup test assignments', async ({ page }) => {
  // Clean up any plan assignments created during testing
  await CleanupHelpers.cleanupTestAssignments(page);
  
  console.log('✓ Test assignments cleanup complete');
});

cleanup('reset user trial states', async ({ page }) => {
  // Reset any trial states that were modified during testing
  await CleanupHelpers.resetUserTrials(page);
  
  console.log('✓ User trial states reset complete');
});

cleanup('cleanup authentication files', async ({ page }) => {
  // Remove stored authentication states
  const authFiles = [
    '.auth/admin.json',
    '.auth/user.json'
  ];
  
  for (const authFile of authFiles) {
    if (fs.existsSync(authFile)) {
      fs.unlinkSync(authFile);
      console.log(`✓ Removed ${authFile}`);
    }
  }
  
  console.log('✓ Authentication files cleanup complete');
});

cleanup('cleanup test artifacts', async ({ page }) => {
  // Clean up any test artifacts, screenshots, videos, etc.
  const artifactDirs = [
    'test-results',
    'playwright-report',
    '__tests__/e2e/snapshots'
  ];
  
  for (const dir of artifactDirs) {
    if (fs.existsSync(dir)) {
      // Keep the directories but remove old test files
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        // Remove files older than 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (stats.mtime.getTime() < sevenDaysAgo) {
          if (stats.isDirectory()) {
            fs.rmSync(filePath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(filePath);
          }
        }
      }
    }
  }
  
  console.log('✓ Test artifacts cleanup complete');
});

cleanup('verify cleanup completion', async ({ page }) => {
  // Verify that cleanup was successful
  
  // Check that no test plans remain
  await AuthHelpers.loginAsAdmin(page);
  await page.goto(`${E2E_CONFIG.baseUrl}/admin/plans`);
  
  const testPlanElements = page.locator('[data-testid^="plan-row-"]:has-text("E2E")');
  const testPlanCount = await testPlanElements.count();
  
  expect(testPlanCount).toBe(0);
  
  // Check that no test assignments remain
  await page.goto(`${E2E_CONFIG.baseUrl}/admin/users`);
  
  const testAssignmentElements = page.locator('[data-testid^="assignment-row-"]:has-text("E2E")');
  const testAssignmentCount = await testAssignmentElements.count();
  
  expect(testAssignmentCount).toBe(0);
  
  console.log('✓ Cleanup verification complete');
});

cleanup('generate cleanup report', async ({ page }) => {
  // Generate a cleanup report
  const cleanupReport = {
    timestamp: new Date().toISOString(),
    environment: E2E_CONFIG.baseUrl,
    cleanup_actions: [
      'Test plans removed',
      'Test assignments removed',
      'User trial states reset',
      'Authentication files cleaned',
      'Test artifacts cleaned'
    ],
    status: 'completed'
  };
  
  // Save cleanup report
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results', { recursive: true });
  }
  
  fs.writeFileSync(
    'test-results/cleanup-report.json',
    JSON.stringify(cleanupReport, null, 2)
  );
  
  console.log('✓ Cleanup report generated');
});