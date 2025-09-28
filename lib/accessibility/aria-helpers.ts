/**
 * Accessibility Helpers - WCAG 2.1 AA Compliance
 * Neolingus Academy - Comprehensive accessibility support
 * 
 * This module provides utilities and helpers to ensure WCAG 2.1 AA compliance
 * across all academia components with focus management, screen reader support,
 * keyboard navigation, and semantic markup enhancement.
 */

// ARIA roles and properties
export interface AriaAttributes {
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-selected'?: boolean;
  'aria-checked'?: boolean | 'mixed';
  'aria-pressed'?: boolean;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean;
  'aria-level'?: number;
  'aria-setsize'?: number;
  'aria-posinset'?: number;
  'aria-valuemin'?: number;
  'aria-valuemax'?: number;
  'aria-valuenow'?: number;
  'aria-valuetext'?: string;
  'aria-live'?: 'off' | 'polite' | 'assertive';
  'aria-atomic'?: boolean;
  'aria-busy'?: boolean;
  'aria-relevant'?: string;
  'aria-owns'?: string;
  'aria-controls'?: string;
  'aria-flowto'?: string;
  tabIndex?: number;
}

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
} as const;

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = [];
  private static trapStack: HTMLElement[] = [];

  /**
   * Store current focus to restore later
   */
  static storeFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement);
    }
  }

  /**
   * Restore previously stored focus
   */
  static restoreFocus(): void {
    const element = this.focusStack.pop();
    if (element && document.contains(element)) {
      try {
        element.focus();
      } catch (error) {
        console.warn('Failed to restore focus:', error);
      }
    }
  }

  /**
   * Move focus to specific element with validation
   */
  static moveFocusTo(element: HTMLElement, options: { preventScroll?: boolean } = {}): void {
    if (!element || !document.contains(element)) {
      console.warn('Cannot focus element: element not found or not in DOM');
      return;
    }

    try {
      element.focus(options);
    } catch (error) {
      console.warn('Failed to move focus:', error);
    }
  }

  /**
   * Find first focusable element within container
   */
  static findFirstFocusable(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[0] || null;
  }

  /**
   * Find last focusable element within container
   */
  static findLastFocusable(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[focusableElements.length - 1] || null;
  }

  /**
   * Get all focusable elements within container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex^="-"])',
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    
    return elements.filter(element => {
      // Check if element is visible and not hidden
      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return false;
      }

      // Check if element is not disabled or hidden by aria
      if (element.hasAttribute('disabled') || element.getAttribute('aria-hidden') === 'true') {
        return false;
      }

      // Check if element has positive tab index or is naturally focusable
      const tabIndex = element.tabIndex;
      return tabIndex >= 0;
    });
  }

  /**
   * Setup focus trap within container
   */
  static trapFocus(container: HTMLElement): () => void {
    this.trapStack.push(container);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== KEYBOARD_KEYS.TAB) return;

      const focusableElements = this.getFocusableElements(container);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab: move to previous element or wrap to last
        if (currentElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: move to next element or wrap to first
        if (currentElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      const index = this.trapStack.indexOf(container);
      if (index > -1) {
        this.trapStack.splice(index, 1);
      }
    };
  }

  /**
   * Auto-focus first focusable element in container
   */
  static autoFocus(container: HTMLElement, delay: number = 0): void {
    setTimeout(() => {
      const firstFocusable = this.findFirstFocusable(container);
      if (firstFocusable) {
        this.moveFocusTo(firstFocusable);
      }
    }, delay);
  }
}

// Screen reader announcements
export class ScreenReaderAnnouncer {
  private static liveRegion: HTMLElement | null = null;

  /**
   * Initialize live region for announcements
   */
  static initialize(): void {
    if (this.liveRegion) return;

    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;

    document.body.appendChild(this.liveRegion);
  }

