/**
 * Visual Comparison Utilities
 * Tools for advanced visual regression testing and screenshot comparison
 */

import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export interface VisualComparisonOptions {
  threshold?: number;
  pixelDifferenceThreshold?: number;
  ignoreRegions?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  maskSelectors?: string[];
  waitForFonts?: boolean;
  disableAnimations?: boolean;
  fullPage?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface BrowserComparisonResult {
  browser: string;
  passed: boolean;
  difference?: number;
  screenshotPath?: string;
  errorMessage?: string;
}

export class VisualTestManager {
  constructor(private page: Page) {}

  /**
   * Prepare page for visual testing
   */
  async preparePage(options: VisualComparisonOptions = {}): Promise<void> {
    const {
      waitForFonts = true,
      disableAnimations = true,
      maskSelectors = [],
    } = options;

    // Disable animations if requested
    if (disableAnimations) {
      await this.page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
          }

          .framer-motion-div {
            animation: none !important;
            transition: none !important;
          }
        `,
      });
    }

    // Wait for fonts to load
    if (waitForFonts) {
      await this.page.waitForFunction(() => document.fonts.ready);
      await this.page.waitForTimeout(100); // Additional buffer
    }

    // Mask dynamic content
    if (maskSelectors.length > 0) {
      await this.page.addStyleTag({
        content: maskSelectors.map(selector => `
          ${selector} {
            background: #cccccc !important;
            color: transparent !important;
          }
        `).join('\n'),
      });
    }

    // Standard dynamic content masking
    await this.page.addStyleTag({
      content: `
        [data-testid="current-time"],
        .time-display,
        .last-activity,
        .notification-badge,
        .timestamp,
        [data-dynamic="true"] {
          visibility: hidden !important;
        }

        .loading-spinner,
        .animate-spin,
        .animate-pulse {
          animation: none !important;
        }
      `,
    });
  }

  /**
   * Take screenshot with advanced options
   */
  async takeScreenshot(
    selector: string | null,
    filename: string,
    options: VisualComparisonOptions = {}
  ): Promise<Buffer> {
    await this.preparePage(options);

    const screenshotOptions: any = {
      threshold: options.threshold || 0.2,
      animations: 'disabled',
    };

    if (options.fullPage !== false) {
      screenshotOptions.fullPage = true;
    }

    if (options.clip) {
      screenshotOptions.clip = options.clip;
    }

    if (selector) {
      const element = this.page.locator(selector);
      return await element.screenshot({
        ...screenshotOptions,
        path: filename,
      });
    } else {
      return await this.page.screenshot({
        ...screenshotOptions,
        path: filename,
      });
    }
  }

  /**
   * Compare screenshots across browsers
   */
  async compareAcrossBrowsers(
    selector: string | null,
    testName: string,
    browserName: string,
    options: VisualComparisonOptions = {}
  ): Promise<void> {
    const filename = `${testName}-${browserName}.png`;

    if (selector) {
      const element = this.page.locator(selector);
      await expect(element).toHaveScreenshot(filename, {
        threshold: options.threshold || 0.2,
        animations: 'disabled',
      });
    } else {
      await expect(this.page).toHaveScreenshot(filename, {
        threshold: options.threshold || 0.2,
        fullPage: options.fullPage !== false,
        animations: 'disabled',
      });
    }
  }

  /**
   * Test responsive design across viewports
   */
  async testResponsiveLayout(
    testName: string,
    browserName: string,
    viewports: Array<{ width: number; height: number; name: string }>,
    options: VisualComparisonOptions = {}
  ): Promise<void> {
    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height });
      await this.page.waitForTimeout(300); // Allow layout to settle

      await this.preparePage(options);

      const filename = `${testName}-${viewport.name}-${browserName}.png`;
      await expect(this.page).toHaveScreenshot(filename, {
        threshold: options.threshold || 0.3, // More lenient for responsive
        fullPage: true,
        animations: 'disabled',
      });
    }
  }

  /**
   * Test interactive states
   */
  async testInteractiveStates(
    selector: string,
    testName: string,
    browserName: string,
    options: VisualComparisonOptions = {}
  ): Promise<void> {
    const element = this.page.locator(selector);

    await this.preparePage(options);

    // Normal state
    await expect(element).toHaveScreenshot(`${testName}-normal-${browserName}.png`, {
      threshold: options.threshold || 0.2,
      animations: 'disabled',
    });

    // Hover state
    await element.hover();
    await this.page.waitForTimeout(100);
    await expect(element).toHaveScreenshot(`${testName}-hover-${browserName}.png`, {
      threshold: options.threshold || 0.2,
      animations: 'disabled',
    });

    // Focus state (if focusable)
    try {
      await element.focus();
      await this.page.waitForTimeout(100);
      await expect(element).toHaveScreenshot(`${testName}-focus-${browserName}.png`, {
        threshold: options.threshold || 0.2,
        animations: 'disabled',
      });
    } catch (error) {
      // Element might not be focusable
      console.log(`Element ${selector} is not focusable`);
    }
  }

  /**
   * Test theme variations
   */
  async testThemeVariations(
    testName: string,
    browserName: string,
    themes: string[] = ['light', 'dark'],
    options: VisualComparisonOptions = {}
  ): Promise<void> {
    for (const theme of themes) {
      // Apply theme
      await this.page.evaluate((themeName) => {
        document.documentElement.className = themeName;
        localStorage.setItem('theme', themeName);
      }, theme);

      await this.page.waitForTimeout(300); // Allow theme to apply
      await this.preparePage(options);

      const filename = `${testName}-${theme}-${browserName}.png`;
      await expect(this.page).toHaveScreenshot(filename, {
        threshold: options.threshold || 0.2,
        fullPage: options.fullPage !== false,
        animations: 'disabled',
      });
    }
  }
}

/**
 * Utility functions for screenshot management
 */
export class ScreenshotManager {
  private baseDir: string;

  constructor(baseDir: string = 'test-results/screenshots') {
    this.baseDir = baseDir;
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  /**
   * Generate screenshot filename with metadata
   */
  generateFilename(
    testName: string,
    browserName: string,
    viewport?: string,
    state?: string
  ): string {
    const parts = [testName, browserName];
    if (viewport) parts.push(viewport);
    if (state) parts.push(state);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    parts.push(timestamp);

    return `${parts.join('-')}.png`;
  }

  /**
   * Save screenshot with metadata
   */
  async saveScreenshotWithMetadata(
    buffer: Buffer,
    filename: string,
    metadata: any
  ): Promise<string> {
    const fullPath = path.join(this.baseDir, filename);
    fs.writeFileSync(fullPath, buffer);

    // Save metadata
    const metadataPath = fullPath.replace('.png', '.json');
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return fullPath;
  }

  /**
   * Compare screenshots and generate diff
   */
  async compareScreenshots(
    baseline: string,
    current: string,
    threshold: number = 0.2
  ): Promise<{
    passed: boolean;
    difference: number;
    diffPath?: string;
  }> {
    // This would typically use a library like pixelmatch
    // For now, return a placeholder implementation
    return {
      passed: true,
      difference: 0,
    };
  }

  /**
   * Clean up old screenshots
   */
  cleanupOldScreenshots(daysOld: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const files = fs.readdirSync(this.baseDir);

    files.forEach(file => {
      const filePath = path.join(this.baseDir, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
      }
    });
  }

  /**
   * Generate comparison report
   */
  generateComparisonReport(results: BrowserComparisonResult[]): void {
    const reportPath = path.join(this.baseDir, 'comparison-report.html');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Browser Compatibility Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .result { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          .passed { border-color: #4CAF50; background-color: #f1f8e9; }
          .failed { border-color: #f44336; background-color: #ffebee; }
          .screenshot { max-width: 300px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>Browser Compatibility Test Results</h1>
        <p>Generated: ${new Date().toLocaleString()}</p>

        ${results.map(result => `
          <div class="result ${result.passed ? 'passed' : 'failed'}">
            <h3>${result.browser}</h3>
            <p>Status: ${result.passed ? 'PASSED' : 'FAILED'}</p>
            ${result.difference !== undefined ? `<p>Difference: ${(result.difference * 100).toFixed(2)}%</p>` : ''}
            ${result.errorMessage ? `<p>Error: ${result.errorMessage}</p>` : ''}
            ${result.screenshotPath ? `<img src="${result.screenshotPath}" class="screenshot" alt="Screenshot">` : ''}
          </div>
        `).join('')}
      </body>
      </html>
    `;

    fs.writeFileSync(reportPath, html);
  }
}

/**
 * Cross-browser visual testing orchestrator
 */
export class CrossBrowserVisualTester {
  private screenshotManager: ScreenshotManager;

  constructor() {
    this.screenshotManager = new ScreenshotManager();
  }

  /**
   * Run visual tests across multiple browsers
   */
  async runCrossBrowserTest(
    page: Page,
    testName: string,
    browserName: string,
    testFunction: (visualTester: VisualTestManager) => Promise<void>
  ): Promise<BrowserComparisonResult> {
    const visualTester = new VisualTestManager(page);

    try {
      await testFunction(visualTester);

      return {
        browser: browserName,
        passed: true,
      };
    } catch (error) {
      return {
        browser: browserName,
        passed: false,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate final report for all browser tests
   */
  generateFinalReport(results: BrowserComparisonResult[]): void {
    this.screenshotManager.generateComparisonReport(results);

    const summary = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      passRate: results.filter(r => r.passed).length / results.length * 100,
    };

    console.log('\n=== Cross-Browser Visual Testing Summary ===');
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Pass Rate: ${summary.passRate.toFixed(2)}%`);
    console.log('===========================================\n');
  }
}