// Course-specific data types for educational platform

export interface Language {
  id: string; // ISO 639-1 code: 'en', 'ca'
  name: string; // 'English', 'Valenciano'
  certification_body: "EOI" | "JQCV" | "CAMBRIDGE" | "DELE";
  cultural_context: {
    primary_color: string;
    secondary_color: string;
    font_family: string;
    ui_direction: "ltr" | "rtl";
    flag_emoji: string;
    cultural_imagery: string[];
  };
  status: "active" | "coming_soon" | "maintenance";
  supported_levels: string[];
}

export interface Level {
  id: string; // 'B2', 'C1', 'mitjà', 'superior'
  language_id: string;
  name: string; // 'Intermediate B2', 'Mitjà'
  description: string;
  cefr_equivalent: string; // Standardized CEFR level
  certification_requirements: {
    passing_score: number;
    exam_duration: number;
    skills_required: string[];
    official_preparation_hours: number;
  };
  estimated_duration: number; // Study hours
  prerequisite_level_id?: string;
}

/**
 * Core Course entity based on data model specification
 * Represents a complete course offering for a specific language, level, and certification type
 */
export interface Course {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Target language for the course */
  language: CourseLanguage;
  
  /** CEFR level or equivalent */
  level: CourseLevel;
  
  /** Type of certification this course prepares for */
  certification_type: CertificationType;
  
  /** Human-readable course title */
  title: string;
  
  /** Detailed course description */
  description: string;
  
  /** Exam components covered in this course */
  components: CourseComponent[];
  
  /** Assessment criteria and scoring rubric */
  assessment_rubric: AssessmentRubric;
  
  /** Whether the course is currently available */
  is_active: boolean;
  
  /** Course creation timestamp */
  created_at: Date;
  
  /** Last modification timestamp */
  updated_at: Date;
}

/**
 * Supported languages for courses
 */
export type CourseLanguage = 
  | "english" 
  | "valenciano" 
  | "spanish" 
  | "french" 
  | "german" 
  | "italian" 
  | "portuguese";

/**
 * CEFR levels and equivalent certifications
 */
export type CourseLevel = 
  | "a1" | "a2" 
  | "b1" | "b2" 
  | "c1" | "c2"
  | "basic" | "intermediate" | "advanced"
  | "elemental" | "mitja" | "superior";

/**
 * Certification bodies and their exam types
 */
export type CertificationType = 
  | "eoi"           // Escuela Oficial de Idiomas
  | "jqcv"          // Junta Qualificadora de Coneixements de Valencià
  | "delf"          // Diplôme d'Études en Langue Française
  | "dalf"          // Diplôme Approfondi de Langue Française
  | "goethe"        // Goethe Institut
  | "cambridge"     // Cambridge English
  | "ielts"         // International English Language Testing System
  | "toefl"         // Test of English as a Foreign Language
  | "dele"          // Diplomas de Español como Lengua Extranjera
  | "cils"          // Certificazione di Italiano come Lingua Straniera
  | "celpe";        // Certificado de Proficiência em Língua Portuguesa

/**
 * Exam components/skills that can be assessed
 */
export interface CourseComponent {
  /** Component identifier */
  id: string;
  
  /** Component name */
  name: string;
  
  /** Skill being assessed */
  skill_type: SkillType;
  
  /** Time allocated for this component (minutes) */
  duration: number;
  
  /** Weight in final score (percentage) */
  weight: number;
  
  /** Whether this component is mandatory */
  is_required: boolean;
  
  /** Component-specific configuration */
  config: ComponentConfig;
}

/**
 * Language skills assessed in courses
 */
export type SkillType = 
  | "reading" 
  | "writing" 
  | "listening" 
  | "speaking" 
  | "grammar" 
  | "vocabulary"
  | "use_of_language";

/**
 * Component-specific configuration options
 */
export interface ComponentConfig {
  /** Question types allowed in this component */
  question_types: QuestionType["type"][];
  
  /** Number of questions/tasks */
  question_count: number;
  
