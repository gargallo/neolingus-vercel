/**
 * Academia TypeScript Type System
 * 
 * Comprehensive type definitions for the Course-Centric Academy architecture
 * integrating all 6 data model entities: UserProfile, CertificationModule, Course,
 * UserCourseProgress, ExamSession, and AITutorContext.
 * 
 * Based on: /specs/002-course-centric-academy/data-model.md
 * Migration: supabase/migrations/20250910000000_create_academy_system.sql
 * 
 * @author Claude Code
 * @version 1.0.0
 */

// =============================================================================
// IMPORTS FROM EXISTING TYPE MODULES
// =============================================================================

// Re-export and extend existing types
export type {
  // User Profile types
  UserProfile,
  UserProfileWithConsents,
  ConsentRecord,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  UserProfileResponse,
  UserProfileSummary,
  UserProfileWithAuth,
  // User Profile enums
  PreferredLanguage,
  DataRetentionPreference,
  ConsentType,
  LOPDConsentCategory,
  UserProfileStatus,
  LegalBasis,
  DataProcessingActivity,
  DataSubjectRight,
  // User Profile validation
  UserProfileValidationRules,
  UserProfileValidationResult,
  UserProfileValidationError,
  UserProfileValidationErrorCode
} from './user-profile';

export type {
  // Certification Module types
  CertificationModule,
  CertificationModuleCreateInput,
  CertificationModuleUpdateInput,
  CertificationModuleWithValidation,
  CertificationModuleSummary,
  ActiveCertificationModule,
  // Certification Module structure types
  ExamComponent,
  ExamSection,
  ExamTiming,
  ScoringCriteria,
  ExamStructure,
  QuestionTypeConfig,
  ContentConfig,
  ComplianceRequirements,
  GDPRCompliance,
  RegionalCompliance,
  // Certification Module enums
  CertificationPhase,
  LanguageCode,
  ExamComponentType,
  QuestionType as CertificationQuestionType,
  DifficultyLevel,
  // Certification Module validation
  CertificationModuleValidation,
  CertificationModuleFilters,
  CertificationModuleQuery,
  CertificationModuleError,
  CertificationModuleValidationResult
} from './certification-module';

export type {
  // Course types
  Course,
  CreateCourseInput,
  UpdateCourseInput,
  CourseFilters,
  CourseListResponse,
  CourseValidationError,
  CourseValidationResult,
  // Course component types
  CourseComponent,
  ComponentConfig,
  AssessmentRubric,
  GradingScale,
  CEFRDescriptors,
  FeedbackTemplate,
  CourseValidationRules,
  CourseTheme,
  // Course enums
  CourseLanguage,
  CourseLevel,
  CertificationType,
  SkillType,
  // Legacy course types (deprecated)
  LegacyCourse,
  CourseModule,
  ExamType,
  ExamSection as CourseExamSection,
  QuestionType,
  UserProgress,
  ExamScore,
  Achievement
} from './course';

export type {
  // User Course Progress types
  UserCourseProgress,
  CreateUserCourseProgressInput,
  UpdateUserCourseProgressInput,
  ProgressAnalytics,
  ProgressValidation,
  ProgressQueryOptions,
  BatchProgressUpdate,
  ProgressMilestone,
  ProgressActivityLog,
  ProgressRecommendation,
  // Progress component types
  ComponentProgress,
  SkillArea,
  ProgressStateTransition,
  // Progress enums
  ProgressValue,
  CourseComponent as ProgressCourseComponent,
  ProgressState
} from './user-course-progress';

export type {
  // Exam Session types
  ExamSession,
  CreateExamSessionInput,
  UpdateExamSessionInput,
  CompleteExamSessionInput,
  ExamSessionAnalytics,
  ExamSessionQueryOptions,
  BatchSessionOperation,
  ExamSessionValidation,
  // Session component types
  UserResponse,
  DetailedScores,
  ImprovementSuggestion,
  SessionData,
  SessionActivity,
  SessionComparison,
  SessionBenchmark,
  SessionStateTransition,
  // Session enums
  ExamSessionType,
  ExamComponent as SessionExamComponent,
  ExamSessionState,
  ScoreValue,
  // Session utility types
  ExamSessionSummary,
  ActiveSession,
  CompletedSession
} from './exam-session';

