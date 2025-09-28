/**
 * Dashboard Layout Visual Regression Tests
 * Comprehensive visual testing for dashboard components and layouts
 */

import { test, expect } from '@playwright/test';
import {
  DashboardPageHelper,
  ScreenshotHelper,
  MockDataGenerator,
  AnimationHelper,
  VisualRegressionDetector,
  VisualTestContext,
} from './utils/visual-test-helpers';

test.describe('Dashboard Layout Visual Regression', () => {
  let pageHelper: DashboardPageHelper;
  let screenshotHelper: ScreenshotHelper;
  let animationHelper: AnimationHelper;
  let regressionDetector: VisualRegressionDetector;

  test.beforeEach(async ({ page }) => {
    pageHelper = new DashboardPageHelper(page);
    screenshotHelper = new ScreenshotHelper(page);
    animationHelper = new AnimationHelper(page);
    regressionDetector = new VisualRegressionDetector(page);

    // Disable animations for consistent screenshots
    await animationHelper.disableAnimations();

    // Set consistent viewport
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test.describe('Complete Dashboard Layout', () => {
    test('should render complete dashboard with high progress data', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Take full page screenshot
      await screenshotHelper.takeScreenshot({
        name: 'dashboard-complete-high-progress',
        fullPage: true,
      });

      // Check for visual inconsistencies
      const consistency = await regressionDetector.checkVisualConsistency();
      expect(consistency.score).toBeGreaterThan(80);
    });

    test('should render complete dashboard with low progress data', async ({ page }) => {
      const context = MockDataGenerator.createLowProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-complete-low-progress',
        fullPage: true,
      });
    });

    test('should render complete dashboard with empty data', async ({ page }) => {
      const context = MockDataGenerator.createEmptyScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-complete-empty-state',
        fullPage: true,
      });
    });

    test('should handle loading states consistently', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();

      // Setup delayed responses to capture loading states
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
        }, 2000);
      });

      await pageHelper.navigateToDashboard();

      // Capture loading state
      await page.waitForSelector('[data-testid="dashboard-stats-loading"]', {
        state: 'visible',
      });

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-loading-state',
        fullPage: true,
      });

      // Wait for loaded state
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-loaded-state',
        fullPage: true,
      });
    });

    test('should handle error states gracefully', async ({ page }) => {
      // Setup error responses
      await page.route('/api/academia/progress/**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal server error',
          }),
        });
      });

      await pageHelper.navigateToDashboard();

      // Wait for error state
      await page.waitForSelector('[data-testid="dashboard-stats-error"]', {
        state: 'visible',
      });

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-error-state',
        fullPage: true,
      });
    });
  });

  test.describe('Dashboard Header Component', () => {
    test('should render course header with all elements', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      const selectors = pageHelper.getSelectors();
      await screenshotHelper.takeComponentScreenshot(
        selectors.header,
        'dashboard-header-complete'
      );
    });

    test('should handle long course titles gracefully', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      context.course.title = 'Very Long Course Title That Should Wrap Properly in the Header Component Without Breaking Layout';

      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      const selectors = pageHelper.getSelectors();
      await screenshotHelper.takeComponentScreenshot(
        selectors.header,
        'dashboard-header-long-title'
      );
    });

    test('should display different language and level combinations', async ({ page }) => {
      const languages = [
        { language: 'english', level: 'b2', title: 'English B2 Certification' },
        { language: 'spanish', level: 'c1', title: 'Spanish C1 Advanced' },
        { language: 'valenciano', level: 'c2', title: 'Valenciano C2 Proficiency' },
      ];

      for (const config of languages) {
        const context = MockDataGenerator.createHighProgressScenario();
        context.course = { ...context.course, ...config };

        await pageHelper.setupMockResponses(context);
        await pageHelper.navigateToDashboard();
        await pageHelper.waitForDashboardLoad();

        const selectors = pageHelper.getSelectors();
        await screenshotHelper.takeComponentScreenshot(
          selectors.header,
          `dashboard-header-${config.language}-${config.level}`
        );
      }
    });
  });

  test.describe('Dashboard Stats Component', () => {
    test('should render all stat cards with different values', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      const selectors = pageHelper.getSelectors();
      await screenshotHelper.takeComponentScreenshot(
        selectors.stats,
        'dashboard-stats-high-values'
      );
    });

    test('should render stat cards with low/zero values', async ({ page }) => {
      const context = MockDataGenerator.createEmptyScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      const selectors = pageHelper.getSelectors();
      await screenshotHelper.takeComponentScreenshot(
        selectors.stats,
        'dashboard-stats-zero-values'
      );
    });

    test('should show hover states for interactive cards', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Hover over first stat card
      const firstCard = page.locator('[data-testid^="stat-card-"]').first();
      await firstCard.hover();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats"]',
        'dashboard-stats-hover-state'
      );
    });

    test('should render loading skeleton correctly', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();

      // Setup delayed response
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
      });

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="dashboard-stats-loading"]',
        'dashboard-stats-skeleton'
      );
    });

    test('should handle trend indicators properly', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      // Add trend data to mock responses
      context.progress.component_progress = {
        reading: 0.82,
        listening: 0.71,
        writing: 0.68,
        speaking: 0.79,
      };

      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Check for trend icons
      const trendIcons = page.locator('[data-testid^="trend-icon-"]');
      await expect(trendIcons.first()).toBeVisible();

      const selectors = pageHelper.getSelectors();
      await screenshotHelper.takeComponentScreenshot(
        selectors.stats,
        'dashboard-stats-with-trends'
      );
    });
  });

  test.describe('Activity Timeline Component', () => {
    test('should render timeline with multiple activities', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="activity-timeline"]',
        'activity-timeline-multiple'
      );
    });

    test('should render empty timeline state', async ({ page }) => {
      const context = MockDataGenerator.createEmptyScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="activity-timeline"]',
        'activity-timeline-empty'
      );
    });

    test('should show expanded timeline view', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      // Add more activities for expansion test
      context.activities = MockDataGenerator.createActivities(10);

      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Expand timeline
      await pageHelper.expandActivityTimeline();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="activity-timeline"]',
        'activity-timeline-expanded'
      );
    });

    test('should render different activity types correctly', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      // Create activities with specific types
      context.activities = [
        {
          id: 'exam-1',
          type: 'exam',
          title: 'Reading Comprehension Test',
          score: 85,
          duration: 2700,
          date: new Date().toISOString(),
          metadata: { difficulty: 'medium' },
        },
        {
          id: 'study-1',
          type: 'study',
          title: 'Grammar Study Session',
          duration: 1800,
          date: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'achievement-1',
          type: 'achievement',
          title: 'First Week Milestone',
          date: new Date(Date.now() - 172800000).toISOString(),
        },
      ];

      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="activity-timeline"]',
        'activity-timeline-different-types'
      );
    });

    test('should handle loading state for timeline', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();

      // Setup delayed response for exam sessions
      await page.route('/api/academia/exams/sessions**', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: context.examSessions,
            }),
          });
        }, 2000);
      });

      await pageHelper.navigateToDashboard();

      // Wait for timeline loading skeleton
      await page.waitForSelector('[role="list"][aria-label="Loading activities"]', {
        state: 'visible',
      });

      await screenshotHelper.takeComponentScreenshot(
        '.dashboard-timeline-container',
        'activity-timeline-loading'
      );
    });
  });

  test.describe('Quick Actions Component', () => {
    test('should render all quick action buttons', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="quick-actions"]',
        'quick-actions-complete'
      );
    });

    test('should show disabled state for actions', async ({ page }) => {
      const context = MockDataGenerator.createEmptyScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="quick-actions"]',
        'quick-actions-disabled'
      );
    });

    test('should display loading state for primary action', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Trigger loading state by clicking primary action
      const primaryButton = page.locator('[data-primary="true"]').first();
      await primaryButton.click();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="quick-actions"]',
        'quick-actions-loading'
      );
    });

    test('should handle empty actions state', async ({ page }) => {
      const context = MockDataGenerator.createEmptyScenario();
      // Mock empty actions response
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeComponentScreenshot(
        '[data-testid="quick-actions"]',
        'quick-actions-empty'
      );
    });
  });

  test.describe('Layout Stability Tests', () => {
    test('should maintain stable layout during data loading', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();

      // Setup progressive loading with delays
      let progressLoaded = false;
      let activitiesLoaded = false;

      await page.route('/api/academia/progress/**', route => {
        setTimeout(() => {
          progressLoaded = true;
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

      await page.route('/api/academia/exams/sessions**', route => {
        setTimeout(() => {
          activitiesLoaded = true;
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: context.examSessions,
            }),
          });
        }, 2000);
      });

      await pageHelper.navigateToDashboard();

      // Take screenshots at different loading stages
      await screenshotHelper.takeScreenshot({
        name: 'layout-stability-initial',
        fullPage: true,
      });

      // Wait for progress to load
      await page.waitForFunction(() => progressLoaded);
      await page.waitForTimeout(100);

      await screenshotHelper.takeScreenshot({
        name: 'layout-stability-progress-loaded',
        fullPage: true,
      });

      // Wait for activities to load
      await page.waitForFunction(() => activitiesLoaded);
      await page.waitForTimeout(100);

      await screenshotHelper.takeScreenshot({
        name: 'layout-stability-complete',
        fullPage: true,
      });

      // Check for layout shifts
      const shifts = await regressionDetector.detectLayoutShifts();
      expect(shifts.filter(shift => shift.value > 0.1)).toHaveLength(0);
    });

    test('should maintain layout integrity during interactions', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Take baseline screenshot
      await screenshotHelper.takeScreenshot({
        name: 'layout-integrity-baseline',
        fullPage: true,
      });

      // Perform various interactions
      await pageHelper.hoverOverStats();
      await pageHelper.expandActivityTimeline();

      // Take screenshot after interactions
      await screenshotHelper.takeScreenshot({
        name: 'layout-integrity-after-interactions',
        fullPage: true,
      });

      // Check visual consistency
      const consistency = await regressionDetector.checkVisualConsistency();
      expect(consistency.score).toBeGreaterThan(85);
    });
  });

  test.describe('Comprehensive Layout Testing', () => {
    test('should render complete dashboard with all components visible', async ({ page }) => {
      const context = MockDataGenerator.createHighProgressScenario();
      context.activities = MockDataGenerator.createActivities(5);

      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      // Verify all components are visible
      const selectors = pageHelper.getSelectors();
      for (const [name, selector] of Object.entries(selectors)) {
        const element = page.locator(selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
        }
      }

      // Take comprehensive screenshot
      await screenshotHelper.takeScreenshot({
        name: 'dashboard-comprehensive-layout',
        fullPage: true,
      });
    });

    test('should handle edge cases in component rendering', async ({ page }) => {
      // Create edge case scenario with extreme values
      const context = MockDataGenerator.createHighProgressScenario();
      context.progress.overall_progress = 100;
      context.progress.average_score = 100;
      context.progress.component_progress = {
        reading: 1.0,
        listening: 1.0,
        writing: 1.0,
        speaking: 1.0,
      };

      await pageHelper.setupMockResponses(context);
      await pageHelper.navigateToDashboard();
      await pageHelper.waitForDashboardLoad();

      await screenshotHelper.takeScreenshot({
        name: 'dashboard-edge-case-perfect-scores',
        fullPage: true,
      });
    });
  });
});