/**
 * T018: AI Tutoring - Integration Test
 * 
 * Tests interactive AI tutoring session workflow.
 * This test validates:
 * - AI tutor initialization with context
 * - Natural language conversation flow
 * - Adaptive learning recommendations
 * - Multi-modal content support (text, images, audio)
 * - Session persistence and history
 * - Context-aware responses based on user progress
 * - Integration with exam performance data
 * 
 * NOTE: This test will FAIL initially (TDD approach) until components are implemented.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import AITutor from '@/components/academia/ai-tutor'

// Mock dependencies
jest.mock('next/navigation')
jest.mock('@supabase/auth-helpers-nextjs')

// Mock AI service
jest.mock('@/lib/ai-agents/context7-service', () => ({
  generateTutorResponse: jest.fn(),
  analyzeUserProgress: jest.fn(),
  generateExercises: jest.fn(),
}))

// Mock speech synthesis and recognition
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  getVoices: jest.fn(() => [
    { name: 'English US', lang: 'en-US' },
    { name: 'Spanish ES', lang: 'es-ES' }
  ])
}

const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  onresult: null,
  onerror: null,
  continuous: true,
  interimResults: true
}

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis
})

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: jest.fn(() => mockSpeechRecognition)
})

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: jest.fn(() => mockSpeechRecognition)
})

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
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
        single: jest.fn(),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
  })),
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

const mockUserProgress = {
  course_id: 'eoi-english-b2',
  completion_percentage: 65,
  weak_areas: ['listening', 'conditional_sentences'],
  strong_areas: ['vocabulary', 'reading_comprehension'],
  recent_exam_scores: [78, 82, 75],
  learning_preferences: {
    visual: 0.8,
    auditory: 0.6,
    kinesthetic: 0.4
  },
  difficulty_level: 'intermediate'
}

const mockChatHistory = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'I need help with conditional sentences',
    timestamp: '2024-01-20T10:00:00.000Z'
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'I\'d be happy to help you with conditional sentences! Based on your recent exam performance, I notice this is an area where you can improve. Let\'s start with the basic types...',
    timestamp: '2024-01-20T10:00:15.000Z',
    metadata: {
      topic: 'conditional_sentences',
      difficulty: 'basic',
      resources: ['/grammar/conditionals-guide.pdf']
    }
  }
]

const mockAIResponses = {
  greeting: {
    content: "Hello Test User! I'm your AI English tutor. I see you're working on B2 level content and have been making great progress. How can I help you today?",
    metadata: {
      personalized: true,
      context_aware: true
    }
  },
  conditional_help: {
    content: "Great question about conditional sentences! Let me explain the different types:\n\n**Type 1 (Real conditionals):**\nIf + present simple, will + infinitive\nExample: \"If it rains, I will stay home.\"\n\n**Type 2 (Hypothetical):**\nIf + past simple, would + infinitive\nExample: \"If I were you, I would study harder.\"\n\nWould you like me to create some practice exercises for you?",
    metadata: {
      topic: 'conditional_sentences',
      examples_provided: true,
      follow_up_suggested: true
    }
  },
  exercise_generation: {
    content: "I've created some personalized exercises based on your learning style and weak areas:",
    exercises: [
      {
        id: 'ex-1',
        type: 'fill_blank',
        question: 'If I _____ (be) you, I would practice more listening exercises.',
        answer: 'were',
        explanation: 'In type 2 conditionals, we use "were" for all persons in the if-clause.'
      },
      {
        id: 'ex-2',
        type: 'multiple_choice',
        question: 'Which sentence is correct?',
        options: [
          'If I will see him, I tell him.',
          'If I see him, I will tell him.',
          'If I would see him, I will tell him.'
        ],
        correct: 1,
        explanation: 'Type 1 conditionals use present simple in the if-clause and will + infinitive in the main clause.'
      }
    ]
  }
}

describe('T018: Interactive AI Tutoring Session', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(createClientComponentClient as jest.Mock).mockReturnValue(mockSupabase)

    // Reset speech mocks
    mockSpeechSynthesis.speak.mockClear()
    mockSpeechSynthesis.cancel.mockClear()
    mockSpeechRecognition.start.mockClear()
    mockSpeechRecognition.stop.mockClear()
  })

  it('should initialize AI tutor with user context and course data', async () => {
    // Mock authenticated user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    // Mock user progress data
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'user_progress') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockUserProgress,
              error: null
            })
          })
        }
      }
      if (table === 'ai_chat_history') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: mockChatHistory,
                error: null
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    // Mock AI service
    const { generateTutorResponse } = require('@/lib/ai-agents/context7-service')
    generateTutorResponse.mockResolvedValue(mockAIResponses.greeting)

    render(<AITutor courseId="eoi-english-b2" />)

    // Should display loading state initially
    expect(screen.getByText('Starting AI Tutor...')).toBeInTheDocument()

    // Should load user context and initialize
    await waitFor(() => {
      expect(screen.getByText('AI English Tutor')).toBeInTheDocument()
    })

    // Should display personalized greeting
    expect(screen.getByText(/Hello Test User!/)).toBeInTheDocument()
    expect(screen.getByText(/I see you're working on B2 level content/)).toBeInTheDocument()

    // Should show user progress summary
    expect(screen.getByText('Progress: 65%')).toBeInTheDocument()
    expect(screen.getByText('Strong areas: Vocabulary, Reading')).toBeInTheDocument()
    expect(screen.getByText('Focus areas: Listening, Conditionals')).toBeInTheDocument()

    // Should display chat history
    expect(screen.getByText('I need help with conditional sentences')).toBeInTheDocument()

    // Should show input area
    expect(screen.getByPlaceholderText('Ask me anything about English...')).toBeInTheDocument()
    expect(screen.getByText('Send')).toBeInTheDocument()

    // Should show voice controls
    expect(screen.getByText('🎤')).toBeInTheDocument() // Voice input
    expect(screen.getByText('🔊')).toBeInTheDocument() // Text to speech
  })

  it('should handle natural language conversation with context awareness', async () => {
    // Setup tutor session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'user_progress') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockUserProgress,
              error: null
            })
          })
        }
      }
      if (table === 'ai_chat_history') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: [],
                error: null
              })
            })
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'msg-new' },
                error: null
              })
            })
          })
        }
      }
      return mockSupabase.from()
    })

    const { generateTutorResponse } = require('@/lib/ai-agents/context7-service')
    
    render(<AITutor courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(screen.getByText('AI English Tutor')).toBeInTheDocument()
    })

    // User asks for help with conditionals
    const inputField = screen.getByPlaceholderText('Ask me anything about English...')
    const sendButton = screen.getByText('Send')

    fireEvent.change(inputField, { 
      target: { value: 'Can you explain conditional sentences?' } 
    })

    // Mock AI response
    generateTutorResponse.mockResolvedValue(mockAIResponses.conditional_help)

    fireEvent.click(sendButton)

    // Should show typing indicator
    await waitFor(() => {
      expect(screen.getByText('AI is typing...')).toBeInTheDocument()
    })

    // Should display AI response
    await waitFor(() => {
      expect(screen.getByText(/Great question about conditional sentences!/)).toBeInTheDocument()
    })

    expect(screen.getByText(/Type 1 \(Real conditionals\)/)).toBeInTheDocument()
    expect(screen.getByText(/If \+ present simple, will \+ infinitive/)).toBeInTheDocument()
    expect(screen.getByText(/Would you like me to create some practice exercises/)).toBeInTheDocument()

    // Should show follow-up suggestions
    expect(screen.getByText('Generate Exercises')).toBeInTheDocument()
    expect(screen.getByText('More Examples')).toBeInTheDocument()
    expect(screen.getByText('Related Topics')).toBeInTheDocument()

    // User responds affirmatively
    fireEvent.change(inputField, { 
      target: { value: 'Yes, please create exercises for me' } 
    })

    generateTutorResponse.mockResolvedValue(mockAIResponses.exercise_generation)

    fireEvent.click(sendButton)

    // Should generate interactive exercises
    await waitFor(() => {
      expect(screen.getByText('I\'ve created some personalized exercises')).toBeInTheDocument()
    })

    // Should display interactive exercises
    expect(screen.getByText('If I _____ (be) you, I would practice more')).toBeInTheDocument()
    expect(screen.getByText('Which sentence is correct?')).toBeInTheDocument()

    // Exercises should be interactive
    const exerciseInput = screen.getByPlaceholderText('Type your answer...')
    fireEvent.change(exerciseInput, { target: { value: 'were' } })

    const checkAnswerButton = screen.getByText('Check Answer')
    fireEvent.click(checkAnswerButton)

    expect(screen.getByText('Correct!')).toBeInTheDocument()
    expect(screen.getByText(/In type 2 conditionals, we use "were"/)).toBeInTheDocument()
  })

  it('should support voice interaction and speech synthesis', async () => {
    // Setup tutor
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    })

    render(<AITutor courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(screen.getByText('AI English Tutor')).toBeInTheDocument()
    })

    // Test voice input
    const voiceInputButton = screen.getByText('🎤')
    fireEvent.click(voiceInputButton)

    expect(mockSpeechRecognition.start).toHaveBeenCalled()
    expect(screen.getByText('Listening...')).toBeInTheDocument()

    // Simulate speech recognition result
    const mockResult = {
      results: [{
        0: { transcript: 'How do I use the past perfect tense?' },
        isFinal: true
      }]
    }

    act(() => {
      mockSpeechRecognition.onresult(mockResult)
    })

    // Should display recognized text
    await waitFor(() => {
      expect(screen.getByDisplayValue('How do I use the past perfect tense?')).toBeInTheDocument()
    })

    // Test text-to-speech
    const ttsButton = screen.getByText('🔊')
    fireEvent.click(ttsButton)

    expect(mockSpeechSynthesis.speak).toHaveBeenCalled()
    
    // Should highlight speaking text
    expect(screen.getByText(/Great question about conditional sentences!/)).toHaveClass('speaking')

    // Test voice settings
    const settingsButton = screen.getByText('⚙️')
    fireEvent.click(settingsButton)

    expect(screen.getByText('Voice Settings')).toBeInTheDocument()
    expect(screen.getByText('Speech Rate')).toBeInTheDocument()
    expect(screen.getByText('Voice Selection')).toBeInTheDocument()

    // Change voice settings
    const voiceSelect = screen.getByLabelText('Voice Selection')
    fireEvent.change(voiceSelect, { target: { value: 'en-US' } })

    // Should apply new voice settings
    const nextTtsCall = mockSpeechSynthesis.speak.mock.calls[0][0]
    expect(nextTtsCall.lang).toBe('en-US')
  })

  it('should provide adaptive learning recommendations based on performance', async () => {
    // Setup with specific weak areas
    const weakProgressData = {
      ...mockUserProgress,
      recent_exam_scores: [65, 68, 62], // Struggling scores
      weak_areas: ['listening', 'pronunciation', 'phrasal_verbs'],
      learning_preferences: {
        auditory: 0.9, // Prefers audio learning
        visual: 0.3,
        kinesthetic: 0.4
      }
    }

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'user_progress') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: weakProgressData,
              error: null
            })
          })
        }
      }
      return mockSupabase.from()
    })

    const { analyzeUserProgress, generateTutorResponse } = require('@/lib/ai-agents/context7-service')
    
    // Mock adaptive analysis
    analyzeUserProgress.mockResolvedValue({
      recommended_focus: 'listening_intensive',
      learning_path: [
        'Daily listening exercises (20 min)',
        'Pronunciation practice with phonetics',
        'Common phrasal verbs in context'
      ],
      difficulty_adjustment: 'reduce_to_b1_bridge',
      content_type_preference: 'audio_primary'
    })

    generateTutorResponse.mockResolvedValue({
      content: "I notice you've been struggling with listening comprehension. Based on your learning style, I recommend focusing on audio-based exercises. Would you like me to create a personalized 7-day listening improvement plan?",
      metadata: {
        adaptive: true,
        recommendations: true
      }
    })

    render(<AITutor courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(screen.getByText('AI English Tutor')).toBeInTheDocument()
    })

    // Should show adaptive recommendations panel
    expect(screen.getByText('Personalized Learning Path')).toBeInTheDocument()
    expect(screen.getByText('Based on your recent performance:')).toBeInTheDocument()
    expect(screen.getByText('Daily listening exercises (20 min)')).toBeInTheDocument()
    expect(screen.getByText('Pronunciation practice with phonetics')).toBeInTheDocument()

    // Should suggest difficulty adjustment
    expect(screen.getByText('Consider B1-B2 Bridge Content')).toBeInTheDocument()

    // User accepts recommendation
    const acceptPlanButton = screen.getByText('Accept 7-Day Plan')
    fireEvent.click(acceptPlanButton)

    // Should create structured learning plan
    await waitFor(() => {
      expect(screen.getByText('7-Day Listening Improvement Plan')).toBeInTheDocument()
    })

    expect(screen.getByText('Day 1: Basic Conversation Recognition')).toBeInTheDocument()
    expect(screen.getByText('Day 2: News and Media Clips')).toBeInTheDocument()

    // Should track plan progress
    expect(screen.getByText('Progress: 0/7 days completed')).toBeInTheDocument()
  })

  it('should handle multi-modal content and rich media integration', async () => {
    // Setup tutor
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    })

    const { generateTutorResponse } = require('@/lib/ai-agents/context7-service')

    render(<AITutor courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(screen.getByText('AI English Tutor')).toBeInTheDocument()
    })

    // User asks for pronunciation help
    const inputField = screen.getByPlaceholderText('Ask me anything about English...')
    fireEvent.change(inputField, { 
      target: { value: 'Can you help me with pronunciation of "through"?' } 
    })

    generateTutorResponse.mockResolvedValue({
      content: "Let me help you with the pronunciation of 'through'.",
      media: {
        phonetic: '/θruː/',
        audio_url: '/audio/pronunciation/through.mp3',
        mouth_diagram: '/images/pronunciation/th-sound.svg',
        similar_words: ['threw', 'thought', 'thick']
      }
    })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    await waitFor(() => {
      expect(screen.getByText('Let me help you with the pronunciation')).toBeInTheDocument()
    })

    // Should display phonetic notation
    expect(screen.getByText('/θruː/')).toBeInTheDocument()

    // Should show audio player
    expect(screen.getByText('🔊 Play Pronunciation')).toBeInTheDocument()

    // Should display visual aid
    expect(screen.getByAltText('Mouth position for th sound')).toBeInTheDocument()

    // Should show similar words for practice
    expect(screen.getByText('Practice with similar sounds:')).toBeInTheDocument()
    expect(screen.getByText('threw')).toBeInTheDocument()
    expect(screen.getByText('thought')).toBeInTheDocument()

    // Test audio playback
    const playButton = screen.getByText('🔊 Play Pronunciation')
    fireEvent.click(playButton)

    // Should highlight during playback
    expect(screen.getByText('through')).toHaveClass('pronunciation-highlight')

    // Should offer recording comparison
    expect(screen.getByText('🎤 Record & Compare')).toBeInTheDocument()

    // User records their pronunciation
    const recordButton = screen.getByText('🎤 Record & Compare')
    fireEvent.click(recordButton)

    expect(screen.getByText('Recording... Say "through"')).toBeInTheDocument()

    // Simulate recording completion
    act(() => {
      const stopEvent = new Event('stop')
      window.dispatchEvent(stopEvent)
    })

    // Should analyze pronunciation
    await waitFor(() => {
      expect(screen.getByText('Analyzing pronunciation...')).toBeInTheDocument()
    })

    // Should provide feedback
    expect(screen.getByText('Pronunciation Feedback')).toBeInTheDocument()
    expect(screen.getByText('Very good! 85% match')).toBeInTheDocument()
    expect(screen.getByText('Focus on the "th" sound at the beginning')).toBeInTheDocument()
  })

  it('should maintain session persistence and conversation history', async () => {
    // Setup with existing chat history
    const extensiveChatHistory = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Explain present perfect',
        timestamp: '2024-01-19T14:00:00.000Z'
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Present perfect connects past actions to the present...',
        timestamp: '2024-01-19T14:00:30.000Z'
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'Can you give me exercises?',
        timestamp: '2024-01-19T14:05:00.000Z'
      }
    ]

    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'ai_chat_history') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({
                data: extensiveChatHistory,
                error: null
              })
            })
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'msg-new' },
                error: null
              })
            })
          })
        }
      }
      if (table === 'ai_tutor_sessions') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: {
                id: 'session-123',
                context: {
                  current_topic: 'present_perfect',
                  difficulty_level: 'intermediate',
                  user_preferences: { examples: true, exercises: true }
                },
                created_at: '2024-01-19T14:00:00.000Z',
                last_active: '2024-01-19T14:05:00.000Z'
              },
              error: null
            })
          }),
          update: jest.fn()
        }
      }
      return mockSupabase.from()
    })

    render(<AITutor courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(screen.getByText('AI English Tutor')).toBeInTheDocument()
    })

    // Should load previous conversation
    expect(screen.getByText('Explain present perfect')).toBeInTheDocument()
    expect(screen.getByText('Present perfect connects past actions')).toBeInTheDocument()
    expect(screen.getByText('Can you give me exercises?')).toBeInTheDocument()

    // Should show session context
    expect(screen.getByText('Continuing conversation from yesterday')).toBeInTheDocument()
    expect(screen.getByText('Topic: Present Perfect')).toBeInTheDocument()

    // User continues conversation with context awareness
    const inputField = screen.getByPlaceholderText('Ask me anything about English...')
    fireEvent.change(inputField, { 
      target: { value: 'I still don\'t understand when to use "for" vs "since"' } 
    })

    const { generateTutorResponse } = require('@/lib/ai-agents/context7-service')
    generateTutorResponse.mockResolvedValue({
      content: "Great follow-up question! Since we were just discussing present perfect, let me clarify 'for' vs 'since':\n\n**FOR** = duration (how long)\n**SINCE** = starting point (when it began)\n\nBased on our previous examples, can you tell me which is correct:\n'I have lived here _____ 5 years' or 'I have lived here _____ 2019'?",
      metadata: {
        contextual: true,
        references_previous: true
      }
    })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    // Should reference previous context
    await waitFor(() => {
      expect(screen.getByText(/Since we were just discussing present perfect/)).toBeInTheDocument()
    })

    expect(screen.getByText(/Based on our previous examples/)).toBeInTheDocument()

    // Should maintain topic coherence
    expect(screen.getByText('Topic: Present Perfect - For/Since')).toBeInTheDocument()

    // Test session export
    const exportButton = screen.getByText('📥 Export Chat')
    fireEvent.click(exportButton)

    expect(screen.getByText('Export Options')).toBeInTheDocument()
    expect(screen.getByText('PDF Summary')).toBeInTheDocument()
    expect(screen.getByText('Text Transcript')).toBeInTheDocument()
    expect(screen.getByText('Study Notes')).toBeInTheDocument()
  })

  it('should handle errors and offline functionality gracefully', async () => {
    // Setup basic tutor
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockUserSession },
      error: null
    })

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })
    })

    const { generateTutorResponse } = require('@/lib/ai-agents/context7-service')

    render(<AITutor courseId="eoi-english-b2" />)

    await waitFor(() => {
      expect(screen.getByText('AI English Tutor')).toBeInTheDocument()
    })

    // Test API error handling
    generateTutorResponse.mockRejectedValue(new Error('API rate limit exceeded'))

    const inputField = screen.getByPlaceholderText('Ask me anything about English...')
    fireEvent.change(inputField, { target: { value: 'Test message' } })

    const sendButton = screen.getByText('Send')
    fireEvent.click(sendButton)

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('I\'m temporarily unavailable')).toBeInTheDocument()
    })

    expect(screen.getByText('API rate limit exceeded')).toBeInTheDocument()
    expect(screen.getByText('Try again in a few minutes')).toBeInTheDocument()

    // Should offer offline options
    expect(screen.getByText('💾 Save Question for Later')).toBeInTheDocument()
    expect(screen.getByText('📚 Browse Offline Resources')).toBeInTheDocument()

    // Test network disconnection
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    })

    // Trigger offline event
    window.dispatchEvent(new Event('offline'))

    await waitFor(() => {
      expect(screen.getByText('You are offline')).toBeInTheDocument()
    })

    expect(screen.getByText('Your messages will be sent when connection is restored')).toBeInTheDocument()

    // Should queue messages offline
    fireEvent.change(inputField, { target: { value: 'Offline message' } })
    fireEvent.click(sendButton)

    expect(screen.getByText('📤 Queued for sending')).toBeInTheDocument()

    // Test connection restoration
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })

    generateTutorResponse.mockResolvedValue({
      content: "I'm back online! Let me answer your queued question..."
    })

    window.dispatchEvent(new Event('online'))

    // Should process queued messages
    await waitFor(() => {
      expect(screen.getByText('Connection restored')).toBeInTheDocument()
    })

    expect(screen.getByText('Processing queued messages...')).toBeInTheDocument()
  })
})