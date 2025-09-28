"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ExamSession, ExamQuestion, Component } from "@/lib/exam-engine/types";

interface MobileExamProps {
  examId: string;
  courseId: string;
  component: Component;
  questions: ExamQuestion[];
  timeLimit?: number; // in minutes
  onComplete?: (session: ExamSession) => void;
  onPause?: () => void;
  onResume?: () => void;
  allowPause?: boolean;
  showProgress?: boolean;
  randomizeQuestions?: boolean;
  className?: string;
}

interface TouchGesture {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  element: HTMLElement | null;
}

interface ExamState {
  currentQuestionIndex: number;
  answers: Record<string, any>;
  timeRemaining: number; // in seconds
  isPaused: boolean;
  isCompleted: boolean;
  startTime: number;
  questionStartTime: number;
  timeSpentPerQuestion: Record<string, number>;
  navigationHistory: number[];
}

export default function MobileExam({
  examId,
  courseId,
  component,
  questions: initialQuestions,
  timeLimit = 60,
  onComplete,
  onPause,
  onResume,
  allowPause = true,
  showProgress = true,
  randomizeQuestions = false,
  className = "",
}: MobileExamProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<number>(0);
  const touchRef = useRef<TouchGesture | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Questions with potential randomization
  const questions = useMemo(() => {
    if (randomizeQuestions) {
      return [...initialQuestions].sort(() => Math.random() - 0.5);
    }
    return initialQuestions;
  }, [initialQuestions, randomizeQuestions]);

  // Exam state
  const [examState, setExamState] = useState<ExamState>(() => ({
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: timeLimit * 60,
    isPaused: false,
    isCompleted: false,
    startTime: Date.now(),
    questionStartTime: Date.now(),
    timeSpentPerQuestion: {},
    navigationHistory: [0],
  }));

  // UI state
  const [showQuestionOverview, setShowQuestionOverview] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [touchEnabled, setTouchEnabled] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Initialize component
  useEffect(() => {
    setIsMounted(true);
    
    // Detect touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setTouchEnabled(hasTouch);

    // Check orientation
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    
    checkOrientation();
    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);

    // Check vibration support
    setVibrationEnabled('vibrate' in navigator);

    // Prevent page refresh/back button
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!examState.isCompleted) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('orientationchange', checkOrientation);
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [examState.isCompleted]);

  // Timer management
  useEffect(() => {
    if (!examState.isPaused && !examState.isCompleted && examState.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setExamState(prev => {
          const newTimeRemaining = prev.timeRemaining - 1;
          
          // Time warnings
          if (newTimeRemaining === 300 && !showTimeWarning) { // 5 minutes
            setShowTimeWarning(true);
            triggerVibration([200, 100, 200]);
          }
          
          if (newTimeRemaining <= 0) {
            // Time's up - auto submit
            handleCompleteExam();
            return { ...prev, timeRemaining: 0, isCompleted: true };
          }
          
          return { ...prev, timeRemaining: newTimeRemaining };
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examState.isPaused, examState.isCompleted, examState.timeRemaining, showTimeWarning]);

  // Question timer
  useEffect(() => {
    if (!examState.isPaused && !examState.isCompleted) {
      questionTimerRef.current = Date.now();
    }
  }, [examState.currentQuestionIndex, examState.isPaused, examState.isCompleted]);

  // Touch gesture handling
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!touchEnabled || examState.isPaused) return;

    const touch = e.touches[0];
    touchRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
      element: e.target as HTMLElement,
    };
  }, [touchEnabled, examState.isPaused]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchRef.current || examState.isPaused) return;

    const touch = e.touches[0];
    touchRef.current.currentX = touch.clientX;
    touchRef.current.currentY = touch.clientY;

    // Prevent default for swipe gestures
    const deltaX = Math.abs(touch.clientX - touchRef.current.startX);
    const deltaY = Math.abs(touch.clientY - touchRef.current.startY);
    
    if (deltaX > 30 || deltaY > 30) {
      e.preventDefault();
    }
  }, [examState.isPaused]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchRef.current || examState.isPaused) return;

    const gesture = touchRef.current;
    const deltaX = gesture.currentX - gesture.startX;
    const deltaY = gesture.currentY - gesture.startY;
    const deltaTime = Date.now() - gesture.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Swipe detection
    if (distance > 50 && deltaTime < 500 && velocity > 0.1) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          // Swipe right - previous question
          handlePreviousQuestion();
        } else {
          // Swipe left - next question  
          handleNextQuestion();
        }
      } else if (deltaY > 50) {
        // Swipe down - show question overview
        setShowQuestionOverview(true);
      }
    }

    touchRef.current = null;
  }, [examState.isPaused]);

  // Attach touch events
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !touchEnabled) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, touchEnabled]);

  // Utility functions
  const triggerVibration = useCallback((pattern: number | number[]) => {
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, [vibrationEnabled]);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getCurrentQuestion = useCallback((): ExamQuestion | null => {
    return questions[examState.currentQuestionIndex] || null;
  }, [questions, examState.currentQuestionIndex]);

  const getProgressPercentage = useCallback((): number => {
    return Math.round(((examState.currentQuestionIndex + 1) / questions.length) * 100);
  }, [examState.currentQuestionIndex, questions.length]);

  const isAnswered = useCallback((questionId: string): boolean => {
    return questionId in examState.answers && examState.answers[questionId] !== undefined;
  }, [examState.answers]);

  // Navigation functions
  const recordQuestionTime = useCallback(() => {
    const currentQuestion = getCurrentQuestion();
    if (currentQuestion) {
      const timeSpent = Date.now() - questionTimerRef.current;
      setExamState(prev => ({
        ...prev,
        timeSpentPerQuestion: {
          ...prev.timeSpentPerQuestion,
          [currentQuestion.id]: (prev.timeSpentPerQuestion[currentQuestion.id] || 0) + timeSpent,
        },
      }));
    }
  }, [getCurrentQuestion]);

  const handleNextQuestion = useCallback(() => {
    if (examState.currentQuestionIndex < questions.length - 1) {
      recordQuestionTime();
      
      setExamState(prev => {
        const newIndex = prev.currentQuestionIndex + 1;
        return {
          ...prev,
          currentQuestionIndex: newIndex,
          questionStartTime: Date.now(),
          navigationHistory: [...prev.navigationHistory, newIndex],
        };
      });

      // Smooth scroll to top
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      triggerVibration(50);
    }
  }, [examState.currentQuestionIndex, questions.length, recordQuestionTime, triggerVibration]);

  const handlePreviousQuestion = useCallback(() => {
    if (examState.currentQuestionIndex > 0) {
      recordQuestionTime();
      
      setExamState(prev => {
        const newIndex = prev.currentQuestionIndex - 1;
        return {
          ...prev,
          currentQuestionIndex: newIndex,
          questionStartTime: Date.now(),
          navigationHistory: [...prev.navigationHistory, newIndex],
        };
      });

      // Smooth scroll to top
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      triggerVibration(50);
    }
  }, [examState.currentQuestionIndex, recordQuestionTime, triggerVibration]);

  const handleGoToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length && index !== examState.currentQuestionIndex) {
      recordQuestionTime();
      
      setExamState(prev => ({
        ...prev,
        currentQuestionIndex: index,
        questionStartTime: Date.now(),
        navigationHistory: [...prev.navigationHistory, index],
      }));

      setShowQuestionOverview(false);
      
      // Smooth scroll to top
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }

      triggerVibration(100);
    }
  }, [questions.length, examState.currentQuestionIndex, recordQuestionTime, triggerVibration]);

  // Answer handling
  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setExamState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer,
      },
    }));

    // Haptic feedback for selection
    triggerVibration(25);
  }, [triggerVibration]);

  // Exam control functions
  const handlePauseExam = useCallback(() => {
    if (allowPause && !examState.isPaused) {
      recordQuestionTime();
      setExamState(prev => ({ ...prev, isPaused: true }));
      onPause?.();
      triggerVibration([100, 50, 100]);
    }
  }, [allowPause, examState.isPaused, recordQuestionTime, onPause, triggerVibration]);

  const handleResumeExam = useCallback(() => {
    if (examState.isPaused) {
      setExamState(prev => ({ 
        ...prev, 
        isPaused: false,
        questionStartTime: Date.now(),
      }));
      onResume?.();
      triggerVibration(200);
    }
  }, [examState.isPaused, onResume, triggerVibration]);

  const handleCompleteExam = useCallback(async () => {
    recordQuestionTime();
    
    const session: ExamSession = {
      id: `session_${Date.now()}`,
      userId: "current_user", // Would be actual user ID
      courseId,
      progressId: "progress_id",
      sessionType: "practice",
      component,
      startedAt: new Date(examState.startTime),
      completedAt: new Date(),
      durationSeconds: Math.floor((Date.now() - examState.startTime) / 1000),
      responses: Object.entries(examState.answers).map(([questionId, answer]) => ({
        questionId,
        userAnswer: answer,
        timeSpent: examState.timeSpentPerQuestion[questionId] || 0,
        attempts: 1,
      })),
      score: 0, // Would be calculated based on correct answers
      detailedScores: {
        overall: 0,
        sections: {},
        skills: {},
      },
      improvementSuggestions: [],
      isCompleted: true,
      sessionData: {
        examConfig: {
          certificationModule: "default",
          component,
          sessionType: "practice",
          questionCount: questions.length,
          timeLimit,
          questionSelection: {
            strategy: "fixed_set",
            excludeRecentQuestions: false,
          },
          scoringMethod: {
            algorithm: "simple",
            passingScore: 70,
            partialCreditEnabled: false,
            penaltyForGuessing: false,
          },
          adaptiveMode: false,
          allowReview: false,
          showProgress: showProgress,
          randomizeQuestions,
          randomizeOptions: false,
        },
        startTime: new Date(examState.startTime),
        allowedTime: timeLimit,
      },
    };

    setExamState(prev => ({ ...prev, isCompleted: true }));
    triggerVibration([200, 100, 200, 100, 200]);
    
    onComplete?.(session);
  }, [
    courseId,
    component,
    examState,
    questions.length,
    timeLimit,
    showProgress,
    randomizeQuestions,
    recordQuestionTime,
    onComplete,
    triggerVibration
  ]);

  const handleExitExam = useCallback(() => {
    setShowExitConfirmation(true);
  }, []);

  const confirmExit = useCallback(() => {
    router.back();
  }, [router]);

  // Render current question
  const renderQuestion = useCallback((question: ExamQuestion) => {
    const isMultipleChoice = question.type === "multiple_choice";
    const currentAnswer = examState.answers[question.id];

    return (
      <div className="mobile-question-content">
        <div className="mobile-question-header">
          <div className="mobile-question-number">
            Question {examState.currentQuestionIndex + 1} of {questions.length}
          </div>
          {question.scoring.timeLimit && (
            <div className="mobile-question-time-limit">
              Time limit: {question.scoring.timeLimit}s
            </div>
          )}
        </div>

        <div className="mobile-question-text">
          {question.content.prompt}
        </div>

        {question.content.instructions && (
          <div className="mobile-question-instructions">
            {question.content.instructions}
          </div>
        )}

        {question.content.readingPassage && (
          <div className="mobile-reading-passage">
            <h4>Reading Passage</h4>
            <p>{question.content.readingPassage}</p>
          </div>
        )}

        {question.content.imageUrl && (
          <div className="mobile-question-image">
            <img
              src={question.content.imageUrl}
              alt="Question image"
              loading="lazy"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
        )}

        <div className="mobile-answer-options">
          {isMultipleChoice && question.content.options ? (
            question.content.options.map((option, index) => (
              <div
                key={index}
                className={`mobile-answer-option ${
                  currentAnswer === index ? 'selected' : ''
                }`}
                onClick={() => handleAnswerChange(question.id, index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleAnswerChange(question.id, index);
                  }
                }}
                aria-pressed={currentAnswer === index}
              >
                <div className="mobile-answer-radio">
                  <span className="mobile-sr-only">
                    {currentAnswer === index ? 'Selected' : 'Not selected'}
                  </span>
                </div>
                <div className="mobile-answer-text">{option}</div>
              </div>
            ))
          ) : question.type === "gap_fill" ? (
            <div className="mobile-gap-fill">
              <input
                type="text"
                className="mobile-form-input"
                value={currentAnswer || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Enter your answer"
                autoComplete="off"
                maxLength={100}
              />
            </div>
          ) : question.type === "short_answer" || question.type === "essay" ? (
            <div className="mobile-text-answer">
              <textarea
                className="mobile-form-textarea"
                value={currentAnswer || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder={
                  question.type === "essay"
                    ? "Write your essay response here..."
                    : "Enter your answer here..."
                }
                rows={question.type === "essay" ? 8 : 4}
                maxLength={question.type === "essay" ? 2000 : 500}
              />
              <div className="mobile-character-count">
                {(currentAnswer || '').length} / {question.type === "essay" ? 2000 : 500}
              </div>
            </div>
          ) : (
            <div className="mobile-answer-placeholder">
              Answer input for {question.type} questions
            </div>
          )}
        </div>
      </div>
    );
  }, [examState.answers, examState.currentQuestionIndex, questions.length, handleAnswerChange]);

  // Don't render anything until mounted (prevents hydration issues)
  if (!isMounted) {
    return (
      <div className="mobile-exam-container">
        <div className="mobile-exam-loading">
          <div className="loading-spinner"></div>
          <p>Loading exam...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  const progressPercentage = getProgressPercentage();
  const isLastQuestion = examState.currentQuestionIndex === questions.length - 1;
  const answeredCount = Object.keys(examState.answers).length;

  return (
    <div
      ref={containerRef}
      className={`mobile-exam-container ${isLandscape ? 'landscape' : 'portrait'} ${className}`}
    >
      {/* Exam Header */}
      <div className="mobile-exam-header">
        <div className="mobile-exam-header-content">
          <div className="mobile-exam-info">
            <h1 className="mobile-exam-title">
              {component.charAt(0).toUpperCase() + component.slice(1)} Exam
            </h1>
            <div className="mobile-exam-meta">
              <span>{answeredCount}/{questions.length} answered</span>
              {showProgress && (
                <span className="mobile-progress-percentage">{progressPercentage}%</span>
              )}
            </div>
          </div>
          <div className="mobile-exam-controls">
            <button
              onClick={() => setShowQuestionOverview(true)}
              className="mobile-icon-button"
              aria-label="Question overview"
              title="Question overview"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            {allowPause && !examState.isPaused && (
              <button
                onClick={handlePauseExam}
                className="mobile-icon-button"
                aria-label="Pause exam"
                title="Pause exam"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            <button
              onClick={handleExitExam}
              className="mobile-icon-button"
              aria-label="Exit exam"
              title="Exit exam"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mobile-progress-bar">
            <div
              className="mobile-progress-fill"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progress: ${progressPercentage}%`}
            />
          </div>
        )}
      </div>

      {/* Timer */}
      <div
        className={`mobile-exam-timer ${
          examState.timeRemaining <= 300 ? 'critical' :
          examState.timeRemaining <= 600 ? 'warning' : ''
        }`}
      >
        {formatTime(examState.timeRemaining)}
      </div>

      {/* Main Content */}
      <div className="mobile-exam-content">
        {examState.isPaused ? (
          <div className="mobile-pause-screen">
            <div className="mobile-pause-content">
              <div className="mobile-pause-icon">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="mobile-pause-title">Exam Paused</h2>
              <p className="mobile-pause-description">
                Your progress has been saved. Tap Resume to continue.
              </p>
              <button
                onClick={handleResumeExam}
                className="mobile-button mobile-button-primary mobile-button-large"
              >
                Resume Exam
              </button>
            </div>
          </div>
        ) : currentQuestion ? (
          renderQuestion(currentQuestion)
        ) : (
          <div className="mobile-error-screen">
            <h2>No questions available</h2>
            <p>Please try reloading the exam.</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      {!examState.isPaused && currentQuestion && (
        <div className="mobile-exam-navigation">
          <div className="mobile-nav-buttons">
            <button
              onClick={handlePreviousQuestion}
              disabled={examState.currentQuestionIndex === 0}
              className="mobile-nav-button"
              aria-label="Previous question"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {touchEnabled && (
              <div className="mobile-swipe-hint">
                Swipe to navigate
              </div>
            )}

            {isLastQuestion ? (
              <button
                onClick={handleCompleteExam}
                className="mobile-nav-button primary"
                aria-label="Complete exam"
              >
                Complete
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="mobile-nav-button primary"
                aria-label="Next question"
              >
                Next
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Question Overview Modal */}
      {showQuestionOverview && (
        <div className="mobile-modal-overlay" onClick={() => setShowQuestionOverview(false)}>
          <div className="mobile-modal open" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3 className="mobile-modal-title">Question Overview</h3>
              <button
                onClick={() => setShowQuestionOverview(false)}
                className="mobile-modal-close"
                aria-label="Close overview"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mobile-modal-content">
              <div className="mobile-question-grid">
                {questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => handleGoToQuestion(index)}
                    className={`mobile-question-item ${
                      index === examState.currentQuestionIndex ? 'current' : ''
                    } ${isAnswered(question.id) ? 'answered' : 'unanswered'}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <div className="mobile-question-legend">
                <div className="mobile-legend-item">
                  <div className="mobile-legend-indicator current"></div>
                  <span>Current</span>
                </div>
                <div className="mobile-legend-item">
                  <div className="mobile-legend-indicator answered"></div>
                  <span>Answered</span>
                </div>
                <div className="mobile-legend-item">
                  <div className="mobile-legend-indicator unanswered"></div>
                  <span>Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Time Warning Modal */}
      {showTimeWarning && examState.timeRemaining <= 300 && (
        <div className="mobile-modal-overlay">
          <div className="mobile-modal open">
            <div className="mobile-modal-header">
              <h3 className="mobile-modal-title">Time Warning</h3>
            </div>
            <div className="mobile-modal-content">
              <p>You have 5 minutes or less remaining!</p>
            </div>
            <div className="mobile-modal-footer">
              <button
                onClick={() => setShowTimeWarning(false)}
                className="mobile-button mobile-button-primary"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirmation && (
        <div className="mobile-modal-overlay" onClick={() => setShowExitConfirmation(false)}>
          <div className="mobile-modal open" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3 className="mobile-modal-title">Exit Exam</h3>
            </div>
            <div className="mobile-modal-content">
              <p>Are you sure you want to exit? Your progress will be lost.</p>
            </div>
            <div className="mobile-modal-footer">
              <div className="mobile-button-group mobile-button-group-row">
                <button
                  onClick={() => setShowExitConfirmation(false)}
                  className="mobile-button mobile-button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmExit}
                  className="mobile-button mobile-button-primary"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading/Completion Screen */}
      {examState.isCompleted && (
        <div className="mobile-completion-screen">
          <div className="mobile-completion-content">
            <div className="mobile-completion-icon">
              <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mobile-completion-title">Exam Completed!</h2>
            <p className="mobile-completion-description">
              Your answers have been submitted successfully.
            </p>
            <div className="mobile-completion-stats">
              <div className="mobile-stat-item">
                <span className="mobile-stat-value">{answeredCount}</span>
                <span className="mobile-stat-label">Questions Answered</span>
              </div>
              <div className="mobile-stat-item">
                <span className="mobile-stat-value">
                  {formatTime(Math.floor((Date.now() - examState.startTime) / 1000))}
                </span>
                <span className="mobile-stat-label">Time Taken</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .mobile-exam-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #f9fafb;
          position: relative;
          overflow: hidden;
        }

        .mobile-exam-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
          text-align: center;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #2563eb;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .mobile-exam-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 40;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .mobile-exam-header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
        }

        .mobile-exam-info {
          flex: 1;
        }

        .mobile-exam-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .mobile-exam-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .mobile-progress-percentage {
          font-weight: 500;
          color: #2563eb;
        }

        .mobile-exam-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .mobile-progress-bar {
          height: 4px;
          background: #e5e7eb;
          margin: 0 16px 16px 16px;
          border-radius: 2px;
          overflow: hidden;
        }

        .mobile-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .mobile-exam-timer {
          position: fixed;
          top: 16px;
          right: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #1f2937;
          z-index: 45;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .mobile-exam-timer.warning {
          border-color: #f59e0b;
          background: #fffbeb;
          color: #d97706;
        }

        .mobile-exam-timer.critical {
          border-color: #ef4444;
          background: #fef2f2;
          color: #dc2626;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .mobile-exam-content {
          flex: 1;
          padding: 16px;
          padding-bottom: 100px; /* Space for navigation */
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-question-content {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 16px;
        }

        .mobile-question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .mobile-question-number {
          font-size: 0.875rem;
          font-weight: 500;
          color: #2563eb;
        }

        .mobile-question-time-limit {
          font-size: 0.75rem;
          color: #f59e0b;
          background: #fffbeb;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .mobile-question-text {
          font-size: 1.125rem;
          line-height: 1.6;
          color: #1f2937;
          margin-bottom: 20px;
        }

        .mobile-question-instructions {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .mobile-reading-passage {
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #2563eb;
        }

        .mobile-reading-passage h4 {
          margin: 0 0 12px 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .mobile-reading-passage p {
          margin: 0;
          line-height: 1.6;
          color: #374151;
        }

        .mobile-question-image {
          margin-bottom: 20px;
          text-align: center;
        }

        .mobile-answer-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mobile-answer-option {
          display: flex;
          align-items: flex-start;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .mobile-answer-option:hover {
          border-color: #3b82f6;
          background: #f8faff;
        }

        .mobile-answer-option:active {
          transform: scale(0.98);
        }

        .mobile-answer-option.selected {
          border-color: #2563eb;
          background: #eff6ff;
        }

        .mobile-answer-radio {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 50%;
          margin-right: 12px;
          margin-top: 2px;
          position: relative;
          flex-shrink: 0;
        }

        .mobile-answer-option.selected .mobile-answer-radio {
          border-color: #2563eb;
        }

        .mobile-answer-option.selected .mobile-answer-radio::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: #2563eb;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .mobile-answer-text {
          flex: 1;
          font-size: 1rem;
          line-height: 1.5;
          color: #374151;
        }

        .mobile-gap-fill input,
        .mobile-text-answer textarea {
          width: 100%;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          padding: 12px;
          font-size: 1rem;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }

        .mobile-gap-fill input:focus,
        .mobile-text-answer textarea:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .mobile-character-count {
          font-size: 0.75rem;
          color: #9ca3af;
          text-align: right;
          margin-top: 4px;
        }

        .mobile-pause-screen,
        .mobile-completion-screen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 60;
        }

        .mobile-pause-content,
        .mobile-completion-content {
          text-align: center;
          padding: 40px 20px;
          max-width: 400px;
        }

        .mobile-pause-icon,
        .mobile-completion-icon {
          margin-bottom: 20px;
          color: #6b7280;
        }

        .mobile-completion-icon {
          color: #10b981;
        }

        .mobile-pause-title,
        .mobile-completion-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 12px;
        }

        .mobile-pause-description,
        .mobile-completion-description {
          color: #6b7280;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        .mobile-completion-stats {
          display: flex;
          justify-content: center;
          gap: 32px;
          margin-top: 24px;
        }

        .mobile-stat-item {
          text-align: center;
        }

        .mobile-stat-value {
          display: block;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .mobile-stat-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .mobile-exam-navigation {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
          z-index: 40;
        }

        .mobile-nav-buttons {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .mobile-nav-button {
          flex: 1;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          background: white;
          color: #374151;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .mobile-nav-button:hover {
          border-color: #3b82f6;
          background: #f8faff;
        }

        .mobile-nav-button:active {
          transform: scale(0.98);
        }

        .mobile-nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mobile-nav-button.primary {
          background: #2563eb;
          border-color: #2563eb;
          color: white;
        }

        .mobile-nav-button.primary:hover {
          background: #1d4ed8;
          border-color: #1d4ed8;
        }

        .mobile-swipe-hint {
          font-size: 0.75rem;
          color: #9ca3af;
          text-align: center;
          white-space: nowrap;
          margin: 0 8px;
        }

        .mobile-question-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .mobile-question-item {
          aspect-ratio: 1;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-question-item.current {
          border-color: #2563eb;
          background: #2563eb;
          color: white;
        }

        .mobile-question-item.answered {
          border-color: #10b981;
          background: #10b981;
          color: white;
        }

        .mobile-question-item.current.answered {
          border-color: #2563eb;
          background: #2563eb;
        }

        .mobile-question-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
        }

        .mobile-legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .mobile-legend-indicator {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 2px solid #e5e7eb;
        }

        .mobile-legend-indicator.current {
          background: #2563eb;
          border-color: #2563eb;
        }

        .mobile-legend-indicator.answered {
          background: #10b981;
          border-color: #10b981;
        }

        .mobile-error-screen {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .mobile-sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (orientation: landscape) and (max-height: 500px) {
          .mobile-exam-header-content {
            padding: 12px 16px;
          }
          
          .mobile-exam-title {
            font-size: 1rem;
          }
          
          .mobile-question-content {
            padding: 16px;
          }
          
          .mobile-exam-navigation {
            padding: 12px 16px;
          }
        }
      `}</style>
    </div>
  );
}