  /**
   * Announce message to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.initialize();
    
    if (!this.liveRegion) return;

    // Clear previous message
    this.liveRegion.textContent = '';
    this.liveRegion.setAttribute('aria-live', priority);

    // Add new message with slight delay to ensure screen reader picks it up
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = message;
      }
    }, 100);

    // Clear message after announcement
    setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
      }
    }, 1000);
  }

  /**
   * Announce error message
   */
  static announceError(message: string): void {
    this.announce(`Error: ${message}`, 'assertive');
  }

  /**
   * Announce success message
   */
  static announceSuccess(message: string): void {
    this.announce(`Success: ${message}`, 'polite');
  }

  /**
   * Announce navigation change
   */
  static announceNavigation(message: string): void {
    this.announce(`Navigated to: ${message}`, 'polite');
  }

  /**
   * Announce loading state
   */
  static announceLoading(isLoading: boolean, message?: string): void {
    if (isLoading) {
      this.announce(message || 'Loading...', 'polite');
    } else {
      this.announce(message || 'Loading complete', 'polite');
    }
  }
}

// ARIA helpers for common patterns
export class AriaHelpers {
  /**
   * Generate unique ID for ARIA relationships
   */
  static generateId(prefix: string = 'aria'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
  }

  /**
   * Create ARIA attributes for expandable content
   */
  static expandable(
    isExpanded: boolean,
    controlsId?: string,
    labelText?: string
  ): AriaAttributes {
    const attrs: AriaAttributes = {
      'aria-expanded': isExpanded,
      role: 'button',
      tabIndex: 0,
    };

    if (controlsId) {
      attrs['aria-controls'] = controlsId;
    }

    if (labelText) {
      attrs['aria-label'] = labelText;
    }

    return attrs;
  }

  /**
   * Create ARIA attributes for modal dialogs
   */
  static modal(labelledBy?: string, describedBy?: string): AriaAttributes {
    const attrs: AriaAttributes = {
      role: 'dialog',
      'aria-modal': true as any, // TypeScript workaround
      tabIndex: -1,
    };

    if (labelledBy) {
      attrs['aria-labelledby'] = labelledBy;
    }

    if (describedBy) {
      attrs['aria-describedby'] = describedBy;
    }

    return attrs;
  }

  /**
   * Create ARIA attributes for tabs
   */
  static tab(isSelected: boolean, controlsId: string, setSize?: number, posInSet?: number): AriaAttributes {
    const attrs: AriaAttributes = {
      role: 'tab',
      'aria-selected': isSelected,
      'aria-controls': controlsId,
      tabIndex: isSelected ? 0 : -1,
    };

    if (setSize && posInSet) {
      attrs['aria-setsize'] = setSize;
      attrs['aria-posinset'] = posInSet;
    }

    return attrs;
  }

  /**
   * Create ARIA attributes for tab panels
   */
  static tabPanel(labelledBy: string): AriaAttributes {
    return {
      role: 'tabpanel',
      'aria-labelledby': labelledBy,
      tabIndex: 0,
    };
  }

  /**
   * Create ARIA attributes for listbox options
   */
  static listboxOption(
    isSelected: boolean,
    value: string,
    setSize?: number,
    posInSet?: number
  ): AriaAttributes {
    const attrs: AriaAttributes = {
      role: 'option',
      'aria-selected': isSelected,
      'aria-label': value,
      tabIndex: isSelected ? 0 : -1,
    };

    if (setSize && posInSet) {
      attrs['aria-setsize'] = setSize;
      attrs['aria-posinset'] = posInSet;
    }

    return attrs;
  }

  /**
   * Create ARIA attributes for progress indicators
   */
  static progress(
    current: number,
    max: number,
    label?: string,
    description?: string
  ): AriaAttributes {
    const attrs: AriaAttributes = {
      role: 'progressbar',
      'aria-valuenow': current,
      'aria-valuemin': 0,
      'aria-valuemax': max,
      'aria-valuetext': `${current} of ${max}${label ? ` ${label}` : ''}`,
    };

    if (label) {
      attrs['aria-label'] = label;
    }

    if (description) {
      attrs['aria-describedby'] = this.generateId('progress-desc');
    }

    return attrs;
  }

