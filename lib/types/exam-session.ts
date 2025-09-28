/**
 * TypeScript types for ExamSession entity
 * Comprehensive exam session management with scoring, analytics, and state management
 */

// Base UUID type for database references
export type UUID = string;

// Session types for different exam modes
export type ExamSessionType = 
  | 'practice'      // Practice mode with immediate feedback
  | 'mock_exam'     // Full mock exam simulation
  | 'diagnostic';   // Initial assessment/diagnostic test

// Exam components that can be tested
export type ExamComponent = 
  | 'reading'
  | 'writing'
  | 'listening'
  | 'speaking';

// Session states following the specified state transitions
export type ExamSessionState = 
  | 'started'       // Session initiated
  | 'in_progress'   // Currently active
  | 'paused'        // Temporarily paused (can resume within 24h)
  | 'completed'     // Successfully finished
  | 'abandoned';    // Not completed within time limit

// Score value constraint (0.0 to 1.0)
export type ScoreValue = number; // Constrained to 0.0-1.0

// User responses for different question types
export interface UserResponse {
  question_id: string;
  question_type: 'multiple_choice' | 'essay' | 'listening' | 'speaking' | 'fill_blank' | 'matching';
  answer: unknown; // Varies by question type
  time_spent_seconds: number;
  submitted_at: Date;
  is_final: boolean;
  metadata?: {
    revision_count?: number;
    confidence_level?: ScoreValue;
    flagged_for_review?: boolean;
  };
}

// Section-wise detailed scoring
export interface DetailedScores {
  // Component scores
  reading?: ScoreValue;
  writing?: ScoreValue;
  listening?: ScoreValue;
  speaking?: ScoreValue;
  
  // Skill breakdown
  grammar?: ScoreValue;
  vocabulary?: ScoreValue;
  comprehension?: ScoreValue;
  fluency?: ScoreValue;
  accuracy?: ScoreValue;
  
  // Additional metrics
  time_management?: ScoreValue;
  consistency?: ScoreValue;
  improvement_over_baseline?: ScoreValue;
}

// AI-generated improvement suggestions
export interface ImprovementSuggestion {
  component: ExamComponent;
  skill_area: string;
  current_level: string;
  target_level: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
  estimated_study_hours: number;
  resources: string[];
  practice_activities: string[];
}

// Session configuration and exam parameters
export interface SessionData {
  // Exam configuration
  exam_config: {
    time_limit_minutes?: number;
    question_count: number;
    difficulty_level: 'adaptive' | 'beginner' | 'intermediate' | 'advanced';
    allow_review?: boolean;
    shuffle_questions?: boolean;
    show_progress?: boolean;
  };
  
  // Timing data
  timing: {
    start_time: Date;
    last_activity: Date;
    pause_duration_seconds: number;
    time_extensions: Array<{
      reason: string;
      additional_minutes: number;
      granted_at: Date;
    }>;
  };
  
  // Session context
  context: {
    device_type: 'desktop' | 'tablet' | 'mobile';
    browser: string;
    screen_resolution?: string;
    network_quality?: 'excellent' | 'good' | 'fair' | 'poor';
    environment: 'controlled' | 'home' | 'public' | 'mobile';
  };
  
  // Proctoring and security
  security?: {
    proctoring_enabled: boolean;
    security_violations: Array<{
      type: 'tab_switch' | 'window_blur' | 'copy_paste' | 'external_tool';
      timestamp: Date;
      severity: 'low' | 'medium' | 'high';
    }>;
    integrity_score: ScoreValue;
  };
}

// Main ExamSession interface
export interface ExamSession {
  // Primary identifiers
  id: UUID;
  user_id: UUID;
  course_id: UUID;
  progress_id: UUID;
  
  // Session classification
  session_type: ExamSessionType;
  component: ExamComponent;
  
  // Temporal tracking
  started_at: Date;
  completed_at?: Date;
  duration_seconds: number;
  
  // User responses and scoring
  responses: Record<string, UserResponse>;
  score: ScoreValue;
  detailed_scores: DetailedScores;
  
  // AI feedback and recommendations
  ai_feedback: string;
  improvement_suggestions: ImprovementSuggestion[];
  
  // Session state and metadata
  is_completed: boolean;
  current_state: ExamSessionState;
  session_data: SessionData;
  
