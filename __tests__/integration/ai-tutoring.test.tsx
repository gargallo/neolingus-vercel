/**
 * T018 [P] Integration Test: AI Tutoring Interaction Journey
 * 
 * Tests the complete workflow of AI tutoring interactions:
 * 1. AI tutor interface initialization
 * 2. Context-aware conversation handling
 * 3. Multi-modal learning support (text, audio, visual)
 * 4. Personalized learning path adaptation
 * 5. Progress tracking and feedback
 * 6. Real-time language correction
 * 7. Cultural context integration
 * 8. Accessibility features for AI interaction
 * 9. Performance optimization for AI responses
 * 10. Privacy and data handling compliance
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'next/router';
import { act } from 'react-dom/test-utils';
import { mockRouter, MockSupabaseProvider } from '../utils/test-utils';
import { AiTutor } from '../../components/dashboard/ai-tutor';
import { Context7Service } from '../../lib/ai-agents/context7-service';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('../../utils/supabase/client');
jest.mock('../../lib/ai-agents/context7-service');
jest.mock('../../utils/ai/openai-client');

// Mock Web Speech API
const mockSpeechRecognition = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: true,
  interimResults: true,
  lang: 'en-US',
};

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockSpeechRecognition),
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockSpeechRecognition),
});

// Mock Speech Synthesis API
const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: () => [
    { name: 'English Voice', lang: 'en-US', default: true },
    { name: 'Spanish Voice', lang: 'es-ES', default: false },
  ],
};

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

describe('Integration: AI Tutoring Interaction Journey', () => {
  const user = userEvent.setup();
  const mockUserData = {
    id: 'user-123',
    email: 'test@example.com',
    selectedCourse: {
      language: 'english',
      level: 'b1',
      provider: 'eoi'
    },
    progress: {
      completedExams: 5,
      weakAreas: ['listening', 'speaking'],
      strongAreas: ['reading', 'grammar'],
      studyPreferences: {
        learningStyle: 'visual',
        pacePreference: 'moderate',
        difficultyPreference: 'adaptive',
      },
    },
    preferences: {
      language: 'es',
      voiceEnabled: true,
      autoCorrection: true,
      culturalContext: 'spain',
    },
  };

  const mockAIContext = {
    userLevel: 'b1',
    language: 'english',
    recentTopics: ['weather', 'food', 'travel'],
    learningGoals: ['improve-speaking', 'expand-vocabulary'],
    conversationHistory: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();
    mockRouter.pathname = '/dashboard/english/b1';
    
    // Mock Context7 service
    Context7Service.prototype.getConversationContext = jest.fn().mockResolvedValue(mockAIContext);
    Context7Service.prototype.generateResponse = jest.fn().mockResolvedValue({
      text: 'Hello! I\'m your AI tutor. How can I help you improve your English today?',
      suggestions: ['Practice conversation', 'Review grammar', 'Vocabulary exercises'],
      confidence: 0.95,
    });
    Context7Service.prototype.analyzeUserInput = jest.fn().mockResolvedValue({
      corrections: [],
      feedback: 'Great! Your grammar is improving.',
      nextSteps: ['Try using more complex sentences'],
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        now: () => Date.now(),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByType: () => [],
      },
      writable: true,
    });

    // Reset timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('AI Tutor Interface Initialization', () => {
    it('should initialize AI tutor with user context', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      // Verify loading state
      expect(screen.getByTestId('ai-tutor-loading')).toBeInTheDocument();
      expect(screen.getByText('Inicializando tutor IA...')).toBeInTheDocument();

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });

      // Verify personalized greeting
      expect(screen.getByTestId('ai-greeting')).toBeInTheDocument();
      expect(screen.getByText(/Hello! I'm your AI tutor/)).toBeInTheDocument();

      // Verify user context is loaded
      expect(screen.getByTestId('user-level-indicator')).toHaveTextContent('B1');
      expect(screen.getByTestId('learning-focus')).toHaveTextContent('Listening, Speaking');

      // Verify interface components
      expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
      expect(screen.getByTestId('voice-controls')).toBeInTheDocument();
      expect(screen.getByTestId('suggestion-chips')).toBeInTheDocument();

      // Verify Context7 service was called with correct parameters
      expect(Context7Service.prototype.getConversationContext).toHaveBeenCalledWith({
        userId: 'user-123',
        language: 'english',
        level: 'b1',
        weakAreas: ['listening', 'speaking'],
      });
    });

    it('should handle AI service initialization errors gracefully', async () => {
      // Mock Context7 service error
      Context7Service.prototype.getConversationContext = jest.fn().mockRejectedValue(
        new Error('AI service unavailable')
      );

      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-error-message')).toBeInTheDocument();
        expect(screen.getByText('Tutor IA temporalmente no disponible')).toBeInTheDocument();
      });

      // Verify fallback options
      expect(screen.getByTestId('offline-exercises-button')).toBeInTheDocument();
      expect(screen.getByTestId('retry-ai-button')).toBeInTheDocument();

      // Test retry functionality
      Context7Service.prototype.getConversationContext = jest.fn().mockResolvedValue(mockAIContext);
      
      await user.click(screen.getByTestId('retry-ai-button'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });
    });

    it('should personalize interface based on user preferences', async () => {
      const visualLearnerData = {
        ...mockUserData,
        progress: {
          ...mockUserData.progress,
          studyPreferences: {
            learningStyle: 'visual',
            pacePreference: 'slow',
            difficultyPreference: 'beginner',
          },
        },
      };

      render(
        <MockSupabaseProvider initialUser={visualLearnerData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });

      // Verify visual learning adaptations
      expect(screen.getByTestId('visual-aids-panel')).toBeInTheDocument();
      expect(screen.getByTestId('image-examples')).toBeInTheDocument();
      expect(screen.getByTestId('concept-diagrams')).toBeInTheDocument();

      // Verify pace adaptations
      expect(screen.getByTestId('slow-pace-indicator')).toBeInTheDocument();
      expect(screen.getByText('Ritmo pausado activado')).toBeInTheDocument();
    });
  });

  describe('Text-based Conversation Handling', () => {
    beforeEach(async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });
    });

    it('should handle basic conversation flow', async () => {
      const messageInput = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-message-button');

      // Send first message
      await user.type(messageInput, 'Hello, I want to practice conversation about food.');
      await user.click(sendButton);

      // Verify message is added to chat
      await waitFor(() => {
        expect(screen.getByTestId('user-message-1')).toHaveTextContent(
          'Hello, I want to practice conversation about food.'
        );
      });

      // Mock AI response
      Context7Service.prototype.generateResponse = jest.fn().mockResolvedValue({
        text: 'Great! Let\'s talk about food. What\'s your favorite dish?',
        suggestions: ['My favorite is...', 'I like cooking...', 'I prefer eating out...'],
        corrections: [],
        confidence: 0.92,
      });

      // Wait for AI response
      await waitFor(() => {
        expect(screen.getByTestId('ai-message-1')).toHaveTextContent(
          'Great! Let\'s talk about food. What\'s your favorite dish?'
        );
      });

      // Verify suggestion chips
      const suggestions = screen.getByTestId('suggestion-chips');
      expect(within(suggestions).getByText('My favorite is...')).toBeInTheDocument();
      expect(within(suggestions).getByText('I like cooking...')).toBeInTheDocument();

      // Use a suggestion
      await user.click(within(suggestions).getByText('My favorite is...'));

      await waitFor(() => {
        expect(messageInput).toHaveValue('My favorite is...');
      });
    });

    it('should provide real-time language corrections', async () => {
      const messageInput = screen.getByTestId('message-input');

      // Type message with grammatical errors
      await user.type(messageInput, 'I are very hungry and want eat something good.');

      // Mock AI analysis with corrections
      Context7Service.prototype.analyzeUserInput = jest.fn().mockResolvedValue({
        corrections: [
          {
            original: 'I are',
            corrected: 'I am',
            explanation: 'Use "am" with "I"',
            type: 'grammar',
          },
          {
            original: 'want eat',
            corrected: 'want to eat',
            explanation: 'Missing "to" before infinitive verb',
            type: 'grammar',
          },
        ],
        feedback: 'Good attempt! Just a couple of grammar points to fix.',
        confidence: 0.88,
      });

      // Enable auto-correction
      const autoCorrectionToggle = screen.getByTestId('auto-correction-toggle');
      if (!autoCorrectionToggle.checked) {
        await user.click(autoCorrectionToggle);
      }

      await user.click(screen.getByTestId('send-message-button'));

      // Verify corrections are displayed
      await waitFor(() => {
        expect(screen.getByTestId('correction-popup')).toBeInTheDocument();
      });

      const correctionPopup = screen.getByTestId('correction-popup');
      expect(within(correctionPopup).getByText('I are → I am')).toBeInTheDocument();
      expect(within(correctionPopup).getByText('want eat → want to eat')).toBeInTheDocument();

      // Accept corrections
      const acceptButton = within(correctionPopup).getByTestId('accept-corrections');
      await user.click(acceptButton);

      await waitFor(() => {
        expect(screen.getByTestId('user-message-1')).toHaveTextContent(
          'I am very hungry and want to eat something good.'
        );
      });
    });

    it('should handle context-aware responses', async () => {
      // Set conversation context about travel
      Context7Service.prototype.generateResponse = jest.fn()
        .mockResolvedValueOnce({
          text: 'I\'d love to help you practice travel vocabulary! Where would you like to go?',
          suggestions: ['I want to visit...', 'I\'m planning a trip to...'],
          confidence: 0.94,
        })
        .mockResolvedValueOnce({
          text: 'Spain is beautiful! What city interests you most? Madrid, Barcelona, or Valencia?',
          suggestions: ['Madrid because...', 'Barcelona for...', 'Valencia seems...'],
          confidence: 0.96,
          culturalContext: {
            region: 'spain',
            tips: ['Spanish people often eat dinner late', 'Siesta is still common in smaller towns'],
          },
        });

      const messageInput = screen.getByTestId('message-input');

      // First exchange - introduce travel topic
      await user.type(messageInput, 'I want to practice talking about travel.');
      await user.click(screen.getByTestId('send-message-button'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-message-1')).toHaveTextContent(
          'I\'d love to help you practice travel vocabulary! Where would you like to go?'
        );
      });

      // Second exchange - mention Spain
      await user.clear(messageInput);
      await user.type(messageInput, 'I want to visit Spain next summer.');
      await user.click(screen.getByTestId('send-message-button'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-message-2')).toHaveTextContent(
          'Spain is beautiful! What city interests you most? Madrid, Barcelona, or Valencia?'
        );
      });

      // Verify cultural context is displayed
      expect(screen.getByTestId('cultural-tips')).toBeInTheDocument();
      const culturalTips = screen.getByTestId('cultural-tips');
      expect(within(culturalTips).getByText(/Spanish people often eat dinner late/)).toBeInTheDocument();
    });
  });

  describe('Voice and Audio Interaction', () => {
    beforeEach(async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });
    });

    it('should handle voice input and speech recognition', async () => {
      // Test voice input button
      const voiceButton = screen.getByTestId('voice-input-button');
      expect(voiceButton).toBeInTheDocument();

      await user.click(voiceButton);

      // Verify speech recognition starts
      expect(mockSpeechRecognition.start).toHaveBeenCalled();
      expect(screen.getByTestId('recording-indicator')).toBeInTheDocument();
      expect(screen.getByText('Escuchando...')).toBeInTheDocument();

      // Simulate speech recognition result
      const recognitionResult = {
        results: [{
          0: { transcript: 'Hello, can you help me with pronunciation?' },
          isFinal: true,
        }],
      };

      const resultHandler = mockSpeechRecognition.addEventListener.mock.calls.find(
        call => call[0] === 'result'
      )[1];

      act(() => {
        resultHandler(recognitionResult);
      });

      await waitFor(() => {
        const messageInput = screen.getByTestId('message-input');
        expect(messageInput).toHaveValue('Hello, can you help me with pronunciation?');
      });

      // Stop recording
      await user.click(screen.getByTestId('stop-recording-button'));
      expect(mockSpeechRecognition.stop).toHaveBeenCalled();
    });

    it('should provide text-to-speech for AI responses', async () => {
      const messageInput = screen.getByTestId('message-input');
      await user.type(messageInput, 'Can you read this aloud?');
      await user.click(screen.getByTestId('send-message-button'));

      // Wait for AI response
      await waitFor(() => {
        expect(screen.getByTestId('ai-message-1')).toBeInTheDocument();
      });

      // Test TTS functionality
      const speakButton = screen.getByTestId('speak-response-button');
      await user.click(speakButton);

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      
      // Verify speech synthesis utterance
      const utterance = mockSpeechSynthesis.speak.mock.calls[0][0];
      expect(utterance.text).toContain('Hello! I\'m your AI tutor');
      expect(utterance.lang).toBe('en-US');

      // Test pause/resume controls
      const pauseButton = screen.getByTestId('pause-speech-button');
      await user.click(pauseButton);
      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();

      const resumeButton = screen.getByTestId('resume-speech-button');
      await user.click(resumeButton);
      expect(mockSpeechSynthesis.resume).toHaveBeenCalled();
    });

    it('should handle pronunciation feedback', async () => {
      // Mock pronunciation analysis
      Context7Service.prototype.analyzePronunciation = jest.fn().mockResolvedValue({
        accuracy: 75,
        feedback: [
          {
            word: 'pronunciation',
            expected: 'prəˌnʌnsiˈeɪʃən',
            actual: 'prəˌnʌnsiˈeɪʃən',
            accuracy: 90,
            tips: ['Stress the fourth syllable more'],
          },
          {
            word: 'through',
            expected: 'θruː',
            actual: 'truː',
            accuracy: 60,
            tips: ['Use the "th" sound, not "t"', 'Put your tongue between your teeth'],
          },
        ],
        overallFeedback: 'Good attempt! Focus on the "th" sound.',
      });

      // Start pronunciation practice
      const pronunciationButton = screen.getByTestId('pronunciation-practice-button');
      await user.click(pronunciationButton);

      await waitFor(() => {
        expect(screen.getByTestId('pronunciation-interface')).toBeInTheDocument();
      });

      // Practice a specific phrase
      const practicePhrase = screen.getByTestId('practice-phrase');
      expect(practicePhrase).toHaveTextContent('The weather through the week');

      // Start recording pronunciation
      const recordPronunciation = screen.getByTestId('record-pronunciation-button');
      await user.click(recordPronunciation);

      // Simulate pronunciation attempt
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      await user.click(screen.getByTestId('stop-pronunciation-button'));

      // Wait for analysis
      await waitFor(() => {
        expect(screen.getByTestId('pronunciation-feedback')).toBeInTheDocument();
      });

      // Verify feedback display
      const feedback = screen.getByTestId('pronunciation-feedback');
      expect(within(feedback).getByText('Puntuación: 75%')).toBeInTheDocument();
      expect(within(feedback).getByText('Use the "th" sound, not "t"')).toBeInTheDocument();
    });
  });

  describe('Visual and Multi-modal Learning', () => {
    beforeEach(async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });
    });

    it('should provide visual aids and examples', async () => {
      // Mock visual content generation
      Context7Service.prototype.generateVisualContent = jest.fn().mockResolvedValue({
        images: [
          { url: '/images/food-vocabulary.jpg', alt: 'Food vocabulary', description: 'Common foods' },
          { url: '/images/restaurant-scene.jpg', alt: 'Restaurant scene', description: 'Ordering food' },
        ],
        diagrams: [
          { type: 'grammar-tree', content: 'Present perfect tense structure' },
        ],
      });

      const messageInput = screen.getByTestId('message-input');
      await user.type(messageInput, 'Show me examples of food vocabulary with pictures.');
      await user.click(screen.getByTestId('send-message-button'));

      await waitFor(() => {
        expect(screen.getByTestId('visual-content-panel')).toBeInTheDocument();
      });

      // Verify images are displayed
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('alt', 'Food vocabulary');
      expect(images[1]).toHaveAttribute('alt', 'Restaurant scene');

      // Verify image descriptions
      expect(screen.getByText('Common foods')).toBeInTheDocument();
      expect(screen.getByText('Ordering food')).toBeInTheDocument();

      // Test image interaction
      await user.click(images[0]);
      
      await waitFor(() => {
        expect(screen.getByTestId('image-detail-modal')).toBeInTheDocument();
      });
    });

    it('should generate interactive exercises', async () => {
      // Mock exercise generation
      Context7Service.prototype.generateInteractiveExercise = jest.fn().mockResolvedValue({
        type: 'drag-and-drop',
        title: 'Match the food items',
        instructions: 'Drag each food item to the correct category',
        items: [
          { id: 'apple', text: 'Apple', category: 'fruits', image: '/images/apple.jpg' },
          { id: 'carrot', text: 'Carrot', category: 'vegetables', image: '/images/carrot.jpg' },
        ],
        categories: ['fruits', 'vegetables', 'proteins'],
      });

      // Request interactive exercise
      const exerciseButton = screen.getByTestId('request-exercise-button');
      await user.click(exerciseButton);

      await waitFor(() => {
        expect(screen.getByTestId('interactive-exercise')).toBeInTheDocument();
      });

      // Verify exercise components
      expect(screen.getByText('Match the food items')).toBeInTheDocument();
      expect(screen.getByText('Drag each food item to the correct category')).toBeInTheDocument();

      // Test drag and drop functionality
      const appleItem = screen.getByTestId('draggable-apple');
      const fruitsCategory = screen.getByTestId('category-fruits');

      // Simulate drag and drop
      fireEvent.dragStart(appleItem);
      fireEvent.dragOver(fruitsCategory);
      fireEvent.drop(fruitsCategory);

      await waitFor(() => {
        expect(within(fruitsCategory).getByText('Apple')).toBeInTheDocument();
      });

      // Verify feedback
      expect(screen.getByTestId('exercise-feedback')).toBeInTheDocument();
      expect(screen.getByText('¡Correcto!')).toBeInTheDocument();
    });

    it('should adapt to different learning modalities', async () => {
      const auditoryLearnerData = {
        ...mockUserData,
        progress: {
          ...mockUserData.progress,
          studyPreferences: {
            learningStyle: 'auditory',
            pacePreference: 'fast',
            difficultyPreference: 'intermediate',
          },
        },
      };

      render(
        <MockSupabaseProvider initialUser={auditoryLearnerData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });

      // Verify auditory learning adaptations
      expect(screen.getByTestId('audio-first-interface')).toBeInTheDocument();
      expect(screen.getByTestId('listening-exercises-panel')).toBeInTheDocument();

      // Verify auto-play is enabled
      const autoPlayIndicator = screen.getByTestId('auto-play-indicator');
      expect(autoPlayIndicator).toHaveTextContent('Audio automático activado');

      // Verify pace adaptations
      expect(screen.getByTestId('fast-pace-indicator')).toBeInTheDocument();
    });
  });

  describe('Progress Tracking and Adaptation', () => {
    beforeEach(async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });
    });

    it('should track learning progress and adapt difficulty', async () => {
      // Mock progress tracking
      Context7Service.prototype.updateLearningProgress = jest.fn().mockResolvedValue({
        conceptsMastered: ['present-simple', 'food-vocabulary'],
        strugglingWith: ['past-perfect', 'conditional-sentences'],
        recommendedLevel: 'b2',
        nextTopics: ['future-tense', 'advanced-vocabulary'],
      });

      // Complete several interactions
      const messageInput = screen.getByTestId('message-input');

      // First interaction - easy level
      await user.type(messageInput, 'I like pizza.');
      await user.click(screen.getByTestId('send-message-button'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-message-1')).toBeInTheDocument();
      });

      // Mock successful completion
      act(() => {
        fireEvent(window, new CustomEvent('exercise-completed', {
          detail: { score: 95, topic: 'food-vocabulary', difficulty: 'basic' }
        }));
      });

      // Wait for difficulty adaptation
      await waitFor(() => {
        expect(screen.getByTestId('difficulty-adapted-notification')).toBeInTheDocument();
      });

      // Verify level progression suggestion
      expect(screen.getByText('¡Excelente progreso! Considera avanzar al nivel B2.')).toBeInTheDocument();

      // Check progress dashboard
      const progressButton = screen.getByTestId('view-progress-button');
      await user.click(progressButton);

      await waitFor(() => {
        expect(screen.getByTestId('learning-progress-modal')).toBeInTheDocument();
      });

      const progressModal = screen.getByTestId('learning-progress-modal');
      expect(within(progressModal).getByText('Conceptos dominados: 2')).toBeInTheDocument();
      expect(within(progressModal).getByText('Áreas de mejora: 2')).toBeInTheDocument();
    });

    it('should provide personalized learning path recommendations', async () => {
      // Mock personalized recommendations
      Context7Service.prototype.generatePersonalizedPath = jest.fn().mockResolvedValue({
        currentFocus: 'speaking-confidence',
        weeklyGoals: [
          { goal: 'Practice 10 conversations', progress: 6, target: 10 },
          { goal: 'Learn 50 new words', progress: 32, target: 50 },
          { goal: 'Master past tense', progress: 75, target: 100 },
        ],
        recommendedActivities: [
          {
            type: 'conversation',
            topic: 'job interview',
            difficulty: 'intermediate',
            estimatedTime: 15,
          },
          {
            type: 'vocabulary',
            topic: 'business terms',
            difficulty: 'intermediate',
            estimatedTime: 10,
          },
        ],
      });

      // Request personalized recommendations
      const recommendationsButton = screen.getByTestId('get-recommendations-button');
      await user.click(recommendationsButton);

      await waitFor(() => {
        expect(screen.getByTestId('personalized-path')).toBeInTheDocument();
      });

      // Verify current focus
      expect(screen.getByText('Enfoque actual: Confianza al hablar')).toBeInTheDocument();

      // Verify weekly goals
      const goals = screen.getByTestId('weekly-goals');
      expect(within(goals).getByText('Practice 10 conversations (6/10)')).toBeInTheDocument();
      expect(within(goals).getByText('Learn 50 new words (32/50)')).toBeInTheDocument();

      // Verify progress bars
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars).toHaveLength(3);

      // Verify recommended activities
      const activities = screen.getByTestId('recommended-activities');
      expect(within(activities).getByText('Conversación: Job interview')).toBeInTheDocument();
      expect(within(activities).getByText('Vocabulario: Business terms')).toBeInTheDocument();
    });

    it('should save and restore session state', async () => {
      const messageInput = screen.getByTestId('message-input');

      // Have a conversation
      await user.type(messageInput, 'Let\'s practice restaurant vocabulary.');
      await user.click(screen.getByTestId('send-message-button'));

      await waitFor(() => {
        expect(screen.getByTestId('ai-message-1')).toBeInTheDocument();
      });

      // Verify session is saved
      expect(localStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('ai-tutor-session'),
        expect.stringContaining('restaurant vocabulary')
      );

      // Mock session restoration
      const savedSession = {
        conversationHistory: [
          { role: 'user', content: 'Let\'s practice restaurant vocabulary.' },
          { role: 'assistant', content: 'Great! What would you like to order?' },
        ],
        currentTopic: 'restaurant-vocabulary',
        learningContext: mockAIContext,
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(savedSession));

      // Re-render component (simulate page refresh)
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-restored-notification')).toBeInTheDocument();
      });

      // Verify conversation history is restored
      expect(screen.getByTestId('user-message-1')).toHaveTextContent(
        'Let\'s practice restaurant vocabulary.'
      );
      expect(screen.getByTestId('ai-message-1')).toHaveTextContent(
        'Great! What would you like to order?'
      );
    });
  });

  describe('Privacy and Data Handling', () => {
    it('should handle privacy controls and data consent', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });

      // Open privacy settings
      const privacyButton = screen.getByTestId('privacy-settings-button');
      await user.click(privacyButton);

      await waitFor(() => {
        expect(screen.getByTestId('privacy-settings-modal')).toBeInTheDocument();
      });

      const privacyModal = screen.getByTestId('privacy-settings-modal');

      // Verify privacy controls
      expect(within(privacyModal).getByTestId('conversation-logging-toggle')).toBeInTheDocument();
      expect(within(privacyModal).getByTestId('voice-data-storage-toggle')).toBeInTheDocument();
      expect(within(privacyModal).getByTestId('analytics-consent-toggle')).toBeInTheDocument();

      // Test data export
      const exportButton = within(privacyModal).getByTestId('export-ai-data-button');
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByTestId('data-export-progress')).toBeInTheDocument();
      });

      // Test conversation deletion
      const deleteButton = within(privacyModal).getByTestId('delete-conversations-button');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      });

      // Confirm deletion
      await user.click(screen.getByTestId('confirm-delete-button'));

      await waitFor(() => {
        expect(screen.getByTestId('conversations-deleted-message')).toBeInTheDocument();
      });
    });

    it('should handle sensitive content filtering', async () => {
      // Mock sensitive content detection
      Context7Service.prototype.analyzeSensitiveContent = jest.fn().mockResolvedValue({
        hasSensitiveContent: true,
        contentType: 'inappropriate-language',
        severity: 'medium',
        suggestion: 'Please use appropriate language for learning.',
      });

      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });

      const messageInput = screen.getByTestId('message-input');
      await user.type(messageInput, 'This is inappropriate content for testing');
      await user.click(screen.getByTestId('send-message-button'));

      await waitFor(() => {
        expect(screen.getByTestId('content-filter-warning')).toBeInTheDocument();
      });

      expect(screen.getByText('Please use appropriate language for learning.')).toBeInTheDocument();

      // Verify message was not processed
      expect(screen.queryByTestId('user-message-1')).not.toBeInTheDocument();
    });
  });

  describe('Performance and Accessibility', () => {
    it('should maintain performance during extended conversations', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });

      const startTime = performance.now();

      // Simulate long conversation
      const messageInput = screen.getByTestId('message-input');
      for (let i = 0; i < 10; i++) {
        await user.clear(messageInput);
        await user.type(messageInput, `Message ${i + 1}`);
        await user.click(screen.getByTestId('send-message-button'));

        await waitFor(() => {
          expect(screen.getByTestId(`ai-message-${i + 1}`)).toBeInTheDocument();
        });
      }

      const totalTime = performance.now() - startTime;
      expect(totalTime).toBeLessThan(5000); // Should handle 10 exchanges in <5s

      // Verify memory management
      const messages = screen.getAllByTestId(/message-\d+/);
      expect(messages.length).toBeLessThanOrEqual(20); // Should limit displayed messages
    });

    it('should be fully accessible', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <AiTutor />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ai-tutor-interface')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const messageInput = screen.getByTestId('message-input');
      messageInput.focus();
      expect(document.activeElement).toBe(messageInput);

      // Test screen reader announcements
      const liveRegion = screen.getByTestId('sr-announcements');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      // Test ARIA labels
      expect(messageInput).toHaveAttribute('aria-label', 'Escribe tu mensaje');
      expect(screen.getByTestId('send-message-button')).toHaveAttribute('aria-label', 'Enviar mensaje');

      // Test high contrast mode
      document.documentElement.setAttribute('data-theme', 'high-contrast');

      const chatInterface = screen.getByTestId('chat-interface');
      const styles = window.getComputedStyle(chatInterface);
      expect(styles.border).toBeTruthy();

      // Test reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      // Animations should be disabled
      const animatedElements = screen.getAllByTestId(/animated-/);
      animatedElements.forEach(element => {
        expect(element).toHaveClass('reduce-motion');
      });
    });
  });
});