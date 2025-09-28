/**
 * Jest Axe Setup for Accessibility Testing
 *
 * Configures jest-axe for automated accessibility testing with WCAG 2.1 AA rules.
 */

import { configureAxe } from 'jest-axe';

// Configure axe-core for WCAG 2.1 AA compliance testing
const axe = configureAxe({
  // Include WCAG 2.1 AA rules specifically
  rules: {
    // Perceivable - Guideline 1.1 Text Alternatives
    'image-alt': { enabled: true },
    'input-image-alt': { enabled: true },
    'area-alt': { enabled: true },
    'server-side-image-map': { enabled: true },

    // Perceivable - Guideline 1.2 Time-based Media
    'audio-caption': { enabled: true },
    'video-caption': { enabled: true },
    'video-description': { enabled: false }, // AAA level

    // Perceivable - Guideline 1.3 Adaptable
    'bypass': { enabled: true },
    'heading-order': { enabled: true },
    'landmark-one-main': { enabled: true },
    'landmark-complementary-is-top-level': { enabled: true },
    'landmark-contentinfo-is-top-level': { enabled: true },
    'landmark-main-is-top-level': { enabled: true },
    'landmark-no-duplicate-banner': { enabled: true },
    'landmark-no-duplicate-contentinfo': { enabled: true },
    'landmark-no-duplicate-main': { enabled: true },
    'page-has-heading-one': { enabled: true },
    'region': { enabled: true },
    'scope-attr-valid': { enabled: true },
    'table-duplicate-name': { enabled: true },
    'table-fake-caption': { enabled: true },
    'td-headers-attr': { enabled: true },
    'th-has-data-cells': { enabled: true },
    'valid-lang': { enabled: true },

    // Perceivable - Guideline 1.4 Distinguishable
    'color-contrast': { enabled: true },
    'color-contrast-enhanced': { enabled: false }, // AAA level
    'focus-order-semantics': { enabled: true },
    'link-in-text-block': { enabled: true },

    // Operable - Guideline 2.1 Keyboard Accessible
    'accesskeys': { enabled: true },
    'tabindex': { enabled: true },

    // Operable - Guideline 2.2 Enough Time
    'meta-refresh': { enabled: true },
    'meta-refresh-no-exceptions': { enabled: false }, // AAA level

    // Operable - Guideline 2.3 Seizures and Physical Reactions
    // No specific axe rules for this guideline

    // Operable - Guideline 2.4 Navigable
    'duplicate-id': { enabled: true },
    'duplicate-id-active': { enabled: true },
    'duplicate-id-aria': { enabled: true },
    'link-name': { enabled: true },
    'skip-link': { enabled: true },

    // Operable - Guideline 2.5 Input Modalities
    'target-size': { enabled: true },
    'label-title-only': { enabled: true },

    // Understandable - Guideline 3.1 Readable
    'html-has-lang': { enabled: true },
    'html-lang-valid': { enabled: true },
    'lang': { enabled: true },

    // Understandable - Guideline 3.2 Predictable
    'form-field-multiple-labels': { enabled: true },
    'identical-links-same-purpose': { enabled: true },

    // Understandable - Guideline 3.3 Input Assistance
    'aria-allowed-attr': { enabled: true },
    'aria-allowed-role': { enabled: true },
    'aria-dpub-role-fallback': { enabled: true },
    'aria-hidden-body': { enabled: true },
    'aria-hidden-focus': { enabled: true },
    'aria-input-field-name': { enabled: true },
    'aria-required-attr': { enabled: true },
    'aria-required-children': { enabled: true },
    'aria-required-parent': { enabled: true },
    'aria-roledescription': { enabled: true },
    'aria-roles': { enabled: true },
    'aria-toggle-field-name': { enabled: true },
    'aria-valid-attr': { enabled: true },
    'aria-valid-attr-value': { enabled: true },
    'button-name': { enabled: true },
    'form-field-multiple-labels': { enabled: true },
    'input-button-name': { enabled: true },
    'input-image-alt': { enabled: true },
    'label': { enabled: true },
    'select-name': { enabled: true },

    // Robust - Guideline 4.1 Compatible
    'blink': { enabled: true },
    'definition-list': { enabled: true },
    'dlitem': { enabled: true },
    'document-title': { enabled: true },
    'duplicate-id': { enabled: true },
    'frame-title': { enabled: true },
    'html-xml-lang-mismatch': { enabled: true },
    'list': { enabled: true },
    'listitem': { enabled: true },
    'marquee': { enabled: true },
    'meta-viewport': { enabled: true },
    'nested-interactive': { enabled: true },
    'no-autoplay-audio': { enabled: true },
    'object-alt': { enabled: true },
    'role-img-alt': { enabled: true },
    'scrollable-region-focusable': { enabled: true },
    'svg-img-alt': { enabled: true }
  },

  // Include only WCAG 2.1 AA tags
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],

  // Exclude experimental and best practice rules
  excludeTags: ['experimental', 'best-practice'],

  // Include all result types for comprehensive testing
  resultTypes: ['violations', 'incomplete', 'inapplicable', 'passes']
});

