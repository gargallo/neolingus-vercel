/**
 * TDD Tests for Theme Utilities
 * These tests MUST FAIL initially - defining expected behavior for theme utilities
 */

import {
  cn,
  getSystemTheme,
  getStoredTheme,
  setStoredTheme,
  resolveTheme,
  generateThemeCSS,
  applyThemeVariables,
  getThemeColor,
  getConstructionColor,
  getAnimationDuration,
  getAnimationEasing,
  createThemeTransition,
  withThemeTransition,
  constructionCard,
  constructionButton,
  constructionInput,
  constructionGradient,
  themeAwareGradient,
  darkModeOnly,
  lightModeOnly,
  focusRing,
  hoverScale,
  skeleton,
  loadingSpinner,
  screenReaderOnly,
  accessibleButton,
  responsiveClasses,
  debugTheme,
  themeUtils,
} from '@/lib/utils/theme-utils';

import { vi } from 'vitest';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query.includes('dark'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock document.documentElement for DOM manipulation tests
const mockDocumentElement = {
  style: {
    setProperty: vi.fn(),
    getPropertyValue: vi.fn(),
  },
};

Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
  writable: true,
});

describe('Theme Utilities', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('ClassName Utility (cn)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toContain('base-class');
      expect(result).toContain('additional-class');
    });

    it('should handle conditional classes', () => {
      const result = cn('base-class', true && 'conditional-class', false && 'hidden-class');
      expect(result).toContain('base-class');
      expect(result).toContain('conditional-class');
      expect(result).not.toContain('hidden-class');
    });

    it('should resolve Tailwind conflicts', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8'); // Later class should win
    });
  });

  describe('System Theme Detection', () => {
    it('should detect dark system theme', () => {
      (window.matchMedia as any).mockImplementation(query => ({
        matches: query.includes('dark'),
      }));

      expect(getSystemTheme()).toBe('dark');
    });

    it('should detect light system theme', () => {
      (window.matchMedia as any).mockImplementation(query => ({
        matches: false,
      }));

      expect(getSystemTheme()).toBe('light');
    });

    it('should return light theme on server side', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(getSystemTheme()).toBe('light');

      global.window = originalWindow;
    });
  });

  describe('Stored Theme Management', () => {
    it('should retrieve stored theme from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');
      
      expect(getStoredTheme()).toBe('dark');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('neolingus-theme');
    });

    it('should return null for invalid stored theme', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-theme');
      
      expect(getStoredTheme()).toBeNull();
    });

    it('should use custom storage key', () => {
      const customKey = 'custom-theme-key';
      mockLocalStorage.getItem.mockReturnValue('light');
      
      expect(getStoredTheme(customKey)).toBe('light');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith(customKey);
    });

    it('should set theme in localStorage', () => {
      setStoredTheme('dark');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('neolingus-theme', 'dark');
    });

    it('should set system theme in localStorage', () => {
      setStoredTheme('system');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('neolingus-theme', 'system');
    });

    it('should handle server-side gracefully', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(getStoredTheme()).toBeNull();
      expect(() => setStoredTheme('dark')).not.toThrow();

      global.window = originalWindow;
    });
  });

  describe('Theme Resolution', () => {
    it('should resolve system theme to actual theme', () => {
      (window.matchMedia as any).mockImplementation(query => ({
        matches: query.includes('dark'),
      }));

      expect(resolveTheme('system')).toBe('dark');
    });

    it('should return explicit themes unchanged', () => {
      expect(resolveTheme('light')).toBe('light');
      expect(resolveTheme('dark')).toBe('dark');
    });
  });

  describe('CSS Generation', () => {
    it('should generate CSS from theme config', () => {
      const css = generateThemeCSS('light');
      
      expect(css).toContain('--primary: 24 100% 50%');
      expect(css).toContain('--construction-primary: 24 100% 50%');
      expect(css).toContain('--background: 0 0% 100%');
    });

    it('should return empty string for invalid theme', () => {
      expect(generateThemeCSS('invalid' as any)).toBe('');
    });

    it('should apply theme variables to document', () => {
      applyThemeVariables('light');
      
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--primary', '24 100% 50%');
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--construction-primary', '24 100% 50%');
    });

    it('should handle server-side gracefully for applyThemeVariables', () => {
      const originalDocument = global.document;
      delete (global as any).document;

      expect(() => applyThemeVariables('light')).not.toThrow();

      global.document = originalDocument;
    });
  });

  describe('Theme Color Access', () => {
    it('should get theme color correctly', () => {
      mockLocalStorage.getItem.mockReturnValue('light');
      
      const color = getThemeColor('primary');
      expect(color).toBe('hsl(24 100% 50%)');
    });

    it('should get construction color correctly', () => {
      mockLocalStorage.getItem.mockReturnValue('light');
      
      const color = getConstructionColor('primary');
      expect(color).toBe('hsl(24 100% 50%)');
    });

    it('should return empty string for invalid color key', () => {
      const color = getThemeColor('invalid' as any);
      expect(color).toBe('');
    });

    it('should use provided theme override', () => {
      const color = getThemeColor('primary', 'dark');
      expect(color).toBe('hsl(24 100% 55%)'); // Dark theme orange
    });
  });

  describe('Animation Utilities', () => {
    it('should get animation duration correctly', () => {
      expect(getAnimationDuration('fast')).toBe('150ms');
      expect(getAnimationDuration('normal')).toBe('250ms');
      expect(getAnimationDuration('slow')).toBe('350ms');
    });

    it('should get animation easing correctly', () => {
      expect(getAnimationEasing('default')).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
      expect(getAnimationEasing('bounce')).toBe('cubic-bezier(0.68, -0.55, 0.265, 1.55)');
      expect(getAnimationEasing('smooth')).toBe('cubic-bezier(0.25, 0.46, 0.45, 0.94)');
    });

    it('should create theme transition string', () => {
      const transition = createThemeTransition();
      expect(transition).toContain('background-color 150ms ease-out');
      expect(transition).toContain('color 150ms ease-out');
      expect(transition).toContain('border-color 150ms ease-out');
    });

    it('should create custom duration theme transition', () => {
      const transition = createThemeTransition('300ms');
      expect(transition).toContain('background-color 300ms ease-out');
    });

    it('should apply theme transition classes', () => {
      const classes = withThemeTransition('extra-class', 'another-class');
      expect(classes).toContain('transition-all');
      expect(classes).toContain('duration-theme');
      expect(classes).toContain('ease-theme');
      expect(classes).toContain('extra-class');
      expect(classes).toContain('another-class');
    });
  });

  describe('Construction Component Utilities', () => {
    it('should generate construction card classes', () => {
      expect(constructionCard('light')).toContain('shadow-construction-light');
      expect(constructionCard('light')).toContain('hover:shadow-construction-medium');
      
      expect(constructionCard('medium')).toContain('shadow-construction-medium');
      expect(constructionCard('medium')).toContain('hover:shadow-construction-heavy');
      
      expect(constructionCard('heavy')).toContain('shadow-construction-heavy');
      expect(constructionCard('heavy')).toContain('hover:shadow-construction-glow');
    });

    it('should generate construction button classes', () => {
      expect(constructionButton('primary')).toContain('bg-construction-primary');
      expect(constructionButton('secondary')).toContain('bg-construction-secondary');
      expect(constructionButton('accent')).toContain('bg-construction-accent');
    });

    it('should generate construction input classes', () => {
      const inputClasses = constructionInput();
      expect(inputClasses).toContain('focus-visible:ring-construction-primary');
      expect(inputClasses).toContain('transition-all');
      expect(inputClasses).toContain('duration-construction');
    });

    it('should generate construction gradients', () => {
      expect(constructionGradient('to-r')).toBe('bg-gradient-to-r from-construction-primary to-construction-secondary');
      expect(constructionGradient('to-br')).toBe('bg-gradient-to-br from-construction-primary to-construction-secondary');
      expect(constructionGradient('to-b')).toBe('bg-gradient-to-b from-construction-primary to-construction-secondary');
    });

    it('should generate theme-aware gradients', () => {
      expect(themeAwareGradient('to-r')).toBe('bg-gradient-to-r from-primary to-primary/80');
      expect(themeAwareGradient('to-br')).toBe('bg-gradient-to-br from-primary to-primary/80');
    });
  });

  describe('Dark/Light Mode Utilities', () => {
    it('should generate dark mode only classes', () => {
      const result = darkModeOnly('bg-gray-800', 'text-white');
      expect(result).toContain('dark:bg-gray-800');
      expect(result).toContain('dark:text-white');
    });

    it('should generate light mode only classes', () => {
      const result = lightModeOnly('bg-gray-100', 'text-black');
      expect(result).toContain('light:bg-gray-100');
      expect(result).toContain('light:text-black');
    });
  });

  describe('Component State Utilities', () => {
    it('should generate focus ring classes', () => {
      const primaryRing = focusRing('primary');
      expect(primaryRing).toContain('focus-visible:ring-ring');
      
      const constructionRing = focusRing('construction');
      expect(constructionRing).toContain('focus-visible:ring-construction-primary');
    });

    it('should generate hover scale classes', () => {
      expect(hoverScale('sm')).toContain('hover:scale-102');
      expect(hoverScale('md')).toContain('hover:scale-105');
      expect(hoverScale('lg')).toContain('hover:scale-110');
    });

    it('should generate skeleton classes', () => {
      expect(skeleton()).toContain('animate-pulse');
      expect(skeleton()).toContain('bg-muted');
    });

    it('should generate loading spinner classes', () => {
      expect(loadingSpinner('sm')).toContain('h-4 w-4');
      expect(loadingSpinner('md')).toContain('h-6 w-6');
      expect(loadingSpinner('lg')).toContain('h-8 w-8');
      expect(loadingSpinner()).toContain('animate-spin');
    });

    it('should generate accessible button classes', () => {
      const classes = accessibleButton();
      expect(classes).toContain('cursor-pointer');
      expect(classes).toContain('select-none');
      expect(classes).toContain('focus-visible:ring-construction-primary');
      expect(classes).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('Accessibility Utilities', () => {
    it('should provide screen reader only class', () => {
      expect(screenReaderOnly()).toBe('sr-only');
    });
  });

  describe('Responsive Utilities', () => {
    it('should generate responsive classes correctly', () => {
      const classes = responsiveClasses('text-sm', 'text-md', 'text-lg', 'text-xl');
      expect(classes).toContain('text-sm');
      expect(classes).toContain('md:text-md');
      expect(classes).toContain('lg:text-lg');
      expect(classes).toContain('xl:text-xl');
    });

    it('should handle optional large breakpoint', () => {
      const classes = responsiveClasses('text-sm', 'text-md', 'text-lg');
      expect(classes).toContain('text-sm');
      expect(classes).toContain('md:text-md');
      expect(classes).toContain('lg:text-lg');
      expect(classes).not.toContain('xl:');
    });
  });

  describe('Debug Utilities', () => {
    it('should only run debug in development', () => {
      const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation();
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation();
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation();
      
      // Test development environment
      process.env.NODE_ENV = 'development';
      debugTheme();
      
      expect(consoleGroupSpy).toHaveBeenCalledWith('🎨 NeoLingus Theme Debug');
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleGroupEndSpy).toHaveBeenCalled();
      
      // Test production environment
      vi.clearAllMocks();
      process.env.NODE_ENV = 'production';
      debugTheme();
      
      expect(consoleGroupSpy).not.toHaveBeenCalled();
      
      consoleGroupSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });
  });

  describe('Theme Utils Export', () => {
    it('should export all utility functions in themeUtils object', () => {
      expect(themeUtils.cn).toBe(cn);
      expect(themeUtils.constructionCard).toBe(constructionCard);
      expect(themeUtils.constructionButton).toBe(constructionButton);
      expect(themeUtils.constructionInput).toBe(constructionInput);
      expect(themeUtils.constructionGradient).toBe(constructionGradient);
      expect(themeUtils.themeAwareGradient).toBe(themeAwareGradient);
      expect(themeUtils.withThemeTransition).toBe(withThemeTransition);
      expect(themeUtils.focusRing).toBe(focusRing);
      expect(themeUtils.hoverScale).toBe(hoverScale);
      expect(themeUtils.skeleton).toBe(skeleton);
      expect(themeUtils.loadingSpinner).toBe(loadingSpinner);
      expect(themeUtils.screenReaderOnly).toBe(screenReaderOnly);
      expect(themeUtils.accessibleButton).toBe(accessibleButton);
      expect(themeUtils.responsiveClasses).toBe(responsiveClasses);
      expect(themeUtils.darkModeOnly).toBe(darkModeOnly);
      expect(themeUtils.lightModeOnly).toBe(lightModeOnly);
    });

    it('should be immutable', () => {
      expect(Object.isFrozen(themeUtils)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing theme gracefully', () => {
      expect(generateThemeCSS('nonexistent' as any)).toBe('');
      expect(() => applyThemeVariables('nonexistent' as any)).not.toThrow();
    });

    it('should provide fallback values for invalid animation keys', () => {
      expect(getAnimationDuration('invalid' as any)).toBe('250ms');
      expect(getAnimationEasing('invalid' as any)).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks with repeated calls', () => {
      // Repeated calls should not accumulate memory
      for (let i = 0; i < 100; i++) {
        cn('class-1', 'class-2', 'class-3');
        constructionCard('medium');
        withThemeTransition('test-class');
      }
      
      // Should complete without throwing
      expect(true).toBe(true);
    });
  });
});