  /** Difficulty distribution */
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  
  /** Specific format requirements */
  format_requirements?: {
    word_limit?: number;
    time_per_question?: number;
    audio_quality?: "standard" | "high";
    speaking_format?: "monologue" | "dialogue" | "presentation";
  };
}

/**
 * Assessment rubric following CEFR standards
 */
export interface AssessmentRubric {
  /** Overall passing score (percentage) */
  passing_score: number;
  
  /** Minimum score required per component */
  component_minimums: Record<string, number>;
  
  /** Grading scale configuration */
  grading_scale: GradingScale;
  
  /** CEFR descriptors for each skill level */
  cefr_descriptors: CEFRDescriptors;
  
  /** Feedback templates for different score ranges */
  feedback_templates: FeedbackTemplate[];
}

/**
 * Grading scale definition
 */
export interface GradingScale {
  /** Scale type */
  type: "percentage" | "points" | "letter" | "pass_fail";
  
  /** Maximum possible score */
  max_score: number;
  
  /** Grade boundaries */
  grade_boundaries: {
    grade: string;
    min_score: number;
    max_score: number;
    description: string;
  }[];
}

/**
 * CEFR descriptors for skill assessment
 */
export interface CEFRDescriptors {
  /** Overall level descriptors */
  overall: Record<CourseLevel, string>;
  
  /** Skill-specific descriptors */
  skills: Record<SkillType, Record<CourseLevel, string>>;
  
  /** Can-do statements */
  can_do_statements: Record<CourseLevel, string[]>;
}

/**
 * Feedback templates for different performance levels
 */
export interface FeedbackTemplate {
  /** Score range this template applies to */
  score_range: {
    min: number;
    max: number;
  };
  
  /** Overall feedback message */
  message: string;
  
  /** Specific improvement suggestions */
  suggestions: string[];
  
  /** Recommended next steps */
  next_steps: string[];
}

/**
 * Course validation rules and constraints
 */
export interface CourseValidationRules {
  /** Unique constraint: language + level + certification_type */
  unique_combination: {
    language: CourseLanguage;
    level: CourseLevel;
    certification_type: CertificationType;
  };
  
  /** Component validation */
  component_rules: {
    /** Minimum number of components required */
    min_components: number;
    
    /** Maximum number of components allowed */
    max_components: number;
    
    /** Required skills that must be included */
    required_skills: SkillType[];
    
    /** Total weight must equal 100% */
    total_weight: 100;
  };
  
  /** Assessment rubric validation */
  rubric_rules: {
    /** Passing score must be between these values */
    passing_score_range: {
      min: number;
      max: number;
    };
    
    /** CEFR alignment requirements */
    cefr_compliance: boolean;
  };
}

/**
 * Legacy Course interface (deprecated - use Course instead)
 * @deprecated Use the new Course interface above
 */
export interface LegacyCourse {
  id: string; // Composite: 'en-B2', 'ca-mitja'
  language_id: string;
  level_id: string;
  title: string; // 'English B2 Preparation', 'Preparació Valencià Mitjà'
  description: string;
  certification_target: string; // Target exam name
  curriculum: {
    modules: CourseModule[];
    estimated_hours: number;
    skills_distribution: Record<string, number>;
  };
  ui_theme: {
    primary_color: string;
    accent_color: string;
    background_pattern: string;
    typography: string;
  };
  content_language: string; // Interface language for this course
  status: "active" | "beta" | "coming_soon";
}

export interface CourseModule {
  id: string;
  name: string;
  description: string;
  estimated_hours: number;
  order: number;
  exam_types: string[];
}

export interface ExamType {
  id: string; // Composite: 'en-B2-reading', 'ca-mitja-oral'
  course_id: string;
  name: string; // 'Reading Comprehension', 'Comprensió Oral'
  skill_type: "reading" | "writing" | "listening" | "speaking";
  official_format: {
    structure: ExamSection[];
    total_time: number; // minutes
    total_questions: number;
    scoring_method: "percentage" | "points" | "grade";
    passing_criteria: number;
  };
  questions_config: {
    types: QuestionType[];
    distribution: Record<string, number>;
    difficulty_levels: ("easy" | "medium" | "hard")[];
  };
  ai_tutor_config: {
    feedback_style: "detailed" | "concise" | "encouraging";
    hint_system: boolean;
    adaptive_difficulty: boolean;
    context_awareness: string[];
  };
  time_limit: number;
  passing_score: number;
}