  /**
   * Create ARIA attributes for form validation
   */
  static fieldValidation(
    hasError: boolean,
    errorId?: string,
    descriptionId?: string
  ): AriaAttributes {
    const attrs: AriaAttributes = {
      'aria-invalid': hasError,
    };

    const describedBy = [];
    if (hasError && errorId) {
      describedBy.push(errorId);
    }
    if (descriptionId) {
      describedBy.push(descriptionId);
    }

    if (describedBy.length > 0) {
      attrs['aria-describedby'] = describedBy.join(' ');
    }

    return attrs;
  }

  /**
   * Create ARIA attributes for live regions
   */
  static liveRegion(
    politeness: 'off' | 'polite' | 'assertive' = 'polite',
    atomic: boolean = false,
    relevant?: string
  ): AriaAttributes {
    const attrs: AriaAttributes = {
      'aria-live': politeness,
      'aria-atomic': atomic,
    };

    if (relevant) {
      attrs['aria-relevant'] = relevant;
    }

    return attrs;
  }

  /**
   * Create ARIA attributes for sortable columns
   */
  static sortableColumn(
    sortDirection: 'asc' | 'desc' | 'none',
    columnName: string
  ): AriaAttributes {
    const sortLabel = sortDirection === 'none' 
      ? `Sort ${columnName}`
      : `Sort ${columnName} ${sortDirection === 'asc' ? 'ascending' : 'descending'}`;

    return {
      role: 'columnheader',
      'aria-sort': sortDirection,
      'aria-label': sortLabel,
      tabIndex: 0,
    };
  }
}

// Keyboard navigation handlers
export class KeyboardNavigationHandlers {
  /**
   * Handle arrow key navigation for lists
   */
  static handleListNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onSelect?: (index: number) => void,
    orientation: 'vertical' | 'horizontal' = 'vertical'
  ): number {
    if (items.length === 0) return currentIndex;

    let newIndex = currentIndex;
    const isVertical = orientation === 'vertical';
    const upKey = isVertical ? KEYBOARD_KEYS.ARROW_UP : KEYBOARD_KEYS.ARROW_LEFT;
    const downKey = isVertical ? KEYBOARD_KEYS.ARROW_DOWN : KEYBOARD_KEYS.ARROW_RIGHT;

    switch (event.key) {
      case upKey:
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;

      case downKey:
        event.preventDefault();
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;

      case KEYBOARD_KEYS.HOME:
        event.preventDefault();
        newIndex = 0;
        break;

      case KEYBOARD_KEYS.END:
        event.preventDefault();
        newIndex = items.length - 1;
        break;

      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        event.preventDefault();
        if (onSelect) {
          onSelect(currentIndex);
        }
        return currentIndex;
    }

    if (newIndex !== currentIndex) {
      FocusManager.moveFocusTo(items[newIndex]);
    }

    return newIndex;
  }

  /**
   * Handle tab navigation for complex widgets
   */
  static handleTabNavigation(
    event: KeyboardEvent,
    container: HTMLElement,
    onEscape?: () => void
  ): void {
    switch (event.key) {
      case KEYBOARD_KEYS.TAB:
        // Let browser handle tab navigation within focus trap
        break;

      case KEYBOARD_KEYS.ESCAPE:
        event.preventDefault();
        if (onEscape) {
          onEscape();
        }
        break;
    }
  }

  /**
   * Handle roving tabindex for composite widgets
   */
  static setupRovingTabindex(items: HTMLElement[]): (index: number) => void {
    // Set initial tabindex values
    items.forEach((item, index) => {
      item.tabIndex = index === 0 ? 0 : -1;
    });

    // Return function to update tabindex
    return (activeIndex: number) => {
      items.forEach((item, index) => {
        item.tabIndex = index === activeIndex ? 0 : -1;
      });
    };
  }
}

