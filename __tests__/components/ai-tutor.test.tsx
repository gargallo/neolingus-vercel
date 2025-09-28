import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { AITutor } from '@/components/academia/ai-tutor';
import { AuthProvider } from '@/contexts/AuthContext';
import { CourseProvider } from '@/contexts/CourseContext';

// Mock AI agent services
vi.mock('@/lib/ai-agents/context7-service', () => ({
  Context7Service: {
    getCourseDocumentation: vi.fn(),
    getLanguageResources: vi.fn(),
    searchLearningContent: vi.fn()
  }
}));

vi.mock('@/utils/ai/openai-client', () => ({
  OpenAIClient: {
    generateResponse: vi.fn(),
    streamResponse: vi.fn(),
    analyzeUserInput: vi.fn(),
    generateExercises: vi.fn()
  }
}));

vi.mock('@/utils/ai/anthropic-client', () => ({
  AnthropicClient: {
    generateResponse: vi.fn(),
    analyzeLanguage: vi.fn(),
    provideFeedback: vi.fn()
  }
}));

// Mock speech recognition and synthesis
vi.mock('@/utils/speech/recognition', () => ({
  SpeechRecognition: {
    start: vi.fn(),
    stop: vi.fn(),
    isSupported: vi.fn(() => true),
    onResult: vi.fn(),
    onError: vi.fn()
  }
}));

vi.mock('@/utils/speech/synthesis', () => ({
  SpeechSynthesis: {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => [
      { name: 'English (US)', lang: 'en-US' },
      { name: 'English (UK)', lang: 'en-GB' }
    ])
  }
}));

// Mock chat data and responses
const mockChatHistory = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'How do I improve my pronunciation?',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    metadata: {
      userLevel: 'B2',
      language: 'english',
      skill: 'pronunciation'
    }
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content: 'Great question! Here are some effective ways to improve your pronunciation:\n\n1. **Practice with native speakers** - Listen to how they pronounce words\n2. **Use pronunciation apps** - Tools like Forvo or Google Translate\n3. **Record yourself** - Compare your pronunciation to native speakers\n4. **Focus on problem sounds** - Identify and practice difficult phonemes\n\nWould you like me to help you practice specific sounds?',
    timestamp: new Date('2024-01-15T10:00:30Z'),
    metadata: {
      suggestions: [
        'Practice minimal pairs',
        'Work on stress patterns',
        'Try tongue twisters'
      ],
      resources: [
        { type: 'exercise', title: 'Pronunciation Practice', url: '/exercises/pronunciation' },
        { type: 'audio', title: 'Native Speaker Examples', url: '/audio/examples' }
      ]
    }
  },
  {
    id: 'msg-3',
    role: 'user',
    content: 'Yes, I have trouble with the "th" sound',
    timestamp: new Date('2024-01-15T10:01:00Z'),
    metadata: {
      skill: 'pronunciation',
      specificSound: 'th'
    }
  }
];

const mockUserProfile = {
  id: 'test-user-id',
  name: 'Test User',
  level: 'B2',
  language: 'english',
  preferences: {
    aiPersonality: 'encouraging',
    responseLength: 'medium',
    includeExamples: true,
    voiceEnabled: true,
    language: 'en-US'
  },
  learningGoals: [
    'Improve speaking fluency',
    'Expand vocabulary',
    'Master grammar'
  ],
  weakAreas: ['pronunciation', 'listening'],
  strengths: ['reading', 'grammar']
};

const mockAIResponse = {
  id: 'response-1',
  content: 'The "th" sound is indeed challenging for many learners! Let me help you practice it...',
  suggestions: [
    'Practice "think" vs "sink"',
    'Try "this" vs "dis"',
    'Work on "three" vs "tree"'
  ],
  exercises: [
    {
      type: 'minimal_pairs',
      title: 'TH Sound Practice',
      words: [
        { correct: 'think', incorrect: 'sink' },
        { correct: 'three', incorrect: 'tree' },
        { correct: 'thank', incorrect: 'tank' }
      ]
    }
  ],
  resources: [
    { type: 'video', title: 'TH Sound Tutorial', url: '/videos/th-sound' },
    { type: 'audio', title: 'TH Pronunciation Examples', url: '/audio/th-examples' }
  ]
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <CourseProvider>
      {children}
    </CourseProvider>
  </AuthProvider>
);

