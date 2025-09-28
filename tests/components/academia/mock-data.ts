/**
 * Mock Data for Academia Dashboard Components
 * Comprehensive mock data structures for testing dashboard functionality
 */

import { vi } from 'vitest';

// Course Data Mocks
export const mockCourseData = {
  basic: {
    id: 'course-english-b2',
    title: 'English B2 Preparation',
    level: 'B2',
    language: 'English',
    description: 'Comprehensive B2 level English course with Cambridge certification preparation',
    provider: 'cambridge',
    providerName: 'Cambridge Assessment',
    totalExams: 25,
    completedExams: 8,
    averageScore: 78.5,
    timeSpent: 12.5,
    lastActivity: new Date('2024-09-15T14:30:00Z'),
    examTypes: ['reading', 'listening', 'writing', 'speaking'],
    nextExam: {
      id: 'exam-cambridge-b2-001',
      title: 'Cambridge B2 First Reading & Use of English',
      providerSlug: 'cambridge',
      providerName: 'Cambridge Assessment',
      difficulty: 'official',
      estimatedTime: 75
    }
  },

  valenciano: {
    id: 'course-valenciano-c1',
    title: 'Valenciano C1 Preparation',
    level: 'C1',
    language: 'Valenciano',
    description: 'Advanced Valenciano course for C1 certification',
    provider: 'jqcv',
    providerName: 'Junta Qualificadora de Coneixements de Valencià',
    totalExams: 15,
    completedExams: 3,
    averageScore: 65.2,
    timeSpent: 8.2,
    lastActivity: new Date('2024-09-10T10:15:00Z'),
    examTypes: ['comprensio_oral', 'comprensio_escrita', 'expressio_oral', 'expressio_escrita'],
    nextExam: null
  }
};

// Progress Data Mocks
export const mockProgressData = {
  active: {
    overallProgress: 68.5,
    recentActivity: [
      {
        id: 'activity-001',
        type: 'exam_completed',
        examTitle: 'Cambridge B2 Reading Simulator',
        topic: 'Reading Comprehension',
        score: 82,
        duration: 3600, // 1 hour in seconds
        date: new Date('2024-09-15T14:30:00Z')
      },
      {
        id: 'activity-002',
        type: 'exam_completed',
        examTitle: 'Listening Practice Test',
        topic: 'Listening Skills',
        score: 75,
        duration: 2400, // 40 minutes
        date: new Date('2024-09-14T16:20:00Z')
      },
      {
        id: 'activity-003',
        type: 'practice_session',
        examTitle: 'Grammar Focus Session',
        topic: 'Grammar & Vocabulary',
        score: 88,
        duration: 1800, // 30 minutes
        date: new Date('2024-09-13T11:45:00Z')
      },
      {
        id: 'activity-004',
        type: 'exam_completed',
        examTitle: 'Writing Task Practice',
        topic: 'Writing Skills',
        score: 70,
        duration: 2700, // 45 minutes
        date: new Date('2024-09-12T09:30:00Z')
      },
      {
        id: 'activity-005',
        type: 'exam_completed',
        examTitle: 'Speaking Simulation',
        topic: 'Speaking Practice',
        score: 85,
        duration: 900, // 15 minutes
        date: new Date('2024-09-11T15:10:00Z')
      }
    ],
    weeklyStats: {
      sessionsCompleted: 7,
      hoursStudied: 8.5,
      averageScore: 78.2,
      improvement: 12.3
    }
  },

  empty: {
    overallProgress: 0,
    recentActivity: [],
    weeklyStats: {
      sessionsCompleted: 0,
      hoursStudied: 0,
      averageScore: 0,
      improvement: 0
    }
  }
};

// Available Exams Mock Data
export const mockAvailableExams = [
  {
    examId: 'cambridge-b2-reading',
    title: 'B2 First Reading & Use of English',
    providerSlug: 'cambridge',
    providerName: 'Cambridge Assessment',
    duration: 75,
    difficulty: 'official'
  },
  {
    examId: 'cambridge-b2-listening',
    title: 'B2 First Listening',
    providerSlug: 'cambridge',
    providerName: 'Cambridge Assessment',
    duration: 40,
    difficulty: 'official'
  },
  {
    examId: 'cambridge-b2-writing',
    title: 'B2 First Writing',
    providerSlug: 'cambridge',
    providerName: 'Cambridge Assessment',
    duration: 80,
    difficulty: 'official'
  },
  {
    examId: 'eoi-b2-practice',
    title: 'EOI B2 Practice Test',
    providerSlug: 'eoi',
    providerName: 'Escuela Oficial de Idiomas',
    duration: 120,
    difficulty: 'practice'
  }
];

