// =============================================
// EXAM SYSTEM TYPES
// =============================================
// TypeScript types for the comprehensive exam content management system

export type Language = 'english' | 'valenciano' | 'spanish' | 'french' | 'german' | 'italian' | 'portuguese';
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type Provider = 'cambridge' | 'eoi' | 'cieacova' | 'jqcv' | 'dele' | 'delf' | 'goethe';
export type Skill = 'reading' | 'writing' | 'listening' | 'speaking' | 'use_of_english' | 'mediation' | 'integrated';
export type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'open_ended'
  | 'drag_drop'
  | 'matching'
  | 'essay'
  | 'speaking_task'
  | 'listening_comprehension';

export type ExamMode = 'practice' | 'mock_exam' | 'diagnostic' | 'timed_practice';
export type ImportType = 'full_import' | 'incremental' | 'single_exam';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
export type ConfigType = 'system' | 'ui' | 'scoring' | 'import';

// =============================================
// EXAM TEMPLATE TYPES
// =============================================

export interface ExamTemplate {
  id: string;

  // Basic identification
  language: Language;
  level: Level;
  provider: Provider;
  skill: Skill;

  // Template metadata
  name: string;
  description?: string;
  difficulty_level: DifficultyLevel;
  estimated_duration: number; // minutes
  total_questions?: number;
  max_score?: number;

  // Official source files
  official_source_path?: string;
  pdf_path?: string;
  audio_paths: string[];
  html_simulator_path?: string;

  // Exam structure
  structure: ExamStructure;
  sections: ExamSection[];
  scoring_criteria: ScoringCriteria;
  instructions: ExamInstructions;

  // Configuration
  is_active: boolean;
  is_published: boolean;
  version: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface ExamStructure {
  title: string;
  description?: string;
  total_duration: number; // minutes
  sections: string[];
  timing_rules: TimingRules;
  navigation_rules: NavigationRules;
  scoring_method: string;
}

export interface ExamSection {
  id: string;
  name: string;
  description?: string;
  duration: number; // minutes
  instructions: string;
  parts: ExamPart[];
  timing_strict: boolean;
  allow_review: boolean;
}

export interface ExamPart {
  id: string;
  name: string;
  description?: string;
  instructions: string;
  question_count: number;
  points_per_question: number;
  question_types: QuestionType[];
}

export interface TimingRules {
  strict_timing: boolean;
  warning_time: number; // minutes before end
  auto_submit: boolean;
  section_breaks: boolean;
  break_duration?: number; // minutes
}

export interface NavigationRules {
  allow_back: boolean;
  allow_skip: boolean;
  allow_flag: boolean;
  allow_review: boolean;
  show_progress: boolean;
}

export interface ScoringCriteria {
  passing_score: number; // percentage
  partial_credit: boolean;
  negative_marking: boolean;
  section_weights: Record<string, number>;
  skill_weights?: Record<string, number>;
}

export interface ExamInstructions {
  general: string;
  sections: Record<string, string>;
  technical: string[];
  warnings: string[];
}

// =============================================
// EXAM CONTENT TYPES
// =============================================

export interface ExamContent {
  id: string;
  template_id: string;

  // Question organization
  section_id: string;
  part_id: string;
  question_number: number;
  sub_question?: string;

  // Question data
  question_type: QuestionType;
  question_text?: string;
  question_data: QuestionData;

  // Answer information
  correct_answer?: any;
  answer_options: AnswerOption[];
  answer_explanation?: string;

  // Media and resources
  media_urls: MediaUrls;
  attachments: Attachment[];

  // Scoring
  points: number;
  scoring_rubric: ScoringRubric;

