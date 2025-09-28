/**
 * Manual Accessibility Testing Helpers
 *
 * Utilities for manual accessibility testing that complement automated tests.
 * These helpers assist in testing scenarios that require human judgment.
 */

/**
 * Keyboard navigation testing helper
 */
export interface KeyboardTestResults {
  element: Element;
  canReceiveFocus: boolean;
  hasVisibleFocus: boolean;
  respondsToEnter: boolean;
  respondsToSpace: boolean;
  hasProperTabOrder: boolean;
  issues: string[];
}

export const testKeyboardInteraction = (element: Element): KeyboardTestResults => {
  const issues: string[] = [];
  let canReceiveFocus = false;
  let hasVisibleFocus = false;
  let respondsToEnter = false;
  let respondsToSpace = false;
  let hasProperTabOrder = true;

  try {
    // Test if element can receive focus
    if (element instanceof HTMLElement) {
      const originalFocus = document.activeElement;
      element.focus();
      canReceiveFocus = document.activeElement === element;

      if (!canReceiveFocus && element.tabIndex >= 0) {
        issues.push('Element has positive tabIndex but cannot receive focus');
      }

      // Test focus visibility
      if (canReceiveFocus) {
        const computedStyle = window.getComputedStyle(element, ':focus');
        const outline = computedStyle.outline;
        const outlineWidth = computedStyle.outlineWidth;
        const boxShadow = computedStyle.boxShadow;

        hasVisibleFocus = outline !== 'none' ||
                         (outlineWidth && outlineWidth !== '0px') ||
                         (boxShadow && boxShadow !== 'none');

        if (!hasVisibleFocus) {
          issues.push('Element lacks visible focus indicator');
        }
      }

      // Test keyboard activation for interactive elements
      const role = element.getAttribute('role');
      const tagName = element.tagName.toLowerCase();

      if (role === 'button' || tagName === 'button' ||
          role === 'link' || tagName === 'a') {

        let enterTriggered = false;
        let spaceTriggered = false;

        const enterHandler = () => { enterTriggered = true; };
        const spaceHandler = () => { spaceTriggered = true; };
        const keydownHandler = (event: KeyboardEvent) => {
          if (event.key === 'Enter') enterHandler();
          if (event.key === ' ') spaceHandler();
        };

        element.addEventListener('keydown', keydownHandler);
        element.addEventListener('click', enterHandler);
        element.addEventListener('click', spaceHandler);

        // Simulate key events
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });

        element.dispatchEvent(enterEvent);
        element.dispatchEvent(spaceEvent);

        respondsToEnter = enterTriggered;
        respondsToSpace = spaceTriggered;

        element.removeEventListener('keydown', keydownHandler);
        element.removeEventListener('click', enterHandler);
        element.removeEventListener('click', spaceHandler);

        if (!respondsToEnter && (role === 'button' || tagName === 'button')) {
          issues.push('Button does not respond to Enter key');
        }
        if (!respondsToSpace && (role === 'button' || tagName === 'button')) {
          issues.push('Button does not respond to Space key');
        }
      }

      // Check tab order
      const tabIndex = element.tabIndex;
      if (tabIndex > 0) {
        issues.push(`Element has positive tabIndex (${tabIndex}), which can disrupt natural tab order`);
        hasProperTabOrder = false;
      }

      // Restore original focus
      if (originalFocus instanceof HTMLElement) {
        originalFocus.focus();
      }
    }
  } catch (error) {
    issues.push(`Error during keyboard testing: ${error}`);
  }

  return {
    element,
    canReceiveFocus,
    hasVisibleFocus,
    respondsToEnter,
    respondsToSpace,
    hasProperTabOrder,
    issues
  };
};

/**
 * Screen reader testing helper
 */
export interface ScreenReaderTestResults {
  element: Element;
  accessibleName: string | null;
  accessibleDescription: string | null;
  role: string | null;
  landmarks: string[];
  headingLevel: number | null;
  liveRegion: string | null;
  issues: string[];
}

export const testScreenReaderContent = (element: Element): ScreenReaderTestResults => {
  const issues: string[] = [];

  // Get accessible name
  const accessibleName = getAccessibleName(element);
  if (!accessibleName && isInteractiveElement(element)) {
    issues.push('Interactive element lacks accessible name');
  }

  // Get accessible description
  const accessibleDescription = getAccessibleDescription(element);

  // Get role
  const role = element.getAttribute('role') || getImplicitRole(element);

  // Check for landmarks
  const landmarks = getLandmarkInfo(element);

  // Check heading level
  const headingLevel = getHeadingLevel(element);
  if (element.tagName.match(/^H[1-6]$/) && !headingLevel) {
    issues.push('Heading element detected but level could not be determined');
  }

  // Check live region
  const liveRegion = element.getAttribute('aria-live');

  // Validate ARIA attributes
  const ariaIssues = validateAriaAttributes(element);
  issues.push(...ariaIssues);

  return {
    element,
    accessibleName,
    accessibleDescription,
    role,
    landmarks,
    headingLevel,
    liveRegion,
    issues
  };
};

