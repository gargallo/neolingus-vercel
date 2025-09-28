/**
 * E2E Test Runner
 * Comprehensive test execution script for plan management system
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  description: string;
  files: string[];
  required: boolean;
  timeout?: number;
}

interface TestResult {
  suite: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  output?: string;
  error?: string;
}

class E2ETestRunner {
  private testSuites: TestSuite[] = [
    {
      name: 'authentication',
      description: 'Authentication and user management tests',
      files: ['auth.setup.ts'],
      required: true,
      timeout: 30000
    },
    {
      name: 'admin-plan-management',
      description: 'Admin plan creation, editing, and management',
      files: ['plan-management-playwright.spec.ts'],
      required: true,
      timeout: 60000
    },
    {
      name: 'public-plan-selection',
      description: 'Public plan viewing and selection workflows',
      files: ['plan-management-playwright.spec.ts'],
      required: true,
      timeout: 45000
    },
    {
      name: 'user-plan-management',
      description: 'User plan management and settings',
      files: ['plan-management-playwright.spec.ts'],
      required: true,
      timeout: 45000
    },
    {
      name: 'trial-management',
      description: 'Trial activation, management, and expiration',
      files: ['plan-management-playwright.spec.ts'],
      required: true,
      timeout: 60000
    },
    {
      name: 'error-handling',
      description: 'Error handling and edge cases',
      files: ['plan-management-playwright.spec.ts'],
      required: false,
      timeout: 30000
    },
    {
      name: 'performance-accessibility',
      description: 'Performance and accessibility validation',
      files: ['plan-management-playwright.spec.ts'],
      required: false,
      timeout: 45000
    },
    {
      name: 'cleanup',
      description: 'Test environment cleanup',
      files: ['cleanup.cleanup.ts'],
      required: true,
      timeout: 30000
    }
  ];

  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor(private options: {
    browsers?: string[];
    headless?: boolean;
    workers?: number;
    retries?: number;
    timeout?: number;
    generateReport?: boolean;
  } = {}) {
    this.options = {
      browsers: ['chromium'],
      headless: true,
      workers: 1,
      retries: 2,
      timeout: 30000,
      generateReport: true,
      ...options
    };
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting E2E Test Suite Execution');
    console.log('=====================================');
    
    this.startTime = Date.now();
    
    try {
      await this.checkPrerequisites();
      await this.setupEnvironment();
      
      for (const suite of this.testSuites) {
        await this.runTestSuite(suite);
      }
      
      await this.generateReport();
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  async runSpecificSuite(suiteName: string): Promise<void> {
    const suite = this.testSuites.find(s => s.name === suiteName);
    if (!suite) {
      throw new Error(`Test suite "${suiteName}" not found`);
    }

    console.log(`🎯 Running specific test suite: ${suite.name}`);
    
    this.startTime = Date.now();
    await this.checkPrerequisites();
    await this.setupEnvironment();
    await this.runTestSuite(suite);
    await this.generateReport();
    this.displaySummary();
  }

  private async checkPrerequisites(): Promise<void> {
    console.log('🔍 Checking prerequisites...');
    
    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Playwright not found. Please run: npm install @playwright/test');
    }
    
    // Check if browsers are installed
    try {
      execSync('npx playwright install --dry-run', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Installing Playwright browsers...');
      execSync('npx playwright install');
    }
    
    // Check if test environment is available
    try {
      const response = await fetch(process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000');
      if (!response.ok) {
        throw new Error('Test environment not accessible');
      }
    } catch (error) {
      console.log('⚠️ Warning: Test environment may not be running');
      console.log('Please ensure the application is running on the expected port');
    }
    
    console.log('✅ Prerequisites check complete');
  }

  private async setupEnvironment(): Promise<void> {
    console.log('🛠️ Setting up test environment...');
    
    // Create necessary directories
    const dirs = ['test-results', '.auth', '__tests__/e2e/snapshots'];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    // Set environment variables
    process.env.NODE_ENV = 'test';
    process.env.PLAYWRIGHT_TEST_BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
    
    console.log('✅ Environment setup complete');
  }

  private async runTestSuite(suite: TestSuite): Promise<void> {
    console.log(`\n📋 Running test suite: ${suite.name}`);
    console.log(`📝 Description: ${suite.description}`);
    
    const startTime = Date.now();
    
    try {
      // Build Playwright command
      const command = this.buildPlaywrightCommand(suite);
      
      console.log(`🔄 Executing: ${command}`);
      
      // Execute tests
      const output = execSync(command, {
        encoding: 'utf8',
        timeout: suite.timeout || this.options.timeout,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: suite.name,
        status: 'passed',
        duration,
        output
      });
      
      console.log(`✅ ${suite.name} completed successfully (${duration}ms)`);
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: suite.name,
        status: suite.required ? 'failed' : 'skipped',
        duration,
        error: error.message
      });
      
      if (suite.required) {
        console.log(`❌ ${suite.name} failed (${duration}ms)`);
        console.log(`Error: ${error.message}`);
        
        // If it's a required suite and fails, stop execution
        throw error;
      } else {
        console.log(`⚠️ ${suite.name} skipped due to error (${duration}ms)`);
      }
    }
  }

  private buildPlaywrightCommand(suite: TestSuite): string {
    const baseCommand = 'npx playwright test';
    const options = [];
    
    // Add specific test files
    if (suite.files.length > 0) {
      options.push(suite.files.map(f => `__tests__/e2e/${f}`).join(' '));
    }
    
    // Add browser selection
    if (this.options.browsers && this.options.browsers.length > 0) {
      options.push(`--project=${this.options.browsers.join(',')}`);
    }
    
    // Add worker configuration
    if (this.options.workers) {
      options.push(`--workers=${this.options.workers}`);
    }
    
    // Add retry configuration
    if (this.options.retries) {
      options.push(`--retries=${this.options.retries}`);
    }
    
    // Add headless configuration
    if (this.options.headless) {
      options.push('--headed=false');
    }
    
    // Add timeout
    if (suite.timeout || this.options.timeout) {
      options.push(`--timeout=${suite.timeout || this.options.timeout}`);
    }
    
    // Add reporter
    options.push('--reporter=line,json');
    
    return `${baseCommand} ${options.join(' ')}`;
  }

  private async generateReport(): Promise<void> {
    if (!this.options.generateReport) return;
    
    console.log('\n📊 Generating test report...');
    
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalDuration,
      summary: {
        total: this.results.length,
        passed,
        failed,
        skipped,
        success_rate: ((passed / this.results.length) * 100).toFixed(2)
      },
      environment: {
        base_url: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
        browsers: this.options.browsers,
        workers: this.options.workers,
        retries: this.options.retries
      },
      test_suites: this.results.map(result => ({
        name: result.suite,
        status: result.status,
        duration: result.duration,
        error: result.error || null
      }))
    };
    
    // Save report
    const reportPath = 'test-results/e2e-execution-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    await this.generateHtmlReport(report);
    
    console.log(`✅ Report generated: ${reportPath}`);
  }

  private async generateHtmlReport(report: any): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>E2E Test Report - Plan Management System</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .passed { border-left: 4px solid #28a745; }
        .failed { border-left: 4px solid #dc3545; }
        .skipped { border-left: 4px solid #ffc107; }
        .suite { margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .suite h3 { margin-top: 0; }
        .error { background: #f8d7da; padding: 10px; border-radius: 4px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="header">
        <h1>E2E Test Report - Plan Management System</h1>
        <p><strong>Execution Date:</strong> ${report.timestamp}</p>
        <p><strong>Total Duration:</strong> ${(report.duration / 1000).toFixed(2)}s</p>
        <p><strong>Environment:</strong> ${report.environment.base_url}</p>
    </div>
    
    <div class="summary">
        <div class="stat passed">
            <h3>Passed</h3>
            <p>${report.summary.passed}</p>
        </div>
        <div class="stat failed">
            <h3>Failed</h3>
            <p>${report.summary.failed}</p>
        </div>
        <div class="stat skipped">
            <h3>Skipped</h3>
            <p>${report.summary.skipped}</p>
        </div>
        <div class="stat">
            <h3>Success Rate</h3>
            <p>${report.summary.success_rate}%</p>
        </div>
    </div>
    
    <h2>Test Suite Results</h2>
    ${report.test_suites.map((suite: any) => `
        <div class="suite ${suite.status}">
            <h3>${suite.name}</h3>
            <p><strong>Status:</strong> ${suite.status.toUpperCase()}</p>
            <p><strong>Duration:</strong> ${(suite.duration / 1000).toFixed(2)}s</p>
            ${suite.error ? `<div class="error">Error: ${suite.error}</div>` : ''}
        </div>
    `).join('')}
</body>
</html>`;
    
    fs.writeFileSync('test-results/e2e-report.html', htmlContent);
  }

  private displaySummary(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const skipped = this.results.filter(r => r.status === 'skipped').length;
    
    console.log('\n📊 Test Execution Summary');
    console.log('========================');
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Success Rate: ${((passed / this.results.length) * 100).toFixed(2)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Test Suites:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(result => {
          console.log(`  - ${result.suite}: ${result.error}`);
        });
    }
    
    console.log('\n🎉 E2E Test Execution Complete!');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new E2ETestRunner({
    browsers: args.includes('--all-browsers') 
      ? ['chromium', 'firefox', 'webkit'] 
      : ['chromium'],
    headless: !args.includes('--headed'),
    workers: parseInt(args.find(arg => arg.startsWith('--workers='))?.split('=')[1] || '1'),
    retries: parseInt(args.find(arg => arg.startsWith('--retries='))?.split('=')[1] || '2'),
    generateReport: !args.includes('--no-report')
  });
  
  const suiteArg = args.find(arg => arg.startsWith('--suite='));
  
  if (suiteArg) {
    const suiteName = suiteArg.split('=')[1];
    runner.runSpecificSuite(suiteName);
  } else {
    runner.runAllTests();
  }
}

export { E2ETestRunner };