export type {
  // AI Tutor Context types
  AITutorContext,
  CreateAITutorContextInput,
  UpdateAITutorContextInput,
  AITutorContextQueryOptions,
  AITutorContextAnalytics,
  ContextRecommendation,
  AITutorContextSummary,
  BatchContextOperation,
  // AI context component types
  LearningProfile,
  AIInteraction,
  CurrentLearningContext,
  AIIntegration,
  ContextStateTransition,
  // AI context enums
  AITutorContextType,
  AIInteractionType,
  LearningContextState,
  TutoringMode,
  AISessionState,
  // AI context validation
  AITutorContextValidationRules
} from './ai-tutor-context';

// =============================================================================
// BASE TYPES AND CONSTANTS
// =============================================================================

/** Base UUID type for all database references */
export type UUID = string;

/** Base JSON object type for flexible data storage */
export type JSONObject = Record<string, unknown>;

/** Base timestamp type */
export type Timestamp = Date;

/** Percentage value constrained to 0.0-1.0 */
export type PercentageValue = number; // 0.0 to 1.0

// =============================================================================
// ACADEMIA UNIFIED TYPES
// =============================================================================

/**
 * Complete user enrollment with progress tracking
 * Links UserProfile -> Course with progress and analytics
 */
export interface AcademiaUserEnrollment {
  /** Enrollment record ID */
  id: UUID;
  
  /** User profile information */
  user: UserProfile;
  
  /** Course information */
  course: Course;
  
  /** Certification module details */
  certification_module: CertificationModule;
  
  /** Progress tracking */
  progress: UserCourseProgress;
  
  /** Enrollment metadata */
  enrollment: {
    /** Enrollment date */
    enrollment_date: Timestamp;
    
    /** Subscription status */
    subscription_status: 'active' | 'expired' | 'cancelled';
    
    /** Access expiration */
    access_expires_at?: Timestamp | null;
    
    /** Subscription tier */
    subscription_tier: 'basic' | 'standard' | 'premium';
    
    /** Enrollment timestamps */
    created_at: Timestamp;
    updated_at: Timestamp;
  };
  
  /** Recent exam sessions */
  recent_sessions: ExamSession[];
  
  /** AI tutor contexts */
  ai_contexts: AITutorContext[];
}

/**
 * Complete exam session with all related data
 * Enhanced with user and course context
 */
export interface AcademiaExamSessionComplete extends ExamSession {
  /** User information */
  user: UserProfile;
  
  /** Course information */
  course: Course;
  
  /** Progress record */
  user_progress: UserCourseProgress;
  
  /** Related AI contexts */
  ai_contexts: AITutorContext[];
  
  /** Session analytics */
  analytics?: ExamSessionAnalytics;
  
  /** Performance benchmarks */
  benchmarks?: SessionBenchmark;
}

/**
 * Academia dashboard data aggregating all user information
 */
export interface AcademiaDashboard {
  /** User profile */
  user: UserProfile;
  
  /** All user enrollments */
  enrollments: AcademiaUserEnrollment[];
  
  /** Available courses */
  available_courses: Course[];
  
  /** Available certification modules */
  available_certifications: CertificationModule[];
  
  /** Recent activity */
  recent_activity: {
    /** Recent exam sessions */
    recent_sessions: ExamSession[];
    
    /** Recent AI interactions */
    recent_ai_interactions: AIInteraction[];
    
    /** Progress milestones */
    recent_milestones: ProgressMilestone[];
  };
  
  /** Performance analytics */
  analytics: {
    /** Overall performance across all courses */
    overall_performance: PercentageValue;
    
    /** Study hours this week */
    weekly_study_hours: number;
    
    /** Current study streak in days */
    study_streak_days: number;
    
    /** Performance trends */
    performance_trends: Array<{
      course_id: UUID;
      trend: 'improving' | 'stable' | 'declining';
      confidence: PercentageValue;
    }>;
  };
  