describe('AITutor Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render AI tutor chat interface', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText(/ai tutor/i)).toBeInTheDocument();
      expect(screen.getByRole('log', { name: /chat history/i })).toBeInTheDocument();
    });

    it('should display chat messages correctly', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/how do i improve my pronunciation/i)).toBeInTheDocument();
      expect(screen.getByText(/great question!/i)).toBeInTheDocument();
      expect(screen.getByText(/trouble with the "th" sound/i)).toBeInTheDocument();
    });

    it('should render message input area', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('textbox', { name: /type your message/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('should show AI suggestions and resources', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/practice minimal pairs/i)).toBeInTheDocument();
      expect(screen.getByText(/pronunciation practice/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /native speaker examples/i })).toBeInTheDocument();
    });

    it('should display voice controls when enabled', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            voiceEnabled={true}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('button', { name: /voice input/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /text to speech/i })).toBeInTheDocument();
    });
  });

  describe('Message Handling', () => {
    it('should send text messages', async () => {
      const mockOnSendMessage = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            onSendMessage={mockOnSendMessage}
          />
        </TestWrapper>
      );

      const messageInput = screen.getByRole('textbox', { name: /type your message/i });
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.type(messageInput, 'Can you help me with grammar?');
      await user.click(sendButton);

      expect(mockOnSendMessage).toHaveBeenCalledWith({
        content: 'Can you help me with grammar?',
        role: 'user',
        metadata: expect.any(Object)
      });
    });

    it('should handle Enter key for sending messages', async () => {
      const mockOnSendMessage = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            onSendMessage={mockOnSendMessage}
          />
        </TestWrapper>
      );

      const messageInput = screen.getByRole('textbox', { name: /type your message/i });
      await user.type(messageInput, 'Test message{enter}');

      expect(mockOnSendMessage).toHaveBeenCalledWith({
        content: 'Test message',
        role: 'user',
        metadata: expect.any(Object)
      });
    });

    it('should handle Shift+Enter for line breaks', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      const messageInput = screen.getByRole('textbox', { name: /type your message/i });
      await user.type(messageInput, 'First line{shift}{enter}Second line');

      expect(messageInput).toHaveValue('First line\nSecond line');
    });

    it('should prevent sending empty messages', async () => {
      const mockOnSendMessage = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            onSendMessage={mockOnSendMessage}
        />
        </TestWrapper>
      );

      const sendButton = screen.getByRole('button', { name: /send message/i });
      await user.click(sendButton);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should show typing indicator during AI response', async () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            isTyping={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
      expect(screen.getByText(/ai tutor is typing/i)).toBeInTheDocument();
    });
  });

  describe('Voice Features', () => {
    it('should handle voice input activation', async () => {
      const mockOnStartVoiceInput = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            voiceEnabled={true}
            onStartVoiceInput={mockOnStartVoiceInput}
          />
        </TestWrapper>
      );

      const voiceButton = screen.getByRole('button', { name: /voice input/i });
      await user.click(voiceButton);

      expect(mockOnStartVoiceInput).toHaveBeenCalled();
      expect(screen.getByText(/listening/i)).toBeInTheDocument();
    });

    it('should handle text-to-speech for AI responses', async () => {
      const mockOnSpeak = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            voiceEnabled={true}
            onSpeak={mockOnSpeak}
          />
        </TestWrapper>
      );

      const speakButtons = screen.getAllByRole('button', { name: /speak message/i });
      await user.click(speakButtons[0]); // AI message

      expect(mockOnSpeak).toHaveBeenCalledWith(
        expect.stringContaining('Great question!')
      );
    });

    it('should show voice input status', async () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            voiceEnabled={true}
            voiceInputActive={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('voice-status')).toBeInTheDocument();
      expect(screen.getByText(/listening for your voice/i)).toBeInTheDocument();
    });

    it('should handle voice input errors', async () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            voiceEnabled={true}
            voiceError="Microphone not accessible"
          />
        </TestWrapper>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/microphone not accessible/i)).toBeInTheDocument();
    });
  });

  describe('AI Suggestions and Exercises', () => {
    it('should display AI-generated suggestions', () => {
      const messageWithSuggestions = {
        ...mockChatHistory[1],
        metadata: {
          ...mockChatHistory[1].metadata,
          quickReplies: [
            'Show me examples',
            'Practice now',
            'More tips please'
          ]
        }
      };

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={[...mockChatHistory.slice(0, 1), messageWithSuggestions, ...mockChatHistory.slice(2)]}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Show me examples')).toBeInTheDocument();
      expect(screen.getByText('Practice now')).toBeInTheDocument();
      expect(screen.getByText('More tips please')).toBeInTheDocument();
    });

    it('should handle suggestion clicks', async () => {
      const mockOnSuggestionClick = vi.fn();
      const user = userEvent.setup();

      const messageWithSuggestions = {
        ...mockChatHistory[1],
        metadata: {
          ...mockChatHistory[1].metadata,
          quickReplies: ['Show me examples']
        }
      };

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={[...mockChatHistory.slice(0, 1), messageWithSuggestions, ...mockChatHistory.slice(2)]}
            userProfile={mockUserProfile}
            onSuggestionClick={mockOnSuggestionClick}
          />
        </TestWrapper>
      );

      const suggestionButton = screen.getByRole('button', { name: 'Show me examples' });
      await user.click(suggestionButton);

      expect(mockOnSuggestionClick).toHaveBeenCalledWith('Show me examples');
    });

    it('should render interactive exercises', () => {
      const messageWithExercise = {
        ...mockChatHistory[1],
        metadata: {
          ...mockChatHistory[1].metadata,
          exercises: [
            {
              type: 'multiple_choice',
              title: 'Choose the correct pronunciation',
              question: 'Which word has the correct "th" sound?',
              options: ['think', 'sink', 'fink'],
              correctAnswer: 'think'
            }
          ]
        }
      };

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={[...mockChatHistory.slice(0, 1), messageWithExercise, ...mockChatHistory.slice(2)]}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Choose the correct pronunciation')).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'think' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'sink' })).toBeInTheDocument();
    });

    it('should handle exercise completion', async () => {
      const mockOnExerciseComplete = vi.fn();
      const user = userEvent.setup();

      const messageWithExercise = {
        ...mockChatHistory[1],
        metadata: {
          exercises: [
            {
              type: 'multiple_choice',
              title: 'Pronunciation Test',
              question: 'Select the correct word',
              options: ['think', 'sink'],
              correctAnswer: 'think'
            }
          ]
        }
      };

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={[...mockChatHistory.slice(0, 1), messageWithExercise, ...mockChatHistory.slice(2)]}
            userProfile={mockUserProfile}
            onExerciseComplete={mockOnExerciseComplete}
          />
        </TestWrapper>
      );

      const correctOption = screen.getByRole('radio', { name: 'think' });
      const submitButton = screen.getByRole('button', { name: /submit answer/i });

      await user.click(correctOption);
      await user.click(submitButton);

      expect(mockOnExerciseComplete).toHaveBeenCalledWith({
        exercise: expect.any(Object),
        answer: 'think',
        correct: true
      });
    });

    it('should show resource links', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      const resourceLinks = screen.getAllByRole('link');
      expect(resourceLinks).toHaveLength(2);
      expect(screen.getByRole('link', { name: /pronunciation practice/i })).toBeInTheDocument();
    });
  });

  describe('Personalization and Context', () => {
    it('should adapt responses based on user level', () => {
      const beginnerProfile = {
        ...mockUserProfile,
        level: 'A1'
      };

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={beginnerProfile}
          />
        </TestWrapper>
      );

      // AI should provide beginner-appropriate content
      expect(screen.getByText(/simple words/i)).toBeInTheDocument();
    });

    it('should remember conversation context', async () => {
      const mockOnContextUpdate = vi.fn();

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            onContextUpdate={mockOnContextUpdate}
          />
        </TestWrapper>
      );

      // Context should be updated based on conversation
      expect(mockOnContextUpdate).toHaveBeenCalledWith({
        currentTopic: 'pronunciation',
        userNeeds: ['th sound practice'],
        suggestedActions: expect.any(Array)
      });
    });

    it('should provide personalized learning recommendations', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/based on your level/i)).toBeInTheDocument();
      expect(screen.getByText(/recommended for you/i)).toBeInTheDocument();
    });

    it('should track learning progress', async () => {
      const mockOnProgressUpdate = vi.fn();

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            onProgressUpdate={mockOnProgressUpdate}
          />
        </TestWrapper>
      );

      expect(mockOnProgressUpdate).toHaveBeenCalledWith({
        skill: 'pronunciation',
        activity: 'ai_tutoring',
        duration: expect.any(Number),
        interaction_count: 3
      });
    });
  });

  describe('Loading and Error States', () => {
    it('should display loading state during AI response', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            isLoading={true}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/generating response/i)).toBeInTheDocument();
    });

    it('should display error state when AI service fails', () => {
      const errorMessage = 'AI service temporarily unavailable';

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            error={errorMessage}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle empty chat state', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={[]}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
      expect(screen.getByText(/ask me anything/i)).toBeInTheDocument();
    });

    it('should handle network connectivity issues', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            networkError={true}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/connection issue/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels and structure', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toHaveAccessibleName();
      expect(screen.getByRole('log', { name: /chat history/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAccessibleName();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      const messageInput = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.tab();
      expect(messageInput).toHaveFocus();

      await user.tab();
      expect(sendButton).toHaveFocus();
    });

    it('should announce new messages to screen readers', async () => {
      const { rerender } = render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      const newMessage = {
        id: 'msg-4',
        role: 'assistant',
        content: 'New AI response',
        timestamp: new Date(),
        metadata: {}
      };

      rerender(
        <TestWrapper>
          <AITutor 
            chatHistory={[...mockChatHistory, newMessage]}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('status')).toHaveTextContent(/new message from ai tutor/i);
    });

    it('should provide alternative text for visual elements', () => {
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      const avatars = screen.getAllByRole('img');
      avatars.forEach(avatar => {
        expect(avatar).toHaveAttribute('alt');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      const container = screen.getByRole('main');
      expect(container).toHaveClass(/mobile-layout/);
    });

    it('should adjust message layout for small screens', () => {
      global.innerWidth = 480;
      global.dispatchEvent(new Event('resize'));

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      const messages = screen.getAllByTestId('chat-message');
      messages.forEach(message => {
        expect(message).toHaveClass(/compact-layout/);
      });
    });
  });

  describe('Performance Characteristics', () => {
    it('should virtualize long conversation histories', () => {
      const longHistory = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date(),
        metadata: {}
      }));

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={longHistory}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      const visibleMessages = screen.getAllByTestId('chat-message');
      expect(visibleMessages.length).toBeLessThanOrEqual(50); // Virtualized
    });

    it('should debounce typing indicators', async () => {
      const mockOnTyping = vi.fn();
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <AITutor 
            chatHistory={mockChatHistory}
            userProfile={mockUserProfile}
            onTyping={mockOnTyping}
          />
        </TestWrapper>
      );

      const messageInput = screen.getByRole('textbox');
      await user.type(messageInput, 'Hello');

      // Should debounce typing events
      expect(mockOnTyping).toHaveBeenCalledTimes(1);
    });

    it('should handle large AI responses efficiently', () => {
      const largeResponse = {
        id: 'large-msg',
        role: 'assistant',
        content: 'A'.repeat(10000), // Large response
        timestamp: new Date(),
        metadata: {}
      };

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <AITutor 
            chatHistory={[...mockChatHistory, largeResponse]}
            userProfile={mockUserProfile}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});