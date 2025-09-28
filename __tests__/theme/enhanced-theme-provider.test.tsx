/**
 * TDD Tests for EnhancedThemeProvider
 * These tests MUST FAIL initially - implementing to define expected behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
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

// Mock the missing components - these tests should FAIL until implemented
const EnhancedThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-provider">{children}</div>
);

const useEnhancedTheme = () => ({
  theme: 'light',
  setTheme: vi.fn(),
  systemTheme: 'light',
  resolvedTheme: 'light',
});

// Test component to access theme context
const TestComponent: React.FC = () => {
  const { theme, setTheme, systemTheme, resolvedTheme } = useEnhancedTheme();
  
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="system-theme">{systemTheme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button 
        data-testid="toggle-light" 
        onClick={() => setTheme('light')}
      >
        Light
      </button>
      <button 
        data-testid="toggle-dark" 
        onClick={() => setTheme('dark')}
      >
        Dark
      </button>
      <button 
        data-testid="toggle-system" 
        onClick={() => setTheme('system')}
      >
        System
      </button>
    </div>
  );
};

describe('EnhancedThemeProvider', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render children without crashing', () => {
      render(
        <EnhancedThemeProvider>
          <div data-testid="child">Test Child</div>
        </EnhancedThemeProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should apply theme class to html element', () => {
      render(
        <EnhancedThemeProvider defaultTheme="dark">
          <TestComponent />
        </EnhancedThemeProvider>
      );

      expect(document.documentElement).toHaveClass('dark');
    });
  });

  describe('Theme State Management', () => {
    it('should initialize with system theme when defaultTheme is system', () => {
      render(
        <EnhancedThemeProvider defaultTheme="system" enableSystem>
          <TestComponent />
        </EnhancedThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark'); // mocked as dark
    });

    it('should initialize with light theme when defaultTheme is light', () => {
      render(
        <EnhancedThemeProvider defaultTheme="light">
          <TestComponent />
        </EnhancedThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    });

    it('should initialize with dark theme when defaultTheme is dark', () => {
      render(
        <EnhancedThemeProvider defaultTheme="dark">
          <TestComponent />
        </EnhancedThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    });
  });

  describe('Theme Switching', () => {
    it('should switch to light theme when light button clicked', async () => {
      render(
        <EnhancedThemeProvider defaultTheme="dark">
          <TestComponent />
        </EnhancedThemeProvider>
      );

      fireEvent.click(screen.getByTestId('toggle-light'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
      });
    });

    it('should switch to dark theme when dark button clicked', async () => {
      render(
        <EnhancedThemeProvider defaultTheme="light">
          <TestComponent />
        </EnhancedThemeProvider>
      );

      fireEvent.click(screen.getByTestId('toggle-dark'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
      });
    });

    it('should switch to system theme when system button clicked', async () => {
      render(
        <EnhancedThemeProvider defaultTheme="light" enableSystem>
          <TestComponent />
        </EnhancedThemeProvider>
      );

      fireEvent.click(screen.getByTestId('toggle-system'));

      await waitFor(() => {
        expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
        expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark'); // mocked system preference
      });
    });
  });

  describe('Local Storage Persistence', () => {
    it('should save theme to localStorage when theme changes', async () => {
      render(
        <EnhancedThemeProvider storageKey="test-theme">
          <TestComponent />
        </EnhancedThemeProvider>
      );

      fireEvent.click(screen.getByTestId('toggle-dark'));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-theme', 'dark');
      });
    });

    it('should load theme from localStorage on initialization', () => {
      mockLocalStorage.getItem.mockReturnValue('dark');

      render(
        <EnhancedThemeProvider storageKey="test-theme">
          <TestComponent />
        </EnhancedThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should use custom storage key when provided', async () => {
      const customKey = 'custom-neolingus-theme';
      
      render(
        <EnhancedThemeProvider storageKey={customKey}>
          <TestComponent />
        </EnhancedThemeProvider>
      );

      fireEvent.click(screen.getByTestId('toggle-light'));

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(customKey, 'light');
      });
    });
  });

  describe('System Theme Detection', () => {
    it('should detect system theme preference', () => {
      // Mock dark system preference
      (window.matchMedia as any).mockImplementation(query => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <EnhancedThemeProvider enableSystem>
          <TestComponent />
        </EnhancedThemeProvider>
      );

      expect(screen.getByTestId('system-theme')).toHaveTextContent('dark');
    });

    it('should respond to system theme changes', async () => {
      let mediaQueryCallback: ((e: MediaQueryListEvent) => void) | null = null;
      
      (window.matchMedia as any).mockImplementation(query => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((event, callback) => {
          if (event === 'change') {
            mediaQueryCallback = callback;
          }
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <EnhancedThemeProvider defaultTheme="system" enableSystem>
          <TestComponent />
        </EnhancedThemeProvider>
      );

      // Simulate system theme change to light
      if (mediaQueryCallback) {
        mediaQueryCallback({ matches: false } as MediaQueryListEvent);
      }

      await waitFor(() => {
        expect(screen.getByTestId('system-theme')).toHaveTextContent('light');
      });
    });
  });

  describe('CSS Custom Properties', () => {
    it('should apply construction theme CSS variables on theme change', async () => {
      render(
        <EnhancedThemeProvider>
          <TestComponent />
        </EnhancedThemeProvider>
      );

      fireEvent.click(screen.getByTestId('toggle-light'));

      await waitFor(() => {
        const root = document.documentElement;
        expect(root.style.getPropertyValue('--construction-primary')).toBe('24 100% 50%');
        expect(root.style.getPropertyValue('--construction-secondary')).toBe('45 100% 55%');
      });
    });

    it('should update CSS variables when switching to dark theme', async () => {
      render(
        <EnhancedThemeProvider>
          <TestComponent />
        </EnhancedThemeProvider>
      );

      fireEvent.click(screen.getByTestId('toggle-dark'));

      await waitFor(() => {
        const root = document.documentElement;
        expect(root.style.getPropertyValue('--construction-primary')).toBe('24 100% 55%');
        expect(root.style.getPropertyValue('--construction-secondary')).toBe('45 100% 60%');
      });
    });
  });

  describe('Attribute Management', () => {
    it('should set class attribute by default', () => {
      render(
        <EnhancedThemeProvider defaultTheme="dark">
          <TestComponent />
        </EnhancedThemeProvider>
      );

      expect(document.documentElement).toHaveClass('dark');
    });

    it('should set data-theme attribute when attribute="data-theme"', () => {
      render(
        <EnhancedThemeProvider attribute="data-theme" defaultTheme="dark">
          <TestComponent />
        </EnhancedThemeProvider>
      );

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      render(
        <EnhancedThemeProvider>
          <TestComponent />
        </EnhancedThemeProvider>
      );

      // Should not crash when localStorage fails
      fireEvent.click(screen.getByTestId('toggle-dark'));
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should provide default values when useEnhancedTheme used outside provider', () => {
      // This test should log an error and provide defaults
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<TestComponent />);
      
      expect(consoleError).toHaveBeenCalled();
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      
      consoleError.mockRestore();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not cause unnecessary re-renders when theme unchanged', () => {
      const renderSpy = vi.fn();
      
      const SpyComponent = () => {
        renderSpy();
        const { theme } = useEnhancedTheme();
        return <div data-testid="spy-theme">{theme}</div>;
      };

      render(
        <EnhancedThemeProvider defaultTheme="light">
          <SpyComponent />
        </EnhancedThemeProvider>
      );

      // Initial render
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Click same theme multiple times
      fireEvent.click(screen.getByTestId('toggle-light'));
      fireEvent.click(screen.getByTestId('toggle-light'));
      
      // Should not cause additional renders
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });
});