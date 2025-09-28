/**
 * Exam Engine Type Definitions
 * Neolingus Academy - Course-Centric Architecture
 *
 * TypeScript definitions for the modular exam engine supporting
 * multiple certifications (EOI, JQCV, DELF, Goethe, CILS)
 */

// =============================================
// CORE CERTIFICATION TYPES
// =============================================

export type Language =
  | "english"
  | "valenciano"
  | "french"
  | "german"
  | "italian";
export type Level = "a1" | "a2" | "b1" | "b2" | "c1" | "c2";
export type CertificationType = "eoi" | "jqcv" | "delf" | "goethe" | "cils";
export type Component = "reading" | "writing" | "listening" | "speaking";
export type SessionType = "practice" | "mock_exam" | "diagnostic";

// =============================================
// CERTIFICATION MODULE INTERFACES
// =============================================

export interface CertificationModule {
  id: string;
  name: string;
  code: string;
  language: Language;
  certificationBody: string;
  officialWebsite: string;
  examStructure: ExamStructure;
  contentConfig: ContentConfig;
  complianceRequirements: ComplianceRequirements;
  isActive: boolean;
  phase: 1 | 2 | 3;
  launchDate: Date;
  version: string;
}

export interface ExamStructure {
  components: Component[];
  timing: Record<Component, number>; // minutes
  scoring: {
    scale: string; // e.g. "0-10" or "0-100"
    passThreshold: number;
    cefrAlignment: boolean;
  };
  format: {
    totalQuestions?: number;
    sectionBreaks: boolean;
    allowPause: boolean;
    strictTiming: boolean;
  };
}

export interface ContentConfig {
  questionTypes: Record<Component, QuestionType[]>;
  difficultyLevels: DifficultyLevel[];
  topicAreas: string[];
  vocabularyRange?: {
    minWords: number;
    maxWords: number;
    specializedTerms: string[];
  };
}

export interface ComplianceRequirements {
  gdprCompliant: boolean;
  lopdCompliant: boolean;
  dataRetentionDays: number;
  region: string;
  languageVariant?: string; // e.g. "valenciano" for Valencian variant
  regulatoryBody?: string;
}

// =============================================
// QUESTION AND CONTENT TYPES
// =============================================

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "matching"
  | "gap_fill"
  | "drag_drop"
  | "essay"
  | "short_answer"
  | "speaking_response"
  | "listening_comprehension"
  | "reading_comprehension";

export type DifficultyLevel =
  | "beginner"
  | "intermediate"
  | "upper_intermediate"
  | "advanced";

export interface ExamQuestion {
  id: string;
  type: QuestionType;
  component: Component;
  difficulty: DifficultyLevel;
  content: QuestionContent;
  scoring: QuestionScoring;
  metadata: QuestionMetadata;
}

export interface QuestionContent {
  prompt: string;
  instructions?: string;
  audioUrl?: string; // for listening questions
  imageUrl?: string; // for visual questions
  readingPassage?: string; // for reading comprehension
  options?: string[]; // for multiple choice
  expectedResponse?: string | string[]; // for validation
  rubric?: ScoringRubric; // for essay/speaking questions
}

export interface QuestionScoring {
  maxPoints: number;
  partialCredit: boolean;
  autoGradeable: boolean;
  timeLimit?: number; // seconds
  penalties?: {
    wrongAnswer?: number;
    timeExceeded?: number;
  };
}

export interface QuestionMetadata {
  topic: string;
  skills: string[]; // e.g. ["grammar", "vocabulary", "comprehension"]
  cefrDescriptors: string[];
  officialSource?: string;
  lastUpdated: Date;
  reviewStatus: "draft" | "reviewed" | "approved" | "deprecated";
}

// =============================================
// EXAM SESSION TYPES
// =============================================

export interface ExamSession {
  id: string;
  userId: string;
  courseId: string;
  progressId: string;
  sessionType: SessionType;
  component: Component;
  startedAt: Date;
  completedAt?: Date;
  durationSeconds: number;
  responses: ExamResponse[];
  score?: number;
  detailedScores: ComponentScores;
  aiFeedback?: string;
  improvementSuggestions: string[];
  isCompleted: boolean;
  sessionData: SessionData;
}

export interface ExamResponse {
  questionId: string;
  userAnswer: string | string[] | number;
  isCorrect?: boolean;
  partialCredit?: number;
  timeSpent: number; // seconds
  attempts: number;
  confidence?: 1 | 2 | 3 | 4 | 5; // user confidence rating
}

