// Tipos para configuración de exámenes basados en el análisis de simuladores existentes

export type QuestionType = 
  | 'multiple_choice'
  | 'gap_fill' 
  | 'essay'
  | 'listening_multiple'
  | 'speaking_response'
  | 'mediation'
  | 'reading_comprehension';

export type ExamProvider = 
  | 'cambridge'
  | 'eoi_andalucia'
  | 'eoi_valencia'
  | 'eoi_baleares'
  | 'cieacova'
  | 'alliance_francaise'
  | 'goethe';

export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ExamLanguage = 'english' | 'valenciano' | 'catalan' | 'spanish' | 'french' | 'german';

export interface ExamQuestion {
  id: string;
  number: number;
  type: QuestionType;
  points: number;
  text?: string;
  options?: { value: string; text: string }[];
  correctAnswer?: string | string[];
  audioFile?: string;
  maxWords?: number;
  timeLimit?: number;
  rubric?: ScoringRubric;
  culturalContext?: string[];
}

export interface ExamPart {
  partId: string;
  name: string;
  instructions: string;
  questionType: QuestionType;
  questionCount: number;
  timeLimit?: number;
  text?: {
    title: string;
    content: string;
  };
  audioFile?: string;
  questions: ExamQuestion[];
}

export interface ExamSection {
  id: string;
  name: string;
  duration: number; // minutes
  icon: string;
  parts: ExamPart[];
}

export interface ExamMetadata {
  title: string;
  institution: string;
  provider: ExamProvider;
  language: ExamLanguage;
  level: LanguageLevel;
  year: number;
  version?: string;
  officialExam: boolean;
  duration: number; // total minutes
  totalQuestions: number;
  passingScore: number;
  maxScore: number;
  description?: string;
  culturalContext?: string;
}

export interface ScoringWeights {
  [sectionId: string]: number;
}

export interface ScoringRubric {
  criteria: {
    [criteriaId: string]: {
      weight: number;
      description: string;
      bands?: {
        [band: string]: string;
      };
    };
  };
  totalPoints: number;
  passingThreshold: number;
}

export interface ExamConfiguration {
  examId: string;
  metadata: ExamMetadata;
  sections: ExamSection[];
  scoring: {
    passingScore: number;
    maxScore: number;
    weightings: ScoringWeights;
    rubrics: {
      [questionType: string]: ScoringRubric;
    };
  };
  messages: {
    [key: string]: string;
  };
  settings: {
    allowPause: boolean;
    showTimer: boolean;
    showProgress: boolean;
    autoSave: boolean;
    autoSaveInterval: number; // seconds
    warnings: {
      timeRemaining: number; // minutes
      message: string;
    }[];
  };
}