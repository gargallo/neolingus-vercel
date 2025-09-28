#!/usr/bin/env node

/**
 * Accessibility Report Generator
 *
 * Generates comprehensive accessibility reports from test results
 * for CI/CD pipelines and documentation.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  outputDir: path.join(process.cwd(), 'accessibility-reports'),
  testResultsPath: path.join(process.cwd(), 'accessibility-test-results.json'),
  templateDir: path.join(__dirname, 'templates'),
  assetsDir: path.join(__dirname, 'assets')
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

/**
 * Run accessibility tests and collect results
 */
function runAccessibilityTests() {
  console.log('🔍 Running accessibility tests...');

  try {
    // Run Jest with accessibility configuration
    const testCommand = `npx jest --config=tests/accessibility/ci-accessibility-config.js --json --outputFile=${CONFIG.testResultsPath}`;
    execSync(testCommand, { stdio: 'inherit' });
    console.log('✅ Accessibility tests completed');
  } catch (error) {
    console.warn('⚠️ Some accessibility tests failed, but continuing with report generation');
  }
}

/**
 * Load test results from JSON file
 */
function loadTestResults() {
  if (!fs.existsSync(CONFIG.testResultsPath)) {
    console.error('❌ Test results file not found. Run tests first.');
    process.exit(1);
  }

  const rawResults = fs.readFileSync(CONFIG.testResultsPath, 'utf8');
  return JSON.parse(rawResults);
}

/**
 * Process test results into report format
 */
function processTestResults(testResults) {
  const { testResults: suites, numTotalTests, numPassedTests, numFailedTests, numPendingTests } = testResults;

  const processedResults = {
    summary: {
      total: numTotalTests,
      passed: numPassedTests,
      failed: numFailedTests,
      pending: numPendingTests,
      passRate: numTotalTests > 0 ? (numPassedTests / numTotalTests * 100).toFixed(1) : '0'
    },
    suites: suites.map(suite => ({
      name: suite.name,
      status: suite.status,
      duration: suite.perfStats?.end - suite.perfStats?.start || 0,
      tests: suite.assertionResults.map(test => ({
        title: test.title,
        status: test.status,
        duration: test.duration || 0,
        failureMessages: test.failureMessages || [],
        ancestorTitles: test.ancestorTitles || []
      }))
    })),
    violations: [],
    warnings: [],
    performance: {
      totalDuration: suites.reduce((sum, suite) => sum + (suite.perfStats?.end - suite.perfStats?.start || 0), 0),
      averageTestDuration: numTotalTests > 0 ? (suites.reduce((sum, suite) => sum + (suite.perfStats?.end - suite.perfStats?.start || 0), 0) / numTotalTests).toFixed(2) : '0'
    }
  };

  // Extract violations and warnings from failure messages
  suites.forEach(suite => {
    suite.assertionResults.forEach(test => {
      if (test.failureMessages) {
        test.failureMessages.forEach(message => {
          if (message.includes('Expected no accessibility violations')) {
            const violation = {
              test: test.title,
              suite: suite.name,
              message: message,
              severity: determineViolationSeverity(message)
            };
            processedResults.violations.push(violation);
          } else if (message.includes('warning') || message.includes('Warning')) {
            const warning = {
              test: test.title,
              suite: suite.name,
              message: message
            };
            processedResults.warnings.push(warning);
          }
        });
      }
    });
  });

  return processedResults;
}

/**
 * Determine violation severity from error message
 */
function determineViolationSeverity(message) {
  if (message.includes('critical') || message.includes('serious')) {
    return 'critical';
  } else if (message.includes('moderate')) {
    return 'moderate';
  } else if (message.includes('minor')) {
    return 'minor';
  }
  return 'unknown';
}

/**
 * Generate HTML report
 */
