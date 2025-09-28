# Dashboard Accessibility Testing Suite

Comprehensive accessibility testing suite for WCAG 2.1 AA compliance, specifically designed for dashboard components including DashboardStats, ActivityTimeline, and QuickActions.

## 🎯 Overview

This testing suite ensures that all dashboard components meet Web Content Accessibility Guidelines (WCAG) 2.1 AA standards, providing an inclusive experience for users with disabilities.

### Key Features

- **Automated WCAG 2.1 AA Testing** with axe-core integration
- **Manual Testing Helpers** for keyboard navigation and screen reader compatibility
- **Component-Specific Tests** tailored for dashboard functionality
- **Integration Testing** for complete user workflows
- **CI/CD Pipeline Integration** with automated reporting
- **Performance Monitoring** for accessibility features impact

## 📋 Test Coverage

### WCAG 2.1 AA Principles Covered

#### 1. Perceivable
- ✅ Text alternatives for non-text content
- ✅ Color contrast ratios (4.5:1 minimum)
- ✅ Text spacing and readability
- ✅ Responsive design and zoom support
- ✅ Visual focus indicators

#### 2. Operable
- ✅ Keyboard accessibility for all functions
- ✅ Touch target sizes (44x44 CSS pixels minimum)
- ✅ No keyboard traps
- ✅ Skip links and navigation aids
- ✅ Timeout and timing considerations

#### 3. Understandable
- ✅ Clear and simple language
- ✅ Predictable functionality
- ✅ Input assistance and error identification
- ✅ Consistent navigation patterns

#### 4. Robust
- ✅ Valid markup and semantic HTML
- ✅ Assistive technology compatibility
- ✅ ARIA attributes and landmarks
- ✅ Progressive enhancement

## 🚀 Quick Start

### Prerequisites

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-axe axe-core
```

### Running Tests

```bash
# Run all accessibility tests
npm run test:accessibility

# Run tests in watch mode
npm run test:accessibility:watch

# Generate coverage report
npm run test:accessibility:coverage

# Run tests in CI mode
npm run test:accessibility:ci

# Generate accessibility report
npm run accessibility:report
```

## 📁 File Structure

```
tests/accessibility/
├── accessibility-utils.ts           # Core testing utilities
├── manual-testing-helpers.ts        # Manual testing functions
├── setup.ts                        # Test environment setup
├── jest-axe-setup.ts               # Axe-core configuration
├── ci-accessibility-config.js      # CI/CD configuration
├── generate-report.js              # Report generation script
├── dashboard-accessibility.test.tsx # Main dashboard tests
├── wcag-compliance-tests.test.tsx   # WCAG compliance tests
├── component-specific-tests.test.tsx # Component-specific tests
├── integration-accessibility.test.tsx # Integration tests
└── README.md                       # This file
```

## 🧪 Test Categories

### 1. Dashboard Components Tests (`dashboard-accessibility.test.tsx`)

Tests the core dashboard components for basic accessibility compliance:

- **DashboardStats**: Statistics display with screen reader support
- **ActivityTimeline**: Chronological activity list with proper semantics
- **QuickActions**: Action buttons with keyboard navigation

### 2. WCAG Compliance Tests (`wcag-compliance-tests.test.tsx`)

Systematic testing against all WCAG 2.1 AA success criteria:

- **Principle 1 (Perceivable)**: Color contrast, text alternatives, adaptability
- **Principle 2 (Operable)**: Keyboard access, navigation, input modalities
- **Principle 3 (Understandable)**: Readable content, predictable functions
- **Principle 4 (Robust)**: Compatible markup, assistive technology support

### 3. Component-Specific Tests (`component-specific-tests.test.tsx`)

Detailed testing for each component's unique accessibility requirements:

- **Statistical Data**: Percentage announcements, trend indicators
- **Temporal Information**: Date/time accessibility
- **Interactive Elements**: Button states, loading indicators
- **Error Handling**: Accessible error messages and recovery

### 4. Integration Tests (`integration-accessibility.test.tsx`)

End-to-end accessibility testing for complete user workflows:

- **Cross-Component Navigation**: Tab order and focus management
- **Screen Reader Workflows**: Complete user journeys
- **Responsive Accessibility**: Mobile and desktop compatibility
- **Performance Impact**: Accessibility feature performance monitoring

## 🛠️ Testing Utilities

### Automated Testing

```typescript
import { runFullAccessibilityTest } from './accessibility-utils';

const testResults = await runFullAccessibilityTest(
  <DashboardStats stats={mockStats} onStatClick={handleClick} />,
  {
    skipAxe: false,
    skipKeyboard: false,
    skipScreenReader: false
  }
);

expect(testResults.summary.passed).toBe(true);
```

### Manual Testing Helpers

```typescript
import {
  testKeyboardInteraction,
  testScreenReaderContent,
  testTouchTargets,
  runManualAccessibilityTests
} from './manual-testing-helpers';

// Test individual aspects
const keyboardResult = testKeyboardInteraction(buttonElement);
const screenReaderResult = testScreenReaderContent(element);
const touchResult = testTouchTargets(buttonElement);