  /** Recommendations */
  recommendations: {
    /** Course recommendations */
    suggested_courses: Course[];
    
    /** Study recommendations */
    study_recommendations: ProgressRecommendation[];
    
    /** AI context recommendations */
    context_recommendations: ContextRecommendation[];
  };
}

/**
 * Academia course catalog with enrollment information
 */
export interface AcademiaCourseCatalog {
  /** Available certification modules */
  certification_modules: CertificationModule[];
  
  /** Courses grouped by module */
  courses_by_module: Record<UUID, Course[]>;
  
  /** User's enrollment status per course */
  enrollment_status: Record<UUID, {
    is_enrolled: boolean;
    enrollment_id?: UUID;
    progress?: UserCourseProgress;
    access_level: 'none' | 'trial' | 'basic' | 'standard' | 'premium';
  }>;
  
  /** Course popularity and ratings */
  course_metrics: Record<UUID, {
    enrollment_count: number;
    average_completion_rate: PercentageValue;
    average_satisfaction_rating: number; // 1-5
    success_rate: PercentageValue;
  }>;
}

/**
 * Academia course session for active learning
 */
export interface AcademiaLearningSession {
  /** Session ID */
  id: UUID;
  
  /** User enrollment */
  enrollment: AcademiaUserEnrollment;
  
  /** Current exam session */
  current_session?: ExamSession;
  
  /** AI tutor context */
  ai_context: AITutorContext;
  
  /** Session state */
  state: {
    /** Current component being studied */
    current_component: CourseComponent;
    
    /** Current difficulty level */
    current_difficulty: 'beginner' | 'intermediate' | 'advanced';
    
    /** Session start time */
    started_at: Timestamp;
    
    /** Estimated session duration */
    estimated_duration_minutes: number;
    
    /** Break recommendations */
    break_recommendations: Array<{
      recommended_at: Timestamp;
      reason: string;
      duration_minutes: number;
    }>;
  };
  
  /** Real-time analytics */
  real_time_analytics: {
    /** Current session performance */
    current_performance: PercentageValue;
    
    /** Focus level (0.0 to 1.0) */
    focus_level: PercentageValue;
    
    /** Engagement metrics */
    engagement_metrics: {
      questions_answered: number;
      correct_answers: number;
      average_response_time_seconds: number;
      hint_usage_rate: PercentageValue;
    };
    
    /** Adaptive recommendations */
    adaptive_recommendations: Array<{
      type: 'difficulty_adjustment' | 'break_suggestion' | 'topic_change' | 'reinforcement';
      urgency: 'low' | 'medium' | 'high';
      message: string;
    }>;
  };
}

// =============================================================================
// ACADEMIA API TYPES
// =============================================================================

/**
 * Academia course enrollment request
 */
export interface AcademiaCourseEnrollmentRequest {
  /** User ID */
  user_id: UUID;
  
  /** Course ID */
  course_id: UUID;
  
  /** Subscription tier */
  subscription_tier: 'basic' | 'standard' | 'premium';
  
  /** Target exam date */
  target_exam_date?: Date;
  
  /** Initial assessment data */
  initial_assessment?: Partial<ComponentProgress>;
  
  /** Payment information */
  payment_info?: {
    payment_method: string;
    billing_cycle: 'monthly' | 'quarterly' | 'yearly';
    discount_code?: string;
  };
  
  /** Referral information */
  referral_info?: {
    referrer_id?: UUID;
    source: string;
    campaign?: string;
  };
}

/**
 * Academia course enrollment response
 */
export interface AcademiaCourseEnrollmentResponse {
  /** Enrollment success status */
  success: boolean;
  
  /** Created enrollment */
  enrollment?: AcademiaUserEnrollment;
  
  /** Error information if failed */
  error?: {
    code: string;
    message: string;
    details?: JSONObject;
  };
  
