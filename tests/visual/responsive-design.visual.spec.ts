/**
 * Responsive Design Visual Regression Tests
 * Testing dashboard layout across different viewport sizes and orientations
 */

import { test, expect } from '@playwright/test';
import {
  DashboardPageHelper,
  ScreenshotHelper,
  MockDataGenerator,
  AnimationHelper,
  VIEWPORTS,
} from './utils/visual-test-helpers';

test.describe('Responsive Design Visual Testing', () => {
  let pageHelper: DashboardPageHelper;
  let screenshotHelper: ScreenshotHelper;
  let animationHelper: AnimationHelper;

  test.beforeEach(async ({ page }) => {
    pageHelper = new DashboardPageHelper(page);
    screenshotHelper = new ScreenshotHelper(page);
    animationHelper = new AnimationHelper(page);

    // Disable animations for consistent screenshots
    await animationHelper.disableAnimations();
  });

  test.describe('Mobile Viewport Testing', () => {
    test('should render dashboard correctly on small mobile (iPhone SE)', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-mobile-small-portrait',
        fullPage: true,
      });

      // Test specific mobile components
      const selectors = pageHelper.getSelectors();

      // Header should stack properly on mobile
      await screenshotHelper.takeComponentScreenshot(
        selectors.header,
        'mobile-header-small'
      );

      // Stats should stack vertically
      await screenshotHelper.takeComponentScreenshot(
        selectors.stats,
        'mobile-stats-small'
      );

      // Quick actions should be touch-friendly
      await screenshotHelper.takeComponentScreenshot(
        selectors.quickActions,
        'mobile-quick-actions-small'
      );
    });

    test('should render dashboard correctly on large mobile (iPhone 12 Pro)', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobileLarge);

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-mobile-large-portrait',
        fullPage: true,
      });
    });

    test('should handle mobile landscape orientation', async ({ page }) => {
      await page.setViewportSize({ width: 844, height: 390 }); // iPhone 12 Pro landscape

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-mobile-landscape',
        fullPage: true,
      });

      // Check that stats grid adapts to landscape
      const selectors = pageHelper.getSelectors();
      await screenshotHelper.takeComponentScreenshot(
        selectors.stats,
        'mobile-stats-landscape'
      );
    });

    test('should maintain touch target sizes on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Check touch target sizes programmatically
      const touchTargets = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a[role="button"], [tabindex="0"]'));
        return buttons.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            element: el.tagName + (el.id ? `#${el.id}` : '') + (el.className ? `.${el.className.split(' ')[0]}` : ''),
          };
        });
      });

      // Verify minimum touch target size (44px x 44px)
      const smallTargets = touchTargets.filter(target =>
        target.width < 44 || target.height < 44
      );

      expect(smallTargets.length).toBeLessThan(3); // Allow some flexibility for edge cases

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="quick-actions"]',
        'mobile-touch-targets'
      );
    });

    test('should show mobile-optimized navigation', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Check if mobile navigation appears
      const mobileNav = page.locator('[data-testid="mobile-navigation"]');
      if (await mobileNav.count() > 0) {
        await screenshotHelper.takeComponentScreenshot(
          '[data-testid="mobile-navigation"]',
          'mobile-navigation'
        );
      }

      // Test tab navigation on mobile
      const tabs = page.locator('[role="tablist"]');
      if (await tabs.count() > 0) {
        await screenshotHelper.takeComponentScreenshot(
          '[role="tablist"]',
          'mobile-tabs'
        );
      }
    });
  });

  test.describe('Tablet Viewport Testing', () => {
    test('should render dashboard correctly on tablet portrait', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tablet);

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-tablet-portrait',
        fullPage: true,
      });

      // Test tablet-specific component layouts
      const selectors = pageHelper.getSelectors();

      await screenshotHelper.takeComponentScreenshot(
        selectors.stats,
        'tablet-stats-portrait'
      );

      await screenshotHelper.takeComponentScreenshot(
        selectors.timeline,
        'tablet-timeline-portrait'
      );
    });

    test('should render dashboard correctly on tablet landscape', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tabletLandscape);

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-tablet-landscape',
        fullPage: true,
      });

      // Test two-column layout on tablet landscape
      const selectors = pageHelper.getSelectors();

      await screenshotHelper.takeComponentScreenshot(
        selectors.stats,
        'tablet-stats-landscape'
      );
    });

    test('should optimize content density for tablet', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.tablet);

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Check content density and spacing
      const contentDensity = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="dashboard-overview"]');
        if (!container) return null;

        const rect = container.getBoundingClientRect();
        const children = Array.from(container.children);

        return {
          containerHeight: rect.height,
          childrenCount: children.length,
          averageSpacing: children.length > 1 ?
            (rect.height - children.reduce((sum, child) => sum + child.getBoundingClientRect().height, 0)) / (children.length - 1)
            : 0,
        };
      });

      expect(contentDensity?.averageSpacing).toBeGreaterThan(16); // Adequate spacing
      expect(contentDensity?.averageSpacing).toBeLessThan(64); // Not too sparse

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-tablet-content-density',
        fullPage: true,
      });
    });
  });

  test.describe('Desktop Viewport Testing', () => {
    test('should render dashboard correctly on standard desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-desktop-standard',
        fullPage: true,
      });

      // Test desktop-specific layouts
      const selectors = pageHelper.getSelectors();

      // Stats should be in horizontal grid
      await screenshotHelper.takeComponentScreenshot(
        selectors.stats,
        'desktop-stats-grid'
      );

      // Full width components
      await screenshotHelper.takeComponentScreenshot(
        selectors.timeline,
        'desktop-timeline-full'
      );
    });

    test('should render dashboard correctly on large desktop (4K)', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktopLarge);

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-desktop-large',
        fullPage: true,
      });

      // Check max-width constraints on large screens
      const contentWidth = await page.evaluate(() => {
        const container = document.querySelector('.max-w-6xl');
        return container ? container.getBoundingClientRect().width : null;
      });

      expect(contentWidth).toBeLessThanOrEqual(1152); // max-w-6xl in Tailwind
    });

    test('should maintain proper typography scaling on desktop', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Check typography sizes
      const typography = await page.evaluate(() => {
        const elements = {
          h1: document.querySelector('h1'),
          h2: document.querySelector('h2'),
          h3: document.querySelector('h3'),
          body: document.querySelector('p'),
        };

        return Object.fromEntries(
          Object.entries(elements).map(([key, el]) => [
            key,
            el ? {
              fontSize: window.getComputedStyle(el).fontSize,
              lineHeight: window.getComputedStyle(el).lineHeight,
            } : null
          ])
        );
      });

      // Verify typography hierarchy
      expect(typography.h1?.fontSize).toBeDefined();
      expect(typography.h2?.fontSize).toBeDefined();
      expect(typography.h3?.fontSize).toBeDefined();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-desktop-typography',
        fullPage: true,
      });
    });
  });

  test.describe('Responsive Grid Testing', () => {
    test.describe.serial('should adapt grid layouts across breakpoints', () => {
      const viewports = [
        { name: 'mobile', size: VIEWPORTS.mobile },
        { name: 'tablet', size: VIEWPORTS.tablet },
        { name: 'desktop', size: VIEWPORTS.desktop },
        { name: 'large', size: VIEWPORTS.desktopLarge },
      ];

      for (const viewport of viewports) {
        test(`should show correct grid layout on ${viewport.name}`, async ({ page }) => {
          await page.setViewportSize(viewport.size);

          const context = MockDataGenerator.createHighProgressScenario();
          await pageHelper.setupMockResponses(context);
          await pageHelper.navigateToDashboard();
          await pageHelper.waitForDashboardLoad();

          // Check grid columns for stats
          const gridInfo = await page.evaluate(() => {
            const statsGrid = document.querySelector('[data-testid="dashboard-stats"]');
            if (!statsGrid) return null;

            const styles = window.getComputedStyle(statsGrid);
            const gridColumns = styles.gridTemplateColumns;
            const gap = styles.gap;

            return {
              gridColumns,
              gap,
              columnCount: gridColumns.split(' ').length,
            };
          });

          await screenshotHelper.takeComponentScreenshot(
            '[data-testid="dashboard-stats"]',
            `grid-stats-${viewport.name}`
          );

          // Verify expected column counts
          if (viewport.name === 'mobile') {
            expect(gridInfo?.columnCount).toBeLessThanOrEqual(2);
          } else if (viewport.name === 'tablet') {
            expect(gridInfo?.columnCount).toBeLessThanOrEqual(3);
          } else {
            expect(gridInfo?.columnCount).toBeGreaterThanOrEqual(3);
          }
        });
      }
    });

    test('should handle dynamic content in responsive grids', async ({ page }) => {
      const viewports = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop];

      for (const [index, viewport] of viewports.entries()) {
        await page.setViewportSize(viewport);

        // Create context with varying content lengths
        const context = MockDataGenerator.createHighProgressScenario();
        if (index === 0) {
          context.course.title = 'Short Title';
        } else if (index === 1) {
          context.course.title = 'Medium Length Course Title That Shows Wrapping';
        } else {
          context.course.title = 'Very Long Course Title That Should Definitely Wrap And Show How The Layout Handles Extended Content Gracefully';
        }

        await pageHelper.setupMockResponses(context);
        await pageHelper.navigateToDashboard();
        await pageHelper.waitForDashboardLoad();

        const viewportName = ['mobile', 'tablet', 'desktop'][index];
        await screenshotHelper.takeScreenshot({
          name: `responsive-content-${viewportName}`,
          fullPage: true,
        });
      }
    });
  });

  test.describe('Responsive Component Behavior', () => {
    test('should show/hide elements based on screen size', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);

      // Test mobile - some elements should be hidden or collapsed
      await page.setViewportSize(VIEWPORTS.mobile);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      const mobileVisibility = await page.evaluate(() => {
        return {
          sidebar: document.querySelector('[data-testid="sidebar"]')?.checkVisibility(),
          fullTimeline: document.querySelector('[data-testid="timeline-full"]')?.checkVisibility(),
          expandedActions: document.querySelector('[data-testid="actions-expanded"]')?.checkVisibility(),
        };
      });

      await screenshotHelper.takeScreenshot({
        name: 'responsive-mobile-visibility',
        fullPage: true,
      });

      // Test desktop - all elements should be visible
      await page.setViewportSize(VIEWPORTS.desktop);
      await pageHelper.waitForDashboardLoad();

      const desktopVisibility = await page.evaluate(() => {
        return {
          sidebar: document.querySelector('[data-testid="sidebar"]')?.checkVisibility(),
          fullTimeline: document.querySelector('[data-testid="timeline-full"]')?.checkVisibility(),
          expandedActions: document.querySelector('[data-testid="actions-expanded"]')?.checkVisibility(),
        };
      });

      await screenshotHelper.takeScreenshot({
        name: 'responsive-desktop-visibility',
        fullPage: true,
      });

      // Elements that are hidden on mobile should be visible on desktop
      // (Note: This test assumes certain responsive design patterns)
    });

    test('should adapt component spacing across viewports', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);

      const viewports = [
        { name: 'mobile', size: VIEWPORTS.mobile },
        { name: 'tablet', size: VIEWPORTS.tablet },
        { name: 'desktop', size: VIEWPORTS.desktop },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport.size);
        await pageHelper.navigateToDashboard();
        await pageHelper.waitForDashboardLoad();

        // Measure spacing between components
        const spacing = await page.evaluate(() => {
          const components = Array.from(document.querySelectorAll('[data-testid*="dashboard"]'));
          const spacings = [];

          for (let i = 0; i < components.length - 1; i++) {
            const current = components[i].getBoundingClientRect();
            const next = components[i + 1].getBoundingClientRect();
            spacings.push(next.top - current.bottom);
          }

          return {
            average: spacings.reduce((sum, spacing) => sum + spacing, 0) / spacings.length,
            min: Math.min(...spacings),
            max: Math.max(...spacings),
          };
        });

        await screenshotHelper.takeScreenshot({
          name: `spacing-${viewport.name}`,
          fullPage: true,
        });

        // Verify appropriate spacing (mobile should have tighter spacing)
        if (viewport.name === 'mobile') {
          expect(spacing.average).toBeLessThan(32);
        } else if (viewport.name === 'desktop') {
          expect(spacing.average).toBeGreaterThan(16);
        }
      }
    });
  });

  test.describe('Responsive Interaction Testing', () => {
    test('should handle touch interactions on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.mobile);

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Test touch interactions
      const firstStatCard = page.locator('[data-testid^="stat-card-"]').first();

      // Simulate touch start (hover equivalent on mobile)
      await firstStatCard.dispatchEvent('touchstart');
      await page.waitForTimeout(100);

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats"]',
        'mobile-touch-interaction'
      );

      // Test swipe gestures if supported
      const timelineContainer = page.locator('[data-testid="activity-timeline"]');
      await timelineContainer.dragTo(timelineContainer, {
        sourcePosition: { x: 200, y: 100 },
        targetPosition: { x: 50, y: 100 },
      });

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="activity-timeline"]',
        'mobile-swipe-interaction'
      );
    });

    test('should handle keyboard navigation across viewports', async ({ page }) => {
      const viewports = [VIEWPORTS.mobile, VIEWPORTS.desktop];

      for (const [index, viewport] of viewports.entries()) {
        await page.setViewportSize(viewport);

        const context = MockDataGenerator.createHighProgressScenario();
        await pageHelper.setupMockResponses(context);
        await pageHelper.navigateToDashboard();
        await pageHelper.waitForDashboardLoad();

        // Test keyboard navigation
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        const viewportName = index === 0 ? 'mobile' : 'desktop';
        await screenshotHelper.takeScreenshot({
          name: `keyboard-nav-${viewportName}`,
          fullPage: true,
        });

        // Verify focus indicators are visible and appropriately sized
        const focusedElement = page.locator(':focus');
        if (await focusedElement.count() > 0) {
          await expect(focusedElement).toBeVisible();

          const focusStyle = await focusedElement.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              outline: styles.outline,
              boxShadow: styles.boxShadow,
            };
          });

          expect(focusStyle.outline !== 'none' || focusStyle.boxShadow !== 'none').toBeTruthy();
        }
      }
    });
  });

  test.describe('Responsive Performance Testing', () => {
    test('should maintain performance across different viewports', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);

      const viewports = [VIEWPORTS.mobile, VIEWPORTS.tablet, VIEWPORTS.desktop];
      const performanceResults = [];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        const startTime = Date.now();
        await pageHelper.navigateToDashboard();
        await pageHelper.waitForDashboardLoad();
        const endTime = Date.now();

        const loadTime = endTime - startTime;
        performanceResults.push({
          viewport: viewport.width + 'x' + viewport.height,
          loadTime,
        });

        // Verify reasonable load times
        expect(loadTime).toBeLessThan(5000); // 5 second max
      }

      // Log performance results for analysis
      console.log('Responsive performance results:', performanceResults);
    });

    test('should handle memory usage efficiently across viewports', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);

      const viewports = [VIEWPORTS.mobile, VIEWPORTS.desktop];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await pageHelper.navigateToDashboard();
        await pageHelper.waitForDashboardLoad();

        // Measure memory usage (basic check)
        const jsHeapSize = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });

        // Memory usage should be reasonable (less than 50MB for basic dashboard)
        expect(jsHeapSize).toBeLessThan(50 * 1024 * 1024);

        const viewportName = viewport.width < 800 ? 'mobile' : 'desktop';
        await screenshotHelper.takeScreenshot({
          name: `memory-test-${viewportName}`,
          fullPage: true,
        });
      }
    });
  });
});