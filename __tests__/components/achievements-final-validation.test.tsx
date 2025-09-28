/**
 * Final validation tests for the Achievements component
 * This test file validates that the original runtime errors have been fixed
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Achievements } from '@/components/academia/achievements';

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } })
    }
  })
}));

describe('Achievements Component - Final Validation', () => {
  describe('Runtime Error Fixes Validation', () => {
    it('handles the original "Cannot read properties of undefined (reading progress)" error', () => {
      // This is the exact scenario that was causing the original error
      const problematicAchievement = {
        id: 'first_exam',
        title: 'First Steps',
        description: 'Complete your first exam',
        type: 'bronze' as const
        // Missing progress property - this was the source of the runtime error
      };

      // This should not throw any errors
      expect(() => {
        render(<Achievements userId="test-user" achievements={[problematicAchievement]} />);
      }).not.toThrow();

      // Component should render successfully
      expect(screen.getByText('First Steps')).toBeInTheDocument();
      expect(screen.getByText('Complete your first exam')).toBeInTheDocument();
    });

    it('handles multiple achievements with missing progress properties', () => {
      const achievementsWithMissingProgress = [
        {
          id: 'achievement1',
          title: 'Achievement 1',
          description: 'Description 1',
          type: 'bronze' as const
          // No progress
        },
        {
          id: 'achievement2', 
          title: 'Achievement 2',
          description: 'Description 2',
          type: 'silver' as const,
          progress: undefined // Explicitly undefined
        },
        {
          id: 'achievement3',
          title: 'Achievement 3',
          description: 'Description 3',
          type: 'gold' as const,
          progress: null as any // Null value
        }
      ];

      expect(() => {
        render(<Achievements userId="test-user" achievements={achievementsWithMissingProgress} />);
      }).not.toThrow();

      // All achievements should render
      expect(screen.getByText('Achievement 1')).toBeInTheDocument();
      expect(screen.getByText('Achievement 2')).toBeInTheDocument();
      expect(screen.getByText('Achievement 3')).toBeInTheDocument();
    });

    it('handles achievements with partial progress data', () => {
      const achievementWithPartialProgress = {
        id: 'partial-progress',
        title: 'Partial Progress Achievement',
        description: 'Has some progress data',
        type: 'silver' as const,
        progress: {
          current: 3
          // Missing target and percentage
        } as any
      };

      expect(() => {
        render(<Achievements userId="test-user" achievements={[achievementWithPartialProgress]} />);
      }).not.toThrow();

      expect(screen.getByText('Partial Progress Achievement')).toBeInTheDocument();
    });

    it('handles the earned_at API format correctly', () => {
      // This simulates achievements coming from an API with the earned_at format
      const apiFormatAchievements = [
        {
          id: 'api-achievement-1',
          title: 'API Achievement 1',
          description: 'From API with earned_at',
          type: 'milestone' as const,
          earned_at: '2024-01-15T10:30:00.000Z'
          // No isUnlocked, unlockedAt, progress properties
        },
        {
          id: 'api-achievement-2',
          title: 'API Achievement 2', 
          description: 'From API without earned_at',
          type: 'streak' as const
          // No earned_at - should be treated as locked
        }
      ];

      expect(() => {
        render(<Achievements userId="test-user" achievements={apiFormatAchievements} />);
      }).not.toThrow();

      expect(screen.getByText('API Achievement 1')).toBeInTheDocument();
      expect(screen.getByText('API Achievement 2')).toBeInTheDocument();
      
      // First achievement should show as unlocked (has earned_at)
      expect(screen.getByText('✓ Unlocked 1/15/2024')).toBeInTheDocument();
    });

    it('handles completely malformed achievement data', () => {
      const malformedAchievements = [
        {
          id: 'malformed-1',
          title: null,
          description: undefined,
          type: 'invalid-type',
          progress: 'not-an-object',
          points: 'not-a-number',
          rarity: 'invalid-rarity'
        } as any,
        {
          id: 'malformed-2',
          // Missing title and description
          type: 'bronze' as const,
          progress: {
            current: 'three',
            target: null,
            percentage: undefined
          }
        } as any
      ];

      // Should handle malformed data gracefully without crashing
      expect(() => {
        render(<Achievements userId="test-user" achievements={malformedAchievements} />);
      }).not.toThrow();
    });

    it('validates the component works with real-world API response structure', () => {
      // This simulates the exact structure from the UserAchievementsSection
      const realWorldApiResponse = [
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

      expect(() => {
        render(<Achievements userId="test-user" achievements={realWorldApiResponse as any} />);
      }).not.toThrow();

      expect(screen.getByText('Primer Examen')).toBeInTheDocument();
      expect(screen.getByText('Racha de 7 Días')).toBeInTheDocument();
    });
  });

  describe('Component Stability Tests', () => {
    it('renders consistently with empty props', () => {
      expect(() => {
        render(<Achievements userId="test-user" />);
      }).not.toThrow();

      // Should show default mock achievements
      expect(screen.getByText('First Steps')).toBeInTheDocument();
    });

    it('handles rapid prop changes without errors', () => {
      const { rerender } = render(<Achievements userId="test-user" isLoading={true} />);

      expect(() => {
        // Simulate rapid state changes
        rerender(<Achievements userId="test-user" error="Test error" />);
        rerender(<Achievements userId="test-user" achievements={[]} />);
        rerender(<Achievements userId="test-user" achievements={undefined} />);
        rerender(<Achievements userId="test-user" />);
      }).not.toThrow();
    });

    it('maintains component integrity during error conditions', () => {
      const { rerender } = render(<Achievements userId="test-user" />);

      expect(() => {
        // Test various error conditions
        rerender(<Achievements userId={null as any} />);
        rerender(<Achievements userId={undefined as any} />);
        rerender(<Achievements userId="test-user" achievements={null as any} />);
        rerender(<Achievements userId="test-user" achievementData={null as any} />);
      }).not.toThrow();
    });
  });

  describe('Performance and Memory Safety', () => {
    it('handles large datasets without crashing', () => {
      // Generate a large number of achievements
      const largeAchievementSet = Array.from({ length: 100 }, (_, index) => ({
        id: `achievement-${index}`,
        title: `Achievement ${index}`,
        description: `Description for achievement ${index}`,
        type: 'bronze' as const,
        progress: Math.random() > 0.5 ? {
          current: Math.floor(Math.random() * 10),
          target: 10,
          percentage: Math.random() * 100
        } : undefined
      }));

      expect(() => {
        render(<Achievements userId="test-user" achievements={largeAchievementSet} />);
      }).not.toThrow();
    });

    it('handles memory-intensive operations safely', () => {
      const memoryIntensiveAchievement = {
        id: 'memory-test',
        title: 'A'.repeat(1000), // Long title
        description: 'B'.repeat(2000), // Long description
        type: 'gold' as const,
        progress: {
          current: Number.MAX_SAFE_INTEGER,
          target: Number.MAX_SAFE_INTEGER,
          percentage: 100
        },
        metadata: new Array(100).fill('data') // Large metadata
      };

      expect(() => {
        render(<Achievements userId="test-user" achievements={[memoryIntensiveAchievement as any]} />);
      }).not.toThrow();
    });
  });
});