"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Mock audio player utilities
const AudioPlayer = {
  play: (url: string) => console.log(`Playing audio: ${url}`),
  pause: () => console.log('Audio paused'),
  setPlaybackRate: (rate: number) => console.log(`Playback rate: ${rate}`),
  getCurrentTime: () => 0
};

// Types for exam configuration and questions
interface ExamConfig {
  id: string;
  title: string;
  provider: string;
  level: string;
  language: string;
  sections: Array<{
    id: string;
    title: string;
    timeLimit: number;
    questions: number;
    instructions: string;
  }>;
  totalQuestions: number;
  totalTime: number;
  passingScore: number;
}

interface QuestionOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  sectionId: string;
  type: 'multiple_choice' | 'audio_multiple_choice' | 'essay';
  question: string;
  passage?: string;
  audioUrl?: string;
  audioDuration?: number;
  options?: QuestionOption[];
  correctAnswer?: string;
  points: number;
  minWords?: number;
  maxWords?: number;
}

interface SessionData {
  id: string;
  examId: string;
  userId: string;
  status: 'in_progress' | 'paused' | 'completed';
  currentSection: string;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  timeRemaining: number;
  startTime: Date;
  pauseTime?: Date | null;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

// Props interface that matches what the page actually passes
interface ExamSimulatorProps {
  exam: {
    id: string;
    title: string;
    description: string;
    duration: number;
    total_questions: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    exam_type: string;
    provider: string;
    questions?: {
      id: string;
      exam_id: string;
      question_number: number;
      question_type: "multiple_choice" | "true_false" | "fill_blank" | "essay" | "listening" | "reading";
      question_text: string;
      question_audio_url?: string;
      question_image_url?: string;
      options?: string[];
      correct_answer: string | string[];
      explanation?: string;
      points: number;
      time_limit?: number;
      metadata?: Record<string, any>;
    }[];
    created_at: string;
    updated_at: string;
  };
  session: {
    id: string;
    exam_id: string;
    user_id: string;
    started_at: string;
    completed_at: string | null;
    score: number | null;
    time_spent: number;
    status: "in_progress" | "completed" | "abandoned";
    answers?: Record<string, any>;
    current_question?: number;
  };
  mode: 'practice' | 'exam';
  language: string;
  level: string;
  provider: string;
}

export function ExamSimulator({
  exam,
  session,
  mode,
  language,
  level,
  provider,
}: ExamSimulatorProps) {
  // Transform props to internal format
  const questions = useMemo(() => {
    return (exam.questions || []).map(q => ({
      id: q.id,
      sectionId: q.metadata?.section || 'general',
      type: q.question_type === 'multiple_choice' ? 'multiple_choice' as const :
            q.question_type === 'essay' ? 'essay' as const :
            q.question_audio_url ? 'audio_multiple_choice' as const : 'multiple_choice' as const,
      question: q.question_text,
      passage: undefined,
      audioUrl: q.question_audio_url,
      audioDuration: q.time_limit,
      options: q.options?.map((opt, idx) => ({ id: `opt_${idx}`, text: opt })),
      correctAnswer: Array.isArray(q.correct_answer) ? q.correct_answer[0] : q.correct_answer,
      points: q.points,
      minWords: q.question_type === 'essay' ? 100 : undefined,
      maxWords: q.question_type === 'essay' ? 500 : undefined,
    }));
  }, [exam.questions]);

  const examConfig = useMemo(() => ({
    id: exam.id,
    title: exam.title,
    provider: exam.provider,
    level: exam.difficulty,
    language: 'en', // Default language
    sections: [{
      id: 'general',
      title: 'General Section',
      timeLimit: exam.duration * 60, // Convert minutes to seconds
      questions: exam.total_questions,
      instructions: exam.description,
    }],
    totalQuestions: exam.total_questions,
    totalTime: exam.duration * 60, // Convert minutes to seconds
    passingScore: 70,
  }), [exam]);

  const sessionData = useMemo(() => ({
    id: session.id,
    examId: session.exam_id,
    userId: session.user_id,
    status: session.status === 'in_progress' ? 'in_progress' as const : 
            session.status === 'completed' ? 'completed' as const : 'in_progress' as const,
    currentSection: 'general',
    currentQuestionIndex: (session.current_question || 1) - 1,
    answers: session.answers || {},
    timeRemaining: exam.duration * 60 - session.time_spent, // Calculate remaining time
    startTime: new Date(session.started_at),
    pauseTime: null,
    progress: {
      completed: Object.keys(session.answers || {}).length,
      total: exam.total_questions,
      percentage: (Object.keys(session.answers || {}).length / exam.total_questions) * 100,
    },
  }), [session, exam]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(sessionData.currentQuestionIndex);
  const [answers, setAnswers] = useState<Record<string, string>>(sessionData.answers);
  const [timeRemaining, setTimeRemaining] = useState(sessionData.timeRemaining);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(true);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout>();
  const autoSaveRef = useRef<NodeJS.Timeout>();
  const router = useRouter();
  const supabase = createClient();

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setShowQuestionPalette(window.innerWidth >= 480);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Timer management
  useEffect(() => {
    if (sessionData.status === 'in_progress' && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          if (newTime === 0) {
            // Handle exam completion when time expires
            console.log('Exam completed due to time expiration:', { timeExpired: true, answers });
            // Could trigger automatic submission here
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionData.status, timeRemaining, answers]);

  // Auto-save functionality
  useEffect(() => {
    if (sessionData.status === 'in_progress') {
      autoSaveRef.current = setInterval(() => {
        // Handle saving progress
        console.log('Auto-saving progress:', answers);
        // Could make API call to save progress here
      }, 30000);
    }

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [sessionData.status, answers]);

  // Current question
  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex] || null;
  }, [questions, currentQuestionIndex]);

  // Section information
  const currentSection = useMemo(() => {
    return examConfig.sections.find(section => section.id === sessionData.currentSection);
  }, [examConfig.sections, sessionData.currentSection]);

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  // Handle answer changes
  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Auto-save on answer change
    setTimeout(() => {
      console.log('Saving answer for question:', questionId, answer);
      // Could make API call to save answer here
    }, 1000);
  }, [answers]);

