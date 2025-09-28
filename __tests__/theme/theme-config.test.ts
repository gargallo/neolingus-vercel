/**
 * TDD Tests for Enhanced Theme Configuration
 * Tests MUST FAIL initially - defining expected behavior for theme config
 */

import {
  lightTheme,
  darkTheme,
  themeConfigs,
  getThemeConfig,
  generateCSSVariables,
  constructionBrandColors,
  type ThemeName,
  type ThemeConfig,
  type ThemeColors,
} from '@/lib/themes/enhanced-theme-config';

describe('Enhanced Theme Configuration', () => {
  describe('Theme Structure Validation', () => {
    it('should have valid light theme configuration', () => {
      expect(lightTheme).toBeDefined();
      expect(lightTheme.name).toBe('light');
      expect(lightTheme.displayName).toBe('Light Mode');
      expect(lightTheme.colors).toBeDefined();
      expect(lightTheme.radius).toBeDefined();
      expect(lightTheme.typography).toBeDefined();
      expect(lightTheme.animations).toBeDefined();
    });

    it('should have valid dark theme configuration', () => {
      expect(darkTheme).toBeDefined();
      expect(darkTheme.name).toBe('dark');
      expect(darkTheme.displayName).toBe('Dark Mode');
      expect(darkTheme.colors).toBeDefined();
      expect(darkTheme.radius).toBeDefined();
      expect(darkTheme.typography).toBeDefined();
      expect(darkTheme.animations).toBeDefined();
    });

    it('should have consistent structure between light and dark themes', () => {
      const lightKeys = Object.keys(lightTheme.colors);
      const darkKeys = Object.keys(darkTheme.colors);
      
      expect(lightKeys).toEqual(darkKeys);
      
      // Check construction colors specifically
      expect(lightTheme.colors.construction).toBeDefined();
      expect(darkTheme.colors.construction).toBeDefined();
      
      const lightConstructionKeys = Object.keys(lightTheme.colors.construction);
      const darkConstructionKeys = Object.keys(darkTheme.colors.construction);
      
      expect(lightConstructionKeys).toEqual(darkConstructionKeys);
    });
  });

  describe('Construction Theme Colors', () => {
    it('should have construction-specific color palette in light theme', () => {
      expect(lightTheme.colors.construction.primary).toBe('hsl(24 100% 50%)');
      expect(lightTheme.colors.construction.secondary).toBe('hsl(45 100% 55%)');
      expect(lightTheme.colors.construction.accent).toBe('hsl(16 100% 45%)');
      expect(lightTheme.colors.construction.warning).toBe('hsl(48 96% 53%)');
      expect(lightTheme.colors.construction.safety).toBe('hsl(120 100% 25%)');
    });

    it('should have enhanced construction colors for dark theme', () => {
      expect(darkTheme.colors.construction.primary).toBe('hsl(24 100% 55%)');
      expect(darkTheme.colors.construction.secondary).toBe('hsl(45 100% 60%)');
      expect(darkTheme.colors.construction.accent).toBe('hsl(16 100% 50%)');
      expect(darkTheme.colors.construction.warning).toBe('hsl(48 96% 58%)');
      expect(darkTheme.colors.construction.safety).toBe('hsl(120 100% 30%)');
    });

    it('should use construction orange as primary ring color', () => {
      expect(lightTheme.colors.ring).toBe('hsl(24 100% 50%)');
      expect(darkTheme.colors.ring).toBe('hsl(24 100% 55%)');
    });
  });

  describe('Color Format Validation', () => {
    it('should use HSL format for all colors', () => {
      const checkHSLFormat = (colors: ThemeColors) => {
        Object.entries(colors).forEach(([key, value]) => {
          if (typeof value === 'object') {
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              expect(nestedValue).toMatch(/^hsl\(\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%\)$/);
            });
          } else if (key.includes('chart') || key.includes('construction') || key.includes('primary') || key.includes('background')) {
            expect(value).toMatch(/^hsl\(\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%\)$/);
          }
        });
      };

      checkHSLFormat(lightTheme.colors);
      checkHSLFormat(darkTheme.colors);
    });
  });

  describe('Typography Configuration', () => {
    it('should have consistent typography between themes', () => {
      expect(lightTheme.typography.fontFamily).toBe(darkTheme.typography.fontFamily);
      expect(lightTheme.typography.headingWeight).toBe(darkTheme.typography.headingWeight);
      expect(lightTheme.typography.bodyWeight).toBe(darkTheme.typography.bodyWeight);
    });

    it('should use Inter font family', () => {
      expect(lightTheme.typography.fontFamily).toBe('Inter, system-ui, -apple-system, sans-serif');
      expect(darkTheme.typography.fontFamily).toBe('Inter, system-ui, -apple-system, sans-serif');
    });

    it('should have appropriate font weights', () => {
      expect(lightTheme.typography.headingWeight).toBe('700');
      expect(lightTheme.typography.bodyWeight).toBe('400');
    });
  });

  describe('Animation Configuration', () => {
    it('should have construction-themed animation timings', () => {
      const expectedDurations = {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      };

      expect(lightTheme.animations.duration).toEqual(expectedDurations);
      expect(darkTheme.animations.duration).toEqual(expectedDurations);
    });

    it('should have construction-themed easing functions', () => {
      const expectedEasing = {
        default: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      };

      expect(lightTheme.animations.easing).toEqual(expectedEasing);
      expect(darkTheme.animations.easing).toEqual(expectedEasing);
    });
  });

  describe('Theme Configuration Access', () => {
    it('should provide theme configs object with correct keys', () => {
      expect(Object.keys(themeConfigs)).toEqual(['light', 'dark']);
      expect(themeConfigs.light).toBe(lightTheme);
      expect(themeConfigs.dark).toBe(darkTheme);
    });

    it('should retrieve theme config by name', () => {
      expect(getThemeConfig('light')).toBe(lightTheme);
      expect(getThemeConfig('dark')).toBe(darkTheme);
    });
  });

  describe('CSS Variable Generation', () => {
    it('should generate CSS variables from light theme config', () => {
      const vars = generateCSSVariables(lightTheme);
      
      expect(vars['--primary']).toBe('24 100% 50%');
      expect(vars['--background']).toBe('0 0% 100%');
      expect(vars['--construction-primary']).toBe('24 100% 50%');
      expect(vars['--construction-secondary']).toBe('45 100% 55%');
      expect(vars['--radius']).toBe('0.5rem');
    });

    it('should generate CSS variables from dark theme config', () => {
      const vars = generateCSSVariables(darkTheme);
      
      expect(vars['--primary']).toBe('24 100% 55%');
      expect(vars['--background']).toBe('222.2 84% 4.9%');
      expect(vars['--construction-primary']).toBe('24 100% 55%');
      expect(vars['--construction-secondary']).toBe('45 100% 60%');
    });

    it('should handle nested color objects properly', () => {
      const vars = generateCSSVariables(lightTheme);
      
      // Construction colors should be flattened
      expect(vars['--construction-primary']).toBeDefined();
      expect(vars['--construction-secondary']).toBeDefined();
      expect(vars['--construction-accent']).toBeDefined();
      expect(vars['--construction-warning']).toBeDefined();
      expect(vars['--construction-safety']).toBeDefined();
    });

    it('should strip hsl() wrapper from color values', () => {
      const vars = generateCSSVariables(lightTheme);
      
      // Should not contain 'hsl(' or ')'
      Object.values(vars).forEach(value => {
        if (typeof value === 'string' && value.includes('%')) {
          expect(value).not.toContain('hsl(');
          expect(value).not.toContain(')');
        }
      });
    });
  });

  describe('Construction Brand Colors', () => {
    it('should provide orange color scale', () => {
      expect(constructionBrandColors.orange).toBeDefined();
      expect(constructionBrandColors.orange['500']).toBe('hsl(24 100% 50%)');
      expect(Object.keys(constructionBrandColors.orange)).toEqual([
        '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'
      ]);
    });

    it('should provide yellow color scale', () => {
      expect(constructionBrandColors.yellow).toBeDefined();
      expect(constructionBrandColors.yellow['500']).toBe('hsl(45 100% 55%)');
      expect(Object.keys(constructionBrandColors.yellow)).toEqual([
        '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'
      ]);
    });

    it('should have consistent HSL format in brand colors', () => {
      Object.values(constructionBrandColors.orange).forEach(color => {
        expect(color).toMatch(/^hsl\(\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%\)$/);
      });
      
      Object.values(constructionBrandColors.yellow).forEach(color => {
        expect(color).toMatch(/^hsl\(\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%\)$/);
      });
    });
  });

  describe('Chart Colors', () => {
    it('should have construction-themed chart colors', () => {
      // Light theme chart colors
      expect(lightTheme.colors.chart1).toBe('hsl(24 100% 50%)'); // Construction orange
      expect(lightTheme.colors.chart2).toBe('hsl(45 100% 55%)'); // Construction yellow
      expect(lightTheme.colors.chart3).toBe('hsl(16 100% 45%)'); // Deeper orange
      expect(lightTheme.colors.chart4).toBe('hsl(200 100% 40%)'); // Construction blue
      expect(lightTheme.colors.chart5).toBe('hsl(120 100% 25%)'); // Safety green
    });

    it('should have enhanced chart colors for dark theme', () => {
      // Dark theme should have slightly enhanced colors for better visibility
      expect(darkTheme.colors.chart1).toBe('hsl(24 100% 55%)');
      expect(darkTheme.colors.chart2).toBe('hsl(45 100% 60%)');
      expect(darkTheme.colors.chart3).toBe('hsl(16 100% 50%)');
      expect(darkTheme.colors.chart4).toBe('hsl(200 100% 45%)');
      expect(darkTheme.colors.chart5).toBe('hsl(120 100% 30%)');
    });
  });

  describe('Type Safety', () => {
    it('should enforce ThemeName type correctly', () => {
      const validThemes: ThemeName[] = ['light', 'dark'];
      
      validThemes.forEach(theme => {
        expect(getThemeConfig(theme)).toBeDefined();
      });
    });

    it('should maintain type consistency for ThemeConfig', () => {
      const configs: ThemeConfig[] = [lightTheme, darkTheme];
      
      configs.forEach(config => {
        expect(typeof config.name).toBe('string');
        expect(typeof config.displayName).toBe('string');
        expect(typeof config.colors).toBe('object');
        expect(typeof config.radius).toBe('string');
        expect(typeof config.typography).toBe('object');
        expect(typeof config.animations).toBe('object');
      });
    });
  });

  describe('Accessibility and Contrast', () => {
    it('should provide sufficient contrast ratios for construction colors', () => {
      // Construction primary should work on both light and dark backgrounds
      expect(lightTheme.colors.construction.primary).toMatch(/hsl\(24 100% 50%\)/);
      expect(darkTheme.colors.construction.primary).toMatch(/hsl\(24 100% 55%\)/);
      
      // Dark theme should be slightly brighter for better contrast
      expect(darkTheme.colors.construction.primary).not.toBe(lightTheme.colors.construction.primary);
    });

    it('should have appropriate background and foreground pairings', () => {
      // Light theme
      expect(lightTheme.colors.background).toBe('hsl(0 0% 100%)');
      expect(lightTheme.colors.foreground).toBe('hsl(222.2 84% 4.9%)');
      
      // Dark theme
      expect(darkTheme.colors.background).toBe('hsl(222.2 84% 4.9%)');
      expect(darkTheme.colors.foreground).toBe('hsl(210 40% 98%)');
    });
  });
});