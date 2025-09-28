import { test, expect, Page } from '@playwright/test';

/**
 * Visual Regression Testing for Cross-Browser Compatibility
 * Captures and compares screenshots across different browsers
 */

test.describe('Visual Regression - Cross Browser', () => {
  const viewports = [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 1366, height: 768, name: 'laptop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' },
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="modern-dashboard"]', { timeout: 10000 });

    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          transform-origin: top left !important;
          scroll-behavior: auto !important;
        }
      `,
    });

    // Wait for any remaining animations to complete
    await page.waitForTimeout(500);
  });

  test('Dashboard full page visual comparison @visual', async ({ page, browserName }) => {
    // Set standard viewport for comparison
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Hide dynamic content that changes between runs
    await page.addStyleTag({
      content: `
        [data-testid="current-time"],
        .time-display,
        .last-activity,
        .notification-badge {
          visibility: hidden !important;
        }
      `,
    });

    // Wait for fonts to load
    await page.waitForFunction(() => document.fonts.ready);

    // Take full page screenshot
    await expect(page).toHaveScreenshot(`dashboard-full-${browserName}.png`, {
      fullPage: true,
      threshold: 0.2,
      animations: 'disabled',
    });
  });

  test('Dashboard components individual comparison @visual-components', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for fonts to load
    await page.waitForFunction(() => document.fonts.ready);

    // Hero section
    const heroSection = page.locator('[data-testid="hero-section"], .student-hero-section');
    if (await heroSection.count() > 0) {
      await expect(heroSection.first()).toHaveScreenshot(`hero-section-${browserName}.png`, {
        threshold: 0.2,
        animations: 'disabled',
      });
    }

    // Stats cards
    const statsCards = page.locator('[data-testid="dashboard-stats"]');
    if (await statsCards.count() > 0) {
      await expect(statsCards.first()).toHaveScreenshot(`stats-cards-${browserName}.png`, {
        threshold: 0.2,
        animations: 'disabled',
      });
    }

    // Individual dashboard widgets
    const widgets = page.locator('[data-testid="dashboard-widget"], .dashboard-card');
    const widgetCount = await widgets.count();

    for (let i = 0; i < Math.min(widgetCount, 6); i++) {
      const widget = widgets.nth(i);
      if (await widget.isVisible()) {
        await expect(widget).toHaveScreenshot(`widget-${i}-${browserName}.png`, {
          threshold: 0.2,
          animations: 'disabled',
        });
      }
    }

    // Layout controls
    const layoutControls = page.locator('[data-testid="layout-controls"], .layout-switcher');
    if (await layoutControls.count() > 0) {
      await expect(layoutControls.first()).toHaveScreenshot(`layout-controls-${browserName}.png`, {
        threshold: 0.2,
        animations: 'disabled',
      });
    }
  });

  for (const viewport of viewports) {
    test(`Dashboard responsive layout ${viewport.name} @visual-responsive`, async ({ page, browserName }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      // Wait for layout to settle
      await page.waitForTimeout(500);
      await page.waitForFunction(() => document.fonts.ready);

      // Hide dynamic content
      await page.addStyleTag({
        content: `
          [data-testid="current-time"],
          .time-display,
          .last-activity,
          .notification-badge {
            visibility: hidden !important;
          }
        `,
      });

      await expect(page).toHaveScreenshot(`dashboard-${viewport.name}-${browserName}.png`, {
        fullPage: true,
        threshold: 0.3, // More lenient for responsive layouts
        animations: 'disabled',
      });
    });
  }

  test('Dashboard dark mode visual comparison @visual-dark', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Enable dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });

    // Wait for theme to apply
    await page.waitForTimeout(300);
    await page.waitForFunction(() => document.fonts.ready);

    // Hide dynamic content
    await page.addStyleTag({
      content: `
        [data-testid="current-time"],
        .time-display,
        .last-activity,
        .notification-badge {
          visibility: hidden !important;
        }
      `,
    });

    await expect(page).toHaveScreenshot(`dashboard-dark-${browserName}.png`, {
      fullPage: true,
      threshold: 0.2,
      animations: 'disabled',
    });
  });

  test('Dashboard widget hover states @visual-interactive', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForFunction(() => document.fonts.ready);

    const interactiveCards = page.locator('.dashboard-card, [data-testid="dashboard-widget"]');
    const cardCount = await interactiveCards.count();

    if (cardCount > 0) {
      const firstCard = interactiveCards.first();

      // Normal state
      await expect(firstCard).toHaveScreenshot(`card-normal-${browserName}.png`, {
        threshold: 0.2,
        animations: 'disabled',
      });

      // Hover state
      await firstCard.hover();
      await page.waitForTimeout(100);

      await expect(firstCard).toHaveScreenshot(`card-hover-${browserName}.png`, {
        threshold: 0.2,
        animations: 'disabled',
      });

      // Focus state
      await firstCard.focus();
      await page.waitForTimeout(100);

      await expect(firstCard).toHaveScreenshot(`card-focus-${browserName}.png`, {
        threshold: 0.2,
        animations: 'disabled',
      });
    }
  });

  test('Dashboard loading states @visual-loading', async ({ page, browserName }) => {
    // Intercept API calls to simulate loading states
    await page.route('**/api/dashboard/**', async (route) => {
      // Delay response to capture loading state
      await page.waitForTimeout(1000);
      route.continue();
    });

    await page.goto('/dashboard');

    // Capture loading state
    await page.waitForSelector('[data-testid="loading"], .skeleton, .dashboard-skeleton', { timeout: 2000 });

    await expect(page).toHaveScreenshot(`dashboard-loading-${browserName}.png`, {
      threshold: 0.3,
      animations: 'disabled',
    });

    // Wait for actual content to load and capture final state
    await page.waitForSelector('[data-testid="modern-dashboard"]', { timeout: 10000 });
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot(`dashboard-loaded-${browserName}.png`, {
      threshold: 0.2,
      animations: 'disabled',
    });
  });

  test('Dashboard error states @visual-error', async ({ page, browserName }) => {
    // Intercept API calls to simulate error states
    await page.route('**/api/dashboard/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/dashboard');

    // Wait for error state to appear
    await page.waitForSelector('[data-testid="error"], .error-message, .dashboard-error', { timeout: 5000 });

    await expect(page).toHaveScreenshot(`dashboard-error-${browserName}.png`, {
      threshold: 0.2,
      animations: 'disabled',
    });
  });

  test('Layout switching visual states @visual-layouts', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForFunction(() => document.fonts.ready);

    // Test each layout option
    const layouts = ['compact', 'comfortable', 'spacious'];

    for (const layout of layouts) {
      const layoutButton = page.locator(`button:has-text("${layout}"), button[data-layout="${layout}"]`);

      if (await layoutButton.count() > 0) {
        await layoutButton.first().click();
        await page.waitForTimeout(500); // Wait for layout transition

        await expect(page).toHaveScreenshot(`dashboard-layout-${layout}-${browserName}.png`, {
          fullPage: true,
          threshold: 0.2,
          animations: 'disabled',
        });
      }
    }
  });

  test('Typography rendering comparison @visual-typography', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForFunction(() => document.fonts.ready);

    // Create a test page with various typography elements
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="/styles/globals.css">
        <link rel="stylesheet" href="/styles/dashboard-layouts.css">
      </head>
      <body>
        <div class="p-8 space-y-6">
          <h1 class="text-4xl font-bold">Dashboard Typography Test</h1>
          <h2 class="text-3xl font-semibold">Secondary Heading</h2>
          <h3 class="text-2xl font-medium">Tertiary Heading</h3>

          <div class="dashboard-card">
            <div class="dashboard-card__header">
              <h4 class="dashboard-card__title">Card Title</h4>
            </div>
            <div class="dashboard-card__body">
              <div class="dashboard-card__value">42</div>
              <div class="dashboard-card__subtitle">Subtitle Text</div>
            </div>
          </div>

          <p class="text-base">This is regular paragraph text that should render consistently across browsers.</p>
          <p class="text-sm text-gray-600">This is smaller secondary text.</p>

          <div class="flex gap-4">
            <button class="dashboard-btn dashboard-btn--primary">Primary Button</button>
            <button class="dashboard-btn dashboard-btn--secondary">Secondary Button</button>
          </div>
        </div>
      </body>
      </html>
    `);

    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot(`typography-test-${browserName}.png`, {
      threshold: 0.1,
      animations: 'disabled',
    });
  });
});