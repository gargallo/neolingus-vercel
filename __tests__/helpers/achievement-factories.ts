/**
 * Test helpers and factories for achievement-related tests
 */
import { vi } from 'vitest';
import { Achievement, AchievementProgress } from '@/components/academia/achievements';

// Achievement Factory
export class AchievementFactory {
  static create(overrides: Partial<Achievement> = {}): Achievement {
    const defaults: Achievement = {
      id: 'test-achievement',
      title: 'Test Achievement',
      description: 'A test achievement',
      category: 'progress',
      type: 'bronze',
      icon: '🏆',
      points: 10,
      isUnlocked: false,
      progress: {
        current: 0,
        target: 1,
        percentage: 0
      },
      requirements: 'Complete the test',
      rarity: 'common'
    };

    return { ...defaults, ...overrides };
  }

  static createUnlocked(overrides: Partial<Achievement> = {}): Achievement {
    return this.create({
      isUnlocked: true,
      unlockedAt: new Date('2024-01-15'),
      progress: {
        current: 1,
        target: 1,
        percentage: 100
      },
      ...overrides
    });
  }

  static createFromApiResponse(overrides: Partial<Achievement> = {}): Achievement {
    // Simulates data coming from API with different property names
    return this.create({
      earned_at: '2024-01-15T10:30:00.000Z',
      isUnlocked: undefined, // This will be derived from earned_at
      unlockedAt: undefined, // This will be derived from earned_at
      category: undefined, // Will get default
      icon: undefined, // Will get default
      points: undefined, // Will get default
      progress: undefined, // Will get default
      requirements: undefined, // Will get default
      rarity: undefined, // Will get default
      ...overrides
    });
  }

  static createWithMissingProgress(overrides: Partial<Achievement> = {}): Achievement {
    return this.create({
      progress: undefined,
      ...overrides
    });
  }

  static createArray(count: number, overrides: (index: number) => Partial<Achievement> = () => ({})): Achievement[] {
    return Array.from({ length: count }, (_, index) => 
      this.create({
        id: `achievement-${index}`,
        title: `Achievement ${index + 1}`,
        ...overrides(index)
      })
    );
  }

  static createMixedArray(): Achievement[] {
    return [
      this.createUnlocked({
        id: 'unlocked-bronze',
        type: 'bronze',
        category: 'progress',
        rarity: 'common'
      }),
      this.create({
        id: 'locked-silver',
        type: 'silver',
        category: 'streak',
        rarity: 'uncommon'
      }),
      this.createFromApiResponse({
        id: 'api-achievement',
        title: 'API Achievement',
        earned_at: '2024-01-10T15:45:00.000Z'
      }),
      this.createWithMissingProgress({
        id: 'no-progress',
        title: 'No Progress Achievement',
        isUnlocked: true
      })
    ];
  }
}

// AchievementProgress Factory
export class AchievementProgressFactory {
  static create(overrides: Partial<AchievementProgress> = {}): AchievementProgress {
    const defaults: AchievementProgress = {
      userId: 'test-user-id',
      totalPoints: 150,
      unlockedCount: 5,
      totalCount: 20,
      level: 2,
      nextLevelPoints: 200,
      streakDays: 3,
      completedExams: 8,
      averageScore: 78.5,
      studyMinutes: 960,
      skillMasteries: {
        grammar: 75,
        vocabulary: 68,
        reading: 82,
        listening: 70,
        writing: 60,
        speaking: 65
      },
      recentUnlocks: []
    };

    return { ...defaults, ...overrides };
  }

  static createHighProgress(overrides: Partial<AchievementProgress> = {}): AchievementProgress {
    return this.create({
      totalPoints: 450,
      unlockedCount: 15,
      level: 5,
      nextLevelPoints: 500,
      streakDays: 25,
      completedExams: 35,
      averageScore: 92.3,
      studyMinutes: 3600,
      skillMasteries: {
        grammar: 95,
        vocabulary: 88,
        reading: 97,
        listening: 85,
        writing: 79,
        speaking: 83
      },
      ...overrides
    });
  }

  static createEmptyProgress(overrides: Partial<AchievementProgress> = {}): AchievementProgress {
    return this.create({
      totalPoints: 0,
      unlockedCount: 0,
      level: 1,
      nextLevelPoints: 50,
      streakDays: 0,
      completedExams: 0,
      averageScore: 0,
      studyMinutes: 0,
      skillMasteries: {
        grammar: 0,
        vocabulary: 0,
        reading: 0,
        listening: 0,
        writing: 0,
        speaking: 0
      },
      ...overrides
    });
  }
}

// Test Data Scenarios
export const TestScenarios = {
  // Valid achievement data with all properties
  validCompleteAchievement: AchievementFactory.createUnlocked({
    id: 'complete-achievement',
    title: 'Complete Achievement',
    description: 'An achievement with all properties',
    category: 'exam',
    type: 'gold',
    icon: '⭐',
    points: 50,
    unlockedAt: new Date('2024-01-20T14:30:00.000Z'),
    progress: {
      current: 5,
      target: 5,
      percentage: 100
    },
    requirements: 'Complete 5 exams with perfect scores',
    rarity: 'rare'
  }),

  // Achievement data missing progress property
  achievementMissingProgress: AchievementFactory.create({
    id: 'missing-progress',
    title: 'Missing Progress Achievement',
    description: 'Achievement without progress data',
    progress: undefined
  }),

  // Achievement data missing optional properties
  achievementMinimalData: {
    id: 'minimal-achievement',
    title: 'Minimal Achievement',
    description: 'Achievement with minimal data',
    type: 'bronze' as const
    // Missing: category, icon, points, progress, requirements, rarity
  },

  // Empty achievements array
  emptyAchievements: [],

  // API response format vs mock data format
  apiFormatAchievement: {
    id: 'api-achievement',
    title: 'API Achievement',
    description: 'Achievement from API response',
    type: 'silver' as const,
    earned_at: '2024-01-15T10:30:00.000Z'
    // Missing other properties that should be normalized
  },

  // Malformed data that could cause runtime errors
  malformedAchievement: {
    id: 'malformed',
    title: null,
    description: undefined,
    type: 'invalid-type',
    progress: {
      current: 'not-a-number',
      target: null,
      percentage: undefined
    },
    rarity: 'invalid-rarity'
  } as any
};

// Mock functions for testing
export const createMockHandlers = () => ({
  onAchievementClick: vi.fn(),
  onFilterChange: vi.fn(),
  onShareAchievement: vi.fn()
});

// Test utilities
export const TestUtils = {
  // Helper to find achievement by ID in the DOM
  findAchievementById: (container: HTMLElement, id: string) => {
    return container.querySelector(`[data-testid="achievement-${id}"]`);
  },

  // Helper to count achievements by status
  countAchievementsByStatus: (container: HTMLElement) => {
    const unlocked = container.querySelectorAll('.achievement-unlocked').length;
    const locked = container.querySelectorAll('.achievement-locked').length;
    return { unlocked, locked };
  },

  // Helper to simulate window resize for mobile testing
  simulateResize: (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  },

  // Helper to mock navigator.share
  mockNavigatorShare: () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: mockShare
    });
    return mockShare;
  }
};