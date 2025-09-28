"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

// Achievement types and interfaces
interface Achievement {
  id: string;
  title: string;
  description: string;
  category?: 'progress' | 'streak' | 'skill' | 'exam' | 'social' | 'special';
  type: 'bronze' | 'silver' | 'gold' | 'platinum' | 'milestone';
  icon?: string;
  points?: number;
  unlockedAt?: Date;
  isUnlocked?: boolean;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
  requirements?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  // Support for different data formats
  earned_at?: string;
}

interface AchievementProgress {
  userId: string;
  totalPoints: number;
  unlockedCount: number;
  totalCount: number;
  level: number;
  nextLevelPoints: number;
  streakDays: number;
  completedExams: number;
  averageScore: number;
  studyMinutes: number;
  skillMasteries: Record<string, number>;
  recentUnlocks: Achievement[];
}

interface AchievementsProps {
  userId: string;
  courseId?: string;
  achievementData?: AchievementProgress;
  achievements?: Achievement[];
  isLoading?: boolean;
  error?: string | null;
  onAchievementClick?: (achievement: Achievement) => void;
  onFilterChange?: (filter: string) => void;
  onShareAchievement?: (achievement: Achievement) => void;
  showOnlyUnlocked?: boolean;
}

// Mock achievements data
const generateMockAchievements = (progress: AchievementProgress): Achievement[] => [
  // Progress achievements
  {
    id: 'first_exam',
    title: 'First Steps',
    description: 'Complete your first exam',
    category: 'progress',
    type: 'bronze',
    icon: '🎯',
    points: 10,
    isUnlocked: progress.completedExams >= 1,
    unlockedAt: progress.completedExams >= 1 ? new Date() : undefined,
    progress: {
      current: Math.min(progress.completedExams, 1),
      target: 1,
      percentage: Math.min(progress.completedExams / 1 * 100, 100)
    },
    requirements: 'Complete 1 exam',
    rarity: 'common'
  },
  {
    id: 'exam_master',
    title: 'Exam Master',
    description: 'Complete 50 exams',
    category: 'progress',
    type: 'gold',
    icon: '🏆',
    points: 100,
    isUnlocked: progress.completedExams >= 50,
    unlockedAt: progress.completedExams >= 50 ? new Date() : undefined,
    progress: {
      current: Math.min(progress.completedExams, 50),
      target: 50,
      percentage: Math.min(progress.completedExams / 50 * 100, 100)
    },
    requirements: 'Complete 50 exams',
    rarity: 'epic'
  },
  // Streak achievements
  {
    id: 'week_streak',
    title: 'Weekly Warrior',
    description: 'Study for 7 days in a row',
    category: 'streak',
    type: 'silver',
    icon: '🔥',
    points: 25,
    isUnlocked: progress.streakDays >= 7,
    unlockedAt: progress.streakDays >= 7 ? new Date() : undefined,
    progress: {
      current: Math.min(progress.streakDays, 7),
      target: 7,
      percentage: Math.min(progress.streakDays / 7 * 100, 100)
    },
    requirements: 'Study for 7 consecutive days',
    rarity: 'uncommon'
  },
  {
    id: 'month_streak',
    title: 'Dedication Master',
    description: 'Study for 30 days in a row',
    category: 'streak',
    type: 'platinum',
    icon: '💎',
    points: 200,
    isUnlocked: progress.streakDays >= 30,
    unlockedAt: progress.streakDays >= 30 ? new Date() : undefined,
    progress: {
      current: Math.min(progress.streakDays, 30),
      target: 30,
      percentage: Math.min(progress.streakDays / 30 * 100, 100)
    },
    requirements: 'Study for 30 consecutive days',
    rarity: 'legendary'
  },
  // Skill achievements
  {
    id: 'grammar_expert',
    title: 'Grammar Expert',
    description: 'Master grammar skills',
    category: 'skill',
    type: 'gold',
    icon: '📚',
    points: 75,
    isUnlocked: (progress.skillMasteries.grammar || 0) >= 90,
    unlockedAt: (progress.skillMasteries.grammar || 0) >= 90 ? new Date() : undefined,
    progress: {
      current: Math.min(progress.skillMasteries.grammar || 0, 90),
      target: 90,
      percentage: Math.min((progress.skillMasteries.grammar || 0) / 90 * 100, 100)
    },
    requirements: 'Achieve 90% proficiency in grammar',
    rarity: 'rare'
  },
  // Exam achievements
  {
    id: 'perfect_score',
    title: 'Perfectionist',
    description: 'Get a perfect score on an exam',
    category: 'exam',
    type: 'gold',
    icon: '⭐',
    points: 50,
    isUnlocked: progress.averageScore >= 100,
    unlockedAt: progress.averageScore >= 100 ? new Date() : undefined,
    progress: {
      current: Math.min(progress.averageScore, 100),
      target: 100,
      percentage: Math.min(progress.averageScore, 100)
    },
    requirements: 'Score 100% on any exam',
    rarity: 'rare'
  },
  // Study time achievements
  {
    id: 'study_time_100',
    title: 'Dedicated Learner',
    description: 'Study for 100 hours total',
    category: 'progress',
    type: 'silver',
    icon: '⏰',
    points: 40,
    isUnlocked: progress.studyMinutes >= 6000, // 100 hours
    unlockedAt: progress.studyMinutes >= 6000 ? new Date() : undefined,
    progress: {
      current: Math.min(progress.studyMinutes, 6000),
      target: 6000,
      percentage: Math.min(progress.studyMinutes / 6000 * 100, 100)
    },
    requirements: 'Study for 100 hours total',
    rarity: 'uncommon'
  }
];