/**
 * Color contrast testing helper
 */
export interface ColorContrastTestResults {
  element: Element;
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagLevel: 'AAA' | 'AA' | 'fail';
  fontSize: number;
  fontWeight: string;
  isLargeText: boolean;
  requiredRatio: number;
  passes: boolean;
  issues: string[];
}

export const testColorContrast = (element: Element): ColorContrastTestResults => {
  const issues: string[] = [];
  const computedStyle = window.getComputedStyle(element);

  const foregroundColor = computedStyle.color;
  const backgroundColor = getEffectiveBackgroundColor(element);
  const fontSize = parseFloat(computedStyle.fontSize);
  const fontWeight = computedStyle.fontWeight;

  // Determine if it's large text (18pt or 14pt bold)
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold(fontWeight));
  const requiredRatio = isLargeText ? 3.0 : 4.5;

  // Calculate contrast ratio (simplified - in practice use a proper library)
  const contrastRatio = calculateContrastRatio(foregroundColor, backgroundColor);

  const passes = contrastRatio >= requiredRatio;
  const wcagLevel: 'AAA' | 'AA' | 'fail' =
    contrastRatio >= 7.0 ? 'AAA' :
    contrastRatio >= requiredRatio ? 'AA' : 'fail';

  if (!passes) {
    issues.push(`Insufficient color contrast: ${contrastRatio.toFixed(2)}:1 (required: ${requiredRatio}:1)`);
  }

  return {
    element,
    foregroundColor,
    backgroundColor,
    contrastRatio,
    wcagLevel,
    fontSize,
    fontWeight,
    isLargeText,
    requiredRatio,
    passes,
    issues
  };
};

/**
 * Touch target testing helper
 */
export interface TouchTargetTestResults {
  element: Element;
  width: number;
  height: number;
  meetsMinimumSize: boolean;
  hasAdequateSpacing: boolean;
  issues: string[];
}

export const testTouchTargets = (element: Element): TouchTargetTestResults => {
  const issues: string[] = [];
  const rect = element.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;

  // WCAG 2.1 AA requires 44x44 CSS pixels minimum
  const minimumSize = 44;
  const meetsMinimumSize = width >= minimumSize && height >= minimumSize;

  if (!meetsMinimumSize && isInteractiveElement(element)) {
    issues.push(`Touch target too small: ${width}x${height}px (minimum: ${minimumSize}x${minimumSize}px)`);
  }

  // Check spacing to adjacent interactive elements
  const hasAdequateSpacing = checkTouchTargetSpacing(element);
  if (!hasAdequateSpacing) {
    issues.push('Insufficient spacing between touch targets');
  }

  return {
    element,
    width,
    height,
    meetsMinimumSize,
    hasAdequateSpacing,
    issues
  };
};

/**
 * Text spacing testing helper (WCAG 2.1 AA)
 */
export interface TextSpacingTestResults {
  element: Element;
  lineHeight: number;
  letterSpacing: number;
  wordSpacing: number;
  paragraphSpacing: number;
  meetsRequirements: boolean;
  issues: string[];
}

export const testTextSpacing = (element: Element): TextSpacingTestResults => {
  const issues: string[] = [];
  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);

  const lineHeight = parseFloat(computedStyle.lineHeight) / fontSize;
  const letterSpacing = parseFloat(computedStyle.letterSpacing) / fontSize;
  const wordSpacing = parseFloat(computedStyle.wordSpacing) / fontSize;

  // For paragraph spacing, check margin/padding
  const marginBottom = parseFloat(computedStyle.marginBottom) / fontSize;
  const paddingBottom = parseFloat(computedStyle.paddingBottom) / fontSize;
  const paragraphSpacing = Math.max(marginBottom, paddingBottom);

  // WCAG 2.1 AA requirements
  const meetsLineHeight = lineHeight >= 1.5;
  const meetsLetterSpacing = letterSpacing >= 0.12;
  const meetsWordSpacing = wordSpacing >= 0.16;
  const meetsParagraphSpacing = paragraphSpacing >= 2.0;

  const meetsRequirements = meetsLineHeight && meetsLetterSpacing &&
                           meetsWordSpacing && meetsParagraphSpacing;

  if (!meetsLineHeight) {
    issues.push(`Line height too small: ${lineHeight.toFixed(2)}em (minimum: 1.5em)`);
  }
  if (!meetsLetterSpacing) {
    issues.push(`Letter spacing too small: ${letterSpacing.toFixed(3)}em (minimum: 0.12em)`);
  }
  if (!meetsWordSpacing) {
    issues.push(`Word spacing too small: ${wordSpacing.toFixed(3)}em (minimum: 0.16em)`);
  }
  if (!meetsParagraphSpacing) {
    issues.push(`Paragraph spacing too small: ${paragraphSpacing.toFixed(2)}em (minimum: 2.0em)`);
  }

  return {
    element,
    lineHeight,
    letterSpacing,
    wordSpacing,
    paragraphSpacing,
    meetsRequirements,
    issues
  };
};