  // Audit fields
  created_at: Date;
  updated_at: Date;
}

// Session creation input
export interface CreateExamSessionInput {
  user_id: UUID;
  course_id: UUID;
  progress_id: UUID;
  session_type: ExamSessionType;
  component: ExamComponent;
  session_config?: {
    time_limit_minutes?: number;
    difficulty_level?: 'adaptive' | 'beginner' | 'intermediate' | 'advanced';
    question_count?: number;
    allow_review?: boolean;
  };
  context?: {
    device_type: 'desktop' | 'tablet' | 'mobile';
    browser: string;
    environment: 'controlled' | 'home' | 'public' | 'mobile';
  };
}

// Session update input for progress tracking
export interface UpdateExamSessionInput {
  responses?: Record<string, UserResponse>;
  duration_seconds?: number;
  current_state?: ExamSessionState;
  last_activity?: Date;
  pause_reason?: string;
  security_event?: {
    type: 'tab_switch' | 'window_blur' | 'copy_paste' | 'external_tool';
    severity: 'low' | 'medium' | 'high';
  };
}

// Session completion input
export interface CompleteExamSessionInput {
  final_responses: Record<string, UserResponse>;
  score: ScoreValue;
  detailed_scores: DetailedScores;
  ai_feedback: string;
  improvement_suggestions: ImprovementSuggestion[];
  completion_metadata?: {
    submission_method: 'auto' | 'manual' | 'timeout';
    final_review_time_seconds?: number;
    user_satisfaction_rating?: number; // 1-5
  };
}

// Session analytics and performance metrics
export interface ExamSessionAnalytics {
  // Performance metrics
  completion_rate: ScoreValue;
  average_time_per_question: number;
  accuracy_by_question_type: Record<string, ScoreValue>;
  consistency_score: ScoreValue;
  
  // Progress tracking
  improvement_over_previous: ScoreValue;
  performance_trend: 'improving' | 'stable' | 'declining';
  projected_exam_readiness: ScoreValue;
  
  // Behavioral insights
  question_review_patterns: {
    questions_reviewed: number;
    avg_review_time: number;
    changes_made_during_review: number;
  };
  
  // Component analysis
  strongest_areas: string[];
  areas_for_improvement: string[];
  recommended_focus_time: Record<ExamComponent, number>;
}

// Session query and filtering options
export interface ExamSessionQueryOptions {
  user_id?: UUID;
  course_id?: UUID;
  progress_id?: UUID;
  session_type?: ExamSessionType | ExamSessionType[];
  component?: ExamComponent | ExamComponent[];
  current_state?: ExamSessionState | ExamSessionState[];
  min_score?: ScoreValue;
  max_score?: ScoreValue;
  completed_after?: Date;
  completed_before?: Date;
  sort_by?: 'started_at' | 'completed_at' | 'score' | 'duration_seconds';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Batch session operations
export interface BatchSessionOperation {
  action: 'abandon_expired' | 'cleanup_incomplete' | 'archive_old';
  filters: ExamSessionQueryOptions;
  dry_run?: boolean;
}

// Session validation rules
export interface ExamSessionValidation {
  // Session type validation
  isValidSessionType: (type: string) => type is ExamSessionType;
  
  // Component validation
  isValidComponent: (component: string, courseComponents: ExamComponent[]) => boolean;
  
  // Score validation
  isValidScore: (score: ScoreValue) => boolean;
  
  // State transition validation
  canTransitionToState: (currentState: ExamSessionState, targetState: ExamSessionState, session: ExamSession) => boolean;
  
  // Time limit validation
  isWithinTimeLimit: (session: ExamSession) => boolean;
  
