/**
 * Construction-themed Theme Toggle Component
 * Provides a professional construction-style theme toggle with animations
 */

'use client';

import React, { useState } from 'react';
import { useEnhancedTheme } from '@/components/providers/enhanced-theme-provider';
import { cn, constructionButton, withThemeTransition, hoverScale } from '@/lib/utils/theme-utils';

interface ConstructionThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button' | 'dropdown';
  showLabel?: boolean;
  showSystemOption?: boolean;
}

const ConstructionThemeToggle: React.FC<ConstructionThemeToggleProps> = ({
  className,
  size = 'md',
  variant = 'icon',
  showLabel = false,
  showSystemOption = true,
}) => {
  const { theme, setTheme, systemTheme, isLoaded } = useEnhancedTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Define helper functions at the top of the component
  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8 text-sm';
      case 'md':
        return 'h-10 w-10 text-base';
      case 'lg':
        return 'h-12 w-12 text-lg';
      default:
        return 'h-10 w-10 text-base';
    }
  };

  if (!isLoaded) {
    // Skeleton loading state
    return (
      <div 
        className={cn(
          'animate-pulse rounded-lg bg-construction-primary/20',
          getSizeClasses(size),
          className
        )}
      />
    );
  }

  const getThemeIcon = (themeName: typeof theme) => {
    switch (themeName) {
      case 'light':
        return (
          <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/>
          </svg>
        );
      case 'dark':
        return (
          <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
          </svg>
        );
      case 'system':
        return (
          <svg className="h-full w-full" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 6h16v2H4zm0 5h16v6H4zm16-8H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getThemeLabel = (themeName: typeof theme) => {
    switch (themeName) {
      case 'light':
        return 'Light Mode';
      case 'dark':
        return 'Dark Mode';
      case 'system':
        return `System (${systemTheme === 'dark' ? 'Dark' : 'Light'})`;
      default:
        return 'Unknown';
    }
  };

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

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

  if (variant === 'icon') {
    return (
      <button
        onClick={cycleTheme}
        className={cn(
          'inline-flex items-center justify-center rounded-lg border border-construction-primary/20 bg-background text-construction-primary shadow-construction-light transition-all duration-construction ease-construction',
          'hover:bg-construction-primary/10 hover:shadow-construction-medium hover:scale-105',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-construction-primary focus-visible:ring-offset-2',
          'active:scale-95 active:shadow-construction-heavy',
          getSizeClasses(size),
          className
        )}
        title={`Current: ${getThemeLabel(theme)}. Click to cycle themes.`}
        aria-label="Toggle theme"
      >
        {getThemeIcon(theme)}
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={cycleTheme}
        className={cn(
          constructionButton('primary'),
          'inline-flex items-center gap-2 px-3 py-2',
          getSizeClasses(size).replace(/h-\d+ w-\d+/, 'h-auto'),
          hoverScale('sm'),
          className
        )}
        title={`Current: ${getThemeLabel(theme)}. Click to cycle themes.`}
      >
        <span className={getSizeClasses('sm').replace(/text-\w+/, '')}>
          {getThemeIcon(theme)}
        </span>
        {showLabel && (
          <span className="font-medium">{getThemeLabel(theme)}</span>
        )}
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div className="relative inline-block text-left">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-lg border border-construction-primary/20 bg-background px-3 py-2 text-construction-primary shadow-construction-light transition-all duration-construction',
            'hover:bg-construction-primary/10 hover:shadow-construction-medium',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-construction-primary focus-visible:ring-offset-2',
            getSizeClasses(size).replace(/h-\d+ w-\d+/, 'h-auto'),
            className
          )}
        >
          <span className={getSizeClasses('sm').replace(/text-\w+/, '')}>
            {getThemeIcon(theme)}
          </span>
          {showLabel && (
            <span className="font-medium">{getThemeLabel(theme)}</span>
          )}
          <svg 
            className={cn(
              'h-4 w-4 transition-transform duration-construction',
              isOpen && 'rotate-180'
            )}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 z-20 mt-2 w-48 origin-top-right rounded-lg border border-construction-primary/20 bg-background shadow-construction-medium ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1" role="menu">
                <button
                  onClick={() => handleThemeChange('light')}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-construction',
                    theme === 'light' 
                      ? 'bg-construction-primary/10 text-construction-primary'
                      : 'text-foreground hover:bg-construction-primary/5'
                  )}
                  role="menuitem"
                >
                  <span className="h-4 w-4">{getThemeIcon('light')}</span>
                  Light Mode
                </button>
                
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-construction',
                    theme === 'dark' 
                      ? 'bg-construction-primary/10 text-construction-primary'
                      : 'text-foreground hover:bg-construction-primary/5'
                  )}
                  role="menuitem"
                >
                  <span className="h-4 w-4">{getThemeIcon('dark')}</span>
                  Dark Mode
                </button>

                {showSystemOption && (
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors duration-construction',
                      theme === 'system' 
                        ? 'bg-construction-primary/10 text-construction-primary'
                        : 'text-foreground hover:bg-construction-primary/5'
                    )}
                    role="menuitem"
                  >
                    <span className="h-4 w-4">{getThemeIcon('system')}</span>
                    System ({systemTheme === 'dark' ? 'Dark' : 'Light'})
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
};

export default ConstructionThemeToggle;