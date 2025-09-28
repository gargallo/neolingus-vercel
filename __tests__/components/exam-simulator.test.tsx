import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ExamSimulator } from '@/components/academia/exam-simulator';
import { AuthProvider } from '@/contexts/AuthContext';
import { ExamProvider } from '@/contexts/ExamContext';

// Mock exam engine components
vi.mock('@/lib/exam-engine/core/session-engine', () => ({
  SessionEngine: {
    createSession: vi.fn(),
    loadSession: vi.fn(),
    saveProgress: vi.fn(),
    submitSession: vi.fn(),
    pauseSession: vi.fn(),
    resumeSession: vi.fn()
  }
}));

vi.mock('@/lib/exam-engine/core/timer-engine', () => ({
  TimerEngine: {
    startTimer: vi.fn(),
    pauseTimer: vi.fn(),
    resumeTimer: vi.fn(),
    getTimeRemaining: vi.fn(),
    addTimeWarning: vi.fn()
  }
}));

vi.mock('@/lib/exam-engine/core/scoring-engine', () => ({
  ScoringEngine: {
    calculateScore: vi.fn(),
    validateAnswer: vi.fn(),
    getPartialScore: vi.fn(),
    getFinalResults: vi.fn()
  }
}));

vi.mock('@/lib/exam-engine/utils/question-renderer', () => ({
  QuestionRenderer: {
    renderQuestion: vi.fn(),
    renderAnswerOptions: vi.fn(),
    validateInput: vi.fn()
  }
}));

// Mock audio playback
vi.mock('@/utils/audio-player', () => ({
  AudioPlayer: {
    play: vi.fn(),
    pause: vi.fn(),
    setPlaybackRate: vi.fn(),
    getCurrentTime: vi.fn()
  }
}));

// Mock exam data
const mockExamConfig = {
  id: 'test-exam-id',
  title: 'EOI English B2 - Practice Test',
  provider: 'eoi-english',
  level: 'B2',
  language: 'english',
  sections: [
    {
      id: 'reading',
      title: 'Reading Comprehension',
      timeLimit: 60, // minutes
      questions: 25,
      instructions: 'Read the following passages and answer the questions.'
    },
    {
      id: 'listening',
      title: 'Listening Comprehension',
      timeLimit: 45,
      questions: 20,
      instructions: 'Listen to the audio and answer the questions.'
    },
    {
      id: 'writing',
      title: 'Writing Task',
      timeLimit: 90,
      questions: 2,
      instructions: 'Complete the writing tasks below.'
    }
  ],
  totalQuestions: 47,
  totalTime: 195, // minutes
  passingScore: 60
};

const mockQuestions = [
  {
    id: 'q1',
    sectionId: 'reading',
    type: 'multiple_choice',
    question: 'What is the main idea of the passage?',
    passage: 'Climate change is one of the most pressing issues of our time...',
    options: [
      { id: 'a', text: 'Climate change is not real' },
      { id: 'b', text: 'Climate change is a pressing global issue' },
      { id: 'c', text: 'Climate change only affects polar regions' },
      { id: 'd', text: 'Climate change is a natural phenomenon' }
    ],
    correctAnswer: 'b',
    points: 2
  },
  {
    id: 'q2',
    sectionId: 'listening',
    type: 'audio_multiple_choice',
    question: 'What time does the meeting start?',
    audioUrl: '/audio/test-meeting.mp3',
    audioDuration: 45,
    options: [
      { id: 'a', text: '9:00 AM' },
      { id: 'b', text: '9:30 AM' },
      { id: 'c', text: '10:00 AM' },
      { id: 'd', text: '10:30 AM' }
    ],
    correctAnswer: 'c',
    points: 2
  },
  {
    id: 'q3',
    sectionId: 'writing',
    type: 'essay',
    question: 'Write an essay about the importance of education (minimum 200 words)',
    minWords: 200,
    maxWords: 400,
    points: 10
  }
];