function generateHtmlReport(results) {
  console.log('📄 Generating HTML report...');

  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Accessibility Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            color: #334155;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        .header h1 {
            margin: 0 0 0.5rem 0;
            font-size: 2.5rem;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            opacity: 0.9;
            font-size: 1.1rem;
        }
        .content {
            padding: 2rem;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        .summary-card {
            background: #f1f5f9;
            padding: 1.5rem;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid;
        }
        .summary-card.passed { border-left-color: #10b981; }
        .summary-card.failed { border-left-color: #ef4444; }
        .summary-card.pending { border-left-color: #f59e0b; }
        .summary-card.total { border-left-color: #3b82f6; }
        .summary-card h3 {
            margin: 0 0 0.5rem 0;
            font-size: 2rem;
            font-weight: 700;
        }
        .summary-card p {
            margin: 0;
            color: #64748b;
        }
        .section {
            margin-bottom: 2rem;
        }
        .section h2 {
            margin: 0 0 1rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #e2e8f0;
            color: #1e293b;
        }
        .violations {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        .violations h3 {
            color: #dc2626;
            margin: 0 0 1rem 0;
        }
        .violation-item {
            background: white;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            border-left: 4px solid #dc2626;
        }
        .violation-item:last-child {
            margin-bottom: 0;
        }
        .violation-severity {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }
        .severity-critical {
            background: #fca5a5;
            color: #7f1d1d;
        }
        .severity-moderate {
            background: #fde68a;
            color: #78350f;
        }
        .severity-minor {
            background: #bfdbfe;
            color: #1e3a8a;
        }
        .test-suite {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 1rem;
            overflow: hidden;
        }
        .test-suite-header {
            background: #e2e8f0;
            padding: 1rem;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-suite-tests {
            padding: 1rem;
        }
        .test-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .test-item:last-child {
            border-bottom: none;
        }
        .test-status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .status-passed {
            background: #d1fae5;
            color: #065f46;
        }
        .status-failed {
            background: #fee2e2;
            color: #7f1d1d;
        }
        .status-pending {
            background: #fef3c7;
            color: #78350f;
        }
        .footer {
            background: #f1f5f9;
            padding: 1rem 2rem;
            text-align: center;
            color: #64748b;
            font-size: 0.875rem;
        }
        .wcag-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 1rem;
        }
        .performance-info {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        .performance-info h3 {
            color: #0369a1;
            margin: 0 0 1rem 0;
        }
        .performance-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }
        .performance-stat {
            text-align: center;
        }
        .performance-stat .value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #0369a1;
        }
        .performance-stat .label {
            font-size: 0.875rem;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Dashboard Accessibility Report</h1>
            <p>WCAG 2.1 AA Compliance Testing Results</p>
            <p>Generated on ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
        </div>

        <div class="content">
            <div class="summary">
                <div class="summary-card total">
                    <h3>${results.summary.total}</h3>
                    <p>Total Tests</p>
                </div>
                <div class="summary-card passed">
                    <h3>${results.summary.passed}</h3>
                    <p>Passed</p>
                </div>
                <div class="summary-card failed">
                    <h3>${results.summary.failed}</h3>
                    <p>Failed</p>
                </div>
                <div class="summary-card pending">
                    <h3>${results.summary.pending}</h3>
                    <p>Pending</p>
                </div>
            </div>

            ${results.summary.failed === 0 ?
              '<div class="wcag-badge">✅ WCAG 2.1 AA Compliant</div>' :
              '<div style="background: #dc2626;" class="wcag-badge">❌ WCAG 2.1 AA Violations Found</div>'
            }

            <div class="performance-info">
                <h3>📊 Performance Metrics</h3>
                <div class="performance-stats">
                    <div class="performance-stat">
                        <div class="value">${(results.performance.totalDuration / 1000).toFixed(2)}s</div>
                        <div class="label">Total Duration</div>
                    </div>
                    <div class="performance-stat">
                        <div class="value">${results.performance.averageTestDuration}ms</div>
                        <div class="label">Avg Test Duration</div>
                    </div>
                    <div class="performance-stat">
                        <div class="value">${results.summary.passRate}%</div>
                        <div class="label">Pass Rate</div>
                    </div>
                </div>
            </div>

            ${results.violations.length > 0 ? `
            <div class="section">
                <h2>❌ Accessibility Violations</h2>
                <div class="violations">
                    <h3>${results.violations.length} violation(s) found</h3>
                    ${results.violations.map(violation => `
                    <div class="violation-item">
                        <div class="violation-severity severity-${violation.severity}">${violation.severity}</div>
                        <h4>${violation.test}</h4>
                        <p><strong>Suite:</strong> ${violation.suite}</p>
                        <pre style="background: #f8fafc; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.875rem;">${violation.message}</pre>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${results.warnings.length > 0 ? `
            <div class="section">
                <h2>⚠️ Warnings</h2>
                ${results.warnings.map(warning => `
                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <h4>${warning.test}</h4>
                    <p><strong>Suite:</strong> ${warning.suite}</p>
                    <p>${warning.message}</p>
                </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="section">
                <h2>📋 Test Suites</h2>
                ${results.suites.map(suite => `
                <div class="test-suite">
                    <div class="test-suite-header">
                        <span>${suite.name}</span>
                        <span class="test-status status-${suite.status}">${suite.status}</span>
                    </div>
                    <div class="test-suite-tests">
                        ${suite.tests.map(test => `
                        <div class="test-item">
                            <span>${test.title}</span>
                            <span class="test-status status-${test.status}">${test.status}</span>
                        </div>
                        `).join('')}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            <p>This report was generated automatically as part of the CI/CD pipeline.</p>
            <p>For more information about WCAG 2.1 AA compliance, visit <a href="https://www.w3.org/WAI/WCAG21/quickref/">WCAG 2.1 Quick Reference</a></p>
        </div>
    </div>
</body>
</html>
  `;

  const htmlPath = path.join(CONFIG.outputDir, 'accessibility-report.html');
  fs.writeFileSync(htmlPath, htmlTemplate);
  console.log(`✅ HTML report generated: ${htmlPath}`);
}

/**
 * Generate JSON report
 */
function generateJsonReport(results) {
  console.log('📄 Generating JSON report...');

  const jsonReport = {
    metadata: {
      timestamp: new Date().toISOString(),
      generator: 'accessibility-report-generator',
      version: '1.0.0',
      wcagLevel: 'AA',
      wcagVersion: '2.1'
    },
    summary: results.summary,
    performance: results.performance,
    violations: results.violations,
    warnings: results.warnings,
    suites: results.suites,
    recommendations: generateRecommendations(results)
  };

  const jsonPath = path.join(CONFIG.outputDir, 'accessibility-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log(`✅ JSON report generated: ${jsonPath}`);
}

/**
 * Generate JUnit XML report for CI/CD integration
 */
function generateJunitReport(results) {
  console.log('📄 Generating JUnit XML report...');

  const totalTests = results.summary.total;
  const failures = results.summary.failed;
  const time = (results.performance.totalDuration / 1000).toFixed(3);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="Accessibility Tests" tests="${totalTests}" failures="${failures}" time="${time}">
`;

  results.suites.forEach(suite => {
    const suiteTests = suite.tests.length;
    const suiteFailures = suite.tests.filter(t => t.status === 'failed').length;
    const suiteTime = (suite.duration / 1000).toFixed(3);

    xml += `  <testsuite name="${suite.name}" tests="${suiteTests}" failures="${suiteFailures}" time="${suiteTime}">
`;

    suite.tests.forEach(test => {
      xml += `    <testcase name="${test.title}" time="${(test.duration / 1000).toFixed(3)}">
`;
      if (test.status === 'failed') {
        xml += `      <failure message="Accessibility test failed">
${test.failureMessages.map(msg => `        ${msg}`).join('\n')}
      </failure>
`;
      }
      xml += `    </testcase>
`;
    });

    xml += `  </testsuite>
`;
  });

  xml += `</testsuites>`;

  const junitPath = path.join(CONFIG.outputDir, 'accessibility-junit.xml');
  fs.writeFileSync(junitPath, xml);
  console.log(`✅ JUnit XML report generated: ${junitPath}`);
}

/**
 * Generate Markdown report
 */
function generateMarkdownReport(results) {
  console.log('📄 Generating Markdown report...');

  let markdown = `# 🔍 Dashboard Accessibility Test Report

**WCAG 2.1 AA Compliance Testing Results**

Generated on ${new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

## 📊 Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${results.summary.total} |
| Passed | ${results.summary.passed} |
| Failed | ${results.summary.failed} |
| Pending | ${results.summary.pending} |
| Pass Rate | ${results.summary.passRate}% |

${results.summary.failed === 0 ?
  '## ✅ WCAG 2.1 AA Compliant\n\nAll accessibility tests passed! The dashboard components meet WCAG 2.1 AA standards.\n' :
  '## ❌ WCAG 2.1 AA Violations Found\n\nAccessibility violations were detected. Please review and fix the issues below.\n'
}

## ⚡ Performance

- **Total Duration**: ${(results.performance.totalDuration / 1000).toFixed(2)}s
- **Average Test Duration**: ${results.performance.averageTestDuration}ms

`;

  if (results.violations.length > 0) {
    markdown += `## ❌ Accessibility Violations (${results.violations.length})

`;
    results.violations.forEach((violation, index) => {
      markdown += `### ${index + 1}. ${violation.test}

**Severity**: ${violation.severity.toUpperCase()}
**Suite**: ${violation.suite}

\`\`\`
${violation.message}
\`\`\`

`;
    });
  }

  if (results.warnings.length > 0) {
    markdown += `## ⚠️ Warnings (${results.warnings.length})

`;
    results.warnings.forEach((warning, index) => {
      markdown += `### ${index + 1}. ${warning.test}

**Suite**: ${warning.suite}

${warning.message}

`;
    });
  }

  markdown += `## 📋 Test Suites

`;
  results.suites.forEach(suite => {
    const passedTests = suite.tests.filter(t => t.status === 'passed').length;
    const failedTests = suite.tests.filter(t => t.status === 'failed').length;
    const status = suite.status === 'passed' ? '✅' : '❌';

    markdown += `### ${status} ${suite.name}

**Status**: ${suite.status}
**Tests**: ${suite.tests.length} (${passedTests} passed, ${failedTests} failed)
**Duration**: ${(suite.duration / 1000).toFixed(2)}s

`;

    suite.tests.forEach(test => {
      const testStatus = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏸️';
      markdown += `- ${testStatus} ${test.title}\n`;
    });

    markdown += '\n';
  });

  markdown += `---

*This report was generated automatically as part of the CI/CD pipeline.*

For more information about WCAG 2.1 AA compliance, visit the [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/).
`;

  const markdownPath = path.join(CONFIG.outputDir, 'ACCESSIBILITY-REPORT.md');
  fs.writeFileSync(markdownPath, markdown);
  console.log(`✅ Markdown report generated: ${markdownPath}`);
}

/**
 * Generate remediation recommendations
 */
function generateRecommendations(results) {
  const recommendations = [];

  if (results.violations.length > 0) {
    recommendations.push({
      type: 'critical',
      title: 'Fix Accessibility Violations',
      description: `${results.violations.length} WCAG 2.1 AA violations need immediate attention.`,
      actions: [
        'Review failed test cases for specific violation details',
        'Implement proper ARIA attributes where missing',
        'Ensure all interactive elements have accessible names',
        'Verify color contrast meets 4.5:1 ratio requirement',
        'Test with keyboard navigation and screen readers'
      ]
    });
  }

  if (results.performance.averageTestDuration > 1000) {
    recommendations.push({
      type: 'performance',
      title: 'Optimize Test Performance',
      description: 'Accessibility tests are running slower than optimal.',
      actions: [
        'Review test setup and teardown procedures',
        'Consider mocking heavy dependencies',
        'Optimize component rendering for tests',
        'Use focused test runs during development'
      ]
    });
  }

  if (results.summary.passRate < 100) {
    recommendations.push({
      type: 'quality',
      title: 'Improve Test Coverage',
      description: 'Some accessibility tests are failing or incomplete.',
      actions: [
        'Add missing accessibility attributes to components',
        'Implement proper focus management',
        'Ensure all user interactions are keyboard accessible',
        'Add comprehensive screen reader support'
      ]
    });
  }

  return recommendations;
}

/**
 * Generate summary file for CI/CD integration
 */
function generateSummary(results) {
  const summary = {
    passed: results.summary.failed === 0,
    totalTests: results.summary.total,
    violations: results.violations.length,
    warnings: results.warnings.length,
    passRate: parseFloat(results.summary.passRate),
    timestamp: new Date().toISOString()
  };

  const summaryPath = path.join(CONFIG.outputDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`✅ Summary generated: ${summaryPath}`);

  return summary;
}

/**
 * Main execution function
 */
function main() {
  console.log('🚀 Starting accessibility report generation...\n');

  // Run tests if results don't exist
  if (!fs.existsSync(CONFIG.testResultsPath)) {
    runAccessibilityTests();
  }

  // Load and process results
  const testResults = loadTestResults();
  const processedResults = processTestResults(testResults);

  // Generate all report formats
  generateHtmlReport(processedResults);
  generateJsonReport(processedResults);
  generateJunitReport(processedResults);
  generateMarkdownReport(processedResults);

  // Generate summary for CI/CD
  const summary = generateSummary(processedResults);

  console.log('\n📈 Report Generation Summary:');
  console.log(`- Total Tests: ${summary.totalTests}`);
  console.log(`- Pass Rate: ${summary.passRate}%`);
  console.log(`- Violations: ${summary.violations}`);
  console.log(`- Warnings: ${summary.warnings}`);
  console.log(`- Status: ${summary.passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`\n📁 Reports generated in: ${CONFIG.outputDir}`);

  // Exit with appropriate code for CI/CD
  process.exit(summary.passed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runAccessibilityTests,
  loadTestResults,
  processTestResults,
  generateHtmlReport,
  generateJsonReport,
  generateJunitReport,
  generateMarkdownReport,
  generateSummary
};