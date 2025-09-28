# Visual Regression Testing for Dashboard Layout

This comprehensive visual regression testing system ensures dashboard layout consistency and detects unintended visual changes across different environments, themes, and device configurations.

## Overview

The visual testing system includes:
- **Complete dashboard layout testing** across multiple scenarios
- **Responsive design validation** for mobile, tablet, and desktop viewports
- **Component state testing** for loading, error, and interactive states
- **Theme and accessibility testing** including dark mode and high contrast
- **CI/CD integration** with automated baseline management
- **Performance impact analysis** with Lighthouse integration

## Quick Start

### 1. Install Dependencies

```bash
npm install
npm run visual:install
npm run visual:install-deps
```

### 2. Initialize Baseline Management

```bash
npm run baseline:init
```

### 3. Run Visual Tests

```bash
# Run all visual tests
npm run test:visual

# Run with UI mode for interactive debugging
npm run test:visual:ui

# Run smoke tests only
npm run test:visual:smoke

# Update baseline screenshots
npm run test:visual:update
```

## Test Structure

### Test Categories

1. **Dashboard Layout Tests** (`dashboard-layout.visual.spec.ts`)
   - Complete dashboard rendering with different data scenarios
   - Component-specific layout validation
   - Loading and error state consistency
   - Layout stability during data loading

2. **Responsive Design Tests** (`responsive-design.visual.spec.ts`)
   - Mobile, tablet, and desktop viewport testing
   - Grid layout adaptation across breakpoints
   - Touch interaction and keyboard navigation
   - Content density and spacing validation

3. **Component State Tests** (`component-states.visual.spec.ts`)
   - Loading skeletons and error states
   - Interactive states (hover, focus, active)
   - Different data value scenarios
   - State transition consistency

4. **Theme and Accessibility Tests** (`theme-accessibility.visual.spec.ts`)
   - Light and dark theme rendering
   - High contrast mode compatibility
   - Font size scaling and zoom levels
   - Color vision accessibility
   - Screen reader support validation

### Test Data Scenarios

The test system includes pre-configured scenarios:

- **High Progress**: User with significant course completion (75%+)
- **Low Progress**: New user with minimal activity (20%-)
- **Empty State**: User with no data or activity
- **Perfect Scores**: Edge case with 100% completion
- **Error Scenarios**: API failures and network issues

## Configuration

### Playwright Configuration

The visual tests use a specialized Playwright configuration (`playwright.visual.config.ts`) with:

- **Multiple browsers**: Chrome, Firefox, Safari
- **Responsive viewports**: Mobile, tablet, desktop, large screen
- **Theme variants**: Light, dark, high contrast
- **Animation controls**: Disabled for consistent screenshots
- **Retry logic**: Automatic retries for flaky tests

### Viewport Configurations

```typescript
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  mobileLarge: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  desktop: { width: 1440, height: 900 },
  desktopLarge: { width: 1920, height: 1080 },
};
```

## Mock Data System

### Mock Data Generator

The `MockDataGenerator` class provides consistent test data:

```typescript
// Create test scenarios
const highProgress = MockDataGenerator.createHighProgressScenario();
const lowProgress = MockDataGenerator.createLowProgressScenario();
const emptyState = MockDataGenerator.createEmptyScenario();

// Custom data
const customContext = {
  user: MockDataGenerator.createUser({ role: 'admin' }),
  course: MockDataGenerator.createCourse({ language: 'spanish' }),
  progress: MockDataGenerator.createProgress({ overall_progress: 85 }),
  activities: MockDataGenerator.createActivities(10),
};
```

### API Mocking

Tests automatically mock all API endpoints:

```typescript
// Automatic setup in pageHelper.setupMockResponses()
await pageHelper.setupMockResponses(context);

// Progress API: /api/academia/progress/{courseId}
// Sessions API: /api/academia/exams/sessions
// Recommendations API: /api/academia/recommendations
// Authentication: /api/auth/**
```

## Utilities and Helpers

### Page Helper

The `DashboardPageHelper` provides dashboard-specific utilities:

```typescript
const pageHelper = new DashboardPageHelper(page);

// Navigation and setup
await pageHelper.navigateToDashboard();
await pageHelper.waitForDashboardLoad();

// State manipulation
await pageHelper.triggerLoadingState();
await pageHelper.triggerErrorState();
await pageHelper.hoverOverStats();
await pageHelper.expandActivityTimeline();

// Responsive testing
await pageHelper.testResponsiveLayout('mobile');
```

### Screenshot Helper

The `ScreenshotHelper` provides consistent screenshot capture:

```typescript
const screenshotHelper = new ScreenshotHelper(page);

// Full page screenshots
await screenshotHelper.takeScreenshot({
  name: 'dashboard-complete',
  fullPage: true,
});

// Component screenshots
await screenshotHelper.takeComponentScreenshot(
  '[data-testid="dashboard-stats"]',
  'stats-component'
);

// Theme comparison
await screenshotHelper.takeThemeScreenshots(
  'dashboard-comparison',
  '[data-testid="dashboard-overview"]'
);
```

### Animation Helper

The `AnimationHelper` ensures consistent visual testing:

```typescript
const animationHelper = new AnimationHelper(page);

// Disable all animations
await animationHelper.disableAnimations();

// Wait for stability
await animationHelper.waitForImages();
await animationHelper.waitForAnimations();
```

## Baseline Management

### Baseline Commands

```bash
# List all baseline images
npm run baseline:list

# Validate baseline integrity
npm run baseline:validate

# Generate baseline report
npm run baseline:report

# Clean up unused baselines
npm run baseline:cleanup

# Archive old baselines (30+ days)
npm run baseline:archive
```

