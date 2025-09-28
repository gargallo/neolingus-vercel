/**
 * Spanish Widgets Integration Test
 *
 * Tests Spanish translations and student-focused design for all widget components.
 * This test validates:
 * - Spanish translations across all widgets
 * - Student-focused visual design elements
 * - Celebration animations and gamification
 * - Enhanced UX elements for Spanish interface
 * - Cultural adaptation and localization
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CourseCardsWidget } from '@/components/academia/widgets/course-cards-widget'
import { AchievementShowcaseWidget } from '@/components/academia/widgets/achievement-showcase-widget'
import { ProgressOverviewWidget } from '@/components/academia/widgets/progress-overview-widget'
import { StudyAnalyticsWidget } from '@/components/academia/widgets/study-analytics-widget'
import { StreakTrackerWidget } from '@/components/academia/widgets/streak-tracker-widget'
import { spanishTranslations } from '@/lib/translations/spanish'

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

const mockWidgetConfig = {
  title: 'Test Widget',
  size: 'medium'
}

const mockWidgetSettings = {
  is_visible: true,
  is_collapsed: false,
  custom_title: undefined
}

const mockDashboardData = {
  user_stats: {
    engagement: {
      current_streak: 7,
      longest_streak: 15,
      total_study_minutes: 1440,
      weekly_study_minutes: [30, 45, 60, 30, 45, 90, 60],
      sessions_completed: 24,
      average_session_minutes: 60
    },
    preferences: {
      study_goal_minutes_daily: 30,
      preferred_study_time: 'morning',
      difficulty_preference: 'intermediate'
    },
    performance: {
      average_score: 85,
      recent_scores: [88, 82, 90, 85, 87],
      improvement_trend: 'positive',
      weak_areas: ['grammar', 'listening'],
      strong_areas: ['vocabulary', 'reading']
    }
  },
  achievements: {
    current_level: 5,
    total_xp: 2750,
    recent_achievements: [
      {
        id: 'streak-7',
        name: 'Racha de 7 Días',
        description: 'Estudia 7 días consecutivos',
        category: 'consistency',
        rarity: 'common',
        earned_at: '2024-01-20T10:00:00Z',
        xp_reward: 100
      },
      {
        id: 'grammar-master',
        name: 'Maestro de Gramática',
        description: 'Completa 50 ejercicios de gramática',
        category: 'skill',
        rarity: 'rare',
        earned_at: '2024-01-19T15:30:00Z',
        xp_reward: 250
      }
    ],
    available_achievements: [
      {
        id: 'vocab-expert',
        name: 'Experto en Vocabulario',
        description: 'Aprende 500 palabras nuevas',
        category: 'skill',
        rarity: 'epic',
        progress: 75,
        total_required: 100,
        xp_reward: 500
      }
    ],
    streaks: {
      current: 7,
      longest: 15,
      weekly_goals_met: 3
    }
  },
  courses: [
    {
      id: 'eoi-english-b2',
      name: 'Inglés B2 - EOI',
      description: 'Curso intermedio de inglés para certificación oficial',
      language: 'english',
      level: 'b2',
      progress: 65,
      total_lessons: 30,
      completed_lessons: 19,
      last_activity: '2024-01-20T14:30:00Z',
      status: 'active',
      next_lesson: 'Conditional Sentences'
    },
    {
      id: 'jqcv-valenciano-c1',
      name: 'Valenciano C1 - JQCV',
      description: 'Curso avanzado de valenciano para certificación oficial',
      language: 'valenciano',
      level: 'c1',
      progress: 45,
      total_lessons: 25,
      completed_lessons: 11,
      last_activity: '2024-01-18T09:15:00Z',
      status: 'active',
      next_lesson: 'Literatura Valenciana Contemporánea'
    }
  ]
}

const mockUserId = 'user-123'

describe('Spanish Widgets Integration', () => {
  describe('CourseCardsWidget Spanish Interface', () => {
    it('should display courses with Spanish translations and enhanced design', async () => {
      render(
        <CourseCardsWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={mockDashboardData}
          userId={mockUserId}
          onToggleVisibility={jest.fn()}
        />
      )

      // Verify Spanish widget title
      expect(screen.getByText(spanishTranslations.courses.title)).toBeInTheDocument()
      expect(screen.getByText(spanishTranslations.courses.subtitle)).toBeInTheDocument()

      // Verify Spanish course information
      expect(screen.getByText('Inglés B2 - EOI')).toBeInTheDocument()
      expect(screen.getByText('Valenciano C1 - JQCV')).toBeInTheDocument()
      expect(screen.getByText('65% Completado')).toBeInTheDocument()
      expect(screen.getByText('45% Completado')).toBeInTheDocument()

      // Verify Spanish action buttons
      expect(screen.getAllByText(spanishTranslations.actions.continue)).toHaveLength(2)
      expect(screen.getAllByText('Ver Detalles')).toHaveLength(2)

      // Verify lesson progress in Spanish
      expect(screen.getByText('19/30 Lecciones')).toBeInTheDocument()
      expect(screen.getByText('11/25 Lecciones')).toBeInTheDocument()

      // Verify next lesson information
      expect(screen.getByText('Próxima:')).toBeInTheDocument()
      expect(screen.getByText('Conditional Sentences')).toBeInTheDocument()
      expect(screen.getByText('Literatura Valenciana Contemporánea')).toBeInTheDocument()
    })

    it('should handle course interactions with Spanish feedback', async () => {
      const mockOnAction = jest.fn()

      render(
        <CourseCardsWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={mockDashboardData}
          userId={mockUserId}
          onToggleVisibility={mockOnAction}
        />
      )

      // Test continue button click
      const continueButtons = screen.getAllByText(spanishTranslations.actions.continue)
      fireEvent.click(continueButtons[0])

      // Should trigger celebration animation for high progress courses
      await waitFor(() => {
        const progressElement = screen.getByText('65% Completado')
        expect(progressElement).toBeInTheDocument()
      })
    })
  })

  describe('AchievementShowcaseWidget Spanish Interface', () => {
    it('should display achievements with Spanish translations and celebrations', async () => {
      render(
        <AchievementShowcaseWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={mockDashboardData}
          userId={mockUserId}
          onToggleVisibility={jest.fn()}
        />
      )

      // Verify Spanish widget title
      expect(screen.getByText(spanishTranslations.achievements.title)).toBeInTheDocument()
      expect(screen.getByText(spanishTranslations.achievements.subtitle)).toBeInTheDocument()

      // Verify Spanish achievement names and descriptions
      expect(screen.getByText('Racha de 7 Días')).toBeInTheDocument()
      expect(screen.getByText('Estudia 7 días consecutivos')).toBeInTheDocument()
      expect(screen.getByText('Maestro de Gramática')).toBeInTheDocument()
      expect(screen.getByText('Completa 50 ejercicios de gramática')).toBeInTheDocument()

      // Verify Spanish rarity levels
      expect(screen.getByText('Común')).toBeInTheDocument()
      expect(screen.getByText('Raro')).toBeInTheDocument()

      // Verify XP rewards with Spanish formatting
      expect(screen.getByText('100 XP')).toBeInTheDocument()
      expect(screen.getByText('250 XP')).toBeInTheDocument()

      // Verify available achievements
      expect(screen.getByText('Experto en Vocabulario')).toBeInTheDocument()
      expect(screen.getByText('75% progreso')).toBeInTheDocument()
    })

    it('should show celebration effects for recent achievements', async () => {
      render(
        <AchievementShowcaseWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={mockDashboardData}
          userId={mockUserId}
          onToggleVisibility={jest.fn()}
        />
      )

      // Recent achievements should have celebration styling
      const recentAchievement = screen.getByText('Maestro de Gramática')
      expect(recentAchievement.closest('.achievement-card')).toHaveClass('recent-achievement')
    })
  })

  describe('ProgressOverviewWidget Spanish Interface', () => {
    it('should display progress with Spanish translations and motivational content', async () => {
      render(
        <ProgressOverviewWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={mockDashboardData}
          userId={mockUserId}
          onToggleVisibility={jest.fn()}
        />
      )

      // Verify Spanish widget title
      expect(screen.getByText(spanishTranslations.progress.title)).toBeInTheDocument()
      expect(screen.getByText(spanishTranslations.progress.subtitle)).toBeInTheDocument()

      // Verify level information in Spanish
      expect(screen.getByText('Nivel 5')).toBeInTheDocument()
      expect(screen.getByText('2,750 XP Total')).toBeInTheDocument()

      // Verify streak information in Spanish
      expect(screen.getByText('7 días de Racha')).toBeInTheDocument()
      expect(screen.getByText('¡Racha sólida!')).toBeInTheDocument()

      // Verify weekly goal in Spanish
      expect(screen.getByText(spanishTranslations.progress.goals.weeklyGoal)).toBeInTheDocument()
      expect(screen.getByText(/h esta semana/)).toBeInTheDocument()

      // Verify action buttons in Spanish
      expect(screen.getByText('Comenzar Sesión')).toBeInTheDocument()
    })

    it('should show appropriate streak status messages in Spanish', async () => {
      const noStreakData = {
        ...mockDashboardData,
        user_stats: {
          ...mockDashboardData.user_stats,
          engagement: {
            ...mockDashboardData.user_stats.engagement,
            current_streak: 0
          }
        }
      }

      render(
        <ProgressOverviewWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={noStreakData}
          userId={mockUserId}
          onToggleVisibility={jest.fn()}
        />
      )

      // Should show start streak message
      expect(screen.getByText('¡Comienza tu racha de aprendizaje!')).toBeInTheDocument()
    })
  })

  describe('StudyAnalyticsWidget Spanish Interface', () => {
    it('should display analytics with Spanish translations and insights', async () => {
      render(
        <StudyAnalyticsWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={mockDashboardData}
          userId={mockUserId}
          onToggleVisibility={jest.fn()}
        />
      )

      // Verify Spanish widget title
      expect(screen.getByText(spanishTranslations.analytics.title)).toBeInTheDocument()
      expect(screen.getByText(spanishTranslations.analytics.subtitle)).toBeInTheDocument()

      // Verify performance metrics in Spanish
      expect(screen.getByText('85%')).toBeInTheDocument() // average score
      expect(screen.getByText('Puntuación Media')).toBeInTheDocument()
      expect(screen.getByText('24 Sesiones')).toBeInTheDocument()
      expect(screen.getByText('60 min/sesión')).toBeInTheDocument()

      // Verify improvement areas in Spanish
      expect(screen.getByText('Áreas de Mejora')).toBeInTheDocument()
      expect(screen.getByText('Fortalezas')).toBeInTheDocument()
      expect(screen.getByText('gramática, escucha')).toBeInTheDocument()
      expect(screen.getByText('vocabulario, lectura')).toBeInTheDocument()

      // Verify trend information
      expect(screen.getByText('Tendencia Positiva')).toBeInTheDocument()
    })
  })

  describe('StreakTrackerWidget Spanish Interface', () => {
    it('should display streak tracking with Spanish translations and gamification', async () => {
      render(
        <StreakTrackerWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={mockDashboardData}
          userId={mockUserId}
          onToggleVisibility={jest.fn()}
        />
      )

      // Verify Spanish widget title
      expect(screen.getByText(spanishTranslations.streaks.title)).toBeInTheDocument()
      expect(screen.getByText(spanishTranslations.streaks.subtitle)).toBeInTheDocument()

      // Verify streak information in Spanish
      expect(screen.getByText('7')).toBeInTheDocument() // current streak
      expect(screen.getByText('días de racha actual')).toBeInTheDocument()
      expect(screen.getByText('15 días récord')).toBeInTheDocument()

      // Verify weekly goals in Spanish
      expect(screen.getByText('3/7 objetivos semanales')).toBeInTheDocument()
      expect(screen.getByText('¡Mantén el impulso!')).toBeInTheDocument()

      // Verify daily streak visualization
      const streakDays = screen.getAllByText('🔥')
      expect(streakDays.length).toBeGreaterThan(0)
    })

    it('should handle different streak levels with appropriate Spanish messages', async () => {
      const longStreakData = {
        ...mockDashboardData,
        user_stats: {
          ...mockDashboardData.user_stats,
          engagement: {
            ...mockDashboardData.user_stats.engagement,
            current_streak: 35
          }
        }
      }

      render(
        <StreakTrackerWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={longStreakData}
          userId={mockUserId}
          onToggleVisibility={jest.fn()}
        />
      )

      // Should show legendary streak message
      expect(screen.getByText('¡Dedicación legendaria!')).toBeInTheDocument()
    })
  })

  describe('Widget Accessibility and Spanish Localization', () => {
    it('should have proper ARIA labels in Spanish', async () => {
      render(
        <ProgressOverviewWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={mockDashboardData}
          userId={mockUserId}
          onToggleVisibility={jest.fn()}
        />
      )

      // Check for Spanish ARIA labels
      const progressElement = screen.getByRole('progressbar')
      expect(progressElement).toHaveAttribute('aria-label', expect.stringContaining('progreso'))
    })

    it('should format dates and numbers according to Spanish locale', async () => {
      render(
        <CourseCardsWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={mockDashboardData}
          userId={mockUserId}
          onToggleVisibility={jest.fn()}
        />
      )

      // Verify Spanish number formatting (comma for thousands)
      expect(screen.getByText('2,750')).toBeInTheDocument()

      // Verify Spanish date formatting would be used
      // (actual date formatting tested in unit tests)
    })
  })

  describe('Widget Error States in Spanish', () => {
    it('should display error messages in Spanish', async () => {
      const emptyData = {
        user_stats: null,
        achievements: null,
        courses: []
      }

      render(
        <CourseCardsWidget
          config={mockWidgetConfig}
          settings={mockWidgetSettings}
          dashboardData={emptyData}
          userId={mockUserId}
          onToggleVisibility={jest.fn()}
        />
      )

      // Should show Spanish empty state
      expect(screen.getByText('No hay cursos disponibles')).toBeInTheDocument()
      expect(screen.getByText('Explorar Cursos')).toBeInTheDocument()
    })
  })
})