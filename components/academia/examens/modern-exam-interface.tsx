'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Clock, 
  BookOpen, 
  PenTool, 
  ArrowLeftRight, 
  Mic, 
  Play, 
  Pause, 
  Save, 
  Check, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Timer,
  FileText,
  ArrowLeft,
  X
} from 'lucide-react';
import Link from 'next/link';
import { CourseConfiguration } from '@/lib/exam-engine/types/course-config';

interface ModernExamInterfaceProps {
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
  currentSection: string;
  answers: Record<string, any>;
}

interface ExamSection {
  id: string;
  name: string;
  icon: any;
  duration: number;
  description: string;
  parts: ExamPart[];
}

interface ExamPart {
  id: string;
  name: string;
  instructions: string;
  text?: {
    title: string;
    content: string;
  };
  questions: ExamQuestion[];
}

interface ExamQuestion {
  id: string;
  number: number;
  text: string;
  type: 'multiple_choice' | 'text_input' | 'essay';
  options?: Array<{ value: string; text: string }>;
  wordLimit?: number;
  points: number;
  correctAnswer?: string | number;
  explanation?: string;
}

interface ExamResults {
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  sectionResults: Array<{
    sectionId: string;
    sectionName: string;
    score: number;
    maxScore: number;
    percentage: number;
  }>;
  questionResults: Array<{
    questionId: string;
    questionNumber: number;
    userAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
    points: number;
    maxPoints: number;
  }>;
  timeSpent: number;
  completedAt: Date;
}

