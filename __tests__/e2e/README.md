# Plan Management E2E Testing Suite

This comprehensive end-to-end (E2E) testing suite validates the complete plan management system functionality using Playwright. The suite covers real user journeys from authentication through plan management workflows.

## 🎯 Test Coverage

### Core Test Scenarios
- **Admin Plan Management**: Plan creation, editing, deletion, and analytics
- **Public Plan Selection**: Plan viewing, comparison, and selection workflows  
- **User Plan Management**: Current plan viewing, settings, and billing management
- **Trial Management**: Trial activation, countdown, expiration, and upgrade flows
- **Error Handling**: Network failures, validation errors, and edge cases
- **Performance & Accessibility**: Load time validation and accessibility compliance

### Browser Support
- **Desktop**: Chromium, Firefox, WebKit, Microsoft Edge
- **Mobile**: Mobile Chrome, Mobile Safari
- **Cross-platform**: Consistent testing across different devices and screen sizes

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run test:e2e:install
```

### Running Tests

#### Basic Test Execution
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

#### Browser-Specific Testing
```bash
# Test only Chromium
npm run test:e2e:chromium

# Test only Firefox
npm run test:e2e:firefox

# Test only WebKit/Safari
npm run test:e2e:webkit

# Test mobile browsers
npm run test:e2e:mobile
```

#### Advanced Test Runner
```bash
# Use advanced test runner with all features
npm run test:e2e:runner

# Run specific test suite
npm run test:e2e:runner:suite admin-plan-management

# Run with all browsers
npm run test:e2e:runner -- --all-browsers

# Run in headed mode with detailed reporting
npm run test:e2e:runner -- --headed --workers=3
```

## 📁 Test Structure

```
__tests__/e2e/
├── README.md                           # This file
├── auth.setup.ts                       # Authentication setup
├── cleanup.cleanup.ts                  # Test cleanup
├── complete-user-journey.spec.ts       # End-to-end user journeys
├── plan-management.e2e.test.ts        # API-level E2E tests
├── plan-management-playwright.spec.ts  # Browser-based E2E tests
├── test-runner.ts                      # Advanced test execution
├── setup/
│   ├── e2e-test-setup.ts              # Test utilities and helpers
│   ├── global-setup.ts                # Global test setup (if needed)
│   └── global-teardown.ts             # Global test cleanup (if needed)
└── snapshots/                         # Visual regression snapshots
```

## 🛠️ Configuration

### Environment Variables
```bash
# Test environment URL
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000

# Test credentials
TEST_ADMIN_EMAIL=admin@neolingus.com
TEST_ADMIN_PASSWORD=admin123
TEST_USER_EMAIL=user@neolingus.com
TEST_USER_PASSWORD=user123

# Test behavior
NODE_ENV=test
REAL_PAYMENTS=false  # Use mock payments for testing
```

### Playwright Configuration
The test suite is configured via `playwright.config.ts` with:
- **Parallel Execution**: Controlled for test dependencies
- **Retry Logic**: 2 retries on CI, 0 locally
- **Timeouts**: 30s test timeout, 15s navigation timeout
- **Reporting**: HTML, JSON, and JUnit reports
- **Screenshots/Videos**: On failure only
- **Trace Files**: On first retry

## 🧪 Test Scenarios

### Admin Workflows
```typescript
// Plan Management
- Create new plans with all configuration options
- Edit existing plans and verify changes persist
- Delete plans and handle dependencies
- Manage plan assignments to users
- View plan analytics and performance metrics

// User Management
- Assign plans to specific users
- Manage user trial configurations
- View user plan usage and billing history
- Handle plan upgrades and downgrades
```

### User Workflows
```typescript
// Plan Selection
- Browse available plans with feature comparison
- Toggle between monthly/yearly pricing
- Select plans and proceed through signup flow
- Start trial periods for eligible plans

// Plan Management
- View current plan details and usage
- Manage billing settings and auto-renewal
- Change billing cycles and payment methods
- Cancel subscriptions with feedback
```

### Trial Management
```typescript
// Trial Lifecycle
- Activate trials with proper feature access
- Handle trial countdown and expiration warnings
- Manage trial-to-paid conversions
- Restrict access after trial expiration
- Provide upgrade prompts and flows
```

## 🔧 Test Helpers

### Authentication Helpers
```typescript
import { AuthHelpers } from './setup/e2e-test-setup';

// Login as admin
await AuthHelpers.loginAsAdmin(page);

// Login as regular user
await AuthHelpers.loginAsUser(page);

// Logout and clear session
await AuthHelpers.logout(page);
```

### API Mock Helpers
```typescript
import { ApiMockHelpers } from './setup/e2e-test-setup';

// Mock successful plan creation
await ApiMockHelpers.mockSuccessfulPlanCreation(page);

// Mock payment success/failure
await ApiMockHelpers.mockPaymentSuccess(page);
await ApiMockHelpers.mockPaymentFailure(page);

// Mock trial states
await ApiMockHelpers.mockTrialStatus(page, {
  isActive: true,
  daysRemaining: 7,
  planTier: 'premium'
});
```

### UI Interaction Helpers
```typescript
import { UIHelpers } from './setup/e2e-test-setup';

