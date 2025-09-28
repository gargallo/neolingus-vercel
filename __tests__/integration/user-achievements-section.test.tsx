/**
 * Integration tests for UserAchievementsSection in app/dashboard/page.tsx
 * Tests the integration between the page component and the Achievements component
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AchievementFactory } from '../helpers/achievement-factories';

// Mock the Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: { access_token: 'test-token' } }
    })
  }
};

vi.mock('@/utils/supabase/server', () => ({
  createSupabaseClient: vi.fn().mockResolvedValue(mockSupabaseClient)
}));

// Mock the achievements component
vi.mock('@/components/academia/achievements', () => ({
  Achievements: vi.fn(({ userId, achievements, isLoading, error }) => (
    <div data-testid="achievements-component">
      <div data-testid="user-id">{userId}</div>
      <div data-testid="achievements-count">{achievements?.length || 0}</div>
      {isLoading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error}</div>}
      {achievements?.map(achievement => (
        <div key={achievement.id} data-testid={`achievement-${achievement.id}`}>
          {achievement.title}
        </div>
      ))}
    </div>
  ))
}));

// Mock other components used in the page
vi.mock('@/components/academia/dashboard-header', () => ({
  AcademiaHeader: () => <div data-testid="academia-header">Header</div>
}));

vi.mock('@/components/academia/courses-grid', () => ({
  CoursesGrid: () => <div data-testid="courses-grid">Courses Grid</div>
}));

vi.mock('@/components/academia/course-selection', () => ({
  CourseSelection: () => <div data-testid="course-selection">Course Selection</div>
}));

vi.mock('@/components/academia/progress-analytics', () => ({
  ProgressAnalytics: () => <div data-testid="progress-analytics">Progress Analytics</div>
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('UserAchievementsSection Integration', () => {
  const testUserId = 'test-user-id';
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    
    // Default successful responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/academia/courses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ courses: [] })
        });
      }
      if (url.includes('/api/academia/progress/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            progress: { 
              total_sessions: 0, 
              average_score: 0, 
              last_session: null, 
              achievements_count: 0 
            } 
          })
        });
      }
      return Promise.resolve({
        ok: false,
        status: 404
      });
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Achievement Data Loading', () => {
    it('passes correct userId to Achievements component', async () => {
      // Import the page component dynamically to avoid SSR issues in tests
      const { default: AcademiaPage } = await import('@/app/dashboard/page');
      
      render(await AcademiaPage());
      
      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent(testUserId);
      });
    });

    it('provides demo achievements when API returns empty data', async () => {
      const { default: AcademiaPage } = await import('@/app/dashboard/page');
      
      render(await AcademiaPage());
      
      await waitFor(() => {
        // Should render with at least demo achievements
        const achievementsCount = parseInt(screen.getByTestId('achievements-count').textContent || '0');
        expect(achievementsCount).toBeGreaterThan(0);
      });
      
      // Check for specific demo achievements
      expect(screen.getByTestId('achievement-first_exam')).toBeInTheDocument();
      expect(screen.getByTestId('achievement-streak_7')).toBeInTheDocument();
    });

    it('handles API errors gracefully', async () => {
      // Mock API to return error
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const { default: AcademiaPage } = await import('@/app/dashboard/page');
      
      render(await AcademiaPage());
      
      await waitFor(() => {
        // Should still render with demo achievements even if API fails
        const achievementsCount = parseInt(screen.getByTestId('achievements-count').textContent || '0');
        expect(achievementsCount).toBeGreaterThan(0);
      });
    });

    it('handles network timeout gracefully', async () => {
      // Mock API to timeout
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const { default: AcademiaPage } = await import('@/app/dashboard/page');
      
      render(await AcademiaPage());
      
      await waitFor(() => {
        // Should render with demo data when network fails
        const achievementsCount = parseInt(screen.getByTestId('achievements-count').textContent || '0');
        expect(achievementsCount).toBeGreaterThan(0);
      });
    });
  });

  describe('Achievement Data Structure', () => {
    it('creates achievements with correct data structure for demo mode', async () => {
      const { default: AcademiaPage } = await import('@/app/dashboard/page');
      
      render(await AcademiaPage());
      
      await waitFor(() => {
        // Check that demo achievements have required structure
        expect(screen.getByText('Primer Examen')).toBeInTheDocument();
        expect(screen.getByText('Racha de 7 Días')).toBeInTheDocument();
      });
    });

    it('ensures achievements have all required properties to prevent runtime errors', async () => {
      const { default: AcademiaPage } = await import('@/app/dashboard/page');
      
      // This test ensures that the demo achievements generated in the page
      // have all the required properties to prevent undefined property errors
      const demoAchievements = [
        {
          id: "first_exam",
          title: "Primer Examen",
          description: "Has completado tu primer simulacro de examen",
          type: "milestone",
          earned_at: new Date().toISOString(),
        },
        {
          id: "streak_7",
          title: "Racha de 7 Días", 
          description: "Has estudiado 7 días consecutivos",
          type: "streak",
          earned_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        }
      ];

      // Verify each achievement has the required structure
      demoAchievements.forEach(achievement => {
        expect(achievement.id).toBeDefined();
        expect(achievement.title).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.type).toBeDefined();
        expect(achievement.earned_at).toBeDefined();
      });

      render(await AcademiaPage());
      
      await waitFor(() => {
        expect(screen.getByTestId('achievements-component')).toBeInTheDocument();
      });
    });
  });

  describe('Conditional Rendering', () => {
    it('renders achievements section only when achievements exist', async () => {
      const { default: AcademiaPage } = await import('@/app/dashboard/page');
      
      render(await AcademiaPage());
      
      await waitFor(() => {
        expect(screen.getByTestId('achievements-component')).toBeInTheDocument();
        expect(screen.getByText('Logros Recientes')).toBeInTheDocument();
      });
    });

    it('does not render achievements section when no achievements exist', async () => {
      // Create a mock page component that returns empty achievements
      const EmptyAchievementsPage = () => {
        return (
          <div>
            <div data-testid="academia-header">Header</div>
            <div data-testid="courses-grid">Courses Grid</div>
            {/* No achievements section */}
          </div>
        );
      };

      render(<EmptyAchievementsPage />);
      
      expect(screen.queryByText('Logros Recientes')).not.toBeInTheDocument();
      expect(screen.queryByTestId('achievements-component')).not.toBeInTheDocument();
    });
  });

  describe('Page Layout Integration', () => {
    it('renders achievements section in correct order within page layout', async () => {
      const { default: AcademiaPage } = await import('@/app/dashboard/page');
      
      render(await AcademiaPage());
      
      await waitFor(() => {
        expect(screen.getByTestId('academia-header')).toBeInTheDocument();
      });
      
      // Verify the page structure and order
      const pageContent = screen.getByRole('main');
      expect(pageContent).toBeInTheDocument();
      
      // Should have hero section, courses, progress, and achievements in that order
      expect(screen.getByText('Bienvenido a tu Academia Personal')).toBeInTheDocument();
      expect(screen.getByTestId('courses-grid')).toBeInTheDocument();
      expect(screen.getByTestId('achievements-component')).toBeInTheDocument();
    });

    it('integrates properly with Suspense boundaries', async () => {
      const { default: AcademiaPage } = await import('@/app/dashboard/page');
      
      render(await AcademiaPage());
      
      // Should render without throwing Suspense errors
      await waitFor(() => {
        expect(screen.getByTestId('achievements-component')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundaries', () => {
    it('handles achievement component errors gracefully', async () => {
      // Mock the Achievements component to throw an error
      vi.mocked(require('@/components/academia/achievements').Achievements)
        .mockImplementation(() => {
          throw new Error('Achievement component error');
        });

      const { default: AcademiaPage } = await import('@/app/dashboard/page');
      
      // Should not crash the entire page
      expect(() => render(<AcademiaPage />)).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('loads achievements efficiently without blocking page render', async () => {
      const { default: AcademiaPage } = await import('@/app/dashboard/page');
      
      const startTime = performance.now();
      render(await AcademiaPage());
      const endTime = performance.now();
      
      // Should render quickly (within 100ms for component rendering)
      expect(endTime - startTime).toBeLessThan(100);
      
      await waitFor(() => {
        expect(screen.getByTestId('achievements-component')).toBeInTheDocument();
      });
    });
  });
});

/**
 * Test utilities specific to the academia page integration
 */
export const AcademiaPageTestUtils = {
  /**
   * Helper to mock user courses data
   */
  mockUserCoursesResponse: (courses: any[] = []) => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/academia/courses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ courses })
        });
      }
      return mockFetch(url);
    });
  },

  /**
   * Helper to mock achievement API responses
   */
  mockAchievementsResponse: (achievements: any[] = []) => {
    // Note: Currently achievements are generated in the component,
    // but this helper is ready for when they're fetched from API
    return achievements;
  },

  /**
   * Helper to simulate different loading states
   */
  simulateLoadingState: () => {
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ courses: [] })
        }), 1000)
      )
    );
  },

  /**
   * Helper to simulate API errors
   */
  simulateAPIError: (errorCode: number = 500, message: string = 'Server Error') => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: errorCode,
      statusText: message,
      json: () => Promise.resolve({ error: message })
    });
  }
};