/**
 * T016 [P] Integration Test: Course Dashboard Access Journey
 * 
 * Tests the complete workflow of accessing and using the course dashboard:
 * 1. Authentication and session validation
 * 2. Course dashboard loading with user progress
 * 3. Navigation between dashboard sections
 * 4. Real-time progress updates
 * 5. Exam section access and navigation
 * 6. AI tutor integration access
 * 7. Settings and preferences management
 * 8. Offline functionality and sync
 * 9. Multi-language support
 * 10. Performance optimization and caching
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'next/router';
import { act } from 'react-dom/test-utils';
import { mockRouter, MockSupabaseProvider } from '../utils/test-utils';
import { CourseDashboard } from '../../components/dashboard/course-dashboard';
import { ProgressAnalytics } from '../../components/dashboard/progress-analytics';
import { AiTutor } from '../../components/dashboard/ai-tutor';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('../../utils/supabase/client');
jest.mock('../../lib/ai-agents/context7-service');
jest.mock('../../lib/exam-engine/core/engine');

// Mock real-time capabilities
const mockRealtimeChannel = {
  on: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

describe('Integration: Course Dashboard Access Journey', () => {
  const user = userEvent.setup();
  const mockUserData = {
    id: 'user-123',
    email: 'test@example.com',
    selectedCourse: {
      language: 'english',
      level: 'b1',
      provider: 'eoi'
    },
    progress: {
      completedExams: 3,
      totalExams: 12,
      averageScore: 78,
      weakAreas: ['listening', 'writing'],
      strongAreas: ['reading', 'grammar'],
      studyStreak: 7,
      totalStudyTime: 2400, // minutes
    },
    preferences: {
      language: 'es',
      theme: 'light',
      notifications: true,
      autoPlayAudio: true,
    },
    achievements: [
      { id: 'first-exam', name: 'Primer Examen', date: '2024-01-15' },
      { id: 'week-streak', name: 'Racha de 7 días', date: '2024-01-20' },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();
    mockRouter.pathname = '/dashboard/english/b1';
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock performance API
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

  describe('Dashboard Loading and Authentication', () => {
    it('should load dashboard with user progress after authentication', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      // Verify dashboard loads with user data
      await waitFor(() => {
        expect(screen.getByTestId('course-dashboard')).toBeInTheDocument();
        expect(screen.getByText('English B1 - EOI')).toBeInTheDocument();
        expect(screen.getByText(`Hola, ${mockUserData.email}`)).toBeInTheDocument();
      });

      // Verify progress overview
      expect(screen.getByTestId('progress-overview')).toBeInTheDocument();
      expect(screen.getByText('3 / 12 exámenes completados')).toBeInTheDocument();
      expect(screen.getByText('Puntuación media: 78%')).toBeInTheDocument();
      expect(screen.getByText('Racha de estudio: 7 días')).toBeInTheDocument();

      // Verify exam sections are loaded
      expect(screen.getByTestId('exam-sections')).toBeInTheDocument();
      const examSections = within(screen.getByTestId('exam-sections'));
      expect(examSections.getByText('Comprensión Lectora')).toBeInTheDocument();
      expect(examSections.getByText('Comprensión Auditiva')).toBeInTheDocument();
      expect(examSections.getByText('Expresión Escrita')).toBeInTheDocument();
      expect(examSections.getByText('Expresión Oral')).toBeInTheDocument();

      // Verify AI tutor access
      expect(screen.getByTestId('ai-tutor-access')).toBeInTheDocument();
    });

    it('should handle unauthenticated users appropriately', async () => {
      render(
        <MockSupabaseProvider initialUser={null}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-prompt')).toBeInTheDocument();
        expect(screen.getByText('Inicia sesión para acceder a tu curso')).toBeInTheDocument();
        expect(screen.getByTestId('login-button')).toBeInTheDocument();
      });

      // Test login redirect
      const loginButton = screen.getByTestId('login-button');
      await user.click(loginButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/auth/login?redirect=/dashboard/english/b1');
    });

    it('should handle session expiration gracefully', async () => {
      const { rerender } = render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      // Dashboard loads normally
      await waitFor(() => {
        expect(screen.getByTestId('course-dashboard')).toBeInTheDocument();
      });

      // Simulate session expiration
      rerender(
        <MockSupabaseProvider initialUser={null} sessionExpired={true}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-expired-message')).toBeInTheDocument();
        expect(screen.getByText('Tu sesión ha expirado. Inicia sesión de nuevo.')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Navigation and Interaction', () => {
    it('should navigate between dashboard sections correctly', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('course-dashboard')).toBeInTheDocument();
      });

      // Test navigation to progress analytics
      const progressTab = screen.getByTestId('progress-tab');
      await user.click(progressTab);

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
        expect(screen.getByText('Análisis de Progreso')).toBeInTheDocument();
      });

      // Test navigation to exam sections
      const examsTab = screen.getByTestId('exams-tab');
      await user.click(examsTab);

      await waitFor(() => {
        expect(screen.getByTestId('exam-sections')).toBeInTheDocument();
        expect(screen.getByText('Secciones de Examen')).toBeInTheDocument();
      });

      // Test navigation to AI tutor
      const tutorTab = screen.getByTestId('tutor-tab');
      await user.click(tutorTab);

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
        expect(screen.getByText('Tutor con IA')).toBeInTheDocument();
      });

      // Test navigation to settings
      const settingsTab = screen.getByTestId('settings-tab');
      await user.click(settingsTab);

      await waitFor(() => {
        expect(screen.getByTestId('user-settings')).toBeInTheDocument();
        expect(screen.getByText('Configuración')).toBeInTheDocument();
      });
    });

    it('should handle exam section access and navigation', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('exam-sections')).toBeInTheDocument();
      });

      // Click on reading comprehension section
      const readingSection = screen.getByTestId('section-reading');
      expect(readingSection).toBeInTheDocument();
      expect(readingSection).toHaveTextContent('Comprensión Lectora');
      
      await user.click(readingSection);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/english/b1/examens/eoi');
      });

      // Test exam progress indication
      const sectionProgress = within(readingSection).getByTestId('section-progress');
      expect(sectionProgress).toHaveAttribute('aria-label', 'Progreso: 2 de 3 exámenes completados');

      // Test section difficulty indicator
      const difficultyIndicator = within(readingSection).getByTestId('difficulty-indicator');
      expect(difficultyIndicator).toHaveTextContent('Nivel B1');
    });

    it('should display and update user achievements', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('achievements-section')).toBeInTheDocument();
      });

      // Verify existing achievements
      expect(screen.getByTestId('achievement-first-exam')).toBeInTheDocument();
      expect(screen.getByTestId('achievement-week-streak')).toBeInTheDocument();

      // Simulate new achievement unlock
      const newAchievement = {
        id: 'reading-master',
        name: 'Maestro de Lectura',
        description: '10 exámenes de comprensión lectora completados',
        date: new Date().toISOString(),
      };

      // Mock achievement unlock notification
      act(() => {
        fireEvent(window, new CustomEvent('achievement-unlocked', {
          detail: newAchievement
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('achievement-notification')).toBeInTheDocument();
        expect(screen.getByText('¡Nuevo logro desbloqueado!')).toBeInTheDocument();
        expect(screen.getByText('Maestro de Lectura')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates and Synchronization', () => {
    it('should handle real-time progress updates', async () => {
      const mockSupabase = {
        auth: {
          getSession: () => Promise.resolve({ data: { session: { user: mockUserData } } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              subscribe: () => mockRealtimeChannel,
            }),
          }),
        }),
        channel: () => mockRealtimeChannel,
      };

      render(
        <MockSupabaseProvider mockClient={mockSupabase} initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('3 / 12 exámenes completados')).toBeInTheDocument();
      });

      // Simulate real-time progress update
      const progressUpdate = {
        completedExams: 4,
        totalExams: 12,
        averageScore: 82,
        lastExamDate: new Date().toISOString(),
      };

      // Mock real-time channel callback
      const updateCallback = mockRealtimeChannel.on.mock.calls[0][1];
      act(() => {
        updateCallback({ new: progressUpdate });
      });

      await waitFor(() => {
        expect(screen.getByText('4 / 12 exámenes completados')).toBeInTheDocument();
        expect(screen.getByText('Puntuación media: 82%')).toBeInTheDocument();
      });

      // Verify progress animation
      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar).toHaveClass('animate-progress-update');
    });

    it('should sync data when coming back online', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      // Simulate offline mode
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      act(() => {
        fireEvent(window, new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('offline-indicator')).toBeInTheDocument();
        expect(screen.getByText('Sin conexión - Trabajando en modo offline')).toBeInTheDocument();
      });

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      act(() => {
        fireEvent(window, new Event('online'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument();
        expect(screen.getByText('Sincronizando datos...')).toBeInTheDocument();
      });

      // Verify successful sync
      await waitFor(() => {
        expect(screen.queryByTestId('offline-indicator')).not.toBeInTheDocument();
        expect(screen.queryByTestId('sync-indicator')).not.toBeInTheDocument();
      });
    });

    it('should handle concurrent user sessions', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      // Simulate concurrent session detection
      const concurrentSessionEvent = {
        type: 'concurrent-session-detected',
        sessionId: 'other-session-456',
        timestamp: new Date().toISOString(),
      };

      act(() => {
        fireEvent(window, new CustomEvent('concurrent-session', {
          detail: concurrentSessionEvent
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('concurrent-session-warning')).toBeInTheDocument();
        expect(screen.getByText('Se ha detectado otra sesión activa')).toBeInTheDocument();
      });

      // Test session management options
      const continueButton = screen.getByTestId('continue-current-session');
      const switchButton = screen.getByTestId('switch-to-other-session');

      expect(continueButton).toBeInTheDocument();
      expect(switchButton).toBeInTheDocument();
    });
  });

  describe('Settings and Preferences Management', () => {
    it('should manage user preferences correctly', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      // Navigate to settings
      await user.click(screen.getByTestId('settings-tab'));

      await waitFor(() => {
        expect(screen.getByTestId('user-settings')).toBeInTheDocument();
      });

      // Test theme preference change
      const themeSelect = screen.getByTestId('theme-selector');
      expect(themeSelect).toHaveValue('light');

      await user.selectOptions(themeSelect, 'dark');

      await waitFor(() => {
        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
        expect(localStorage.setItem).toHaveBeenCalledWith('theme-preference', 'dark');
      });

      // Test notification preferences
      const notificationsToggle = screen.getByTestId('notifications-toggle');
      expect(notificationsToggle).toBeChecked();

      await user.click(notificationsToggle);

      await waitFor(() => {
        expect(notificationsToggle).not.toBeChecked();
      });

      // Test audio autoplay preference
      const autoPlayToggle = screen.getByTestId('autoplay-toggle');
      expect(autoPlayToggle).toBeChecked();

      await user.click(autoPlayToggle);

      await waitFor(() => {
        expect(autoPlayToggle).not.toBeChecked();
      });

      // Test language interface change
      const languageSelect = screen.getByTestId('interface-language-selector');
      expect(languageSelect).toHaveValue('es');

      await user.selectOptions(languageSelect, 'en');

      await waitFor(() => {
        expect(screen.getByText('Course Dashboard')).toBeInTheDocument(); // English interface
      });
    });

    it('should handle data export and privacy controls', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await user.click(screen.getByTestId('settings-tab'));

      // Test data export
      const exportButton = screen.getByTestId('export-data-button');
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByTestId('export-progress-modal')).toBeInTheDocument();
        expect(screen.getByText('Preparando exportación de datos...')).toBeInTheDocument();
      });

      // Mock successful export
      await waitFor(() => {
        expect(screen.getByTestId('download-export-link')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Test account deletion
      const deleteAccountButton = screen.getByTestId('delete-account-button');
      await user.click(deleteAccountButton);

      await waitFor(() => {
        expect(screen.getByTestId('delete-confirmation-modal')).toBeInTheDocument();
        expect(screen.getByText('¿Estás seguro de que quieres eliminar tu cuenta?')).toBeInTheDocument();
      });

      // Test confirmation requirement
      const confirmInput = screen.getByTestId('delete-confirmation-input');
      await user.type(confirmInput, 'ELIMINAR MI CUENTA');

      const confirmDeleteButton = screen.getByTestId('confirm-delete-button');
      expect(confirmDeleteButton).not.toBeDisabled();
    });
  });

  describe('Performance and Caching', () => {
    it('should implement efficient caching for dashboard data', async () => {
      const mockCache = new Map();
      
      // Mock cache API
      Object.defineProperty(window, 'caches', {
        value: {
          open: () => Promise.resolve({
            match: (request: string) => Promise.resolve(mockCache.get(request)),
            put: (request: string, response: any) => {
              mockCache.set(request, response);
              return Promise.resolve();
            },
          }),
        },
        writable: true,
      });

      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('course-dashboard')).toBeInTheDocument();
      });

      // Verify dashboard data is cached
      expect(mockCache.size).toBeGreaterThan(0);

      // Test cache hit on second load
      const { rerender } = render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      // Should load faster from cache
      expect(screen.getByTestId('course-dashboard')).toBeInTheDocument();
    });

    it('should meet performance benchmarks', async () => {
      const startTime = performance.now();

      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('course-dashboard')).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(1000); // Dashboard should load in <1s

      // Test scroll performance
      const dashboardContainer = screen.getByTestId('course-dashboard');
      
      // Simulate rapid scrolling
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(dashboardContainer, { target: { scrollY: i * 100 } });
      }

      // Should maintain 60fps (no jank detection in test, but structure validates)
      expect(dashboardContainer).toBeInTheDocument();
    });

    it('should handle large datasets efficiently', async () => {
      const largeProgressData = {
        ...mockUserData,
        progress: {
          ...mockUserData.progress,
          detailedHistory: Array.from({ length: 1000 }, (_, i) => ({
            id: i,
            date: new Date(Date.now() - i * 86400000).toISOString(),
            score: Math.random() * 100,
            section: ['reading', 'listening', 'writing', 'speaking'][i % 4],
          })),
        },
      };

      render(
        <MockSupabaseProvider initialUser={largeProgressData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('course-dashboard')).toBeInTheDocument();
      });

      // Navigate to progress analytics with large dataset
      await user.click(screen.getByTestId('progress-tab'));

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });

      // Verify virtual scrolling is implemented for large lists
      const historyList = screen.getByTestId('progress-history-list');
      expect(historyList).toHaveAttribute('data-virtualized', 'true');
    });
  });

  describe('Accessibility and Mobile Support', () => {
    it('should be fully accessible', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('course-dashboard')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const firstTab = screen.getByTestId('progress-tab');
      firstTab.focus();
      expect(document.activeElement).toBe(firstTab);

      // Test tab navigation
      fireEvent.keyDown(firstTab, { key: 'Tab' });
      expect(document.activeElement).toBe(screen.getByTestId('exams-tab'));

      // Test ARIA labels and roles
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Course Dashboard');
      expect(screen.getByRole('tablist')).toBeInTheDocument();

      // Test screen reader announcements
      const liveRegion = screen.getByTestId('sr-announcements');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      // Test high contrast mode
      document.documentElement.setAttribute('data-theme', 'high-contrast');
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        expect(styles.border).toBeTruthy(); // High contrast borders
      });
    });

    it('should work properly on mobile devices', async () => {
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
        <MockSupabaseProvider initialUser={mockUserData}>
          <CourseDashboard 
            language="english"
            level="b1"
            provider="eoi"
          />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        const dashboard = screen.getByTestId('course-dashboard');
        expect(dashboard).toHaveClass('mobile-optimized');
      });

      // Test mobile navigation
      const mobileMenu = screen.getByTestId('mobile-menu-button');
      expect(mobileMenu).toBeInTheDocument();

      await user.click(mobileMenu);

      await waitFor(() => {
        expect(screen.getByTestId('mobile-navigation-drawer')).toBeInTheDocument();
      });

      // Test swipe gestures (simulated)
      const drawer = screen.getByTestId('mobile-navigation-drawer');
      
      fireEvent.touchStart(drawer, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      fireEvent.touchMove(drawer, {
        touches: [{ clientX: 50, clientY: 100 }]
      });
      fireEvent.touchEnd(drawer);

      await waitFor(() => {
        expect(screen.queryByTestId('mobile-navigation-drawer')).not.toBeInTheDocument();
      });
    });
  });
});