### Baseline Metadata

Each baseline image includes metadata:

```json
{
  "version": "1.0.0",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "branch": "main",
  "commit": "abc123...",
  "environment": {
    "os": "linux",
    "browser": "chromium",
    "viewport": "1440x900"
  },
  "checksum": "sha256:..."
}
```

## CI/CD Integration

### GitHub Actions Workflow

The visual regression workflow (`.github/workflows/visual-regression.yml`) includes:

1. **Change Detection**: Only runs when UI-related files change
2. **Build Optimization**: Caches dependencies and build artifacts
3. **Parallel Execution**: Runs tests across browser/test-group matrix
4. **Baseline Management**: Automatic baseline updates on main branch
5. **PR Comments**: Visual diff summaries with links to detailed reports
6. **Performance Analysis**: Lighthouse integration for performance impact

### Workflow Triggers

- **Push to main/develop**: Full test suite
- **Pull Requests**: Smoke tests with visual diff analysis
- **Manual Dispatch**: Configurable test levels and baseline updates

### Test Levels

- **Smoke**: Critical paths only, fastest execution
- **Full**: Comprehensive testing for main branches
- **Comprehensive**: All scenarios including edge cases

## Running Tests Locally

### Development Workflow

1. **Make UI changes** to dashboard components
2. **Run smoke tests** to check for obvious regressions:
   ```bash
   npm run test:visual:smoke
   ```
3. **Review differences** in the Playwright UI:
   ```bash
   npm run test:visual:ui
   ```
4. **Update baselines** if changes are intentional:
   ```bash
   npm run test:visual:update
   ```
5. **Run full test suite** before committing:
   ```bash
   npm run test:visual
   ```

### Debugging Visual Tests

```bash
# Run in headed mode (see browser)
npm run test:visual:headed

# Debug with Playwright inspector
npm run test:visual:debug

# View test reports
npm run test:visual:report
```

### Test Filtering

```bash
# Run specific test file
npx playwright test tests/visual/dashboard-layout.visual.spec.ts

# Run specific browser
npx playwright test --project=chromium

# Run specific test
npx playwright test --grep="should render complete dashboard"

# Run responsive tests only
npx playwright test tests/visual/responsive-design.visual.spec.ts
```

## Best Practices

### Writing Visual Tests

1. **Use semantic selectors**: Prefer `data-testid` attributes
2. **Disable animations**: Use `AnimationHelper` for consistency
3. **Wait for stability**: Ensure content is fully loaded
4. **Mock data consistently**: Use `MockDataGenerator` for predictable scenarios
5. **Test meaningful states**: Focus on user-visible differences

### Screenshot Guidelines

1. **Descriptive names**: Use clear, hierarchical naming
2. **Consistent viewports**: Stick to predefined viewport sizes
3. **Component isolation**: Test components in isolation when possible
4. **State coverage**: Include loading, error, and empty states
5. **Cross-browser validation**: Test critical paths on all browsers

### Performance Considerations

1. **Parallel execution**: Use test.describe.parallel() for independent tests
2. **Selective updates**: Only update baselines when necessary
3. **Smart filtering**: Use test tags (@smoke, @critical) for different CI levels
4. **Resource cleanup**: Clear caches and temporary files
5. **Baseline archival**: Regularly archive old baselines

## Troubleshooting

### Common Issues

1. **Flaky animations**: Ensure `animationHelper.disableAnimations()` is called
2. **Timing issues**: Add appropriate waits for async content
3. **Font rendering**: Use consistent font loading strategies
4. **Image loading**: Wait for all images with `animationHelper.waitForImages()`
5. **Browser differences**: Accept minor pixel differences between browsers

### Error Messages

- **"Screenshot comparison failed"**: Visual difference detected, review with UI mode
- **"Element not found"**: Check selectors and waiting strategies
- **"Timeout waiting for element"**: Increase timeouts or improve loading detection
- **"Network request failed"**: Check mock API setup
- **"Baseline not found"**: Run with `--update-snapshots` to create baseline

### Debug Commands

```bash
# Validate test setup
npm run baseline:validate

# Check baseline status
npm run baseline:report

# Clean up test artifacts
npm run baseline:cleanup

# Re-initialize if corrupted
npm run baseline:init
```

## Contributing

### Adding New Visual Tests

1. **Create test file** in `tests/visual/`
2. **Use existing helpers** for consistency
3. **Add appropriate mock data** scenarios
4. **Include accessibility considerations**
5. **Update CI configuration** if needed

### Modifying Existing Tests

1. **Review impact** on existing baselines
2. **Update test documentation**
3. **Validate across browsers**
4. **Consider backward compatibility**
5. **Update baseline metadata** if needed

### Baseline Updates

1. **Coordinate with team** before mass updates
2. **Document reasons** for baseline changes
3. **Test on multiple environments**
4. **Archive old baselines** before major updates
5. **Validate new baselines** thoroughly

## Monitoring and Maintenance

### Regular Tasks

- **Weekly**: Review failed tests and baseline drift
- **Monthly**: Archive old baselines and clean unused ones
- **Quarterly**: Update browser versions and dependencies
- **As needed**: Add tests for new components and features

### Metrics to Track

- **Test pass rate**: Target >95% for stable environments
- **Baseline age**: Keep baselines <90 days old
- **Coverage**: Ensure all critical UI paths are tested
- **Performance**: Monitor test execution time
- **Storage**: Manage baseline storage size

### Health Checks

```bash
# Quick health check
npm run baseline:validate && npm run test:visual:smoke

# Comprehensive report
npm run baseline:report

# Storage cleanup
npm run baseline:cleanup && npm run baseline:archive
```