// Color contrast utilities
export class ColorContrastHelpers {
  /**
   * Calculate relative luminance of a color
   */
  static getRelativeLuminance(color: string): number {
    const rgb = this.parseColor(color);
    if (!rgb) return 0;

    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getRelativeLuminance(color1);
    const l2 = this.getRelativeLuminance(color2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Check if color combination meets WCAG AA contrast requirements
   */
  static meetsContrastAA(
    foreground: string,
    background: string,
    isLargeText: boolean = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    const threshold = isLargeText ? 3 : 4.5;
    return ratio >= threshold;
  }

  /**
   * Check if color combination meets WCAG AAA contrast requirements
   */
  static meetsContrastAAA(
    foreground: string,
    background: string,
    isLargeText: boolean = false
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    const threshold = isLargeText ? 4.5 : 7;
    return ratio >= threshold;
  }

  /**
   * Parse color string to RGB values
   */
  private static parseColor(color: string): [number, number, number] | null {
    // Create a temporary element to get computed color
    const div = document.createElement('div');
    div.style.color = color;
    document.body.appendChild(div);
    
    const computed = window.getComputedStyle(div).color;
    document.body.removeChild(div);
    
    // Parse rgb() or rgba() format
    const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
    }
    
    return null;
  }
}

// Text readability helpers
export class ReadabilityHelpers {
  /**
   * Calculate reading level using Flesch-Kincaid
   */
  static calculateFleschKincaid(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = words.reduce((total, word) => total + this.countSyllables(word), 0);
    
    if (sentences.length === 0 || words.length === 0) return 0;
    
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = syllables / words.length;
    
    return 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
  }

  /**
   * Count syllables in a word (approximate)
   */
  private static countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length === 0) return 0;
    
    let syllables = word.match(/[aeiouy]+/g)?.length || 0;
    
    // Adjust for silent e
    if (word.endsWith('e')) syllables--;
    
    // Minimum of 1 syllable
    return Math.max(1, syllables);
  }

  /**
   * Check if text is appropriate for reading level
   */
  static isAppropriateReadingLevel(
    text: string,
    targetGradeLevel: number = 8
  ): boolean {
    const score = this.calculateFleschKincaid(text);
    // Convert Flesch-Kincaid to grade level (approximate)
    const gradeLevel = Math.max(0, 20 - (score / 10));
    return gradeLevel <= targetGradeLevel;
  }

  /**
   * Suggest text improvements for readability
   */
  static suggestImprovements(text: string): string[] {
    const suggestions: string[] = [];
    
    const words = text.split(/\s+/);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Check average sentence length
    if (sentences.length > 0) {
      const avgSentenceLength = words.length / sentences.length;
      if (avgSentenceLength > 20) {
        suggestions.push('Consider breaking up long sentences (average: ' + Math.round(avgSentenceLength) + ' words)');
      }
    }
    
    // Check for complex words
    const complexWords = words.filter(word => this.countSyllables(word) > 3);
    if (complexWords.length / words.length > 0.1) {
      suggestions.push('Consider using simpler words where possible');
    }
    
    // Check readability score
    const score = this.calculateFleschKincaid(text);
    if (score < 30) {
      suggestions.push('Text may be too complex for general audiences');
    }
    
    return suggestions;
  }
}

// Touch and mobile accessibility
export class TouchAccessibilityHelpers {
  /**
   * Check if touch target meets minimum size requirements (44px)
   */
  static checkTouchTargetSize(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const minSize = 44; // WCAG recommendation
    
    return rect.width >= minSize && rect.height >= minSize;
  }