export interface ExamSection {
  id: string;
  name: string;
  instructions: string;
  time_allocation: number;
  question_count: number;
  weight: number; // Percentage of total score
}

export interface QuestionType {
  type:
    | "multiple_choice"
    | "essay"
    | "listening"
    | "speaking"
    | "fill_blank"
    | "matching";
  count: number;
  points_each: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_date: Date;
  current_level: string;
  completion_percentage: number; // 0-100
  study_hours: number;
  exam_scores: Record<string, ExamScore[]>; // exam_type_id -> scores
  learning_preferences: {
    ai_tutor_level: "beginner" | "intermediate" | "advanced";
    feedback_frequency: "immediate" | "end_of_section" | "end_of_exam";
    difficulty_preference: "adaptive" | "challenging" | "gradual";
    study_reminders: boolean;
  };
  target_exam_date?: Date;
  last_activity: Date;
  achievements: Achievement[];
}

export interface ExamScore {
  score: number;
  max_score: number;
  percentage: number;
  date: Date;
  time_taken: number; // seconds
  skill_breakdown: Record<string, number>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_date: Date;
  category: "progress" | "streak" | "score" | "completion";
}

export interface ExamSession {
  id: string;
  user_id: string;
  exam_type_id: string;
  started_at: Date;
  completed_at?: Date;
  status: "in_progress" | "completed" | "abandoned" | "paused";
  score?: number; // Percentage
  detailed_results?: {
    section_scores: Record<string, number>;
    skill_analysis: Record<string, SkillAnalysis>;
    time_per_section: Record<string, number>;
    accuracy_rate: number;
  };
  ai_feedback?: string;
  time_taken: number; // seconds
  answers: Record<string, unknown>; // question_id -> answer
  context: {
    device_type: "desktop" | "tablet" | "mobile";
    browser: string;
    exam_conditions: "practice" | "official" | "timed";
  };
}

export interface SkillAnalysis {
  strength_level: "weak" | "developing" | "strong" | "excellent";
  improvement_areas: string[];
  recommendations: string[];
  comparison_to_level: "below" | "at" | "above";
}

export interface Question {
  id: string;
  exam_type_id: string;
  question_number: number;
  question_type: QuestionType["type"];
  content: {
    text?: string;
    audio_url?: string;
    image_url?: string;
    video_url?: string;
    options?: string[]; // For multiple choice
    word_limit?: number; // For essays
    time_limit?: number; // For speaking
  };
  correct_answer: unknown; // Varies by question type
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
  skill_tags: string[]; // Specific skills tested
  official_source: string; // Reference to official materials
  cultural_context?: string; // For cultural sensitivity
}

// MCP (Model Context Protocol) Integration Types
export interface MCPOperation<T = unknown> {
  operation: "create" | "read" | "update" | "delete" | "list";
  entity: string;
  data?: T;
  filters?: Record<string, unknown>;
  options?: {
    include_related?: boolean;
    cache_duration?: number;
    audit_log?: boolean;
  };
}

export interface MCPResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    operation_id: string;
    timestamp: Date;
    affected_rows?: number;
    cache_hit?: boolean;
  };
}

// AI Integration Types for Educational Context
export interface AIEducationalContext {
  course_id: string;
  user_id: string;
  session_type: "tutoring" | "feedback" | "assessment" | "guidance";
  educational_context: {
    current_level: string;
    learning_style: string;
    previous_performance: ExamScore[];
    cultural_background: string;
    language_proficiency: Record<string, string>;
  };
  interaction_history: AIEducationalInteraction[];
}