  /** Next steps for user */
  next_steps: Array<{
    action: string;
    description: string;
    url?: string;
    due_date?: Date;
  }>;
  
  /** Billing information */
  billing?: {
    amount: number;
    currency: string;
    next_billing_date: Date;
    invoice_url?: string;
  };
}

/**
 * Academia session start request
 */
export interface AcademiaSessionStartRequest {
  /** Enrollment ID */
  enrollment_id: UUID;
  
  /** Session type */
  session_type: ExamSessionType;
  
  /** Component to focus on */
  component?: CourseComponent;
  
  /** Session preferences */
  preferences?: {
    /** Time limit override */
    time_limit_minutes?: number;
    
    /** Difficulty preference */
    difficulty_preference?: 'adaptive' | 'fixed';
    
    /** Enable AI tutor */
    enable_ai_tutor?: boolean;
    
    /** Tutoring mode */
    tutoring_mode?: TutoringMode;
  };
  
  /** Device context */
  device_context?: {
    device_type: 'desktop' | 'tablet' | 'mobile';
    browser: string;
    screen_resolution?: string;
    network_quality?: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

/**
 * Academia session start response
 */
export interface AcademiaSessionStartResponse {
  /** Session creation success */
  success: boolean;
  
  /** Created learning session */
  learning_session?: AcademiaLearningSession;
  
  /** Error information if failed */
  error?: {
    code: string;
    message: string;
    details?: JSONObject;
  };
  
  /** Session configuration */
  session_config?: {
    time_limit_minutes: number;
    question_count: number;
    difficulty_level: 'adaptive' | 'beginner' | 'intermediate' | 'advanced';
    ai_tutor_enabled: boolean;
    expected_duration_minutes: number;
  };
}

/**
 * Academia progress analytics request
 */
export interface AcademiaAnalyticsRequest {
  /** User ID */
  user_id: UUID;
  
  /** Optional course ID filter */
  course_id?: UUID;
  
  /** Date range */
  date_range?: {
    start_date: Date;
    end_date: Date;
  };
  
  /** Analytics type */
  analytics_type: 'overview' | 'detailed' | 'comparative' | 'predictive';
  
  /** Include benchmarks */
  include_benchmarks?: boolean;
  
  /** Include recommendations */
  include_recommendations?: boolean;
}

/**
 * Academia progress analytics response
 */
export interface AcademiaAnalyticsResponse {
  /** User ID */
  user_id: UUID;
  
  /** Analytics data */
  analytics: {
    /** Overall performance metrics */
    performance: {
      overall_score: PercentageValue;
      improvement_rate: PercentageValue;
      consistency_score: PercentageValue;
      predicted_exam_readiness: PercentageValue;
    };
    
    /** Component-wise breakdown */
    component_breakdown: Record<CourseComponent, {
      current_level: PercentageValue;
      improvement_trend: 'improving' | 'stable' | 'declining';
      time_invested_hours: number;
      mastery_percentage: PercentageValue;
    }>;
    
    /** Study patterns */
    study_patterns: {
      total_study_time_hours: number;
      average_session_duration_minutes: number;
      most_productive_times: string[];
      study_frequency_per_week: number;
      longest_streak_days: number;
      current_streak_days: number;
    };
    
    /** Comparative analysis */
    comparative_analysis?: {
      percentile_ranking: number;
      peer_comparison: {
        above_average: boolean;
        improvement_vs_peers: PercentageValue;
      };
      historical_comparison: {
        vs_last_month: PercentageValue;
        vs_last_quarter: PercentageValue;
      };
    };
  };
  
  /** Benchmarks */
  benchmarks?: Array<{
    metric: string;
    user_value: number;
    benchmark_value: number;
    percentile: number;
    interpretation: string;
  }>;
  
  /** Recommendations */
  recommendations?: Array<{
    category: 'study_plan' | 'focus_area' | 'technique' | 'schedule';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimated_impact: PercentageValue;
    implementation_steps: string[];
  }>;
  
  /** Response metadata */
  metadata: {
    generated_at: Timestamp;
    data_freshness: Timestamp;
    confidence_level: PercentageValue;
    analysis_version: string;
  };
}

// =============================================================================
// ACADEMIA VALIDATION TYPES
// =============================================================================

/**
 * Academia enrollment validation rules
 */
export interface AcademiaEnrollmentValidationRules {
  /** User eligibility rules */
  user_eligibility: {
    /** Minimum age requirement */
    min_age: number;
    
    /** Required consents */
    required_consents: ConsentType[];
    
    /** Account verification requirements */
    verification_requirements: string[];
  };
  
  /** Course prerequisites */
  course_prerequisites: {
    /** Check prerequisite courses */
    check_prerequisites: boolean;
    
    /** Allow level skipping */
    allow_level_skipping: boolean;
    
    /** Minimum score for prerequisites */
    min_prerequisite_score?: PercentageValue;
  };
  
  /** Subscription validation */
  subscription_validation: {
    /** Payment verification required */
    payment_verification_required: boolean;
    
    /** Trial period limitations */
    trial_limitations: {
      max_courses: number;
      duration_days: number;
      feature_restrictions: string[];
    };
  };
  
  /** Business rules */
  business_rules: {
    /** Maximum concurrent enrollments */
    max_concurrent_enrollments: number;
    
    /** Refund eligibility period */
    refund_eligibility_days: number;
    
    /** Transfer policies */
    allow_course_transfer: boolean;
  };
}

/**
 * Academia session validation rules
 */
export interface AcademiaSessionValidationRules {
  /** Session timing rules */
  timing_rules: {
    /** Minimum session duration */
    min_session_duration_minutes: number;
    
    /** Maximum session duration */
    max_session_duration_minutes: number;
    
    /** Cool-down period between sessions */
    cooldown_period_minutes: number;
  };
  
  /** Progress requirements */
  progress_requirements: {
    /** Minimum progress for advanced sessions */
    min_progress_for_advanced: PercentageValue;
    
    /** Required component coverage */
    required_component_coverage: PercentageValue;
  };
  
  /** AI integration rules */
  ai_integration_rules: {
    /** AI service availability check */
    check_ai_availability: boolean;
    
    /** Fallback for AI unavailability */
    ai_fallback_enabled: boolean;
    
    /** Context retention policies */
    context_retention_minutes: number;
  };
  
  /** Performance validation */
  performance_validation: {
    /** Minimum device specifications */
    min_device_specs: {
      screen_width: number;
      screen_height: number;
      supported_browsers: string[];
    };
    
    /** Network quality requirements */
    min_network_quality: 'fair' | 'good' | 'excellent';
  };
}

/**
 * Academia data integrity validation
 */
export interface AcademiaDataIntegrityRules {
  /** Cross-entity consistency */
  consistency_rules: {
    /** User-progress consistency */
    user_progress_consistency: boolean;
    
    /** Session-progress linkage */
    session_progress_linkage: boolean;
    
    /** AI context alignment */
    ai_context_alignment: boolean;
  };
  
  /** Data quality requirements */
  data_quality: {
    /** Required field completeness */
    required_completeness: PercentageValue;
    
    /** Data accuracy thresholds */
    accuracy_thresholds: Record<string, PercentageValue>;
    
    /** Anomaly detection rules */
    anomaly_detection: {
      score_variance_threshold: PercentageValue;
      time_inconsistency_threshold: number;
      progress_regression_threshold: PercentageValue;
    };
  };
  
  /** Audit requirements */
  audit_requirements: {
    /** Change logging required */
    change_logging_required: boolean;
    
    /** User action tracking */
    user_action_tracking: boolean;
    
    /** Performance monitoring */
    performance_monitoring: boolean;
  };
}

// =============================================================================
// ACADEMIA CONSTANTS AND DEFAULTS
// =============================================================================

/**
 * Academia system constants
 */
export const ACADEMIA_CONSTANTS = {
  /** Default pagination limits */
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    DEFAULT_OFFSET: 0
  },
  
  /** Session constraints */
  SESSIONS: {
    MIN_DURATION_MINUTES: 5,
    MAX_DURATION_MINUTES: 180,
    DEFAULT_DURATION_MINUTES: 60,
    COOLDOWN_PERIOD_MINUTES: 5,
    AUTO_SAVE_INTERVAL_SECONDS: 30
  },
  
  /** Progress tracking */
  PROGRESS: {
    MIN_PROGRESS_INCREMENT: 0.01,
    READINESS_THRESHOLD: 0.8,
    MASTERY_THRESHOLD: 0.9,
    COMPLETION_THRESHOLD: 0.95
  },
  
  /** AI integration */
  AI_INTEGRATION: {
    CONTEXT_RETENTION_MINUTES: 60,
    MAX_INTERACTION_HISTORY: 100,
    MIN_EFFECTIVENESS_RATING: 2.0,
    SESSION_TIMEOUT_MINUTES: 30
  },
  
  /** Data retention */
  DATA_RETENTION: {
    DEFAULT_RETENTION_DAYS: 365,
    MAX_RETENTION_DAYS: 2555, // 7 years
    CLEANUP_GRACE_PERIOD_DAYS: 30,
    ANONYMIZATION_THRESHOLD_DAYS: 1095 // 3 years
  }
} as const;

/**
 * Default academia validation rules
 */
export const DEFAULT_ACADEMIA_VALIDATION_RULES: {
  enrollment: AcademiaEnrollmentValidationRules;
  session: AcademiaSessionValidationRules;
  data_integrity: AcademiaDataIntegrityRules;
} = {
  enrollment: {
    user_eligibility: {
      min_age: 16,
      required_consents: [ConsentType.GDPR_REQUIRED],
      verification_requirements: ['email_verified', 'gdpr_consent']
    },
    course_prerequisites: {
      check_prerequisites: true,
      allow_level_skipping: false,
      min_prerequisite_score: 0.7
    },
    subscription_validation: {
      payment_verification_required: true,
      trial_limitations: {
        max_courses: 1,
        duration_days: 7,
        feature_restrictions: ['ai_tutor_limited', 'progress_analytics_basic']
      }
    },
    business_rules: {
      max_concurrent_enrollments: 3,
      refund_eligibility_days: 14,
      allow_course_transfer: false
    }
  },
  session: {
    timing_rules: {
      min_session_duration_minutes: ACADEMIA_CONSTANTS.SESSIONS.MIN_DURATION_MINUTES,
      max_session_duration_minutes: ACADEMIA_CONSTANTS.SESSIONS.MAX_DURATION_MINUTES,
      cooldown_period_minutes: ACADEMIA_CONSTANTS.SESSIONS.COOLDOWN_PERIOD_MINUTES
    },
    progress_requirements: {
      min_progress_for_advanced: 0.6,
      required_component_coverage: 0.4
    },
    ai_integration_rules: {
      check_ai_availability: true,
      ai_fallback_enabled: true,
      context_retention_minutes: ACADEMIA_CONSTANTS.AI_INTEGRATION.CONTEXT_RETENTION_MINUTES
    },
    performance_validation: {
      min_device_specs: {
        screen_width: 768,
        screen_height: 1024,
        supported_browsers: ['chrome', 'firefox', 'safari', 'edge']
      },
      min_network_quality: 'fair'
    }
  },
  data_integrity: {
    consistency_rules: {
      user_progress_consistency: true,
      session_progress_linkage: true,
      ai_context_alignment: true
    },
    data_quality: {
      required_completeness: 0.95,
      accuracy_thresholds: {
        user_profile: 0.99,
        course_data: 0.98,
        progress_data: 0.95,
        session_data: 0.97
      },
      anomaly_detection: {
        score_variance_threshold: 0.3,
        time_inconsistency_threshold: 24 * 60 * 60 * 1000, // 24 hours in ms
        progress_regression_threshold: 0.1
      }
    },
    audit_requirements: {
      change_logging_required: true,
      user_action_tracking: true,
      performance_monitoring: true
    }
  }
};

// =============================================================================
// ACADEMIA UTILITY FUNCTIONS AND TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if user can enroll in course
 */
export function canEnrollInCourse(
  user: UserProfile,
  course: Course,
  existingEnrollments: AcademiaUserEnrollment[] = []
): boolean {
  // Check GDPR consent
  if (!user.gdpr_consent) {
    return false;
  }
  
  // Check email verification
  if (!user.email_verified) {
    return false;
  }
  
  // Check maximum concurrent enrollments
  const activeEnrollments = existingEnrollments.filter(
    e => e.enrollment.subscription_status === 'active'
  );
  
  if (activeEnrollments.length >= DEFAULT_ACADEMIA_VALIDATION_RULES.enrollment.business_rules.max_concurrent_enrollments) {
    return false;
  }
  
  // Check if already enrolled
  const existingEnrollment = existingEnrollments.find(
    e => e.course.id === course.id
  );
  
  return !existingEnrollment || existingEnrollment.enrollment.subscription_status !== 'active';
}

/**
 * Type guard to check if session can be started
 */
export function canStartSession(
  enrollment: AcademiaUserEnrollment,
  sessionType: ExamSessionType,
  recentSessions: ExamSession[] = []
): boolean {
  // Check enrollment status
  if (enrollment.enrollment.subscription_status !== 'active') {
    return false;
  }
  
  // Check cooldown period
  const lastSession = recentSessions
    .filter(s => s.user_id === enrollment.user.id && s.course_id === enrollment.course.id)
    .sort((a, b) => b.started_at.getTime() - a.started_at.getTime())[0];
  
  if (lastSession) {
    const timeSinceLastSession = Date.now() - lastSession.started_at.getTime();
    const cooldownMs = DEFAULT_ACADEMIA_VALIDATION_RULES.session.timing_rules.cooldown_period_minutes * 60 * 1000;
    
    if (timeSinceLastSession < cooldownMs) {
      return false;
    }
  }
  
  // Check progress requirements for advanced sessions
  if (sessionType === 'mock_exam' && enrollment.progress.overall_progress < 0.6) {
    return false;
  }
  
  return true;
}

/**
 * Utility function to calculate overall academia performance
 */
export function calculateAcademiaPerformance(enrollments: AcademiaUserEnrollment[]): PercentageValue {
  if (enrollments.length === 0) {
    return 0.0;
  }
  
  const totalProgress = enrollments.reduce((sum, enrollment) => {
    return sum + enrollment.progress.overall_progress;
  }, 0);
  
  return Math.min(1.0, Math.max(0.0, totalProgress / enrollments.length));
}

/**
 * Utility function to get user's study streak
 */
export function calculateStudyStreak(sessions: ExamSession[]): number {
  if (sessions.length === 0) {
    return 0;
  }
  
  // Sort sessions by date (most recent first)
  const sortedSessions = sessions
    .filter(s => s.is_completed)
    .sort((a, b) => b.started_at.getTime() - a.started_at.getTime());
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  for (const session of sortedSessions) {
    const sessionDate = new Date(session.started_at);
    sessionDate.setHours(0, 0, 0, 0);
    
    const daysDifference = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysDifference === streak) {
      streak++;
    } else if (daysDifference > streak) {
      break;
    }
  }
  