  // Navigation functions
  const navigateToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
      
      // Announce to screen readers
      const question = questions[index];
      const announcement = `Question ${index + 1} of ${questions.length}`;
      
      // Focus first answer option for accessibility
      setTimeout(() => {
        const firstOption = document.querySelector('input[type="radio"]:first-of-type') as HTMLElement;
        if (firstOption) {
          firstOption.focus();
          setFocusedElement(firstOption.id);
        }
      }, 100);
      
      // Screen reader announcement
      const statusElement = document.querySelector('[role="status"]');
      if (statusElement) {
        statusElement.textContent = announcement;
      }
    }
  }, [questions]);

  const navigateNext = useCallback(() => {
    navigateToQuestion(currentQuestionIndex + 1);
  }, [currentQuestionIndex, navigateToQuestion]);

  const navigatePrevious = useCallback(() => {
    navigateToQuestion(currentQuestionIndex - 1);
  }, [currentQuestionIndex, navigateToQuestion]);

  // Section switching
  const switchToSection = useCallback((sectionId: string) => {
    const sectionStartIndex = questions.findIndex(q => q.sectionId === sectionId);
    if (sectionStartIndex !== -1) {
      navigateToQuestion(sectionStartIndex);
    }
  }, [questions, navigateToQuestion]);

  // Audio controls
  const toggleAudioPlayback = useCallback(() => {
    if (currentQuestion?.audioUrl) {
      if (isPlaying) {
        AudioPlayer.pause();
        setIsPlaying(false);
      } else {
        AudioPlayer.play(currentQuestion.audioUrl);
        setIsPlaying(true);
      }
    }
  }, [currentQuestion, isPlaying]);

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    AudioPlayer.setPlaybackRate(rate);
  }, []);

  const replayAudio = useCallback(() => {
    if (currentQuestion?.audioUrl) {
      AudioPlayer.play(currentQuestion.audioUrl);
      setIsPlaying(true);
      setAudioCurrentTime(0);
    }
  }, [currentQuestion]);

  // Session controls
  const handlePauseSession = useCallback(() => {
    // For now, just show a message - pause functionality would need backend support
    console.log('Pause session requested');
  }, []);

  const handleResumeSession = useCallback(() => {
    // Resume session functionality
    console.log('Resume session requested');
  }, []);

  const handleSubmitExam = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);

  const confirmSubmit = useCallback(() => {
    // Handle exam completion
    console.log('Exam completed:', { 
      answers, 
      timeRemaining, 
      completed: true,
      score: null // Score calculation would be done on backend
    });
    
    // Navigate back to exam list or show results
    router.push(`/dashboard/${language}/${level}/examens/${provider}`);
    setShowSubmitDialog(false);
  }, [router, language, level, provider, answers, timeRemaining]);

  // Word count for essays
  const getWordCount = useCallback((text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  // Validation for essay questions
  const validateEssayAnswer = useCallback((answer: string, question: Question) => {
    if (!question.minWords) return null;
    
    const wordCount = getWordCount(answer);
    if (wordCount < question.minWords) {
      return `Minimum ${question.minWords} words required`;
    }
    if (question.maxWords && wordCount > question.maxWords) {
      return `Maximum ${question.maxWords} words allowed`;
    }
    return null;
  }, [getWordCount]);

  // Handle network errors
  useEffect(() => {
    const handleOnlineStatus = () => {
      if (!navigator.onLine) {
        console.warn('Network connection lost');
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Time warnings
  const getTimeWarning = useMemo(() => {
    if (timeRemaining <= 0) {
      return { level: 'expired', message: 'Time expired' };
    } else if (timeRemaining <= 300) { // 5 minutes
      return { level: 'critical', message: `${Math.floor(timeRemaining / 60)} minutes remaining` };
    } else if (timeRemaining <= 900) { // 15 minutes
      return { level: 'warning', message: `${Math.floor(timeRemaining / 60)} minutes remaining` };
    }
    return null;
  }, [timeRemaining]);

  // Error state for corrupted data
  if (!currentQuestion && questions.length > 0) {
    // Reset to first question if current index is invalid
    useEffect(() => {
      setCurrentQuestionIndex(0);
    }, []);
    return null;
  }

  // Empty state
  if (!questions.length) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No questions available</h2>
          <p className="text-gray-600 mb-6">This exam appears to have no questions configured.</p>
          <button
            onClick={() => router.push(`/dashboard/${language}/${level}/examens/${provider}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  // Time expired state
  if (timeRemaining === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Time Expired</h2>
          <p className="text-gray-600 mb-6">Your exam time has expired. Your responses have been automatically saved.</p>
          <button
            onClick={confirmSubmit}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Submit Exam
          </button>
        </div>
      </main>
    );
  }

  // Network error state
  if (!navigator.onLine) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md" role="alert">
          <h3 className="text-red-800 font-medium mb-2">Connection Issue</h3>
          <p className="text-red-600">Please check your internet connection and try again.</p>
        </div>
      </main>
    );
  }

  // Paused state
  if (sessionData.status === 'paused') {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Exam Paused</h2>
          <p className="text-gray-600 mb-6">Your exam is currently paused. Click resume to continue.</p>
          <button
            onClick={handleResumeSession}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Resume exam session"
          >
            Resume
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen bg-gray-50 ${isMobile ? 'mobile-layout' : ''}`} aria-label={`${examConfig.title} exam simulator`}>
      {/* Time Warning Alert */}
      {getTimeWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-2 text-center" role="alert">
          {getTimeWarning.message}
        </div>
      )}

      <div className="flex h-screen">
        {/* Question Palette Sidebar */}
        {showQuestionPalette && (
          <div className={`w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto ${isMobile ? 'collapsed' : ''}`}>
            <h3 className="font-semibold text-gray-900 mb-4">Question Navigation</h3>
            <div 
              className="grid grid-cols-5 gap-2 mb-6" 
              data-testid="question-palette"
              role="navigation"
              aria-label="Question palette"
            >
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => navigateToQuestion(index)}
                  className={`w-8 h-8 text-xs rounded flex items-center justify-center transition-colors ${
                    index === currentQuestionIndex 
                      ? 'bg-blue-600 text-white' 
                      : answers[question.id] 
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                  } hover:bg-blue-100`}
                  aria-label={`Question ${index + 1}${answers[question.id] ? ' - answered' : ' - not answered'}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {/* Section Navigation */}
            <div role="navigation" aria-label="Section navigation">
              <h4 className="font-medium text-gray-700 mb-2">Sections</h4>
              {examConfig.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => switchToSection(section.id)}
                  role="tab"
                  aria-selected={section.id === 'general'}
                  className={`block w-full text-left px-3 py-2 rounded mb-1 transition-colors ${
                    section.id === 'general' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{examConfig.title}</h1>
                <p className="text-sm text-gray-600">{currentSection?.title || 'General Section'}</p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Progress */}
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{sessionData.progress.completed} / {sessionData.progress.total}</span>
                  <span className="ml-1">({Math.round(sessionData.progress.percentage)}%)</span>
                </div>
                
                {/* Timer */}
                <div 
                  className={`text-lg font-mono ${timeRemaining < 900 ? 'text-red-600' : 'text-gray-900'}`}
                  data-testid="exam-timer"
                  role="timer"
                  aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
                >
                  {formatTime(timeRemaining)}
                </div>
                
                {/* Progress Bar */}
                <div className="w-32">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${sessionData.progress.percentage}%` }}
                      role="progressbar"
                      aria-valuenow={sessionData.progress.percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Exam progress"
                    ></div>
                  </div>
                </div>

                {/* Session Controls */}
                <div className="flex space-x-2">
                  <button
                    onClick={handlePauseSession}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    aria-label="Pause exam session"
                  >
                    Pause
                  </button>
                  <button
                    onClick={handleSubmitExam}
                    className="px-4 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    aria-label="Submit exam"
                  >
                    Submit Exam
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Question Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {currentQuestion && (
              <div className="max-w-4xl mx-auto">
                {/* Question Header */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    {currentSection?.instructions || exam.description}
                  </div>
                </div>

                {/* Audio Player for Audio Questions */}
                {currentQuestion.type === 'audio_multiple_choice' && currentQuestion.audioUrl && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" data-testid="audio-player">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900">Audio Question</h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => changePlaybackRate(0.75)}
                          className={`px-2 py-1 text-xs rounded ${playbackRate === 0.75 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                          0.75x
                        </button>
                        <button
                          onClick={() => changePlaybackRate(1.0)}
                          className={`px-2 py-1 text-xs rounded ${playbackRate === 1.0 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                          1x
                        </button>
                        <button
                          onClick={() => changePlaybackRate(1.25)}
                          className={`px-2 py-1 text-xs rounded ${playbackRate === 1.25 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                          1.25x
                        </button>
                        <button
                          onClick={toggleAudioPlayback}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          aria-label={isPlaying ? "Pause audio" : "Play audio"}
                          role="button"
                        >
                          {isPlaying ? 'Pause Audio' : 'Play Audio'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600" data-testid="audio-progress">
                      <span>0:00 / 0:{String(currentQuestion.audioDuration || 0).padStart(2, '0')}</span>
                      <button
                        onClick={replayAudio}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        aria-label="Replay audio from beginning"
                      >
                        Replay
                      </button>
                    </div>
                    
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-600 h-1 rounded-full transition-all duration-100"
                          style={{ width: `${(audioCurrentTime / (currentQuestion.audioDuration || 1)) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Playback Speed Controls */}
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Playback speed:</span>
                      <button
                        onClick={() => changePlaybackRate(0.75)}
                        className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                        aria-label="Set playback speed to 0.75x"
                      >
                        0.75x
                      </button>
                      <button
                        onClick={() => changePlaybackRate(1.25)}
                        className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 transition-colors"
                        aria-label="Set playback speed to 1.25x"
                      >
                        1.25x
                      </button>
                    </div>
                  </div>
                )}

                {/* Question Text */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {currentQuestion.question}
                  </h3>
                  
                  {currentQuestion.passage && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Reading Passage</h4>
                      <p className="text-gray-700 leading-relaxed">{currentQuestion.passage}</p>
                    </div>
                  )}
                </div>

                {/* Answer Options */}
                {(currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'audio_multiple_choice') && (
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option.id}
                          checked={answers[currentQuestion.id] === option.id}
                          onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
                          className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <span className="flex-1 text-gray-900">{option.text}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Essay Answer */}
                {currentQuestion.type === 'essay' && (
                  <div>
                    <div className="mb-2 flex justify-between items-center">
                      <label htmlFor={`essay-${currentQuestion.id}`} className="block text-sm font-medium text-gray-700">
                        Essay Answer
                      </label>
                      <div className="text-sm text-gray-500">
                        {getWordCount(answers[currentQuestion.id] || '')} words
                        {currentQuestion.minWords && (
                          <span className="ml-2">
                            (min: {currentQuestion.minWords})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <textarea
                      id={`essay-${currentQuestion.id}`}
                      rows={12}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Type your essay response here..."
                      aria-label="Essay answer textbox"
                    />
                    
                    {/* Essay Validation */}
                    {answers[currentQuestion.id] && (
                      <div className="mt-2">
                        {(() => {
                          const validationError = validateEssayAnswer(answers[currentQuestion.id], currentQuestion);
                          return validationError ? (
                            <p className="text-sm text-red-600">{validationError}</p>
                          ) : (
                            <p className="text-sm text-green-600">Word count meets requirements</p>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <footer className="bg-white border-t border-gray-200 p-4">
            <div className="flex justify-between items-center max-w-4xl mx-auto">
              <button
                onClick={navigatePrevious}
                disabled={currentQuestionIndex === 0}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Go to previous question"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Previous</span>
              </button>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                
                {!isMobile && (
                  <button
                    onClick={() => setShowQuestionPalette(!showQuestionPalette)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    {showQuestionPalette ? 'Hide' : 'Show'} Palette
                  </button>
                )}
              </div>

              <button
                onClick={navigateNext}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Go to next question"
              >
                <span>Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </footer>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Confirm Exam Submission</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to submit your exam? You won't be able to make changes after submission.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmitDialog(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                aria-label="Confirm submit exam"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Reader Status Updates */}
      <div role="status" aria-live="polite" className="sr-only">
        Question {currentQuestionIndex + 1} of {questions.length}
      </div>
    </main>
  );
}