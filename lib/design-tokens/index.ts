/**
 * Comprehensive design tokens system for NeoLingus
 * Provides consistent spacing, typography, colors, and animation values
 */

// Spacing tokens (based on 4px grid)
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem',     // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem',    // 12px
  3.5: '0.875rem', // 14px
  4: '1rem',       // 16px
  5: '1.25rem',    // 20px
  6: '1.5rem',     // 24px
  7: '1.75rem',    // 28px
  8: '2rem',       // 32px
  9: '2.25rem',    // 36px
  10: '2.5rem',    // 40px
  11: '2.75rem',   // 44px
  12: '3rem',      // 48px
  14: '3.5rem',    // 56px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
  24: '6rem',      // 96px
  28: '7rem',      // 112px
  32: '8rem',      // 128px
  36: '9rem',      // 144px
  40: '10rem',     // 160px
  44: '11rem',     // 176px
  48: '12rem',     // 192px
  52: '13rem',     // 208px
  56: '14rem',     // 224px
  60: '15rem',     // 240px
  64: '16rem',     // 256px
  72: '18rem',     // 288px
  80: '20rem',     // 320px
  96: '24rem',     // 384px
} as const;

// Typography tokens
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['Fira Code', 'Monaco', 'Consolas', 'Courier New', 'monospace'],
    display: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],     // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],    // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],   // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
    '5xl': ['3rem', { lineHeight: '1' }],           // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],         // 72px
    '8xl': ['6rem', { lineHeight: '1' }],           // 96px
    '9xl': ['8rem', { lineHeight: '1' }],           // 128px
  },
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Border radius tokens
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

// Shadow tokens
export const shadows = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  base: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
  
  // Construction-themed shadows
  construction: {
    light: '0 2px 8px 0 rgb(251 146 60 / 0.15)',
    medium: '0 4px 12px 0 rgb(251 146 60 / 0.2)',
    heavy: '0 8px 20px 0 rgb(251 146 60 / 0.25)',
    glow: '0 0 20px 0 rgb(251 146 60 / 0.3)',
  },
} as const;

// Animation tokens
export const animations = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    construction: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Custom construction-themed easing
  },
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    fadeOut: {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    slideUp: {
      '0%': { transform: 'translateY(10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideDown: {
      '0%': { transform: 'translateY(-10px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    scaleIn: {
      '0%': { transform: 'scale(0.8)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    construction: {
      '0%': { transform: 'scale(0.9) rotate(-1deg)', opacity: '0' },
      '50%': { transform: 'scale(1.05) rotate(0.5deg)', opacity: '0.8' },
      '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
    },
  },
} as const;

// Z-index tokens
export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800,
} as const;

// Breakpoint tokens
export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Construction-specific design tokens
export const construction = {
  // Industry-inspired spacing patterns
  spacing: {
    foundation: spacing[2], // 8px - base unit like foundation depth
    beam: spacing[4],       // 16px - structural beam width
    wall: spacing[6],       // 24px - standard wall thickness
    room: spacing[12],      // 48px - room-scale spacing
    floor: spacing[16],     // 64px - floor-to-floor height scale
    building: spacing[32],  // 128px - building-scale spacing
  },
  
  // Construction-themed border radius
  edges: {
    sharp: borderRadius.none,      // Industrial sharp edges
    beveled: borderRadius.sm,      // Slightly beveled
    rounded: borderRadius.base,    // Standard construction curves
    smooth: borderRadius.lg,       // Smooth professional finish
    curved: borderRadius.xl,       // Architectural curves
  },
  
  // Material-inspired shadows
  materials: {
    concrete: shadows.base,
    steel: shadows.lg,
    glass: shadows.xl,
    wood: shadows.md,
    safety: shadows.construction.light,
  },
  
  // Construction timing patterns
  timing: {
    quick: animations.duration[150],    // Quick tool movements
    standard: animations.duration[300], // Standard construction pace
    heavy: animations.duration[500],    // Heavy machinery timing
    precision: animations.duration[700], // Precision work timing
  },
} as const;

// Theme-aware token helpers
export const themeAware = {
  text: {
    primary: 'hsl(var(--foreground))',
    secondary: 'hsl(var(--muted-foreground))',
    construction: 'hsl(var(--construction-primary))',
    inverse: 'hsl(var(--background))',
  },
  background: {
    primary: 'hsl(var(--background))',
    secondary: 'hsl(var(--muted))',
    card: 'hsl(var(--card))',
    construction: 'hsl(var(--construction-primary) / 0.1)',
  },
  border: {
    primary: 'hsl(var(--border))',
    construction: 'hsl(var(--construction-primary))',
    accent: 'hsl(var(--accent))',
  },
} as const;

// Utility functions
export function getSpacing(key: keyof typeof spacing): string {
  return spacing[key];
}

export function getFontSize(key: keyof typeof typography.fontSize): [string, { lineHeight: string }] {
  return typography.fontSize[key];
}

export function getShadow(key: keyof typeof shadows): string {
  return shadows[key];
}

export function getConstructionShadow(key: keyof typeof shadows.construction): string {
  return shadows.construction[key];
}

export function getBorderRadius(key: keyof typeof borderRadius): string {
  return borderRadius[key];
}

export function getAnimationDuration(key: keyof typeof animations.duration): string {
  return animations.duration[key];
}

export function getAnimationEasing(key: keyof typeof animations.easing): string {
  return animations.easing[key];
}

export function getZIndex(key: keyof typeof zIndex): number | string {
  return zIndex[key];
}

export function getBreakpoint(key: keyof typeof breakpoints): string {
  return breakpoints[key];
}

// Export all tokens as a single object for easy consumption
export const designTokens = Object.freeze({
  spacing: Object.freeze(spacing),
  typography: Object.freeze(typography),
  borderRadius: Object.freeze(borderRadius),
  shadows: Object.freeze(shadows),
  animations: Object.freeze(animations),
  zIndex: Object.freeze(zIndex),
  breakpoints: Object.freeze(breakpoints),
  construction: Object.freeze(construction),
  themeAware: Object.freeze(themeAware),
}) as const;

export default designTokens;