// User Progress Mock Data
export const mockUserProgress = {
  complete: {
    id: 'progress-001',
    user_id: 'user-123',
    course_id: 'course-english-b2',
    component_progress: {
      reading: 0.82,
      listening: 0.75,
      writing: 0.68,
      speaking: 0.71
    },
    average_score: 75.8,
    readiness_score: 0.74,
    total_sessions: 15,
    estimated_study_hours: 12.5,
    last_session: '2024-09-15T14:30:00Z',
    target_exam_date: '2024-12-15',
    created_at: '2024-08-01T00:00:00Z',
    updated_at: '2024-09-15T14:30:00Z',
    analytics: {
      componentAnalysis: {
        reading: {
          averageScore: 82,
          bestScore: 95,
          sessionsCompleted: 5,
          timeSpent: 4200,
          weakAreas: ['inference', 'vocabulary_context'],
          strongAreas: ['main_ideas', 'detail_comprehension']
        },
        listening: {
          averageScore: 75,
          bestScore: 88,
          sessionsCompleted: 4,
          timeSpent: 2400,
          weakAreas: ['fast_speech', 'accent_variety'],
          strongAreas: ['specific_information']
        },
        writing: {
          averageScore: 68,
          bestScore: 80,
          sessionsCompleted: 3,
          timeSpent: 3600,
          weakAreas: ['cohesion', 'range_vocabulary'],
          strongAreas: ['task_achievement', 'grammar']
        },
        speaking: {
          averageScore: 71,
          bestScore: 85,
          sessionsCompleted: 3,
          timeSpent: 1800,
          weakAreas: ['fluency', 'pronunciation'],
          strongAreas: ['interaction', 'coherence']
        }
      }
    }
  },

  minimal: {
    id: 'progress-002',
    user_id: 'user-123',
    course_id: 'course-english-b2',
    component_progress: {
      reading: 0.20,
      listening: 0.15,
      writing: 0.10,
      speaking: 0.05
    },
    average_score: 45.2,
    readiness_score: 0.12,
    total_sessions: 2,
    estimated_study_hours: 1.5,
    last_session: '2024-09-10T10:00:00Z',
    target_exam_date: null,
    created_at: '2024-09-08T00:00:00Z',
    updated_at: '2024-09-10T10:00:00Z',
    analytics: null
  }
};

// Dashboard Statistics Mock Data
export const mockDashboardStats = {
  comprehensive: [
    {
      label: 'Overall progress',
      value: '68%',
      helper: '15 sessions completed',
      trend: 'up',
      color: 'blue'
    },
    {
      label: 'Readiness score',
      value: '74%',
      helper: 'Target exam Dec 15, 2024',
      trend: 'up',
      color: 'green'
    },
    {
      label: 'Average score',
      value: '76%',
      helper: '8 completed exams',
      trend: 'stable',
      color: 'purple'
    },
    {
      label: 'Study time',
      value: '12.5h',
      helper: 'Last session 2 days ago',
      trend: 'up',
      color: 'orange'
    }
  ],

  empty: [
    {
      label: 'Overall progress',
      value: '0%',
      helper: '0 sessions completed',
      trend: null,
      color: 'blue'
    },
    {
      label: 'Readiness score',
      value: '—',
      helper: undefined,
      trend: null,
      color: 'green'
    },
    {
      label: 'Average score',
      value: '—',
      helper: 'No exams completed yet',
      trend: null,
      color: 'purple'
    },
    {
      label: 'Study time',
      value: '—',
      helper: undefined,
      trend: null,
      color: 'orange'
    }
  ]
};

