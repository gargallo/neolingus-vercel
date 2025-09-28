/**
 * T020: Valenciano Localization - Integration Test
 * 
 * Tests complete Valenciano language course workflow with localization.
 * This test validates:
 * - Language-specific UI localization
 * - Cultural adaptation of content
 * - Valenciano-specific exam formats (JQCV)
 * - Regional compliance requirements
 * - Native language support features
 * - Accessibility in Valenciano
 * - Cultural context awareness
 * 
 * NOTE: This test will FAIL initially (TDD approach) until components are implemented.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import CourseSelection from '@/components/academia/course-selection'
import CourseDashboard from '@/components/academia/course-dashboard'
import ExamSimulator from '@/components/academia/exam-simulator'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('@supabase/auth-helpers-nextjs')

// Mock internationalization
jest.mock('next-intl', () => ({
  useTranslations: (namespace: string) => (key: string, params?: any) => {
    const translations: Record<string, Record<string, string>> = {
      common: {
        loading: 'Carregant...',
        error: 'Error',
        retry: 'Tornar a intentar',
        cancel: 'Cancel·lar',
        confirm: 'Confirmar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        close: 'Tancar'
      },
      courses: {
        title: 'Cursos Disponibles',
        description: 'Tria el teu curs de valencià',
        enroll: 'Inscriure\'s',
        enrolled: 'Inscrit',
        level_c1: 'Nivell C1',
        level_c2: 'Nivell C2',
        provider_jqcv: 'Junta Qualificadora de Coneixements de Valencià',
        duration: 'Duració',
        questions: 'Preguntes',
        passing_score: 'Nota mínima'
      },
      dashboard: {
        welcome: 'Benvingut/da, {name}!',
        progress: 'Progrés',
        lessons_completed: 'Lliçons completades',
        study_streak: 'Dies consecutius',
        recent_exams: 'Exàmens recents',
        recommendations: 'Recomanacions personalitzades',
        start_exam: 'Començar examen',
        study_materials: 'Materials d\'estudi',
        ai_tutor: 'Tutor IA'
      },
      exam: {
        title: 'Simulador d\'Examen JQCV',
        instructions: 'Instruccions de l\'examen',
        time_remaining: 'Temps restant',
        question_number: 'Pregunta {current} de {total}',
        next_question: 'Següent pregunta',
        previous_question: 'Pregunta anterior',
        submit_exam: 'Lliurar examen',
        confirm_submit: 'Estàs segur que vols lliurar l\'examen?',
        results: 'Resultats de l\'examen',
        score: 'Puntuació',
        passed: 'APROVAT',
        failed: 'SUSPÈS',
        review_answers: 'Revisar respostes'
      }
    }
    
    const namespaceTranslations = translations[namespace] || {}
    let translation = namespaceTranslations[key] || key
    
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{${param}}`, params[param])
      })
    }
    
    return translation
  },
  useLocale: () => 'val'
}))

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
}

const mockSupabase = {
  auth: {
    getSession: jest.fn(),
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
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  })),
}

const mockUserSession = {
  access_token: 'token-123',
  user: {
    id: 'user-123',
    email: 'test@exemple.com',
    user_metadata: {
      name: 'Joan Pérez',
      preferred_locale: 'val'
    }
  }
}

const mockValencianoCourses = [
  {
    id: 'jqcv-valenciano-c1',
    name: 'Valencià C1',
    description: 'Curs avançat de valencià per a la certificació JQCV nivell C1',
    language: 'valenciano',
    level: 'c1',
    provider: 'jqcv',
    total_questions: 100,
    exam_duration: 150,
    passing_score: 75,
    is_active: true,
    cultural_context: {
      region: 'Comunitat Valenciana',
      dialect: 'Central',
      official_recognition: 'Generalitat Valenciana'
    },
    exam_format: {
      oral_component: true,
      written_component: true,
      listening_component: true,
      cultural_knowledge: true
    }
  },
  {
    id: 'jqcv-valenciano-c2',
    name: 'Valencià C2',
    description: 'Curs superior de valencià per a la certificació JQCV nivell C2',
    language: 'valenciano',
    level: 'c2',
    provider: 'jqcv',
    total_questions: 120,
    exam_duration: 180,
    passing_score: 80,
    is_active: true,
    cultural_context: {
      region: 'Comunitat Valenciana',
      dialect: 'Central',
      official_recognition: 'Generalitat Valenciana'
    },
    exam_format: {
      oral_component: true,
      written_component: true,
      listening_component: true,
      cultural_knowledge: true,
      literary_analysis: true
    }
  }
]

const mockValencianoQuestions = [
  {
    id: 'val-q1',
    section: 'comprensio_lectora',
    type: 'multiple_choice',
    question: 'Quin és el tema principal del text?',
    context: 'Text sobre la història de València...',
    options: [
      { id: 'a', text: 'La fundació de València' },
      { id: 'b', text: 'El desenvolupament econòmic' },
      { id: 'c', text: 'Les tradicions valencianes' },
      { id: 'd', text: 'L\'arquitectura de la ciutat' }
    ],
    correct_answer: 'a',
    cultural_notes: 'Referència a la història local valenciana',
    difficulty: 'medium'
  },
  {
    id: 'val-q2',
    section: 'expressions',
    type: 'fill_blank',
    question: 'Completa l\'expressió valenciana: "Estar com una ______"',
    options: [
      { id: 'a', text: 'cabra' },
      { id: 'b', text: 'xiva' },
      { id: 'c', text: 'mona' },
      { id: 'd', text: 'pera' }
    ],
    correct_answer: 'b',
    cultural_notes: 'Expressió típicament valenciana que significa estar molt content',
    difficulty: 'hard'
  },
  {
    id: 'val-q3',
    section: 'cultura_valenciana',
    type: 'true_false',
    question: 'Les Falles es celebren durant el mes de març a València.',
    options: [
      { id: 'true', text: 'Cert' },
      { id: 'false', text: 'Fals' }
    ],
    correct_answer: 'true',
    cultural_notes: 'Festa tradicional valenciana declarada Patrimoni de la Humanitat per la UNESCO',
    difficulty: 'easy'
  }
]

const mockCulturalContent = {
  regional_info: {
    official_name: 'Comunitat Valenciana',
    co_official_languages: ['Valencià', 'Castellà'],
    cultural_institutions: [
      'Institut Valencià de Cultura',
      'Acadèmia Valenciana de la Llengua',
      'Junta Qualificadora de Coneixements de Valencià'
    ]
  },
  traditions: [
    {
      name: 'Falles',
      date: 'Març',
      description: 'Festa tradicional amb monuments artístics que es cremen'
    },
    {
      name: 'Moros i Cristians',
      date: 'Variable segons la localitat',
      description: 'Representació històrica de la reconquesta'
    }
  ],
  linguistic_features: {
    dialect_variants: ['Central', 'Nord-Occidental', 'Meridional', 'Balear', 'Alguerès'],
    official_spelling: 'Normes de l\'AVL (Acadèmia Valenciana de la Llengua)',
    distinctive_features: [
      'Manteniment de la /v/ labial',
      'Distinció entre è i é',
      'Vocabulari propi diferent del català oriental'
    ]
  }
}

describe('T020: Valenciano Language Course Workflow with Localization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)

    // Set document language
    document.documentElement.lang = 'val'
  })

  it('should display course selection in Valenciano with cultural context', async () => {
    // Mock authenticated user with Valenciano preference
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    // Mock Valenciano courses
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'courses') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockValencianoCourses,
                error: null
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<CourseSelection language="valenciano" />)

    // Should display in Valenciano
    await waitFor(() => {
      expect(screen.getByText('Cursos Disponibles')).toBeInTheDocument()
    })

    expect(screen.getByText('Tria el teu curs de valencià')).toBeInTheDocument()

    // Should show Valenciano-specific courses
    expect(screen.getByText('Valencià C1')).toBeInTheDocument()
    expect(screen.getByText('Valencià C2')).toBeInTheDocument()

    // Should display JQCV provider information
    expect(screen.getByText('Junta Qualificadora de Coneixements de Valencià')).toBeInTheDocument()

    // Should show cultural context
    expect(screen.getByText('Comunitat Valenciana')).toBeInTheDocument()
    expect(screen.getByText('Generalitat Valenciana')).toBeInTheDocument()

    // Course details should include Valenciano-specific information
    const c1Course = screen.getByTestId('course-card-jqcv-valenciano-c1')
    fireEvent.click(c1Course)

    await waitFor(() => {
      expect(screen.getByText('Detalls del Curs')).toBeInTheDocument()
    })

    // Should show exam format specific to JQCV
    expect(screen.getByText('Component oral: Inclòs')).toBeInTheDocument()
    expect(screen.getByText('Component escrit: Inclòs')).toBeInTheDocument()
    expect(screen.getByText('Coneixements culturals: Inclòs')).toBeInTheDocument()

    // Should display regional compliance
    expect(screen.getByText('Reconeixement oficial')).toBeInTheDocument()
    expect(screen.getByText('Vàlid per a l\'administració pública valenciana')).toBeInTheDocument()
  })

  it('should provide culturally adapted dashboard experience', async () => {
    // Setup authenticated Valenciano user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    const mockProgressData = {
      course_id: 'jqcv-valenciano-c1',
      completion_percentage: 68,
      cultural_competency: {
        traditions_knowledge: 85,
        linguistic_proficiency: 72,
        historical_context: 79,
        contemporary_usage: 81
      },
      regional_focus: 'Valencia_capital'
    }

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'course_enrollments') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockProgressData,
              error: null
            })
          })
        }
      }
      if (table === 'cultural_content') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockCulturalContent,
              error: null
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<CourseDashboard courseId="jqcv-valenciano-c1" locale="val" />)

    await waitFor(() => {
      expect(screen.getByText('Benvingut/da, Joan Pérez!')).toBeInTheDocument()
    })

    // Should display progress in Valenciano
    expect(screen.getByText('68% Progrés')).toBeInTheDocument()
    expect(screen.getByText('Lliçons completades')).toBeInTheDocument()

    // Should show cultural competency breakdown
    expect(screen.getByText('Competència Cultural')).toBeInTheDocument()
    expect(screen.getByText('Coneixement de tradicions: 85%')).toBeInTheDocument()
    expect(screen.getByText('Proficiència lingüística: 72%')).toBeInTheDocument()
    expect(screen.getByText('Context històric: 79%')).toBeInTheDocument()

    // Should display regional-specific content
    expect(screen.getByText('Contingut Regional: València')).toBeInTheDocument()
    expect(screen.getByText('Falles de València')).toBeInTheDocument()
    expect(screen.getByText('Història de la ciutat')).toBeInTheDocument()

    // Cultural calendar integration
    expect(screen.getByText('Calendari Cultural')).toBeInTheDocument()
    expect(screen.getByText('Pròxim: Falles 2024')).toBeInTheDocument()

    // Should show Valenciano-specific recommendations
    expect(screen.getByText('Recomanacions personalitzades')).toBeInTheDocument()
    expect(screen.getByText('Practica expressions valencianes')).toBeInTheDocument()
    expect(screen.getByText('Explora la cultura local')).toBeInTheDocument()

    // Language navigation should support Valenciano
    const languageSelector = screen.getByText('val')
    fireEvent.click(languageSelector)

    expect(screen.getByText('Valencià')).toBeInTheDocument()
    expect(screen.getByText('Castellà')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  it('should conduct JQCV-format exam with cultural content', async () => {
    // Setup Valenciano exam session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    const mockExamSession = {
      id: 'session-val-1',
      user_id: 'user-123',
      exam_id: 'jqcv-valenciano-c1',
      status: 'in_progress',
      cultural_component_score: 0,
      oral_component_scheduled: false,
      current_section: 'comprensio_lectora'
    }

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'exam_sessions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockExamSession,
              error: null
            })
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockExamSession,
                error: null
              })
            })
          })
        }
      }
      if (table === 'exam_questions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockValencianoQuestions,
                error: null
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<ExamSimulator examId="jqcv-valenciano-c1" locale="val" />)

    await waitFor(() => {
      expect(screen.getByText('Simulador d\'Examen JQCV')).toBeInTheDocument()
    })

    // Should show JQCV-specific exam format
    expect(screen.getByText('Format oficial JQCV')).toBeInTheDocument()
    expect(screen.getByText('Inclou component cultural')).toBeInTheDocument()

    // Start exam
    const startButton = screen.getByText('Començar examen')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('Pregunta 1 de 100')).toBeInTheDocument()
    })

    // Should display Valenciano question with cultural context
    expect(screen.getByText('Quin és el tema principal del text?')).toBeInTheDocument()
    expect(screen.getByText('Text sobre la història de València...')).toBeInTheDocument()

    // Cultural notes should be available
    const culturalNotesButton = screen.getByText('ℹ️ Notes culturals')
    fireEvent.click(culturalNotesButton)

    expect(screen.getByText('Referència a la història local valenciana')).toBeInTheDocument()

    // Answer question
    const optionA = screen.getByLabelText('La fundació de València')
    fireEvent.click(optionA)

    // Navigate to cultural knowledge question
    const nextButton = screen.getByText('Següent pregunta')
    fireEvent.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText('Pregunta 2 de 100')).toBeInTheDocument()
    })

    // Should show expression/idiom question
    expect(screen.getByText('Completa l\'expressió valenciana')).toBeInTheDocument()
    expect(screen.getByText('"Estar com una ______"')).toBeInTheDocument()

    // Should provide cultural explanation
    fireEvent.click(screen.getByText('ℹ️ Notes culturals'))
    expect(screen.getByText('Expressió típicament valenciana que significa estar molt content')).toBeInTheDocument()

    // Test audio component for pronunciation
    const pronunciationButton = screen.getByText('🔊 Pronunciació')
    fireEvent.click(pronunciationButton)

    expect(screen.getByText('Escolta la pronunciació valenciana')).toBeInTheDocument()

    // Show section indicators specific to JQCV format
    expect(screen.getByText('Comprensió Lectora')).toBeInTheDocument()
    expect(screen.getByText('Expressions Valencianes')).toBeInTheDocument()
    expect(screen.getByText('Cultura Valenciana')).toBeInTheDocument()
  })

  it('should integrate Valencia-specific cultural knowledge and accessibility', async () => {
    // Setup cultural content integration
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'cultural_content') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockCulturalContent,
              error: null
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<CourseDashboard courseId="jqcv-valenciano-c1" showCulturalContent={true} />)

    await waitFor(() => {
      expect(screen.getByText('Contingut Cultural')).toBeInTheDocument()
    })

    // Should display Valencia-specific cultural information
    expect(screen.getByText('Tradicions Valencianes')).toBeInTheDocument()
    expect(screen.getByText('Falles')).toBeInTheDocument()
    expect(screen.getByText('Moros i Cristians')).toBeInTheDocument()

    // Should show linguistic variants
    expect(screen.getByText('Variants Dialectals')).toBeInTheDocument()
    expect(screen.getByText('Central')).toBeInTheDocument()
    expect(screen.getByText('Meridional')).toBeInTheDocument()

    // Cultural institutions
    expect(screen.getByText('Institucions Culturals')).toBeInTheDocument()
    expect(screen.getByText('Acadèmia Valenciana de la Llengua')).toBeInTheDocument()

    // Interactive cultural map
    const culturalMap = screen.getByTestId('valencia-cultural-map')
    expect(culturalMap).toBeInTheDocument()

    fireEvent.click(screen.getByText('València ciutat'))
    
    // Should show city-specific information
    await waitFor(() => {
      expect(screen.getByText('Ciutat de les Arts i les Ciències')).toBeInTheDocument()
    })

    expect(screen.getByText('Llotja de la Seda')).toBeInTheDocument()
    expect(screen.getByText('Mercats de València')).toBeInTheDocument()

    // Accessibility features in Valenciano
    const accessibilityButton = screen.getByText('♿ Accessibilitat')
    fireEvent.click(accessibilityButton)

    expect(screen.getByText('Opcions d\'accessibilitat')).toBeInTheDocument()
    expect(screen.getByText('Lectura en veu alta en valencià')).toBeInTheDocument()
    expect(screen.getByText('Contrast alt')).toBeInTheDocument()
    expect(screen.getByText('Text gran')).toBeInTheDocument()

    // Test screen reader support in Valenciano
    const screenReaderText = screen.getByLabelText('Navegació principal del curs')
    expect(screenReaderText).toBeInTheDocument()

    // Language-specific date and number formatting
    expect(screen.getByText('15 de gener de 2024')).toBeInTheDocument() // Valenciano date format
    expect(screen.getByText('73,5%')).toBeInTheDocument() // European decimal separator
  })

  it('should handle exam results with cultural competency assessment', async () => {
    // Setup completed Valenciano exam
    const completedSession = {
      id: 'session-val-complete',
      user_id: 'user-123',
      exam_id: 'jqcv-valenciano-c1',
      status: 'completed',
      total_score: 82,
      cultural_component_score: 78,
      linguistic_component_score: 85,
      section_scores: {
        comprensio_lectora: 87,
        expressions_valencianes: 73,
        cultura_valenciana: 78,
        gramatica: 85,
        redaccio: 79
      },
      cultural_competency_level: 'Advanced',
      regional_focus_score: 82
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: completedSession,
          error: null
        })
      })
    })

    render(<ExamSimulator examId="jqcv-valenciano-c1" sessionId="session-val-complete" showResults={true} />)

    await waitFor(() => {
      expect(screen.getByText('Resultats de l\'examen')).toBeInTheDocument()
    })

    // Overall score in Valenciano format
    expect(screen.getByText('82% Puntuació')).toBeInTheDocument()
    expect(screen.getByText('APROVAT')).toBeInTheDocument()

    // JQCV-specific certification information
    expect(screen.getByText('Certificació JQCV Nivell C1')).toBeInTheDocument()
    expect(screen.getByText('Vàlid per a l\'administració pública')).toBeInTheDocument()

    // Cultural competency breakdown
    expect(screen.getByText('Competència Cultural: Avançada')).toBeInTheDocument()
    expect(screen.getByText('Coneixement de tradicions: 78%')).toBeInTheDocument()
    expect(screen.getByText('Context regional: 82%')).toBeInTheDocument()

    // Section-specific results
    expect(screen.getByText('Comprensió Lectora: 87%')).toBeInTheDocument()
    expect(screen.getByText('Expressions Valencianes: 73%')).toBeInTheDocument()
    expect(screen.getByText('Cultura Valenciana: 78%')).toBeInTheDocument()

    // Personalized recommendations in Valenciano
    expect(screen.getByText('Recomanacions personalitzades')).toBeInTheDocument()
    expect(screen.getByText('Millora les expressions idiomàtiques')).toBeInTheDocument()
    expect(screen.getByText('Aprofundeix en la cultura popular valenciana')).toBeInTheDocument()

    // Next steps for certification
    expect(screen.getByText('Següents passos')).toBeInTheDocument()
    expect(screen.getByText('Sol·licitar certificat oficial')).toBeInTheDocument()
    expect(screen.getByText('Preparar-se per al nivell C2')).toBeInTheDocument()

    // Cultural immersion suggestions
    expect(screen.getByText('Activitats culturals recomanades')).toBeInTheDocument()
    expect(screen.getByText('Visitar museus valencians')).toBeInTheDocument()
    expect(screen.getByText('Participar en festes locals')).toBeInTheDocument()

    // Share results with cultural context
    const shareButton = screen.getByText('Compartir resultats')
    fireEvent.click(shareButton)

    expect(screen.getByText('He aprovat l\'examen de valencià C1!')).toBeInTheDocument()
    expect(screen.getByText('Certificació oficial de la Generalitat')).toBeInTheDocument()
  })

  it('should provide region-specific content and dialect support', async () => {
    // Setup with different regional variant
    const userSessionAlicante = {
      ...mockUserSession,
      user: {
        ...mockUserSession.user,
        user_metadata: {
          name: 'Maria García',
          preferred_locale: 'val',
          regional_variant: 'meridional',
          location: 'Alicante'
        }
      }
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: userSessionAlicante },
      error: null
    })

    // Mock regional content
    const regionalContent = {
      ...mockCulturalContent,
      regional_variants: {
        meridional: {
          distinctive_features: [
            'Yeísmo en posició final',
            'Vocabulari específic del sud',
            'Influència de l\'aragonés'
          ],
          local_traditions: [
            'Fogueres de Sant Joan',
            'Moros i Cristians d\'Alcoi'
          ]
        }
      },
      location_specific: {
        alicante: {
          cultural_sites: [
            'Castell de Santa Bàrbara',
            'Explanada d\'Espanya',
            'Barri de Santa Cruz'
          ],
          local_expressions: [
            'Estar penjat',
            'Anar de bòlit',
            'Fer el lloro'
          ]
        }
      }
    }

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'cultural_content') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: regionalContent,
              error: null
            })
          })
        }
      }
      return mockSupabase.from()
    })

    render(<CourseDashboard courseId="jqcv-valenciano-c1" adaptToRegion={true} />)

    await waitFor(() => {
      expect(screen.getByText('Benvingut/da, Maria García!')).toBeInTheDocument()
    })

    // Should adapt to southern Valencian variant
    expect(screen.getByText('Variant Meridional')).toBeInTheDocument()
    expect(screen.getByText('Contingut adaptat a Alacant')).toBeInTheDocument()

    // Regional-specific cultural content
    expect(screen.getByText('Fogueres de Sant Joan')).toBeInTheDocument()
    expect(screen.getByText('Castell de Santa Bàrbara')).toBeInTheDocument()

    // Dialect-specific expressions
    expect(screen.getByText('Expressions d\'Alacant')).toBeInTheDocument()
    expect(screen.getByText('Estar penjat')).toBeInTheDocument()
    expect(screen.getByText('Anar de bòlit')).toBeInTheDocument()

    // Should offer dialect options
    const dialectSelector = screen.getByText('Variant: Meridional')
    fireEvent.click(dialectSelector)

    expect(screen.getByText('Central')).toBeInTheDocument()
    expect(screen.getByText('Nord-Occidental')).toBeInTheDocument()
    expect(screen.getByText('Meridional')).toHaveClass('selected')

    // Switch to central variant
    fireEvent.click(screen.getByText('Central'))

    await waitFor(() => {
      expect(screen.getByText('Contingut adaptat a València')).toBeInTheDocument()
    })

    // Should update content to central variant
    expect(screen.getByText('Falles de València')).toBeInTheDocument()
    expect(screen.queryByText('Fogueres de Sant Joan')).not.toBeInTheDocument()
  })

  it('should handle errors and provide Valenciano-specific support', async () => {
    // Setup with connection issues
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    // Mock network error
    mockSupabase.from.mockImplementation(() => {
      throw new Error('Error de connexió')
    })

    render(<CourseDashboard courseId="jqcv-valenciano-c1" />)

    // Should display error in Valenciano
    await waitFor(() => {
      expect(screen.getByText('Error de càrrega')).toBeInTheDocument()
    })

    expect(screen.getByText('Error de connexió')).toBeInTheDocument()
    expect(screen.getByText('Tornar a intentar')).toBeInTheDocument()

    // Valenciano-specific support options
    expect(screen.getByText('Suport tècnic')).toBeInTheDocument()
    expect(screen.getByText('Contactar en valencià')).toBeInTheDocument()

    // Offline mode message
    expect(screen.getByText('Mode fora de línia')).toBeInTheDocument()
    expect(screen.getByText('Alguns continguts culturals no estan disponibles')).toBeInTheDocument()

    // Help resources in Valenciano
    const helpButton = screen.getByText('❓ Ajuda')
    fireEvent.click(helpButton)

    expect(screen.getByText('Centre d\'ajuda')).toBeInTheDocument()
    expect(screen.getByText('Preguntes freqüents')).toBeInTheDocument()
    expect(screen.getByText('Guies d\'ús')).toBeInTheDocument()
    expect(screen.getByText('Contactar suport')).toBeInTheDocument()

    // Language-specific contact information
    expect(screen.getByText('Atenció en valencià: 96 xxx xx xx')).toBeInTheDocument()
    expect(screen.getByText('Horari: de 9:00 a 18:00 h')).toBeInTheDocument()
  })
})