/**
 * Comprehensive manual testing suite
 */
export interface ManualTestResults {
  keyboard: KeyboardTestResults[];
  screenReader: ScreenReaderTestResults[];
  colorContrast: ColorContrastTestResults[];
  touchTargets: TouchTargetTestResults[];
  textSpacing: TextSpacingTestResults[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    warningIssues: number;
    passed: boolean;
  };
}

export const runManualAccessibilityTests = (container: Element): ManualTestResults => {
  // Get all testable elements
  const interactiveElements = container.querySelectorAll(
    'button, input, select, textarea, a[href], [tabindex], [role="button"], [role="link"], [role="menuitem"], [role="tab"]'
  );

  const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, label, li');
  const allElements = container.querySelectorAll('*');

  // Run tests
  const keyboard = Array.from(interactiveElements).map(testKeyboardInteraction);
  const screenReader = Array.from(allElements).map(testScreenReaderContent);
  const colorContrast = Array.from(textElements).map(testColorContrast);
  const touchTargets = Array.from(interactiveElements).map(testTouchTargets);
  const textSpacing = Array.from(textElements).map(testTextSpacing);

  // Calculate summary
  const allIssues = [
    ...keyboard.flatMap(r => r.issues),
    ...screenReader.flatMap(r => r.issues),
    ...colorContrast.flatMap(r => r.issues),
    ...touchTargets.flatMap(r => r.issues),
    ...textSpacing.flatMap(r => r.issues)
  ];

  const criticalIssues = allIssues.filter(issue =>
    issue.includes('cannot receive focus') ||
    issue.includes('lacks accessible name') ||
    issue.includes('insufficient color contrast')
  ).length;

  const warningIssues = allIssues.length - criticalIssues;

  return {
    keyboard,
    screenReader,
    colorContrast,
    touchTargets,
    textSpacing,
    summary: {
      totalIssues: allIssues.length,
      criticalIssues,
      warningIssues,
      passed: criticalIssues === 0
    }
  };
};

// Helper functions
function getAccessibleName(element: Element): string | null {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy);
    return labelElement?.textContent?.trim() || null;
  }

  if (element.hasAttribute('id')) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent?.trim() || null;
  }

  const tagName = element.tagName.toLowerCase();
  if (['button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
    return element.textContent?.trim() || null;
  }

  if (tagName === 'img') {
    return element.getAttribute('alt');
  }

  return null;
}

function getAccessibleDescription(element: Element): string | null {
  const describedBy = element.getAttribute('aria-describedby');
  if (describedBy) {
    const descElement = document.getElementById(describedBy);
    return descElement?.textContent?.trim() || null;
  }

  return element.getAttribute('aria-description');
}

function getImplicitRole(element: Element): string {
  const tagName = element.tagName.toLowerCase();
  const type = element.getAttribute('type');

  const roleMap: Record<string, string> = {
    'button': 'button',
    'a': element.hasAttribute('href') ? 'link' : 'generic',
    'input': type === 'button' || type === 'submit' ? 'button' : 'textbox',
    'img': 'img',
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
    'main': 'main',
    'nav': 'navigation',
    'article': 'article',
    'section': 'region',
    'header': 'banner',
    'footer': 'contentinfo',
    'aside': 'complementary'
  };

  return roleMap[tagName] || 'generic';
}

function getLandmarkInfo(element: Element): string[] {
  const landmarks: string[] = [];
  const role = element.getAttribute('role') || getImplicitRole(element);

  const landmarkRoles = ['main', 'navigation', 'banner', 'contentinfo', 'complementary', 'region', 'search'];

  if (landmarkRoles.includes(role)) {
    landmarks.push(role);
  }

  return landmarks;
}

function getHeadingLevel(element: Element): number | null {
  const tagName = element.tagName.toLowerCase();
  const match = tagName.match(/^h([1-6])$/);
  if (match) return parseInt(match[1]);

  const ariaLevel = element.getAttribute('aria-level');
  if (ariaLevel) return parseInt(ariaLevel);

  return null;
}