// Course Statistics Mock Data for DashboardStats Component
export const mockCourseStats = [
  {
    id: 'progress',
    label: 'Progress',
    value: 75,
    displayValue: '75%',
    variant: 'progress',
    change: {
      value: 5,
      direction: 'up' as const,
      period: '+5% from last week'
    },
    ariaLabel: 'Course progress: 75 percent, increased by 5 percent from last week'
  },
  {
    id: 'exams',
    label: 'Exams Completed',
    value: 12,
    displayValue: '12',
    variant: 'exams',
    change: {
      value: 2,
      direction: 'up' as const,
      period: '+2 this week'
    },
    ariaLabel: 'Exams completed: 12, increased by 2 this week'
  },
  {
    id: 'score',
    label: 'Average Score',
    value: 85,
    displayValue: '85%',
    variant: 'score',
    change: {
      value: 3,
      direction: 'up' as const,
      period: '+3% improvement'
    },
    ariaLabel: 'Average score: 85 percent, improved by 3 percent'
  },
  {
    id: 'hours',
    label: 'Study Hours',
    value: 24,
    displayValue: '24h',
    variant: 'hours',
    change: {
      value: 2,
      direction: 'up' as const,
      period: 'This month'
    },
    ariaLabel: 'Study hours: 24 hours this month'
  }
];

// Quick Actions Mock Data
export const mockQuickActions = [
  {
    id: 'action-start-exam',
    title: 'Start Next Exam',
    description: 'Continue with Cambridge B2 Reading test',
    icon: '🎯',
    priority: 'high',
    enabled: true,
    handler: 'handleStartExam'
  },
  {
    id: 'action-practice-hub',
    title: 'Open Practice Hub',
    description: 'Browse available simulators',
    icon: '📚',
    priority: 'medium',
    enabled: true,
    handler: 'handleOpenPractice'
  },
  {
    id: 'action-view-analytics',
    title: 'View Analytics',
    description: 'See detailed progress breakdown',
    icon: '📈',
    priority: 'medium',
    enabled: true,
    handler: 'handleViewAnalytics'
  },
  {
    id: 'action-ai-tutor',
    title: 'AI Tutor Session',
    description: 'Get personalized coaching',
    icon: '🤖',
    priority: 'low',
    enabled: true,
    handler: 'handleAITutor'
  },
  {
    id: 'action-refresh',
    title: 'Refresh Data',
    description: 'Update dashboard information',
    icon: '🔄',
    priority: 'low',
    enabled: true,
    handler: 'handleRefresh'
  }
];

// Component Props Mock Generators
export const createMockHandlers = () => ({
  onStartExam: vi.fn(),
  onViewProgress: vi.fn(),
  onViewHistory: vi.fn(),
  onRefresh: vi.fn(),
  onOpenPractice: vi.fn(),
  onViewAnalytics: vi.fn(),
  onAITutor: vi.fn()
});

export const createMockCourseContextValue = (overrides = {}) => ({
  selectedProvider: 'cambridge',
  setSelectedProvider: vi.fn(),
  course: mockCourseData.basic,
  isLoading: false,
  error: null,
  ...overrides
});

// API Response Mocks
export const mockApiResponses = {
  courseProgress: {
    success: {
      success: true,
      data: {
        progress: mockUserProgress.complete,
        analytics: mockUserProgress.complete.analytics
      }
    },
    error: {
      success: false,
      error: 'Failed to fetch course progress',
      message: 'Unable to retrieve progress data'
    }
  },

  examSessions: {
    success: {
      success: true,
      data: [
        {
          id: 'session-001',
          examId: 'cambridge-b2-reading',
          userId: 'user-123',
          isCompleted: true,
          score: 82,
          durationSeconds: 3600,
          startedAt: '2024-09-15T14:30:00Z',
          completedAt: '2024-09-15T15:30:00Z',
          sessionType: 'reading'
        },
        {
          id: 'session-002',
          examId: 'cambridge-b2-listening',
          userId: 'user-123',
          isCompleted: true,
          score: 75,
          durationSeconds: 2400,
          startedAt: '2024-09-14T16:20:00Z',
          completedAt: '2024-09-14T17:00:00Z',
          sessionType: 'listening'
        }
      ]
    },
    empty: {
      success: true,
      data: []
    }
  },

  recommendations: {
    success: {
      success: true,
      data: [
        {
          id: 'rec-001',
          title: 'Practice more listening exercises',
          description: 'Focus on accent variety and fast speech patterns',
          priority: 'high',
          actionUrl: '/practice/listening'
        },
        {
          id: 'rec-002',
          title: 'Review writing cohesion techniques',
          description: 'Improve linking words and paragraph structure',
          priority: 'medium',
          actionUrl: '/practice/writing'
        }
      ]
    }
  }
};

