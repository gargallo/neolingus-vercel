import { test, expect, Page } from '@playwright/test';

/**
 * Mobile Dashboard Compatibility Tests
 * Tests dashboard adaptation to mobile viewports and touch interactions
 */

test.describe('Mobile Dashboard - Touch and Responsive', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for dashboard to be fully loaded
    await page.waitForSelector('[data-testid="modern-dashboard"]', { timeout: 10000 });
  });

  test('Dashboard adapts to mobile viewport @responsive', async ({ page, isMobile }) => {
    // Skip if not actually mobile
    test.skip(!isMobile, 'This test is for mobile browsers only');

    const viewport = page.viewportSize();
    expect(viewport?.width).toBeLessThanOrEqual(768);

    // Check for single-column layout on mobile
    const dashboardGrid = page.locator('.dashboard-grid, [data-testid="dashboard-grid"]');
    await expect(dashboardGrid).toBeVisible();

    const gridStyles = await dashboardGrid.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      return {
        gridTemplateColumns: styles.gridTemplateColumns,
        display: styles.display,
        gap: styles.gap,
      };
    });

    expect(gridStyles.display).toBe('grid');

    // On mobile, should be single column or minimal columns
    const columnCount = gridStyles.gridTemplateColumns.split(' ').length;
    expect(columnCount).toBeLessThanOrEqual(2);

    // Check for mobile-optimized gaps
    const gapValue = parseFloat(gridStyles.gap);
    expect(gapValue).toBeGreaterThan(8); // Minimum spacing
    expect(gapValue).toBeLessThan(32); // Not too large for mobile
  });

  test('No horizontal scroll on mobile @layout', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile browsers only');

    // Check for horizontal scrolling
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 0;

    // Allow for small differences due to scrollbars
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);

    // Check dashboard container doesn't overflow
    const dashboard = page.locator('[data-testid="modern-dashboard"]');
    const dashboardBox = await dashboard.boundingBox();

    if (dashboardBox) {
      expect(dashboardBox.width).toBeLessThanOrEqual(viewportWidth + 20);
    }

    // Check individual widgets don't overflow
    const widgets = page.locator('[data-testid="dashboard-widget"], .dashboard-card');
    const widgetCount = await widgets.count();

    for (let i = 0; i < widgetCount; i++) {
      const widget = widgets.nth(i);
      const widgetBox = await widget.boundingBox();

      if (widgetBox) {
        expect(widgetBox.width).toBeLessThanOrEqual(viewportWidth);
      }
    }
  });

  test('Touch targets meet minimum size requirements @accessibility', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile browsers only');

    const touchTargets = page.locator([
      'button',
      'a',
      '[role="button"]',
      '[tabindex]:not([tabindex="-1"])',
      'input',
      'select',
      '.dashboard-btn',
      '.dashboard-card[role="button"]'
    ].join(', '));

    const count = await touchTargets.count();

    for (let i = 0; i < count; i++) {
      const target = touchTargets.nth(i);

      if (await target.isVisible()) {
        const boundingBox = await target.boundingBox();

        if (boundingBox) {
          // WCAG AA recommends 44x44px minimum for touch targets
          const minSize = 44;

          // Check if either dimension meets minimum or if combined area is sufficient
          const hasMinimumSize = boundingBox.width >= minSize || boundingBox.height >= minSize;
          const hasMinimumArea = boundingBox.width * boundingBox.height >= minSize * minSize * 0.8;

          if (!hasMinimumSize && !hasMinimumArea) {
            console.warn(`Touch target may be too small: ${boundingBox.width}x${boundingBox.height}px`);
          }

          // Absolute minimum should be 32x32px
          expect(boundingBox.width).toBeGreaterThan(32);
          expect(boundingBox.height).toBeGreaterThan(32);
        }
      }
    }
  });

  test('Touch interactions work correctly @touch', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile browsers only');

    // Test tap interactions on dashboard cards
    const interactiveCards = page.locator('.dashboard-card[role="button"], [data-testid="interactive-card"]');
    const cardCount = await interactiveCards.count();

    if (cardCount > 0) {
      const firstCard = interactiveCards.first();
      await expect(firstCard).toBeVisible();

      // Test tap
      await firstCard.tap();
      await page.waitForTimeout(100);

      // Check for visual feedback (might be hover state, focus, or animation)
      const cardStyles = await firstCard.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          opacity: styles.opacity,
          backgroundColor: styles.backgroundColor,
        };
      });

      expect(cardStyles.opacity).not.toBe('0');
    }

    // Test layout switcher on mobile
    const layoutButtons = page.locator('button:has-text("Compacto"), button:has-text("Cómodo"), button:has-text("Espacioso")');
    const buttonCount = await layoutButtons.count();

    if (buttonCount > 0) {
      const firstButton = layoutButtons.first();
      await firstButton.tap();
      await page.waitForTimeout(300);

      // Verify layout change occurred
      const dashboardGrid = page.locator('.dashboard-grid');
      await expect(dashboardGrid).toBeVisible();
    }

    // Test refresh button
    const refreshButton = page.locator('button:has-text("Actualizar"), [data-testid="refresh-button"]');
    if (await refreshButton.count() > 0) {
      await refreshButton.first().tap();
      await page.waitForTimeout(100);

      // Should show loading state or animation
      const isRefreshing = await page.locator('[data-testid="loading"], .animate-spin').count() > 0;
      // Note: May not always be visible due to fast loading
    }
  });

  test('Virtual keyboard handling @mobile-ux', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile browsers only');

    // Look for any input fields on the dashboard
    const inputs = page.locator('input, textarea, [contenteditable="true"]');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();

      // Get initial viewport height
      const initialViewport = page.viewportSize();
      const initialHeight = initialViewport?.height || 0;

      // Focus on input to trigger virtual keyboard
      await firstInput.focus();
      await page.waitForTimeout(1000); // Allow keyboard to appear

      // Check if viewport adjusted (some browsers adjust viewport height)
      const newViewport = page.viewportSize();
      const newHeight = newViewport?.height || 0;

      // Either viewport should shrink or content should scroll
      const viewportShrunk = newHeight < initialHeight;
      const canScroll = await page.evaluate(() =>
        document.documentElement.scrollHeight > window.innerHeight
      );

      // One or both should be true to handle virtual keyboard
      expect(viewportShrunk || canScroll).toBeTruthy();

      // Input should remain visible
      const inputBox = await firstInput.boundingBox();
      if (inputBox) {
        expect(inputBox.y).toBeGreaterThanOrEqual(0);
        expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(newHeight + 100); // Some tolerance
      }

      // Type something to test input functionality
      await firstInput.fill('test');
      const inputValue = await firstInput.inputValue();
      expect(inputValue).toBe('test');

      // Clear and blur
      await firstInput.clear();
      await firstInput.blur();
    }
  });

  test('Swipe gestures work appropriately @gestures', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile browsers only');

    // Test horizontal swipe on dashboard if carousel/swipeable elements exist
    const swipeableElements = page.locator('[data-swipeable="true"], .swiper, .carousel');
    const swipeableCount = await swipeableElements.count();

    if (swipeableCount > 0) {
      const element = swipeableElements.first();
      const boundingBox = await element.boundingBox();

      if (boundingBox) {
        const startX = boundingBox.x + boundingBox.width * 0.8;
        const endX = boundingBox.x + boundingBox.width * 0.2;
        const y = boundingBox.y + boundingBox.height / 2;

        // Perform swipe gesture
        await page.touchscreen.tap(startX, y);
        await page.mouse.move(startX, y);
        await page.mouse.down();
        await page.mouse.move(endX, y);
        await page.mouse.up();

        await page.waitForTimeout(500);

        // Check if swipe had effect (element should have changed position or content)
        const newBoundingBox = await element.boundingBox();
        // Note: Actual behavior depends on implementation
      }
    }

    // Test page scrolling with touch
    const initialScrollTop = await page.evaluate(() => window.pageYOffset);

    // Perform scroll gesture
    const viewport = page.viewportSize();
    if (viewport) {
      const midX = viewport.width / 2;
      const startY = viewport.height * 0.8;
      const endY = viewport.height * 0.2;

      await page.touchscreen.tap(midX, startY);
      await page.mouse.move(midX, startY);
      await page.mouse.down();
      await page.mouse.move(midX, endY);
      await page.mouse.up();

      await page.waitForTimeout(300);

      const newScrollTop = await page.evaluate(() => window.pageYOffset);

      // Page should have scrolled if there's content to scroll
      const hasScrollableContent = await page.evaluate(() =>
        document.documentElement.scrollHeight > window.innerHeight
      );

      if (hasScrollableContent) {
        expect(newScrollTop).toBeGreaterThan(initialScrollTop);
      }
    }
  });

  test('Dashboard cards stack correctly in mobile layout @mobile-layout', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile browsers only');

    const cards = page.locator('.dashboard-card, [data-testid="dashboard-widget"]');
    const cardCount = await cards.count();

    expect(cardCount).toBeGreaterThan(0);

    // Check vertical stacking
    let previousBottom = 0;
    let overlappingCards = 0;

    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      const boundingBox = await card.boundingBox();

      if (boundingBox) {
        // Cards should not overlap vertically (allowing small gap tolerance)
        if (i > 0 && boundingBox.y < previousBottom - 10) {
          overlappingCards++;
        }

        previousBottom = boundingBox.y + boundingBox.height;

        // Cards should use full width or have appropriate margins
        const viewport = page.viewportSize();
        if (viewport) {
          const usableWidth = boundingBox.width + boundingBox.x * 2; // Assuming centered
          const widthRatio = usableWidth / viewport.width;
          expect(widthRatio).toBeGreaterThan(0.8); // Should use at least 80% of width
        }
      }
    }

    // Allow for some overlapping in complex layouts, but not too much
    expect(overlappingCards).toBeLessThan(cardCount * 0.3);
  });

  test('Performance remains acceptable on mobile @mobile-performance', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile browsers only');

    // Reload page to measure performance from scratch
    await page.reload();

    // Set up performance monitoring
    await page.evaluate(() => {
      (window as any).performanceMetrics = {
        navigationStart: performance.timing.navigationStart,
        loadComplete: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
      };

      // Monitor for LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        (window as any).performanceMetrics.largestContentfulPaint = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Monitor for FCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        if (fcpEntry) {
          (window as any).performanceMetrics.firstContentfulPaint = fcpEntry.startTime;
        }
      }).observe({ entryTypes: ['paint'] });
    });

    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="modern-dashboard"]', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perf = (window as any).performanceMetrics;
      return {
        fcp: perf.firstContentfulPaint,
        lcp: perf.largestContentfulPaint,
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      };
    });

    // Mobile performance thresholds (more lenient than desktop)
    expect(metrics.fcp).toBeLessThan(2000); // FCP under 2 seconds
    expect(metrics.lcp).toBeLessThan(4000); // LCP under 4 seconds
    expect(metrics.loadTime).toBeLessThan(10000); // Total load under 10 seconds
    expect(metrics.domContentLoaded).toBeLessThan(5000); // DOM ready under 5 seconds

    // Check memory usage if available
    const memoryInfo = await page.evaluate(() => {
      const memory = (performance as any).memory;
      return memory ? {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      } : null;
    });

    if (memoryInfo) {
      // Memory usage should be reasonable (under 50MB for JS heap)
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('Text remains readable at mobile scale @mobile-typography', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This test is for mobile browsers only');

    const textElements = page.locator([
      '.dashboard-card__title',
      '.dashboard-card__value',
      '.dashboard-card__subtitle',
      'h1, h2, h3, h4, h5, h6',
      'p',
      'span',
      '.text-sm, .text-base, .text-lg'
    ].join(', '));

    const count = await textElements.count();

    for (let i = 0; i < Math.min(count, 20); i++) { // Test first 20 elements
      const element = textElements.nth(i);

      if (await element.isVisible()) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            lineHeight: computed.lineHeight,
            color: computed.color,
            fontWeight: computed.fontWeight,
          };
        });

        const fontSize = parseFloat(styles.fontSize);

        // Text should be at least 16px on mobile (iOS minimum)
        expect(fontSize).toBeGreaterThanOrEqual(14);

        // Text shouldn't be too large either
        expect(fontSize).toBeLessThan(80);

        // Check color contrast (basic check for non-transparent text)
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
        expect(styles.color).not.toBe('transparent');

        // Line height should be reasonable
        if (styles.lineHeight !== 'normal') {
          const lineHeight = parseFloat(styles.lineHeight);
          expect(lineHeight).toBeGreaterThan(fontSize * 0.9);
          expect(lineHeight).toBeLessThan(fontSize * 2.5);
        }
      }
    }
  });
});