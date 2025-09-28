/**
 * CI/CD Accessibility Configuration for Dashboard Components
 *
 * This configuration sets up automated accessibility testing as part of the
 * continuous integration pipeline to ensure WCAG 2.1 AA compliance.
 */

const path = require('path');
const fs = require('fs');

/**
 * Accessibility testing configuration for Jest
 */
const accessibilityJestConfig = {
  displayName: 'Accessibility Tests',
  testMatch: [
    '<rootDir>/tests/accessibility/**/*.test.{js,ts,tsx}',
    '<rootDir>/tests/**/*accessibility*.test.{js,ts,tsx}'
  ],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/tests/accessibility/setup.ts',
    '<rootDir>/tests/accessibility/jest-axe-setup.ts'
  ],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/*.stories.{ts,tsx}',
    '!**/*.test.{ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  testTimeout: 10000, // Longer timeout for accessibility tests
  verbose: true
};

/**
 * Axe-core configuration for automated testing
 */
const axeConfig = {
  // Core WCAG 2.1 AA rules
  rules: {
    // Perceivable
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: false }, // AAA level
    'image-alt': { enabled: true },
    'input-image-alt': { enabled: true },
    'audio-caption': { enabled: true },
    'video-caption': { enabled: true },
    'video-description': { enabled: false }, // AAA level
    'meta-refresh': { enabled: true },
    'meta-viewport': { enabled: true },
    'focus-order-semantics': { enabled: true },

    // Operable
    'bypass': { enabled: true },
    'focus-order-semantics': { enabled: true },
    'link-in-text-block': { enabled: true },
    'target-size': { enabled: true },
    'keyboard': { enabled: true },
    'no-keyboard-trap': { enabled: true },

    // Understandable
    'lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    'valid-lang': { enabled: true },
    'autocomplete-valid': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'identical-links-same-purpose': { enabled: true },

    // Robust
    'valid-lang': { enabled: true },
    'duplicate-id': { enabled: true },
    'duplicate-id-active': { enabled: true },
    'duplicate-id-aria': { enabled: true }
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
  resultTypes: ['violations', 'incomplete', 'inapplicable', 'passes'],
  reporter: 'v2'
};

/**
 * CI Pipeline configuration
 */
const ciConfig = {
  // Fail build on accessibility violations
  failOnViolations: true,

  // Severity levels that should fail the build
  failOnSeverities: ['critical', 'serious'],

  // Maximum number of violations allowed (emergency override)
  maxViolations: 0,

  // Timeout for accessibility tests in CI
  timeout: 30000,

  // Retry configuration for flaky tests
  retries: 2,

  // Parallel execution in CI
  maxWorkers: 4,

  // Report generation
  generateReports: true,
  reportFormats: ['html', 'json', 'junit'],
  reportOutputDir: 'accessibility-reports',

  // Integration with external tools
  uploadToS3: process.env.NODE_ENV === 'production',
  notifySlack: process.env.NODE_ENV === 'production',

  // Performance monitoring
  trackPerformance: true,
  maxTestDuration: 5000 // 5 seconds per test
};

/**
 * Accessibility test categories for CI execution
 */
const testCategories = {
  // Critical path tests - always run
  critical: [
    'dashboard-accessibility.test.tsx',
    'wcag-compliance-tests.test.tsx'
  ],

  // Component-specific tests
  components: [
    'component-specific-tests.test.tsx'
  ],

  // Integration tests - run on feature branches
  integration: [
    'integration-accessibility.test.tsx'
  ],

  // Performance impact tests
  performance: [
    'accessibility-performance.test.tsx'
  ]
};

/**
 * Environment-specific configurations
 */
const environments = {
  development: {
    runAllTests: true,
    generateReports: true,
    failOnViolations: false, // Warning only in dev
    verbose: true
  },

  testing: {
    runAllTests: true,
    generateReports: true,
    failOnViolations: true,
    uploadReports: false
  },

  staging: {
    runAllTests: true,
    generateReports: true,
    failOnViolations: true,
    uploadReports: true,
    notifyTeam: true
  },

  production: {
    runAllTests: true,
    generateReports: true,
    failOnViolations: true,
    uploadReports: true,
    notifyTeam: true,
    archiveReports: true
  }
};

/**
 * GitHub Actions workflow configuration
 */
