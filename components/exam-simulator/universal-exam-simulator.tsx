"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExamState } from '@/components/providers/exam-state-provider';
import Link from 'next/link';
import {
  FileQuestion,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
  Flag,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ExamNavigation } from './exam-navigation';
import { ExamTimer } from './exam-timer';
import type { ExamContent, ExamMode, QuestionType, UserAnswer } from '@/types/exam-system';
import type { Question, SimpleExamTemplate } from '@/lib/services/exam-data.service';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const SUBJECTIVE_TYPES = new Set<QuestionType>(['essay', 'open_ended', 'speaking_task']);

interface UniversalExamSimulatorProps {
  examTemplate: SimpleExamTemplate;
  examContent: ExamContent[];
  questions: Question[];
  userId: string;
  mode: ExamMode;
  onExamComplete?: (result: ExamResult) => void;
  onExamExit?: () => void;
}

interface ExamResult {
  correct: number;
  total: number;
  percentage: number;
  answers: Record<string, UserAnswer & { pendingManual?: boolean }>;
  pendingManual: number;
  pendingPoints: number;
}

export function UniversalExamSimulator({
  examTemplate,
  examContent: _examContent,
  questions,
  userId: _userId,
  mode,
  onExamComplete,
  onExamExit
}: UniversalExamSimulatorProps) {
  void _examContent;
  void _userId;
  const router = useRouter();
  const { startExam: startExamState, endExam: endExamState } = useExamState();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState(examTemplate.estimated_duration * 60);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [result, setResult] = useState<ExamResult | null>(null);
  const [speakingTimerSeconds, setSpeakingTimerSeconds] = useState(120);
  const [speakingTimerRunning, setSpeakingTimerRunning] = useState(false);

  const totalQuestions = questions.length;

  const answeredQuestionIndexes = useMemo(() => {
    return questions.reduce<number[]>((acc, question, index) => {
      if (answers[question.id]) {
        acc.push(index);
      }
      return acc;
    }, []);
  }, [answers, questions]);

  const progressPercentage = totalQuestions > 0 ? (answeredQuestionIndexes.length / totalQuestions) * 100 : 0;
  const currentQuestionData = questions[currentQuestion];
  const currentQuestionType = currentQuestionData?.question_type as QuestionType | undefined;
  const isSubjectiveQuestion = currentQuestionType ? SUBJECTIVE_TYPES.has(currentQuestionType) : false;
  const isSpeakingTask = currentQuestionType === 'speaking_task';

  const startExam = useCallback(() => {
    setIsStarted(true);
    setShowInstructions(false);
    setIsCompleted(false);
    setShowResults(false);
    setAnswers({});
    setFlaggedQuestions([]);
    setResult(null);
    setTimeLeft(examTemplate.estimated_duration * 60);
    setQuestionStartTime(Date.now());

    // Activar estado de examen y colapsar menú
    const examId = `${examTemplate.provider}_${examTemplate.language}_${examTemplate.level}`;
    startExamState(examId);
  }, [examTemplate.estimated_duration, examTemplate.provider, examTemplate.language, examTemplate.level, startExamState]);

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    const now = Date.now();
    const timeSpentOnQuestion = Math.max(0, Math.round((now - questionStartTime) / 1000));
    const question = questions.find(q => q.id === questionId);

    const numericIndex = Number(answer);
    const answerText = typeof answer === 'string'
      ? answer
      : Number.isFinite(numericIndex) && question
        ? question.options[numericIndex] ?? ''
        : '';

    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        answer,
        answer_text: answerText,
        time_spent: (prev[questionId]?.time_spent || 0) + timeSpentOnQuestion,
        attempts: (prev[questionId]?.attempts || 0) + 1,
        is_final: false,
      },
    }));

    setQuestionStartTime(now);
  }, [questionStartTime, questions]);

  const handleNavigate = useCallback((questionNumber: number) => {
    if (questionNumber < 0 || questionNumber >= totalQuestions) return;

    const now = Date.now();
    const currentQuestionId = questions[currentQuestion]?.id;

    if (currentQuestionId && answers[currentQuestionId]) {
      const timeSpent = Math.max(0, Math.round((now - questionStartTime) / 1000));
      setAnswers(prev => ({
        ...prev,
        [currentQuestionId]: {
          ...prev[currentQuestionId],
          time_spent: (prev[currentQuestionId]?.time_spent || 0) + timeSpent,
        },
      }));
    }

    setCurrentQuestion(questionNumber);
    setQuestionStartTime(now);
  }, [answers, currentQuestion, questionStartTime, questions, totalQuestions]);

  const handleFlag = useCallback((questionId: string) => {
    setFlaggedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  }, []);

  const submitExam = useCallback(() => {
    if (isCompleted) return;

    const evaluation = questions.reduce<ExamResult>((acc, question) => {
      const userAnswer = answers[question.id];
      const isSubjective = SUBJECTIVE_TYPES.has(question.question_type as QuestionType);
      const baseAnswer: UserAnswer = userAnswer || {
        question_id: question.id,
        answer: '',
        answer_text: '',
        time_spent: 0,
        attempts: 0,
        is_final: true,
      };

      if (isSubjective) {
        return {
          correct: acc.correct,
          total: acc.total,
          percentage: 0,
          pendingManual: acc.pendingManual + 1,
          pendingPoints: acc.pendingPoints + (question.points || 0),
          answers: {
            ...acc.answers,
            [question.id]: {
              ...baseAnswer,
              is_final: true,
              pendingManual: true,
            },
          },
        };
      }

      const maxPoints = question.points || 0;
      const isCorrect = userAnswer?.answer === question.correct_answer;
      const earnedPoints = isCorrect ? maxPoints : 0;

      return {
        correct: acc.correct + earnedPoints,
        total: acc.total + maxPoints,
        percentage: 0,
        pendingManual: acc.pendingManual,
        pendingPoints: acc.pendingPoints,
        answers: {
          ...acc.answers,
          [question.id]: {
            ...baseAnswer,
            is_final: true,
            score: earnedPoints,
          },
        },
      };
    }, { correct: 0, total: 0, percentage: 0, answers: {}, pendingManual: 0, pendingPoints: 0 });

    const percentage = evaluation.total > 0
      ? Math.round((evaluation.correct / evaluation.total) * 100)
      : 0;

    const finalResult: ExamResult = {
      ...evaluation,
      percentage,
    };

    setResult(finalResult);
    setIsCompleted(true);
    setShowResults(true);
    setIsStarted(false);

    // Finalizar estado de examen y expandir menú
    endExamState();

    if (onExamComplete) {
      onExamComplete(finalResult);
    }
  }, [answers, isCompleted, onExamComplete, questions, endExamState]);

  useEffect(() => {
    if (isStarted && !isCompleted && timeLeft <= 0) {
      submitExam();
    }
  }, [isStarted, isCompleted, timeLeft, submitExam]);

  useEffect(() => {
    setSpeakingTimerRunning(false);
    setSpeakingTimerSeconds(120);
  }, [currentQuestion]);

  // Limpiar estado del examen cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (isStarted && !isCompleted) {
        endExamState();
      }
    };
  }, [isStarted, isCompleted, endExamState]);

  useEffect(() => {
    if (!isSpeakingTask || !speakingTimerRunning) {
      return;
    }

    if (speakingTimerSeconds <= 0) {
      setSpeakingTimerRunning(false);
      return;
    }

    const interval = setInterval(() => {
      setSpeakingTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [speakingTimerRunning, speakingTimerSeconds, isSpeakingTask]);

  const handleSpeakingTimerToggle = () => {
    if (!isSpeakingTask) {
      return;
    }

    if (speakingTimerRunning) {
      setSpeakingTimerRunning(false);
      return;
    }

    if (speakingTimerSeconds <= 0) {
      setSpeakingTimerSeconds(120);
    }
    setSpeakingTimerRunning(true);
  };

  const handleSpeakingTimerReset = () => {
    if (!isSpeakingTask) {
      return;
    }
    setSpeakingTimerRunning(false);
    setSpeakingTimerSeconds(120);
  };

  const formatSeconds = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (totalQuestions === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-slate-600 dark:text-slate-300">
        <FileQuestion className="w-14 h-14" />
        <div>
          <h2 className="text-xl font-semibold">Este simulador aún no tiene preguntas</h2>
          <p className="text-sm">Vuelve pronto mientras añadimos el contenido oficial de este examen.</p>
        </div>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
              <FileQuestion className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                {examTemplate.title}
              </CardTitle>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Modalidad: {mode === 'practice' ? 'Práctica guiada' : mode === 'mock_exam' ? 'Simulacro' : mode === 'diagnostic' ? 'Diagnóstico' : 'Práctica cronometrada'}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-50 dark:bg-slate-900/40 border-0 shadow-none">
              <CardContent className="p-4 text-center space-y-2">
                <Badge variant="outline" className="mx-auto">Preguntas</Badge>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{totalQuestions}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Selecciona la respuesta correcta para cada ítem.</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 dark:bg-slate-900/40 border-0 shadow-none">
              <CardContent className="p-4 text-center space-y-2">
                <Badge variant="outline" className="mx-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Tiempo
                </Badge>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{examTemplate.estimated_duration} min</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">El temporizador se iniciará cuando comiences.</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 dark:bg-slate-900/40 border-0 shadow-none">
              <CardContent className="p-4 text-center space-y-2">
                <Badge variant="outline" className="mx-auto">Idioma</Badge>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{examTemplate.language.toUpperCase()}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Nivel {examTemplate.level}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4 text-left">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Instrucciones</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {examTemplate.instructions}
            </p>
            <Separator />
            <ul className="list-disc list-inside space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li>Podrás marcar preguntas para revisarlas más tarde.</li>
              <li>El sistema guarda automáticamente tus respuestas.</li>
              <li>Al finalizar recibirás tu puntuación y porcentaje de aciertos.</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Academia
              </Link>
            </Button>
            <Button onClick={startExam} className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <Play className="w-5 h-5" />
              Comenzar simulador
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResults && result) {
    const hasAutomaticScoring = result.total > 0;
    const correctDisplay = hasAutomaticScoring ? result.correct : '—';
    const totalDisplay = hasAutomaticScoring ? result.total : '—';
    const percentageDisplay = hasAutomaticScoring ? `${result.percentage}%` : 'Pend. revisió';

    return (
      <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 shadow-xl">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                Resultados del simulador
              </CardTitle>
              <p className="text-slate-600 dark:text-slate-300 mt-1">
                Has completado el examen oficial de {examTemplate.provider.toUpperCase()}.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-50 dark:bg-slate-900/40 border-0 shadow-none">
              <CardContent className="p-4 text-center space-y-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">Respuestas correctas</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{correctDisplay}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">de {totalDisplay} punts</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 dark:bg-slate-900/40 border-0 shadow-none">
              <CardContent className="p-4 text-center space-y-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">Percentatge</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{percentageDisplay}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {hasAutomaticScoring
                    ? 'Puntuació calculada automàticament'
                    : 'Pendents de revisió manual segons la rúbrica oficial'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 dark:bg-slate-900/40 border-0 shadow-none">
              <CardContent className="p-4 text-center space-y-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">Preguntes respostes</p>
                <p className="text-3xl font-semibold text-slate-900 dark:text-white">{answeredQuestionIndexes.length}/{totalQuestions}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Respostes enregistrades</p>
              </CardContent>
            </Card>
          </div>

          {result.pendingManual > 0 && (
            <Card className="border border-amber-200 bg-amber-50/60 dark:border-amber-600/60 dark:bg-amber-900/20">
              <CardContent className="p-4 space-y-1 text-sm text-amber-800 dark:text-amber-200">
                <p className="font-semibold">Avaluació manual pendent</p>
                <p>
                  Hi ha {result.pendingManual} tasca{result.pendingManual > 1 ? 's' : ''} d&apos;expressió que es revisen
                  manualment. Repassa la rúbrica oficial per autoavaluar-te i sol·licita feedback al teu tutor.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={startExam} className="gap-2">
              <RotateCcw className="w-5 h-5" />
              Tornar a intentar
            </Button>
            {onExamExit ? (
              <Button variant="outline" onClick={onExamExit}>
                Sortir
              </Button>
            ) : (
              <Button variant="outline" onClick={() => router.back()}>
                Sortir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isStarted || !currentQuestionData) {
    return null;
  }

  const currentQuestionId = currentQuestionData.id;
  const userAnswer = answers[currentQuestionId];
  const questionOptions = currentQuestionData.options || [];
  const isFlagged = flaggedQuestions.includes(currentQuestionId);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
        <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {examTemplate.title}
            </h2>
            <Badge variant="outline">Pregunta {currentQuestion + 1} de {totalQuestions}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <ExamTimer
              key={isStarted ? 'running' : 'idle'}
              duration={examTemplate.estimated_duration * 60}
              isRunning={isStarted && !isCompleted}
              onTimeUp={submitExam}
              onTimeUpdate={setTimeLeft}
              allowPause={false}
            />
            <Button variant="outline" onClick={() => handleFlag(currentQuestionId)}>
              <Flag className="w-4 h-4 mr-2" />
              {isFlagged ? 'Marcada' : 'Marcar'}
            </Button>
          </div>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Progrés general</span>
            <span>{answeredQuestionIndexes.length} / {totalQuestions} preguntes</span>
          </div>
          <Progress value={progressPercentage} className="mt-2 h-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <ExamNavigation
            currentQuestion={currentQuestion}
            totalQuestions={totalQuestions}
            answeredIndexes={answeredQuestionIndexes}
            flaggedQuestionIds={flaggedQuestions}
            questions={questions}
            onNavigate={handleNavigate}
          />
        </div>

        <div className="lg:col-span-3 space-y-6">
          {currentQuestionData.section && (
            <Badge variant="secondary" className="uppercase tracking-wide">
              {currentQuestionData.section}
            </Badge>
          )}

          {currentQuestionData.context && (
            <Card className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
              <CardContent className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-200">
                <div dangerouslySetInnerHTML={{ __html: currentQuestionData.context }} />
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                Pregunta {currentQuestion + 1}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-slate-700 dark:text-slate-200 leading-relaxed text-base">
                {currentQuestionData.question_text}
              </div>
              {isSubjectiveQuestion ? (
                <div className="space-y-4">
                  {isSpeakingTask && (
                    <Card className="border border-blue-200 bg-blue-50/60 dark:border-blue-700/40 dark:bg-blue-900/20">
                      <CardContent className="p-4 space-y-3">
                        <div className="text-sm text-blue-900 dark:text-blue-100">
                          Utilitza el cronòmetre per planificar (1 minut) i exposar (3 minuts). Practica com si
                          estigueres davant del tribunal.
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-lg text-blue-900 dark:text-blue-100">
                            {formatSeconds(speakingTimerSeconds)}
                          </span>
                          <Button size="sm" onClick={handleSpeakingTimerToggle}>
                            {speakingTimerRunning ? 'Pausar' : 'Començar'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleSpeakingTimerReset}>
                            Reiniciar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {isSpeakingTask ? 'Apunts (opcional)' : 'La teua resposta'}
                    </Label>
                    <Textarea
                      value={typeof userAnswer?.answer === 'string' ? userAnswer.answer : ''}
                      onChange={(event) => handleAnswer(currentQuestionId, event.target.value)}
                      placeholder={isSpeakingTask
                        ? 'Anota idees clau, vocabulari o estructures per a la teua intervenció...'
                        : 'Escriu la teua redacció ací...'}
                      rows={isSpeakingTask ? 6 : currentQuestionType === 'essay' ? 10 : 6}
                      className="min-h-[160px]"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Caràcters: {(typeof userAnswer?.answer === 'string' ? userAnswer.answer.length : 0)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {questionOptions.map((option, index) => {
                    const optionId = index.toString();
                    const isSelected = userAnswer?.answer === optionId;

                    return (
                      <label
                        key={optionId}
                        className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestionId}`}
                          value={optionId}
                          checked={isSelected}
                          onChange={() => handleAnswer(currentQuestionId, optionId)}
                          className="mt-1"
                        />
                        <span className="text-slate-700 dark:text-slate-200">
                          {String.fromCharCode(65 + index)}. {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-x-2">
              <Button
                variant="outline"
                disabled={currentQuestion === 0}
                onClick={() => handleNavigate(currentQuestion - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
              <Button
                variant="outline"
                disabled={currentQuestion === totalQuestions - 1}
                onClick={() => handleNavigate(currentQuestion + 1)}
              >
                Siguiente
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </div>
            <div className="space-x-2">
              <Button variant="outline" onClick={startExam}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-600" onClick={submitExam}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Finalitzar examen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