  /**
   * Get recommended touch target improvements
   */
  static getTouchTargetRecommendations(element: HTMLElement): string[] {
    const recommendations: string[] = [];
    const rect = element.getBoundingClientRect();
    const minSize = 44;
    
    if (rect.width < minSize) {
      recommendations.push(`Increase width to at least ${minSize}px (current: ${Math.round(rect.width)}px)`);
    }
    
    if (rect.height < minSize) {
      recommendations.push(`Increase height to at least ${minSize}px (current: ${Math.round(rect.height)}px)`);
    }
    
    return recommendations;
  }

  /**
   * Add touch-friendly event handlers
   */
  static addTouchSupport(
    element: HTMLElement,
    handler: () => void,
    options: { preventDefault?: boolean } = {}
  ): () => void {
    let touchStarted = false;
    
    const handleTouchStart = () => {
      touchStarted = true;
    };
    
    const handleTouchEnd = (event: TouchEvent) => {
      if (touchStarted) {
        if (options.preventDefault) {
          event.preventDefault();
        }
        handler();
        touchStarted = false;
      }
    };
    
    const handleClick = (event: MouseEvent) => {
      if (!touchStarted) {
        if (options.preventDefault) {
          event.preventDefault();
        }
        handler();
      }
    };
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: !options.preventDefault });
    element.addEventListener('click', handleClick);
    
    // Return cleanup function
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('click', handleClick);
    };
  }
}

// Accessibility audit utilities
export class AccessibilityAudit {
  /**
   * Perform comprehensive accessibility audit on element
   */
  static auditElement(element: HTMLElement): AccessibilityAuditResult {
    const issues: AccessibilityIssue[] = [];
    const warnings: AccessibilityIssue[] = [];
    const suggestions: string[] = [];
    
    // Check for missing alt text on images
    const images = element.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.hasAttribute('alt')) {
        issues.push({
          type: 'missing-alt-text',
          severity: 'error',
          element: img,
          message: `Image ${index + 1} is missing alt text`,
          wcagCriteria: '1.1.1'
        });
      }
    });
    
    // Check for missing form labels
    const inputs = element.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const hasLabel = input.hasAttribute('aria-label') || 
                      input.hasAttribute('aria-labelledby') ||
                      element.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        issues.push({
          type: 'missing-label',
          severity: 'error',
          element: input,
          message: `Form control ${index + 1} is missing a label`,
          wcagCriteria: '1.3.1'
        });
      }
    });
    
    // Check for insufficient color contrast
    const textElements = element.querySelectorAll('*');
    textElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const isLargeText = parseFloat(computedStyle.fontSize) >= 18 ||
                           (parseFloat(computedStyle.fontSize) >= 14 && computedStyle.fontWeight === 'bold');
        
        if (!ColorContrastHelpers.meetsContrastAA(color, backgroundColor, isLargeText)) {
          const ratio = ColorContrastHelpers.getContrastRatio(color, backgroundColor);
          warnings.push({
            type: 'insufficient-contrast',
            severity: 'warning',
            element: el as HTMLElement,
            message: `Insufficient color contrast (${ratio.toFixed(2)}:1)`,
            wcagCriteria: '1.4.3'
          });
        }
      }
    });
    
    // Check for heading hierarchy
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        warnings.push({
          type: 'heading-hierarchy',
          severity: 'warning',
          element: heading as HTMLElement,
          message: `Heading level ${level} skips level ${previousLevel + 1}`,
          wcagCriteria: '1.3.1'
        });
      }
      previousLevel = level;
    });
    
    // Check for keyboard focusability
    const interactiveElements = element.querySelectorAll('button, input, select, textarea, a[href], [tabindex]');
    interactiveElements.forEach(el => {
      if ((el as HTMLElement).tabIndex < 0 && !el.hasAttribute('aria-hidden')) {
        warnings.push({
          type: 'not-focusable',
          severity: 'warning',
          element: el as HTMLElement,
          message: 'Interactive element is not keyboard focusable',
          wcagCriteria: '2.1.1'
        });
      }
    });
    
    // Check touch target sizes
    const touchTargets = element.querySelectorAll('button, input[type="button"], input[type="submit"], a, [role="button"]');
    touchTargets.forEach(target => {
      if (!TouchAccessibilityHelpers.checkTouchTargetSize(target as HTMLElement)) {
        const recs = TouchAccessibilityHelpers.getTouchTargetRecommendations(target as HTMLElement);
        suggestions.push(...recs.map(rec => `Touch target: ${rec}`));
      }
    });
    
    return {
      issues,
      warnings,
      suggestions,
      score: this.calculateAccessibilityScore(issues, warnings)
    };
  }
  
  /**
   * Calculate accessibility score (0-100)
   */
  private static calculateAccessibilityScore(
    issues: AccessibilityIssue[],
    warnings: AccessibilityIssue[]
  ): number {
    const errorWeight = 10;
    const warningWeight = 2;
    
    const totalDeductions = (issues.length * errorWeight) + (warnings.length * warningWeight);
    return Math.max(0, 100 - totalDeductions);
  }
  
  /**
   * Generate accessibility report
   */
  static generateReport(auditResults: AccessibilityAuditResult): string {
    let report = `Accessibility Audit Report\n`;
    report += `Overall Score: ${auditResults.score}/100\n\n`;
    
    if (auditResults.issues.length > 0) {
      report += `ERRORS (${auditResults.issues.length}):\n`;
      auditResults.issues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.message} (WCAG ${issue.wcagCriteria})\n`;
      });
      report += '\n';
    }
    
    if (auditResults.warnings.length > 0) {
      report += `WARNINGS (${auditResults.warnings.length}):\n`;
      auditResults.warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning.message} (WCAG ${warning.wcagCriteria})\n`;
      });
      report += '\n';
    }
    
    if (auditResults.suggestions.length > 0) {
      report += `SUGGESTIONS (${auditResults.suggestions.length}):\n`;
      auditResults.suggestions.forEach((suggestion, index) => {
        report += `${index + 1}. ${suggestion}\n`;
      });
    }
    
    return report;
  }
}