const githubActionsConfig = {
  name: 'Accessibility Testing',
  on: {
    push: {
      branches: ['main', 'develop']
    },
    pull_request: {
      branches: ['main', 'develop']
    }
  },
  jobs: {
    accessibility: {
      'runs-on': 'ubuntu-latest',
      strategy: {
        matrix: {
          node: ['18', '20']
        }
      },
      steps: [
        {
          name: 'Checkout code',
          uses: 'actions/checkout@v3'
        },
        {
          name: 'Setup Node.js',
          uses: 'actions/setup-node@v3',
          with: {
            'node-version': '${{ matrix.node }}',
            cache: 'npm'
          }
        },
        {
          name: 'Install dependencies',
          run: 'npm ci'
        },
        {
          name: 'Run accessibility tests',
          run: 'npm run test:accessibility',
          env: {
            CI: 'true',
            NODE_ENV: 'testing'
          }
        },
        {
          name: 'Upload accessibility reports',
          uses: 'actions/upload-artifact@v3',
          if: 'always()',
          with: {
            name: 'accessibility-reports',
            path: 'accessibility-reports/',
            'retention-days': 30
          }
        },
        {
          name: 'Comment PR with results',
          uses: 'actions/github-script@v6',
          if: 'github.event_name == \'pull_request\'',
          with: {
            script: `
              const fs = require('fs');
              const path = require('path');

              try {
                const reportPath = path.join(process.cwd(), 'accessibility-reports', 'summary.json');
                if (fs.existsSync(reportPath)) {
                  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

                  const comment = \`## 🔍 Accessibility Test Results

              **Status:** \${report.passed ? '✅ PASSED' : '❌ FAILED'}
              **Tests Run:** \${report.totalTests}
              **Violations:** \${report.violations}
              **Warnings:** \${report.warnings}

              \${report.passed ?
                '🎉 All accessibility tests passed! Components meet WCAG 2.1 AA standards.' :
                '⚠️ Accessibility violations found. Please review the detailed report.'}

              [View detailed report](https://github.com/\${context.repo.owner}/\${context.repo.repo}/actions/runs/\${context.runId})
              \`;

                  github.rest.issues.createComment({
                    issue_number: context.issue.number,
                    owner: context.repo.owner,
                    repo: context.repo.repo,
                    body: comment
                  });
                }
              } catch (error) {
                console.log('Could not post accessibility results:', error.message);
              }
            `
          }
        }
      ]
    }
  }
};

/**
 * Package.json scripts for accessibility testing
 */
const packageScripts = {
  'test:accessibility': 'jest --config=tests/accessibility/ci-accessibility-config.js',
  'test:accessibility:watch': 'jest --config=tests/accessibility/ci-accessibility-config.js --watch',
  'test:accessibility:coverage': 'jest --config=tests/accessibility/ci-accessibility-config.js --coverage',
  'test:accessibility:ci': 'jest --config=tests/accessibility/ci-accessibility-config.js --ci --watchAll=false --coverage --reporters=default --reporters=jest-junit',
  'accessibility:report': 'node tests/accessibility/generate-report.js',
  'accessibility:audit': 'node tests/accessibility/audit-dashboard.js'
};

/**
 * Webpack configuration for accessibility testing
 */
const webpackConfig = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../..')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  }
};

/**
 * Performance thresholds for accessibility tests
 */
const performanceThresholds = {
  // Maximum time for individual test
  maxTestDuration: 5000, // 5 seconds

  // Maximum total suite duration
  maxSuiteDuration: 60000, // 1 minute

  // Memory usage limits
  maxMemoryUsage: 512 * 1024 * 1024, // 512MB

  // CPU usage limits
  maxCpuUsage: 80, // 80%

  // Accessibility scan performance
  maxAxeScanTime: 2000, // 2 seconds

  // Component render time with accessibility
  maxRenderTimeWithA11y: 200 // 200ms
};

/**
 * Report generation configuration
 */
const reportConfig = {
  formats: {
    html: {
      enabled: true,
      template: 'accessibility-report-template.html',
      outputFile: 'accessibility-report.html'
    },
    json: {
      enabled: true,
      outputFile: 'accessibility-results.json',
      includeRawResults: true
    },
    junit: {
      enabled: true,
      outputFile: 'accessibility-junit.xml',
      suiteName: 'Accessibility Tests'
    },
    markdown: {
      enabled: true,
      outputFile: 'ACCESSIBILITY-REPORT.md',
      includeRemediation: true
    }
  },

  summary: {
    includePassing: true,
    includeSkipped: false,
    groupByComponent: true,
    sortBySeverity: true
  },

  details: {
    includeStackTraces: false,
    includeScreenshots: true,
    includeRemediation: true,
    includeWcagReferences: true
  }
};

/**
 * Notification configuration
 */
const notificationConfig = {
  slack: {
    enabled: process.env.SLACK_WEBHOOK_URL !== undefined,
    webhook: process.env.SLACK_WEBHOOK_URL,
    channel: '#accessibility-alerts',
    onFailure: true,
    onSuccess: false,
    includeSummary: true
  },

  email: {
    enabled: process.env.SMTP_CONFIG !== undefined,
    recipients: ['accessibility-team@company.com'],
    onFailure: true,
    onSuccess: false,
    includeReports: true
  },

  github: {
    enabled: true,
    createIssue: false, // Don't auto-create issues
    addLabels: ['accessibility', 'needs-review'],
    assignTeam: 'accessibility-team'
  }
};

module.exports = {
  accessibilityJestConfig,
  axeConfig,
  ciConfig,
  testCategories,
  environments,
  githubActionsConfig,
  packageScripts,
  webpackConfig,
  performanceThresholds,
  reportConfig,
  notificationConfig
};