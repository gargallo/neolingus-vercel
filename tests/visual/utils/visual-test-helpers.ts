/**
 * Visual Testing Utilities and Helper Functions
 * Comprehensive utilities for dashboard visual regression testing
 */

import { Page, Locator, expect } from '@playwright/test';
import { ComponentFixture } from '@angular/core/testing';

// Test data interfaces
export interface MockUser {
  id: string;
  email: string;
  role: string;
  profile: {
    full_name: string;
    avatar_url?: string;
  };
}

export interface MockCourse {
  id: string;
  title: string;
  language: string;
  level: string;
  provider: string;
  providerName: string;
}

export interface MockProgress {
  overall_progress: number;
  component_progress: Record<string, number>;
  total_sessions: number;
  average_score: number;
  readiness_score: number;
  last_session: string;
}

export interface MockActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  score?: number;
  duration?: number;
  date: string;
  metadata?: Record<string, any>;
}

export interface VisualTestContext {
  user: MockUser;
  course: MockCourse;
  progress: MockProgress;
  activities: MockActivity[];
  examSessions: any[];
  availableExams: any[];
}

// Screenshot configuration
export interface ScreenshotOptions {
  name: string;
  fullPage?: boolean;
  clip?: { x: number; y: number; width: number; height: number };
  mask?: Locator[];
  threshold?: number;
  maxDiffPixels?: number;
  animations?: 'disabled' | 'allow';
  timeout?: number;
}

// Viewport configurations
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  desktop: { width: 1440, height: 900 },
  desktopLarge: { width: 1920, height: 1080 },
} as const;

// Animation control utilities
export class AnimationHelper {
  constructor(private page: Page) {}

  /**
   * Disable all animations for consistent visual testing
   */
  async disableAnimations(): Promise<void> {
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          transform: none !important;
        }

        .motion-reduce {
          animation: none !important;
          transition: none !important;
        }