// Fill plan creation form
await UIHelpers.fillPlanForm(page, {
  name: 'Test Plan',
  tier: 'premium',
  pricing: { monthly_price: 4999, currency: 'EUR' }
});

// Wait for toast notifications
await UIHelpers.waitForToast(page, 'success', 'Plan created successfully');

// Handle loading states
await UIHelpers.expectLoadingState(page, '[data-testid="save-button"]');
```

## 📊 Performance Testing

### Performance Budgets
- **Page Load Time**: < 3 seconds
- **API Response Time**: < 200ms
- **Bundle Size**: Initial < 500KB, Total < 2MB
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Performance Validation
```typescript
// Measure page load performance
const loadTime = await PerformanceHelpers.measurePageLoad(page, '/dashboard');
expect(loadTime).toBeLessThan(3000);

// Get Core Web Vitals
const vitals = await PerformanceHelpers.getCoreWebVitals(page);
expect(vitals.LCP).toBeLessThan(2500);
```

## ♿ Accessibility Testing

### Accessibility Standards
- **WCAG 2.1 AA Compliance**: Minimum standard
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Proper ARIA labels and roles
- **Color Contrast**: Minimum 4.5:1 ratio for normal text

### Accessibility Validation
```typescript
// Test keyboard navigation
await AccessibilityHelpers.checkKeyboardNavigation(page, [
  '[data-testid="plan-name-input"]',
  '[data-testid="plan-tier-select"]',
  '[data-testid="save-button"]'
]);

// Verify ARIA labels
await AccessibilityHelpers.checkAriaLabels(page, [
  'Plan name',
  'Plan tier',
  'Save plan'
]);
```

## 🐛 Debugging Tests

### Debug Mode
```bash
# Run in debug mode with inspector
npm run test:e2e:debug

# Debug specific test file
npx playwright test plan-management-playwright.spec.ts --debug

# Debug with headed browser
npx playwright test --headed --debug
```

### Test Inspection
```bash
# Generate and view HTML report
npx playwright show-report

# Open trace viewer for failed tests
npx playwright show-trace test-results/trace.zip
```

### Common Issues
1. **Test Timeouts**: Increase timeout or check for proper wait conditions
2. **Element Not Found**: Verify data-testid attributes exist in components
3. **Authentication Failures**: Check test credentials and auth flow
4. **Network Issues**: Ensure test environment is running and accessible

## 📋 Test Data Management

### Mock Data
```typescript
// Use consistent mock data
import { mockPlanData, mockUserData, mockCourseData } from './setup/e2e-test-setup';

// Access predefined test data
const basicPlan = mockPlanData.basic;
const adminUser = mockUserData.admin;
```

### Test Cleanup
```typescript
// Automatic cleanup after tests
await CleanupHelpers.cleanupTestPlans(page);
await CleanupHelpers.cleanupTestAssignments(page);
await CleanupHelpers.resetUserTrials(page);
```

## 📈 Reporting

### Report Generation
- **HTML Report**: Interactive test results with screenshots
- **JSON Report**: Machine-readable results for CI/CD
- **JUnit Report**: Standard XML format for test runners
- **Custom Reports**: Detailed execution summaries with metrics

### Report Access
```bash
# View HTML report
npx playwright show-report

# Generate custom report
npm run test:e2e:runner  # Includes custom reporting
```

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: |
    npm run test:e2e
  env:
    PLAYWRIGHT_TEST_BASE_URL: https://staging.neolingus.com
    CI: true

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

### Environment Configuration
```typescript
// Different configs for different environments
if (process.env.NODE_ENV === 'staging') {
  // Staging-specific settings
  module.exports.use.baseURL = process.env.STAGING_URL;
  module.exports.retries = 3;
}
```

## 🎭 Best Practices

### Test Organization
1. **Group Related Tests**: Use describe blocks to organize test scenarios
2. **Clear Test Names**: Use descriptive test names that explain the scenario
3. **Independent Tests**: Each test should be able to run independently
4. **Proper Setup/Teardown**: Use beforeEach/afterEach for test preparation

### Test Reliability
1. **Wait Strategies**: Use proper wait conditions instead of hard delays
2. **Stable Selectors**: Use data-testid attributes for reliable element selection
3. **Error Handling**: Include proper error handling and recovery scenarios
4. **Mock External Services**: Mock third-party services to avoid dependencies

### Maintenance
1. **Regular Updates**: Keep Playwright and dependencies updated
2. **Review Failures**: Regularly review and fix flaky tests
3. **Performance Monitoring**: Monitor test execution times and optimize slow tests
4. **Documentation**: Keep test documentation current with application changes

## 🔍 Advanced Features

### Visual Regression Testing
```typescript
// Take and compare screenshots
await expect(page).toHaveScreenshot('plan-grid.png');

// Full page screenshot
await expect(page).toHaveScreenshot('admin-dashboard.png', { fullPage: true });
```

### Network Interception
```typescript
// Intercept and modify API responses
await page.route('/api/plans', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ plans: mockPlansData })
  });
});
```

### Mobile Testing
```typescript
// Test mobile-specific behavior
test('mobile plan selection', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // Mobile-specific test logic
});
```

This comprehensive E2E testing suite ensures the plan management system works correctly across all supported browsers and devices, providing confidence in the system's reliability and user experience.