export interface AIEducationalInteraction {
  id: string;
  timestamp: Date;
  type: "question" | "feedback" | "explanation" | "encouragement";
  content: string;
  response: string;
  effectiveness_rating?: number; // 1-5
  ai_provider: 'anthropic' | 'openai';
  model_used: string;
}

// Course Theme Configuration
/**
 * Utility types for Course operations
 */

/** 
 * Type for creating a new course (omits auto-generated fields)
 */
export type CreateCourseInput = Omit<Course, 'id' | 'created_at' | 'updated_at'>;

/**
 * Type for updating an existing course (all fields optional except id)
 */
export type UpdateCourseInput = Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>> & {
  id: string;
};

/**
 * Type for course query filters
 */
export interface CourseFilters {
  language?: CourseLanguage;
  level?: CourseLevel;
  certification_type?: CertificationType;
  is_active?: boolean;
  created_after?: Date;
  created_before?: Date;
}

/**
 * Type for course list response with pagination
 */
export interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

/**
 * Validation error types
 */
export interface CourseValidationError {
  field: keyof Course | string;
  message: string;
  code: 'REQUIRED' | 'INVALID' | 'DUPLICATE' | 'CONSTRAINT_VIOLATION';
  value?: unknown;
}

/**
 * Course validation result
 */
export interface CourseValidationResult {
  is_valid: boolean;
  errors: CourseValidationError[];
  warnings: CourseValidationError[];
}

/**
 * Course theme configuration for UI presentation
 */
export interface CourseTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    muted: string;
  };
  typography: {
    heading_font: string;
    body_font: string;
    font_sizes: Record<string, string>;
  };
  spacing: {
    container_padding: string;
    section_gap: string;
    component_margin: string;
  };
  animations: {
    transition_duration: string;
    ease_function: string;
    hover_scale: number;
  };
  cultural_elements: {
    flag_display: boolean;
    cultural_imagery: string[];
    traditional_colors: string[];
    linguistic_elements: string[];
  };
}

// API Response Types
export interface LanguageListResponse {
  languages: Language[];
  total: number;
  available_certifications: string[];
}

export interface CourseDashboardResponse {
  course: Course;
  user_progress: UserProgress;
  exam_types: ExamType[];
  recent_sessions: ExamSession[];
  recommendations: string[];
  achievements: Achievement[];
  theme: CourseTheme;
}

export interface ExamSessionStartRequest {
  exam_type_id: string;
  practice_mode?: boolean;
  time_limit_override?: number;
  difficulty_preference?: "adaptive" | "fixed";
}

export interface ExamSessionUpdateRequest {
  answers?: Record<string, unknown>;
  current_question?: number;
  time_remaining?: number;
  status?: ExamSession["status"];
  pause_reason?: string;
}

/**
 * Constants and validation helpers for Course types
 */

/**
 * Default validation rules for course creation
 */
export const DEFAULT_COURSE_VALIDATION_RULES: CourseValidationRules = {
  unique_combination: {
    language: "english", // This will be validated against actual input
    level: "b2",
    certification_type: "eoi"
  },
  component_rules: {
    min_components: 1,
    max_components: 7,
    required_skills: ["reading", "writing"],
    total_weight: 100
  },
  rubric_rules: {
    passing_score_range: {
      min: 50,
      max: 70
    },
    cefr_compliance: true
  }
};

/**
 * Language to certification type mapping
 */
export const LANGUAGE_CERTIFICATION_MAP: Record<CourseLanguage, CertificationType[]> = {
  english: ["eoi", "cambridge", "ielts", "toefl"],
  valenciano: ["jqcv", "eoi"],
  spanish: ["dele", "eoi"],
  french: ["delf", "dalf", "eoi"],
  german: ["goethe", "eoi"],
  italian: ["cils", "eoi"],
  portuguese: ["celpe", "eoi"]
};

/**
 * CEFR level mapping
 */
