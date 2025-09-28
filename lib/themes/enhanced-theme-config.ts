/**
 * Enhanced theme configuration for NeoLingus construction-themed platform
 * Provides comprehensive design tokens for light, dark, and system themes
 */

export interface ThemeColors {
  // Core brand colors
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  
  // Construction-specific colors
  construction: {
    primary: string;
    secondary: string;
    accent: string;
    warning: string;
    safety: string;
  };
  
  // Background system
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  
  // Feedback colors
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  info: string;
  infoForeground: string;
  
  // Interactive elements
  border: string;
  input: string;
  ring: string;
  
  // Chart colors
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export interface ThemeConfig {
  name: string;
  displayName: string;
  colors: ThemeColors;
  radius: string;
  typography: {
    fontFamily: string;
    headingWeight: string;
    bodyWeight: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      default: string;
      bounce: string;
      smooth: string;
    };
  };
}

export const lightTheme: ThemeConfig = {
  name: "light",
  displayName: "Light Mode",
  colors: {
    // Core brand - construction orange/yellow theme
    primary: "hsl(24 100% 50%)", // Construction orange
    primaryForeground: "hsl(0 0% 98%)",
    secondary: "hsl(210 40% 98%)",
    secondaryForeground: "hsl(222.2 84% 4.9%)",
    
    // Construction-specific palette
    construction: {
      primary: "hsl(24 100% 50%)", // Vibrant orange
      secondary: "hsl(45 100% 55%)", // Construction yellow
      accent: "hsl(16 100% 45%)", // Deeper orange
      warning: "hsl(48 96% 53%)", // Safety yellow
      safety: "hsl(120 100% 25%)", // Safety green
    },
    
    // Background system - warm neutrals
    background: "hsl(0 0% 100%)",
    foreground: "hsl(222.2 84% 4.9%)",
    card: "hsl(0 0% 100%)",
    cardForeground: "hsl(222.2 84% 4.9%)",
    popover: "hsl(0 0% 100%)",
    popoverForeground: "hsl(222.2 84% 4.9%)",
    
    // Muted system with construction theme
    muted: "hsl(30 40% 96%)", // Warm muted
    mutedForeground: "hsl(215.4 16.3% 46.9%)",
    accent: "hsl(30 40% 94%)", // Warm accent
    accentForeground: "hsl(222.2 84% 4.9%)",
    
    // Feedback colors
    destructive: "hsl(0 84.2% 60.2%)",
    destructiveForeground: "hsl(0 0% 98%)",
    success: "hsl(142 76% 36%)",
    successForeground: "hsl(0 0% 98%)",
    warning: "hsl(38 92% 50%)",
    warningForeground: "hsl(0 0% 3.9%)",
    info: "hsl(199 89% 48%)",
    infoForeground: "hsl(0 0% 98%)",
    
    // Interactive elements
    border: "hsl(214.3 31.8% 91.4%)",
    input: "hsl(214.3 31.8% 91.4%)",
    ring: "hsl(24 100% 50%)", // Construction orange ring
    
    // Chart colors - construction themed
    chart1: "hsl(24 100% 50%)", // Construction orange
    chart2: "hsl(45 100% 55%)", // Construction yellow  
    chart3: "hsl(16 100% 45%)", // Deeper orange
    chart4: "hsl(200 100% 40%)", // Construction blue
    chart5: "hsl(120 100% 25%)", // Safety green
  },
  radius: "0.5rem",
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    headingWeight: "700",
    bodyWeight: "400",
  },
  animations: {
    duration: {
      fast: "150ms",
      normal: "250ms",
      slow: "350ms",
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    },
  },
};