// Types for accessibility audit
export interface AccessibilityIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  element: HTMLElement;
  message: string;
  wcagCriteria: string;
}

export interface AccessibilityAuditResult {
  issues: AccessibilityIssue[];
  warnings: AccessibilityIssue[];
  suggestions: string[];
  score: number;
}

// High contrast mode detection and support
export class HighContrastSupport {
  /**
   * Detect if high contrast mode is enabled
   */
  static isHighContrastMode(): boolean {
    // Check for Windows high contrast mode
    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      return true;
    }
    
    // Fallback method using CSS detection
    const testElement = document.createElement('div');
    testElement.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      background-color: canvas;
      color: canvasText;
    `;
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    const isHighContrast = computedStyle.backgroundColor !== 'canvas' || 
                          computedStyle.color !== 'canvasText';
    
    document.body.removeChild(testElement);
    return isHighContrast;
  }
  
  /**
   * Add high contrast mode support to element
   */
  static addHighContrastSupport(element: HTMLElement): void {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    const handleContrastChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        element.classList.add('high-contrast');
      } else {
        element.classList.remove('high-contrast');
      }
    };
    
    // Set initial state
    if (this.isHighContrastMode()) {
      element.classList.add('high-contrast');
    }
    
    // Listen for changes
    mediaQuery.addListener(handleContrastChange);
  }
}

// Reduced motion support
export class ReducedMotionSupport {
  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  
  /**
   * Add reduced motion support
   */
  static addReducedMotionSupport(element: HTMLElement): void {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        element.classList.add('reduced-motion');
      } else {
        element.classList.remove('reduced-motion');
      }
    };
    
    // Set initial state
    if (this.prefersReducedMotion()) {
      element.classList.add('reduced-motion');
    }
    
    // Listen for changes
    mediaQuery.addListener(handleMotionChange);
  }
}

// Initialize accessibility features
export function initializeAccessibility(): void {
  // Initialize screen reader announcer
  ScreenReaderAnnouncer.initialize();
  
  // Add skip links if not present
  addSkipLinks();
  
  // Set up global keyboard handlers
  setupGlobalKeyboardHandlers();
  
  // Add high contrast and reduced motion support to body
  HighContrastSupport.addHighContrastSupport(document.body);
  ReducedMotionSupport.addReducedMotionSupport(document.body);
  
  // Announce page loaded
  setTimeout(() => {
    ScreenReaderAnnouncer.announce('Page loaded');
  }, 1000);
}

/**
 * Add skip links to page
 */
function addSkipLinks(): void {
  if (document.querySelector('.skip-links')) return;
  
  const skipLinks = document.createElement('nav');
  skipLinks.className = 'skip-links';
  skipLinks.innerHTML = `
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <a href="#navigation" class="skip-link">Skip to navigation</a>
  `;
  
  document.body.insertBefore(skipLinks, document.body.firstChild);
}

/**
 * Setup global keyboard event handlers
 */
function setupGlobalKeyboardHandlers(): void {
  document.addEventListener('keydown', (event) => {
    // Global escape key handler for modals
    if (event.key === KEYBOARD_KEYS.ESCAPE) {
      const openModal = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (openModal) {
        const closeButton = openModal.querySelector('[aria-label*="close"], [aria-label*="Close"]');
        if (closeButton instanceof HTMLElement) {
          closeButton.click();
        }
      }
    }
  });
}

// Export all utilities
export {
  FocusManager,
  ScreenReaderAnnouncer,
  AriaHelpers,
  KeyboardNavigationHandlers,
  ColorContrastHelpers,
  ReadabilityHelpers,
  TouchAccessibilityHelpers,
  AccessibilityAudit,
  HighContrastSupport,
  ReducedMotionSupport,
  initializeAccessibility,
};

// CSS classes for screen reader only content
export const SR_ONLY_CLASS = 'sr-only';
export const SR_ONLY_FOCUSABLE_CLASS = 'sr-only-focusable';

// CSS to include in your stylesheet
export const ACCESSIBILITY_CSS = `
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  .sr-only-focusable:focus,
  .sr-only-focusable:active {
    position: static !important;
    width: auto !important;
    height: auto !important;
    padding: inherit !important;
    margin: inherit !important;
    overflow: visible !important;
    clip: auto !important;
    white-space: inherit !important;
  }

