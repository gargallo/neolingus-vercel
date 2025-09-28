import { test, expect, Page, BrowserContext } from '@playwright/test';
import { BROWSER_MATRIX, DASHBOARD_TEST_SCENARIOS, getBrowsersForScenario } from '../config/browser-matrix';

/**
 * Desktop Dashboard Layout Compatibility Tests
 * Tests dashboard grid layouts, responsiveness, and component rendering across browsers
 */

interface LayoutTestContext {
  page: Page;
  context: BrowserContext;
  browserName: string;
  deviceInfo: any;
}

test.describe('Dashboard Layout - Desktop Browsers', () => {
  test.beforeEach(async ({ page, context, browserName }) => {
    // Set up test environment
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for dashboard to be fully loaded
    await page.waitForSelector('[data-testid="modern-dashboard"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="dashboard-stats"]', { timeout: 5000 });
  });

  test('Grid layout renders correctly on desktop @cross-browser', async ({ page, browserName }) => {
    const testContext: LayoutTestContext = {
      page,
      context: page.context(),
      browserName,
      deviceInfo: await page.evaluate(() => ({
        userAgent: navigator.userAgent,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        devicePixelRatio: window.devicePixelRatio,
      })),
    };

    // Test grid container exists and has correct classes
    const dashboardGrid = page.locator('.dashboard-grid, [data-testid="dashboard-grid"]');
    await expect(dashboardGrid).toBeVisible();

    // Check CSS Grid is applied
    const gridDisplay = await dashboardGrid.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        gridTemplateColumns: styles.gridTemplateColumns,
        gap: styles.gap,
      };
    });

    expect(gridDisplay.display).toBe('grid');
    expect(gridDisplay.gridTemplateColumns).not.toBe('none');

    // Verify responsive grid classes are applied
    const gridClasses = await dashboardGrid.getAttribute('class');
    expect(gridClasses).toMatch(/grid|dashboard-grid/);

    // Check for proper grid gaps
    expect(gridDisplay.gap).toMatch(/\d+px|\d+rem/);

    // Browser-specific checks
    if (browserName === 'webkit') {
      // Safari-specific grid layout checks
      const gridAutoRows = await dashboardGrid.evaluate((el) =>
        window.getComputedStyle(el).gridAutoRows
      );
      expect(gridAutoRows).not.toBe('auto'); // Should have explicit sizing
    }

    if (browserName === 'firefox') {
      // Firefox-specific grid compatibility
      const gridGap = await dashboardGrid.evaluate((el) =>
        window.getComputedStyle(el).gap
      );
      expect(gridGap).toBeTruthy(); // Firefox should support gap property
    }
  });

  test('All dashboard widgets are visible and properly positioned @compatibility', async ({ page, browserName }) => {
    // Wait for all widgets to load
    await page.waitForSelector('[data-testid="dashboard-widget"]', { timeout: 10000 });

    const widgets = page.locator('[data-testid="dashboard-widget"], .dashboard-card');
    const widgetCount = await widgets.count();

    // Ensure we have at least the basic dashboard widgets
    expect(widgetCount).toBeGreaterThanOrEqual(4);

    // Check each widget is visible and positioned correctly
    for (let i = 0; i < widgetCount; i++) {
      const widget = widgets.nth(i);

      // Widget visibility
      await expect(widget).toBeVisible();

      // Widget positioning and sizing
      const boundingBox = await widget.boundingBox();
      expect(boundingBox).toBeTruthy();
      expect(boundingBox!.width).toBeGreaterThan(100);
      expect(boundingBox!.height).toBeGreaterThan(80);

      // No negative positioning (indicates layout issues)
      expect(boundingBox!.x).toBeGreaterThanOrEqual(0);
      expect(boundingBox!.y).toBeGreaterThanOrEqual(0);
    }

    // Browser-specific widget rendering checks
    if (browserName === 'webkit') {
      // Safari sometimes has issues with CSS transforms and animations
      const transformedWidgets = await page.locator('.dashboard-card').evaluateAll(elements =>
        elements.map(el => ({
          transform: window.getComputedStyle(el).transform,
          opacity: window.getComputedStyle(el).opacity,
        }))
      );

      transformedWidgets.forEach(style => {
        expect(style.opacity).not.toBe('0');
        // Transform should be valid (not 'none' if animations are expected)
      });
    }
  });

  test('Dashboard stats cards display correctly @responsive', async ({ page, browserName }) => {
    const statsCards = page.locator('[data-testid="dashboard-stats"] .dashboard-card, .stats-card');
    const cardCount = await statsCards.count();

    expect(cardCount).toBeGreaterThanOrEqual(4); // Level, Streak, Study Time, Achievements

    for (let i = 0; i < cardCount; i++) {
      const card = statsCards.nth(i);

      // Card structure validation
      await expect(card).toBeVisible();

      // Check for essential card elements
      const cardValue = card.locator('.dashboard-card__value, .card-value');
      const cardTitle = card.locator('.dashboard-card__title, .card-title');

      if (await cardValue.count() > 0) {
        await expect(cardValue.first()).toBeVisible();
        const valueText = await cardValue.first().textContent();
        expect(valueText).toBeTruthy();
        expect(valueText!.trim()).not.toBe('');
      }

      if (await cardTitle.count() > 0) {
        await expect(cardTitle.first()).toBeVisible();
      }

      // Check card background and styling
      const cardStyles = await card.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          borderRadius: styles.borderRadius,
          padding: styles.padding,
          minHeight: styles.minHeight,
        };
      });

      expect(cardStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // Should have background
      expect(cardStyles.padding).toMatch(/\d+px/); // Should have padding
    }

    // Browser-specific card rendering
    if (browserName === 'firefox') {
      // Firefox backdrop-filter support check
      const cardsWithBackdrop = await statsCards.evaluateAll(elements =>
        elements.map(el => window.getComputedStyle(el).backdropFilter)
      );

      // Firefox should handle backdrop-filter gracefully
      cardsWithBackdrop.forEach(filter => {
        expect(filter).toBeDefined();
      });
    }
  });

  test('Layout switching functionality works @interaction', async ({ page, browserName }) => {
    // Find layout switcher buttons
    const compactBtn = page.locator('button:has-text("Compacto"), button[data-layout="compact"]');
    const comfortableBtn = page.locator('button:has-text("Cómodo"), button[data-layout="comfortable"]');
    const spaciousBtn = page.locator('button:has-text("Espacioso"), button[data-layout="spacious"]');

    // Test compact layout
    if (await compactBtn.count() > 0) {
      await compactBtn.first().click();
      await page.waitForTimeout(500); // Allow layout transition

      const dashboardGrid = page.locator('.dashboard-grid');
      const gridColumns = await dashboardGrid.evaluate((el) =>
        window.getComputedStyle(el).gridTemplateColumns
      );

      // Compact layout should have more columns on desktop
      expect(gridColumns.split(' ').length).toBeGreaterThanOrEqual(3);
    }

    // Test spacious layout
    if (await spaciousBtn.count() > 0) {
      await spaciousBtn.first().click();
      await page.waitForTimeout(500);

      const dashboardGrid = page.locator('.dashboard-grid');
      const gap = await dashboardGrid.evaluate((el) =>
        window.getComputedStyle(el).gap
      );

      // Spacious layout should have larger gaps
      const gapValue = parseInt(gap.replace(/px|rem/, ''));
      expect(gapValue).toBeGreaterThan(20); // Minimum 20px gap
    }

    // Test comfortable layout (default)
    if (await comfortableBtn.count() > 0) {
      await comfortableBtn.first().click();
      await page.waitForTimeout(500);

      const dashboardGrid = page.locator('.dashboard-grid');
      await expect(dashboardGrid).toBeVisible();
    }
  });

  test('No layout shifts during loading @performance', async ({ page, browserName }) => {
    // Reload page to test initial loading
    await page.reload();

    let layoutShifts: number[] = [];
    let maxShift = 0;

    // Monitor layout shifts during page load
    await page.evaluate(() => {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            (window as any).layoutShiftValue = ((window as any).layoutShiftValue || 0) + (entry as any).value;
          }
        }
      }).observe({ entryTypes: ['layout-shift'] });
    });

    // Wait for dashboard to load completely
    await page.waitForSelector('[data-testid="modern-dashboard"]', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow any delayed rendering

    // Get cumulative layout shift
    const cls = await page.evaluate(() => (window as any).layoutShiftValue || 0);

    // CLS should be below threshold (0.1 is good, 0.25 is poor)
    expect(cls).toBeLessThan(0.25);

    // Ideally should be below 0.1 for good user experience
    if (cls > 0.1) {
      console.warn(`Layout shift detected: ${cls} on ${browserName}`);
    }
  });

  test('Dashboard components maintain aspect ratios @visual', async ({ page, browserName }) => {
    const widgets = page.locator('[data-testid="dashboard-widget"], .dashboard-card');
    const widgetCount = await widgets.count();

    for (let i = 0; i < widgetCount; i++) {
      const widget = widgets.nth(i);
      const boundingBox = await widget.boundingBox();

      if (boundingBox) {
        const aspectRatio = boundingBox.width / boundingBox.height;

        // Reasonable aspect ratio bounds (not too narrow or too wide)
        expect(aspectRatio).toBeGreaterThan(0.5);
        expect(aspectRatio).toBeLessThan(4.0);

        // Minimum size requirements
        expect(boundingBox.width).toBeGreaterThan(200);
        expect(boundingBox.height).toBeGreaterThan(100);
      }
    }
  });

  test('Typography scales correctly across browsers @typography', async ({ page, browserName }) => {
    const textElements = [
      '.dashboard-card__title',
      '.dashboard-card__value',
      '.dashboard-card__subtitle',
      'h1, h2, h3, h4, h5, h6',
      '.text-lg, .text-xl, .text-2xl, .text-3xl'
    ];

    for (const selector of textElements) {
      const elements = page.locator(selector);
      const count = await elements.count();

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 5); i++) { // Test first 5 elements
          const element = elements.nth(i);

          if (await element.isVisible()) {
            const styles = await element.evaluate((el) => {
              const computed = window.getComputedStyle(el);
              return {
                fontSize: computed.fontSize,
                lineHeight: computed.lineHeight,
                fontWeight: computed.fontWeight,
                fontFamily: computed.fontFamily,
              };
            });

            // Font size should be readable
            const fontSize = parseFloat(styles.fontSize);
            expect(fontSize).toBeGreaterThan(10); // Minimum 10px
            expect(fontSize).toBeLessThan(100); // Maximum 100px

            // Line height should be reasonable
            if (styles.lineHeight !== 'normal') {
              const lineHeight = parseFloat(styles.lineHeight);
              expect(lineHeight).toBeGreaterThan(fontSize * 0.8);
              expect(lineHeight).toBeLessThan(fontSize * 3);
            }

            // Font family should be defined
            expect(styles.fontFamily).toBeTruthy();
            expect(styles.fontFamily).not.toBe('');
          }
        }
      }
    }

    // Browser-specific font rendering checks
    if (browserName === 'webkit') {
      // Safari font smoothing
      const smoothing = await page.locator('body').evaluate((el) =>
        window.getComputedStyle(el).webkitFontSmoothing
      );
      expect(smoothing).toBeDefined();
    }
  });

  test('Dashboard maintains minimum touch target sizes @accessibility', async ({ page, browserName }) => {
    const interactiveElements = page.locator([
      'button',
      'a',
      '[role="button"]',
      '[tabindex]',
      'input',
      'select'
    ].join(', '));

    const count = await interactiveElements.count();

    for (let i = 0; i < count; i++) {
      const element = interactiveElements.nth(i);

      if (await element.isVisible()) {
        const boundingBox = await element.boundingBox();

        if (boundingBox) {
          // WCAG guidelines recommend minimum 44x44px touch targets
          const minSize = 44;

          if (boundingBox.width < minSize || boundingBox.height < minSize) {
            // Check if element has sufficient padding to reach minimum size
            const styles = await element.evaluate((el) => {
              const computed = window.getComputedStyle(el);
              return {
                padding: computed.padding,
                paddingTop: computed.paddingTop,
                paddingBottom: computed.paddingBottom,
                paddingLeft: computed.paddingLeft,
                paddingRight: computed.paddingRight,
              };
            });

            // Log warning for potentially problematic touch targets
            console.warn(`Small touch target detected: ${boundingBox.width}x${boundingBox.height}px on ${browserName}`);
          }

          // Elements should be at least 24x24px (absolute minimum)
          expect(boundingBox.width).toBeGreaterThan(24);
          expect(boundingBox.height).toBeGreaterThan(24);
        }
      }
    }
  });
});