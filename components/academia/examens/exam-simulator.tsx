'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, FileText, Play, Pause, CheckCircle, AlertCircle, ArrowLeft, Save, Check, X } from 'lucide-react';
import Link from 'next/link';
import { CourseConfiguration } from '@/lib/exam-engine/types/course-config';

interface ExamSimulatorProps {
  courseConfig: CourseConfiguration;
  examId: string;
  userId: string;
  mode: 'practice' | 'exam';
  existingSession?: any;
}

interface ExamSession {
  id: string;
  status: 'in_progress' | 'completed' | 'paused';
  startedAt: Date;
  timeRemaining: number;
  currentQuestion: number;
  answers: Record<string, any>;
}

export function ExamSimulator({
  courseConfig,
  examId,
  userId,
  mode,
  existingSession
}: ExamSimulatorProps) {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);

  const examConfig = courseConfig.examConfigs[examId];
  const backUrl = `/dashboard/${courseConfig.metadata.language}/${courseConfig.metadata.level}/examens`;
  
  // Get all questions from all sections
  const allQuestions = examConfig?.sections?.flatMap(section => 
    section.parts?.flatMap(part => 
      part.questions?.map(question => ({
        ...question,
        sectionId: section.id,
        sectionName: section.name,
        partId: part.partId,
        partName: part.name,
        partText: part.text,
        questionType: part.questionType,
        instructions: part.instructions
      })) || []
    ) || []
  ) || [];

  const currentQuestionData = allQuestions[currentQuestion];
  const totalQuestions = allQuestions.length;

  useEffect(() => {
    // Initialize or resume session
    if (existingSession) {
      // Resume existing session
      setSession({
        id: existingSession.id,
        status: existingSession.status,
        startedAt: new Date(existingSession.started_at),
        timeRemaining: existingSession.time_remaining || examConfig.metadata.duration * 60,
        currentQuestion: existingSession.current_question || 0,
        answers: existingSession.answers || {}
      });
      setCurrentQuestion(existingSession.current_question || 0);
      setTimeRemaining(existingSession.time_remaining || examConfig.metadata.duration * 60);
      setAnswers(existingSession.answers || {});
    } else {
      // Create new session
      const newSession: ExamSession = {
        id: `session_${Date.now()}`, // In real implementation, this would be from database
        status: 'in_progress',
        startedAt: new Date(),
        timeRemaining: examConfig.metadata.duration * 60,
        currentQuestion: 0,
        answers: {}
      };
      setSession(newSession);
      setTimeRemaining(newSession.timeRemaining);
    }
    setIsLoading(false);
  }, [existingSession, examConfig.metadata.duration]);

  useEffect(() => {
    // Timer countdown
    if (timeRemaining > 0 && session?.status === 'in_progress') {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && session) {
      // Auto-submit when time runs out
      handleFinishExam();
    }
  }, [timeRemaining, session?.status]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (session?.status !== 'in_progress') return;
      
      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' && currentQuestion > 0) {
        navigateToQuestion(currentQuestion - 1);
      } else if (e.key === 'ArrowRight' && currentQuestion < totalQuestions - 1) {
        navigateToQuestion(currentQuestion + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, totalQuestions, session?.status]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFinishExam = async () => {
    if (!session) return;
    
    // In real implementation, save to database
    setSession(prev => prev ? { ...prev, status: 'completed' } : null);
    
    // Navigate to results
    // window.location.href = `${backUrl}/results/${session.id}`;
  };

  const handlePauseExam = async () => {
    if (!session) return;
    
    // In real implementation, save to database
    setSession(prev => prev ? { ...prev, status: 'paused' } : null);
  };

  const handleResumeExam = async () => {
    if (!session) return;
    
    setSession(prev => prev ? { ...prev, status: 'in_progress' } : null);
  };

  const handleAnswerSelect = async (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Auto-save answer with visual feedback
    setAutoSaveStatus('saving');
    
    try {
      // Auto-save answer (in real implementation, save to database)
      if (session) {
        setSession(prev => prev ? {
          ...prev,
          answers: { ...prev.answers, [questionId]: answer }
        } : null);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setAutoSaveStatus('saved');
        
        // Clear status after a moment
        setTimeout(() => setAutoSaveStatus(null), 2000);
      }
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Error saving answer:', error);
    }
  };

  const navigateToQuestion = (questionIndex: number) => {
    if (questionIndex >= 0 && questionIndex < totalQuestions) {
      setCurrentQuestion(questionIndex);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Carregant examen...</h2>
          <p className="text-gray-600">Preparant el simulador per a tu</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              Error
            </CardTitle>
            <CardDescription>
              No se pudo inicializar la sesión del examen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={backUrl}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Exámenes
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={backUrl}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Link>
              </Button>
              <div className="border-l border-gray-300 h-6"></div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {examConfig.metadata.title}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Badge variant={mode === 'exam' ? 'default' : 'secondary'}>
                    {mode === 'exam' ? 'Examen' : 'Práctica'}
                  </Badge>
                  <span>•</span>
                  <span>Pregunta {currentQuestion + 1} de {totalQuestions}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Auto-save Status */}
              {autoSaveStatus && (
                <div className="flex items-center space-x-1 text-sm">
                  {autoSaveStatus === 'saving' && (
                    <>
                      <Save className="h-4 w-4 text-blue-500 animate-pulse" />
                      <span className="text-blue-600">Desant...</span>
                    </>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">Desat</span>
                    </>
                  )}
                  {autoSaveStatus === 'error' && (
                    <>
                      <X className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">Error</span>
                    </>
                  )}
                </div>
              )}

              {/* Timer */}
              <div className="flex items-center space-x-2">
                <Clock className={`h-5 w-5 ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-500'}`} />
                <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-500' : 'text-gray-900'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2">
                {session.status === 'in_progress' ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handlePauseExam}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                    <Button size="sm" onClick={handleFinishExam}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalizar
                    </Button>
                  </>
                ) : session.status === 'paused' ? (
                  <Button size="sm" onClick={handleResumeExam}>
                    <Play className="h-4 w-4 mr-2" />
                    Continuar
                  </Button>
                ) : (
                  <Badge variant="secondary">Completado</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>
                  {currentQuestionData ? `Pregunta ${currentQuestionData.number || currentQuestion + 1}` : `Pregunta ${currentQuestion + 1}`}
                </CardTitle>
                <CardDescription>
                  {currentQuestionData?.sectionName || 'Comprensión Lectora'} • {currentQuestionData?.partName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentQuestionData ? (
                  <>
                    {/* Show reading text if available */}
                    {currentQuestionData.partText && (
                      <div className="bg-gray-50 border rounded-lg p-6 mb-6">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          {currentQuestionData.partText.title}
                        </h3>
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <p className="whitespace-pre-line">
                            {currentQuestionData.partText.content}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Instructions */}
                    {currentQuestionData.instructions && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-blue-800 text-sm">
                          {currentQuestionData.instructions}
                        </p>
                      </div>
                    )}

                    {/* Question */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900 text-lg">
                        {currentQuestionData.text}
                      </h4>

                      {/* Multiple Choice Options */}
                      {currentQuestionData.type === 'multiple_choice' && currentQuestionData.options && (
                        <div className="space-y-3">
                          {currentQuestionData.options.map((option: any, index: number) => (
                            <label
                              key={option.value}
                              className={`
                                flex items-start p-4 rounded-lg border cursor-pointer transition-all
                                ${answers[currentQuestionData.id] === option.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }
                              `}
                            >
                              <input
                                type="radio"
                                name={`question_${currentQuestionData.id}`}
                                value={option.value}
                                checked={answers[currentQuestionData.id] === option.value}
                                onChange={(e) => handleAnswerSelect(currentQuestionData.id, e.target.value)}
                                className="mt-1 mr-3"
                              />
                              <div>
                                <span className="font-medium text-gray-900 mr-2">
                                  {option.value}.
                                </span>
                                <span className="text-gray-700">
                                  {option.text}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Text Input for Open Questions and Essays */}
                      {(currentQuestionData.type === 'open_text' || currentQuestionData.type === 'essay') && (
                        <div className="space-y-2">
                          <textarea
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={currentQuestionData.type === 'essay' ? 12 : 6}
                            placeholder={currentQuestionData.type === 'essay' ? "Escriu el teu assaig aquí..." : "Escriu la teua resposta aquí..."}
                            value={answers[currentQuestionData.id] || ''}
                            onChange={(e) => handleAnswerSelect(currentQuestionData.id, e.target.value)}
                          />
                          {currentQuestionData.type === 'essay' && (
                            <div className="flex justify-between items-center text-sm text-gray-500">
                              <span>
                                Paraules: {(answers[currentQuestionData.id] || '').split(' ').filter((word: string) => word.length > 0).length}
                                {currentQuestionData.wordLimit && ` / ${currentQuestionData.wordLimit}`}
                              </span>
                              {currentQuestionData.wordLimit && (
                                <span className={
                                  (answers[currentQuestionData.id] || '').split(' ').filter((word: string) => word.length > 0).length > currentQuestionData.wordLimit
                                    ? 'text-red-500'
                                    : 'text-gray-500'
                                }>
                                  {currentQuestionData.wordLimit - (answers[currentQuestionData.id] || '').split(' ').filter((word: string) => word.length > 0).length} paraules restants
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show points */}
                      <div className="text-sm text-gray-500">
                        Punts: {currentQuestionData.points || 1}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-500 mt-1 mr-3" />
                      <div>
                        <h3 className="font-medium text-yellow-900 mb-2">
                          No hi ha preguntes disponibles
                        </h3>
                        <p className="text-yellow-700 text-sm">
                          Aquest examen no té preguntes configurades encara.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => navigateToQuestion(currentQuestion - 1)}
                    disabled={currentQuestion === 0}
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-sm text-gray-500">
                    {currentQuestion + 1} / {totalQuestions}
                  </span>
                  
                  <Button 
                    onClick={() => navigateToQuestion(currentQuestion + 1)}
                    disabled={currentQuestion === totalQuestions - 1}
                  >
                    Següent
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Progreso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Completado</span>
                      <span>{totalQuestions > 0 ? Math.round(((currentQuestion + 1) / totalQuestions) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Preguntes respostes: {Object.keys(answers).length} / {totalQuestions}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Question Navigator */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Navegador de Preguntas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2">
                    {allQuestions.map((question, i) => (
                      <button
                        key={question.id || i}
                        onClick={() => navigateToQuestion(i)}
                        className={`
                          h-8 w-8 rounded text-xs font-medium transition-colors
                          ${i === currentQuestion 
                            ? 'bg-blue-600 text-white' 
                            : answers[question.id] 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}