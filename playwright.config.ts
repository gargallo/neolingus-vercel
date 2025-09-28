import { defineConfig, devices } from '@playwright/test'

/**
 * Enhanced Playwright Configuration for Cross-Browser Compatibility Testing
 * Supports multiple browsers, devices, and testing scenarios
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Enhanced reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
    ['line'],
    // Custom browser compatibility reporter (will be created)
    // ['./tests/browser-compatibility/reporters/compatibility-reporter.ts'],
  ],
  
  // Global test timeout
  globalTimeout: process.env.CI ? 60 * 60 * 1000 : 30 * 60 * 1000,
  
  // Expect timeout for assertions
  expect: {
    timeout: 5000,
    toHaveScreenshot: {
      threshold: 0.5,
      animations: 'disabled'
    }
  },
  
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Performance and timing settings
    navigationTimeout: 15000,
    actionTimeout: 10000,
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    acceptDownloads: true,
    
    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'Europe/Madrid',
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
    
    // User agent
    userAgent: 'Mozilla/5.0 (compatible; PlaywrightTests/1.0)',
    
    // Testing credentials (for authenticated tests)
    storageState: process.env.CI ? undefined : '.auth/user.json'
  },

  projects: [
    // Setup project for authentication
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
      teardown: 'cleanup'
    },

    // Cleanup project
    {
      name: 'cleanup',
      testMatch: '**/cleanup.cleanup.ts'
    },

    // Desktop Browser Testing Projects
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
      dependencies: ['setup'],
      testDir: './tests/browser-compatibility/desktop',
    },
    {
      name: 'chromium-desktop-previous',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome-beta',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
      dependencies: ['setup'],
      testDir: './tests/browser-compatibility/desktop',
    },
    {
      name: 'firefox-desktop',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'dom.push.enabled': false
          }
        }
      },
      dependencies: ['setup'],
      testDir: './tests/browser-compatibility/desktop',
    },
    {
      name: 'webkit-desktop',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
      dependencies: ['setup'],
      testDir: './tests/browser-compatibility/desktop',
    },
    {
      name: 'edge-desktop',
      use: {
        ...devices['Desktop Edge'],
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        channel: 'msedge'
      },
      dependencies: ['setup'],
      testDir: './tests/browser-compatibility/desktop',
    },

    // Mobile Browser Testing Projects
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
        hasTouch: true,
        isMobile: true,
      },
      dependencies: ['setup'],
      testDir: './tests/browser-compatibility/mobile',
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
      dependencies: ['setup'],
      testDir: './tests/browser-compatibility/mobile',
    },
    {
      name: 'mobile-safari-landscape',
      use: {
        ...devices['iPhone 12 landscape'],
        hasTouch: true,
        isMobile: true,
      },
      dependencies: ['setup'],
      testDir: './tests/browser-compatibility/mobile',
    },

    // Tablet Testing Projects
    {
      name: 'tablet-chrome',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 1024, height: 1366 },
        hasTouch: true,
        isMobile: false,
      },
      dependencies: ['setup'],
      testDir: './tests/browser-compatibility/tablet',
    },
    {
      name: 'tablet-safari',
      use: {
        ...devices['iPad Pro landscape'],
        hasTouch: true,
        isMobile: false,
      },
      dependencies: ['setup'],
      testDir: './tests/browser-compatibility/tablet',
    },

    // Accessibility Testing Projects
    {
      name: 'accessibility-chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // Force reduced motion for accessibility testing
        reducedMotion: 'reduce',
        forcedColors: 'active',
      },
      dependencies: ['setup'],
      testDir: './tests/browser-compatibility/accessibility',
    },

    // Legacy E2E tests compatibility
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
      dependencies: ['setup'],
      testDir: './__tests__/e2e',
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'dom.push.enabled': false
          }
        }
      },
      dependencies: ['setup'],
      testDir: './__tests__/e2e',
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari']
      },
      dependencies: ['setup'],
      testDir: './__tests__/e2e',
    },

    // Mobile browsers for E2E
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5']
      },
      dependencies: ['setup'],
      testDir: './__tests__/e2e',
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12']
      },
      dependencies: ['setup'],
      testDir: './__tests__/e2e',
    },

    // Microsoft Edge for E2E
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge'
      },
      dependencies: ['setup'],
      testDir: './__tests__/e2e',
    }
  ],

  // Test patterns
  testMatch: [
    '**/*.spec.ts',
    '**/*.e2e.test.ts'
  ],
  
  // Files to ignore
  testIgnore: [
    '**/*.component.test.ts',
    '**/*.unit.test.ts',
    '**/*.api.test.ts',
    '**/*.setup.ts',
    '**/*.cleanup.ts'
  ],
  
  // Output directory for test results
  outputDir: 'test-results/',
  
  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe'
  },
  
  // Custom metadata
  metadata: {
    project: 'Neolingus Plan Management E2E Tests',
    version: '1.0.0',
    description: 'Comprehensive end-to-end tests for plan management functionality'
  },
  
  // Maximum failures before stopping
  maxFailures: process.env.CI ? 10 : undefined,
  
  // Update snapshots setting
  updateSnapshots: 'missing',
  
  // Snapshot directory
  snapshotDir: '__tests__/e2e/snapshots'
})