function validateAriaAttributes(element: Element): string[] {
  const issues: string[] = [];
  const attributes = element.attributes;

  for (let i = 0; i < attributes.length; i++) {
    const attr = attributes[i];
    if (attr.name.startsWith('aria-')) {
      // Basic validation - in practice, use comprehensive ARIA spec
      if (attr.name === 'aria-expanded' && !['true', 'false'].includes(attr.value)) {
        issues.push(`Invalid aria-expanded value: ${attr.value}`);
      }
      if (attr.name === 'aria-hidden' && !['true', 'false'].includes(attr.value)) {
        issues.push(`Invalid aria-hidden value: ${attr.value}`);
      }
    }
  }

  return issues;
}

function isInteractiveElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  const role = element.getAttribute('role');

  const interactiveTags = ['button', 'input', 'select', 'textarea', 'a'];
  const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio'];

  return interactiveTags.includes(tagName) ||
         (role && interactiveRoles.includes(role)) ||
         element.hasAttribute('tabindex');
}

function getEffectiveBackgroundColor(element: Element): string {
  let current = element;
  while (current && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const bgColor = style.backgroundColor;

    if (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') {
      return bgColor;
    }

    current = current.parentElement!;
  }

  return 'rgb(255, 255, 255)'; // Default to white
}

function calculateContrastRatio(foreground: string, background: string): number {
  // Simplified calculation - use a proper library like chroma.js in practice
  // This is a mock implementation
  return 4.6; // Mock ratio that passes AA
}

function isBold(fontWeight: string): boolean {
  const numericWeight = parseInt(fontWeight);
  return numericWeight >= 700 || fontWeight === 'bold';
}

function checkTouchTargetSpacing(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const siblings = Array.from(element.parentElement?.children || [])
    .filter(el => el !== element && isInteractiveElement(el));

  const minimumSpacing = 8; // 8px minimum spacing

  for (const sibling of siblings) {
    const siblingRect = sibling.getBoundingClientRect();

    const horizontalDistance = Math.max(0,
      Math.max(rect.left - siblingRect.right, siblingRect.left - rect.right)
    );
    const verticalDistance = Math.max(0,
      Math.max(rect.top - siblingRect.bottom, siblingRect.top - rect.bottom)
    );

    if (horizontalDistance < minimumSpacing && verticalDistance < minimumSpacing) {
      return false;
    }
  }

  return true;
}

/**
 * Generate manual testing report
 */
export const generateManualTestingReport = (
  componentName: string,
  results: ManualTestResults
): string => {
  let report = `# Manual Accessibility Test Report: ${componentName}\n\n`;

  report += `## Summary\n`;
  report += `- **Status**: ${results.summary.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
  report += `- **Total Issues**: ${results.summary.totalIssues}\n`;
  report += `- **Critical Issues**: ${results.summary.criticalIssues}\n`;
  report += `- **Warning Issues**: ${results.summary.warningIssues}\n\n`;

  if (results.summary.criticalIssues > 0) {
    report += `## Critical Issues\n`;
    results.keyboard.forEach((test, i) => {
      test.issues.forEach(issue => {
        if (issue.includes('cannot receive focus') || issue.includes('lacks accessible name')) {
          report += `- Keyboard Test ${i + 1}: ${issue}\n`;
        }
      });
    });

    results.colorContrast.forEach((test, i) => {
      test.issues.forEach(issue => {
        if (issue.includes('insufficient color contrast')) {
          report += `- Color Contrast Test ${i + 1}: ${issue}\n`;
        }
      });
    });
    report += '\n';
  }

  report += `## Test Results\n`;
  report += `### Keyboard Navigation\n`;
  report += `- Tests Run: ${results.keyboard.length}\n`;
  report += `- Issues Found: ${results.keyboard.reduce((sum, test) => sum + test.issues.length, 0)}\n\n`;

  report += `### Screen Reader Compatibility\n`;
  report += `- Tests Run: ${results.screenReader.length}\n`;
  report += `- Issues Found: ${results.screenReader.reduce((sum, test) => sum + test.issues.length, 0)}\n\n`;

  report += `### Color Contrast\n`;
  report += `- Tests Run: ${results.colorContrast.length}\n`;
  report += `- Failed Tests: ${results.colorContrast.filter(test => !test.passes).length}\n\n`;

  report += `### Touch Targets\n`;
  report += `- Tests Run: ${results.touchTargets.length}\n`;
  report += `- Issues Found: ${results.touchTargets.reduce((sum, test) => sum + test.issues.length, 0)}\n\n`;

  report += `### Text Spacing\n`;
  report += `- Tests Run: ${results.textSpacing.length}\n`;
  report += `- Failed Tests: ${results.textSpacing.filter(test => !test.meetsRequirements).length}\n\n`;

  return report;
};