  .skip-links {
    position: absolute;
    top: -40px;
    left: 6px;
    z-index: 1000;
  }

  .skip-link {
    position: absolute;
    left: -10000px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
    background: #000;
    color: #fff;
    padding: 8px 16px;
    text-decoration: none;
    border-radius: 4px;
  }

  .skip-link:focus {
    position: static;
    width: auto;
    height: auto;
    overflow: visible;
  }

  /* High contrast mode support */
  .high-contrast {
    filter: contrast(150%);
  }

  .high-contrast *:focus {
    outline: 3px solid currentColor !important;
    outline-offset: 2px !important;
  }

  /* Reduced motion support */
  .reduced-motion,
  .reduced-motion *,
  .reduced-motion *::before,
  .reduced-motion *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  /* Focus indicators */
  :focus {
    outline: 2px solid #4285f4;
    outline-offset: 2px;
  }

  /* Touch target minimum sizes */
  @media (pointer: coarse) {
    button,
    input[type="button"],
    input[type="submit"],
    input[type="reset"],
    input[type="checkbox"],
    input[type="radio"],
    a {
      min-height: 44px;
      min-width: 44px;
    }
  }

  /* Ensure interactive elements are visible */
  button:focus,
  input:focus,
  select:focus,
  textarea:focus,
  a:focus,
  [tabindex]:focus {
    z-index: 1;
  }
`;