  return streak;
}

/**
 * Utility function to validate academia data consistency
 */
export function validateAcademiaDataConsistency(enrollment: AcademiaUserEnrollment): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check user-progress consistency
  if (enrollment.progress.user_id !== enrollment.user.id) {
    errors.push('User ID mismatch between profile and progress');
  }
  
  // Check course-progress consistency
  if (enrollment.progress.course_id !== enrollment.course.id) {
    errors.push('Course ID mismatch between course and progress');
  }
  
  // Check progress values
  if (enrollment.progress.overall_progress < 0 || enrollment.progress.overall_progress > 1) {
    errors.push('Overall progress value out of valid range (0.0-1.0)');
  }
  
  // Check component progress consistency
  const componentKeys = Object.keys(enrollment.progress.component_progress);
  const courseComponents = enrollment.course.components.map(c => c.skill_type);
  
  for (const key of componentKeys) {
    if (!courseComponents.includes(key as SkillType)) {
      errors.push(`Progress component '${key}' not found in course components`);
    }
  }
  
  // Check AI contexts consistency
  for (const context of enrollment.ai_contexts || []) {
    if (context.user_id !== enrollment.user.id) {
      errors.push('AI context user ID mismatch');
    }
    if (context.course_id !== enrollment.course.id) {
      errors.push('AI context course ID mismatch');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate next recommended learning session configuration
 */
export function generateNextSessionRecommendation(
  enrollment: AcademiaUserEnrollment,
  recentSessions: ExamSession[] = []
): {
  recommendedComponent: CourseComponent;
  recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced';
  recommendedDuration: number;
  reasoning: string;
} {
  const progress = enrollment.progress;
  
  // Find weakest component
  const componentScores = Object.entries(progress.component_progress) as [CourseComponent, number][];
  const weakestComponent = componentScores.reduce((weakest, [component, score]) => {
    return score < weakest[1] ? [component, score] : weakest;
  })[0];
  
  // Determine difficulty based on overall progress
  let recommendedDifficulty: 'beginner' | 'intermediate' | 'advanced';
  if (progress.overall_progress < 0.4) {
    recommendedDifficulty = 'beginner';
  } else if (progress.overall_progress < 0.7) {
    recommendedDifficulty = 'intermediate';
  } else {
    recommendedDifficulty = 'advanced';
  }
  
  // Determine duration based on recent performance
  const recentPerformance = recentSessions
    .slice(0, 3)
    .reduce((avg, session) => avg + session.score, 0) / Math.max(recentSessions.slice(0, 3).length, 1);
  
  let recommendedDuration = ACADEMIA_CONSTANTS.SESSIONS.DEFAULT_DURATION_MINUTES;
  if (recentPerformance < 0.6) {
    recommendedDuration = 45; // Shorter sessions for struggling students
  } else if (recentPerformance > 0.8) {
    recommendedDuration = 90; // Longer sessions for high performers
  }
  
  return {
    recommendedComponent: weakestComponent,
    recommendedDifficulty,
    recommendedDuration,
    reasoning: `Recommending ${weakestComponent} component (lowest score: ${componentScores.find(([c]) => c === weakestComponent)?.[1]?.toFixed(2)}) at ${recommendedDifficulty} level for ${recommendedDuration} minutes based on current progress and recent performance.`
  };
}

// =============================================================================
// RE-EXPORTS AND CONVENIENCE TYPES
// =============================================================================

// Export commonly used types for convenience
export type AcademiaUser = UserProfile;
export type AcademiaCourse = Course;
export type AcademiaProgress = UserCourseProgress;
export type AcademiaSession = ExamSession;
export type AcademiaAIContext = AITutorContext;

// Export validation functions from individual modules
export {
  hasRequiredConsents,
  canAccessCourses,
  isEmailVerified,
  calculateRetentionEndDate,
  isSubjectToAutoDeletion
} from './user-profile';

export {
  isCertificationPhase,
  isLanguageCode,
  isQuestionType,
  isActiveCertificationModule,
  validateCertificationModuleCode,
  validateExamStructure,
  validateCertificationModule
} from './certification-module';

export {
  isCourseLanguage,
  isCourseLevel,
  isCertificationType,
  isUniqueCourseCombo
} from './course';

export {
  isValidProgressValue,
  isValidProgressState,
  isValidCourseComponent
} from './user-course-progress';

export {
  isValidExamSessionType,
  isValidExamComponent,
  isValidExamSessionState,
  isValidScoreValue,
  isActiveSession,
  isCompletedSession
} from './exam-session';

export {
  isValidAITutorContextType,
  isValidAIInteractionType,
  isValidLearningContextState,
  isValidAISessionId,
  calculateContextExpiration,
  isContextExpired,
  canTransitionToState
} from './ai-tutor-context';