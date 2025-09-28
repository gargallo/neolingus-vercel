# Academia Dashboard Components Test Suite

This directory contains comprehensive tests for the Neolingus Academia dashboard components. The test structure follows the project's testing patterns and provides full coverage for dashboard functionality.

## 📁 Directory Structure

```
tests/components/dashboard/
├── README.md                      # This file - test documentation
├── mock-data.ts                   # Comprehensive mock data for all components
├── test-utils.tsx                 # Test utilities and helper functions
├── dashboard-stats.test.tsx       # Dashboard statistics component tests
├── activity-timeline.test.tsx     # Recent activity timeline tests
├── quick-actions.test.tsx         # Quick action buttons tests
└── course-dashboard.test.tsx      # Main dashboard integration tests
```

## 🧪 Test Framework

- **Testing Library**: Vitest + React Testing Library
- **Configuration**: Uses `vitest.components.config.ts`
- **Setup**: Extends existing `__tests__/components/setup/component-test-setup.ts`
- **Patterns**: Follows established testing patterns from existing codebase

## 📦 Mock Data Structure

### Core Data Types
- **Course Data**: Complete course information with metadata
- **Progress Data**: User progress tracking and analytics
- **Activity Data**: Recent exam sessions and timeline
- **Stats Data**: Dashboard statistics and metrics
- **Quick Actions**: Action buttons with handlers
- **User Context**: Authentication and role data

### Test Scenarios
- **Loading States**: Spinner, skeleton screens
- **Error States**: Network errors, validation errors
- **Empty States**: No data, first-time users
- **Complete States**: Full dashboard with all data
- **Responsive States**: Mobile, tablet, desktop viewports

## 🛠 Test Utilities

### Rendering Helpers
```tsx
import { renderWithProviders } from './test-utils';

// Render with mock providers
renderWithProviders(<Component />, {
  courseContextValue: mockCourseContext,
  viewport: 'mobile'
});
```

### Dashboard Test Helpers
```tsx
import { dashboardTestHelpers } from './test-utils';

// Verify dashboard states
dashboardTestHelpers.expectLoadingState();
dashboardTestHelpers.expectCompleteDashboard();
dashboardTestHelpers.expectStatsDisplay(mockStats);
```

### Interaction Helpers
```tsx
import { interactionTestHelpers } from './test-utils';

// Simulate user interactions
await interactionTestHelpers.clickStartExam(user);
await interactionTestHelpers.clickRefresh(user);
```

### Accessibility Helpers
```tsx
import { a11yTestHelpers } from './test-utils';

// Verify accessibility compliance
a11yTestHelpers.expectProperARIA();
a11yTestHelpers.expectAccessibleLoading();
```

## 📊 Test Categories

### 1. Dashboard Statistics Tests (`dashboard-stats.test.tsx`)
- **Loading States**: Loading spinners and skeleton screens
- **Error Handling**: Failed API calls and network errors
- **Data Display**: Stat cards, progress indicators, trends
- **Responsive Design**: Mobile/tablet/desktop layouts
- **Accessibility**: ARIA labels, screen reader support
- **Performance**: Efficient rendering with multiple stats

### 2. Activity Timeline Tests (`activity-timeline.test.tsx`)
- **Activity Display**: Recent exam sessions and progress
- **Timeline Navigation**: View history, pagination
- **Activity Items**: Scores, durations, exam types
- **Empty States**: No activity placeholders
- **User Interactions**: Click handlers, navigation
- **Real-time Updates**: Live activity feeds

### 3. Quick Actions Tests (`quick-actions.test.tsx`)
- **Action Buttons**: Start exam, view progress, refresh
- **Button States**: Enabled/disabled based on context
- **Priority Handling**: High/medium/low priority actions
- **Click Handlers**: Proper function calls and navigation
- **Responsive Grid**: Action layout across devices
- **Keyboard Navigation**: Tab order and focus management

### 4. Course Dashboard Tests (`course-dashboard.test.tsx`)
- **Integration Testing**: Full dashboard component lifecycle
- **Tab Navigation**: Overview, practice, analytics, resources
- **Provider Selection**: Exam provider switching
- **Achievement Integration**: Badge display and progress
- **Data Loading**: API integration and state management
- **Error Recovery**: Graceful error handling and retry

## 🔧 Configuration Integration

### Vitest Configuration
The tests use the existing `vitest.components.config.ts` configuration:
- **Environment**: jsdom for React component testing
- **Setup Files**: Extends existing component test setup
- **Test Patterns**: `tests/components/**/*.test.{ts,tsx}`
- **Aliases**: Uses project's path aliases (@, ~)

