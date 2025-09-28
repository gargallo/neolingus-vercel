/**
 * Specific tests for runtime errors that were reported in the Achievements component
 * Focus on "Cannot read properties of undefined" scenarios
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Achievements } from '@/components/academia/achievements';
import { AchievementFactory, AchievementProgressFactory } from '../helpers/achievement-factories';

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } })
    }
  })
}));

describe('Achievements Component - Runtime Error Prevention', () => {
  const defaultProps = {
    userId: 'test-user-id'
  };

  describe('Original "Cannot read properties of undefined" Errors', () => {
    it('prevents "Cannot read properties of undefined (reading progress)" error', () => {
      // This was the original error: trying to access .progress on undefined achievement
      const problematicData = [
        {
          id: 'achievement-1',
          title: 'Achievement 1',
          description: 'First achievement',
          type: 'bronze' as const
          // progress is completely missing, not just undefined
        }
      ];

      // Mock console.error to verify no errors are thrown
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<Achievements {...defaultProps} achievements={problematicData} />);
      }).not.toThrow();

      expect(screen.getByText('Achievement 1')).toBeInTheDocument();
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('prevents "Cannot read properties of undefined (reading current)" error', () => {
      // Original error: achievement.progress.current when progress is undefined
      const achievementWithUndefinedProgress = {
        id: 'undefined-progress',
        title: 'Undefined Progress',
        description: 'Achievement with undefined progress',
        type: 'bronze' as const,
        progress: undefined
      };

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithUndefinedProgress]} />);
      }).not.toThrow();

      expect(screen.getByText('Undefined Progress')).toBeInTheDocument();
      // Should not show progress bar for achievement without progress
      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('prevents "Cannot read properties of undefined (reading target)" error', () => {
      // Original error: achievement.progress.target when progress is undefined
      const achievementWithNoProgress = AchievementFactory.create({
        progress: undefined,
        isUnlocked: false
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNoProgress]} />);
      }).not.toThrow();

      // Should render achievement without progress indicators
      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('prevents "Cannot read properties of undefined (reading percentage)" error', () => {
      // Original error: achievement.progress.percentage when progress is undefined
      const achievementWithMissingProgressData = {
        id: 'missing-progress-data',
        title: 'Missing Progress Data',
        description: 'Achievement missing progress data',
        type: 'silver' as const,
        isUnlocked: false
        // No progress property at all
      };

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithMissingProgressData]} />);
      }).not.toThrow();

      expect(screen.getByText('Missing Progress Data')).toBeInTheDocument();
    });

    it('prevents "Cannot read properties of undefined (reading unlockedAt)" error', () => {
      // Original error: achievement.unlockedAt.toLocaleDateString() when unlockedAt is undefined
      const achievementWithUndefinedUnlockedAt = {
        id: 'undefined-unlocked-at',
        title: 'Undefined Unlocked At',
        description: 'Achievement with undefined unlockedAt',
        type: 'gold' as const,
        isUnlocked: true,
        unlockedAt: undefined
      };

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithUndefinedUnlockedAt]} />);
      }).not.toThrow();

      expect(screen.getByText('Undefined Unlocked At')).toBeInTheDocument();
      // Should not show unlock date when unlockedAt is undefined
      expect(screen.queryByText(/✓ Unlocked/)).not.toBeInTheDocument();
    });

    it('prevents errors when accessing nested properties on null objects', () => {
      const achievementWithNullNestedObjects = {
        id: 'null-nested',
        title: 'Null Nested Objects',
        description: 'Achievement with null nested objects',
        type: 'bronze' as const,
        progress: null,
        metadata: null,
        requirements: null
      } as any;

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNullNestedObjects]} />);
      }).not.toThrow();

      expect(screen.getByText('Null Nested Objects')).toBeInTheDocument();
    });
  });

  describe('API Response Format Errors', () => {
    it('prevents errors when API returns achievements with missing properties', () => {
      // Simulating real API response that might be missing expected properties
      const apiResponse = [
        {
          id: 'api-achievement-1',
          title: 'API Achievement 1',
          description: 'From API',
          // Missing: type, progress, isUnlocked, etc.
        },
        {
          id: 'api-achievement-2',
          title: 'API Achievement 2',
          // Missing: description, type, progress, etc.
        }
      ];

      expect(() => {
        render(<Achievements {...defaultProps} achievements={apiResponse as any} />);
      }).not.toThrow();

      expect(screen.getByText('API Achievement 1')).toBeInTheDocument();
      expect(screen.getByText('API Achievement 2')).toBeInTheDocument();
    });

    it('prevents errors when earned_at is present but other properties are missing', () => {
      // Common API format where earned_at exists but isUnlocked needs to be derived
      const apiAchievement = {
        id: 'api-earned',
        title: 'API Earned Achievement',
        description: 'Achievement from API with earned_at',
        earned_at: '2024-01-15T10:30:00.000Z'
        // Missing: isUnlocked, unlockedAt, progress, type, etc.
      };

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[apiAchievement as any]} />);
      }).not.toThrow();

      expect(screen.getByText('API Earned Achievement')).toBeInTheDocument();
      // Should show as unlocked since earned_at exists
      expect(screen.getByText('✓ Unlocked 1/15/2024')).toBeInTheDocument();
    });

    it('handles mixed API and mock data formats', () => {
      const mixedFormatAchievements = [
        // Mock data format
        AchievementFactory.createUnlocked({
          id: 'mock-format'
        }),
        // API format
        {
          id: 'api-format',
          title: 'API Format',
          description: 'API formatted achievement',
          earned_at: '2024-01-10T15:45:00.000Z'
        },
        // Incomplete data
        {
          id: 'incomplete',
          title: 'Incomplete Data'
          // Missing most properties
        }
      ];

      expect(() => {
        render(<Achievements {...defaultProps} achievements={mixedFormatAchievements as any} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
      expect(screen.getByText('API Format')).toBeInTheDocument();
      expect(screen.getByText('Incomplete Data')).toBeInTheDocument();
    });
  });

  describe('Progress Data Errors', () => {
    it('prevents errors when achievementData is undefined', () => {
      expect(() => {
        render(<Achievements {...defaultProps} achievementData={undefined} />);
      }).not.toThrow();

      // Should use mock progress data
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
    });

    it('prevents errors when achievementData properties are undefined', () => {
      const incompleteProgressData = {
        userId: 'test-user',
        // All other properties undefined
      } as any;

      expect(() => {
        render(<Achievements {...defaultProps} achievementData={incompleteProgressData} />);
      }).not.toThrow();

      expect(screen.getByText('Your Progress')).toBeInTheDocument();
    });

    it('prevents errors when skillMasteries is accessed but undefined', () => {
      const progressWithoutSkillMasteries = AchievementProgressFactory.create({
        skillMasteries: undefined as any
      });

      // This should not cause errors in the mock achievement generation
      expect(() => {
        render(<Achievements {...defaultProps} achievementData={progressWithoutSkillMasteries} />);
      }).not.toThrow();
    });

    it('prevents errors when skillMasteries properties are undefined', () => {
      const progressWithUndefinedSkills = AchievementProgressFactory.create({
        skillMasteries: {
          grammar: undefined,
          vocabulary: undefined,
          reading: undefined,
          listening: undefined,
          writing: undefined,
          speaking: undefined
        } as any
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievementData={progressWithUndefinedSkills} />);
      }).not.toThrow();
    });
  });

  describe('Mock Generation Errors', () => {
    it('prevents errors in generateMockAchievements when progress properties are undefined', () => {
      const emptyProgress = {
        userId: 'test-user',
        totalPoints: undefined,
        unlockedCount: undefined,
        totalCount: undefined,
        level: undefined,
        nextLevelPoints: undefined,
        streakDays: undefined,
        completedExams: undefined,
        averageScore: undefined,
        studyMinutes: undefined,
        skillMasteries: undefined,
        recentUnlocks: undefined
      } as any;

      expect(() => {
        render(<Achievements {...defaultProps} achievementData={emptyProgress} />);
      }).not.toThrow();

      // Should still generate achievements with default values
      expect(screen.getByText('First Steps')).toBeInTheDocument();
    });

    it('prevents errors when Math operations are performed on undefined values', () => {
      const progressWithNaNValues = AchievementProgressFactory.create({
        completedExams: 'not-a-number' as any,
        streakDays: null as any,
        averageScore: undefined as any,
        studyMinutes: 'infinity' as any
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievementData={progressWithNaNValues} />);
      }).not.toThrow();
    });
  });

  describe('DOM Manipulation Errors', () => {
    it('prevents errors when achievement elements are clicked but handlers are undefined', () => {
      const achievement = AchievementFactory.create();

      render(
        <Achievements 
          {...defaultProps} 
          achievements={[achievement]}
          onAchievementClick={undefined}
          onFilterChange={undefined}
          onShareAchievement={undefined}
        />
      );

      const achievementElement = screen.getByText('Test Achievement');
      
      // Should not throw when clicked without handlers
      expect(() => {
        achievementElement.click();
      }).not.toThrow();
    });

    it('prevents errors when window resize events occur', () => {
      render(<Achievements {...defaultProps} achievements={AchievementFactory.createArray(1)} />);

      // Should not throw when window is resized
      expect(() => {
        window.dispatchEvent(new Event('resize'));
      }).not.toThrow();
    });

    it('prevents errors when component unmounts during async operations', () => {
      const { unmount } = render(
        <Achievements {...defaultProps} achievements={AchievementFactory.createArray(1)} />
      );

      // Should not throw when component unmounts
      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });

  describe('Sorting and Filtering Errors', () => {
    it('prevents errors when sorting achievements with undefined properties', () => {
      const achievementsWithUndefinedProps = [
        { id: '1', title: 'Achievement 1', points: undefined, unlockedAt: undefined },
        { id: '2', title: 'Achievement 2', points: 50, unlockedAt: new Date() },
        { id: '3', title: 'Achievement 3', points: null, unlockedAt: null }
      ];

      expect(() => {
        render(<Achievements {...defaultProps} achievements={achievementsWithUndefinedProps as any} />);
      }).not.toThrow();

      expect(screen.getByText('Achievement 1')).toBeInTheDocument();
      expect(screen.getByText('Achievement 2')).toBeInTheDocument();
      expect(screen.getByText('Achievement 3')).toBeInTheDocument();
    });

    it('prevents errors when filtering by category with undefined category values', () => {
      const achievementsWithUndefinedCategories = [
        AchievementFactory.create({ id: '1', category: undefined }),
        AchievementFactory.create({ id: '2', category: 'progress' }),
        AchievementFactory.create({ id: '3', category: null as any })
      ];

      expect(() => {
        render(<Achievements {...defaultProps} achievements={achievementsWithUndefinedCategories} />);
      }).not.toThrow();
    });

    it('prevents errors when using array methods on potentially undefined arrays', () => {
      // Test the useMemo hook and array operations with edge case data
      const edgeCaseProps = {
        ...defaultProps,
        achievements: undefined,
        achievementData: null as any
      };

      expect(() => {
        render(<Achievements {...edgeCaseProps} />);
      }).not.toThrow();
    });
  });
});