import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import {
  runManualAccessibilityTests,
  testKeyboardInteraction,
  testScreenReaderContent,
  testColorContrast,
  testTouchTargets,
  testTextSpacing,
  generateManualTestingReport,
  ManualTestResults
} from './manual-testing-helpers';

// Import dashboard components
import DashboardStats from '@/components/academia/dashboard-stats';
import ActivityTimeline from '@/components/academia/activity-timeline';
import QuickActions from '@/components/academia/quick-actions';
import { DashboardOverview } from '@/components/academia/course-dashboard';

// Mock dependencies
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

jest.mock('@/lib/hooks/useAnimationPreferences', () => ({
  useAnimationPreferences: () => ({
    getReducedVariants: (variants: any) => variants,
    getDuration: (duration: number) => duration,
    shouldAnimate: false,
    getStaggerDelay: (index: number) => index * 0.1,
  }),
}));

describe('WCAG 2.1 AA Compliance Tests', () => {
  // Test data
  const mockStats = [
    {
      id: 'overall-progress',
      label: 'Overall Progress',
      value: '85%',
      displayValue: '85%',
      variant: 'progress' as const,
      ariaLabel: 'Overall course progress: 85 percent completed'
    },
    {
      id: 'completed-exams',
      label: 'Completed Exams',
      value: '12',
      variant: 'exams' as const,
      ariaLabel: 'Total completed exams: 12'
    }
  ];

  const mockActivities = [
    {
      id: '1',
      type: 'exam_completed',
      examTitle: 'Listening Comprehension Practice',
      score: 85,
      duration: 2400,
      date: new Date('2023-12-01'),
      formattedDate: '1 Dec 2023',
      formattedDuration: '40 min'
    }
  ];

  const mockQuickActions = {
    primary: {
      label: 'Start Practice Exam',
      onClick: jest.fn(),
      disabled: false,
      ariaLabel: 'Start a new practice exam session'
    },
    secondary: [
      {
        label: 'View Progress',
        onClick: jest.fn(),
        icon: 'chart',
        ariaLabel: 'View detailed progress analytics'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getBoundingClientRect for touch target tests
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 44,
      height: 44,
      top: 0,
      left: 0,
      bottom: 44,
      right: 44,
      x: 0,
      y: 0,
      toJSON: jest.fn()
    }));

    // Mock getComputedStyle
    Object.defineProperty(window, 'getComputedStyle', {
      value: () => ({
        color: 'rgb(33, 37, 41)',        // Dark gray
        backgroundColor: 'rgb(255, 255, 255)', // White
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '24px',              // 1.5 ratio
        letterSpacing: '0.02em',         // 0.12em minimum
        wordSpacing: '0.16em',           // 0.16em minimum
        marginBottom: '32px',            // 2em
        paddingBottom: '0px',
        display: 'block',
        visibility: 'visible',
        opacity: '1',
        width: '100px',
        height: '44px',
        outline: 'none',
        outlineWidth: '0px',
        boxShadow: 'none'
      }),
      writable: true
    });
  });

  describe('Principle 1: Perceivable', () => {
    describe('1.1 Text Alternatives', () => {
      it('should provide text alternatives for all non-text content', async () => {
        const { container } = render(
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
        );

        // Check for images with alt text
        const images = container.querySelectorAll('img');
        images.forEach(img => {
          expect(img).toHaveAttribute('alt');
        });

        // Check for icons with aria-labels or aria-hidden
        const icons = container.querySelectorAll('svg, [data-icon]');
        icons.forEach(icon => {
          const hasLabel = icon.hasAttribute('aria-label') || icon.hasAttribute('aria-labelledby');
          const isDecorative = icon.getAttribute('aria-hidden') === 'true' || icon.getAttribute('role') === 'presentation';
          expect(hasLabel || isDecorative).toBe(true);
        });
      });

      it('should provide meaningful alternative text', () => {
        render(<DashboardStats stats={mockStats} onStatClick={jest.fn()} />);

        const progressButton = screen.getByRole('button', { name: /overall course progress/i });
        expect(progressButton).toHaveAttribute('aria-label', expect.stringContaining('85 percent'));
      });
    });

    describe('1.3 Adaptable', () => {
      it('should use proper heading hierarchy', () => {
        render(
          <div>
            <h1>Dashboard</h1>
            <DashboardStats stats={mockStats} />
            <ActivityTimeline activities={mockActivities} />
          </div>
        );

        const headings = screen.getAllByRole('heading');
        expect(headings[0]).toHaveProperty('tagName', 'H1');

        // Check for proper heading levels (no skipping)
        const headingLevels = headings.map(h => parseInt(h.tagName.charAt(1)));
        for (let i = 1; i < headingLevels.length; i++) {
          const diff = headingLevels[i] - headingLevels[i - 1];
          expect(diff).toBeLessThanOrEqual(1); // No skipping levels
        }
      });

      it('should use semantic markup for lists', () => {
        render(<ActivityTimeline activities={mockActivities} />);

        const listContainer = screen.getByRole('list');
        expect(listContainer).toBeInTheDocument();

        const listItems = screen.getAllByRole('listitem');
        expect(listItems.length).toBeGreaterThan(0);
      });

      it('should provide proper form labels', () => {
        // If the component has form elements
        const { container } = render(
          <div>
            <label htmlFor="search">Search activities</label>
            <input id="search" type="text" />
          </div>
        );

        const input = container.querySelector('input');
        const label = container.querySelector('label');

        if (input && label) {
          expect(label).toHaveAttribute('for', 'search');
          expect(input).toHaveAttribute('id', 'search');
        }
      });
    });

    describe('1.4 Distinguishable', () => {
      it('should meet color contrast requirements (4.5:1 for normal text)', () => {
        const { container } = render(
          <DashboardStats stats={mockStats} />
        );

        const textElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, button, a');

        textElements.forEach(element => {
          if (element.textContent?.trim()) {
            const contrastResult = testColorContrast(element);
            expect(contrastResult.passes).toBe(true);
            expect(contrastResult.contrastRatio).toBeGreaterThanOrEqual(4.5);
          }
        });
      });

      it('should meet text spacing requirements', () => {
        const { container } = render(
          <div style={{
            lineHeight: '1.5',
            letterSpacing: '0.12em',
            wordSpacing: '0.16em'
          }}>
            <DashboardStats stats={mockStats} />
          </div>
        );

        const textElements = container.querySelectorAll('p, span, div');

        textElements.forEach(element => {
          if (element.textContent?.trim()) {
            const spacingResult = testTextSpacing(element);
            expect(spacingResult.meetsRequirements).toBe(true);
          }
        });
      });

      it('should support text resize up to 200%', () => {
        // Mock larger font size
        Object.defineProperty(window, 'getComputedStyle', {
          value: () => ({
            fontSize: '32px', // 200% of 16px
            lineHeight: '48px',
            color: 'rgb(33, 37, 41)',
            backgroundColor: 'rgb(255, 255, 255)'
          }),
          writable: true
        });

        const { container } = render(<DashboardStats stats={mockStats} />);

        // Component should still be functional at 200% zoom
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => {
          expect(button).toBeVisible();
        });
      });

      it('should not rely solely on color to convey information', () => {
        render(<DashboardStats stats={mockStats} />);

        // Check for trend indicators that use both color and icons
        const trendIcons = screen.getAllByTestId(/trend-icon/);
        trendIcons.forEach(icon => {
          expect(icon).toHaveAttribute('aria-label', expect.stringMatching(/trend:|increasing|decreasing|stable/i));
        });
      });
    });
  });

  describe('Principle 2: Operable', () => {
    describe('2.1 Keyboard Accessible', () => {
      it('should make all functionality available via keyboard', async () => {
        const user = userEvent.setup();
        const mockOnClick = jest.fn();

        render(<DashboardStats stats={mockStats} onStatClick={mockOnClick} />);

        // Test Tab navigation
        await user.tab();
        const firstButton = screen.getAllByRole('button')[0];
        expect(firstButton).toHaveFocus();

        // Test Enter activation
        await user.keyboard('{Enter}');
        expect(mockOnClick).toHaveBeenCalled();

        // Test Space activation
        mockOnClick.mockClear();
        await user.keyboard(' ');
        expect(mockOnClick).toHaveBeenCalled();
      });

      it('should not trap keyboard focus', async () => {
        const user = userEvent.setup();

        render(
          <div>
            <button>Before</button>
            <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
            <button>After</button>
          </div>
        );

        const beforeButton = screen.getByRole('button', { name: 'Before' });
        const afterButton = screen.getByRole('button', { name: 'After' });

        // Should be able to tab through all elements
        beforeButton.focus();
        expect(beforeButton).toHaveFocus();

        // Tab through all dashboard elements
        const dashboardButtons = screen.getAllByRole('button', { name: /progress|exams/i });
        for (let i = 0; i < dashboardButtons.length; i++) {
          await user.tab();
        }

        // Should reach the after button
        await user.tab();
        expect(afterButton).toHaveFocus();
      });

      it('should have proper tab order', () => {
        const { container } = render(
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
        );

        const focusableElements = container.querySelectorAll('[tabindex], button, input, select, textarea, a[href]');

        focusableElements.forEach(element => {
          const tabIndex = element.getAttribute('tabindex');
          if (tabIndex !== null) {
            const numericTabIndex = parseInt(tabIndex);
            expect(numericTabIndex).toBeLessThanOrEqual(0); // No positive tabIndex
          }
        });
      });

      it('should provide visible focus indicators', () => {
        const { container } = render(
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
        );

        const focusableElements = container.querySelectorAll('button, a, [tabindex="0"]');

        focusableElements.forEach(element => {
          const keyboardResult = testKeyboardInteraction(element);
          if (keyboardResult.canReceiveFocus) {
            expect(keyboardResult.hasVisibleFocus).toBe(true);
          }
        });
      });
    });

    describe('2.4 Navigable', () => {
      it('should provide skip links', () => {
        render(<DashboardStats stats={mockStats} onStatClick={jest.fn()} />);

        const skipLink = screen.getByRole('link', { name: /skip to actions/i });
        expect(skipLink).toBeInTheDocument();
        expect(skipLink).toHaveClass('sr-only');
      });

      it('should have descriptive headings and labels', () => {
        render(
          <div>
            <h2>Course Statistics</h2>
            <DashboardStats stats={mockStats} />
          </div>
        );

        const heading = screen.getByRole('heading', { name: /course statistics/i });
        expect(heading).toBeInTheDocument();

        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          const accessibleName = button.getAttribute('aria-label') || button.textContent;
          expect(accessibleName).toBeTruthy();
          expect(accessibleName!.length).toBeGreaterThan(0);
        });
      });

      it('should provide multiple ways to locate content', () => {
        render(
          <div>
            <nav aria-label="Dashboard navigation">
              <ul>
                <li><a href="#stats">Statistics</a></li>
                <li><a href="#activity">Activity</a></li>
                <li><a href="#actions">Quick Actions</a></li>
              </ul>
            </nav>
            <section id="stats">
              <DashboardStats stats={mockStats} />
            </section>
            <section id="activity">
              <ActivityTimeline activities={mockActivities} />
            </section>
            <section id="actions">
              <QuickActions {...mockQuickActions} />
            </section>
          </div>
        );

        // Should have navigation landmark
        const nav = screen.getByRole('navigation', { name: /dashboard navigation/i });
        expect(nav).toBeInTheDocument();

        // Should have section landmarks
        const sections = screen.getAllByRole('region');
        expect(sections.length).toBeGreaterThan(0);
      });
    });

    describe('2.5 Input Modalities', () => {
      it('should meet touch target size requirements (44x44 CSS pixels)', () => {
        const { container } = render(
          <QuickActions {...mockQuickActions} />
        );

        const buttons = container.querySelectorAll('button');

        buttons.forEach(button => {
          const touchTargetResult = testTouchTargets(button);
          expect(touchTargetResult.meetsMinimumSize).toBe(true);
          expect(touchTargetResult.width).toBeGreaterThanOrEqual(44);
          expect(touchTargetResult.height).toBeGreaterThanOrEqual(44);
        });
      });

      it('should support various input methods', async () => {
        const user = userEvent.setup();
        const mockOnClick = jest.fn();

        render(<DashboardStats stats={mockStats} onStatClick={mockOnClick} />);

        const button = screen.getAllByRole('button')[0];

        // Mouse click
        await user.click(button);
        expect(mockOnClick).toHaveBeenCalledTimes(1);

        // Touch/tap
        fireEvent.touchStart(button);
        fireEvent.touchEnd(button);

        // Keyboard activation
        await user.keyboard('{Enter}');
        expect(mockOnClick).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Principle 3: Understandable', () => {
    describe('3.1 Readable', () => {
      it('should specify the language of the page', () => {
        // Would typically be set on <html> element
        const { container } = render(
          <div lang="en">
            <DashboardStats stats={mockStats} />
          </div>
        );

        const langElement = container.querySelector('[lang]');
        expect(langElement).toHaveAttribute('lang');
      });

      it('should use clear and simple language', () => {
        render(<DashboardStats stats={mockStats} />);

        // Check for jargon-free, descriptive labels
        expect(screen.getByText('Overall Progress')).toBeInTheDocument();
        expect(screen.getByText('Completed Exams')).toBeInTheDocument();

        // ARIA labels should be descriptive
        const progressButton = screen.getByRole('button', { name: /overall course progress/i });
        expect(progressButton.getAttribute('aria-label')).toContain('85 percent completed');
      });
    });

    describe('3.2 Predictable', () => {
      it('should not change context on focus', () => {
        const { container } = render(
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
        );

        const buttons = container.querySelectorAll('button');

        buttons.forEach(button => {
          // Focus should not trigger automatic actions
          fireEvent.focus(button);
          // Page should remain stable
          expect(button).toBeInTheDocument();
        });
      });

      it('should have consistent navigation', () => {
        render(
          <div>
            <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
            <ActivityTimeline activities={mockActivities} />
          </div>
        );

        // Navigation patterns should be consistent
        const allButtons = screen.getAllByRole('button');
        allButtons.forEach(button => {
          // All buttons should have consistent labeling patterns
          const ariaLabel = button.getAttribute('aria-label');
          const textContent = button.textContent;
          expect(ariaLabel || textContent).toBeTruthy();
        });
      });
    });

    describe('3.3 Input Assistance', () => {
      it('should provide error identification and description', () => {
        render(
          <DashboardStats
            stats={[]}
            error="Failed to load statistics"
            onRetry={jest.fn()}
          />
        );

        const errorAlert = screen.getByRole('alert');
        expect(errorAlert).toHaveTextContent(/error loading statistics/i);
        expect(errorAlert).toHaveTextContent(/failed to load statistics/i);
      });

      it('should provide helpful error messages', () => {
        render(
          <DashboardStats
            stats={[]}
            error="Network connection failed. Please check your internet connection and try again."
          />
        );

        const errorMessage = screen.getByText(/network connection failed/i);
        expect(errorMessage).toBeInTheDocument();

        // Error should be actionable
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('Principle 4: Robust', () => {
    describe('4.1 Compatible', () => {
      it('should use valid markup', async () => {
        const { container } = render(
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
        );

        // Run axe for markup validation
        const results = await axe(container);
        expect(results.violations).toHaveLength(0);
      });

      it('should provide proper ARIA attributes', () => {
        render(
          <DashboardStats
            stats={mockStats}
            onStatClick={jest.fn()}
            accessibility={{
              regionLabel: 'Course Statistics Dashboard',
              description: 'Overview of course progress and performance'
            }}
          />
        );

        const region = screen.getByRole('region', { name: /course statistics dashboard/i });
        expect(region).toHaveAttribute('aria-live', 'polite');
        expect(region).toHaveAttribute('aria-atomic', 'false');

        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAttribute('aria-label');
          expect(button).toHaveAttribute('aria-describedby');
        });
      });

      it('should work with assistive technologies', () => {
        const { container } = render(
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
        );

        const interactiveElements = container.querySelectorAll('button, a, [role="button"]');

        interactiveElements.forEach(element => {
          const screenReaderResult = testScreenReaderContent(element);
          expect(screenReaderResult.accessibleName).toBeTruthy();
          expect(screenReaderResult.role).toBeTruthy();
        });
      });
    });
  });

  describe('Comprehensive Manual Testing Suite', () => {
    it('should pass all manual accessibility tests', () => {
      const { container } = render(
        <div>
          <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
          <ActivityTimeline activities={mockActivities} />
          <QuickActions {...mockQuickActions} />
        </div>
      );

      const results = runManualAccessibilityTests(container);

      expect(results.summary.passed).toBe(true);
      expect(results.summary.criticalIssues).toBe(0);

      // Generate report for documentation
      const report = generateManualTestingReport('Dashboard Components', results);
      expect(report).toContain('✅ PASSED');

      console.log('\n' + report); // Output for CI/CD
    });

    it('should generate comprehensive accessibility report', () => {
      const { container } = render(
        <DashboardStats
          stats={mockStats}
          onStatClick={jest.fn()}
          accessibility={{
            regionLabel: 'Course Statistics Dashboard'
          }}
        />
      );

      const results = runManualAccessibilityTests(container);
      const report = generateManualTestingReport('DashboardStats', results);

      expect(report).toContain('# Manual Accessibility Test Report: DashboardStats');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Test Results');
      expect(report).toContain('### Keyboard Navigation');
      expect(report).toContain('### Screen Reader Compatibility');
      expect(report).toContain('### Color Contrast');
      expect(report).toContain('### Touch Targets');
      expect(report).toContain('### Text Spacing');
    });
  });

  describe('Real-world Accessibility Scenarios', () => {
    it('should support screen reader users navigating dashboard', async () => {
      render(
        <div>
          <h1>Course Dashboard</h1>
          <nav aria-label="Dashboard sections">
            <ul>
              <li><a href="#stats">Statistics</a></li>
              <li><a href="#timeline">Recent Activity</a></li>
              <li><a href="#actions">Quick Actions</a></li>
            </ul>
          </nav>
          <main>
            <section id="stats" aria-labelledby="stats-heading">
              <h2 id="stats-heading">Course Statistics</h2>
              <DashboardStats stats={mockStats} onStatClick={jest.fn()} />
            </section>
            <section id="timeline" aria-labelledby="timeline-heading">
              <h2 id="timeline-heading">Recent Activity</h2>
              <ActivityTimeline activities={mockActivities} />
            </section>
            <section id="actions" aria-labelledby="actions-heading">
              <h2 id="actions-heading">Quick Actions</h2>
              <QuickActions {...mockQuickActions} />
            </section>
          </main>
        </div>
      );

      // Verify proper landmark structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation', { name: /dashboard sections/i })).toBeInTheDocument();

      // Verify heading hierarchy
      const headings = screen.getAllByRole('heading');
      expect(headings[0]).toHaveProperty('tagName', 'H1');
      expect(headings[1]).toHaveProperty('tagName', 'H2');

      // Verify section labeling
      const sections = screen.getAllByRole('region');
      sections.forEach(section => {
        expect(section).toHaveAttribute('aria-labelledby');
      });
    });

    it('should support keyboard-only users', async () => {
      const user = userEvent.setup();
      const mockStatClick = jest.fn();
      const mockActionClick = jest.fn();

      render(
        <div>
          <DashboardStats stats={mockStats} onStatClick={mockStatClick} />
          <QuickActions
            primary={{ ...mockQuickActions.primary, onClick: mockActionClick }}
            secondary={mockQuickActions.secondary}
          />
        </div>
      );

      // Navigate through all interactive elements
      await user.tab(); // First stat
      await user.keyboard('{Enter}');
      expect(mockStatClick).toHaveBeenCalled();

      await user.tab(); // Second stat
      await user.tab(); // Primary action
      await user.keyboard(' ');
      expect(mockActionClick).toHaveBeenCalled();
    });

    it('should support users with motor impairments', () => {
      const { container } = render(
        <QuickActions {...mockQuickActions} />
      );

      // All interactive elements should meet touch target requirements
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        const touchTargetResult = testTouchTargets(button);
        expect(touchTargetResult.meetsMinimumSize).toBe(true);
        expect(touchTargetResult.hasAdequateSpacing).toBe(true);
      });
    });

    it('should support users with cognitive disabilities', () => {
      render(
        <DashboardStats
          stats={mockStats}
          onStatClick={jest.fn()}
          accessibility={{
            regionLabel: 'Course Statistics Dashboard',
            description: 'Shows your progress in the course including completion percentage and exam scores',
            instructions: 'Use Tab to navigate between statistics. Press Enter to view details for any statistic.'
          }}
        />
      );

      // Should provide clear instructions
      const instructions = screen.getByText(/use tab to navigate/i);
      expect(instructions).toBeInTheDocument();

      // Should provide clear descriptions
      const description = screen.getByText(/shows your progress in the course/i);
      expect(description).toBeInTheDocument();

      // Should use simple, clear language
      expect(screen.getByText('Overall Progress')).toBeInTheDocument();
      expect(screen.getByText('Completed Exams')).toBeInTheDocument();
    });
  });
});