// Run comprehensive manual tests
const results = runManualAccessibilityTests(containerElement);
```

### Custom Matchers

```typescript
// Extended Jest matchers for accessibility testing
expect(element).toBeAccessible();
expect(button).toHaveAccessibleName('Start Practice Exam');
expect(element).toSupportKeyboardNavigation();
expect(textElement).toMeetContrastRequirements();
```

## 📊 CI/CD Integration

### GitHub Actions Workflow

The test suite automatically runs in CI/CD pipelines:

```yaml
- name: Run accessibility tests
  run: npm run test:accessibility:ci
  env:
    CI: 'true'
    NODE_ENV: 'testing'

- name: Upload accessibility reports
  uses: actions/upload-artifact@v3
  with:
    name: accessibility-reports
    path: accessibility-reports/
```

### Report Generation

Automated reports are generated in multiple formats:

- **HTML Report**: Visual dashboard with interactive results
- **JSON Report**: Machine-readable data for integration
- **JUnit XML**: CI/CD pipeline integration
- **Markdown Report**: Human-readable summary for documentation

### Performance Monitoring

The suite monitors accessibility testing performance:

- **Test Duration**: Individual and suite execution times
- **Memory Usage**: Resource consumption tracking
- **Render Performance**: Impact of accessibility features on component rendering

## 🎨 Component Guidelines

### DashboardStats Accessibility

```typescript
<DashboardStats
  stats={stats}
  onStatClick={handleClick}
  accessibility={{
    regionLabel: 'Course performance statistics',
    description: 'Overview of your course progress and performance metrics',
    instructions: 'Navigate using Tab. Press Enter to view details.'
  }}
/>
```

**Key Requirements:**
- Each statistic must have descriptive `aria-label`
- Trend indicators need accessible announcements
- Loading states must be announced to screen readers
- Error states require proper `role="alert"`

### ActivityTimeline Accessibility

```typescript
<ActivityTimeline
  activities={activities}
  onActivitySelect={handleSelect}
  emptyMessage="No recent activity to display"
  accessibility={{
    timeFormat: 'long', // Full date format for screen readers
    announceUpdates: true
  }}
/>
```

**Key Requirements:**
- Proper list semantics (`role="list"` and `role="listitem"`)
- Accessible date/time information
- Clear activity type announcements
- Empty state messaging

### QuickActions Accessibility

```typescript
<QuickActions
  primary={{
    label: 'Start Practice Exam',
    onClick: handleStart,
    ariaLabel: 'Start a new practice exam session'
  }}
  secondary={secondaryActions}
  accessibility={{
    groupLabel: 'Course quick actions',
    instructions: 'Use these buttons to access key course features'
  }}
/>
```

**Key Requirements:**
- Proper button grouping with `role="group"`
- Descriptive `aria-label` for each action
- Disabled state handling
- Touch target size compliance (44x44px minimum)

## 🚨 Common Issues and Solutions

### Issue: Missing Accessible Names

**Problem:** Interactive elements lack proper labeling for screen readers.

**Solution:**
```typescript
// Bad
<button onClick={handleClick}>👍</button>

// Good
<button onClick={handleClick} aria-label="Like this activity">
  👍
</button>
```

### Issue: Poor Color Contrast

**Problem:** Text doesn't meet 4.5:1 contrast ratio requirement.

**Solution:**
```css
/* Bad */
.text { color: #999; background: #fff; } /* 2.8:1 ratio */

/* Good */
.text { color: #333; background: #fff; } /* 12.6:1 ratio */
```

### Issue: Keyboard Navigation Problems

**Problem:** Users can't navigate or activate elements with keyboard.

**Solution:**
```typescript
// Ensure proper focus handling
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    handleClick();
  }
};

<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={handleClick}
  aria-label="Accessible button"
>
  Click me
</div>
```

### Issue: Screen Reader Announcements

**Problem:** Dynamic content changes aren't announced to screen readers.

**Solution:**
```typescript
// Use ARIA live regions for updates
<div role="status" aria-live="polite" aria-atomic="true">
  {loadingMessage}
</div>

// For urgent announcements
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

## 📚 Resources

### WCAG 2.1 Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [Techniques for WCAG 2.1](https://www.w3.org/WAI/WCAG21/Techniques/)

### Testing Tools
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [jest-axe Usage](https://github.com/nickcolley/jest-axe)
- [Testing Library Accessibility](https://testing-library.com/docs/guide-which-query#priority)

### ARIA Guidelines
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [ARIA in HTML](https://www.w3.org/TR/html-aria/)
- [Using ARIA](https://w3c.github.io/using-aria/)

## 🤝 Contributing

When adding new dashboard components or modifying existing ones:

1. **Write accessibility tests first** following TDD principles
2. **Use the testing utilities** provided in this suite
3. **Test with real assistive technology** when possible
4. **Update documentation** with accessibility considerations
5. **Run the full test suite** before submitting changes

### Testing Checklist

- [ ] All interactive elements have accessible names
- [ ] Keyboard navigation works for all functionality
- [ ] Color contrast meets WCAG AA requirements
- [ ] Screen reader announcements are appropriate
- [ ] Touch targets meet minimum size requirements
- [ ] Loading and error states are accessible
- [ ] Tests pass in CI/CD pipeline

## 📞 Support

For accessibility testing questions or issues:

1. Check the [common issues section](#-common-issues-and-solutions)
2. Review the [WCAG guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
3. Run the debugging utilities provided in the test suite
4. Consult with the accessibility team or create an issue

---

*This accessibility testing suite ensures that our dashboard components provide an inclusive experience for all users, regardless of their abilities or the assistive technologies they use.*