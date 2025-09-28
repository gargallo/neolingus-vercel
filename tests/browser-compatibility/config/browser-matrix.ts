/**
 * Browser Test Matrix Configuration
 * Defines browser compatibility testing matrix for dashboard components
 */

export interface BrowserConfig {
  name: string;
  displayName: string;
  channel?: string;
  version?: string;
  viewport?: {
    width: number;
    height: number;
  };
  userAgent?: string;
  features: {
    css_grid: boolean;
    flexbox: boolean;
    custom_properties: boolean;
    es6_modules: boolean;
    intersection_observer: boolean;
    framer_motion: boolean;
    touch_events: boolean;
  };
  known_issues: string[];
  performance_baseline: {
    first_contentful_paint: number; // ms
    largest_contentful_paint: number; // ms
    cumulative_layout_shift: number;
    first_input_delay: number; // ms
    time_to_interactive: number; // ms
  };
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  component: string;
  url: string;
  interactions: string[];
  assertions: string[];
  mobile_specific?: boolean;
  desktop_specific?: boolean;
}

export const BROWSER_MATRIX: BrowserConfig[] = [
  // Desktop Browsers
  {
    name: 'chromium',
    displayName: 'Chrome Latest',
    viewport: { width: 1920, height: 1080 },
    features: {
      css_grid: true,
      flexbox: true,
      custom_properties: true,
      es6_modules: true,
      intersection_observer: true,
      framer_motion: true,
      touch_events: false,
    },
    known_issues: [],
    performance_baseline: {
      first_contentful_paint: 800,
      largest_contentful_paint: 1200,
      cumulative_layout_shift: 0.1,
      first_input_delay: 50,
      time_to_interactive: 1500,
    },
  },
  {
    name: 'chromium',
    displayName: 'Chrome Previous',
    channel: 'chrome-beta',
    viewport: { width: 1920, height: 1080 },
    features: {
      css_grid: true,
      flexbox: true,
      custom_properties: true,
      es6_modules: true,
      intersection_observer: true,
      framer_motion: true,
      touch_events: false,
    },
    known_issues: [],
    performance_baseline: {
      first_contentful_paint: 850,
      largest_contentful_paint: 1300,
      cumulative_layout_shift: 0.1,
      first_input_delay: 60,
      time_to_interactive: 1600,
    },
  },
  {
    name: 'firefox',
    displayName: 'Firefox Latest',
    viewport: { width: 1920, height: 1080 },
    features: {
      css_grid: true,
      flexbox: true,
      custom_properties: true,
      es6_modules: true,
      intersection_observer: true,
      framer_motion: true,
      touch_events: false,
    },
    known_issues: [
      'CSS backdrop-filter may have performance issues',
      'Framer Motion spring animations may be less smooth',
    ],
    performance_baseline: {
      first_contentful_paint: 900,
      largest_contentful_paint: 1400,
      cumulative_layout_shift: 0.1,
      first_input_delay: 70,
      time_to_interactive: 1700,
    },
  },
  {
    name: 'webkit',
    displayName: 'Safari Latest',
    viewport: { width: 1920, height: 1080 },
    features: {
      css_grid: true,
      flexbox: true,
      custom_properties: true,
      es6_modules: true,
      intersection_observer: true,
      framer_motion: true,
      touch_events: false,
    },
    known_issues: [
      'CSS custom properties in media queries',
      'Flexbox gap property older versions',
      'Date input styling limitations',
    ],
    performance_baseline: {
      first_contentful_paint: 850,
      largest_contentful_paint: 1300,
      cumulative_layout_shift: 0.1,
      first_input_delay: 80,
      time_to_interactive: 1600,
    },
  },
  {
    name: 'msedge',
    displayName: 'Edge Latest',
    viewport: { width: 1920, height: 1080 },
    features: {
      css_grid: true,
      flexbox: true,
      custom_properties: true,
      es6_modules: true,
      intersection_observer: true,
      framer_motion: true,
      touch_events: false,
    },
    known_issues: [],
    performance_baseline: {
      first_contentful_paint: 820,
      largest_contentful_paint: 1250,
      cumulative_layout_shift: 0.1,
      first_input_delay: 55,
      time_to_interactive: 1550,
    },
  },

  // Mobile Browsers
  {
    name: 'chromium',
    displayName: 'Mobile Chrome',
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    features: {
      css_grid: true,
      flexbox: true,
      custom_properties: true,
      es6_modules: true,
      intersection_observer: true,
      framer_motion: true,
      touch_events: true,
    },
    known_issues: [
      'Viewport height issues with virtual keyboard',
      'Touch event conflicts with mouse events',
    ],
    performance_baseline: {
      first_contentful_paint: 1200,
      largest_contentful_paint: 2000,
      cumulative_layout_shift: 0.15,
      first_input_delay: 100,
      time_to_interactive: 2500,
    },
  },
  {
    name: 'webkit',
    displayName: 'Mobile Safari',
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    features: {
      css_grid: true,
      flexbox: true,
      custom_properties: true,
      es6_modules: true,
      intersection_observer: true,
      framer_motion: true,
      touch_events: true,
    },
    known_issues: [
      'iOS Safari viewport unit bugs',
      'Back/forward cache issues',
      'Touch delay on clickable elements',
    ],
    performance_baseline: {
      first_contentful_paint: 1100,
      largest_contentful_paint: 1900,
      cumulative_layout_shift: 0.15,
      first_input_delay: 120,
      time_to_interactive: 2400,
    },
  },

  // Tablet Browsers
  {
    name: 'chromium',
    displayName: 'Tablet Chrome',
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    features: {
      css_grid: true,
      flexbox: true,
      custom_properties: true,
      es6_modules: true,
      intersection_observer: true,
      framer_motion: true,
      touch_events: true,
    },
    known_issues: [],
    performance_baseline: {
      first_contentful_paint: 1000,
      largest_contentful_paint: 1600,
      cumulative_layout_shift: 0.12,
      first_input_delay: 80,
      time_to_interactive: 2000,
    },
  },
  {
    name: 'webkit',
    displayName: 'iPad Safari',
    viewport: { width: 768, height: 1024 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    features: {
      css_grid: true,
      flexbox: true,
      custom_properties: true,
      es6_modules: true,
      intersection_observer: true,
      framer_motion: true,
      touch_events: true,
    },
    known_issues: [
      'iPad Safari specific viewport behaviors',
      'Hardware keyboard vs on-screen keyboard detection',
    ],
    performance_baseline: {
      first_contentful_paint: 950,
      largest_contentful_paint: 1500,
      cumulative_layout_shift: 0.12,
      first_input_delay: 90,
      time_to_interactive: 1900,
    },
  },
];

export const DASHBOARD_TEST_SCENARIOS: TestScenario[] = [
  // Layout and Responsive Design Tests
  {
    id: 'dashboard-layout-desktop',
    name: 'Desktop Dashboard Layout',
    description: 'Verify dashboard grid layout renders correctly on desktop',
    component: 'ModernDashboard',
    url: '/dashboard',
    interactions: ['load', 'scroll', 'resize-window'],
    assertions: [
      'grid-layout-rendered',
      'all-widgets-visible',
      'no-layout-shifts',
      'proper-spacing',
    ],
    desktop_specific: true,
  },
  {
    id: 'dashboard-layout-mobile',
    name: 'Mobile Dashboard Layout',
    description: 'Verify dashboard adapts to mobile viewport',
    component: 'ModernDashboard',
    url: '/dashboard',
    interactions: ['load', 'scroll', 'touch-swipe'],
    assertions: [
      'single-column-layout',
      'touch-targets-size',
      'no-horizontal-scroll',
      'mobile-optimized-spacing',
    ],
    mobile_specific: true,
  },
  {
    id: 'stats-cards-responsive',
    name: 'Statistics Cards Responsive',
    description: 'Verify stats cards adapt across breakpoints',
    component: 'StatsCards',
    url: '/dashboard',
    interactions: ['load', 'resize-window'],
    assertions: [
      'cards-reflow',
      'typography-scales',
      'proper-aspect-ratios',
    ],
  },

  // Interactive Elements Tests
  {
    id: 'widget-interactions',
    name: 'Widget Interactions',
    description: 'Test widget hover states and interactions',
    component: 'WidgetComponents',
    url: '/dashboard',
    interactions: ['hover', 'click', 'keyboard-navigation'],
    assertions: [
      'hover-states-work',
      'click-handlers-work',
      'keyboard-accessible',
      'focus-indicators',
    ],
  },
  {
    id: 'layout-switcher',
    name: 'Layout Switcher',
    description: 'Test layout switching functionality',
    component: 'LayoutSwitcher',
    url: '/dashboard',
    interactions: ['click-compact', 'click-comfortable', 'click-spacious'],
    assertions: [
      'layout-changes',
      'preferences-saved',
      'smooth-transitions',
    ],
  },
  {
    id: 'refresh-button',
    name: 'Refresh Button',
    description: 'Test dashboard refresh functionality',
    component: 'RefreshButton',
    url: '/dashboard',
    interactions: ['click-refresh', 'wait-for-data'],
    assertions: [
      'loading-animation',
      'data-updates',
      'toast-notification',
    ],
  },

  // Animation and Transition Tests
  {
    id: 'framer-motion-animations',
    name: 'Framer Motion Animations',
    description: 'Verify Framer Motion animations work across browsers',
    component: 'AnimatedComponents',
    url: '/dashboard',
    interactions: ['load', 'trigger-animations'],
    assertions: [
      'animations-play',
      'smooth-performance',
      'no-animation-glitches',
    ],
  },
  {
    id: 'css-transitions',
    name: 'CSS Transitions',
    description: 'Test CSS transitions and hover effects',
    component: 'InteractiveElements',
    url: '/dashboard',
    interactions: ['hover', 'focus', 'state-changes'],
    assertions: [
      'transitions-smooth',
      'no-transition-flicker',
      'proper-timing',
    ],
  },
  {
    id: 'reduced-motion-support',
    name: 'Reduced Motion Support',
    description: 'Verify reduced motion preferences are respected',
    component: 'AllAnimations',
    url: '/dashboard',
    interactions: ['enable-reduced-motion', 'load'],
    assertions: [
      'animations-disabled',
      'instant-transitions',
      'functionality-preserved',
    ],
  },

  // Touch and Mobile Interaction Tests
  {
    id: 'touch-interactions',
    name: 'Touch Interactions',
    description: 'Test touch gestures and mobile interactions',
    component: 'TouchElements',
    url: '/dashboard',
    interactions: ['tap', 'swipe', 'pinch-zoom', 'long-press'],
    assertions: [
      'touch-targets-accessible',
      'gestures-work',
      'no-touch-delays',
    ],
    mobile_specific: true,
  },
  {
    id: 'virtual-keyboard',
    name: 'Virtual Keyboard Handling',
    description: 'Test behavior with virtual keyboard',
    component: 'FormElements',
    url: '/dashboard',
    interactions: ['focus-input', 'type-text'],
    assertions: [
      'viewport-adjusts',
      'elements-remain-visible',
      'proper-scrolling',
    ],
    mobile_specific: true,
  },

  // Performance Tests
  {
    id: 'initial-load-performance',
    name: 'Initial Load Performance',
    description: 'Measure dashboard initial load performance',
    component: 'FullDashboard',
    url: '/dashboard',
    interactions: ['cold-load'],
    assertions: [
      'fcp-within-budget',
      'lcp-within-budget',
      'cls-minimal',
      'fid-responsive',
    ],
  },
  {
    id: 'interaction-performance',
    name: 'Interaction Performance',
    description: 'Measure performance during interactions',
    component: 'InteractiveElements',
    url: '/dashboard',
    interactions: ['rapid-clicks', 'scroll', 'resize'],
    assertions: [
      'smooth-60fps',
      'low-input-delay',
      'efficient-repaints',
    ],
  },

  // Accessibility Tests
  {
    id: 'keyboard-navigation',
    name: 'Keyboard Navigation',
    description: 'Test complete keyboard accessibility',
    component: 'FullDashboard',
    url: '/dashboard',
    interactions: ['tab-navigation', 'arrow-keys', 'enter-space'],
    assertions: [
      'all-elements-reachable',
      'focus-visible',
      'logical-tab-order',
      'skip-links-work',
    ],
  },
  {
    id: 'screen-reader-support',
    name: 'Screen Reader Support',
    description: 'Verify screen reader compatibility',
    component: 'FullDashboard',
    url: '/dashboard',
    interactions: ['screen-reader-navigation'],
    assertions: [
      'proper-aria-labels',
      'semantic-markup',
      'live-regions-work',
    ],
  },
  {
    id: 'high-contrast-mode',
    name: 'High Contrast Mode',
    description: 'Test high contrast and accessibility preferences',
    component: 'FullDashboard',
    url: '/dashboard',
    interactions: ['enable-high-contrast'],
    assertions: [
      'sufficient-contrast',
      'borders-visible',
      'focus-indicators-clear',
    ],
  },
];

export const COMPATIBILITY_THRESHOLDS = {
  performance: {
    first_contentful_paint: 1500, // ms
    largest_contentful_paint: 2500, // ms
    cumulative_layout_shift: 0.2,
    first_input_delay: 100, // ms
    time_to_interactive: 3000, // ms
  },
  visual: {
    pixel_difference_threshold: 0.02, // 2%
    layout_shift_threshold: 0.1,
  },
  functionality: {
    interaction_success_rate: 95, // %
    feature_compatibility_rate: 90, // %
  },
};

export function getBrowsersForScenario(scenario: TestScenario): BrowserConfig[] {
  if (scenario.mobile_specific) {
    return BROWSER_MATRIX.filter(browser =>
      browser.features.touch_events && browser.viewport.width <= 768
    );
  }

  if (scenario.desktop_specific) {
    return BROWSER_MATRIX.filter(browser =>
      !browser.features.touch_events && browser.viewport.width >= 1024
    );
  }

  return BROWSER_MATRIX;
}

export function getPerformanceThreshold(browserName: string, metric: string): number {
  const browser = BROWSER_MATRIX.find(b => b.name === browserName);
  if (!browser || !browser.performance_baseline[metric as keyof typeof browser.performance_baseline]) {
    return COMPATIBILITY_THRESHOLDS.performance[metric as keyof typeof COMPATIBILITY_THRESHOLDS.performance];
  }

  return browser.performance_baseline[metric as keyof typeof browser.performance_baseline];
}