// Mock exam data based on the HTML simulator structure
const mockExamData: ExamSection[] = [
  {
    id: 'comprensio',
    name: 'Comprensió Lectora',
    icon: BookOpen,
    duration: 45,
    description: 'Llig els textos i contesta les preguntes corresponents',
    parts: [
      {
        id: 'text1',
        name: 'Text 1: La sostenibilitat en les ciutats valencianes',
        instructions: 'Llig el text i contesta les preguntes 1-8 marcant l\'opció correcta (A, B, C o D).',
        text: {
          title: 'Cap a unes ciutats més sostenibles',
          content: `La Comunitat Valenciana està (1) ____ un procés de transformació urbana cap a la sostenibilitat que pretén convertir les seues ciutats en models de desenvolupament responsable. Les iniciatives que s'estan portant a terme abasten des de la millora del transport públic fins a la creació d'espais verds urbans.

València, com a capital autonòmica, lidera aquest canvi amb projectes (2) ____ com la renaturalització del Túria i la implementació de la xarxa de carrils bici. Estos projectes no només milloren la qualitat de vida dels ciutadans, sinó que també (3) ____ a la reducció de les emissions de CO2.

L'Ajuntament ha posat en marxa diverses mesures per a (4) ____ l'ús del transport privat i fomentar alternatives més ecològiques. Entre aquestes mesures destaca la creació de zones de baixa emissió i l'ampliació de la xarxa de transport públic.`
        },
        questions: [
          {
            id: 'p1',
            number: 1,
            text: 'La Comunitat Valenciana està ____ un procés de transformació urbana',
            type: 'multiple_choice',
            options: [
              { value: 'A', text: 'iniciant' },
              { value: 'B', text: 'començant' },
              { value: 'C', text: 'desenvolupant' },
              { value: 'D', text: 'executant' }
            ],
            points: 1,
            correctAnswer: 'C',
            explanation: 'La resposta correcta és "desenvolupant" perquè indica un procés en curs.'
          },
          {
            id: 'p2',
            number: 2,
            text: 'projectes ____ com la renaturalització del Túria',
            type: 'multiple_choice',
            options: [
              { value: 'A', text: 'innovadors' },
              { value: 'B', text: 'creatius' },
              { value: 'C', text: 'novedosos' },
              { value: 'D', text: 'originals' }
            ],
            points: 1,
            correctAnswer: 'A',
            explanation: 'La resposta correcta és "innovadors" perquè destaca el caràcter nou i pioner dels projectes.'
          },
          {
            id: 'p3',
            number: 3,
            text: 'també ____ a la reducció de les emissions de CO2',
            type: 'multiple_choice',
            options: [
              { value: 'A', text: 'ajuden' },
              { value: 'B', text: 'contribueixen' },
              { value: 'C', text: 'participes' },
              { value: 'D', text: 'col·laboren' }
            ],
            points: 1,
            correctAnswer: 'B',
            explanation: 'La resposta correcta és "contribueixen" ja que és el verb més adequat en aquest context formal.'
          },
          {
            id: 'p4',
            number: 4,
            text: 'mesures per a ____ l\'ús del transport privat',
            type: 'multiple_choice',
            options: [
              { value: 'A', text: 'reduir' },
              { value: 'B', text: 'disminuir' },
              { value: 'C', text: 'limitar' },
              { value: 'D', text: 'restringir' }
            ],
            points: 1,
            correctAnswer: 'A',
            explanation: 'La resposta correcta és "reduir" perquè és l\'objectiu principal de les polítiques de sostenibilitat.'
          }
        ]
      },
      {
        id: 'text2',
        name: 'Text 2: La importància de les tradicions',
        instructions: 'Llig el text i contesta les preguntes 5-8 escrivint una paraula en cada espai.',
        text: {
          title: 'Tradicions valencianes en el segle XXI',
          content: `Les tradicions valencianes han sabut adaptar-se (5) ____ temps moderns sense perdre la seua essència. Festes com les Falles, la Tomatina o els Moros i Cristians continuen congregant (6) ____ de milers de participants cada any.

Aquests esdeveniments no només preserven el patrimoni cultural, sinó que també generen un important impacte econòmic (7) ____ les localitats on se celebren. El turisme cultural s'ha convertit en una font d'ingressos fonamental.

La transmissió d'aquestes tradicions a les noves generacions (8) ____ un repte en la societat actual. Les escoles i les associacions culturals juguen un paper clau en aquest procés.`
        },
        questions: [
          {
            id: 'p5',
            number: 5,
            text: 'adaptar-se ____ temps moderns',
            type: 'text_input',
            points: 1,
            correctAnswer: 'als',
            explanation: 'La resposta correcta és "als" (contracció de "a" + "els").'
          },
          {
            id: 'p6',
            number: 6,
            text: 'congregant ____ de milers de participants',
            type: 'text_input',
            points: 1,
            correctAnswer: 'centenars',
            explanation: 'La resposta correcta és "centenars" per indicar una gran quantitat.'
          },
          {
            id: 'p7',
            number: 7,
            text: 'impacte econòmic ____ les localitats',
            type: 'text_input',
            points: 1,
            correctAnswer: 'en',
            explanation: 'La resposta correcta és "en" per indicar localització.'
          },
          {
            id: 'p8',
            number: 8,
            text: 'generacions ____ un repte',
            type: 'text_input',
            points: 1,
            correctAnswer: 'suposa',
            explanation: 'La resposta correcta és "suposa" per indicar que representa un repte.'
          }
        ]
      }
    ]
  },
  {
    id: 'expressio',
    name: 'Expressió Escrita',
    icon: PenTool,
    duration: 60,
    description: 'Completa les dues tasques d\'escriptura (200-250 paraules cada una)',
    parts: [
      {
        id: 'assaig',
        name: 'Tasca 1: Assaig argumentatiu (Obligatòria)',
        instructions: 'Escriu un assaig de 200-250 paraules sobre el tema proposat.',
        questions: [
          {
            id: 'essay1',
            number: 9,
            text: 'En la teua classe d\'valencià heu estat parlant sobre l\'impacte de les xarxes socials en la societat. El professor t\'ha demanat que escrigues un assaig sobre el següent tema: "Les xarxes socials han millorat la comunicació entre les persones." Escriu un assaig donant la teua opinió sobre aquesta afirmació.',
            type: 'essay',
            wordLimit: 250,
            points: 15
          }
        ]
      },
      {
        id: 'eleccio',
        name: 'Tasca 2: Tria UNA de les següents tasques',
        instructions: 'Escriu la teua resposta en 200-250 paraules amb un estil adequat.',
        questions: [
          {
            id: 'choice1',
            number: 10,
            text: 'Article: Escriu un article sobre el millor lloc per visitar al País Valencià. Explica per què el recomanaries i què el fa especial.',
            type: 'essay',
            wordLimit: 250,
            points: 15
          }
        ]
      }
    ]
  },
  {
    id: 'mediacio',
    name: 'Mediació Lingüística',
    icon: ArrowLeftRight,
    duration: 30,
    description: 'Tasques de transferència d\'informació entre idiomes',
    parts: [
      {
        id: 'mediacio1',
        name: 'Part 1: Mediació escrita',
        instructions: 'Transferència d\'informació d\'un text en castellà a valencià',
        questions: [
          {
            id: 'mediation1',
            number: 11,
            text: 'Aquesta secció estarà disponible en la versió completa del simulador.',
            type: 'essay',
            wordLimit: 150,
            points: 10
          }
        ]
      }
    ]
  },
  {
    id: 'oral',
    name: 'Expressió Oral',
    icon: Mic,
    duration: 15,
    description: 'Conversa amb l\'examinador sobre diferents temes',
    parts: [
      {
        id: 'oral1',
        name: 'Part 1: Presentació personal',
        instructions: 'Parla sobre tu mateix, els teus interessos i la teua experiència',
        questions: [
          {
            id: 'oral1',
            number: 12,
            text: 'Aquesta secció requereix accés al micròfon i estarà disponible en la versió completa.',
            type: 'essay',
            points: 20
          }
        ]
      }
    ]
  }
];

