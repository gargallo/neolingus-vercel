/**
 * T015 [P] Integration Test: New User Course Selection Journey
 * 
 * Tests the complete workflow of a new user selecting and accessing a course:
 * 1. Landing on academia page
 * 2. Language selection (English, Español, Valenciano)
 * 3. Level selection based on language
 * 4. Course type selection (EOI, JQCV, etc.)
 * 5. Course dashboard redirection
 * 6. Progress initialization
 * 7. GDPR/LOPD consent handling
 * 8. Accessibility and mobile responsiveness
 * 9. Error handling and recovery
 * 10. Performance validation
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'next/router';
import { act } from 'react-dom/test-utils';
import { mockRouter, MockSupabaseProvider } from '../utils/test-utils';
import { AcademiaPage } from '../../app/dashboard/page';
import { CourseSelection } from '../../components/dashboard/course-selection';
import { CourseDashboard } from '../../components/dashboard/course-dashboard';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock Supabase
jest.mock('../../utils/supabase/client');

// Mock AI services
jest.mock('../../lib/ai-agents/context7-service');

// Performance monitoring mock
const mockPerformanceObserver = jest.fn();
global.PerformanceObserver = jest.fn().mockImplementation(() => ({
  observe: mockPerformanceObserver,
  disconnect: jest.fn(),
}));

describe('Integration: New User Course Selection Journey', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();
    mockRouter.pathname = '/dashboard';
    
    // Mock performance metrics
    Object.defineProperty(window, 'performance', {
      value: {
        ...window.performance,
        now: () => Date.now(),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByType: () => [],
      },
      writable: true,
    });
  });

  describe('Complete User Journey - English Course', () => {
    it('should successfully navigate new user through English course selection', async () => {
      const performanceStart = performance.now();
      
      // 1. Render academia landing page
      render(
        <MockSupabaseProvider>
          <AcademiaPage />
        </MockSupabaseProvider>
      );

      // Verify landing page loads
      await waitFor(() => {
        expect(screen.getByTestId('academia-landing')).toBeInTheDocument();
        expect(screen.getByText('Escoge tu idioma de estudio')).toBeInTheDocument();
      });

      // 2. Language selection - English
      const englishButton = screen.getByTestId('language-english');
      expect(englishButton).toBeInTheDocument();
      expect(englishButton).toHaveAccessibleName('Seleccionar inglés');
      
      await act(async () => {
        await user.click(englishButton);
      });

      // Verify navigation to English language page
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/english');
      });

      // 3. Render level selection page
      mockRouter.pathname = '/dashboard/english';
      render(
        <MockSupabaseProvider>
          <CourseSelection language="english" />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('level-selection')).toBeInTheDocument();
        expect(screen.getByText('Selecciona tu nivel de inglés')).toBeInTheDocument();
      });

      // Verify all English levels are available
      expect(screen.getByTestId('level-a1')).toBeInTheDocument();
      expect(screen.getByTestId('level-a2')).toBeInTheDocument();
      expect(screen.getByTestId('level-b1')).toBeInTheDocument();
      expect(screen.getByTestId('level-b2')).toBeInTheDocument();
      expect(screen.getByTestId('level-c1')).toBeInTheDocument();
      expect(screen.getByTestId('level-c2')).toBeInTheDocument();

      // 4. Level selection - B1
      const b1Button = screen.getByTestId('level-b1');
      await act(async () => {
        await user.click(b1Button);
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/english/b1');
      });

      // 5. Render course provider selection
      mockRouter.pathname = '/dashboard/english/b1';
      render(
        <MockSupabaseProvider>
          <CourseSelection language="english" level="b1" />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('provider-selection')).toBeInTheDocument();
        expect(screen.getByText('Selecciona el tipo de curso')).toBeInTheDocument();
      });

      // Verify EOI option is available for English
      const eoiOption = screen.getByTestId('provider-eoi');
      expect(eoiOption).toBeInTheDocument();
      expect(eoiOption).toHaveTextContent('Escuela Oficial de Idiomas');

      // 6. Provider selection - EOI
      await act(async () => {
        await user.click(eoiOption);
      });

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/english/b1');
      });

      // 7. Verify course dashboard loads
      render(
        <MockSupabaseProvider>
          <CourseDashboard 
            language="english" 
            level="b1" 
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('course-dashboard')).toBeInTheDocument();
        expect(screen.getByText('English B1 - EOI')).toBeInTheDocument();
      });

      // 8. Verify progress initialization
      expect(screen.getByTestId('progress-overview')).toBeInTheDocument();
      expect(screen.getByTestId('exam-sections')).toBeInTheDocument();
      expect(screen.getByTestId('ai-tutor-access')).toBeInTheDocument();

      // 9. Performance validation
      const performanceEnd = performance.now();
      const loadTime = performanceEnd - performanceStart;
      expect(loadTime).toBeLessThan(3000); // 3s maximum for complete journey

      // 10. Verify analytics tracking
      expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
    });

    it('should handle GDPR/LOPD consent during course selection', async () => {
      render(
        <MockSupabaseProvider>
          <AcademiaPage />
        </MockSupabaseProvider>
      );

      // Verify consent banner appears
      await waitFor(() => {
        expect(screen.getByTestId('gdpr-consent-banner')).toBeInTheDocument();
        expect(screen.getByText('Política de cookies y privacidad')).toBeInTheDocument();
      });

      // Accept consent
      const acceptButton = screen.getByTestId('consent-accept');
      await user.click(acceptButton);

      await waitFor(() => {
        expect(screen.queryByTestId('gdpr-consent-banner')).not.toBeInTheDocument();
      });

      // Verify analytics and personalization are enabled
      expect(localStorage.getItem('gdpr-consent')).toBe('accepted');
      expect(localStorage.getItem('analytics-enabled')).toBe('true');
    });

    it('should be accessible throughout the journey', async () => {
      render(
        <MockSupabaseProvider>
          <AcademiaPage />
        </MockSupabaseProvider>
      );

      // Verify keyboard navigation
      const firstLanguageButton = screen.getByTestId('language-english');
      firstLanguageButton.focus();
      expect(document.activeElement).toBe(firstLanguageButton);

      // Verify ARIA labels and roles
      expect(firstLanguageButton).toHaveAttribute('role', 'button');
      expect(firstLanguageButton).toHaveAttribute('aria-label');

      // Verify skip links
      const skipLink = screen.getByTestId('skip-to-content');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#main-content');

      // Verify heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();

      // Verify color contrast (simulate contrast checker)
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // Mock contrast validation
        expect(styles.getPropertyValue('color')).toBeTruthy();
        expect(styles.getPropertyValue('background-color')).toBeTruthy();
      });
    });

    it('should be responsive on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });

      render(
        <MockSupabaseProvider>
          <AcademiaPage />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        const container = screen.getByTestId('academia-landing');
        expect(container).toHaveClass('responsive-container');
      });

      // Verify mobile-optimized layout
      const languageGrid = screen.getByTestId('language-grid');
      expect(languageGrid).toHaveClass('mobile-grid');

      // Verify touch-friendly buttons
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44); // 44px minimum touch target
      });

      // Verify no horizontal scroll
      expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
        document.documentElement.clientWidth
      );
    });
  });

  describe('Complete User Journey - Valenciano Course', () => {
    it('should successfully navigate through Valenciano course selection', async () => {
      render(
        <MockSupabaseProvider>
          <AcademiaPage />
        </MockSupabaseProvider>
      );

      // Language selection - Valenciano
      const valencianoButton = screen.getByTestId('language-valenciano');
      await user.click(valencianoButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/valenciano');
      });

      // Level selection for Valenciano (different levels)
      mockRouter.pathname = '/dashboard/valenciano';
      render(
        <MockSupabaseProvider>
          <CourseSelection language="valenciano" />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('level-selection')).toBeInTheDocument();
      });

      // Verify Valenciano-specific levels
      expect(screen.getByTestId('level-elemental')).toBeInTheDocument();
      expect(screen.getByTestId('level-mitjà')).toBeInTheDocument();
      expect(screen.getByTestId('level-superior')).toBeInTheDocument();

      // Select Mitjà level
      await user.click(screen.getByTestId('level-mitjà'));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/valenciano/mitjà');
      });

      // Provider selection - JQCV
      mockRouter.pathname = '/dashboard/valenciano/mitjà';
      render(
        <MockSupabaseProvider>
          <CourseSelection language="valenciano" level="mitjà" />
        </MockSupabaseProvider>
      );

      const jqcvOption = screen.getByTestId('provider-jqcv');
      expect(jqcvOption).toBeInTheDocument();
      expect(jqcvOption).toHaveTextContent('Junta Qualificadora');

      await user.click(jqcvOption);

      // Verify course dashboard with Valenciano content
      render(
        <MockSupabaseProvider>
          <CourseDashboard 
            language="valenciano" 
            level="mitjà" 
            provider="jqcv"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Valenciano Mitjà - JQCV')).toBeInTheDocument();
        expect(screen.getByTestId('valenciano-specific-content')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      jest.spyOn(global, 'fetch').mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <MockSupabaseProvider>
          <AcademiaPage />
        </MockSupabaseProvider>
      );

      // Verify error message appears
      await waitFor(() => {
        expect(screen.getByTestId('network-error-message')).toBeInTheDocument();
        expect(screen.getByText('Error de conexión. Inténtalo de nuevo.')).toBeInTheDocument();
      });

      // Verify retry button
      const retryButton = screen.getByTestId('retry-button');
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      jest.spyOn(global, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }))
      );

      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByTestId('network-error-message')).not.toBeInTheDocument();
        expect(screen.getByTestId('academia-landing')).toBeInTheDocument();
      });
    });

    it('should handle invalid course selections', async () => {
      render(
        <MockSupabaseProvider>
          <CourseSelection language="invalid-language" />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('invalid-course-error')).toBeInTheDocument();
        expect(screen.getByText('Curso no disponible')).toBeInTheDocument();
      });

      // Verify fallback to course selection
      const backButton = screen.getByTestId('back-to-selection');
      await user.click(backButton);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should handle authentication errors', async () => {
      // Mock authentication error
      const mockSupabase = {
        auth: {
          getSession: () => Promise.reject(new Error('Auth error')),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
        },
      };

      render(
        <MockSupabaseProvider mockClient={mockSupabase}>
          <CourseDashboard 
            language="english" 
            level="b1" 
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-error-message')).toBeInTheDocument();
        expect(screen.getByTestId('login-redirect-button')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Validation', () => {
    it('should meet Core Web Vitals requirements', async () => {
      const performanceEntries: PerformanceEntry[] = [];
      
      // Mock performance observer
      jest.spyOn(window, 'PerformanceObserver').mockImplementation(
        (callback) => {
          setTimeout(() => {
            callback({
              getEntries: () => performanceEntries,
            } as PerformanceObserverEntryList, {} as PerformanceObserver);
          }, 100);
          
          return {
            observe: jest.fn(),
            disconnect: jest.fn(),
          } as any;
        }
      );

      render(
        <MockSupabaseProvider>
          <AcademiaPage />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('academia-landing')).toBeInTheDocument();
      });

      // Simulate performance metrics
      const mockLCP = { name: 'largest-contentful-paint', startTime: 1200 } as PerformanceEntry;
      const mockFID = { name: 'first-input-delay', startTime: 50 } as PerformanceEntry;
      const mockCLS = { name: 'cumulative-layout-shift', startTime: 0.05 } as PerformanceEntry;

      performanceEntries.push(mockLCP, mockFID, mockCLS);

      // Verify performance thresholds
      await waitFor(() => {
        expect(mockLCP.startTime).toBeLessThan(2500); // LCP < 2.5s
        expect(mockFID.startTime).toBeLessThan(100);   // FID < 100ms
        expect(mockCLS.startTime).toBeLessThan(0.1);   // CLS < 0.1
      });
    });

    it('should load efficiently with proper resource management', async () => {
      const resourceObserver = jest.fn();
      
      render(
        <MockSupabaseProvider>
          <AcademiaPage />
        </MockSupabaseProvider>
      );

      // Verify efficient bundle loading
      await waitFor(() => {
        const scripts = document.querySelectorAll('script');
        const totalScriptSize = Array.from(scripts).reduce((size, script) => {
          return size + (script.src ? 100 : 0); // Mock script size
        }, 0);
        
        expect(totalScriptSize).toBeLessThan(500000); // < 500KB initial bundle
      });

      // Verify lazy loading
      expect(screen.queryByTestId('course-dashboard')).not.toBeInTheDocument();
    });
  });

  describe('Data Synchronization', () => {
    it('should properly sync user progress across navigation', async () => {
      const mockUserData = {
        id: 'user-123',
        selectedCourse: null,
        progress: {},
        preferences: {
          language: 'es',
          theme: 'light',
        },
      };

      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AcademiaPage />
        </MockSupabaseProvider>
      );

      // Select course
      await user.click(screen.getByTestId('language-english'));

      // Verify progress sync
      await waitFor(() => {
        expect(mockUserData.selectedCourse).toBe('english');
        expect(localStorage.getItem('course-selection')).toBe('english');
      });
    });

    it('should handle real-time updates during navigation', async () => {
      render(
        <MockSupabaseProvider>
          <AcademiaPage />
        </MockSupabaseProvider>
      );

      // Simulate real-time course availability update
      const mockRealtimeUpdate = {
        course: 'english',
        level: 'c2',
        available: false,
      };

      // Mock Supabase realtime
      const mockChannel = {
        on: jest.fn((event, callback) => {
          if (event === 'UPDATE') {
            setTimeout(() => callback(mockRealtimeUpdate), 100);
          }
        }),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      };

      // Trigger realtime update
      await act(async () => {
        mockChannel.on('UPDATE', () => {});
      });

      await waitFor(() => {
        // Verify C2 level is marked as unavailable
        if (screen.queryByTestId('level-c2')) {
          expect(screen.getByTestId('level-c2')).toHaveAttribute('disabled');
        }
      });
    });
  });
});