  // Completion validation
  canCompleteSession: (session: ExamSession) => boolean;
}

// State transition rules
export interface SessionStateTransition {
  from: ExamSessionState;
  to: ExamSessionState;
  conditions: Array<{
    field: keyof ExamSession;
    operator: '>=' | '<=' | '>' | '<' | '==' | '!=';
    value: any;
  }>;
  auto_transition?: boolean;
  max_duration_hours?: number;
}

// Predefined state transition rules
export const SESSION_STATE_TRANSITIONS: SessionStateTransition[] = [
  {
    from: 'started',
    to: 'in_progress',
    conditions: [
      { field: 'responses', operator: '!=', value: {} }
    ],
    auto_transition: true
  },
  {
    from: 'in_progress',
    to: 'paused',
    conditions: [],
    max_duration_hours: 24
  },
  {
    from: 'paused',
    to: 'in_progress',
    conditions: [],
    max_duration_hours: 24
  },
  {
    from: 'paused',
    to: 'abandoned',
    conditions: [],
    auto_transition: true,
    max_duration_hours: 24
  },
  {
    from: 'in_progress',
    to: 'completed',
    conditions: [
      { field: 'is_completed', operator: '==', value: true },
      { field: 'completed_at', operator: '!=', value: null }
    ]
  },
  {
    from: 'in_progress',
    to: 'abandoned',
    conditions: [],
    auto_transition: true,
    max_duration_hours: 8 // Auto-abandon after 8 hours
  }
];

// Real-time session tracking
export interface SessionActivity {
  id: UUID;
  session_id: UUID;
  activity_type: 'question_answered' | 'question_skipped' | 'question_reviewed' | 'session_paused' | 'session_resumed';
  question_id?: string;
  timestamp: Date;
  duration_seconds: number;
  metadata?: Record<string, unknown>;
}

// Session comparison and benchmarking
export interface SessionComparison {
  current_session: ExamSession;
  comparison_sessions: ExamSession[];
  metrics: {
    score_improvement: ScoreValue;
    time_improvement: number;
    consistency_improvement: ScoreValue;
    component_progress: Record<ExamComponent, ScoreValue>;
  };
  insights: string[];
}

// Performance benchmarks by session type and component
export interface SessionBenchmark {
  session_type: ExamSessionType;
  component: ExamComponent;
  course_level: string;
  benchmarks: {
    percentile_25: ScoreValue;
    percentile_50: ScoreValue;
    percentile_75: ScoreValue;
    percentile_90: ScoreValue;
    average_duration_minutes: number;
    completion_rate: ScoreValue;
  };
  sample_size: number;
  last_updated: Date;
}

// Export utility types and constants
export type ExamSessionSummary = Pick<ExamSession, 'id' | 'session_type' | 'component' | 'score' | 'started_at' | 'completed_at' | 'current_state'>;

export type ActiveSession = ExamSession & {
  current_state: 'started' | 'in_progress' | 'paused';
};

export type CompletedSession = ExamSession & {
  current_state: 'completed';
  completed_at: Date;
  is_completed: true;
};

// Type guards for runtime validation
export const isValidExamSessionType = (type: any): type is ExamSessionType => {
  return ['practice', 'mock_exam', 'diagnostic'].includes(type);
};

export const isValidExamComponent = (component: any): component is ExamComponent => {
  return ['reading', 'writing', 'listening', 'speaking'].includes(component);
};

export const isValidExamSessionState = (state: any): state is ExamSessionState => {
  return ['started', 'in_progress', 'paused', 'completed', 'abandoned'].includes(state);
};

export const isValidScoreValue = (score: any): score is ScoreValue => {
  return typeof score === 'number' && score >= 0.0 && score <= 1.0;
};

export const isActiveSession = (session: ExamSession): session is ActiveSession => {
  return ['started', 'in_progress', 'paused'].includes(session.current_state);
};

export const isCompletedSession = (session: ExamSession): session is CompletedSession => {
  return session.current_state === 'completed' && session.is_completed && session.completed_at != null;
};

// Validation constants
export const EXAM_SESSION_CONSTRAINTS = {
  MIN_DURATION_SECONDS: 60, // 1 minute minimum
  MAX_DURATION_HOURS: 8,    // 8 hours maximum
  PAUSE_TIMEOUT_HOURS: 24,  // Auto-abandon after 24h pause
  MIN_RESPONSES_FOR_COMPLETION: 1,
  MAX_SECURITY_VIOLATIONS: 5
} as const;

// Default session configurations by type
export const DEFAULT_SESSION_CONFIGS: Record<ExamSessionType, Partial<SessionData['exam_config']>> = {
  practice: {
    allow_review: true,
    show_progress: true,
    difficulty_level: 'adaptive'
  },
  mock_exam: {
    allow_review: false,
    show_progress: false,
    difficulty_level: 'intermediate'
  },
  diagnostic: {
    allow_review: false,
    show_progress: true,
    difficulty_level: 'adaptive'
  }
} as const;