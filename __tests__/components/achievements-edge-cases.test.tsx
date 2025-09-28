/**
 * Edge case tests for Achievements component
 * Focuses on runtime error prevention and data validation
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

describe('Achievements Component - Edge Cases', () => {
  const defaultProps = {
    userId: 'test-user-id'
  };

  describe('Runtime Error Prevention', () => {
    it('handles achievements with completely missing progress object', () => {
      const achievementWithNoProgress = {
        id: 'no-progress',
        title: 'No Progress Achievement',
        description: 'Achievement without progress',
        type: 'bronze' as const
        // progress: undefined (completely missing)
      };

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNoProgress]} />);
      }).not.toThrow();

      expect(screen.getByText('No Progress Achievement')).toBeInTheDocument();
    });

    it('handles achievements where progress properties are null', () => {
      const achievementWithNullProgress = {
        id: 'null-progress',
        title: 'Null Progress Achievement',
        description: 'Achievement with null progress',
        type: 'bronze' as const,
        progress: null as any
      };

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNullProgress]} />);
      }).not.toThrow();

      expect(screen.getByText('Null Progress Achievement')).toBeInTheDocument();
    });

    it('handles achievements where progress properties are undefined', () => {
      const achievementWithUndefinedProgress = {
        id: 'undefined-progress',
        title: 'Undefined Progress Achievement',
        description: 'Achievement with undefined progress properties',
        type: 'bronze' as const,
        progress: {
          current: undefined,
          target: undefined,
          percentage: undefined
        } as any
      };

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithUndefinedProgress]} />);
      }).not.toThrow();

      expect(screen.getByText('Undefined Progress Achievement')).toBeInTheDocument();
    });

    it('handles achievements where unlockedAt is null', () => {
      const achievementWithNullUnlockedAt = AchievementFactory.createUnlocked({
        unlockedAt: null as any
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNullUnlockedAt]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('prevents errors when skillMasteries object is null', () => {
      const progressWithNullSkills = AchievementProgressFactory.create({
        skillMasteries: null as any
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievementData={progressWithNullSkills} />);
      }).not.toThrow();
    });

    it('prevents errors when skillMasteries object is undefined', () => {
      const progressWithUndefinedSkills = AchievementProgressFactory.create({
        skillMasteries: undefined as any
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievementData={progressWithUndefinedSkills} />);
      }).not.toThrow();
    });

    it('handles achievements with invalid type values', () => {
      const achievementWithInvalidType = {
        id: 'invalid-type',
        title: 'Invalid Type Achievement',
        description: 'Achievement with invalid type',
        type: 'invalid-type' as any
      };

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithInvalidType]} />);
      }).not.toThrow();

      expect(screen.getByText('Invalid Type Achievement')).toBeInTheDocument();
    });

    it('handles achievements with invalid rarity values', () => {
      const achievementWithInvalidRarity = AchievementFactory.create({
        rarity: 'invalid-rarity' as any
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithInvalidRarity]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });
  });

  describe('Data Type Validation', () => {
    it('handles non-string title values', () => {
      const achievementWithNonStringTitle = {
        id: 'non-string-title',
        title: 123 as any,
        description: 'Achievement with non-string title',
        type: 'bronze' as const
      };

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNonStringTitle]} />);
      }).not.toThrow();
    });

    it('handles non-string description values', () => {
      const achievementWithNonStringDescription = {
        id: 'non-string-desc',
        title: 'Non-string Description',
        description: { text: 'Object description' } as any,
        type: 'bronze' as const
      };

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNonStringDescription]} />);
      }).not.toThrow();
    });

    it('handles non-number points values', () => {
      const achievementWithNonNumberPoints = AchievementFactory.create({
        points: 'fifty' as any
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNonNumberPoints]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('handles negative points values', () => {
      const achievementWithNegativePoints = AchievementFactory.create({
        points: -50
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNegativePoints]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
      expect(screen.getByText('-50 pts')).toBeInTheDocument();
    });

    it('handles non-number progress values', () => {
      const achievementWithInvalidProgress = AchievementFactory.create({
        progress: {
          current: 'three' as any,
          target: 'five' as any,
          percentage: 'sixty percent' as any
        }
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithInvalidProgress]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });
  });

  describe('Array and Object Edge Cases', () => {
    it('handles empty achievements array gracefully', () => {
      render(<Achievements {...defaultProps} achievements={[]} />);
      
      expect(screen.getByText('No achievements found')).toBeInTheDocument();
      expect(screen.getByText("You haven't unlocked any achievements in this category yet. Keep learning!")).toBeInTheDocument();
    });

    it('handles null achievements array', () => {
      expect(() => {
        render(<Achievements {...defaultProps} achievements={null as any} />);
      }).not.toThrow();
    });

    it('handles undefined achievements array', () => {
      expect(() => {
        render(<Achievements {...defaultProps} achievements={undefined} />);
      }).not.toThrow();
    });

    it('handles mixed valid and invalid achievements in array', () => {
      const mixedAchievements = [
        AchievementFactory.create({ id: 'valid-1' }),
        null,
        undefined,
        AchievementFactory.create({ id: 'valid-2' }),
        { id: 'incomplete', title: 'Incomplete' }, // Missing required props
        AchievementFactory.create({ id: 'valid-3' })
      ];

      expect(() => {
        render(<Achievements {...defaultProps} achievements={mixedAchievements as any} />);
      }).not.toThrow();

      // Should render valid achievements
      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });
  });

  describe('Date Handling Edge Cases', () => {
    it('handles invalid date strings in earned_at', () => {
      const achievementWithInvalidDate = AchievementFactory.createFromApiResponse({
        earned_at: 'invalid-date-string'
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithInvalidDate]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('handles non-string earned_at values', () => {
      const achievementWithNonStringDate = AchievementFactory.createFromApiResponse({
        earned_at: 123456789 as any
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNonStringDate]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('handles null date values', () => {
      const achievementWithNullDate = AchievementFactory.createFromApiResponse({
        earned_at: null as any
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNullDate]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('handles Date objects that are invalid', () => {
      const achievementWithInvalidDateObject = AchievementFactory.createUnlocked({
        unlockedAt: new Date('invalid') // Invalid Date object
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithInvalidDateObject]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });
  });

  describe('Computation Edge Cases', () => {
    it('handles division by zero in percentage calculation', () => {
      const achievementWithZeroTarget = AchievementFactory.create({
        progress: {
          current: 5,
          target: 0, // Division by zero scenario
          percentage: 0
        }
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithZeroTarget]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('handles negative progress values', () => {
      const achievementWithNegativeProgress = AchievementFactory.create({
        progress: {
          current: -2,
          target: 5,
          percentage: -40
        }
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithNegativeProgress]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('handles progress values exceeding 100%', () => {
      const achievementWithExcessiveProgress = AchievementFactory.create({
        progress: {
          current: 10,
          target: 5,
          percentage: 200
        }
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements=[achievementWithExcessiveProgress]} />);
      }).not.toThrow();

      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('handles very large arrays of achievements', () => {
      const largeAchievementsArray = AchievementFactory.createArray(1000, (index) => ({
        id: `large-achievement-${index}`,
        title: `Large Achievement ${index}`
      }));

      expect(() => {
        render(<Achievements {...defaultProps} achievements={largeAchievementsArray} />);
      }).not.toThrow();
    });

    it('handles achievements with very long strings', () => {
      const achievementWithLongStrings = AchievementFactory.create({
        title: 'A'.repeat(10000),
        description: 'B'.repeat(10000),
        requirements: 'C'.repeat(10000)
      });

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithLongStrings]} />);
      }).not.toThrow();
    });

    it('handles deeply nested object structures', () => {
      const achievementWithDeepNesting = AchievementFactory.create({
        metadata: {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    value: 'deep'
                  }
                }
              }
            }
          }
        }
      } as any);

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithDeepNesting]} />);
      }).not.toThrow();
    });
  });

  describe('Props Validation Edge Cases', () => {
    it('handles null userId', () => {
      expect(() => {
        render(<Achievements {...defaultProps} userId={null as any} />);
      }).not.toThrow();
    });

    it('handles undefined userId', () => {
      expect(() => {
        render(<Achievements {...defaultProps} userId={undefined as any} />);
      }).not.toThrow();
    });

    it('handles non-string userId', () => {
      expect(() => {
        render(<Achievements {...defaultProps} userId={123 as any} />);
      }).not.toThrow();
    });

    it('handles invalid callback functions', () => {
      expect(() => {
        render(
          <Achievements 
            {...defaultProps} 
            onAchievementClick={'not-a-function' as any}
            onFilterChange={null as any}
            onShareAchievement={undefined}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Circular Reference and Recursion', () => {
    it('handles circular references in achievement objects', () => {
      const achievementWithCircularRef: any = AchievementFactory.create({
        id: 'circular'
      });
      
      // Create circular reference
      achievementWithCircularRef.self = achievementWithCircularRef;

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithCircularRef]} />);
      }).not.toThrow();
    });

    it('handles achievements with prototype pollution attempts', () => {
      const maliciousAchievement = AchievementFactory.create({
        '__proto__': { malicious: 'value' },
        'constructor': { prototype: { polluted: true } }
      } as any);

      expect(() => {
        render(<Achievements {...defaultProps} achievements={[maliciousAchievement]} />);
      }).not.toThrow();
    });
  });
});