// Test State Scenarios
export const testScenarios = {
  loading: {
    courseData: null,
    progressData: null,
    isLoading: true,
    error: null
  },

  error: {
    courseData: null,
    progressData: null,
    isLoading: false,
    error: 'Failed to load dashboard data'
  },

  empty: {
    courseData: null,
    progressData: null,
    isLoading: false,
    error: null
  },

  complete: {
    courseData: mockCourseData.basic,
    progressData: mockProgressData.active,
    isLoading: false,
    error: null
  },

  noProgress: {
    courseData: mockCourseData.basic,
    progressData: mockProgressData.empty,
    isLoading: false,
    error: null
  }
};

// Responsive Breakpoints for Testing
export const mockBreakpoints = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  largeDesktop: { width: 1440, height: 900 }
};

// User Context Mock Data
export const mockUserContext = {
  admin: {
    id: 'user-admin',
    email: 'admin@example.com',
    full_name: 'Admin User',
    role: 'admin'
  },
  student: {
    id: 'user-123',
    email: 'student@example.com',
    full_name: 'Test Student',
    role: 'user'
  }
};

// User Profile Mock Data
export const mockUserProfile = {
  id: 'user-123',
  email: 'student@example.com',
  full_name: 'Test Student',
  role: 'user',
  created_at: '2024-08-01T00:00:00Z',
  updated_at: '2024-09-15T14:30:00Z',
  preferences: {
    language: 'en',
    timezone: 'UTC',
    notifications: true
  }
};

// User Enrollment Mock Data
export const mockEnrollment = {
  id: 'enrollment-001',
  user_id: 'user-123',
  course_id: 'course-english-b2',
  subscription_tier: 'premium',
  enrolled_at: '2024-08-01T00:00:00Z',
  expires_at: '2024-12-31T23:59:59Z',
  is_active: true,
  payment_status: 'paid'
};

// Achievement Mock Data
export const mockAchievements = [
  {
    id: 'achievement-001',
    title: 'First Steps',
    description: 'Complete your first exam',
    type: 'milestone',
    earned_at: '2024-09-01T10:00:00Z'
  },
  {
    id: 'achievement-002',
    title: 'Reading Master',
    description: 'Score 80% or higher on 5 reading tests',
    type: 'skill',
    earned_at: '2024-09-10T15:30:00Z'
  },
  {
    id: 'achievement-003',
    title: 'Study Streak',
    description: 'Practice for 7 consecutive days',
    type: 'habit',
    earned_at: null // Not yet earned
  }
];

// Validation Helpers
export const validateMockData = {
  courseData: (data: any) => {
    return Boolean(
      data &&
      typeof data.id === 'string' &&
      typeof data.title === 'string' &&
      typeof data.totalExams === 'number' &&
      typeof data.completedExams === 'number'
    );
  },

  progressData: (data: any) => {
    return Boolean(
      data &&
      typeof data.overallProgress === 'number' &&
      Array.isArray(data.recentActivity) &&
      data.weeklyStats &&
      typeof data.weeklyStats.sessionsCompleted === 'number'
    );
  },

  userProgress: (data: any) => {
    return Boolean(
      data &&
      typeof data.id === 'string' &&
      data.component_progress &&
      typeof data.average_score === 'number'
    );
  }
};

export default {
  mockCourseData,
  mockProgressData,
  mockAvailableExams,
  mockUserProgress,
  mockDashboardStats,
  mockCourseStats,
  mockQuickActions,
  mockApiResponses,
  testScenarios,
  mockBreakpoints,
  mockUserContext,
  mockUserProfile,
  mockEnrollment,
  mockAchievements,
  createMockHandlers,
  createMockCourseContextValue,
  validateMockData
};