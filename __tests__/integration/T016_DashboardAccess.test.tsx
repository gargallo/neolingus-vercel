/**
 * T016: Dashboard Access - Integration Test
 * 
 * Tests complete dashboard access workflow with real-time data.
 * This test validates:
 * - Authentication state verification
 * - Course enrollment validation
 * - Real-time progress data loading
 * - Dashboard component rendering
 * - Navigation and state management
 * - Real-time updates via Supabase subscriptions
 * 
 * NOTE: This test will FAIL initially (TDD approach) until components are implemented.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import CourseDashboard from '@/components/academia/course-dashboard'
import ProgressAnalytics from '@/components/academia/progress-analytics'
import StudentHeroSection from '@/components/academia/student-hero-section'
import { spanishTranslations } from '@/lib/translations/spanish'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('@supabase/auth-helpers-nextjs')

// Mock real-time subscription
const mockSubscription = {
  unsubscribe: jest.fn(),
}

const mockChannel = {
  on: jest.fn(() => mockChannel),
  subscribe: jest.fn(() => mockSubscription),
}

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
}

const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      in: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    })),
    insert: jest.fn(),
    update: jest.fn(),
  })),
  channel: jest.fn(() => mockChannel),
  removeChannel: jest.fn(),
}

const mockUserSession = {
  access_token: 'token-123',
  user: {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: {
      name: 'Test User'
    }
  }
}

const mockCourseData = {
  id: 'eoi-english-b2',
  name: 'English B2',
  description: 'Intermediate English course for EOI certification',
  language: 'english',
  level: 'b2',
  provider: 'eoi',
  total_questions: 120,
  exam_duration: 180,
  passing_score: 70,
  is_active: true,
}

const mockEnrollmentData = {
  id: 'enrollment-123',
  user_id: 'user-123',
  course_id: 'eoi-english-b2',
  enrolled_at: '2024-01-15T10:00:00.000Z',
  status: 'active',
  progress: {
    completed_lessons: 15,
    total_lessons: 30,
    completion_percentage: 50,
    current_streak: 7,
    last_activity: '2024-01-20T14:30:00.000Z'
  }
}

const mockExamSessions = [
  {
    id: 'session-1',
    user_id: 'user-123',
    course_id: 'eoi-english-b2',
    score: 85,
    total_questions: 50,
    correct_answers: 43,
    started_at: '2024-01-18T09:00:00.000Z',
    completed_at: '2024-01-18T11:30:00.000Z',
    status: 'completed'
  },
  {
    id: 'session-2',
    user_id: 'user-123',
    course_id: 'eoi-english-b2',
    score: 78,
    total_questions: 30,
    correct_answers: 23,
    started_at: '2024-01-19T15:00:00.000Z',
    completed_at: '2024-01-19T16:15:00.000Z',
    status: 'completed'
  }
]

const mockRecommendations = [
  {
    id: 'rec-1',
    type: 'study_focus',
    title: 'Focus on Grammar',
    description: 'You scored lower on grammar questions. Practice conditional sentences.',
    priority: 'high',
    created_at: '2024-01-20T08:00:00.000Z'
  },
  {
    id: 'rec-2',
    type: 'practice_exam',
    title: 'Take Practice Exam',
    description: 'You are ready for a comprehensive practice exam.',
    priority: 'medium',
    created_at: '2024-01-20T08:00:00.000Z'
  }
]

describe('T016: Dashboard Access with Real-time Data', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)
  })

  it('should load authenticated dashboard with complete user data', async () => {
    // Mock authenticated session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    // Mock course data
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'courses') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockCourseData,
              error: null
            })
          })
        }
      }
      if (table === 'course_enrollments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockEnrollmentData,
              error: null
            })
          })
        }
      }
      if (table === 'exam_sessions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockExamSessions,
                error: null
              })
            })
          })
        }
      }
      if (table === 'ai_recommendations') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockRecommendations,
                error: null
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    // Mock real-time subscription setup
    mockSupabase.channel.mockReturnValue(mockChannel)
    mockChannel.on.mockReturnValue(mockChannel)
    mockChannel.subscribe.mockReturnValue(mockSubscription)

    render(<CourseDashboard courseId="eoi-english-b2" />)

    // Verify authentication check
    await waitFor(() => {
      expect(mockSupabase.auth.getSession).toHaveBeenCalled()
    })

    // Verify course data loading
    await waitFor(() => {
      expect(screen.getByText('English B2')).toBeInTheDocument()
    })

    // Verify Spanish hero section
    expect(screen.getByText('¡Bienvenido de vuelta a tu Academia Personal!')).toBeInTheDocument()
    expect(screen.getByText('Tu viaje de aprendizaje te está esperando')).toBeInTheDocument()

    // Verify Spanish course progress
    expect(screen.getByText('50% Completado')).toBeInTheDocument()
    expect(screen.getByText('15/30 Lecciones')).toBeInTheDocument()

    // Verify exam history with Spanish labels
    expect(screen.getByText('Resultados de Exámenes Recientes')).toBeInTheDocument()
    expect(screen.getByText('85%')).toBeInTheDocument() // Latest score
    expect(screen.getByText('78%')).toBeInTheDocument() // Previous score

    // Verify AI recommendations with Spanish text
    expect(screen.getByText('Recomendaciones Personalizadas')).toBeInTheDocument()
    expect(screen.getByText('Enfócate en Gramática')).toBeInTheDocument()
    expect(screen.getByText('Toma un Examen de Práctica')).toBeInTheDocument()

    // Verify streak information in Spanish
    expect(screen.getByText('7 días de Racha')).toBeInTheDocument()

    // Verify real-time subscription setup
    expect(mockSupabase.channel).toHaveBeenCalledWith('course_progress')
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'course_enrollments'
      }),
      expect.any(Function)
    )
  })

  it('should handle real-time progress updates', async () => {
    // Setup initial dashboard state
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'course_enrollments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockEnrollmentData,
              error: null
            })
          })
        }
      }
      return mockSupabase.from()
    })

    // Capture the real-time callback
    let realtimeCallback: Function
    mockChannel.on.mockImplementation((event, filter, callback) => {
      realtimeCallback = callback
      return mockChannel
    })

    render(<CourseDashboard courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(screen.getByText('50% Completado')).toBeInTheDocument()
    })

    // Simulate real-time progress update
    const updatedProgress = {
      ...mockEnrollmentData,
      progress: {
        ...mockEnrollmentData.progress,
        completed_lessons: 20,
        completion_percentage: 67,
        current_streak: 8
      }
    }

    act(() => {
      realtimeCallback({
        eventType: 'UPDATE',
        new: updatedProgress,
        old: mockEnrollmentData
      })
    })

    // Verify UI updates with new data (Spanish interface)
    await waitFor(() => {
      expect(screen.getByText('67% Completado')).toBeInTheDocument()
    })

    expect(screen.getByText('20/30 Lecciones')).toBeInTheDocument()
    expect(screen.getByText('8 días de Racha')).toBeInTheDocument()
  })

  it('should handle unauthenticated access', async () => {
    // Mock no session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    })

    render(<CourseDashboard courseId="eoi-english-b2" />)

    // Should redirect to auth
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/signin?redirect=/dashboard/english/b2')
    })

    // Should not attempt to load course data
    expect(mockSupabase.from).not.toHaveBeenCalled()
  })

  it('should handle missing course enrollment', async () => {
    // Mock authenticated session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    // Mock no enrollment found
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'course_enrollments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: null
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<CourseDashboard courseId="eoi-english-b2" />)

    // Should show enrollment required message in Spanish
    await waitFor(() => {
      expect(screen.getByText('Inscripción al curso requerida')).toBeInTheDocument()
    })

    expect(screen.getByText('Inscribirse Ahora')).toBeInTheDocument()
  })

  it('should handle dashboard navigation and interactions', async () => {
    // Setup authenticated dashboard
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'course_enrollments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockEnrollmentData,
              error: null
            })
          })
        }
      }
      if (table === 'exam_sessions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockExamSessions,
                error: null
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<CourseDashboard courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(screen.getByText('English B2')).toBeInTheDocument()
    })

    // Test navigation to exam simulator (Spanish buttons)
    const startExamButton = screen.getByText('Comenzar Examen de Práctica')
    fireEvent.click(startExamButton)

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/english/b2/examens/eoi/practice/simulador')

    // Test navigation to study materials
    const studyButton = screen.getByText('Materiales de Estudio')
    fireEvent.click(studyButton)

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/english/b2/study')

    // Test AI tutor activation
    const aiTutorButton = screen.getByText('Preguntar al Tutor IA')
    fireEvent.click(aiTutorButton)

    // Should open AI tutor modal or component
    await waitFor(() => {
      expect(screen.getByText('Chat del Tutor IA')).toBeInTheDocument()
    })
  })

  it('should handle data loading errors gracefully', async () => {
    // Mock authenticated session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    // Mock course data loading error
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'course_enrollments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<CourseDashboard courseId="eoi-english-b2" />)

    // Should display error state in Spanish
    await waitFor(() => {
      expect(screen.getByText('Error al cargar datos del panel')).toBeInTheDocument()
    })

    expect(screen.getByText('Conexión a la base de datos falló')).toBeInTheDocument()
    expect(screen.getByText('Reintentar')).toBeInTheDocument()
  })

  it('should handle real-time connection failures', async () => {
    // Setup initial dashboard
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'course_enrollments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockEnrollmentData,
              error: null
            })
          })
        }
      }
      return mockSupabase.from()
    })

    // Mock subscription failure
    mockChannel.subscribe.mockImplementation(() => {
      throw new Error('Failed to establish real-time connection')
    })

    render(<CourseDashboard courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(screen.getByText('English B2')).toBeInTheDocument()
    })

    // Should show connection status warning in Spanish
    expect(screen.getByText('Sincronización en tiempo real no disponible')).toBeInTheDocument()

    // Should still show static data in Spanish
    expect(screen.getByText('50% Completado')).toBeInTheDocument()
  })

  it('should cleanup subscriptions on unmount', async () => {
    // Setup dashboard with subscription
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockEnrollmentData,
          error: null
        })
      })
    })

    const { unmount } = render(<CourseDashboard courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalled()
    })

    // Unmount component
    unmount()

    // Should cleanup subscription
    expect(mockSubscription.unsubscribe).toHaveBeenCalled()
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
  })

  it('should render StudentHeroSection with Spanish translations and animations', async () => {
    const mockUser = {
      id: 'user-123',
      firstName: 'Ana',
      email: 'ana@example.com'
    }

    const mockStats = {
      coursesActive: 2,
      studyStreak: 5,
      totalXP: 1250,
      hoursStudied: 24
    }

    const mockOnAction = jest.fn()

    render(
      <StudentHeroSection
        user={mockUser}
        stats={mockStats}
        onAction={mockOnAction}
      />
    )

    // Verify Spanish welcome message with user name
    expect(screen.getByText('¡Bienvenido de vuelta, Ana!')).toBeInTheDocument()
    expect(screen.getByText('Tu viaje de aprendizaje te está esperando')).toBeInTheDocument()

    // Verify quick stats in Spanish
    expect(screen.getByText('2')).toBeInTheDocument() // courses active
    expect(screen.getByText('Cursos Activos')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument() // study streak
    expect(screen.getByText('días de racha')).toBeInTheDocument()
    expect(screen.getByText('1,250')).toBeInTheDocument() // total XP
    expect(screen.getByText('XP Total')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument() // hours studied
    expect(screen.getByText('Horas de Estudio')).toBeInTheDocument()

    // Verify action buttons in Spanish
    expect(screen.getByText('Continuar Estudiando')).toBeInTheDocument()
    expect(screen.getByText('Ver Progreso')).toBeInTheDocument()

    // Test button interactions
    const continueButton = screen.getByText('Continuar Estudiando')
    fireEvent.click(continueButton)
    expect(mockOnAction).toHaveBeenCalledWith('continue')

    const progressButton = screen.getByText('Ver Progreso')
    fireEvent.click(progressButton)
    expect(mockOnAction).toHaveBeenCalledWith('progress')

    // Verify motivational message rotation
    await waitFor(() => {
      const motivationalText = screen.getByText(/Cada día es una nueva oportunidad|Tu dedicación está construyendo/)
      expect(motivationalText).toBeInTheDocument()
    })
  })

  it('should handle StudentHeroSection with default user name', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@example.com'
      // No firstName provided
    }

    const mockStats = {
      coursesActive: 1,
      studyStreak: 0,
      totalXP: 0,
      hoursStudied: 0
    }

    render(
      <StudentHeroSection
        user={mockUser}
        stats={mockStats}
        onAction={jest.fn()}
      />
    )

    // Should use default name "Estudiante"
    expect(screen.getByText('¡Bienvenido de vuelta, Estudiante!')).toBeInTheDocument()

    // Should handle zero stats gracefully
    expect(screen.getByText('0')).toBeInTheDocument() // streak
    expect(screen.getByText('Comienza tu primera racha')).toBeInTheDocument()
  })
})