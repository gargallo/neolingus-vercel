/**
 * Component States Visual Regression Tests
 * Testing all possible states for dashboard components
 */

import { test, expect } from '@playwright/test';
import {
  DashboardPageHelper,
  ScreenshotHelper,
  MockDataGenerator,
  AnimationHelper,
  VisualTestContext,
} from './utils/visual-test-helpers';

test.describe('Component States Visual Testing', () => {
  let pageHelper: DashboardPageHelper;
  let screenshotHelper: ScreenshotHelper;
  let animationHelper: AnimationHelper;

  test.beforeEach(async ({ page }) => {
    pageHelper = new DashboardPageHelper(page);
    screenshotHelper = new ScreenshotHelper(page);
    animationHelper = new AnimationHelper(page);

    // Disable animations for consistent screenshots
    await animationHelper.disableAnimations();
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test.describe('DashboardStats Component States', () => {
    test('should render loading skeleton state', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();

      // Setup delayed response to capture loading state
      await page.route('/api/academia/progress/**', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { progress: context.progress },
            }),
          });
        }, 3000);
      });

      await pageHelper.navigateToDashboard();

      // Wait for skeleton to appear
      await page.waitForSelector('[data-testid="dashboard-stats-loading"]', {
        state: 'visible',
        timeout: 2000,
      });

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats-loading"]',
        'stats-loading-skeleton'
      );

      // Test individual skeleton cards
      const skeletonCards = page.locator('[data-testid^="stat-skeleton-"]');
      const count = await skeletonCards.count();
      expect(count).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(count, 4); i++) {
        await screenshotHelper.takeComponentScreenshot(
          `[data-testid="stat-skeleton-${['progress', 'exams', 'score', 'hours'][i]}"]`,
          `stat-skeleton-${['progress', 'exams', 'score', 'hours'][i]}`
        );
      }
    });

    test('should render error state with retry button', async ({ page }) => {
      // Setup error response
      await page.route('/api/academia/progress/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Failed to load dashboard statistics',
          }),
        });
      });

      await pageHelper.navigateToDashboard();

      // Wait for error state
      await page.waitForSelector('[data-testid="dashboard-stats-error"]', {
        state: 'visible',
      });

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats-error"]',
        'stats-error-state'
      );

      // Test retry button functionality
      const retryButton = page.locator('[data-testid="dashboard-stats-error"] button');
      await retryButton.hover();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats-error"]',
        'stats-error-retry-hover'
      );
    });

    test('should render empty state', async ({ page }) => {
      // Setup empty response
      await page.route('/api/academia/progress/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: null,
          }),
        });
      });

      await pageHelper.navigateToDashboard();

      // Wait for empty state
      await page.waitForSelector('[data-testid="dashboard-stats-empty"]', {
        state: 'visible',
      });

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats-empty"]',
        'stats-empty-state'
      );
    });

    test('should render different value scenarios', async ({ page }) => {
      const scenarios = [
        {
          name: 'zero-values',
          context: MockDataGenerator.createEmptyScenario(),
        },
        {
          name: 'low-values',
          context: MockDataGenerator.createLowProgressScenario(),
        },
        {
          name: 'high-values',
          context: MockDataGenerator.createHighProgressScenario(),
        },
        {
          name: 'perfect-values',
          context: {
            ...MockDataGenerator.createHighProgressScenario(),
            progress: {
              ...MockDataGenerator.createHighProgressScenario().progress,
              overall_progress: 100,
              average_score: 100,
              component_progress: {
                reading: 1.0,
                listening: 1.0,
                writing: 1.0,
                speaking: 1.0,
              },
            },
          },
        },
      ];

      for (const scenario of scenarios) {
        await pageHelper.setupMockResponses(scenario.context);
        await pageHelper.navigateToDashboard();
        await pageHelper.waitForDashboardLoad();

        await screenshotHelper.takeComponentScreenshot(
          '[data-testid="dashboard-stats"]',
          `stats-${scenario.name}`
        );

        // Clear route handlers for next scenario
        await page.unroute('/api/academia/progress/**');
      }
    });

    test('should show hover and focus states', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Test hover states for each stat card
      const statCards = page.locator('[data-testid^="stat-card-"]');
      const cardCount = await statCards.count();

      for (let i = 0; i < cardCount; i++) {
        const card = statCards.nth(i);
        await card.hover();

        const cardVariant = await card.getAttribute('data-testid');
        await screenshotHelper.takeComponentScreenshot(
          '[data-testid="dashboard-stats"]',
          `stats-hover-${cardVariant?.replace('stat-card-', '')}`
        );
      }

      // Test focus states
      await page.keyboard.press('Tab');
      const focusedCard = page.locator('[data-testid^="stat-card-"]:focus');

      if (await focusedCard.count() > 0) {
        await screenshotHelper.takeComponentScreenshot(
          '[data-testid="dashboard-stats"]',
          'stats-focus-state'
        );
      }
    });

    test('should render trend indicators correctly', async ({ page }) => {
      const trendScenarios = [
        {
          name: 'trending-up',
          modifications: {
            component_progress: {
              reading: 0.85,
              listening: 0.78,
              writing: 0.72,
              speaking: 0.81,
            },
          },
        },
        {
          name: 'trending-down',
          modifications: {
            component_progress: {
              reading: 0.65,
              listening: 0.58,
              writing: 0.52,
              speaking: 0.61,
            },
          },
        },
        {
          name: 'mixed-trends',
          modifications: {
            component_progress: {
              reading: 0.85, // up
              listening: 0.58, // down
              writing: 0.75, // stable
              speaking: 0.81, // up
            },
          },
        },
      ];

      for (const scenario of trendScenarios) {
        const context = MockDataGenerator.createHighProgressScenario();
        context.progress = { ...context.progress, ...scenario.modifications };

        await pageHelper.setupMockResponses(context);
        await pageHelper.navigateToDashboard();
        await pageHelper.waitForDashboardLoad();

        // Check for trend icons
        const trendIcons = page.locator('[data-testid^="trend-icon-"]');
        const iconCount = await trendIcons.count();

        if (iconCount > 0) {
          await screenshotHelper.takeComponentScreenshot(
            '[data-testid="dashboard-stats"]',
            `stats-trends-${scenario.name}`
          );

          // Test individual trend icons
          for (let i = 0; i < iconCount; i++) {
            const icon = trendIcons.nth(i);
            const iconId = await icon.getAttribute('data-testid');
            await screenshotHelper.takeComponentScreenshot(
              `[data-testid="${iconId}"]`,
              `trend-icon-${iconId?.replace('trend-icon-', '')}-${scenario.name}`
            );
          }
        }

        await page.unroute('/api/academia/progress/**');
      }
    });
  });

  test.describe('ActivityTimeline Component States', () => {
    test('should render loading skeleton', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();

      // Setup delayed response for activities
      await page.route('/api/academia/exams/sessions**', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [],
            }),
          });
        }, 2000);
      });

      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();

      // Wait for timeline loading skeleton
      await page.waitForSelector('[role="list"][aria-label="Loading activities"]', {
        state: 'visible',
      });

      await screenshotHelper.takeComponentScreenshot(
        '.dashboard-timeline-container',
        'timeline-loading-skeleton'
      );
    });

    test('should render empty state', async ({ page }) => {
      const context = MockDataGenerator.createEmptyScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeComponentScreenshot(
        '.dashboard-timeline-container',
        'timeline-empty-state'
      );
    });

    test('should render error state', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();

      // Setup error response for activities
      await page.route('/api/academia/exams/sessions**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Failed to load activities',
          }),
        });
      });

      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();

      // Wait for error message
      await page.waitForSelector('text=Unable to load activities', {
        state: 'visible',
      });

      await screenshotHelper.takeComponentScreenshot(
        '.dashboard-timeline-container',
        'timeline-error-state'
      );
    });

    test('should render different activity types and states', async ({ page }) => {
      const activityTypes = [
        {
          type: 'exam',
          title: 'Reading Comprehension Test',
          score: 85,
          metadata: { difficulty: 'medium', improvement: 5 },
        },
        {
          type: 'study',
          title: 'Grammar Practice Session',
          duration: 1800,
          metadata: { difficulty: 'easy' },
        },
        {
          type: 'achievement',
          title: 'Weekly Streak Milestone',
          metadata: { level: 'gold' },
        },
        {
          type: 'progress',
          title: 'Skill Level Advancement',
          score: 92,
          metadata: { improvement: 12 },
        },
      ];

      const context = MockDataGenerator.createHighProgressScenario();
      context.activities = activityTypes.map((activity, index) => ({
        id: `activity-${index}`,
        date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        ...activity,
      }));

      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeComponentScreenshot(
        '.dashboard-timeline-container',
        'timeline-different-activity-types'
      );

      // Test individual activity items
      for (let i = 0; i < activityTypes.length; i++) {
        const activityItem = page.locator(`[role="listitem"]`).nth(i);
        await screenshotHelper.takeComponentScreenshot(
          activityItem,
          `timeline-activity-${activityTypes[i].type}`
        );
      }
    });

    test('should show hover and focus states for activities', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      const activityItems = page.locator('[role="listitem"]');
      const itemCount = await activityItems.count();

      if (itemCount > 0) {
        // Test hover state
        const firstActivity = activityItems.first();
        await firstActivity.hover();

        await screenshotHelper.takeComponentScreenshot(
          '.dashboard-timeline-container',
          'timeline-activity-hover'
        );

        // Test focus state
        await firstActivity.focus();

        await screenshotHelper.takeComponentScreenshot(
          '.dashboard-timeline-container',
          'timeline-activity-focus'
        );
      }
    });

    test('should handle expand/collapse states', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      context.activities = MockDataGenerator.createActivities(8); // More than default maxItems

      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Initial collapsed state
      await screenshotHelper.takeComponentScreenshot(
        '.dashboard-timeline-container',
        'timeline-collapsed-state'
      );

      // Expand timeline
      const expandButton = page.locator('button:has-text("Show")');
      if (await expandButton.isVisible()) {
        await expandButton.click();
        await page.waitForTimeout(300);

        // Expanded state
        await screenshotHelper.takeComponentScreenshot(
          '.dashboard-timeline-container',
          'timeline-expanded-state'
        );

        // Test expand button hover
        const collapseButton = page.locator('button:has-text("Show less")');
        if (await collapseButton.isVisible()) {
          await collapseButton.hover();

          await screenshotHelper.takeComponentScreenshot(
            '.dashboard-timeline-container',
            'timeline-collapse-button-hover'
          );
        }
      }
    });

    test('should render different score ranges correctly', async ({ page }) => {
      const scoreScenarios = [
        { name: 'high-scores', scores: [95, 88, 92, 87] },
        { name: 'medium-scores', scores: [75, 68, 72, 79] },
        { name: 'low-scores', scores: [45, 52, 48, 51] },
        { name: 'mixed-scores', scores: [95, 45, 78, 62] },
      ];

      for (const scenario of scoreScenarios) {
        const context = MockDataGenerator.createHighProgressScenario();
        context.activities = scenario.scores.map((score, index) => ({
          id: `activity-${index}`,
          type: 'exam',
          title: `Test ${index + 1}`,
          score,
          date: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
          duration: 3600,
        }));

        await pageHelper.setupMockResponses(context);
        await pageHelper.navigateToDashboard();
        await pageHelper.waitForDashboardLoad();

        await screenshotHelper.takeComponentScreenshot(
          '.dashboard-timeline-container',
          `timeline-${scenario.name}`
        );

        await page.unroute('/api/academia/exams/sessions**');
      }
    });
  });

  test.describe('QuickActions Component States', () => {
    test('should render loading state', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();

      // Trigger loading state
      await pageHelper.triggerLoadingState();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="quick-actions"]',
        'quick-actions-loading'
      );
    });

    test('should render empty state', async ({ page }) => {
      const context = MockDataGenerator.createEmptyScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="quick-actions"]',
        'quick-actions-empty'
      );
    });

    test('should show different button states', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Default state
      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="quick-actions"]',
        'quick-actions-default'
      );

      // Hover states
      const buttons = page.locator('[data-testid="quick-actions"] button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        await button.hover();

        const buttonText = await button.textContent();
        const safeName = buttonText?.toLowerCase().replace(/[^a-z0-9]/g, '-') || `button-${i}`;

        await screenshotHelper.takeComponentScreenshot(
          '[data-testid="quick-actions"]',
          `quick-actions-hover-${safeName}`
        );
      }

      // Focus states
      await page.keyboard.press('Tab');
      const focusedButton = page.locator('[data-testid="quick-actions"] button:focus');

      if (await focusedButton.count() > 0) {
        await screenshotHelper.takeComponentScreenshot(
          '[data-testid="quick-actions"]',
          'quick-actions-focus'
        );
      }
    });

    test('should show disabled states', async ({ page }) => {
      const context = MockDataGenerator.createEmptyScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Trigger disabled state
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('[data-testid="quick-actions"] button');
        buttons.forEach(button => {
          (button as HTMLButtonElement).disabled = true;
        });
      });

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="quick-actions"]',
        'quick-actions-disabled'
      );
    });

    test('should render badge indicators correctly', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Add badges to buttons via JavaScript
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('[data-testid="quick-actions"] button');
        buttons.forEach((button, index) => {
          if (index < 2) { // Add badges to first two buttons
            const badge = document.createElement('div');
            badge.className = 'absolute -top-2 -right-2 min-w-[1.25rem] h-5 text-xs bg-red-500 text-white rounded-full flex items-center justify-center';
            badge.textContent = String(index + 1);
            badge.setAttribute('data-testid', 'action-badge');
            button.style.position = 'relative';
            button.appendChild(badge);
          }
        });
      });

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="quick-actions"]',
        'quick-actions-with-badges'
      );
    });

    test('should handle different layout arrangements', async ({ page }) => {
      const layoutTests = [
        { arrangement: 'horizontal', name: 'horizontal' },
        { arrangement: 'vertical', name: 'vertical' },
        { arrangement: 'grid', name: 'grid' },
      ];

      for (const layout of layoutTests) {
        const context = MockDataGenerator.createHighProgressScenario();
        await pageHelper.setupMockResponses(context);
        await pageHelper.navigateToDashboard();
        await pageHelper.waitForDashboardLoad();

        // Modify layout via CSS
        await page.addStyleTag({
          content: `
            [data-testid="quick-actions"] > div:last-child {
              ${layout.arrangement === 'vertical' ? 'flex-direction: column !important;' : ''}
              ${layout.arrangement === 'grid' ? 'display: grid !important; grid-template-columns: repeat(2, 1fr) !important;' : ''}
            }
          `,
        });

        await page.waitForTimeout(200);

        await screenshotHelper.takeComponentScreenshot(
          '[data-testid="quick-actions"]',
          `quick-actions-layout-${layout.name}`
        );
      }
    });
  });

  test.describe('Interactive State Combinations', () => {
    test('should handle simultaneous component states', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();

      // Setup mixed states - some loading, some error, some loaded
      await page.route('/api/academia/progress/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { progress: context.progress },
          }),
        });
      });

      await page.route('/api/academia/exams/sessions**', route => {
        setTimeout(() => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              error: 'Failed to load sessions',
            }),
          });
        }, 1000);
      });

      await pageHelper.navigateToDashboard();

      // Wait for mixed states to appear
      await page.waitForSelector('[data-testid="dashboard-stats"]', { state: 'visible' });
      await page.waitForTimeout(1500);

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-mixed-component-states',
        fullPage: true,
      });
    });

    test('should handle state transitions smoothly', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();

      // Setup progressive loading
      let step = 0;
      await page.route('/api/academia/progress/**', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { progress: context.progress },
            }),
          });
        }, 1000);
      });

      await pageHelper.navigateToDashboard();

      // Capture loading state
      await page.waitForSelector('[data-testid="dashboard-stats-loading"]', {
        state: 'visible',
      });
      await screenshotHelper.takeScreenshot({
        name: 'transition-1-loading',
        fullPage: true,
      });

      // Capture loaded state
      await page.waitForSelector('[data-testid="dashboard-stats"]', {
        state: 'visible',
      });
      await screenshotHelper.takeScreenshot({
        name: 'transition-2-loaded',
        fullPage: true,
      });
    });

    test('should maintain visual consistency during rapid state changes', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Rapid interactions
      const statCards = page.locator('[data-testid^="stat-card-"]');
      const cardCount = await statCards.count();

      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        await statCards.nth(i).hover();
        await page.waitForTimeout(100);
        await statCards.nth(i).click();
        await page.waitForTimeout(100);
      }

      await screenshotHelper.takeScreenshot({
        name: 'rapid-interactions-final-state',
        fullPage: true,
      });

      // Verify no visual glitches
      const visualConsistency = await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid^="stat-card-"]');
        let inconsistencies = 0;

        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) {
            inconsistencies++;
          }
        });

        return inconsistencies;
      });

      expect(visualConsistency).toBe(0);
    });
  });

  test.describe('Error Recovery States', () => {
    test('should show retry functionality for failed components', async ({ page }) => {
      let retryCount = 0;

      // Setup failing then succeeding response
      await page.route('/api/academia/progress/**', route => {
        retryCount++;
        if (retryCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server error' }),
          });
        } else {
          const context = MockDataGenerator.createHighProgressScenario();
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: { progress: context.progress },
            }),
          });
        }
      });

      await pageHelper.navigateToDashboard();

      // Wait for error state
      await page.waitForSelector('[data-testid="dashboard-stats-error"]', {
        state: 'visible',
      });

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats-error"]',
        'error-before-retry'
      );

      // Click retry button
      const retryButton = page.locator('[data-testid="dashboard-stats-error"] button');
      await retryButton.click();

      // Wait for successful load
      await page.waitForSelector('[data-testid="dashboard-stats"]', {
        state: 'visible',
      });

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats"]',
        'error-after-retry-success'
      );
    });

    test('should handle network timeout gracefully', async ({ page }) => {
      // Setup timeout scenario
      await page.route('/api/academia/progress/**', route => {
        // Never respond to simulate timeout
      });

      await pageHelper.navigateToDashboard();

      // Wait for timeout handling
      await page.waitForTimeout(5000);

      await screenshotHelper.takeScreenshot({
        name: 'network-timeout-handling',
        fullPage: true,
      });
    });
  });
});