  // Metadata
  difficulty_tags: string[];
  topic_tags: string[];
  skills_tested: string[];

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface QuestionData {
  type: QuestionType;
  text?: string;
  prompt?: string;
  context?: string;
  stimulus?: string;
  options?: AnswerOption[];
  blanks?: BlankField[];
  matches?: MatchPair[];
  criteria?: string[];
  [key: string]: any; // Allow additional type-specific fields
}

export interface AnswerOption {
  id: string;
  text: string;
  is_correct?: boolean;
  explanation?: string;
  order: number;
}

export interface BlankField {
  id: string;
  position: number;
  correct_answers: string[];
  case_sensitive: boolean;
  partial_credit: boolean;
}

export interface MatchPair {
  left_id: string;
  left_text: string;
  right_id: string;
  right_text: string;
  correct_match: string;
}

export interface MediaUrls {
  images?: string[];
  audio?: string[];
  video?: string[];
  documents?: string[];
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
}

export interface ScoringRubric {
  criteria: RubricCriterion[];
  total_points: number;
  grading_scale: GradingScale;
}

export interface RubricCriterion {
  name: string;
  description: string;
  max_points: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  points: number;
  description: string;
  keywords: string[];
}

export interface GradingScale {
  levels: GradeLevel[];
  pass_threshold: number;
}

export interface GradeLevel {
  grade: string;
  min_percentage: number;
  max_percentage: number;
  description: string;
}

// =============================================
// EXAM ATTEMPT TYPES
// =============================================

export interface UserExamAttempt {
  id: string;
  user_id: string;
  template_id: string;

  // Attempt details
  attempt_number: number;
  exam_mode: ExamMode;

  // Timing
  started_at: string;
  completed_at?: string;
  total_duration_seconds?: number;
  time_per_section: Record<string, number>;

  // Results
  total_score?: number;
  max_possible_score?: number;
  percentage_score?: number;
  section_scores: Record<string, number>;
  detailed_results: DetailedResults;

  // User responses
  user_answers: Record<string, UserAnswer>;
  flagged_questions: string[];

  // AI feedback
  ai_feedback?: string;
  improvement_areas: string[];
  strengths: string[];
  recommended_study_plan: StudyPlan;

  // Status
  is_completed: boolean;
  is_graded: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UserAnswer {
  question_id: string;
  answer: any;
  answer_text?: string;
  time_spent: number; // seconds
  attempts: number;
  is_final: boolean;
  score?: number;
  feedback?: string;
}

export interface DetailedResults {
  section_breakdown: SectionResult[];
  skill_breakdown: SkillResult[];
  question_analysis: QuestionAnalysis[];
  time_analysis: TimeAnalysis;
  difficulty_analysis: DifficultyAnalysis;
}

export interface SectionResult {
  section_id: string;
  section_name: string;
  score: number;
  max_score: number;
  percentage: number;
  time_spent: number;
  questions_correct: number;
  questions_total: number;
}

export interface SkillResult {
  skill: string;
  score: number;
  max_score: number;
  percentage: number;
  strength_level: 'weak' | 'developing' | 'proficient' | 'strong';
}

export interface QuestionAnalysis {
  question_id: string;
  is_correct: boolean;
  points_earned: number;
  points_possible: number;
  time_spent: number;
  difficulty_level: string;
  topics: string[];
}

export interface TimeAnalysis {
  total_time: number;
  average_per_question: number;
  sections_over_time: string[];
  sections_under_time: string[];
  time_efficiency: number; // percentage
}

export interface DifficultyAnalysis {
  basic_correct: number;
  basic_total: number;
  intermediate_correct: number;
  intermediate_total: number;
  advanced_correct: number;
  advanced_total: number;
}

export interface StudyPlan {
  focus_areas: FocusArea[];
  recommended_duration: number; // hours
  priority_topics: string[];
  suggested_resources: Resource[];
}

export interface FocusArea {
  skill: string;
  current_level: number; // 1-10
  target_level: number; // 1-10
  estimated_hours: number;
  activities: string[];
}

export interface Resource {
  type: 'practice' | 'study' | 'video' | 'article';
  title: string;
  description: string;
  url?: string;
  difficulty: DifficultyLevel;
}

// =============================================
// CONFIGURATION TYPES
// =============================================

export interface ExamConfiguration {
  id: string;
  config_key: string;
  config_value: any;
  config_type: ConfigType;
  description?: string;
  updated_by?: string;
  updated_at: string;
  created_at: string;
}

export interface ExamImportLog {
  id: string;
  import_type: ImportType;
  source_path: string;
  status: ImportStatus;

