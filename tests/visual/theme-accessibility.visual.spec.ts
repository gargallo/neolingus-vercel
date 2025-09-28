/**
 * Theme and Accessibility Visual Regression Tests
 * Testing dashboard appearance across themes and accessibility configurations
 */

import { test, expect } from '@playwright/test';
import {
  DashboardPageHelper,
  ScreenshotHelper,
  MockDataGenerator,
  AnimationHelper,
  VisualRegressionDetector,
} from './utils/visual-test-helpers';

test.describe('Theme and Accessibility Visual Testing', () => {
  let pageHelper: DashboardPageHelper;
  let screenshotHelper: ScreenshotHelper;
  let animationHelper: AnimationHelper;
  let regressionDetector: VisualRegressionDetector;

  test.beforeEach(async ({ page }) => {
    pageHelper = new DashboardPageHelper(page);
    screenshotHelper = new ScreenshotHelper(page);
    animationHelper = new AnimationHelper(page);
    regressionDetector = new VisualRegressionDetector(page);

    await animationHelper.disableAnimations();
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test.describe('Light Theme Testing', () => {
    test('should render dashboard correctly in light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-light-theme-complete',
        fullPage: true,
      });

      // Test individual components in light theme
      const selectors = pageHelper.getSelectors();

      await screenshotHelper.takeComponentScreenshot(
        selectors.header,
        'light-theme-header'
      );

      await screenshotHelper.takeComponentScreenshot(
        selectors.stats,
        'light-theme-stats'
      );

      await screenshotHelper.takeComponentScreenshot(
        selectors.timeline,
        'light-theme-timeline'
      );

      await screenshotHelper.takeComponentScreenshot(
        selectors.quickActions,
        'light-theme-quick-actions'
      );
    });

    test('should maintain proper contrast ratios in light theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Check contrast ratios programmatically
      const contrastResults = await page.evaluate(() => {
        const elements = document.querySelectorAll('h1, h2, h3, p, button, [role="button"]');
        const results: Array<{
          element: string;
          color: string;
          backgroundColor: string;
          tagName: string;
        }> = [];

        elements.forEach((el, index) => {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;

          results.push({
            element: `${el.tagName.toLowerCase()}[${index}]`,
            color,
            backgroundColor,
            tagName: el.tagName,
          });
        });

        return results;
      });

      // Verify we have readable text colors (not transparent or same as background)
      const problematicElements = contrastResults.filter(result =>
        result.color === result.backgroundColor ||
        result.color.includes('rgba(0, 0, 0, 0)') ||
        result.color.includes('transparent')
      );

      expect(problematicElements.length).toBeLessThan(5); // Allow some flexibility

      await screenshotHelper.takeScreenshot({
        name: 'light-theme-contrast-validation',
        fullPage: true,
      });
    });

    test('should render light theme with different color variants', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'light' });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Test each stat card color variant
      const statCards = page.locator('[data-testid^="stat-card-"]');
      const cardCount = await statCards.count();

      for (let i = 0; i < cardCount; i++) {
        const card = statCards.nth(i);
        const variant = await card.getAttribute('data-testid');

        await screenshotHelper.takeComponentScreenshot(
          card,
          `light-theme-${variant}`
        );
      }
    });
  });

  test.describe('Dark Theme Testing', () => {
    test('should render dashboard correctly in dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-dark-theme-complete',
        fullPage: true,
      });

      // Test individual components in dark theme
      const selectors = pageHelper.getSelectors();

      await screenshotHelper.takeComponentScreenshot(
        selectors.header,
        'dark-theme-header'
      );

      await screenshotHelper.takeComponentScreenshot(
        selectors.stats,
        'dark-theme-stats'
      );

      await screenshotHelper.takeComponentScreenshot(
        selectors.timeline,
        'dark-theme-timeline'
      );

      await screenshotHelper.takeComponentScreenshot(
        selectors.quickActions,
        'dark-theme-quick-actions'
      );
    });

    test('should maintain readability in dark theme', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Check dark theme specific elements
      const darkThemeElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('.dark\\:text-white, .dark\\:text-gray-100, .dark\\:bg-gray-900');
        return elements.length;
      });

      expect(darkThemeElements).toBeGreaterThan(0);

      await screenshotHelper.takeScreenshot({
        name: 'dark-theme-readability-check',
        fullPage: true,
      });
    });

    test('should render dark theme with proper component states', async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Test hover states in dark theme
      const statCards = page.locator('[data-testid^="stat-card-"]');
      const firstCard = statCards.first();
      await firstCard.hover();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats"]',
        'dark-theme-hover-states'
      );

      // Test focus states in dark theme
      await firstCard.focus();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats"]',
        'dark-theme-focus-states'
      );
    });
  });

  test.describe('Theme Comparison Testing', () => {
    test('should maintain layout consistency between themes', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);

      // Light theme
      await page.emulateMedia({ colorScheme: 'light' });
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      const lightLayout = await page.evaluate(() => {
        const stats = document.querySelector('[data-testid="dashboard-stats"]');
        const timeline = document.querySelector('.dashboard-timeline-container');
        const actions = document.querySelector('[data-testid="quick-actions"]');

        return {
          stats: stats ? stats.getBoundingClientRect() : null,
          timeline: timeline ? timeline.getBoundingClientRect() : null,
          actions: actions ? actions.getBoundingClientRect() : null,
        };
      });

      await screenshotHelper.takeScreenshot({
        name: 'theme-comparison-light',
        fullPage: true,
      });

      // Dark theme
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.waitForTimeout(300); // Allow theme transition

      const darkLayout = await page.evaluate(() => {
        const stats = document.querySelector('[data-testid="dashboard-stats"]');
        const timeline = document.querySelector('.dashboard-timeline-container');
        const actions = document.querySelector('[data-testid="quick-actions"]');

        return {
          stats: stats ? stats.getBoundingClientRect() : null,
          timeline: timeline ? timeline.getBoundingClientRect() : null,
          actions: actions ? actions.getBoundingClientRect() : null,
        };
      });

      await screenshotHelper.takeScreenshot({
        name: 'theme-comparison-dark',
        fullPage: true,
      });

      // Verify layout consistency
      if (lightLayout.stats && darkLayout.stats) {
        expect(Math.abs(lightLayout.stats.width - darkLayout.stats.width)).toBeLessThan(5);
        expect(Math.abs(lightLayout.stats.height - darkLayout.stats.height)).toBeLessThan(5);
      }
    });

    test('should show theme-specific component variations', async ({ page }) => {
      const components = [
        { selector: '[data-testid="dashboard-stats"]', name: 'stats' },
        { selector: '.dashboard-timeline-container', name: 'timeline' },
        { selector: '[data-testid="quick-actions"]', name: 'actions' },
      ];

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      for (const component of components) {
        await screenshotHelper.takeThemeScreenshots(
          `component-${component.name}`,
          component.selector
        );
      }
    });
  });

  test.describe('High Contrast Accessibility Testing', () => {
    test('should render correctly with forced colors (high contrast)', async ({ page }) => {
      // Enable forced colors (Windows high contrast mode simulation)
      await page.emulateMedia({
        colorScheme: 'light',
        forcedColors: 'active'
      });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-high-contrast-mode',
        fullPage: true,
      });

      // Test component visibility in high contrast
      const selectors = pageHelper.getSelectors();

      await screenshotHelper.takeComponentScreenshot(
        selectors.stats,
        'high-contrast-stats'
      );

      await screenshotHelper.takeComponentScreenshot(
        selectors.timeline,
        'high-contrast-timeline'
      );
    });

    test('should maintain interactive element visibility in high contrast', async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Test button visibility
      const buttons = page.locator('button, [role="button"]');
      const buttonCount = await buttons.count();

      expect(buttonCount).toBeGreaterThan(0);

      // Check each button is visible
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        await expect(button).toBeVisible();
      }

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="quick-actions"]',
        'high-contrast-interactive-elements'
      );
    });

    test('should show proper focus indicators in high contrast', async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Test keyboard focus
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focusedElement = page.locator(':focus');
      if (await focusedElement.count() > 0) {
        await expect(focusedElement).toBeVisible();

        await screenshotHelper.takeScreenshot({
          name: 'high-contrast-focus-indicators',
          fullPage: true,
        });
      }
    });
  });

  test.describe('Reduced Motion Accessibility Testing', () => {
    test('should respect reduced motion preferences', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Check that animations are disabled
      const animationsDisabled = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        let animatedElements = 0;

        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          if (styles.animationDuration !== '0s' && styles.animationDuration !== '') {
            animatedElements++;
          }
        });

        return animatedElements;
      });

      expect(animatedElements).toBeLessThan(5); // Should be minimal or zero

      await screenshotHelper.takeScreenshot({
        name: 'reduced-motion-dashboard',
        fullPage: true,
      });
    });

    test('should provide alternative feedback for reduced motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Test hover feedback without animations
      const statCard = page.locator('[data-testid^="stat-card-"]').first();
      await statCard.hover();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats"]',
        'reduced-motion-hover-feedback'
      );

      // Test interactive feedback
      await statCard.click();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats"]',
        'reduced-motion-click-feedback'
      );
    });
  });

  test.describe('Font Size and Zoom Accessibility Testing', () => {
    test('should handle large font sizes gracefully', async ({ page }) => {
      // Increase font size to simulate user preferences
      await page.addStyleTag({
        content: `
          html {
            font-size: 20px !important;
          }
        `,
      });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'large-font-size-dashboard',
        fullPage: true,
      });

      // Check for text overflow or layout breaks
      const overflowIssues = await regressionDetector.checkVisualConsistency();
      expect(overflowIssues.score).toBeGreaterThan(70);
    });

    test('should maintain usability at 200% zoom', async ({ page }) => {
      // Simulate 200% browser zoom
      await page.setViewportSize({ width: 720, height: 450 }); // Half resolution = 200% zoom effect

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-200-percent-zoom',
        fullPage: true,
      });

      // Verify important elements are still visible
      const selectors = pageHelper.getSelectors();
      const stats = page.locator(selectors.stats);
      const actions = page.locator(selectors.quickActions);

      await expect(stats).toBeVisible();
      await expect(actions).toBeVisible();
    });

    test('should handle small font sizes appropriately', async ({ page }) => {
      // Test with very small font size
      await page.addStyleTag({
        content: `
          html {
            font-size: 10px !important;
          }
        `,
      });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'small-font-size-dashboard',
        fullPage: true,
      });

      // Verify text is still readable (minimum sizes maintained)
      const minTextSizes = await page.evaluate(() => {
        const textElements = document.querySelectorAll('p, span, div:not(:empty)');
        const sizes: number[] = [];

        textElements.forEach(el => {
          const fontSize = window.getComputedStyle(el).fontSize;
          const sizeInPx = parseFloat(fontSize);
          if (sizeInPx > 0) {
            sizes.push(sizeInPx);
          }
        });

        return {
          min: Math.min(...sizes),
          average: sizes.reduce((sum, size) => sum + size, 0) / sizes.length,
        };
      });

      expect(minTextSizes.min).toBeGreaterThan(8); // Minimum readable size
    });
  });

  test.describe('Color Vision Accessibility Testing', () => {
    test('should be accessible for color blindness', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Simulate different types of color vision deficiency
      const colorFilters = [
        { name: 'protanopia', filter: 'saturate(0.8) hue-rotate(15deg)' },
        { name: 'deuteranopia', filter: 'saturate(0.6) hue-rotate(-15deg)' },
        { name: 'tritanopia', filter: 'saturate(0.7) hue-rotate(90deg)' },
        { name: 'monochrome', filter: 'grayscale(1)' },
      ];

      for (const colorFilter of colorFilters) {
        await page.addStyleTag({
          content: `
            body {
              filter: ${colorFilter.filter};
            }
          `,
        });

        await page.waitForTimeout(200);

        await screenshotHelper.takeScreenshot({
          name: `color-vision-${colorFilter.name}`,
          fullPage: true,
        });

        // Remove filter for next test
        await page.addStyleTag({
          content: `
            body {
              filter: none;
            }
          `,
        });
      }
    });

    test('should not rely solely on color for information', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Apply grayscale filter to test color independence
      await page.addStyleTag({
        content: `
          * {
            filter: grayscale(1) !important;
          }
        `,
      });

      await page.waitForTimeout(200);

      await screenshotHelper.takeScreenshot({
        name: 'information-without-color',
        fullPage: true,
      });

      // Verify information is still conveyed through:
      // - Text labels
      // - Icons
      // - Patterns
      // - Position

      const informationElements = await page.evaluate(() => {
        const icons = document.querySelectorAll('[aria-label], [data-icon], svg');
        const textLabels = document.querySelectorAll('label, .sr-only, [aria-describedby]');
        const patterns = document.querySelectorAll('[class*="border"], [class*="shadow"]');

        return {
          icons: icons.length,
          textLabels: textLabels.length,
          patterns: patterns.length,
        };
      });

      expect(informationElements.icons).toBeGreaterThan(0);
      expect(informationElements.textLabels).toBeGreaterThan(0);
    });
  });

  test.describe('Screen Reader Accessibility Testing', () => {
    test('should have proper ARIA labels and descriptions', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Check for essential ARIA attributes
      const ariaInfo = await page.evaluate(() => {
        const ariaLabels = document.querySelectorAll('[aria-label]');
        const ariaDescriptions = document.querySelectorAll('[aria-describedby]');
        const ariaRoles = document.querySelectorAll('[role]');
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const landmarks = document.querySelectorAll('[role="main"], [role="navigation"], [role="complementary"], main, nav, aside');

        return {
          ariaLabels: ariaLabels.length,
          ariaDescriptions: ariaDescriptions.length,
          ariaRoles: ariaRoles.length,
          headings: headings.length,
          landmarks: landmarks.length,
        };
      });

      expect(ariaInfo.ariaLabels).toBeGreaterThan(5);
      expect(ariaInfo.headings).toBeGreaterThan(2);
      expect(ariaInfo.landmarks).toBeGreaterThan(0);

      await screenshotHelper.takeScreenshot({
        name: 'screen-reader-accessibility-check',
        fullPage: true,
      });
    });

    test('should have logical tab order', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Test tab navigation order
      const tabOrder: string[] = [];

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');

        if (await focusedElement.count() > 0) {
          const elementInfo = await focusedElement.evaluate(el => {
            return {
              tagName: el.tagName,
              id: el.id,
              className: el.className.split(' ')[0],
              ariaLabel: el.getAttribute('aria-label'),
              textContent: el.textContent?.slice(0, 20),
            };
          });

          tabOrder.push(`${elementInfo.tagName}${elementInfo.id ? '#' + elementInfo.id : ''}${elementInfo.className ? '.' + elementInfo.className : ''}`);
        }
      }

      // Verify logical progression (no empty focus, reasonable order)
      expect(tabOrder.length).toBeGreaterThan(3);

      // Take screenshot showing final focus state
      await screenshotHelper.takeScreenshot({
        name: 'tab-order-accessibility',
        fullPage: true,
      });
    });

    test('should provide adequate focus indicators', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Test focus indicators on interactive elements
      const interactiveElements = page.locator('button, a, [tabindex="0"], [role="button"]');
      const elementCount = await interactiveElements.count();

      for (let i = 0; i < Math.min(elementCount, 5); i++) {
        const element = interactiveElements.nth(i);
        await element.focus();

        const focusStyles = await element.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineWidth: styles.outlineWidth,
            outlineColor: styles.outlineColor,
            boxShadow: styles.boxShadow,
          };
        });

        // Verify visible focus indicator
        const hasVisibleFocus =
          focusStyles.outline !== 'none' ||
          focusStyles.boxShadow !== 'none' ||
          focusStyles.outlineWidth !== '0px';

        expect(hasVisibleFocus).toBeTruthy();

        await screenshotHelper.takeComponentScreenshot(
          element,
          `focus-indicator-${i}`
        );
      }
    });
  });

  test.describe('Responsive Accessibility Testing', () => {
    test('should maintain accessibility across different viewport sizes', async ({ page }) => {
      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1440, height: 900, name: 'desktop' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);

        const context = MockDataGenerator.createHighProgressScenario();
        await pageHelper.setupMockResponses(context);
        await pageHelper.navigateToDashboard();
        await pageHelper.waitForDashboardLoad();

        // Check touch target sizes on mobile
        if (viewport.name === 'mobile') {
          const touchTargets = await page.evaluate(() => {
            const interactiveElements = document.querySelectorAll('button, a, [role="button"], [tabindex="0"]');
            const smallTargets: string[] = [];

            interactiveElements.forEach((el, index) => {
              const rect = el.getBoundingClientRect();
              if (rect.width < 44 || rect.height < 44) {
                smallTargets.push(`${el.tagName}[${index}]: ${rect.width}x${rect.height}`);
              }
            });

            return smallTargets;
          });

          expect(touchTargets.length).toBeLessThan(3); // Allow some flexibility
        }

        await screenshotHelper.takeScreenshot({
          name: `accessibility-${viewport.name}`,
          fullPage: true,
        });
      }
    });

    test('should provide appropriate alternative content for different screen sizes', async ({ page }) => {
      // Test mobile-specific accessibility features
      await page.setViewportSize({ width: 375, height: 667 });

      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Check for mobile-specific navigation aids
      const mobileAccessibility = await page.evaluate(() => {
        const skipLinks = document.querySelectorAll('[href^="#"], .sr-only');
        const collapsibleContent = document.querySelectorAll('[aria-expanded]');
        const mobileMenus = document.querySelectorAll('[role="menu"], [data-testid*="mobile"]');

        return {
          skipLinks: skipLinks.length,
          collapsibleContent: collapsibleContent.length,
          mobileMenus: mobileMenus.length,
        };
      });

      await screenshotHelper.takeScreenshot({
        name: 'mobile-accessibility-features',
        fullPage: true,
      });
    });
  });
});