export const CEFR_LEVEL_MAP: Record<string, CourseLevel> = {
  // Standard CEFR
  'A1': 'a1',
  'A2': 'a2',
  'B1': 'b1',
  'B2': 'b2',
  'C1': 'c1',
  'C2': 'c2',
  // EOI levels
  'Básico A1': 'a1',
  'Básico A2': 'a2',
  'Intermedio B1': 'b1',
  'Intermedio B2': 'b2',
  'Avanzado C1': 'c1',
  'Avanzado C2': 'c2',
  // JQCV levels (Valenciano)
  'Elemental': 'elemental',
  'Mitjà': 'mitja',
  'Superior': 'superior'
};

/**
 * Standard component configurations by certification type
 */
export const STANDARD_COMPONENTS: Record<CertificationType, Partial<CourseComponent>[]> = {
  eoi: [
    {
      name: "Reading Comprehension",
      skill_type: "reading",
      duration: 90,
      weight: 25,
      is_required: true
    },
    {
      name: "Writing",
      skill_type: "writing", 
      duration: 90,
      weight: 25,
      is_required: true
    },
    {
      name: "Listening Comprehension",
      skill_type: "listening",
      duration: 45,
      weight: 25,
      is_required: true
    },
    {
      name: "Speaking",
      skill_type: "speaking",
      duration: 15,
      weight: 25,
      is_required: true
    }
  ],
  jqcv: [
    {
      name: "Comprensió Oral i Escrita",
      skill_type: "reading",
      duration: 120,
      weight: 50,
      is_required: true
    },
    {
      name: "Expressió Oral i Escrita",
      skill_type: "writing",
      duration: 90,
      weight: 50,
      is_required: true
    }
  ],
  cambridge: [
    {
      name: "Reading and Use of English",
      skill_type: "reading",
      duration: 90,
      weight: 25,
      is_required: true
    },
    {
      name: "Writing",
      skill_type: "writing",
      duration: 90,
      weight: 25,
      is_required: true
    },
    {
      name: "Listening",
      skill_type: "listening",
      duration: 40,
      weight: 25,
      is_required: true
    },
    {
      name: "Speaking",
      skill_type: "speaking",
      duration: 14,
      weight: 25,
      is_required: true
    }
  ],
  ielts: [
    {
      name: "Academic Reading",
      skill_type: "reading",
      duration: 60,
      weight: 25,
      is_required: true
    },
    {
      name: "Academic Writing",
      skill_type: "writing",
      duration: 60,
      weight: 25,
      is_required: true
    },
    {
      name: "Listening",
      skill_type: "listening",
      duration: 30,
      weight: 25,
      is_required: true
    },
    {
      name: "Speaking",
      skill_type: "speaking",
      duration: 15,
      weight: 25,
      is_required: true
    }
  ],
  // Simplified entries for other certification types
  toefl: [],
  delf: [],
  dalf: [],
  goethe: [],
  dele: [],
  cils: [],
  celpe: []
};

/**
 * Type guards for Course types
 */

/**
 * Checks if a value is a valid CourseLanguage
 */
export function isCourseLanguage(value: unknown): value is CourseLanguage {
  return typeof value === 'string' && 
    ['english', 'valenciano', 'spanish', 'french', 'german', 'italian', 'portuguese'].includes(value);
}

/**
 * Checks if a value is a valid CourseLevel
 */
export function isCourseLevel(value: unknown): value is CourseLevel {
  return typeof value === 'string' && 
    ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'basic', 'intermediate', 'advanced', 'elemental', 'mitja', 'superior'].includes(value);
}

/**
 * Checks if a value is a valid CertificationType
 */
export function isCertificationType(value: unknown): value is CertificationType {
  return typeof value === 'string' && 
    ['eoi', 'jqcv', 'delf', 'dalf', 'goethe', 'cambridge', 'ielts', 'toefl', 'dele', 'cils', 'celpe'].includes(value);
}

/**
 * Validates if a course combination is unique
 */
export function isUniqueCourseCombo(
  language: CourseLanguage, 
  level: CourseLevel, 
  certificationType: CertificationType
): boolean {
  const allowedCertifications = LANGUAGE_CERTIFICATION_MAP[language];
  return allowedCertifications.includes(certificationType);
}
