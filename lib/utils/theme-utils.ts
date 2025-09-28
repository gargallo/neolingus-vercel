/**
 * Theme-aware utility functions for NeoLingus
 * Provides helpers for theme detection, CSS generation, and component styling
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { themeConfigs, type ThemeName, generateCSSVariables } from "@/lib/themes/enhanced-theme-config";

// Enhanced className utility with theme awareness
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Theme detection utilities
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(storageKey: string = 'neolingus-theme'): ThemeName | null {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(storageKey);
  if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
    return stored as ThemeName;
  }
  
  return null;
}

export function setStoredTheme(theme: ThemeName | 'system', storageKey: string = 'neolingus-theme'): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(storageKey, theme);
}

export function resolveTheme(theme: ThemeName | 'system'): ThemeName {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

// CSS variable generation
export function generateThemeCSS(theme: ThemeName): string {
  const config = themeConfigs[theme];
  if (!config) return '';
  
  const variables = generateCSSVariables(config);
  
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
}

export function applyThemeVariables(theme: ThemeName): void {
  if (typeof document === 'undefined') return;
  
  const config = themeConfigs[theme];
  if (!config) return;
  
  const variables = generateCSSVariables(config);
  const root = document.documentElement;
  
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

// Theme-aware component utilities
export function getThemeColor(color: keyof typeof themeConfigs.light.colors, theme?: ThemeName): string {
  const currentTheme = theme || (getStoredTheme() || 'light');
  const config = themeConfigs[currentTheme];
  
  if (!config) return '';
  
  const colorValue = config.colors[color];
  if (typeof colorValue === 'string') {
    return colorValue;
  }
  
  return '';
}

export function getConstructionColor(color: keyof typeof themeConfigs.light.colors.construction, theme?: ThemeName): string {
  const currentTheme = theme || (getStoredTheme() || 'light');
  const config = themeConfigs[currentTheme];
  
  if (!config) return '';
  
  return config.colors.construction[color];
}

// Animation utilities
export function getAnimationDuration(speed: 'fast' | 'normal' | 'slow' = 'normal', theme?: ThemeName): string {
  const currentTheme = theme || (getStoredTheme() || 'light');
  const config = themeConfigs[currentTheme];
  
  if (!config) return '250ms';
  
  return config.animations.duration[speed];
}

export function getAnimationEasing(type: 'default' | 'bounce' | 'smooth' = 'default', theme?: ThemeName): string {
  const currentTheme = theme || (getStoredTheme() || 'light');
  const config = themeConfigs[currentTheme];
  
  if (!config) return 'cubic-bezier(0.4, 0, 0.2, 1)';
  
  return config.animations.easing[type];
}

// Theme transition utilities
export function createThemeTransition(duration: string = '150ms'): string {
  return `background-color ${duration} ease-out, border-color ${duration} ease-out, color ${duration} ease-out, fill ${duration} ease-out, stroke ${duration} ease-out, opacity ${duration} ease-out, box-shadow ${duration} ease-out, transform ${duration} ease-out`;
}

export function withThemeTransition(...classes: string[]): string {
  return cn(
    'transition-all duration-theme ease-theme',
    ...classes
  );
}

// Construction-themed component utilities
export function constructionCard(variant: 'light' | 'medium' | 'heavy' = 'medium'): string {
  const baseClasses = 'bg-card border border-border rounded-lg transition-all duration-construction ease-construction';
  
  const variants = {
    light: 'shadow-construction-light hover:shadow-construction-medium',
    medium: 'shadow-construction-medium hover:shadow-construction-heavy',
    heavy: 'shadow-construction-heavy hover:shadow-construction-glow',
  };
  
  return cn(baseClasses, variants[variant]);
}

export function constructionButton(variant: 'primary' | 'secondary' | 'accent' = 'primary'): string {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all duration-construction ease-construction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
  
  const variants = {
    primary: 'bg-construction-primary text-white hover:bg-construction-primary/90 shadow-construction-light hover:shadow-construction-medium',
    secondary: 'bg-construction-secondary text-white hover:bg-construction-secondary/90 shadow-construction-light hover:shadow-construction-medium',
    accent: 'bg-construction-accent text-white hover:bg-construction-accent/90 shadow-construction-light hover:shadow-construction-medium',
  };
  
  return cn(baseClasses, variants[variant]);
}

export function constructionInput(): string {
  return cn(
    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-construction-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    'transition-all duration-construction ease-construction'
  );
}

// Responsive utilities with theme awareness
export function responsiveClasses(
  mobile: string,
  tablet: string,
  desktop: string,
  large?: string
): string {
  return cn(
    mobile,
    `md:${tablet}`,
    `lg:${desktop}`,
    large ? `xl:${large}` : ''
  );
}

// Theme-aware gradient utilities
export function constructionGradient(direction: 'to-r' | 'to-br' | 'to-b' = 'to-r'): string {
  return `bg-gradient-${direction} from-construction-primary to-construction-secondary`;
}

export function themeAwareGradient(direction: 'to-r' | 'to-br' | 'to-b' = 'to-r'): string {
  return `bg-gradient-${direction} from-primary to-primary/80`;
}

// Dark mode specific utilities
export function darkModeOnly(...classes: string[]): string {
  return cn(
    classes.map(cls => `dark:${cls}`)
  );
}

export function lightModeOnly(...classes: string[]): string {
  return cn(
    classes.map(cls => `light:${cls}`)
  );
}

// Component state utilities
export function focusRing(color: 'primary' | 'construction' = 'construction'): string {
  const colors = {
    primary: 'focus-visible:ring-ring',
    construction: 'focus-visible:ring-construction-primary',
  };
  
  return cn(
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-background',
    colors[color]
  );
}

export function hoverScale(scale: 'sm' | 'md' | 'lg' = 'md'): string {
  const scales = {
    sm: 'hover:scale-102',
    md: 'hover:scale-105',
    lg: 'hover:scale-110',
  };
  
  return cn(
    'transform transition-transform duration-construction ease-construction',
    scales[scale]
  );
}

// Loading and skeleton utilities
export function skeleton(): string {
  return cn(
    'animate-pulse rounded-md bg-muted'
  );
}

export function loadingSpinner(size: 'sm' | 'md' | 'lg' = 'md'): string {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };
  
  return cn(
    'animate-spin rounded-full border-2 border-current border-t-transparent',
    sizes[size]
  );
}

// Accessibility utilities
export function screenReaderOnly(): string {
  return 'sr-only';
}

export function accessibleButton(): string {
  return cn(
    'cursor-pointer select-none',
    focusRing(),
    'disabled:cursor-not-allowed disabled:opacity-50'
  );
}

// Theme debugging utilities (development only)
export function debugTheme(): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const currentTheme = getStoredTheme() || 'light';
  const systemTheme = getSystemTheme();
  
  console.group('🎨 NeoLingus Theme Debug');
  console.log('Current stored theme:', currentTheme);
  console.log('System preference:', systemTheme);
  console.log('Resolved theme:', resolveTheme(currentTheme));
  console.log('Available themes:', Object.keys(themeConfigs));
  console.groupEnd();
}

// Export commonly used combinations
export const themeUtils = {
  cn,
  constructionCard,
  constructionButton,
  constructionInput,
  constructionGradient,
  themeAwareGradient,
  withThemeTransition,
  focusRing,
  hoverScale,
  skeleton,
  loadingSpinner,
  screenReaderOnly,
  accessibleButton,
  responsiveClasses,
  darkModeOnly,
  lightModeOnly,
} as const;

export default themeUtils;