export const darkTheme: ThemeConfig = {
  name: "dark",
  displayName: "Dark Mode",
  colors: {
    // Core brand - enhanced for dark mode
    primary: "hsl(24 100% 55%)", // Slightly brighter orange for dark
    primaryForeground: "hsl(222.2 84% 4.9%)",
    secondary: "hsl(217.2 32.6% 17.5%)",
    secondaryForeground: "hsl(210 40% 98%)",
    
    // Construction-specific palette for dark mode
    construction: {
      primary: "hsl(24 100% 55%)", // Brighter orange for contrast
      secondary: "hsl(45 100% 60%)", // Brighter yellow for contrast
      accent: "hsl(16 100% 50%)", // Enhanced orange
      warning: "hsl(48 96% 58%)", // Enhanced safety yellow
      safety: "hsl(120 100% 30%)", // Enhanced safety green
    },
    
    // Dark background system
    background: "hsl(222.2 84% 4.9%)",
    foreground: "hsl(210 40% 98%)",
    card: "hsl(222.2 84% 4.9%)",
    cardForeground: "hsl(210 40% 98%)",
    popover: "hsl(222.2 84% 4.9%)",
    popoverForeground: "hsl(210 40% 98%)",
    
    // Dark muted system
    muted: "hsl(217.2 32.6% 17.5%)",
    mutedForeground: "hsl(215 20.2% 65.1%)",
    accent: "hsl(217.2 32.6% 17.5%)",
    accentForeground: "hsl(210 40% 98%)",
    
    // Dark feedback colors
    destructive: "hsl(0 62.8% 30.6%)",
    destructiveForeground: "hsl(210 40% 98%)",
    success: "hsl(142 71% 45%)",
    successForeground: "hsl(210 40% 98%)",
    warning: "hsl(38 92% 50%)",
    warningForeground: "hsl(222.2 84% 4.9%)",
    info: "hsl(199 89% 48%)",
    infoForeground: "hsl(210 40% 98%)",
    
    // Dark interactive elements
    border: "hsl(217.2 32.6% 17.5%)",
    input: "hsl(217.2 32.6% 17.5%)",
    ring: "hsl(24 100% 55%)", // Enhanced construction orange ring
    
    // Dark chart colors - enhanced for visibility
    chart1: "hsl(24 100% 55%)", // Enhanced construction orange
    chart2: "hsl(45 100% 60%)", // Enhanced construction yellow
    chart3: "hsl(16 100% 50%)", // Enhanced deeper orange
    chart4: "hsl(200 100% 45%)", // Enhanced construction blue
    chart5: "hsl(120 100% 30%)", // Enhanced safety green
  },
  radius: "0.5rem",
  typography: {
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    headingWeight: "700",
    bodyWeight: "400",
  },
  animations: {
    duration: {
      fast: "150ms",
      normal: "250ms",
      slow: "350ms",
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    },
  },
};

export const themeConfigs = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type ThemeName = keyof typeof themeConfigs;

export const defaultTheme: ThemeName = "light";

// Helper functions
export function getThemeConfig(theme: ThemeName): ThemeConfig {
  return themeConfigs[theme];
}

export function generateCSSVariables(config: ThemeConfig): Record<string, string> {
  const vars: Record<string, string> = {};
  
  // Convert theme colors to CSS variables
  Object.entries(config.colors).forEach(([key, value]) => {
    if (typeof value === 'object') {
      // Handle nested objects like construction colors
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        vars[`--${key}-${nestedKey}`] = nestedValue.replace('hsl(', '').replace(')', '');
      });
    } else {
      vars[`--${key}`] = value.replace('hsl(', '').replace(')', '');
    }
  });
  
  // Add other theme properties
  vars['--radius'] = config.radius;
  
  return vars;
}

export const constructionBrandColors = {
  orange: {
    50: "hsl(33 100% 96%)",
    100: "hsl(34 100% 92%)",
    200: "hsl(32 100% 83%)",
    300: "hsl(31 100% 72%)",
    400: "hsl(27 100% 61%)",
    500: "hsl(24 100% 50%)", // Primary
    600: "hsl(21 100% 45%)",
    700: "hsl(17 100% 40%)",
    800: "hsl(15 100% 34%)",
    900: "hsl(15 100% 28%)",
    950: "hsl(13 100% 15%)",
  },
  yellow: {
    50: "hsl(48 100% 96%)",
    100: "hsl(48 100% 88%)",
    200: "hsl(48 95% 76%)",
    300: "hsl(46 93% 65%)",
    400: "hsl(43 96% 56%)",
    500: "hsl(45 100% 55%)", // Secondary
    600: "hsl(42 100% 50%)",
    700: "hsl(36 100% 43%)",
    800: "hsl(30 100% 36%)",
    900: "hsl(26 100% 30%)",
    950: "hsl(21 100% 16%)",
  },
};