export interface ComponentScores {
  overall: number;
  sections: Record<string, number>;
  skills: Record<string, number>;
  rubricScores?: Record<string, number>; // for essay/speaking
}

export interface SessionData {
  examConfig: ExamConfiguration;
  startTime: Date;
  allowedTime: number; // minutes
  pausedTime?: number; // cumulative paused time in seconds
  browserInfo?: {
    userAgent: string;
    screenResolution: string;
    timezone: string;
  };
  securityFlags?: {
    tabSwitches: number;
    fullscreenExits: number;
    suspiciousActivity: string[];
  };
}

// =============================================
// EXAM CONFIGURATION
// =============================================

export interface ExamConfiguration {
  certificationModule: string;
  component: Component;
  sessionType: SessionType;
  questionCount: number;
  timeLimit: number; // minutes
  questionSelection: QuestionSelection;
  scoringMethod: ScoringMethod;
  adaptiveMode: boolean;
  allowReview: boolean;
  showProgress: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
}

export interface QuestionSelection {
  strategy: "random" | "adaptive" | "fixed_set" | "difficulty_progression";
  difficultyDistribution?: Record<DifficultyLevel, number>;
  topicDistribution?: Record<string, number>;
  excludeRecentQuestions: boolean;
  excludeRecentDays?: number;
}

export interface ScoringMethod {
  algorithm: "simple" | "weighted" | "irt" | "adaptive";
  passingScore: number;
  partialCreditEnabled: boolean;
  penaltyForGuessing: boolean;
  rubricWeights?: Record<string, number>;
}

// =============================================
// PROGRESS AND ANALYTICS
// =============================================

export interface UserProgress {
  id: string;
  userId: string;
  courseId: string;
  enrollmentDate: Date;
  lastActivity: Date;
  overallProgress: number; // 0.0 to 1.0
  componentProgress: Record<Component, number>;
  strengths: string[];
  weaknesses: string[];
  readinessScore: number; // 0.0 to 1.0
  estimatedStudyHours: number;
  targetExamDate?: Date;
  analytics: ProgressAnalytics;
}

export interface ProgressAnalytics {
  totalSessions: number;
  totalTimeSpent: number; // minutes
  averageScore: number;
  bestScore: number;
  consistencyScore: number; // measure of score stability
  improvementRate: number; // score improvement over time
  componentAnalysis: Record<Component, ComponentAnalysis>;
  learningVelocity: number; // progress per hour of study
  predictedExamScore?: number;
}

export interface ComponentAnalysis {
  sessionsCompleted: number;
  averageScore: number;
  bestScore: number;
  timeSpentMinutes: number;
  improvementTrend: "improving" | "stable" | "declining";
  skillBreakdown: Record<string, number>;
  recommendedFocus: string[];
}

// =============================================
// AI TUTORING TYPES
// =============================================

export interface AITutorSession {
  id: string;
  userId: string;
  courseId: string;
  aiSessionMetadata: {
    provider: string;
    model: string;
    conversationTokens: number;
    lastInteraction: string;
  };
  topic: string;
  startedAt: string;
  status: "active" | "completed";
  createdAt: string;
}

export interface TutorMessage {
  id: string;
  sessionId: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
}

export interface TutorResponse {
  id: string;
  content: string;
  sessionId: string;
  timestamp: string;
}

