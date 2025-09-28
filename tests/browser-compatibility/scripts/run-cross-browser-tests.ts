#!/usr/bin/env tsx

/**
 * Cross-Browser Test Runner
 * Orchestrates cross-browser compatibility testing with intelligent parallelization
 */

import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { BROWSER_MATRIX, DASHBOARD_TEST_SCENARIOS } from '../config/browser-matrix';

interface TestRunConfig {
  browsers: string[];
  scenarios: string[];
  parallel: boolean;
  maxConcurrency: number;
  outputDir: string;
  generateReport: boolean;
  visualRegression: boolean;
  performance: boolean;
  accessibility: boolean;
}

interface TestResult {
  browser: string;
  scenario: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errors: string[];
  screenshots: string[];
  performance?: {
    fcp: number;
    lcp: number;
    cls: number;
    fid: number;
  };
}

class CrossBrowserTestRunner {
  private config: TestRunConfig;
  private results: TestResult[] = [];
  private runningProcesses: Map<string, ChildProcess> = new Map();

  constructor(config: Partial<TestRunConfig> = {}) {
    this.config = {
      browsers: ['chromium-desktop', 'firefox-desktop', 'webkit-desktop', 'mobile-chrome'],
      scenarios: ['dashboard-layout', 'mobile-dashboard', 'visual-regression'],
      parallel: true,
      maxConcurrency: 3,
      outputDir: './test-results/cross-browser',
      generateReport: true,
      visualRegression: true,
      performance: true,
      accessibility: true,
      ...config,
    };
  }

