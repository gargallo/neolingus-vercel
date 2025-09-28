/**
 * T017 [P] Integration Test: Exam Simulation Session Journey
 * 
 * Tests the complete workflow of an exam simulation session:
 * 1. Exam selection and configuration
 * 2. Session initialization and timer setup
 * 3. Question navigation and answering
 * 4. Auto-save and session persistence
 * 5. Timer management and warnings
 * 6. Submission and scoring
 * 7. Results display and analytics
 * 8. Session recovery after interruption
 * 9. Accessibility during exam taking
 * 10. Performance optimization for exam content
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'next/router';
import { act } from 'react-dom/test-utils';
import { mockRouter, MockSupabaseProvider } from '../utils/test-utils';
import { ExamSimulator } from '../../components/dashboard/exam-simulator';
import { ExamSessionProvider } from '../../lib/exam-engine/core/session-engine';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('../../utils/supabase/client');
jest.mock('../../lib/exam-engine/core/engine');
jest.mock('../../lib/exam-engine/core/timer-engine');
jest.mock('../../lib/exam-engine/core/scoring-engine');

// Mock audio for listening comprehension
const mockAudio = {
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(),
  load: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  currentTime: 0,
  duration: 120,
  paused: true,
};

Object.defineProperty(window, 'Audio', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockAudio),
});

describe('Integration: Exam Simulation Session Journey', () => {
  const user = userEvent.setup();
  const mockExamData = {
    id: 'exam-eoi-b1-reading-001',
    title: 'EOI B1 Reading Comprehension - Practice 1',
    language: 'english',
    level: 'b1',
    provider: 'eoi',
    section: 'reading',
    duration: 60, // minutes
    totalQuestions: 25,
    passingScore: 60,
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        text: 'Read the following passage and answer the questions.',
        passage: 'The weather in Spain varies greatly depending on the region...',
        options: ['A) Mediterranean', 'B) Continental', 'C) Atlantic', 'D) Desert'],
        correctAnswer: 'A',
        points: 2,
      },
      {
        id: 'q2',
        type: 'true-false',
        text: 'Spain has only one climate type.',
        correctAnswer: false,
        points: 1,
      },
      {
        id: 'q3',
        type: 'fill-blank',
        text: 'The ___ coast has a Mediterranean climate.',
        correctAnswer: 'eastern',
        points: 1.5,
      },
    ],
  };

  const mockUserData = {
    id: 'user-123',
    email: 'test@example.com',
    selectedCourse: {
      language: 'english',
      level: 'b1',
      provider: 'eoi'
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();
    mockRouter.pathname = '/dashboard/english/b1/examens/eoi/exam-001/simulador';
    
    // Mock localStorage for session persistence
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
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

    // Mock timer functionality
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Exam Session Initialization', () => {
    it('should initialize exam session with proper configuration', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ExamSessionProvider>
            <ExamSimulator examId="exam-eoi-b1-reading-001" />
          </ExamSessionProvider>
        </MockSupabaseProvider>
      );

      // Verify exam loading
      await waitFor(() => {
        expect(screen.getByTestId('exam-loading')).toBeInTheDocument();
      });

      // Mock exam data loading
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('exam-simulator')).toBeInTheDocument();
        expect(screen.getByText('EOI B1 Reading Comprehension - Practice 1')).toBeInTheDocument();
      });

      // Verify exam configuration display
      expect(screen.getByTestId('exam-info')).toBeInTheDocument();
      expect(screen.getByText('Duración: 60 minutos')).toBeInTheDocument();
      expect(screen.getByText('25 preguntas')).toBeInTheDocument();
      expect(screen.getByText('Puntuación mínima: 60%')).toBeInTheDocument();

      // Verify start button
      const startButton = screen.getByTestId('start-exam-button');
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveTextContent('Comenzar Examen');
    });

    it('should show exam instructions and guidelines', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ExamSessionProvider>
            <ExamSimulator examId="exam-eoi-b1-reading-001" />
          </ExamSessionProvider>
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('exam-simulator')).toBeInTheDocument();
      });

      // Verify instructions section
      expect(screen.getByTestId('exam-instructions')).toBeInTheDocument();
      expect(screen.getByText('Instrucciones del Examen')).toBeInTheDocument();
      
      // Verify specific instructions
      expect(screen.getByText(/Lee cuidadosamente cada pregunta/)).toBeInTheDocument();
      expect(screen.getByText(/El tiempo es limitado/)).toBeInTheDocument();
      expect(screen.getByText(/Puedes navegar entre preguntas/)).toBeInTheDocument();
      expect(screen.getByText(/Las respuestas se guardan automáticamente/)).toBeInTheDocument();

      // Verify consent checkbox
      const consentCheckbox = screen.getByTestId('exam-consent-checkbox');
      expect(consentCheckbox).toBeInTheDocument();
      expect(consentCheckbox).not.toBeChecked();

      // Start button should be disabled until consent
      const startButton = screen.getByTestId('start-exam-button');
      expect(startButton).toBeDisabled();

      // Give consent
      await user.click(consentCheckbox);
      expect(startButton).not.toBeDisabled();
    });

    it('should handle exam session recovery', async () => {
      // Mock existing session data
      const existingSession = {
        examId: 'exam-eoi-b1-reading-001',
        startTime: Date.now() - 600000, // 10 minutes ago
        timeRemaining: 3000000, // 50 minutes
        currentQuestion: 5,
        answers: {
          q1: 'A',
          q2: false,
          q3: 'eastern',
        },
        status: 'in-progress',
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(existingSession));

      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ExamSessionProvider>
            <ExamSimulator examId="exam-eoi-b1-reading-001" />
          </ExamSessionProvider>
        </MockSupabaseProvider>
      );

      // Verify session recovery dialog
      await waitFor(() => {
        expect(screen.getByTestId('session-recovery-dialog')).toBeInTheDocument();
        expect(screen.getByText('Sesión de examen encontrada')).toBeInTheDocument();
        expect(screen.getByText('Tienes una sesión de examen en progreso')).toBeInTheDocument();
      });

      // Test continue option
      const continueButton = screen.getByTestId('continue-session-button');
      await user.click(continueButton);

      await waitFor(() => {
        expect(screen.getByTestId('exam-interface')).toBeInTheDocument();
        expect(screen.getByTestId('question-5')).toBeInTheDocument(); // Should resume at question 5
        expect(screen.getByText('50:00')).toBeInTheDocument(); // Should show remaining time
      });

      // Verify answers are restored
      const q1Answer = screen.getByDisplayValue('A');
      expect(q1Answer).toBeChecked();
    });
  });

  describe('Exam Taking Experience', () => {
    beforeEach(async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ExamSessionProvider>
            <ExamSimulator examId="exam-eoi-b1-reading-001" />
          </ExamSessionProvider>
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('exam-simulator')).toBeInTheDocument();
      });

      // Start the exam
      const consentCheckbox = screen.getByTestId('exam-consent-checkbox');
      await user.click(consentCheckbox);
      
      const startButton = screen.getByTestId('start-exam-button');
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('exam-interface')).toBeInTheDocument();
      });
    });

    it('should handle question navigation and answering', async () => {
      // Verify first question is displayed
      expect(screen.getByTestId('question-1')).toBeInTheDocument();
      expect(screen.getByText('Read the following passage and answer the questions.')).toBeInTheDocument();

      // Answer multiple choice question
      const optionA = screen.getByLabelText('A) Mediterranean');
      await user.click(optionA);

      // Verify answer is selected and auto-saved
      expect(optionA).toBeChecked();
      expect(localStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('exam-session'),
        expect.stringContaining('"q1":"A"')
      );

      // Navigate to next question
      const nextButton = screen.getByTestId('next-question-button');
      await user.click(nextButton);

      // Verify navigation
      expect(screen.getByTestId('question-2')).toBeInTheDocument();
      expect(screen.getByText('Spain has only one climate type.')).toBeInTheDocument();

      // Answer true/false question
      const falseOption = screen.getByLabelText('Falso');
      await user.click(falseOption);
      expect(falseOption).toBeChecked();

      // Navigate to third question
      await user.click(nextButton);
      expect(screen.getByTestId('question-3')).toBeInTheDocument();

      // Answer fill-in-the-blank question
      const fillBlankInput = screen.getByTestId('fill-blank-input');
      await user.type(fillBlankInput, 'eastern');
      expect(fillBlankInput).toHaveValue('eastern');

      // Test previous question navigation
      const prevButton = screen.getByTestId('prev-question-button');
      await user.click(prevButton);
      expect(screen.getByTestId('question-2')).toBeInTheDocument();
      expect(screen.getByLabelText('Falso')).toBeChecked(); // Answer should be preserved
    });

    it('should manage timer correctly with warnings', async () => {
      // Verify timer is running
      expect(screen.getByTestId('exam-timer')).toBeInTheDocument();
      expect(screen.getByText('60:00')).toBeInTheDocument();

      // Fast forward to 10 minutes remaining
      act(() => {
        jest.advanceTimersByTime(50 * 60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument();
        expect(screen.getByTestId('timer-warning')).toBeInTheDocument();
        expect(screen.getByText('⚠️ Quedan 10 minutos')).toBeInTheDocument();
      });

      // Timer should be orange/yellow
      const timer = screen.getByTestId('exam-timer');
      expect(timer).toHaveClass('timer-warning');

      // Fast forward to 5 minutes remaining
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByText('05:00')).toBeInTheDocument();
        expect(screen.getByTestId('timer-critical')).toBeInTheDocument();
        expect(screen.getByText('🚨 Últimos 5 minutos')).toBeInTheDocument();
      });

      // Timer should be red
      expect(timer).toHaveClass('timer-critical');

      // Fast forward to time up
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000);
      });

      await waitFor(() => {
        expect(screen.getByTestId('time-up-dialog')).toBeInTheDocument();
        expect(screen.getByText('Tiempo agotado')).toBeInTheDocument();
        expect(screen.getByText('El examen se enviará automáticamente')).toBeInTheDocument();
      });
    });

    it('should handle question review and flagging', async () => {
      // Flag current question for review
      const flagButton = screen.getByTestId('flag-question-button');
      await user.click(flagButton);

      expect(flagButton).toHaveClass('flagged');
      expect(screen.getByText('🚩')).toBeInTheDocument();

      // Navigate through questions to create answers
      await user.click(screen.getByLabelText('A) Mediterranean'));
      await user.click(screen.getByTestId('next-question-button'));
      
      await user.click(screen.getByLabelText('Falso'));
      await user.click(screen.getByTestId('next-question-button'));

      // Skip question 3 (leave unanswered)
      await user.click(screen.getByTestId('next-question-button'));

      // Open question navigator
      const navigatorButton = screen.getByTestId('question-navigator-button');
      await user.click(navigatorButton);

      await waitFor(() => {
        expect(screen.getByTestId('question-navigator')).toBeInTheDocument();
      });

      const navigator = within(screen.getByTestId('question-navigator'));

      // Verify question statuses
      expect(navigator.getByTestId('nav-question-1')).toHaveClass('answered', 'flagged');
      expect(navigator.getByTestId('nav-question-2')).toHaveClass('answered');
      expect(navigator.getByTestId('nav-question-3')).toHaveClass('unanswered');

      // Click on flagged question to navigate
      await user.click(navigator.getByTestId('nav-question-1'));

      await waitFor(() => {
        expect(screen.getByTestId('question-1')).toBeInTheDocument();
        expect(screen.getByLabelText('A) Mediterranean')).toBeChecked();
      });
    });

    it('should handle different question types correctly', async () => {
      // Test listening comprehension with audio
      const listeningExam = {
        ...mockExamData,
        section: 'listening',
        questions: [
          {
            id: 'l1',
            type: 'listening-multiple-choice',
            audioUrl: '/audio/listening-b1-01.mp3',
            text: 'Listen to the conversation and answer:',
            options: ['A) At a restaurant', 'B) At a bank', 'C) At a hotel'],
            correctAnswer: 'A',
            canReplay: true,
            maxReplays: 2,
          },
        ],
      };

      // Re-render with listening exam
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ExamSessionProvider>
            <ExamSimulator examId="exam-eoi-b1-listening-001" examData={listeningExam} />
          </ExamSessionProvider>
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('audio-player')).toBeInTheDocument();
      });

      // Test audio controls
      const playButton = screen.getByTestId('audio-play-button');
      await user.click(playButton);

      expect(mockAudio.play).toHaveBeenCalled();
      expect(screen.getByText('Reproduciendo...')).toBeInTheDocument();

      // Test replay limit
      const replayButton = screen.getByTestId('audio-replay-button');
      expect(screen.getByText('Reproducciones restantes: 2')).toBeInTheDocument();

      await user.click(replayButton);
      expect(screen.getByText('Reproducciones restantes: 1')).toBeInTheDocument();

      await user.click(replayButton);
      expect(screen.getByText('Reproducciones restantes: 0')).toBeInTheDocument();
      expect(replayButton).toBeDisabled();
    });
  });

  describe('Exam Submission and Results', () => {
    beforeEach(async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ExamSessionProvider>
            <ExamSimulator examId="exam-eoi-b1-reading-001" />
          </ExamSessionProvider>
        </MockSupabaseProvider>
      );

      // Start exam and answer questions
      await waitFor(() => {
        expect(screen.getByTestId('exam-simulator')).toBeInTheDocument();
      });

      const consentCheckbox = screen.getByTestId('exam-consent-checkbox');
      await user.click(consentCheckbox);
      await user.click(screen.getByTestId('start-exam-button'));

      await waitFor(() => {
        expect(screen.getByTestId('exam-interface')).toBeInTheDocument();
      });
    });

    it('should handle manual exam submission', async () => {
      // Answer all questions
      await user.click(screen.getByLabelText('A) Mediterranean'));
      await user.click(screen.getByTestId('next-question-button'));
      
      await user.click(screen.getByLabelText('Falso'));
      await user.click(screen.getByTestId('next-question-button'));
      
      await user.type(screen.getByTestId('fill-blank-input'), 'eastern');

      // Submit exam
      const submitButton = screen.getByTestId('submit-exam-button');
      await user.click(submitButton);

      // Verify submission confirmation
      await waitFor(() => {
        expect(screen.getByTestId('submit-confirmation-dialog')).toBeInTheDocument();
        expect(screen.getByText('¿Enviar examen?')).toBeInTheDocument();
        expect(screen.getByText('Has respondido 3 de 3 preguntas')).toBeInTheDocument();
      });

      // Confirm submission
      const confirmButton = screen.getByTestId('confirm-submit-button');
      await user.click(confirmButton);

      // Verify submission processing
      await waitFor(() => {
        expect(screen.getByTestId('submission-processing')).toBeInTheDocument();
        expect(screen.getByText('Procesando examen...')).toBeInTheDocument();
      });

      // Mock processing completion
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      // Verify results display
      await waitFor(() => {
        expect(screen.getByTestId('exam-results')).toBeInTheDocument();
        expect(screen.getByText('Resultados del Examen')).toBeInTheDocument();
      });
    });

    it('should display detailed results and analytics', async () => {
      // Complete exam submission (previous test steps)
      await user.click(screen.getByLabelText('A) Mediterranean'));
      await user.click(screen.getByTestId('next-question-button'));
      
      await user.click(screen.getByLabelText('Falso'));
      await user.click(screen.getByTestId('next-question-button'));
      
      await user.type(screen.getByTestId('fill-blank-input'), 'eastern');

      await user.click(screen.getByTestId('submit-exam-button'));
      await user.click(screen.getByTestId('confirm-submit-button'));

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      // Verify results summary
      await waitFor(() => {
        expect(screen.getByTestId('results-summary')).toBeInTheDocument();
        expect(screen.getByText('Puntuación: 100%')).toBeInTheDocument();
        expect(screen.getByText('Tiempo empleado: 15 minutos')).toBeInTheDocument();
        expect(screen.getByText('Estado: APROBADO')).toBeInTheDocument();
      });

      // Verify question breakdown
      const questionBreakdown = screen.getByTestId('question-breakdown');
      expect(questionBreakdown).toBeInTheDocument();

      const q1Result = within(questionBreakdown).getByTestId('question-1-result');
      expect(q1Result).toHaveTextContent('Pregunta 1: ✓ Correcta (2 puntos)');

      const q2Result = within(questionBreakdown).getByTestId('question-2-result');
      expect(q2Result).toHaveTextContent('Pregunta 2: ✓ Correcta (1 punto)');

      const q3Result = within(questionBreakdown).getByTestId('question-3-result');
      expect(q3Result).toHaveTextContent('Pregunta 3: ✓ Correcta (1.5 puntos)');

      // Verify performance analytics
      expect(screen.getByTestId('performance-chart')).toBeInTheDocument();
      expect(screen.getByText('Tiempo promedio por pregunta: 5 min')).toBeInTheDocument();

      // Test review answers functionality
      const reviewButton = screen.getByTestId('review-answers-button');
      await user.click(reviewButton);

      await waitFor(() => {
        expect(screen.getByTestId('answer-review-modal')).toBeInTheDocument();
      });
    });

    it('should save results and update progress', async () => {
      // Mock successful submission
      const mockProgressUpdate = {
        completedExams: 4,
        totalExams: 12,
        averageScore: 85,
        recentScores: [78, 82, 90, 100],
      };

      // Complete exam
      await user.click(screen.getByLabelText('A) Mediterranean'));
      await user.click(screen.getByTestId('next-question-button'));
      await user.click(screen.getByLabelText('Falso'));
      await user.click(screen.getByTestId('next-question-button'));
      await user.type(screen.getByTestId('fill-blank-input'), 'eastern');

      await user.click(screen.getByTestId('submit-exam-button'));
      await user.click(screen.getByTestId('confirm-submit-button'));

      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      // Verify progress update
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'user-progress',
          expect.stringContaining('completedExams":4')
        );
      });

      // Verify return to dashboard option
      const returnButton = screen.getByTestId('return-dashboard-button');
      await user.click(returnButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/english/b1');
    });
  });

  describe('Session Persistence and Recovery', () => {
    it('should handle browser refresh during exam', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ExamSessionProvider>
            <ExamSimulator examId="exam-eoi-b1-reading-001" />
          </ExamSessionProvider>
        </MockSupabaseProvider>
      );

      // Start exam and answer some questions
      await waitFor(() => {
        expect(screen.getByTestId('exam-simulator')).toBeInTheDocument();
      });

      const consentCheckbox = screen.getByTestId('exam-consent-checkbox');
      await user.click(consentCheckbox);
      await user.click(screen.getByTestId('start-exam-button'));

      await waitFor(() => {
        expect(screen.getByTestId('exam-interface')).toBeInTheDocument();
      });

      // Answer first question
      await user.click(screen.getByLabelText('A) Mediterranean'));
      await user.click(screen.getByTestId('next-question-button'));

      // Simulate browser refresh by re-rendering
      const sessionData = JSON.parse(localStorage.setItem.mock.calls[0][1]);

      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ExamSessionProvider>
            <ExamSimulator examId="exam-eoi-b1-reading-001" />
          </ExamSessionProvider>
        </MockSupabaseProvider>
      );

      localStorage.getItem.mockReturnValue(JSON.stringify(sessionData));

      await waitFor(() => {
        expect(screen.getByTestId('session-recovery-dialog')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-session-button'));

      // Verify session is restored
      await waitFor(() => {
        expect(screen.getByTestId('question-2')).toBeInTheDocument();
        // Navigate back to verify answer is preserved
        await user.click(screen.getByTestId('prev-question-button'));
        expect(screen.getByLabelText('A) Mediterranean')).toBeChecked();
      });
    });

    it('should handle network interruptions', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ExamSessionProvider>
            <ExamSimulator examId="exam-eoi-b1-reading-001" />
          </ExamSessionProvider>
        </MockSupabaseProvider>
      );

      // Start exam
      await waitFor(() => {
        expect(screen.getByTestId('exam-simulator')).toBeInTheDocument();
      });

      const consentCheckbox = screen.getByTestId('exam-consent-checkbox');
      await user.click(consentCheckbox);
      await user.click(screen.getByTestId('start-exam-button'));

      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      act(() => {
        fireEvent(window, new Event('offline'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('offline-warning')).toBeInTheDocument();
        expect(screen.getByText('Sin conexión - Trabajando en modo offline')).toBeInTheDocument();
      });

      // Continue answering questions offline
      await user.click(screen.getByLabelText('A) Mediterranean'));

      // Verify local storage is still working
      expect(localStorage.setItem).toHaveBeenCalled();

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      act(() => {
        fireEvent(window, new Event('online'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('sync-indicator')).toBeInTheDocument();
        expect(screen.getByText('Sincronizando...')).toBeInTheDocument();
      });

      // Verify successful sync
      await waitFor(() => {
        expect(screen.queryByTestId('offline-warning')).not.toBeInTheDocument();
        expect(screen.queryByTestId('sync-indicator')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility and Performance', () => {
    it('should be fully accessible during exam taking', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ExamSessionProvider>
            <ExamSimulator examId="exam-eoi-b1-reading-001" />
          </ExamSessionProvider>
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('exam-simulator')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const startButton = screen.getByTestId('start-exam-button');
      startButton.focus();
      expect(document.activeElement).toBe(startButton);

      // Start exam
      const consentCheckbox = screen.getByTestId('exam-consent-checkbox');
      await user.click(consentCheckbox);
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('exam-interface')).toBeInTheDocument();
      });

      // Test screen reader announcements
      const announcements = screen.getByTestId('sr-announcements');
      expect(announcements).toHaveAttribute('aria-live', 'polite');

      // Test question navigation with keyboard
      const firstOption = screen.getByLabelText('A) Mediterranean');
      firstOption.focus();
      
      fireEvent.keyDown(firstOption, { key: 'Enter' });
      expect(firstOption).toBeChecked();

      // Test timer accessibility
      const timer = screen.getByTestId('exam-timer');
      expect(timer).toHaveAttribute('aria-label', 'Tiempo restante: 60 minutos');

      // Test high contrast mode
      document.documentElement.setAttribute('data-theme', 'high-contrast');
      
      const questionText = screen.getByText('Read the following passage and answer the questions.');
      const styles = window.getComputedStyle(questionText);
      expect(styles.color).toBeTruthy();
    });

    it('should maintain performance during exam session', async () => {
      const startTime = performance.now();

      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ExamSessionProvider>
            <ExamSimulator examId="exam-eoi-b1-reading-001" />
          </ExamSessionProvider>
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('exam-simulator')).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(2000); // Should load in < 2s

      // Test rapid question navigation performance
      const consentCheckbox = screen.getByTestId('exam-consent-checkbox');
      await user.click(consentCheckbox);
      await user.click(screen.getByTestId('start-exam-button'));

      await waitFor(() => {
        expect(screen.getByTestId('exam-interface')).toBeInTheDocument();
      });

      // Rapid navigation test
      const navigationStart = performance.now();
      
      for (let i = 0; i < 5; i++) {
        await user.click(screen.getByTestId('next-question-button'));
        await user.click(screen.getByTestId('prev-question-button'));
      }

      const navigationTime = performance.now() - navigationStart;
      expect(navigationTime).toBeLessThan(1000); // Navigation should be smooth

      // Test memory usage (mock memory API)
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize;
        expect(memoryUsage).toBeLessThan(50 * 1024 * 1024); // < 50MB
      }
    });
  });
});