export interface AITutorContext {
  id: string;
  userId: string;
  courseId: string;
  sessionId?: string;
  contextType: "general" | "session_specific" | "weakness_focused";
  learningProfile: LearningProfile;
  interactionHistory: TutorInteraction[];
  currentContext: Record<string, unknown>; // flexible context data
  aiSessionMetadata: {
    provider: string;
    model: string;
    conversationTokens: number;
    lastInteraction: string;
    [key: string]: unknown;
  };
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface LearningProfile {
  level: Level;
  language: Language;
  certification: CertificationType;
  strengths: string[];
  weaknesses: string[];
  learningStyle: "visual" | "auditory" | "kinesthetic" | "mixed";
  preferredPace: "slow" | "normal" | "fast";
  goals: string[];
  motivationFactors: string[];
  availableStudyTime: number; // hours per week
  progressData: {
    overallProgress: number;
    componentProgress: Record<Component, number>;
    readinessScore: number;
  };
}

export interface TutorInteraction {
  id: string;
  timestamp: Date;
  type: "user_question" | "ai_response" | "feedback" | "suggestion";
  content: string;
  component?: Component;
  relatedQuestionId?: string;
  userRating?: 1 | 2 | 3 | 4 | 5;
  metadata?: Record<string, unknown>;
}

// =============================================
// CONTENT MANAGEMENT TYPES
// =============================================

export interface ContentLibrary {
  id: string;
  certificationModule: string;
  component: Component;
  level: Level;
  questions: ExamQuestion[];
  passages: ReadingPassage[];
  audioFiles: AudioFile[];
  rubrics: ScoringRubric[];
  vocabulary: VocabularyItem[];
  lastUpdated: Date;
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  source: string;
  difficulty: DifficultyLevel;
  wordCount: number;
  topics: string[];
  questions: string[]; // question IDs
  cefrLevel: Level;
}

export interface AudioFile {
  id: string;
  title: string;
  url: string;
  duration: number; // seconds
  speaker: {
    gender: "male" | "female";
    accent: string;
    nativeLanguage: string;
  };
  transcript: string;
  difficulty: DifficultyLevel;
  topics: string[];
}

export interface ScoringRubric {
  id: string;
  name: string;
  component: Component;
  type: "writing" | "speaking";
  criteria: RubricCriterion[];
  maxScore: number;
  levels: RubricLevel[];
}

export interface RubricCriterion {
  name: string;
  description: string;
  weight: number; // 0.0 to 1.0
  skills: string[];
}

export interface RubricLevel {
  level: number;
  name: string;
  description: string;
  scoreRange: [number, number];
}

export interface VocabularyItem {
  id: string;
  word: string;
  definition: string;
  partOfSpeech: string;
  difficulty: DifficultyLevel;
  frequency: number; // usage frequency
  examples: string[];
  synonyms: string[];
  antonyms: string[];
  pronunciation?: string;
  audioUrl?: string;
}

// =============================================
// ERROR AND VALIDATION TYPES
// =============================================

export interface ExamEngineError {
  code: string;
  message: string;
  component?: Component;
  sessionId?: string;
  userId?: string;
  timestamp: Date;
  stack?: string;
  metadata?: Record<string, unknown>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score?: number;
}

// =============================================
// UTILITY TYPES
// =============================================

export type ExamEvent =
  | "session_started"
  | "question_answered"
  | "session_paused"
  | "session_resumed"
  | "session_completed"
  | "time_warning"
  | "time_expired"
  | "tab_switch"
  | "fullscreen_exit";

export interface ExamEventData {
  event: ExamEvent;
  timestamp: Date;
  sessionId: string;
  userId: string;
  data?: Record<string, unknown>;
}

// Database table interfaces matching migration
export interface Database {
  public: {
    Tables: {
      certification_modules: {
        Row: CertificationModule & {
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<CertificationModule, "id"> & {
          id?: string;
        };
        Update: Partial<CertificationModule>;
      };
      courses: {
        Row: {
          id: string;
          certification_module_id: string;
          language: Language;
          level: Level;
          certification_type: CertificationType;
          title: string;
          description: string;
          components: Component[];
          assessment_rubric: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["courses"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
      };
      user_profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          preferred_language: Language;
          gdpr_consent: boolean;
          gdpr_consent_date: string | null;
          lopd_consent: boolean;
          data_retention_preference: "minimal" | "standard" | "extended";
          created_at: string;
          last_active: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["user_profiles"]["Row"],
          "created_at" | "last_active"
        >;
        Update: Partial<Database["public"]["Tables"]["user_profiles"]["Row"]>;
      };
      user_course_progress: {
        Row: UserProgress & {
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<UserProgress, "id" | "analytics"> & { id?: string };
        Update: Partial<UserProgress>;
      };
      exam_sessions: {
        Row: ExamSession & {
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<ExamSession, "id"> & { id?: string };
        Update: Partial<ExamSession>;
      };
      ai_tutor_contexts: {
        Row: AITutorContext;
        Insert: Omit<AITutorContext, "id"> & { id?: string };
        Update: Partial<AITutorContext>;
      };
      ai_tutor_sessions: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          topic: string;
          status: "active" | "completed" | "expired";
          ai_session_metadata: {
            provider: string;
            model: string;
            conversationTokens: number;
            lastInteraction: string;
            [key: string]: unknown;
          };
          created_at: string;
          updated_at: string;
          ended_at?: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ai_tutor_sessions"]["Row"],
          "id" | "created_at" | "updated_at"
        > & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_tutor_sessions"]["Row"]>;
      };
      ai_tutor_messages: {
        Row: {
          id: string;
          session_id: string;
          sender: "user" | "ai";
          content: string;
          timestamp: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["ai_tutor_messages"]["Row"],
          "id" | "timestamp"
        > & {
          id?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_tutor_messages"]["Row"]>;
      };

    };
  };
}