export function ModernExamInterface({
  courseConfig,
  examId,
  userId,
  mode,
  existingSession
}: ModernExamInterfaceProps) {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [examResults, setExamResults] = useState<ExamResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showFinishConfirmation, setShowFinishConfirmation] = useState(false);

  const examConfig = courseConfig.examConfigs[examId];
  const backUrl = `/dashboard/${courseConfig.metadata.language}/${courseConfig.metadata.level}/examens`;

  // Calculate all questions across all sections
  const allQuestions = useMemo(() => {
    return mockExamData.flatMap(section =>
      section.parts.flatMap(part =>
        part.questions.map(question => ({
          ...question,
          sectionId: section.id,
          sectionName: section.name,
          partId: part.id,
          partName: part.name,
          partText: part.text,
          partInstructions: part.instructions
        }))
      )
    );
  }, []);

  const totalQuestions = allQuestions.length;
  const currentQuestionData = allQuestions[session?.currentQuestion || 0];

  // Get current section data
  const currentSectionData = mockExamData.find(section => 
    section.id === (session?.currentSection || 'comprensio')
  );

  // Calculate progress
  const answeredQuestions = session ? Object.keys(session.answers).length : 0;
  const progressPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Timer formatting
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Initialize session
  useEffect(() => {
    const initializeSession = () => {
      if (existingSession) {
        setSession({
          id: existingSession.id,
          status: existingSession.status,
          startedAt: new Date(existingSession.started_at),
          timeRemaining: existingSession.time_remaining || 150 * 60, // 2.5 hours
          currentQuestion: existingSession.current_question || 0,
          currentSection: existingSession.current_section || 'comprensio',
          answers: existingSession.answers || {}
        });
      } else {
        const newSession: ExamSession = {
          id: `session_${Date.now()}`,
          status: 'in_progress',
          startedAt: new Date(),
          timeRemaining: 150 * 60, // 2.5 hours
          currentQuestion: 0,
          currentSection: 'comprensio',
          answers: {}
        };
        setSession(newSession);
      }
      setIsLoading(false);
    };

    initializeSession();
  }, [existingSession]);

  // Timer countdown
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;

    const timer = setInterval(() => {
      setSession(prev => {
        if (!prev || prev.timeRemaining <= 0) {
          return prev;
        }
        const newTimeRemaining = prev.timeRemaining - 1;
        if (newTimeRemaining === 0) {
          // Auto-submit when time runs out
          handleFinishExam();
        }
        return { ...prev, timeRemaining: newTimeRemaining };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.status]);

  // Event handlers
  const handleAnswerSelect = async (questionId: string, answer: any) => {
    if (!session) return;

    const newAnswers = { ...session.answers, [questionId]: answer };
    setSession(prev => prev ? { ...prev, answers: newAnswers } : null);

    // Auto-save with visual feedback
    setAutoSaveStatus('saving');
    
    try {
      // Simulate API call with localStorage save for better UX
      localStorage.setItem(`exam_session_${session.id}`, JSON.stringify({
        ...session,
        answers: newAnswers,
        lastSaved: new Date().toISOString()
      }));
      await new Promise(resolve => setTimeout(resolve, 800));
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 3000);
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Error saving answer:', error);
      setTimeout(() => setAutoSaveStatus(null), 5000);
    }
  };

  const navigateToQuestion = (questionIndex: number) => {
    if (!session || questionIndex < 0 || questionIndex >= totalQuestions) return;
    
    const question = allQuestions[questionIndex];
    setSession(prev => prev ? {
      ...prev,
      currentQuestion: questionIndex,
      currentSection: question.sectionId
    } : null);
  };

  const navigateToSection = (sectionId: string) => {
    if (!session) return;
    
    const sectionIndex = mockExamData.findIndex(section => section.id === sectionId);
    if (sectionIndex === -1) return;

    // Find first question in this section
    const firstQuestionInSection = allQuestions.findIndex(q => q.sectionId === sectionId);
    if (firstQuestionInSection !== -1) {
      setSession(prev => prev ? {
        ...prev,
        currentSection: sectionId,
        currentQuestion: firstQuestionInSection
      } : null);
    }
  };

  const handlePauseExam = () => {
    if (!session) return;
    setSession(prev => prev ? { ...prev, status: 'paused' } : null);
  };

  const handleResumeExam = () => {
    if (!session) return;
    setSession(prev => prev ? { ...prev, status: 'in_progress' } : null);
  };

  const handleFinishExam = () => {
    if (!session) return;
    
    // Calculate results before finishing
    const results = calculateResults(session.answers);
    setExamResults(results);
    
    // Save results to localStorage
    const savedResults = {
      sessionId: session.id,
      courseId: courseConfig.metadata.language + '_' + courseConfig.metadata.level,
      examId,
      userId,
      results,
      completedAt: new Date().toISOString()
    };
    
    // Save to localStorage for persistence
    const existingResults = JSON.parse(localStorage.getItem('exam_results') || '[]');
    existingResults.push(savedResults);
    localStorage.setItem('exam_results', JSON.stringify(existingResults));
    
    // Update session status
    setSession(prev => prev ? { ...prev, status: 'completed' } : null);
    
    // Show results immediately
    setShowResults(true);
  };

  const handleSaveProgress = async () => {
    if (!session) return;
    
    setAutoSaveStatus('saving');
    try {
      // In real implementation, save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus(null), 2000);
    } catch (error) {
      setAutoSaveStatus('error');
      console.error('Error saving progress:', error);
    }
  };

  // Word count for essays
  const getWordCount = (text: string) => {
    return text ? text.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
  };

  // Correction and grading functions
  const calculateResults = (answers: Record<string, any>): ExamResults => {
    const startTime = session?.startedAt || new Date();
    const timeSpent = Math.round((Date.now() - startTime.getTime()) / 1000); // in seconds

    let totalScore = 0;
    let maxScore = 0;
    const questionResults: ExamResults['questionResults'] = [];
    const sectionResults: ExamResults['sectionResults'] = [];

    // Group questions by section for section-level scoring
    const sectionMap = new Map<string, { questions: any[], score: number, maxScore: number }>();

    allQuestions.forEach((question) => {
      maxScore += question.points;
      
      if (!sectionMap.has(question.sectionId)) {
        sectionMap.set(question.sectionId, {
          questions: [],
          score: 0,
          maxScore: 0
        });
      }
      
      const sectionData = sectionMap.get(question.sectionId)!;
      sectionData.questions.push(question);
      sectionData.maxScore += question.points;

      const userAnswer = answers[question.id];
      let isCorrect = false;
      let pointsEarned = 0;

      // Determine if answer is correct based on question type
      if (question.type === 'multiple_choice') {
        isCorrect = userAnswer === question.correctAnswer;
        pointsEarned = isCorrect ? question.points : 0;
      } else if (question.type === 'text_input') {
        if (userAnswer && question.correctAnswer) {
          // Case-insensitive comparison for text inputs
          const normalizedUserAnswer = userAnswer.toString().toLowerCase().trim();
          const normalizedCorrectAnswer = question.correctAnswer.toString().toLowerCase().trim();
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
          pointsEarned = isCorrect ? question.points : 0;
        }
      } else if (question.type === 'essay') {
        // For essays, award points based on word count and completion
        const wordCount = getWordCount(userAnswer || '');
        if (wordCount >= 150) { // Minimum words for essay
          if (question.wordLimit && wordCount >= 200 && wordCount <= question.wordLimit) {
            pointsEarned = Math.round(question.points * 0.9); // 90% for good word count
          } else if (wordCount >= 180) {
            pointsEarned = Math.round(question.points * 0.7); // 70% for acceptable
          } else {
            pointsEarned = Math.round(question.points * 0.5); // 50% for minimum
          }
          isCorrect = pointsEarned > 0;
        }
      }

      totalScore += pointsEarned;
      sectionData.score += pointsEarned;

      questionResults.push({
        questionId: question.id,
        questionNumber: question.number,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: pointsEarned,
        maxPoints: question.points
      });
    });

    // Calculate section results
    sectionMap.forEach((sectionData, sectionId) => {
      const section = mockExamData.find(s => s.id === sectionId);
      if (section) {
        sectionResults.push({
          sectionId,
          sectionName: section.name,
          score: sectionData.score,
          maxScore: sectionData.maxScore,
          percentage: sectionData.maxScore > 0 ? Math.round((sectionData.score / sectionData.maxScore) * 100) : 0
        });
      }
    });

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    // Determine grade based on percentage
    let grade: string;
    if (percentage >= 90) {
      grade = 'Excel·lent';
    } else if (percentage >= 80) {
      grade = 'Notable';
    } else if (percentage >= 70) {
      grade = 'Bé';
    } else if (percentage >= 50) {
      grade = 'Aprovat';
    } else {
      grade = 'Suspès';
    }

    return {
      totalScore,
      maxScore,
      percentage,
      grade,
      sectionResults,
      questionResults,
      timeSpent,
      completedAt: new Date()
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">Carregant examen...</h2>
            <p className="text-muted-foreground">Preparant el simulador per a tu</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="h-5 w-5 mr-2" />
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
    <div className="min-h-screen bg-background">
      {/* Modern Header */}
      <header className="bg-background border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and exam info */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href={backUrl}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Link>
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="hidden md:block">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-semibold">
                      Examen C1 Valencià
                    </h1>
                  </div>
                  <Badge variant={mode === 'exam' ? 'default' : 'secondary'}>
                    {mode === 'exam' ? 'Examen' : 'Pràctica'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  CIEACOVA 2025 • Pregunta {(session.currentQuestion || 0) + 1} de {totalQuestions}
                </div>
              </div>
            </div>

            {/* Right side - Timer and controls */}
            <div className="flex items-center space-x-4">
              {/* Enhanced auto-save status with animation */}
              <div className="hidden sm:block">
                {autoSaveStatus && (
                  <div className={`flex items-center space-x-2 text-sm px-3 py-2 rounded-lg border transition-all duration-500 ${
                    autoSaveStatus === 'saving' 
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : autoSaveStatus === 'saved'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    {autoSaveStatus === 'saving' && (
                      <>
                        <Save className="h-4 w-4 animate-spin" />
                        <span className="font-medium">Desant...</span>
                      </>
                    )}
                    {autoSaveStatus === 'saved' && (
                      <>
                        <Check className="h-4 w-4 animate-bounce" />
                        <span className="font-medium">Desat</span>
                      </>
                    )}
                    {autoSaveStatus === 'error' && (
                      <>
                        <AlertTriangle className="h-4 w-4 animate-pulse" />
                        <span className="font-medium">Error al desar</span>
                      </>
                    )}
                  </div>
                )}
                {!autoSaveStatus && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground px-3 py-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Desat automàticament</span>
                  </div>
                )}
              </div>

              {/* Timer with enhanced styling */}
              <div className={`flex items-center space-x-2 border rounded-lg px-4 py-3 transition-all duration-300 ${
                session.timeRemaining < 300 
                  ? 'bg-red-50 border-red-200 shadow-md animate-pulse' 
                  : session.timeRemaining < 900
                    ? 'bg-amber-50 border-amber-200 shadow-sm'
                    : 'bg-card border-border shadow-sm'
              }`}>
                <Timer className={`h-5 w-5 transition-colors duration-300 ${
                  session.timeRemaining < 300 
                    ? 'text-red-600' 
                    : session.timeRemaining < 900
                      ? 'text-amber-600'
                      : 'text-muted-foreground'
                }`} />
                <span className={`font-mono text-lg font-bold tracking-wider transition-colors duration-300 ${
                  session.timeRemaining < 300 
                    ? 'text-red-700' 
                    : session.timeRemaining < 900
                      ? 'text-amber-700'
                      : 'text-foreground'
                }`}>
                  {formatTime(session.timeRemaining)}
                </span>
                {session.timeRemaining < 300 && (
                  <Badge variant="destructive" className="ml-2 animate-pulse">
                    Urgent!
                  </Badge>
                )}
              </div>

              {/* Control buttons */}
              <div className="flex items-center space-x-2">
                {session.status === 'in_progress' ? (
                  <>
                    <Button variant="outline" size="sm" onClick={handlePauseExam}>
                      <Pause className="h-4 w-4 mr-2" />
                      Pausar
                    </Button>
                    <Button size="sm" onClick={() => setShowFinishConfirmation(true)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalitzar
                    </Button>
                  </>
                ) : session.status === 'paused' ? (
                  <Button size="sm" onClick={handleResumeExam}>
                    <Play className="h-4 w-4 mr-2" />
                    Continuar
                  </Button>
                ) : (
                  <Badge variant="secondary">Completat</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Mobile exam title */}
          <div className="md:hidden pb-3 border-t mt-4 pt-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-base font-semibold">Examen C1 Valencià</h1>
                <div className="text-sm text-muted-foreground">
                  Pregunta {(session.currentQuestion || 0) + 1} de {totalQuestions}
                </div>
              </div>
              <Badge variant={mode === 'exam' ? 'default' : 'secondary'}>
                {mode === 'exam' ? 'Examen' : 'Pràctica'}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Section Navigation Tabs */}
            <Card>
              <CardContent className="p-0">
                <Tabs 
                  value={session.currentSection} 
                  onValueChange={navigateToSection}
                  className="w-full"
                >
                  <div className="border-b p-4">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                      {mockExamData.map((section) => {
                        const Icon = section.icon;
                        const sectionQuestions = allQuestions.filter(q => q.sectionId === section.id);
                        const sectionAnswered = sectionQuestions.filter(q => session.answers[q.id]).length;
                        
                        return (
                          <TabsTrigger 
                            key={section.id} 
                            value={section.id}
                            className="flex flex-col items-center space-y-1 h-auto py-3"
                          >
                            <div className="flex items-center space-x-2">
                              <Icon className="h-4 w-4" />
                              <span className="hidden sm:inline text-xs font-medium">
                                {section.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs">
                              <span>{section.duration}m</span>
                              <span className="text-muted-foreground">•</span>
                              <span className={sectionAnswered === sectionQuestions.length ? 'text-green-600' : 'text-muted-foreground'}>
                                {sectionAnswered}/{sectionQuestions.length}
                              </span>
                            </div>
                          </TabsTrigger>
                        );
                      })}
                    </TabsList>
                  </div>
                  
                  <div className="p-6">
                    {currentSectionData && (
                      <div className="mb-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <currentSectionData.icon className="h-6 w-6 text-primary" />
                          <h2 className="text-xl font-semibold">{currentSectionData.name}</h2>
                        </div>
                        <p className="text-muted-foreground">{currentSectionData.description}</p>
                      </div>
                    )}

                    {/* Question Content */}
                    {currentQuestionData ? (
                      <div className="space-y-6">
                        {/* Reading passage if available */}
                        {currentQuestionData.partText && (
                          <Card className="bg-muted/50">
                            <CardHeader>
                              <CardTitle className="text-lg">
                                {currentQuestionData.partText.title}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="prose prose-sm max-w-none">
                                <p className="whitespace-pre-line text-sm leading-relaxed">
                                  {currentQuestionData.partText.content}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Instructions */}
                        {currentQuestionData.partInstructions && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-blue-800 text-sm">
                              <strong>Instruccions:</strong> {currentQuestionData.partInstructions}
                            </p>
                          </div>
                        )}

                        {/* Enhanced Question Card */}
                        <Card className="border-2 shadow-lg hover:shadow-xl transition-shadow duration-300">
                          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                            <CardTitle className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                                  {currentQuestionData.number}
                                </div>
                                <span className="text-lg font-semibold">Pregunta {currentQuestionData.number}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {session.answers[currentQuestionData.id] && (
                                  <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 animate-scale-in">
                                    <Check className="h-3 w-3 mr-1" />
                                    Resposta
                                  </Badge>
                                )}
                                <Badge variant="outline" className="font-medium">
                                  {currentQuestionData.points} punt{currentQuestionData.points !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <p className="text-base leading-relaxed">
                              {currentQuestionData.text}
                            </p>

                            {/* Multiple Choice Options */}
                            {currentQuestionData.type === 'multiple_choice' && currentQuestionData.options && (
                              <div className="space-y-3">
                                {currentQuestionData.options.map((option) => (
                                  <label
                                    key={option.value}
                                    className={`
                                      group flex items-start p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-md
                                      ${session.answers[currentQuestionData.id] === option.value
                                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30 shadow-lg transform scale-[1.02]'
                                        : 'border-border hover:border-primary/60 hover:bg-muted/70 hover:scale-[1.01]'
                                      }
                                    `}
                                  >
                                    <input
                                      type="radio"
                                      name={`question_${currentQuestionData.id}`}
                                      value={option.value}
                                      checked={session.answers[currentQuestionData.id] === option.value}
                                      onChange={(e) => handleAnswerSelect(currentQuestionData.id, e.target.value)}
                                      className="mt-1 mr-4 h-4 w-4 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center">
                                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-sm font-bold mr-3 transition-all ${
                                          session.answers[currentQuestionData.id] === option.value
                                            ? 'bg-primary text-primary-foreground shadow-md'
                                            : 'bg-muted text-muted-foreground group-hover:bg-primary/20'
                                        }`}>
                                          {option.value}
                                        </span>
                                        <span className={`text-base transition-colors ${
                                          session.answers[currentQuestionData.id] === option.value
                                            ? 'text-foreground font-medium'
                                            : 'text-foreground group-hover:text-foreground'
                                        }`}>
                                          {option.text}
                                        </span>
                                      </div>
                                    </div>
                                    {session.answers[currentQuestionData.id] === option.value && (
                                      <Check className="h-5 w-5 text-primary animate-scale-in ml-2" />
                                    )}
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* Enhanced Text Input for Open Questions */}
                            {currentQuestionData.type === 'text_input' && (
                              <div className="space-y-3">
                                <div className="relative">
                                  <Input
                                    placeholder="Introdueix la teua resposta..."
                                    value={session.answers[currentQuestionData.id] || ''}
                                    onChange={(e) => handleAnswerSelect(currentQuestionData.id, e.target.value)}
                                    className="text-base py-3 px-4 border-2 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                                  />
                                  {session.answers[currentQuestionData.id] && (
                                    <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500 animate-scale-in" />
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground px-1">
                                  💡 Consell: Revisa l'ortografia i la gramàtica abans de continuar
                                </div>
                              </div>
                            )}

                            {/* Essay Text Area */}
                            {currentQuestionData.type === 'essay' && (
                              <div className="space-y-3">
                                <Textarea
                                  placeholder="Escriu la teua resposta aquí..."
                                  value={session.answers[currentQuestionData.id] || ''}
                                  onChange={(e) => handleAnswerSelect(currentQuestionData.id, e.target.value)}
                                  className="min-h-[300px] text-base leading-relaxed"
                                />
                                
                                {currentQuestionData.wordLimit && (
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">
                                      Paraules: {getWordCount(session.answers[currentQuestionData.id] || '')}
                                      {' / '}{currentQuestionData.wordLimit}
                                    </span>
                                    <span className={
                                      getWordCount(session.answers[currentQuestionData.id] || '') > currentQuestionData.wordLimit
                                        ? 'text-red-500 font-medium'
                                        : 'text-muted-foreground'
                                    }>
                                      {currentQuestionData.wordLimit - getWordCount(session.answers[currentQuestionData.id] || '')} paraules restants
                                    </span>
                                  </div>
                                )}

                                {currentQuestionData.wordLimit && (
                                  <Progress 
                                    value={Math.min((getWordCount(session.answers[currentQuestionData.id] || '') / currentQuestionData.wordLimit) * 100, 100)}
                                    className="h-2"
                                  />
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Navigation buttons */}
                        <div className="flex items-center justify-between pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => navigateToQuestion((session.currentQuestion || 0) - 1)}
                            disabled={(session.currentQuestion || 0) === 0}
                          >
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Anterior
                          </Button>
                          
                          <span className="text-sm text-muted-foreground font-medium">
                            {(session.currentQuestion || 0) + 1} de {totalQuestions}
                          </span>
                          
                          <Button 
                            onClick={() => navigateToQuestion((session.currentQuestion || 0) + 1)}
                            disabled={(session.currentQuestion || 0) === totalQuestions - 1}
                          >
                            Següent
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No hi ha preguntes disponibles</h3>
                        <p className="text-muted-foreground">
                          Aquesta secció estarà disponible properament.
                        </p>
                      </div>
                    )}
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-primary" />
                  Progrés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completat</span>
                    <span className="font-medium">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {answeredQuestions} de {totalQuestions} preguntes respostes
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Per seccions:</h4>
                  {mockExamData.map((section) => {
                    const sectionQuestions = allQuestions.filter(q => q.sectionId === section.id);
                    const sectionAnswered = sectionQuestions.filter(q => session.answers[q.id]).length;
                    const sectionPercentage = sectionQuestions.length > 0 
                      ? Math.round((sectionAnswered / sectionQuestions.length) * 100) 
                      : 0;
                    
                    return (
                      <div key={section.id} className="flex items-center justify-between text-xs">
                        <span className="flex items-center">
                          <section.icon className="h-3 w-3 mr-1" />
                          {section.name}
                        </span>
                        <span className={sectionPercentage === 100 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                          {sectionAnswered}/{sectionQuestions.length}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSaveProgress}
                  className="w-full"
                  disabled={autoSaveStatus === 'saving'}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Progrés
                </Button>
              </CardContent>
            </Card>

            {/* Question Navigator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Navegador de Preguntes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {allQuestions.map((question, index) => {
                    const isAnswered = session.answers[question.id] !== undefined;
                    const isCurrent = index === session.currentQuestion;
                    
                    return (
                      <button
                        key={question.id}
                        onClick={() => navigateToQuestion(index)}
                        className={`
                          h-10 w-10 rounded-md text-sm font-medium transition-colors relative
                          ${isCurrent 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : isAnswered 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-200'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                          }
                        `}
                      >
                        {index + 1}
                        {isAnswered && !isCurrent && (
                          <Check className="h-3 w-3 absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-primary rounded-sm"></div>
                    <span>Pregunta actual</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-green-100 border border-green-200 rounded-sm relative">
                      <Check className="h-2 w-2 absolute top-0.5 right-0 text-green-500" />
                    </div>
                    <span>Resposta desada</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-muted border border-border rounded-sm"></div>
                    <span>Sense respondre</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ajuda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span><strong>Navegació:</strong> Usa les fletxes ← → per moure't entre preguntes</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span><strong>Autodesat:</strong> Les teues respostes es desen automàticament</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="h-2 w-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span><strong>Temps:</strong> El cronòmetre canvia de color quan queda poc temps</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showFinishConfirmation} onOpenChange={setShowFinishConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Finalitzar Examen?
            </DialogTitle>
            <DialogDescription>
              Estàs segur que vols finalitzar l'examen? Aquesta acció no es pot desfer i es calcularan els resultats automàticament.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowFinishConfirmation(false)} className="flex-1">
              Cancel·lar
            </Button>
            <Button onClick={handleFinishExam} className="flex-1">
              Sí, Finalitzar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <CheckCircle className="h-6 w-6 mr-2 text-green-500" />
              Resultats de l'Examen
            </DialogTitle>
            <DialogDescription>
              {examResults && `Has obtingut ${examResults.totalScore} de ${examResults.maxScore} punts (${examResults.percentage}%)`}
            </DialogDescription>
          </DialogHeader>

          {examResults && (
            <div className="space-y-6 mt-4">
              {/* Overall Score */}
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border">
                <div className="text-4xl font-bold mb-2">
                  {examResults.percentage}%
                </div>
                <div className={`text-xl font-semibold mb-2 ${
                  examResults.percentage >= 70 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {examResults.grade}
                </div>
                <div className="text-sm text-muted-foreground">
                  {examResults.totalScore} / {examResults.maxScore} punts
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Temps emprat: {Math.floor(examResults.timeSpent / 60)}:{(examResults.timeSpent % 60).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Section Results */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Resultats per Secció</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {examResults.sectionResults.map((section) => (
                    <Card key={section.sectionId}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{section.sectionName}</h4>
                          <Badge variant={section.percentage >= 70 ? "default" : "destructive"}>
                            {section.percentage}%
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {section.score} / {section.maxScore} punts
                        </div>
                        <Progress value={section.percentage} className="h-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Question Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Detall de Preguntes</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {examResults.questionResults.map((question) => {
                    const questionData = allQuestions.find(q => q.id === question.questionId);
                    return (
                      <div 
                        key={question.questionId}
                        className={`p-3 rounded-lg border-l-4 ${
                          question.isCorrect ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            Pregunta {question.questionNumber}
                          </span>
                          <div className="flex items-center space-x-2">
                            {question.isCorrect ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                            <span className={`text-sm ${
                              question.isCorrect ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {question.points}/{question.maxPoints} punts
                            </span>
                          </div>
                        </div>
                        
                        {questionData && (
                          <>
                            <div className="text-sm mb-2">
                              <strong>La teua resposta:</strong> {question.userAnswer || 'Sense respondre'}
                            </div>
                            {question.correctAnswer && (
                              <div className="text-sm mb-2">
                                <strong>Resposta correcta:</strong> {question.correctAnswer}
                              </div>
                            )}
                            {questionData.explanation && !question.isCorrect && (
                              <div className="text-sm text-muted-foreground italic">
                                {questionData.explanation}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => window.print()} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Imprimir Resultats
                </Button>
                <Button variant="outline" onClick={() => {
                  // Create new session for retake
                  setExamResults(null);
                  setShowResults(false);
                  setSession({
                    id: `session_${Date.now()}`,
                    status: 'in_progress',
                    startedAt: new Date(),
                    timeRemaining: 150 * 60,
                    currentQuestion: 0,
                    currentSection: 'comprensio',
                    answers: {}
                  });
                }} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Repetir Examen
                </Button>
                <Button asChild className="flex-1">
                  <Link href={backUrl}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tornar als Exàmens
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}