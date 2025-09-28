/**
 * Comprehensive unit tests for the Achievements component
 * Tests all data scenarios including edge cases that could cause runtime errors
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Achievements } from '@/components/academia/achievements';
import { 
  AchievementFactory, 
  AchievementProgressFactory, 
  TestScenarios, 
  createMockHandlers,
  TestUtils
} from '../helpers/achievement-factories';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } })
  }
};

vi.mock('@/utils/supabase/client', () => ({
  createClient: () => mockSupabase
}));

describe('Achievements Component', () => {
  const defaultProps = {
    userId: 'test-user-id'
  };

  let mockHandlers: ReturnType<typeof createMockHandlers>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockHandlers = createMockHandlers();
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Loading and Error States', () => {
    it('renders loading state correctly', () => {
      render(<Achievements {...defaultProps} isLoading={true} />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getAllByRole('generic').some(el => 
        el.classList.contains('animate-pulse')
      )).toBe(true);
    });

    it('renders error state correctly', () => {
      const errorMessage = 'Failed to load achievements';
      render(<Achievements {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Error loading achievements')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('has proper accessibility attributes in error state', () => {
      render(<Achievements {...defaultProps} error="Test error" />);
      
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-red-50', 'border-red-200');
    });
  });

  describe('Achievement Data Normalization', () => {
    it('handles valid achievement data with all properties', () => {
      const achievements = [TestScenarios.validCompleteAchievement];
      
      render(<Achievements {...defaultProps} achievements={achievements} />);
      
      expect(screen.getByText('Complete Achievement')).toBeInTheDocument();
      expect(screen.getByText('An achievement with all properties')).toBeInTheDocument();
      expect(screen.getByText('⭐')).toBeInTheDocument();
      expect(screen.getByText('50 pts')).toBeInTheDocument();
      expect(screen.getByText('rare')).toBeInTheDocument();
    });

    it('handles achievement data missing progress property', () => {
      const achievements = [TestScenarios.achievementMissingProgress];
      
      render(<Achievements {...defaultProps} achievements={achievements} />);
      
      expect(screen.getByText('Missing Progress Achievement')).toBeInTheDocument();
      // Should not crash and should provide default progress
      expect(screen.queryByText('Progress')).not.toBeInTheDocument(); // No progress bar for locked achievements without progress
    });

    it('handles achievement data missing other optional properties', () => {
      const achievements = [TestScenarios.achievementMinimalData];
      
      render(<Achievements {...defaultProps} achievements={achievements} />);
      
      expect(screen.getByText('Minimal Achievement')).toBeInTheDocument();
      expect(screen.getByText('🏆')).toBeInTheDocument(); // Default icon
      expect(screen.getByText('10 pts')).toBeInTheDocument(); // Default points
      expect(screen.getByText('common')).toBeInTheDocument(); // Default rarity
    });

    it('handles empty achievements array', () => {
      render(<Achievements {...defaultProps} achievements={[]} />);
      
      expect(screen.getByText('No achievements found')).toBeInTheDocument();
      expect(screen.getByText("You haven't unlocked any achievements in this category yet. Keep learning!")).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Show All Achievements' })).toBeInTheDocument();
    });

    it('normalizes API response format vs mock data format', () => {
      const achievements = [TestScenarios.apiFormatAchievement];
      
      render(<Achievements {...defaultProps} achievements={achievements} />);
      
      expect(screen.getByText('API Achievement')).toBeInTheDocument();
      expect(screen.getByText('Achievement from API response')).toBeInTheDocument();
      // Should normalize earned_at to isUnlocked
      expect(screen.getByText('✓ Unlocked 1/15/2024')).toBeInTheDocument();
    });

    it('handles malformed data gracefully without crashing', () => {
      const achievements = [TestScenarios.malformedAchievement];
      
      // This should not throw an error
      expect(() => {
        render(<Achievements {...defaultProps} achievements={achievements} />);
      }).not.toThrow();
    });
  });

  describe('Runtime Error Prevention', () => {
    it('prevents "Cannot read properties of undefined (reading progress)" error', () => {
      const achievementWithUndefinedProgress = AchievementFactory.create({
        progress: undefined,
        isUnlocked: false
      });
      
      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithUndefinedProgress]} />);
      }).not.toThrow();
      
      // Component should render without the progress bar
      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
      expect(screen.queryByText('Progress')).not.toBeInTheDocument();
    });

    it('prevents errors when unlockedAt is undefined', () => {
      const achievementWithUndefinedUnlockedAt = AchievementFactory.createUnlocked({
        unlockedAt: undefined
      });
      
      expect(() => {
        render(<Achievements {...defaultProps} achievements={[achievementWithUndefinedUnlockedAt]} />);
      }).not.toThrow();
      
      expect(screen.getByText('Test Achievement')).toBeInTheDocument();
    });

    it('prevents errors when skillMasteries is undefined in progress data', () => {
      const progressWithoutSkills = AchievementProgressFactory.create({
        skillMasteries: {} as any
      });
      
      expect(() => {
        render(<Achievements {...defaultProps} achievementData={progressWithoutSkills} />);
      }).not.toThrow();
    });

    it('handles null or undefined achievement properties gracefully', () => {
      const problematicAchievement = {
        id: 'problematic',
        title: 'Problematic Achievement',
        description: 'Testing null properties',
        type: 'bronze' as const,
        icon: null,
        points: null,
        rarity: undefined,
        progress: null,
        requirements: undefined
      } as any;
      
      expect(() => {
        render(<Achievements {...defaultProps} achievements={[problematicAchievement]} />);
      }).not.toThrow();
      
      expect(screen.getByText('Problematic Achievement')).toBeInTheDocument();
    });
  });

  describe('Filtering and Sorting', () => {
    const mixedAchievements = AchievementFactory.createMixedArray();
    
    it('filters achievements by category', async () => {
      render(<Achievements {...defaultProps} achievements={mixedAchievements} />);
      
      const categorySelect = screen.getByDisplayValue('All');
      await user.selectOptions(categorySelect, 'progress');
      
      // Should only show progress achievements
      expect(screen.getByText('Achievement 1')).toBeInTheDocument();
      expect(screen.queryByText('Streak achievement')).not.toBeInTheDocument();
    });

    it('filters achievements by status (unlocked/locked)', async () => {
      render(<Achievements {...defaultProps} achievements={mixedAchievements} />);
      
      const statusSelect = screen.getAllByDisplayValue('All')[1]; // Second "All" select
      await user.selectOptions(statusSelect, 'unlocked');
      
      // Should only show unlocked achievements
      expect(screen.getByText('unlocked-bronze')).toBeInTheDocument();
      expect(screen.queryByText('locked-silver')).not.toBeInTheDocument();
    });

    it('sorts achievements by points', async () => {
      const achievements = [
        AchievementFactory.create({ id: 'low-points', points: 10, title: 'Low Points' }),
        AchievementFactory.create({ id: 'high-points', points: 100, title: 'High Points' })
      ];
      
      render(<Achievements {...defaultProps} achievements={achievements} />);
      
      const sortSelect = screen.getByDisplayValue('Recent');
      await user.selectOptions(sortSelect, 'points');
      
      const achievementTitles = screen.getAllByText(/Points/);
      expect(achievementTitles[0]).toHaveTextContent('High Points'); // Higher points first
    });

    it('sorts achievements by rarity', async () => {
      const achievements = [
        AchievementFactory.create({ id: 'common', rarity: 'common', title: 'Common' }),
        AchievementFactory.create({ id: 'legendary', rarity: 'legendary', title: 'Legendary' })
      ];
      
      render(<Achievements {...defaultProps} achievements={achievements} />);
      
      const sortSelect = screen.getByDisplayValue('Recent');
      await user.selectOptions(sortSelect, 'rarity');
      
      const achievementTitles = screen.getAllByText(/(Common|Legendary)/);
      expect(achievementTitles[0]).toHaveTextContent('Legendary'); // Higher rarity first
    });

    it('calls onFilterChange callback when filter changes', async () => {
      render(
        <Achievements 
          {...defaultProps} 
          achievements={mixedAchievements}
          onFilterChange={mockHandlers.onFilterChange}
        />
      );
      
      const statusSelect = screen.getAllByDisplayValue('All')[1];
      await user.selectOptions(statusSelect, 'unlocked');
      
      expect(mockHandlers.onFilterChange).toHaveBeenCalledWith('unlocked');
    });
  });

  describe('User Interactions', () => {
    const testAchievements = AchievementFactory.createArray(3, (index) => ({
      isUnlocked: index === 0, // First achievement is unlocked
      requirements: `Requirement ${index + 1}`
    }));

    it('handles achievement click and shows details', async () => {
      render(
        <Achievements 
          {...defaultProps} 
          achievements={testAchievements}
          onAchievementClick={mockHandlers.onAchievementClick}
        />
      );
      
      const firstAchievement = screen.getByText('Achievement 1');
      await user.click(firstAchievement);
      
      expect(mockHandlers.onAchievementClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'achievement-0' })
      );
      
      // Should show requirements when clicked
      expect(screen.getByText('Requirements')).toBeInTheDocument();
      expect(screen.getByText('Requirement 1')).toBeInTheDocument();
    });

    it('toggles achievement details on multiple clicks', async () => {
      render(<Achievements {...defaultProps} achievements={testAchievements} />);
      
      const firstAchievement = screen.getByText('Achievement 1');
      
      // First click - show details
      await user.click(firstAchievement);
      expect(screen.getByText('Requirements')).toBeInTheDocument();
      
      // Second click - hide details
      await user.click(firstAchievement);
      expect(screen.queryByText('Requirements')).not.toBeInTheDocument();
    });

    it('handles share achievement functionality', async () => {
      const mockShare = TestUtils.mockNavigatorShare();
      const unlockedAchievement = AchievementFactory.createUnlocked();
      
      render(
        <Achievements 
          {...defaultProps} 
          achievements={[unlockedAchievement]}
          onShareAchievement={mockHandlers.onShareAchievement}
        />
      );
      
      const shareButton = screen.getByLabelText('Share achievement');
      await user.click(shareButton);
      
      expect(mockHandlers.onShareAchievement).toHaveBeenCalledWith(unlockedAchievement);
    });

    it('prevents event bubbling on share button click', async () => {
      const unlockedAchievement = AchievementFactory.createUnlocked();
      
      render(
        <Achievements 
          {...defaultProps} 
          achievements={[unlockedAchievement]}
          onAchievementClick={mockHandlers.onAchievementClick}
          onShareAchievement={mockHandlers.onShareAchievement}
        />
      );
      
      const shareButton = screen.getByLabelText('Share achievement');
      await user.click(shareButton);
      
      // Achievement click should not be triggered when share button is clicked
      expect(mockHandlers.onAchievementClick).not.toHaveBeenCalled();
      expect(mockHandlers.onShareAchievement).toHaveBeenCalled();
    });

    it('resets filters when show all button is clicked', async () => {
      render(<Achievements {...defaultProps} achievements={[]} />);
      
      const showAllButton = screen.getByRole('button', { name: 'Show All Achievements' });
      await user.click(showAllButton);
      
      // Should reset filters to 'all'
      const selects = screen.getAllByDisplayValue('All');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      // Mock window dimensions
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 768,
      });
    });

    it('applies mobile layout on small screens', async () => {
      TestUtils.simulateResize(640, 480);
      
      render(<Achievements {...defaultProps} achievements={AchievementFactory.createArray(3)} />);
      
      await waitFor(() => {
        expect(screen.getByRole('main')).toHaveClass('mobile-layout');
      });
    });

    it('applies desktop layout on large screens', async () => {
      TestUtils.simulateResize(1024, 768);
      
      render(<Achievements {...defaultProps} achievements={AchievementFactory.createArray(3)} />);
      
      await waitFor(() => {
        expect(screen.getByRole('main')).not.toHaveClass('mobile-layout');
      });
    });
  });

  describe('Progress Display', () => {
    it('displays progress overview correctly', () => {
      const progressData = AchievementProgressFactory.create({
        level: 3,
        totalPoints: 245,
        unlockedCount: 8,
        totalCount: 24,
        nextLevelPoints: 300
      });
      
      render(<Achievements {...defaultProps} achievementData={progressData} />);
      
      expect(screen.getByText('Your Progress')).toBeInTheDocument();
      expect(screen.getByText('Level 3 • 245 points')).toBeInTheDocument();
      expect(screen.getByText('8/24')).toBeInTheDocument();
      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('Progress to Level 4')).toBeInTheDocument();
      expect(screen.getByText('245/300')).toBeInTheDocument();
    });

    it('displays progress bar with correct percentage', () => {
      const progressData = AchievementProgressFactory.create({
        totalPoints: 150,
        nextLevelPoints: 200
      });
      
      render(<Achievements {...defaultProps} achievementData={progressData} />);
      
      const progressBar = screen.getByRole('generic', { 
        name: (_, element) => element?.classList.contains('bg-blue-600') || false
      });
      
      expect(progressBar).toHaveStyle({ width: '75%' });
    });

    it('displays recent achievements section when available', () => {
      const recentAchievements = AchievementFactory.createArray(2, () => ({ isUnlocked: true }));
      const progressData = AchievementProgressFactory.create({
        recentUnlocks: recentAchievements
      });
      
      render(<Achievements {...defaultProps} achievementData={progressData} />);
      
      expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
      expect(screen.getByText('Achievement 1')).toBeInTheDocument();
      expect(screen.getByText('Achievement 2')).toBeInTheDocument();
    });

    it('hides recent achievements section when empty', () => {
      const progressData = AchievementProgressFactory.create({
        recentUnlocks: []
      });
      
      render(<Achievements {...defaultProps} achievementData={progressData} />);
      
      expect(screen.queryByText('Recent Achievements')).not.toBeInTheDocument();
    });
  });

  describe('Achievement Visual States', () => {
    it('renders unlocked achievements with correct styling', () => {
      const unlockedAchievement = AchievementFactory.createUnlocked();
      
      render(<Achievements {...defaultProps} achievements={[unlockedAchievement]} />);
      
      const achievementCard = screen.getByText('Test Achievement').closest('div')?.parentElement;
      expect(achievementCard).toHaveClass('border-green-200', 'bg-gradient-to-br', 'from-white', 'to-green-50');
    });

    it('renders locked achievements with correct styling', () => {
      const lockedAchievement = AchievementFactory.create({ isUnlocked: false });
      
      render(<Achievements {...defaultProps} achievements={[lockedAchievement]} />);
      
      const achievementCard = screen.getByText('Test Achievement').closest('div')?.parentElement;
      expect(achievementCard).toHaveClass('border-gray-200', 'opacity-75');
    });

    it('displays achievement progress bar for locked achievements', () => {
      const lockedAchievement = AchievementFactory.create({
        isUnlocked: false,
        progress: {
          current: 3,
          target: 5,
          percentage: 60
        }
      });
      
      render(<Achievements {...defaultProps} achievements={[lockedAchievement]} />);
      
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('3/5')).toBeInTheDocument();
    });

    it('displays unlock date for unlocked achievements', () => {
      const unlockedAchievement = AchievementFactory.createUnlocked({
        unlockedAt: new Date('2024-01-15')
      });
      
      render(<Achievements {...defaultProps} achievements={[unlockedAchievement]} />);
      
      expect(screen.getByText('✓ Unlocked 1/15/2024')).toBeInTheDocument();
    });

    it('applies correct type colors', () => {
      const goldAchievement = AchievementFactory.create({ type: 'gold' });
      
      render(<Achievements {...defaultProps} achievements={[goldAchievement]} />);
      
      const typeBadge = screen.getByText('Gold');
      expect(typeBadge).toHaveClass('from-yellow-400', 'to-yellow-600');
    });

    it('applies correct rarity colors', () => {
      const rareAchievement = AchievementFactory.create({ rarity: 'rare' });
      
      render(<Achievements {...defaultProps} achievements={[rareAchievement]} />);
      
      const rarityText = screen.getByText('rare');
      expect(rarityText).toHaveClass('text-blue-600');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<Achievements {...defaultProps} achievements={AchievementFactory.createArray(1)} />);
      
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Sort by/)).toBeInTheDocument();
    });

    it('has accessible share buttons', () => {
      const unlockedAchievement = AchievementFactory.createUnlocked();
      
      render(<Achievements {...defaultProps} achievements={[unlockedAchievement]} />);
      
      expect(screen.getByLabelText('Share achievement')).toBeInTheDocument();
    });

    it('maintains keyboard navigation', async () => {
      const achievements = AchievementFactory.createArray(2);
      
      render(<Achievements {...defaultProps} achievements={achievements} />);
      
      // Should be able to tab through interactive elements
      const categorySelect = screen.getByDisplayValue('All');
      categorySelect.focus();
      expect(document.activeElement).toBe(categorySelect);
    });
  });
});