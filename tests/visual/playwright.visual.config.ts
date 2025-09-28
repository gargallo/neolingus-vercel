/**
 * Visual Regression Testing Configuration for Playwright
 * Comprehensive setup for dashboard layout visual testing
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const isCI = !!process.env.CI;
const baseURL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './visual',
  timeout: 60000,
  expect: {
    // Visual comparison threshold
    threshold: 0.2,
    // Animation handling
    toHaveScreenshot: {
      threshold: 0.2,
      mode: 'actual',
      animations: 'disabled',
    },
    toMatchScreenshot: {
      threshold: 0.2,
      mode: 'actual',
      animations: 'disabled',
    },
  },
  // Global test settings
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [
    ['html', { open: isCI ? 'never' : 'on-failure' }],
    ['json', { outputFile: 'test-results/visual-results.json' }],
    isCI ? ['github'] : ['list'],
  ],
  use: {
    baseURL,
    // Visual testing specific settings
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Disable animations for consistent screenshots
    reducedMotion: 'reduce',
    // Force specific color scheme for consistency
    colorScheme: 'light',
    // Increase timeout for complex dashboard renders
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  // Test projects for different viewports and browsers
  projects: [
    // Desktop Chrome - Primary testing environment
    {
      name: 'desktop-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    // Desktop Firefox
    {
      name: 'desktop-firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    // Desktop Safari
    {
      name: 'desktop-safari',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
    // Large Desktop (4K monitoring)
    {
      name: 'desktop-large',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
    // Tablet landscape
    {
      name: 'tablet-landscape',
      use: {
        ...devices['iPad Pro landscape'],
        viewport: { width: 1024, height: 768 },
      },
    },
    // Tablet portrait
    {
      name: 'tablet-portrait',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
      },
    },
    // Mobile landscape
    {
      name: 'mobile-landscape',
      use: {
        ...devices['iPhone 12 Pro landscape'],
        viewport: { width: 844, height: 390 },
      },
    },
    // Mobile portrait
    {
      name: 'mobile-portrait',
      use: {
        ...devices['iPhone 12 Pro'],
        viewport: { width: 390, height: 844 },
      },
    },
    // Small mobile (iPhone SE)
    {
      name: 'mobile-small',
      use: {
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 },
      },
    },
    // Dark theme variants (subset of devices)
    {
      name: 'desktop-chrome-dark',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        colorScheme: 'dark',
      },
    },
    {
      name: 'mobile-portrait-dark',
      use: {
        ...devices['iPhone 12 Pro'],
        viewport: { width: 390, height: 844 },
        colorScheme: 'dark',
      },
    },
    // High contrast accessibility testing
    {
      name: 'desktop-high-contrast',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        forcedColors: 'active',
      },
    },
  ],
  // Web server configuration for local testing
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120000,
  },
  // Output directories
  outputDir: 'test-results/visual',
  snapshotDir: 'test-results/visual-snapshots',
});