export function Achievements({
  userId,
  courseId,
  achievementData,
  achievements: providedAchievements,
  isLoading = false,
  error = null,
  onAchievementClick,
  onFilterChange,
  onShareAchievement,
  showOnlyUnlocked = false
}: AchievementsProps) {
  const [filter, setFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'points' | 'rarity'>('recent');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const supabase = createClient();

  // Mock progress data if not provided
  const mockProgress: AchievementProgress = achievementData || {
    userId,
    totalPoints: 245,
    unlockedCount: 8,
    totalCount: 24,
    level: 3,
    nextLevelPoints: 300,
    streakDays: 12,
    completedExams: 15,
    averageScore: 85.5,
    studyMinutes: 1200,
    skillMasteries: {
      grammar: 88,
      vocabulary: 75,
      reading: 92,
      listening: 78,
      writing: 65,
      speaking: 71
    },
    recentUnlocks: []
  };

  // Normalize and generate achievements if not provided
  const achievements = useMemo(() => {
    if (providedAchievements && providedAchievements.length > 0) {
      // Normalize provided achievements to match expected interface
      return providedAchievements.map(achievement => ({
        ...achievement,
        category: achievement.category || 'progress',
        icon: achievement.icon || '🏆',
        points: achievement.points || 10,
        isUnlocked: achievement.isUnlocked ?? (!!achievement.earned_at),
        unlockedAt: achievement.unlockedAt || (achievement.earned_at ? new Date(achievement.earned_at) : undefined),
        progress: achievement.progress || {
          current: achievement.isUnlocked ?? (!!achievement.earned_at) ? 1 : 0,
          target: 1,
          percentage: achievement.isUnlocked ?? (!!achievement.earned_at) ? 100 : 0
        },
        requirements: achievement.requirements || 'Complete the required action',
        rarity: achievement.rarity || 'common'
      }));
    }
    return generateMockAchievements(mockProgress);
  }, [providedAchievements, mockProgress]);

  // Set recent unlocks
  useEffect(() => {
    if (!mockProgress.recentUnlocks.length) {
      const recentlyUnlocked = achievements
        .filter(a => a.isUnlocked)
        .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
        .slice(0, 3);
      mockProgress.recentUnlocks = recentlyUnlocked;
    }
  }, [achievements, mockProgress]);

  // Responsive design detection
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Filter and sort achievements
  const filteredAchievements = useMemo(() => {
    let filtered = achievements;

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    // Apply unlock status filter
    if (showOnlyUnlocked) {
      filtered = filtered.filter(a => a.isUnlocked);
    } else if (filter === 'unlocked') {
      filtered = filtered.filter(a => a.isUnlocked);
    } else if (filter === 'locked') {
      filtered = filtered.filter(a => !a.isUnlocked);
    }

    // Sort achievements
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          if (a.isUnlocked && b.isUnlocked) {
            return (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0);
          }
          return a.isUnlocked ? -1 : b.isUnlocked ? 1 : 0;
        case 'points':
          return b.points - a.points;
        case 'rarity':
          const rarityOrder = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        default:
          return 0;
      }
    });

    return filtered;
  }, [achievements, selectedCategory, showOnlyUnlocked, filter, sortBy]);

  // Handle filter changes
  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    if (onFilterChange) {
      onFilterChange(newFilter);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleAchievementClick = (achievement: Achievement) => {
    setShowDetails(showDetails === achievement.id ? null : achievement.id);
    if (onAchievementClick) {
      onAchievementClick(achievement);
    }
  };

  const handleShareAchievement = (achievement: Achievement) => {
    if (onShareAchievement) {
      onShareAchievement(achievement);
    } else {
      // Default share behavior
      if (typeof navigator !== 'undefined' && navigator.share && typeof window !== 'undefined') {
        navigator.share({
          title: `Achievement Unlocked: ${achievement.title}`,
          text: `I just unlocked "${achievement.title}" - ${achievement.description}`,
          url: window.location.href
        });
      }
    }
  };

  // Get achievement type color
  const getTypeColor = (type: Achievement['type']) => {
    switch (type) {
      case 'bronze':
        return 'from-amber-600 to-amber-800 text-white';
      case 'silver':
        return 'from-gray-400 to-gray-600 text-white';
      case 'gold':
        return 'from-yellow-400 to-yellow-600 text-white';
      case 'platinum':
        return 'from-purple-400 to-purple-600 text-white';
      case 'milestone':
        return 'from-blue-400 to-blue-600 text-white';
      default:
        return 'from-gray-200 to-gray-400 text-gray-800';
    }
  };

  // Get rarity color
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'text-gray-600';
      case 'uncommon':
        return 'text-green-600';
      case 'rare':
        return 'text-blue-600';
      case 'epic':
        return 'text-purple-600';
      case 'legendary':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
          <h3 className="text-red-800 font-medium">Error loading achievements</h3>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className={`max-w-6xl mx-auto px-4 py-8 ${isMobile ? 'mobile-layout' : ''}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Achievements</h1>
        
        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 border mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Your Progress</h2>
              <p className="text-gray-600">Level {mockProgress.level} • {mockProgress.totalPoints} points</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {mockProgress.unlockedCount}/{mockProgress.totalCount}
              </div>
              <div className="text-sm text-gray-600">Achievements</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress to Level {mockProgress.level + 1}</span>
              <span>{mockProgress.totalPoints}/{mockProgress.nextLevelPoints}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(mockProgress.totalPoints / mockProgress.nextLevelPoints) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Unlocks */}
      {mockProgress.recentUnlocks.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockProgress.recentUnlocks.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{achievement.icon || '🏆'}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-green-600 font-medium">
                        +{achievement.points} points
                      </span>
                      {achievement.unlockedAt && (
                        <span className="text-xs text-gray-500">
                          {achievement.unlockedAt.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        {/* Category Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="progress">Progress</option>
            <option value="streak">Streak</option>
            <option value="skill">Skill</option>
            <option value="exam">Exam</option>
            <option value="social">Social</option>
            <option value="special">Special</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="unlocked">Unlocked</option>
            <option value="locked">Locked</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'points' | 'rarity')}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="recent">Recent</option>
            <option value="points">Points</option>
            <option value="rarity">Rarity</option>
          </select>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            onClick={() => handleAchievementClick(achievement)}
            className={`bg-white rounded-xl shadow-sm border transition-all duration-200 cursor-pointer hover:shadow-md ${
              achievement.isUnlocked 
                ? 'border-green-200 bg-gradient-to-br from-white to-green-50' 
                : 'border-gray-200 opacity-75'
            }`}
          >
            <div className="p-6">
              {/* Achievement Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className={`text-4xl ${!achievement.isUnlocked ? 'grayscale opacity-50' : ''}`}
                  >
                    {achievement.icon || '🏆'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{achievement.title}</h3>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                </div>
                {achievement.isUnlocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareAchievement(achievement);
                    }}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label="Share achievement"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92S19.61 16.08 18 16.08z"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Achievement Details */}
              <div className="space-y-3">
                {/* Type and Points */}
                <div className="flex items-center justify-between">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getTypeColor(achievement.type)}`}>
                    {achievement.type?.charAt(0).toUpperCase() + achievement.type?.slice(1)}
                  </div>
                  <div className="flex items-center space-x-2">
                    {achievement.rarity && (
                      <span className={`text-sm font-medium ${getRarityColor(achievement.rarity)}`}>
                        {achievement.rarity}
                      </span>
                    )}
                    <span className="text-sm font-bold text-gray-900">
                      {achievement.points || 0} pts
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {!achievement.isUnlocked && achievement.progress && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{achievement.progress.current}/{achievement.progress.target}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${achievement.progress.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Unlock Date */}
                {achievement.isUnlocked && achievement.unlockedAt && (
                  <div className="text-xs text-green-600 font-medium">
                    ✓ Unlocked {achievement.unlockedAt.toLocaleDateString()}
                  </div>
                )}

                {/* Expanded Details */}
                {showDetails === achievement.id && achievement.requirements && (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements</h4>
                    <p className="text-sm text-gray-600">{achievement.requirements}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'unlocked' 
                ? "You haven't unlocked any achievements in this category yet. Keep learning!" 
                : "No achievements match your current filters."}
            </p>
            <button
              onClick={() => {
                setFilter('all');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Show All Achievements
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default Achievements;