const mockSessionData = {
  id: 'test-session-id',
  examId: 'test-exam-id',
  userId: 'test-user-id',
  status: 'in_progress',
  currentSection: 'reading',
  currentQuestionIndex: 0,
  answers: {},
  timeRemaining: 11700, // seconds
  startTime: new Date('2024-01-15T10:00:00Z'),
  pauseTime: null,
  progress: {
    completed: 0,
    total: 47,
    percentage: 0
  }
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider>
    <ExamProvider>
      {children}
    </ExamProvider>
  </AuthProvider>
);

describe('ExamSimulator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock timer
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Component Rendering', () => {
    it('should render exam simulator interface', () => {
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText(mockExamConfig.title)).toBeInTheDocument();
      expect(screen.getByText(/reading comprehension/i)).toBeInTheDocument();
    });

    it('should display exam timer and progress', () => {
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('exam-timer')).toBeInTheDocument();
      expect(screen.getByText(/3:15:00/)).toBeInTheDocument(); // Time remaining
      expect(screen.getByText('0 / 47')).toBeInTheDocument(); // Progress
    });

    it('should render current question with proper formatting', () => {
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/main idea of the passage/i)).toBeInTheDocument();
      expect(screen.getByText(/climate change is one of the most pressing/i)).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(4); // Multiple choice options
    });

    it('should display section navigation', () => {
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Reading')).toBeInTheDocument();
      expect(screen.getByText('Listening')).toBeInTheDocument();
      expect(screen.getByText('Writing')).toBeInTheDocument();
    });

    it('should show question palette for navigation', () => {
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      const questionPalette = screen.getByTestId('question-palette');
      expect(questionPalette).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /question \d+/i })).toHaveLength(3);
    });
  });

  describe('Question Navigation', () => {
    it('should navigate to next question', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(screen.getByText(/what time does the meeting start/i)).toBeInTheDocument();
    });

    it('should navigate to previous question', async () => {
      const sessionWithProgress = {
        ...mockSessionData,
        currentQuestionIndex: 1
      };

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={sessionWithProgress}
          />
        </TestWrapper>
      );

      const prevButton = screen.getByRole('button', { name: /previous/i });
      await user.click(prevButton);

      expect(screen.getByText(/main idea of the passage/i)).toBeInTheDocument();
    });

    it('should navigate directly to specific question via palette', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      const question3Button = screen.getByRole('button', { name: /question 3/i });
      await user.click(question3Button);

      expect(screen.getByText(/write an essay/i)).toBeInTheDocument();
    });

    it('should handle section switching', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      const listeningTab = screen.getByRole('tab', { name: /listening/i });
      await user.click(listeningTab);

      expect(screen.getByText(/what time does the meeting start/i)).toBeInTheDocument();
    });
  });

  describe('Answer Handling', () => {
    it('should handle multiple choice answer selection', async () => {
      const mockOnAnswerChange = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
            onAnswerChange={mockOnAnswerChange}
          />
        </TestWrapper>
      );

      const optionB = screen.getByRole('radio', { name: /pressing global issue/i });
      await user.click(optionB);

      expect(mockOnAnswerChange).toHaveBeenCalledWith('q1', 'b');
      expect(optionB).toBeChecked();
    });

    it('should handle essay answer input', async () => {
      const sessionWithWriting = {
        ...mockSessionData,
        currentQuestionIndex: 2
      };

      const mockOnAnswerChange = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={sessionWithWriting}
            onAnswerChange={mockOnAnswerChange}
          />
        </TestWrapper>
      );

      const essayTextarea = screen.getByRole('textbox', { name: /essay answer/i });
      const essayText = 'Education is fundamental to personal and societal development...';
      
      await user.type(essayTextarea, essayText);

      expect(mockOnAnswerChange).toHaveBeenCalledWith('q3', essayText);
    });

    it('should validate answer format and requirements', async () => {
      const sessionWithWriting = {
        ...mockSessionData,
        currentQuestionIndex: 2
      };

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={sessionWithWriting}
          />
        </TestWrapper>
      );

      const essayTextarea = screen.getByRole('textbox', { name: /essay answer/i });
      await user.type(essayTextarea, 'Too short');

      expect(screen.getByText(/minimum 200 words required/i)).toBeInTheDocument();
    });

    it('should show word count for essay questions', async () => {
      const sessionWithWriting = {
        ...mockSessionData,
        currentQuestionIndex: 2
      };

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={sessionWithWriting}
          />
        </TestWrapper>
      );

      const essayTextarea = screen.getByRole('textbox', { name: /essay answer/i });
      await user.type(essayTextarea, 'Education is important for many reasons...');

      expect(screen.getByText(/7 words/i)).toBeInTheDocument();
    });
  });

  describe('Audio Question Handling', () => {
    it('should render audio player for listening questions', () => {
      const sessionWithListening = {
        ...mockSessionData,
        currentQuestionIndex: 1
      };
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={sessionWithListening}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('audio-player')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /play audio/i })).toBeInTheDocument();
    });

    it('should handle audio play/pause controls', async () => {
      const sessionWithListening = {
        ...mockSessionData,
        currentQuestionIndex: 1
      };

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={sessionWithListening}
          />
        </TestWrapper>
      );

      const playButton = screen.getByRole('button', { name: /play audio/i });
      await user.click(playButton);

      expect(screen.getByRole('button', { name: /pause audio/i })).toBeInTheDocument();
    });

    it('should show audio progress and controls', () => {
      const sessionWithListening = {
        ...mockSessionData,
        currentQuestionIndex: 1
      };
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={sessionWithListening}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('audio-progress')).toBeInTheDocument();
      expect(screen.getByText('0:00 / 0:45')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /replay/i })).toBeInTheDocument();
    });

    it('should handle playback speed controls', async () => {
      const sessionWithListening = {
        ...mockSessionData,
        currentQuestionIndex: 1
      };

      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={sessionWithListening}
          />
        </TestWrapper>
      );

      const speedButton = screen.getByRole('button', { name: /playback speed/i });
      await user.click(speedButton);

      expect(screen.getByText('0.75x')).toBeInTheDocument();
      expect(screen.getByText('1.25x')).toBeInTheDocument();
    });
  });

  describe('Timer and Progress Management', () => {
    it('should update timer display correctly', async () => {
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      // Advance time by 1 minute
      vi.advanceTimersByTime(60000);

      await waitFor(() => {
        expect(screen.getByText(/3:14:00/)).toBeInTheDocument();
      });
    });

    it('should show time warnings', async () => {
      const lowTimeSession = {
        ...mockSessionData,
        timeRemaining: 300 // 5 minutes
      };

      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={lowTimeSession}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/5 minutes remaining/i)).toBeInTheDocument();
    });

    it('should handle timer expiration', async () => {
      const expiredSession = {
        ...mockSessionData,
        timeRemaining: 0
      };

      const mockOnTimeExpired = vi.fn();

      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={expiredSession}
            onTimeExpired={mockOnTimeExpired}
          />
        </TestWrapper>
      );

      expect(mockOnTimeExpired).toHaveBeenCalled();
      expect(screen.getByText(/time expired/i)).toBeInTheDocument();
    });

    it('should update progress indicators', async () => {
      const progressSession = {
        ...mockSessionData,
        progress: { completed: 15, total: 47, percentage: 31.9 }
      };

      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={progressSession}
          />
        </TestWrapper>
      );

      expect(screen.getByText('15 / 47')).toBeInTheDocument();
      expect(screen.getByText('32%')).toBeInTheDocument();
    });
  });

  describe('Session Management', () => {
    it('should handle session pause', async () => {
      const mockOnPause = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
            onPauseSession={mockOnPause}
          />
        </TestWrapper>
      );

      const pauseButton = screen.getByRole('button', { name: /pause/i });
      await user.click(pauseButton);

      expect(mockOnPause).toHaveBeenCalled();
    });

    it('should handle session resume', async () => {
      const pausedSession = {
        ...mockSessionData,
        status: 'paused',
        pauseTime: new Date('2024-01-15T10:30:00Z')
      };

      const mockOnResume = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={pausedSession}
            onResumeSession={mockOnResume}
          />
        </TestWrapper>
      );

      const resumeButton = screen.getByRole('button', { name: /resume/i });
      await user.click(resumeButton);

      expect(mockOnResume).toHaveBeenCalled();
    });

    it('should handle exam submission', async () => {
      const mockOnSubmit = vi.fn();
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
            onSubmitExam={mockOnSubmit}
          />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /submit exam/i });
      await user.click(submitButton);

      // Should show confirmation dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

      const confirmButton = screen.getByRole('button', { name: /confirm submit/i });
      await user.click(confirmButton);

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should auto-save progress periodically', async () => {
      const mockOnAutoSave = vi.fn();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
            onAutoSave={mockOnAutoSave}
          />
        </TestWrapper>
      );

      // Advance time to trigger auto-save (every 30 seconds)
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockOnAutoSave).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility Features', () => {
    it('should have proper ARIA labels and structure', () => {
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('main')).toHaveAccessibleName();
      expect(screen.getByRole('timer')).toHaveAccessibleName(/time remaining/i);
      expect(screen.getByRole('progressbar')).toHaveAccessibleName(/exam progress/i);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      // Tab through radio buttons
      await user.tab();
      expect(screen.getAllByRole('radio')[0]).toHaveFocus();

      await user.keyboard('{ArrowDown}');
      expect(screen.getAllByRole('radio')[1]).toHaveFocus();
    });

    it('should announce question changes to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(screen.getByRole('status')).toHaveTextContent(/question 2 of 3/i);
    });

    it('should have proper focus management', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Focus should move to first answer option of new question
      await waitFor(() => {
        expect(screen.getAllByRole('radio')[0]).toHaveFocus();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing question data gracefully', () => {
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={[]}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      expect(screen.getByText(/no questions available/i)).toBeInTheDocument();
    });

    it('should handle network connectivity issues', async () => {
      const mockOnNetworkError = vi.fn();
      
      // Mock network failure
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
            onNetworkError={mockOnNetworkError}
          />
        </TestWrapper>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/connection issue/i)).toBeInTheDocument();
    });

    it('should handle corrupted session data', () => {
      const corruptedSession = {
        ...mockSessionData,
        currentQuestionIndex: 999 // Invalid index
      };

      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={corruptedSession}
          />
        </TestWrapper>
      );

      // Should reset to first question
      expect(screen.getByText(/main idea of the passage/i)).toBeInTheDocument();
    });
  });

  describe('Performance Characteristics', () => {
    it('should render efficiently with large question sets', () => {
      const largeQuestionSet = Array.from({ length: 200 }, (_, i) => ({
        id: `q${i + 1}`,
        sectionId: 'reading',
        type: 'multiple_choice',
        question: `Question ${i + 1}`,
        options: [
          { id: 'a', text: 'Option A' },
          { id: 'b', text: 'Option B' },
          { id: 'c', text: 'Option C' },
          { id: 'd', text: 'Option D' }
        ],
        correctAnswer: 'a',
        points: 1
      }));

      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={largeQuestionSet}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      const endTime = performance.now();
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('should implement virtual scrolling for question palette', () => {
      const largeQuestionSet = Array.from({ length: 500 }, (_, i) => ({
        id: `q${i + 1}`,
        sectionId: 'reading',
        type: 'multiple_choice',
        question: `Question ${i + 1}`,
        options: [],
        correctAnswer: 'a',
        points: 1
      }));

      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={largeQuestionSet}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      const palette = screen.getByTestId('question-palette');
      const visibleButtons = palette.querySelectorAll('button');
      
      // Should only render visible items
      expect(visibleButtons.length).toBeLessThanOrEqual(50);
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
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      const container = screen.getByRole('main');
      expect(container).toHaveClass(/mobile-layout/);
    });

    it('should collapse question palette on small screens', () => {
      global.innerWidth = 480;
      global.dispatchEvent(new Event('resize'));

      render(
        <TestWrapper>
          <ExamSimulator 
            examConfig={mockExamConfig}
            questions={mockQuestions}
            sessionData={mockSessionData}
          />
        </TestWrapper>
      );

      const palette = screen.getByTestId('question-palette');
      expect(palette).toHaveClass(/collapsed/);
    });
  });
});