        /* Disable framer-motion animations */
        [data-framer-motion] {
          animation: none !important;
          transition: none !important;
        }
      `,
    });

    // Set reduced motion preference
    await this.page.evaluate(() => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => {
          if (query === '(prefers-reduced-motion: reduce)') {
            return {
              matches: true,
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
            };
          }
          return {
            matches: false,
            media: query,
            onchange: null,
            addListener: () => {},
            removeListener: () => {},
          };
        },
      });
    });
  }

  /**
   * Wait for all images to load
   */
  async waitForImages(): Promise<void> {
    await this.page.evaluate(() => {
      return Promise.all(
        Array.from(document.querySelectorAll('img')).map(img => {
          if (img.complete && img.naturalHeight !== 0) {
            return Promise.resolve();
          }
          return new Promise(resolve => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
          });
        })
      );
    });
  }

  /**
   * Wait for all CSS animations to complete
   */
  async waitForAnimations(): Promise<void> {
    await this.page.evaluate(() => {
      return Promise.all(
        Array.from(document.querySelectorAll('*')).map(element => {
          return new Promise(resolve => {
            const animations = element.getAnimations();
            if (animations.length === 0) {
              resolve(undefined);
            } else {
              Promise.all(animations.map(animation => animation.finished))
                .then(() => resolve(undefined))
                .catch(() => resolve(undefined));
            }
          });
        })
      );
    });
  }
}

// Mock data generators
export class MockDataGenerator {
  static createUser(overrides: Partial<MockUser> = {}): MockUser {
    return {
      id: 'test-user-123',
      email: 'test@example.com',
      role: 'student',
      profile: {
        full_name: 'Test User',
        avatar_url: '/test-avatar.png',
      },
      ...overrides,
    };
  }

  static createCourse(overrides: Partial<MockCourse> = {}): MockCourse {
    return {
      id: 'english-b2-test',
      title: 'English B2 Certification',
      language: 'english',
      level: 'b2',
      provider: 'cambridge',
      providerName: 'Cambridge Assessment',
      ...overrides,
    };
  }

  static createProgress(overrides: Partial<MockProgress> = {}): MockProgress {
    return {
      overall_progress: 75.5,
      component_progress: {
        reading: 0.82,
        listening: 0.71,
        writing: 0.68,
        speaking: 0.79,
      },
      total_sessions: 24,
      average_score: 78.2,
      readiness_score: 0.755,
      last_session: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      ...overrides,
    };
  }

  static createActivities(count: number = 5): MockActivity[] {
    const activities: MockActivity[] = [];
    const types = ['exam', 'study', 'achievement', 'progress'];
    const titles = [
      'Reading Comprehension Test',
      'Listening Practice Session',
      'Writing Exercise Complete',
      'Speaking Assessment',
      'Grammar Review',
    ];

    for (let i = 0; i < count; i++) {
      activities.push({
        id: `activity-${i + 1}`,
        type: types[i % types.length],
        title: titles[i % titles.length],
        description: `Test description for activity ${i + 1}`,
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        duration: Math.floor(Math.random() * 3600) + 600, // 10-70 minutes
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          difficulty: ['easy', 'medium', 'hard'][i % 3],
          improvement: i % 3 === 0 ? Math.floor(Math.random() * 10) + 5 : undefined,
        },
      });
    }

    return activities;
  }

  static createHighProgressScenario(): VisualTestContext {
    return {
      user: this.createUser(),
      course: this.createCourse(),
      progress: this.createProgress({
        overall_progress: 92.3,
        average_score: 88.7,
        total_sessions: 45,
        component_progress: {
          reading: 0.95,
          listening: 0.89,
          writing: 0.91,
          speaking: 0.94,
        },
      }),
      activities: this.createActivities(8),
      examSessions: [],
      availableExams: [],
    };
  }

  static createLowProgressScenario(): VisualTestContext {
    return {
      user: this.createUser(),
      course: this.createCourse(),
      progress: this.createProgress({
        overall_progress: 23.1,
        average_score: 45.2,
        total_sessions: 3,
        component_progress: {
          reading: 0.35,
          listening: 0.18,
          writing: 0.21,
          speaking: 0.28,
        },
      }),
      activities: this.createActivities(2),
      examSessions: [],
      availableExams: [],
    };
  }

  static createEmptyScenario(): VisualTestContext {
    return {
      user: this.createUser(),
      course: this.createCourse(),
      progress: this.createProgress({
        overall_progress: 0,
        average_score: 0,
        total_sessions: 0,
        component_progress: {
          reading: 0,
          listening: 0,
          writing: 0,
          speaking: 0,
        },
      }),
      activities: [],
      examSessions: [],
      availableExams: [],
    };
  }
}

// Page interaction utilities
export class DashboardPageHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to dashboard with authentication bypass
   */
  async navigateToDashboard(courseId: string = 'english-b2-test'): Promise<void> {
    // Mock authentication for testing
    await this.page.goto(`/dashboard/english/b2`);

    // Wait for initial load
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Setup mock API responses for dashboard data
   */
  async setupMockResponses(context: VisualTestContext): Promise<void> {
    // Mock user authentication
    await this.page.route('/api/auth/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: context.user,
          session: { access_token: 'mock-token' },
        }),
      });
    });

    // Mock progress data
    await this.page.route(`/api/academia/progress/${context.course.id}`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            progress: context.progress,
            analytics: {
              componentAnalysis: {
                reading: { averageScore: 82, bestScore: 95, sessionsCompleted: 12 },
                listening: { averageScore: 71, bestScore: 88, sessionsCompleted: 8 },
                writing: { averageScore: 68, bestScore: 79, sessionsCompleted: 6 },
                speaking: { averageScore: 79, bestScore: 91, sessionsCompleted: 9 },
              },
            },
          },
        }),
      });
    });

    // Mock exam sessions
    await this.page.route('/api/academia/exams/sessions**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: context.examSessions,
        }),
      });
    });

    // Mock available exams
    await this.page.route('/api/academia/exams**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: context.availableExams,
        }),
      });
    });

    // Mock recommendations
    await this.page.route('/api/academia/recommendations', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'rec-1',
              title: 'Focus on listening comprehension',
              description: 'Your listening scores show room for improvement',
              priority: 'high',
            },
            {
              id: 'rec-2',
              title: 'Practice writing exercises',
              description: 'Regular writing practice will boost your scores',
              priority: 'medium',
            },
          ],
        }),
      });
    });
  }

  /**
   * Wait for dashboard to fully load
   */
  async waitForDashboardLoad(): Promise<void> {
    // Wait for main dashboard container
    await this.page.waitForSelector('[data-testid="dashboard-overview"]', {
      state: 'visible',
      timeout: 10000
    });

    // Wait for stats to load
    await this.page.waitForSelector('[data-testid="dashboard-stats"]', {
      state: 'visible'
    });

    // Wait for network to be idle
    await this.page.waitForLoadState('networkidle');

    // Wait for images and animations
    const animationHelper = new AnimationHelper(this.page);
    await animationHelper.waitForImages();
    await animationHelper.waitForAnimations();
  }

  /**
   * Get dashboard component selectors
   */
  getSelectors() {
    return {
      overview: '[data-testid="dashboard-overview"]',
      stats: '[data-testid="dashboard-stats"]',
      timeline: '[data-testid="activity-timeline"]',
      quickActions: '[data-testid="quick-actions"]',
      progressChart: '[data-testid="progress-chart"]',
      header: '[data-testid="course-header"]',
      navigation: '[data-testid="course-navigation"]',
      footer: '[data-testid="dashboard-footer"]',
    };
  }

  /**
   * Trigger component states for testing
   */
  async triggerLoadingState(): Promise<void> {
    await this.page.evaluate(() => {
      // Trigger loading states in components
      window.dispatchEvent(new CustomEvent('dashboard:loading', { detail: true }));
    });
  }

  async triggerErrorState(): Promise<void> {
    await this.page.evaluate(() => {
      // Trigger error states in components
      window.dispatchEvent(new CustomEvent('dashboard:error', {
        detail: 'Test error message'
      }));
    });
  }

  /**
   * Simulate user interactions
   */
  async hoverOverStats(): Promise<void> {
    const statsElements = await this.page.locator('[data-testid^="stat-card-"]').all();
    for (const element of statsElements) {
      await element.hover();
      await this.page.waitForTimeout(200);
    }
  }

  async expandActivityTimeline(): Promise<void> {
    const expandButton = this.page.locator('button:has-text("Show more")');
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Test responsive behavior
   */
  async testResponsiveLayout(viewport: keyof typeof VIEWPORTS): Promise<void> {
    await this.page.setViewportSize(VIEWPORTS[viewport]);
    await this.page.waitForTimeout(500); // Allow layout to settle
    await this.waitForDashboardLoad();
  }
}

// Screenshot utilities
export class ScreenshotHelper {
  constructor(private page: Page) {}

  /**
   * Take a standardized screenshot with consistent settings
   */
  async takeScreenshot(options: ScreenshotOptions): Promise<void> {
    const defaultOptions = {
      fullPage: true,
      animations: 'disabled' as const,
      threshold: 0.2,
      timeout: 5000,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // Disable animations before screenshot
    const animationHelper = new AnimationHelper(this.page);
    await animationHelper.disableAnimations();

    // Wait for stability
    await this.page.waitForTimeout(500);

    // Take screenshot
    await expect(this.page).toHaveScreenshot(
      `${options.name}.png`,
      {
        fullPage: mergedOptions.fullPage,
        clip: mergedOptions.clip,
        mask: mergedOptions.mask,
        threshold: mergedOptions.threshold,
        maxDiffPixels: mergedOptions.maxDiffPixels,
        animations: mergedOptions.animations,
        timeout: mergedOptions.timeout,
      }
    );
  }

  /**
   * Take component-specific screenshot
   */
  async takeComponentScreenshot(
    selector: string,
    name: string,
    options: Partial<ScreenshotOptions> = {}
  ): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();

    await expect(element).toHaveScreenshot(
      `${name}.png`,
      {
        threshold: options.threshold || 0.2,
        animations: 'disabled',
        ...options,
      }
    );
  }

  /**
   * Take theme comparison screenshots
   */
  async takeThemeScreenshots(
    name: string,
    selector?: string
  ): Promise<void> {
    // Light theme
    await this.page.emulateMedia({ colorScheme: 'light' });
    await this.page.waitForTimeout(300);

    if (selector) {
      await this.takeComponentScreenshot(selector, `${name}-light`);
    } else {
      await this.takeScreenshot({ name: `${name}-light` });
    }

    // Dark theme
    await this.page.emulateMedia({ colorScheme: 'dark' });
    await this.page.waitForTimeout(300);

    if (selector) {
      await this.takeComponentScreenshot(selector, `${name}-dark`);
    } else {
      await this.takeScreenshot({ name: `${name}-dark` });
    }

    // Reset to light theme
    await this.page.emulateMedia({ colorScheme: 'light' });
  }
}

// Error detection utilities
export class VisualRegressionDetector {
  constructor(private page: Page) {}

  /**
   * Check for layout shift issues
   */
  async detectLayoutShifts(): Promise<any[]> {
    return await this.page.evaluate(() => {
      return new Promise(resolve => {
        const shifts: any[] = [];
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              shifts.push({
                value: (entry as any).value,
                sources: (entry as any).sources,
                startTime: entry.startTime,
              });
            }
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });

        // Collect for 2 seconds
        setTimeout(() => {
          observer.disconnect();
          resolve(shifts);
        }, 2000);
      });
    });
  }

  /**
   * Check for visual inconsistencies
   */
  async checkVisualConsistency(): Promise<{ issues: string[]; score: number }> {
    const issues: string[] = [];

    // Check for missing images
    const brokenImages = await this.page.locator('img[src=""], img:not([src])').count();
    if (brokenImages > 0) {
      issues.push(`${brokenImages} broken or missing images found`);
    }

    // Check for overflow issues
    const overflowElements = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      return elements.filter(el => {
        const rect = el.getBoundingClientRect();
        const parent = el.parentElement?.getBoundingClientRect();
        if (!parent) return false;
        return rect.width > parent.width || rect.height > parent.height;
      }).length;
    });

    if (overflowElements > 0) {
      issues.push(`${overflowElements} elements with potential overflow detected`);
    }

    // Check for accessibility color contrast
    const lowContrastElements = await this.page.evaluate(() => {
      // Simplified contrast check - in reality would use more sophisticated algorithms
      const elements = Array.from(document.querySelectorAll('*'));
      let lowContrast = 0;

      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;

        // Simple heuristic - actual implementation would calculate proper contrast ratios
        if (color === backgroundColor ||
            (color.includes('gray') && backgroundColor.includes('gray'))) {
          lowContrast++;
        }
      });

      return lowContrast;
    });

    if (lowContrastElements > 5) {
      issues.push(`${lowContrastElements} elements with potential contrast issues`);
    }

    const score = Math.max(0, 100 - (issues.length * 20));
    return { issues, score };
  }
}

// Export all utilities
export {
  AnimationHelper,
  MockDataGenerator,
  DashboardPageHelper,
  ScreenshotHelper,
  VisualRegressionDetector,
  VIEWPORTS,
};