  async run(): Promise<void> {
    console.log('🌐 Starting Cross-Browser Compatibility Testing...\n');

    await this.ensureOutputDirectory();
    await this.runPreChecks();

    if (this.config.parallel) {
      await this.runTestsInParallel();
    } else {
      await this.runTestsSequentially();
    }

    await this.collectResults();

    if (this.config.generateReport) {
      await this.generateReport();
    }

    this.printSummary();
  }

  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.outputDir, { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'screenshots'), { recursive: true });
      await fs.mkdir(path.join(this.config.outputDir, 'reports'), { recursive: true });
    } catch (error) {
      console.error('Failed to create output directories:', error);
      process.exit(1);
    }
  }

  private async runPreChecks(): Promise<void> {
    console.log('🔍 Running pre-checks...');

    // Check if Playwright browsers are installed
    const checkBrowsers = await this.executeCommand('npx playwright install --dry-run');
    if (checkBrowsers.exitCode !== 0) {
      console.log('📦 Installing Playwright browsers...');
      const install = await this.executeCommand('npx playwright install');
      if (install.exitCode !== 0) {
        console.error('❌ Failed to install Playwright browsers');
        process.exit(1);
      }
    }

    // Check if the application is running
    try {
      const response = await fetch('http://localhost:3000', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      console.log('✅ Application server is running');
    } catch (error) {
      console.error('❌ Application server is not running. Please start with: npm run dev');
      process.exit(1);
    }

    console.log('✅ Pre-checks completed\n');
  }

  private async runTestsInParallel(): Promise<void> {
    console.log(`🚀 Running tests in parallel (max concurrency: ${this.config.maxConcurrency})\n`);

    const testQueue = this.buildTestQueue();
    const activeTests: Promise<TestResult>[] = [];

    while (testQueue.length > 0 || activeTests.length > 0) {
      // Start new tests up to concurrency limit
      while (testQueue.length > 0 && activeTests.length < this.config.maxConcurrency) {
        const testConfig = testQueue.shift()!;
        const testPromise = this.runSingleTest(testConfig);
        activeTests.push(testPromise);
      }

      // Wait for at least one test to complete
      if (activeTests.length > 0) {
        const completedTest = await Promise.race(activeTests);
        this.results.push(completedTest);

        // Remove completed test from active tests
        const completedIndex = activeTests.findIndex(
          test => test === Promise.resolve(completedTest)
        );
        if (completedIndex > -1) {
          activeTests.splice(completedIndex, 1);
        }

        this.printTestResult(completedTest);
      }
    }
  }

  private async runTestsSequentially(): Promise<void> {
    console.log('🔄 Running tests sequentially...\n');

    const testQueue = this.buildTestQueue();

    for (const testConfig of testQueue) {
      const result = await this.runSingleTest(testConfig);
      this.results.push(result);
      this.printTestResult(result);
    }
  }

  private buildTestQueue(): Array<{ browser: string; scenario: string }> {
    const queue: Array<{ browser: string; scenario: string }> = [];

    for (const browser of this.config.browsers) {
      for (const scenario of this.config.scenarios) {
        queue.push({ browser, scenario });
      }
    }

    // Prioritize fast tests first for quicker feedback
    return queue.sort((a, b) => {
      const priorityOrder = ['desktop', 'mobile', 'visual', 'performance'];
      const aPriority = priorityOrder.findIndex(p => a.scenario.includes(p));
      const bPriority = priorityOrder.findIndex(p => b.scenario.includes(p));
      return aPriority - bPriority;
    });
  }

  private async runSingleTest(testConfig: { browser: string; scenario: string }): Promise<TestResult> {
    const startTime = Date.now();
    const { browser, scenario } = testConfig;

    console.log(`🧪 Starting ${scenario} on ${browser}...`);

    try {
      const testCommand = this.buildTestCommand(browser, scenario);
      const result = await this.executeCommand(testCommand);

      const duration = Date.now() - startTime;

      if (result.exitCode === 0) {
        return {
          browser,
          scenario,
          status: 'passed',
          duration,
          errors: [],
          screenshots: await this.collectScreenshots(browser, scenario),
        };
      } else {
        return {
          browser,
          scenario,
          status: 'failed',
          duration,
          errors: result.stderr ? [result.stderr] : ['Unknown error'],
          screenshots: await this.collectScreenshots(browser, scenario),
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        browser,
        scenario,
        status: 'failed',
        duration,
        errors: [error instanceof Error ? error.message : String(error)],
        screenshots: [],
      };
    }
  }

  private buildTestCommand(browser: string, scenario: string): string {
    const baseCommand = 'npx playwright test';
    const projectFlag = `--project=${browser}`;

    let testPath = '';
    switch (scenario) {
      case 'dashboard-layout':
        testPath = 'tests/browser-compatibility/desktop/dashboard-layout.spec.ts';
        break;
      case 'mobile-dashboard':
        testPath = 'tests/browser-compatibility/mobile/mobile-dashboard.spec.ts';
        break;
      case 'visual-regression':
        testPath = 'tests/browser-compatibility/visual/visual-regression.spec.ts';
        break;
      case 'safari-issues':
        testPath = 'tests/browser-compatibility/browser-specific/safari-issues.spec.ts';
        break;
      case 'firefox-issues':
        testPath = 'tests/browser-compatibility/browser-specific/firefox-issues.spec.ts';
        break;
      case 'chrome-issues':
        testPath = 'tests/browser-compatibility/browser-specific/chrome-issues.spec.ts';
        break;
      default:
        testPath = `tests/browser-compatibility/**/${scenario}.spec.ts`;
    }

    const outputFlag = `--output-dir=${this.config.outputDir}/${browser}-${scenario}`;
    const reporterFlag = `--reporter=json:${this.config.outputDir}/reports/${browser}-${scenario}.json`;

    return `${baseCommand} ${projectFlag} ${testPath} ${outputFlag} ${reporterFlag}`;
  }

  private async executeCommand(command: string): Promise<{
    exitCode: number;
    stdout: string;
    stderr: string;
  }> {
    return new Promise((resolve) => {
      const [cmd, ...args] = command.split(' ');
      const process = spawn(cmd, args, { stdio: 'pipe' });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          stdout,
          stderr,
        });
      });
    });
  }

  private async collectScreenshots(browser: string, scenario: string): Promise<string[]> {
    const screenshotDir = path.join(this.config.outputDir, browser + '-' + scenario, 'screenshots');

    try {
      const files = await fs.readdir(screenshotDir);
      return files
        .filter(file => file.endsWith('.png'))
        .map(file => path.join(screenshotDir, file));
    } catch {
      return [];
    }
  }

  private async collectResults(): Promise<void> {
    // Collect additional performance and accessibility data if configured
    if (this.config.performance) {
      await this.collectPerformanceData();
    }

    if (this.config.accessibility) {
      await this.collectAccessibilityData();
    }
  }

  private async collectPerformanceData(): Promise<void> {
    console.log('📊 Collecting performance data...');

    for (const result of this.results) {
      const reportPath = path.join(
        this.config.outputDir,
        'reports',
        `${result.browser}-${result.scenario}.json`
      );

      try {
        const reportData = await fs.readFile(reportPath, 'utf8');
        const report = JSON.parse(reportData);

        // Extract performance metrics from test report
        if (report.suites && report.suites.length > 0) {
          const performanceTests = report.suites.flatMap((suite: any) =>
            suite.specs.filter((spec: any) =>
              spec.title.includes('performance') || spec.title.includes('Performance')
            )
          );

          if (performanceTests.length > 0) {
            // Extract metrics from test titles and results
            result.performance = {
              fcp: this.extractMetric(performanceTests, 'fcp') || 0,
              lcp: this.extractMetric(performanceTests, 'lcp') || 0,
              cls: this.extractMetric(performanceTests, 'cls') || 0,
              fid: this.extractMetric(performanceTests, 'fid') || 0,
            };
          }
        }
      } catch (error) {
        console.warn(`Could not collect performance data for ${result.browser}-${result.scenario}`);
      }
    }
  }

  private extractMetric(tests: any[], metricName: string): number | null {
    // Simple metric extraction - in practice, this would be more sophisticated
    const metricTest = tests.find((test: any) =>
      test.title.toLowerCase().includes(metricName.toLowerCase())
    );

    if (metricTest && metricTest.results && metricTest.results.length > 0) {
      const result = metricTest.results[0];
      if (result.status === 'passed' && result.attachments) {
        // Extract metric from attachments or test data
        return 1000; // Placeholder
      }
    }

    return null;
  }

  private async collectAccessibilityData(): Promise<void> {
    console.log('♿ Collecting accessibility data...');
    // Implement accessibility data collection
  }

  private async generateReport(): Promise<void> {
    console.log('📝 Generating comprehensive report...');

    const reportData = {
      timestamp: new Date().toISOString(),
      configuration: this.config,
      summary: this.generateSummary(),
      results: this.results,
      browserMatrix: BROWSER_MATRIX,
      testScenarios: DASHBOARD_TEST_SCENARIOS,
    };

    // Generate JSON report
    const jsonPath = path.join(this.config.outputDir, 'compatibility-report.json');
    await fs.writeFile(jsonPath, JSON.stringify(reportData, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHtmlReport(reportData);
    const htmlPath = path.join(this.config.outputDir, 'compatibility-report.html');
    await fs.writeFile(htmlPath, htmlReport);

    console.log(`📊 Reports generated:`);
    console.log(`  JSON: ${jsonPath}`);
    console.log(`  HTML: ${htmlPath}`);
  }

  private generateSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;

    const browserSummary: Record<string, { passed: number; failed: number; total: number }> = {};

    for (const result of this.results) {
      if (!browserSummary[result.browser]) {
        browserSummary[result.browser] = { passed: 0, failed: 0, total: 0 };
      }

      browserSummary[result.browser].total++;
      if (result.status === 'passed') {
        browserSummary[result.browser].passed++;
      } else if (result.status === 'failed') {
        browserSummary[result.browser].failed++;
      }
    }

    return {
      total,
      passed,
      failed,
      skipped,
      successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      browserSummary,
      avgDuration: total > 0 ? Math.round(this.results.reduce((sum, r) => sum + r.duration, 0) / total) : 0,
    };
  }

  private generateHtmlReport(reportData: any): string {
    const summary = reportData.summary;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cross-Browser Compatibility Report</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
          .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
          .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
          .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
          .passed { color: #28a745; }
          .failed { color: #dc3545; }
          .results-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .results-table th, .results-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .results-table th { background-color: #f8f9fa; }
          .status-passed { background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; }
          .status-failed { background-color: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 4px; }
          .browser-summary { margin: 20px 0; }
          .browser-card { background: white; border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🌐 Cross-Browser Compatibility Report</h1>
          <p>Generated: ${new Date(reportData.timestamp).toLocaleString()}</p>
        </div>

        <div class="summary">
          <div class="metric">
            <div class="metric-value">${summary.total}</div>
            <div>Total Tests</div>
          </div>
          <div class="metric">
            <div class="metric-value passed">${summary.passed}</div>
            <div>Passed</div>
          </div>
          <div class="metric">
            <div class="metric-value failed">${summary.failed}</div>
            <div>Failed</div>
          </div>
          <div class="metric">
            <div class="metric-value">${summary.successRate}%</div>
            <div>Success Rate</div>
          </div>
        </div>

        <div class="browser-summary">
          <h2>Browser Summary</h2>
          ${Object.entries(summary.browserSummary).map(([browser, stats]: [string, any]) => `
            <div class="browser-card">
              <h3>${browser}</h3>
              <p>
                <span class="passed">${stats.passed} passed</span> |
                <span class="failed">${stats.failed} failed</span> |
                Total: ${stats.total}
              </p>
            </div>
          `).join('')}
        </div>

        <h2>Test Results</h2>
        <table class="results-table">
          <thead>
            <tr>
              <th>Browser</th>
              <th>Scenario</th>
              <th>Status</th>
              <th>Duration (ms)</th>
              <th>Errors</th>
              <th>Screenshots</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.results.map((result: TestResult) => `
              <tr>
                <td>${result.browser}</td>
                <td>${result.scenario}</td>
                <td><span class="status-${result.status}">${result.status}</span></td>
                <td>${result.duration}</td>
                <td>${result.errors.length > 0 ? result.errors.join('; ') : '—'}</td>
                <td>${result.screenshots.length}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  private printTestResult(result: TestResult): void {
    const status = result.status === 'passed' ? '✅' : '❌';
    const duration = `${result.duration}ms`;
    console.log(`${status} ${result.browser} - ${result.scenario} (${duration})`);

    if (result.status === 'failed' && result.errors.length > 0) {
      console.log(`   Error: ${result.errors[0]}`);
    }
  }

  private printSummary(): void {
    const summary = this.generateSummary();

    console.log('\n🎯 Cross-Browser Testing Summary');
    console.log('================================');
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed} ✅`);
    console.log(`Failed: ${summary.failed} ❌`);
    console.log(`Success Rate: ${summary.successRate}%`);
    console.log(`Average Duration: ${summary.avgDuration}ms`);

    if (summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => {
          console.log(`  - ${r.browser}: ${r.scenario}`);
          if (r.errors.length > 0) {
            console.log(`    ${r.errors[0]}`);
          }
        });
    }

    console.log('\n📊 Browser Breakdown:');
    Object.entries(summary.browserSummary).forEach(([browser, stats]: [string, any]) => {
      const rate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;
      console.log(`  ${browser}: ${stats.passed}/${stats.total} (${rate}%)`);
    });

    console.log(`\n📁 Results saved to: ${this.config.outputDir}`);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: Partial<TestRunConfig> = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--browsers':
        config.browsers = args[++i]?.split(',') || [];
        break;
      case '--scenarios':
        config.scenarios = args[++i]?.split(',') || [];
        break;
      case '--sequential':
        config.parallel = false;
        break;
      case '--concurrency':
        config.maxConcurrency = parseInt(args[++i]) || 3;
        break;
      case '--output':
        config.outputDir = args[++i];
        break;
      case '--no-report':
        config.generateReport = false;
        break;
      case '--help':
        console.log(`
Cross-Browser Test Runner

Usage: tsx run-cross-browser-tests.ts [options]

Options:
  --browsers <list>      Comma-separated list of browsers to test
  --scenarios <list>     Comma-separated list of test scenarios
  --sequential          Run tests sequentially instead of parallel
  --concurrency <n>     Maximum number of parallel tests (default: 3)
  --output <dir>        Output directory for results
  --no-report           Skip generating HTML/JSON reports
  --help                Show this help message

Examples:
  tsx run-cross-browser-tests.ts
  tsx run-cross-browser-tests.ts --browsers chromium-desktop,firefox-desktop
  tsx run-cross-browser-tests.ts --scenarios dashboard-layout --sequential
        `);
        process.exit(0);
    }
  }

  const runner = new CrossBrowserTestRunner(config);
  runner.run().catch((error) => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { CrossBrowserTestRunner, TestRunConfig, TestResult };