// Custom rule configurations for dashboard components
const dashboardRules = {
  // Custom rule for dashboard statistics
  'dashboard-stat-accessible-name': {
    id: 'dashboard-stat-accessible-name',
    impact: 'serious',
    tags: ['custom', 'wcag2a'],
    description: 'Dashboard statistics must have descriptive accessible names',
    help: 'Ensure each statistic has an aria-label that describes both the metric and its value',
    helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    evaluate: function(node: Element) {
      if (node.getAttribute('data-testid')?.includes('stat-card')) {
        const ariaLabel = node.getAttribute('aria-label');
        if (!ariaLabel) return false;

        // Check if aria-label is descriptive (contains metric name and value)
        const hasMetricName = /progress|exams|score|hours/i.test(ariaLabel);
        const hasValue = /\d+/.test(ariaLabel);
        const isDescriptive = ariaLabel.length > 15;

        return hasMetricName && hasValue && isDescriptive;
      }
      return true; // Not a stat card, passes by default
    }
  },

  // Custom rule for activity timeline
  'activity-timeline-temporal-info': {
    id: 'activity-timeline-temporal-info',
    impact: 'moderate',
    tags: ['custom', 'wcag2a'],
    description: 'Activity timeline items must include accessible temporal information',
    help: 'Ensure each activity includes date/time information accessible to screen readers',
    helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
    evaluate: function(node: Element) {
      if (node.getAttribute('role') === 'listitem' && node.textContent?.includes('activity')) {
        // Check for time element or date text
        const hasTimeElement = node.querySelector('time') !== null;
        const hasDateText = /\d{1,2}\s\w{3}\s\d{4}|\d{1,2}\/\d{1,2}\/\d{4}/.test(node.textContent || '');

        return hasTimeElement || hasDateText;
      }
      return true;
    }
  },

  // Custom rule for quick actions grouping
  'quick-actions-grouping': {
    id: 'quick-actions-grouping',
    impact: 'moderate',
    tags: ['custom', 'wcag2a'],
    description: 'Quick actions must be properly grouped with accessible labels',
    help: 'Ensure quick action buttons are grouped with role="group" and aria-label',
    helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
    evaluate: function(node: Element) {
      if (node.getAttribute('role') === 'group' && node.querySelector('button')) {
        const hasGroupLabel = node.getAttribute('aria-label') || node.getAttribute('aria-labelledby');
        return Boolean(hasGroupLabel);
      }
      return true;
    }
  }
};

// Register custom rules
Object.values(dashboardRules).forEach(rule => {
  if ((window as any).axe && (window as any).axe.configure) {
    try {
      (window as any).axe.configure({
        rules: [{
          id: rule.id,
          selector: '*',
          tags: rule.tags,
          metadata: {
            description: rule.description,
            help: rule.help,
            helpUrl: rule.helpUrl
          },
          evaluate: rule.evaluate
        }]
      });
    } catch (error) {
      console.warn(`Failed to register custom axe rule ${rule.id}:`, error);
    }
  }
});

// Environment-specific configuration
if (process.env.NODE_ENV === 'test') {
  // Test environment specific setup
  axe.configure({
    // Disable rules that are difficult to test in jsdom
    rules: {
      'color-contrast': { enabled: false }, // jsdom doesn't render colors
      'focus-order-semantics': { enabled: false }, // jsdom focus behavior differs
      'scrollable-region-focusable': { enabled: false } // jsdom scrolling limitations
    }
  });
}

if (process.env.CI === 'true') {
  // CI environment specific setup
  axe.configure({
    // Use more lenient rules in CI due to environment differences
    rules: {
      'meta-viewport': { enabled: false }, // Not relevant for component tests
      'page-has-heading-one': { enabled: false }, // Component tests don't have full pages
      'landmark-one-main': { enabled: false }, // Component tests don't have full page structure
      'region': { enabled: false } // May not be relevant for isolated components
    }
  });
}

// Export configured axe for use in tests
export default axe;

// Export helper functions for common accessibility testing patterns
export const axeHelpers = {
  /**
   * Test a component for WCAG 2.1 AA compliance
   */
  async testWcagCompliance(container: Element) {
    const results = await axe(container, {
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
    });

    if (results.violations.length > 0) {
      console.error('WCAG 2.1 AA Violations:', results.violations);
    }

    return results;
  },

  /**
   * Test specific accessibility concerns for dashboard components
   */
  async testDashboardAccessibility(container: Element) {
    const results = await axe(container, {
      rules: {
        // Focus on dashboard-specific accessibility issues
        'button-name': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'aria-required-attr': { enabled: true },
        'color-contrast': { enabled: true },
        'duplicate-id': { enabled: true },
        'form-field-multiple-labels': { enabled: true },
        'link-name': { enabled: true },
        'list': { enabled: true },
        'listitem': { enabled: true }
      }
    });

    return results;
  },

  /**
   * Test keyboard accessibility specifically
   */
  async testKeyboardAccessibility(container: Element) {
    const results = await axe(container, {
      rules: {
        'accesskeys': { enabled: true },
        'tabindex': { enabled: true },
        'bypass': { enabled: true },
        'focus-order-semantics': { enabled: true }
      }
    });

    return results;
  },

  /**
   * Test screen reader accessibility
   */
  async testScreenReaderAccessibility(container: Element) {
    const results = await axe(container, {
      rules: {
        'aria-allowed-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'button-name': { enabled: true },
        'image-alt': { enabled: true },
        'input-image-alt': { enabled: true },
        'label': { enabled: true },
        'link-name': { enabled: true }
      }
    });

    return results;
  }
};