/**
 * Enhanced Theme Provider for NeoLingus
 * Provides construction-themed dark/light mode with comprehensive theme management
 */

'use client';

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { 
  themeConfigs, 
  generateCSSVariables, 
  type ThemeName,
  type ThemeConfig,
} from '@/lib/themes/enhanced-theme-config';

// Theme context interface
interface ThemeContextValue {
  theme: ThemeName | 'system';
  setTheme: (theme: ThemeName | 'system') => void;
  systemTheme: ThemeName;
  resolvedTheme: ThemeName;
  themeConfig: ThemeConfig;
  isLoaded: boolean;
}

// Enhanced theme provider props
interface EnhancedThemeProviderProps {
  children: ReactNode;
  attribute?: 'class' | 'data-theme';
  defaultTheme?: ThemeName | 'system';
  enableSystem?: boolean;
  storageKey?: string;
  themes?: ThemeName[];
  value?: ThemeName;
  disableTransitionOnChange?: boolean;
}

// Create theme context
const ThemeContext = createContext<ThemeContextValue | null>(null);

// System theme detection hook
const useSystemTheme = (): ThemeName => {
  const [systemTheme, setSystemTheme] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return systemTheme;
};

// Local storage hook with error handling
const useLocalStorage = (key: string, defaultValue: string) => {
  const [value, setValue] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item || defaultValue;
    } catch (error) {
      console.warn(`Failed to read localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((newValue: string) => {
    setValue(newValue);
    
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, newValue);
    } catch (error) {
      console.warn(`Failed to write localStorage key "${key}":`, error);
    }
  }, [key]);

  return [value, setStoredValue] as const;
};

// Enhanced Theme Provider Component
export const EnhancedThemeProvider: React.FC<EnhancedThemeProviderProps> = ({
  children,
  attribute = 'class',
  defaultTheme = 'system',
  enableSystem = true,
  storageKey = 'neolingus-theme',
  themes = ['light', 'dark'],
  value,
  disableTransitionOnChange = false,
}) => {
  const systemTheme = useSystemTheme();
  const [storedTheme, setStoredTheme] = useLocalStorage(storageKey, defaultTheme);
  const [isLoaded, setIsLoaded] = useState(false);
  const mountedRef = useRef(false);

  // Determine current theme
  const currentTheme = value || storedTheme;
  const resolvedTheme = currentTheme === 'system' ? systemTheme : currentTheme as ThemeName;
  
  // Get theme configuration
  const themeConfig = themeConfigs[resolvedTheme] || themeConfigs.light;

  // Apply theme to document
  const applyTheme = useCallback((theme: ThemeName) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Temporarily disable transitions during theme change
    if (disableTransitionOnChange) {
      const css = document.createElement('style');
      css.appendChild(document.createTextNode('*,*::before,*::after{transition:none!important;animation:none!important;}'));
      document.head.appendChild(css);
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.head.removeChild(css);
        });
      });
    }

    // Apply theme attribute
    if (attribute === 'class') {
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
    } else if (attribute === 'data-theme') {
      root.setAttribute('data-theme', theme);
    }

    // Apply CSS custom properties
    const themeConfig = themeConfigs[theme];
    if (themeConfig) {
      const variables = generateCSSVariables(themeConfig);
      Object.entries(variables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }
  }, [attribute, disableTransitionOnChange]);

  // Theme change handler
  const setTheme = useCallback((newTheme: ThemeName | 'system') => {
    if (!mountedRef.current) return;
    
    setStoredTheme(newTheme);
    
    const resolvedNewTheme = newTheme === 'system' ? systemTheme : newTheme as ThemeName;
    applyTheme(resolvedNewTheme);
  }, [systemTheme, setStoredTheme, applyTheme]);

  // Initialize theme on mount
  useEffect(() => {
    mountedRef.current = true;
    
    // Validate stored theme
    const validThemes = [...themes, 'system'];
    const initialTheme = validThemes.includes(currentTheme) ? currentTheme : defaultTheme;
    
    if (initialTheme !== currentTheme) {
      setStoredTheme(initialTheme);
    }
    
    // Apply initial theme
    const resolvedInitialTheme = initialTheme === 'system' ? systemTheme : initialTheme as ThemeName;
    applyTheme(resolvedInitialTheme);
    
    setIsLoaded(true);
    
    return () => {
      mountedRef.current = false;
    };
  }, [currentTheme, defaultTheme, themes, systemTheme, setStoredTheme, applyTheme]);

  // Update theme when system theme changes
  useEffect(() => {
    if (currentTheme === 'system') {
      applyTheme(systemTheme);
    }
  }, [systemTheme, currentTheme, applyTheme]);

  // Context value
  const contextValue: ThemeContextValue = {
    theme: currentTheme as ThemeName | 'system',
    setTheme,
    systemTheme,
    resolvedTheme,
    themeConfig,
    isLoaded,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useEnhancedTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    console.error('useEnhancedTheme must be used within an EnhancedThemeProvider');
    // Provide fallback values for development
    return {
      theme: 'light',
      setTheme: () => {},
      systemTheme: 'light',
      resolvedTheme: 'light',
      themeConfig: themeConfigs.light,
      isLoaded: false,
    };
  }
  
  return context;
};

// Theme toggle component
export const ThemeToggle: React.FC<{
  className?: string;
  showSystemOption?: boolean;
}> = ({ 
  className = '', 
  showSystemOption = true 
}) => {
  const { theme, setTheme, systemTheme } = useEnhancedTheme();
  
  const cycleTheme = () => {
    if (showSystemOption) {
      switch (theme) {
        case 'light':
          setTheme('dark');
          break;
        case 'dark':
          setTheme('system');
          break;
        case 'system':
        default:
          setTheme('light');
          break;
      }
    } else {
      setTheme(theme === 'light' ? 'dark' : 'light');
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      case 'system':
        return systemTheme === 'dark' ? '🌙' : '☀️';
      default:
        return '☀️';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return `System (${systemTheme})`;
      default:
        return 'Light';
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-construction-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9 ${className}`}
      title={`Current theme: ${getThemeLabel()}. Click to cycle themes.`}
    >
      <span className="sr-only">Toggle theme</span>
      <span className="text-lg">{getThemeIcon()}</span>
    </button>
  );
};

// Export for backward compatibility
export default EnhancedThemeProvider;