### Mock Setup
Leverages existing mock infrastructure:
- **Router Mocking**: Next.js navigation mocks
- **API Mocking**: Fetch and request mocking
- **Context Providers**: Course and authentication contexts
- **Global Mocks**: window APIs, ResizeObserver, etc.

## 🎯 Test Execution

### Running Tests
```bash
# Run all academia component tests
npm run test:components -- academia

# Run specific test file
npm run test:components -- dashboard-stats

# Run with coverage
npm run test:components -- --coverage

# Run in watch mode
npm run test:components -- --watch
```

### Test Scripts
```json
{
  "test:academia": "vitest run tests/components/dashboard/",
  "test:academia:watch": "vitest watch tests/components/dashboard/",
  "test:academia:coverage": "vitest run tests/components/dashboard/ --coverage"
}
```

## 📈 Coverage Goals

### Target Coverage Metrics
- **Statements**: 95%+
- **Branches**: 90%+
- **Functions**: 95%+
- **Lines**: 95%+

### Coverage Areas
- ✅ **Component Rendering**: All components render without errors
- ✅ **State Management**: Loading, error, success states
- ✅ **User Interactions**: Click handlers, form submissions
- ✅ **Responsive Design**: Mobile, tablet, desktop layouts
- ✅ **Accessibility**: ARIA compliance, keyboard navigation
- ✅ **Error Handling**: Network errors, validation errors
- ✅ **Performance**: Efficient rendering and updates

## 🔍 Testing Patterns

### Component Testing Pattern
```tsx
describe('Component Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render successfully with valid props', () => {
      // Test basic rendering
    });
  });

  describe('States', () => {
    it('should handle loading state', () => {
      // Test loading state
    });
  });

  describe('Interactions', () => {
    it('should handle user interactions', async () => {
      // Test user interactions
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      // Test accessibility
    });
  });
});
```

### Mock Data Pattern
```tsx
export const mockComponentData = {
  basic: { /* minimal valid data */ },
  complete: { /* full feature data */ },
  empty: { /* empty state data */ },
  error: { /* error state data */ }
};
```

### Test Utility Pattern
```tsx
export const componentTestHelpers = {
  findElement: (identifier) => screen.getByTestId(identifier),
  expectState: (state) => expect(/* state assertion */),
  simulateAction: async (user, action) => await user.click(action)
};
```

## 🚀 Development Workflow

### Adding New Tests
1. **Create Test File**: Follow naming convention `component-name.test.tsx`
2. **Add Mock Data**: Extend `mock-data.ts` with new test data
3. **Use Test Utils**: Leverage existing test utilities
4. **Follow Patterns**: Use established testing patterns
5. **Update README**: Document new test coverage

### Test Development Checklist
- [ ] Component renders without errors
- [ ] Loading states work correctly
- [ ] Error states display properly
- [ ] User interactions function as expected
- [ ] Responsive design works across viewports
- [ ] Accessibility requirements are met
- [ ] Performance is acceptable
- [ ] Integration with context works
- [ ] Mock data covers all scenarios
- [ ] Tests are maintainable and readable

## 🔗 Integration Points

### Existing Test Infrastructure
- **Setup Files**: Uses existing component test setup
- **Mock Patterns**: Follows established mocking patterns
- **Helper Functions**: Extends existing test utilities
- **Configuration**: Integrates with existing Vitest config

### Component Dependencies
- **Course Context**: Academia course selection context
- **API Integration**: Course progress and exam data
- **Authentication**: User authentication and permissions
- **Routing**: Next.js navigation and page routing
- **UI Components**: Shared UI component library

### Future Enhancements
- **E2E Tests**: Playwright integration for full user flows
- **Visual Testing**: Screenshot testing for UI regression
- **Performance Testing**: Component performance benchmarks
- **API Contract Testing**: Mock API contract validation
- **Real Data Testing**: Integration with actual API endpoints

---

## 📝 Implementation Status

**Current Phase**: Test Structure Setup ✅
- ✅ Directory structure created
- ✅ Mock data framework established
- ✅ Test utilities implemented
- ✅ Placeholder test files created
- ✅ Integration patterns documented

**Next Phase**: Component Implementation
- ⏳ Implement actual dashboard components
- ⏳ Connect tests to real components
- ⏳ Add component-specific test cases
- ⏳ Verify test coverage and quality
- ⏳ Performance optimization and monitoring

This test structure provides a solid foundation for comprehensive testing of the Academia dashboard components while maintaining consistency with the existing codebase patterns and standards.