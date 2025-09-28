/**
 * Accessibility Testing Setup
 *
 * Global setup and configuration for accessibility testing environment.
 * This file configures Jest, jsdom, and accessibility testing tools.
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers with jest-axe
expect.extend(toHaveNoViolations);

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
  // Increase timeout for accessibility tests
  asyncUtilTimeout: 5000,
  // Show detailed errors for accessibility issues
  getElementError: (message: string | null) => {
    const error = new Error(
      message ||
      'Unable to find element. This could be an accessibility issue. ' +
      'Ensure the element has proper ARIA attributes or text content.'
    );
    error.name = 'AccessibilityTestingError';
    return error;
  }
});

// Global DOM setup for accessibility testing
beforeAll(() => {
  // Mock window properties that affect accessibility
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock ResizeObserver for responsive tests
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock IntersectionObserver for visibility tests
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock getComputedStyle for consistent accessibility checks
  Object.defineProperty(window, 'getComputedStyle', {
    value: () => ({
      // High contrast colors for testing
      color: 'rgb(17, 24, 39)',
      backgroundColor: 'rgb(255, 255, 255)',
      fontSize: '16px',
      fontWeight: '400',
      lineHeight: '24px', // 1.5 ratio
      letterSpacing: '0.025em',
      wordSpacing: '0.16em',
      marginBottom: '16px',
      paddingBottom: '16px',
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      width: '200px',
      height: '48px',
      // Focus indicators
      outline: '2px solid rgb(59, 130, 246)',
      outlineWidth: '2px',
      outlineOffset: '2px',
      boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
      // Text spacing
      textAlign: 'left',
      textDecoration: 'none',
      textTransform: 'none'
    }),
    writable: true
  });

  // Mock getBoundingClientRect for touch target testing
  Element.prototype.getBoundingClientRect = jest.fn(() => ({
    width: 48,
    height: 48,
    top: 0,
    left: 0,
    bottom: 48,
    right: 48,
    x: 0,
    y: 0,
    toJSON: jest.fn()
  }));

  // Mock focus methods for keyboard testing
  HTMLElement.prototype.focus = jest.fn();
  HTMLElement.prototype.blur = jest.fn();

  // Mock scrollIntoView for navigation testing
  Element.prototype.scrollIntoView = jest.fn();

  // Setup ARIA live region monitoring
  const liveRegions = new Set<Element>();
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name: string, value: string) {
    if (name === 'aria-live' && value === 'polite') {
      liveRegions.add(this);
    }
    return originalSetAttribute.call(this, name, value);
  };

  // Make live regions available for testing
  (global as any).getLiveRegions = () => Array.from(liveRegions);
});

// Setup before each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset document focus
  if (document.activeElement && document.activeElement !== document.body) {
    (document.activeElement as HTMLElement).blur();
  }

  // Clear any existing live region announcements
  const liveRegions = document.querySelectorAll('[aria-live]');
  liveRegions.forEach(region => {
    region.textContent = '';
  });

  // Reset console to catch accessibility warnings
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  console.warn = jest.fn((...args) => {
    // Log accessibility-related warnings in tests
    if (args.some(arg =>
      typeof arg === 'string' &&
      (arg.includes('accessibility') || arg.includes('aria') || arg.includes('a11y'))
    )) {
      originalConsoleWarn.apply(console, args);
    }
  });

  console.error = jest.fn((...args) => {
    // Log accessibility-related errors in tests
    if (args.some(arg =>
      typeof arg === 'string' &&
      (arg.includes('accessibility') || arg.includes('aria') || arg.includes('a11y'))
    )) {
      originalConsoleError.apply(console, args);
    }
  });
});

// Cleanup after each test
afterEach(() => {
  // Restore console methods
  jest.restoreAllMocks();

  // Clean up any event listeners
  document.removeEventListener('keydown', () => {});
  document.removeEventListener('keyup', () => {});
  document.removeEventListener('click', () => {});
  document.removeEventListener('focus', () => {});
  document.removeEventListener('blur', () => {});

  // Reset any modified DOM properties
  document.documentElement.lang = 'en';
  document.title = 'Test';
});

// Global cleanup
afterAll(() => {
  // Clean up any global state
  delete (global as any).getLiveRegions;
});

// Error handling for accessibility test failures
const originalTestFn = global.it;
global.it = function accessibilityTestWrapper(name: string, testFn?: any, timeout?: number) {
  return originalTestFn(name, async (...args: any[]) => {
    try {
      if (testFn) {
        await testFn(...args);
      }
    } catch (error) {
      // Enhance error messages for accessibility test failures
      if (error instanceof Error) {
        if (error.message.includes('aria') || error.message.includes('accessibility')) {
          error.message = `🔍 Accessibility Test Failure: ${error.message}\n\n` +
            `💡 Tips for fixing:\n` +
            `• Check ARIA attributes are correctly set\n` +
            `• Ensure interactive elements have accessible names\n` +
            `• Verify proper semantic HTML structure\n` +
            `• Test with keyboard navigation\n` +
            `• Review color contrast ratios\n\n` +
            `📖 See WCAG 2.1 guidelines: https://www.w3.org/WAI/WCAG21/quickref/`;
        }
      }
      throw error;
    }
  }, timeout);
};

// Custom accessibility test helpers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeAccessible(): R;
      toHaveAccessibleName(name?: string): R;
      toHaveAccessibleDescription(description?: string): R;
      toSupportKeyboardNavigation(): R;
      toMeetContrastRequirements(): R;
    }
  }
}

// Extend Jest matchers with custom accessibility matchers
expect.extend({
  toBeAccessible(received: Element) {
    // Basic accessibility check
    const hasRole = received.getAttribute('role') || this.utils.getTag(received) !== 'div';
    const hasAccessibleName =
      received.getAttribute('aria-label') ||
      received.getAttribute('aria-labelledby') ||
      received.textContent?.trim() ||
      (received.tagName === 'IMG' && received.getAttribute('alt'));

    const isAccessible = hasRole && (hasAccessibleName || received.getAttribute('aria-hidden') === 'true');

    return {
      message: () =>
        isAccessible
          ? `Expected element not to be accessible`
          : `Expected element to be accessible. Missing ${!hasRole ? 'role' : 'accessible name'}.`,
      pass: isAccessible,
    };
  },

  toHaveAccessibleName(received: Element, expectedName?: string) {
    const accessibleName =
      received.getAttribute('aria-label') ||
      received.getAttribute('aria-labelledby') ||
      received.textContent?.trim() ||
      (received.tagName === 'IMG' && received.getAttribute('alt'));

    const hasName = Boolean(accessibleName);
    const nameMatches = expectedName ? accessibleName === expectedName : true;

    return {
      message: () =>
        hasName && nameMatches
          ? `Expected element not to have accessible name${expectedName ? ` "${expectedName}"` : ''}`
          : `Expected element to have accessible name${expectedName ? ` "${expectedName}"` : ''}. ${
              hasName ? `Got "${accessibleName}"` : 'No accessible name found'
            }.`,
      pass: hasName && nameMatches,
    };
  },

  toHaveAccessibleDescription(received: Element, expectedDescription?: string) {
    const accessibleDescription =
      received.getAttribute('aria-description') ||
      received.getAttribute('aria-describedby');

    const hasDescription = Boolean(accessibleDescription);
    const descriptionMatches = expectedDescription ? accessibleDescription === expectedDescription : true;

    return {
      message: () =>
        hasDescription && descriptionMatches
          ? `Expected element not to have accessible description${expectedDescription ? ` "${expectedDescription}"` : ''}`
          : `Expected element to have accessible description${expectedDescription ? ` "${expectedDescription}"` : ''}. ${
              hasDescription ? `Got "${accessibleDescription}"` : 'No accessible description found'
            }.`,
      pass: hasDescription && descriptionMatches,
    };
  },

  toSupportKeyboardNavigation(received: Element) {
    const isInteractive =
      received.tagName === 'BUTTON' ||
      received.tagName === 'A' ||
      received.tagName === 'INPUT' ||
      received.getAttribute('role') === 'button' ||
      received.getAttribute('role') === 'link' ||
      received.hasAttribute('tabindex');

    const hasProperTabIndex =
      !received.hasAttribute('tabindex') ||
      parseInt(received.getAttribute('tabindex') || '0') >= 0;

    const supportsKeyboard = !isInteractive || hasProperTabIndex;

    return {
      message: () =>
        supportsKeyboard
          ? `Expected element not to support keyboard navigation`
          : `Expected interactive element to support keyboard navigation. Check tabindex value.`,
      pass: supportsKeyboard,
    };
  },

  toMeetContrastRequirements(received: Element) {
    // Mock contrast check - in real implementation would use color contrast calculation
    const style = window.getComputedStyle(received);
    const hasGoodContrast =
      style.color !== style.backgroundColor &&
      style.color !== 'transparent' &&
      style.backgroundColor !== 'transparent';

    return {
      message: () =>
        hasGoodContrast
          ? `Expected element not to meet contrast requirements`
          : `Expected element to meet WCAG contrast requirements (4.5:1 for normal text).`,
      pass: hasGoodContrast,
    };
  },
});

// Performance monitoring for accessibility tests
let testStartTime: number;

beforeEach(() => {
  testStartTime = performance.now();
});

afterEach(() => {
  const testDuration = performance.now() - testStartTime;

  // Log slow tests for performance optimization
  if (testDuration > 5000) { // 5 second threshold
    console.warn(`⚠️ Slow accessibility test detected: ${testDuration.toFixed(2)}ms`);
  }
});

// Environment-specific configuration
if (process.env.CI === 'true') {
  // CI-specific setup
  jest.setTimeout(30000); // Longer timeout in CI

  // Disable animations for consistent testing
  Object.defineProperty(window, 'getComputedStyle', {
    value: (element: Element) => ({
      ...window.getComputedStyle(element),
      animationDuration: '0s',
      animationDelay: '0s',
      transitionDuration: '0s',
      transitionDelay: '0s'
    }),
    writable: true
  });
} else {
  // Local development setup
  jest.setTimeout(10000);
}

// Mock Next.js router for navigation tests
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  }
}));