  // Import details
  templates_imported: number;
  content_imported: number;
  errors_count: number;

  // Results
  import_summary: ImportSummary;
  error_details: ImportError[];

  // Management
  initiated_by?: string;
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface ImportSummary {
  total_files_processed: number;
  successful_imports: number;
  failed_imports: number;
  skipped_imports: number;
  processing_time: number; // seconds
  file_types: Record<string, number>;
}

export interface ImportError {
  file_path: string;
  error_type: string;
  error_message: string;
  line_number?: number;
  context?: string;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ExamSearchFilters {
  language?: Language;
  level?: Level;
  provider?: Provider;
  skill?: Skill;
  difficulty?: DifficultyLevel;
  search?: string;
  is_published?: boolean;
  is_active?: boolean;
}

export interface ExamSearchResults {
  templates: ExamTemplate[];
  total: number;
  filters_applied: ExamSearchFilters;
  suggestions?: string[];
}

// =============================================
// FORM TYPES
// =============================================

export interface CreateExamTemplateForm {
  language: Language;
  level: Level;
  provider: Provider;
  skill: Skill;
  name: string;
  description?: string;
  difficulty_level: DifficultyLevel;
  estimated_duration: number;
  official_source_path?: string;
  pdf_path?: string;
  audio_paths?: string[];
  html_simulator_path?: string;
}

export interface UpdateExamTemplateForm extends Partial<CreateExamTemplateForm> {
  id: string;
  is_active?: boolean;
  is_published?: boolean;
  version?: string;
}

export interface CreateExamContentForm {
  template_id: string;
  section_id: string;
  part_id: string;
  question_number: number;
  sub_question?: string;
  question_type: QuestionType;
  question_text?: string;
  question_data: QuestionData;
  correct_answer?: any;
  answer_options?: AnswerOption[];
  answer_explanation?: string;
  points?: number;
  difficulty_tags?: string[];
  topic_tags?: string[];
  skills_tested?: string[];
}

export interface UpdateExamContentForm extends Partial<CreateExamContentForm> {
  id: string;
}

// =============================================
// UTILITY TYPES
// =============================================

export type ExamTemplateWithContent = ExamTemplate & {
  content: ExamContent[];
  content_count: number;
};

export type ExamAttemptWithTemplate = UserExamAttempt & {
  template: ExamTemplate;
};

export type ExamContentWithTemplate = ExamContent & {
  template: Pick<ExamTemplate, 'id' | 'name' | 'language' | 'level' | 'provider' | 'skill'>;
};

// =============================================
// COMPONENT PROPS TYPES
// =============================================

export interface ExamSimulatorProps {
  template: ExamTemplate;
  content: ExamContent[];
  onComplete: (attempt: UserExamAttempt) => void;
  onSave: (answers: Record<string, UserAnswer>) => void;
  mode: ExamMode;
  userId: string;
}

export interface ExamNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: number[];
  flaggedQuestions: string[];
  onNavigate: (questionNumber: number) => void;
  onFlag: (questionId: string) => void;
  allowReview: boolean;
}

export interface QuestionRendererProps {
  content: ExamContent;
  userAnswer?: UserAnswer;
  onAnswer: (answer: any) => void;
  showFeedback: boolean;
  readonly: boolean;
  timeLimit?: number;
}

// =============================================
// HOOKS TYPES
// =============================================

export interface UseExamTimerOptions {
  duration: number; // seconds
  onTimeUp: () => void;
  onWarning?: (timeLeft: number) => void;
  warningTime?: number; // seconds
}

export interface UseExamTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  addTime: (seconds: number) => void;
}

export interface UseExamStateOptions {
  template: ExamTemplate;
  content: ExamContent[];
  mode: ExamMode;
  userId: string;
}

export interface UseExamStateReturn {
  currentQuestion: number;
  answers: Record<string, UserAnswer>;
  flaggedQuestions: string[];
  isCompleted: boolean;
  timeSpent: Record<string, number>;
  navigate: (questionNumber: number) => void;
  answer: (questionId: string, answer: any) => void;
  flag: (questionId: string) => void;
  submit: () => Promise<UserExamAttempt>;
  save: () => Promise<void>;
}