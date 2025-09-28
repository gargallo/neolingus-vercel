/**
 * TypeScript Type System for AI Tutor Context Management
 * 
 * Comprehensive type definitions for AITutorContext entity with AI integration,
 * learning profile management, and AI interaction tracking.
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { UUID } from './exam-session';
import { PreferredLanguage, LearningStyle, StudyTime, FeedbackFrequency } from './user-profile';
import { CourseLanguage, CourseLevel, SkillType } from './course';

// =============================================================================
// ENUMS AND CONSTANTS
// =============================================================================

/**
 * Types of AI tutor context for different learning scenarios
 */
export enum AITutorContextType {
  /** General tutoring without specific session focus */
  GENERAL = 'general',
  /** Context specific to an active exam session */
  SESSION_SPECIFIC = 'session_specific',
  /** Focused on specific learning weaknesses */
  WEAKNESS_FOCUSED = 'weakness_focused'
}

/**
 * AI tutor interaction types for conversation tracking
 */
export enum AIInteractionType {
  /** Student asked a question */
  QUESTION = 'question',
  /** AI provided feedback on performance */
  FEEDBACK = 'feedback',
  /** AI explained a concept or answer */
  EXPLANATION = 'explanation',
  /** AI provided encouragement or motivation */
  ENCOURAGEMENT = 'encouragement',
  /** AI suggested study strategies */
  STRATEGY_SUGGESTION = 'strategy_suggestion',
  /** AI provided progress analysis */
  PROGRESS_ANALYSIS = 'progress_analysis',
  /** AI recommended resources */
  RESOURCE_RECOMMENDATION = 'resource_recommendation'
}

/**
 * Learning context states with transitions
 */
export enum LearningContextState {
  /** Context is actively being used */
  ACTIVE = 'active',
  /** Context is being adapted based on interactions */
  LEARNING = 'learning',
  /** Context has been optimized for the user */
  OPTIMIZED = 'optimized',
  /** Context has expired due to data retention policy */
  EXPIRED = 'expired'
}

/**
 * AI tutoring modes for different learning approaches
 */
export enum TutoringMode {
  /** Adaptive difficulty based on performance */
  ADAPTIVE = 'adaptive',
  /** Socratic method with guided questions */
  SOCRATIC = 'socratic',
  /** Direct instruction and explanation */
  INSTRUCTIONAL = 'instructional',
  /** Exploratory learning with hints */
  EXPLORATORY = 'exploratory',
  /** Practice-focused with immediate feedback */
  PRACTICE_FOCUSED = 'practice_focused'
}

/**
 * AI session states for AI integration
 */
export enum AISessionState {
  /** Session is active and connected */
  ACTIVE = 'active',
  /** Session is idle but can be resumed */
  IDLE = 'idle',
  /** Session has expired */
  EXPIRED = 'expired',
  /** Session encountered an error */
  ERROR = 'error',
  /** Session was manually terminated */
  TERMINATED = 'terminated'
}

// =============================================================================
// CORE AI TUTOR CONTEXT TYPES
// =============================================================================

/**
 * Learning profile containing user's learning preferences and patterns
 */
export interface LearningProfile {
  /** Primary learning style preference */
  primary_learning_style: LearningStyle;
  
  /** Secondary learning styles */
  secondary_learning_styles: LearningStyle[];
  
  /** Preferred study time */
  preferred_study_time: StudyTime;
  
  /** Feedback frequency preference */
  feedback_frequency: FeedbackFrequency;
  
  /** Difficulty progression preference */
  difficulty_progression: 'gradual' | 'adaptive' | 'challenging' | 'manual';
  
  /** Attention span in minutes */
  attention_span_minutes: number;
  
  /** Learning pace preference */
  learning_pace: 'slow' | 'normal' | 'fast' | 'variable';
  
  /** Motivation triggers */
  motivation_triggers: string[];
  
  /** Known learning weaknesses */
  known_weaknesses: Array<{
    skill: SkillType;
    severity: 'low' | 'medium' | 'high';
    last_assessed: Date;
    improvement_rate: number; // 0.0 to 1.0
  }>;
  
  /** Learning strengths */
  learning_strengths: Array<{
    skill: SkillType;
    confidence_level: number; // 0.0 to 1.0
    last_assessed: Date;
  }>;
  
  /** Cognitive load preferences */
  cognitive_preferences: {
    max_concurrent_concepts: number;
    prefer_visual_aids: boolean;
    prefer_audio_explanations: boolean;
    need_frequent_breaks: boolean;
    work_well_under_pressure: boolean;
  };
  
  /** Cultural and linguistic background */
  cultural_context: {
    native_language: PreferredLanguage;
    cultural_background: string[];
    previous_language_learning: CourseLanguage[];
    educational_background: string;
    learning_environment_preference: 'formal' | 'informal' | 'mixed';
  };
}

/**
 * AI interaction record for conversation history tracking
 */
export interface AIInteraction {
  /** Unique interaction identifier */
  id: string;
  
  /** Timestamp of interaction */
  timestamp: Date;
  
  /** Type of interaction */
  interaction_type: AIInteractionType;
  
  /** User's input or question */
  user_input: string;
  
  /** AI's response */
  ai_response: string;
  
  /** Context in which interaction occurred */
  context: {
    /** Current skill being practiced */
    current_skill?: SkillType;
    
    /** Question or exercise being worked on */
    current_question_id?: string;
    
    /** User's emotional state (if detected) */
    emotional_state?: 'frustrated' | 'confident' | 'confused' | 'motivated' | 'neutral';
    
    /** Session performance at time of interaction */
    session_performance?: number; // 0.0 to 1.0
  };
  
  /** Effectiveness rating of the interaction */
  effectiveness_rating?: number; // 1-5, user or AI assessment
  
  /** Whether user found this interaction helpful */
  user_satisfaction?: boolean;
  
  /** Follow-up actions suggested */
  follow_up_actions: string[];
  
  /** Tags for categorizing interaction */
  tags: string[];
  
  /** Metadata for analytics */
  metadata: {
    /** Response time in milliseconds */
    response_time_ms: number;
    
    /** Length of user input in characters */
    input_length: number;
    
    /** Length of AI response in characters */
    response_length: number;
    
    /** Whether AI SDK was used for this interaction */
    ai_sdk_used: boolean;
    
    /** Confidence level of AI response */
    ai_confidence: number; // 0.0 to 1.0
  };
}

/**
 * Current learning context for active session
 */
export interface CurrentLearningContext {
  /** Current skill being focused on */
  active_skill: SkillType;
  
  /** Current difficulty level */
  current_difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  /** Learning objectives for current session */
  session_objectives: string[];
  
  /** Progress towards objectives */
  objective_progress: Record<string, number>; // objective -> progress (0.0 to 1.0)
  
  /** Current tutoring mode */
  tutoring_mode: TutoringMode;
  
  /** Active learning strategies */
  active_strategies: string[];
  
  /** Immediate areas of focus */
  focus_areas: Array<{
    skill: SkillType;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    estimated_time_minutes: number;
  }>;
  
  /** Recent performance metrics */
  recent_performance: {
    /** Last 10 question accuracy */
    recent_accuracy: number; // 0.0 to 1.0
    
    /** Average time per question in seconds */
    avg_time_per_question: number;
    
    /** Consistency score */
    consistency_score: number; // 0.0 to 1.0
    
    /** Engagement level */
    engagement_level: number; // 0.0 to 1.0
  };
  
  /** Adaptive recommendations */
  recommendations: Array<{
    type: 'difficulty_adjustment' | 'strategy_change' | 'break_suggestion' | 'focus_shift';
    description: string;
    priority: number; // 1-10
    expires_at: Date;
  }>;
}

/**
 * AI integration configuration and state
 */
export interface AIIntegration {
  /** AI session identifier */
  session_id: string;
  
  /** Current session state */
  session_state: AISessionState;
  
  /** Session configuration */
  config: {
    /** Maximum conversation length */
    max_conversation_length: number;
    
    /** Context retention period in minutes */
    context_retention_minutes: number;
    
    /** Enable advanced reasoning */
    enable_advanced_reasoning: boolean;
    
    /** Language model preferences */
    model_preferences: {
      creativity_level: number; // 0.0 to 1.0
      factual_accuracy_priority: number; // 0.0 to 1.0
      response_length_preference: 'concise' | 'detailed' | 'adaptive';
    };
  };
  
  /** Session statistics */
  statistics: {
    /** Total interactions in session */
    total_interactions: number;
    
    /** Session start time */
    session_start: Date;
    
    /** Last interaction time */
    last_interaction: Date;
    
    /** Average response time */
    avg_response_time_ms: number;
    
    /** Success rate of responses */
    success_rate: number; // 0.0 to 1.0
  };
  
  /** Error tracking */
  errors: Array<{
    timestamp: Date;
    error_type: string;
    error_message: string;
    recovery_action?: string;
  }>;
  
  /** Integration status */
  status: {
    /** Whether AI service is currently available */
    is_available: boolean;
    
    /** Last health check timestamp */
    last_health_check: Date;
    
    /** API usage statistics */
    api_usage: {
      requests_today: number;
      tokens_used_today: number;
      rate_limit_remaining: number;
    };
  };
}

/**
 * Core AITutorContext entity based on data model specification
 */
export interface AITutorContext {
  /** Primary key - UUID */
  id: UUID;
  
  /** Foreign key to UserProfile */
  user_id: UUID;
  
  /** Foreign key to Course */
  course_id: UUID;
  
  /** Foreign key to ExamSession (nullable for general contexts) */
  session_id?: UUID | null;
  
  /** Type of AI tutor context */
  context_type: AITutorContextType;
  
  /** Comprehensive learning profile */
  learning_profile: LearningProfile;
  
  /** History of AI interactions (limited to last 100) */
  interaction_history: AIInteraction[];
  
  /** Current active learning context */
  current_context: CurrentLearningContext;
  
  /** AI session metadata */
  ai_session_metadata: {
    session_id: string;
    provider: 'anthropic' | 'openai';
    model: string;
    created_at: Date;
  };
  
  /** AI integration details */
  ai_integration: AIIntegration;
  
  /** Current state of the learning context */
  context_state: LearningContextState;
  
  /** Context creation timestamp */
  created_at: Date;
  
  /** Last modification timestamp */
  updated_at: Date;
  
  /** Context expiration timestamp for data retention */
  expires_at: Date;
}

// =============================================================================
// VALIDATION AND BUSINESS RULES
// =============================================================================

/**
 * Validation rules for AI tutor context management
 */
export interface AITutorContextValidationRules {
  /** AI session validation */
  ai_validation: {
    /** Session ID format validation */
    session_id_pattern: string;
    
    /** Maximum session duration in hours */
    max_session_duration_hours: number;
    
    /** Minimum API response time threshold */
    min_response_time_ms: number;
    
    /** Maximum allowed consecutive errors */
    max_consecutive_errors: number;
  };
  
  /** Interaction history constraints */
  interaction_history: {
    /** Maximum number of interactions to retain */
    max_interactions: number;
    
    /** Minimum effectiveness rating for retention */
    min_effectiveness_threshold: number;
    
    /** Auto-cleanup interval in days */
    cleanup_interval_days: number;
  };
  
  /** Learning profile validation */
  learning_profile: {
    /** Required fields for profile completion */
    required_fields: Array<keyof LearningProfile>;
    
    /** Minimum number of learning strengths */
    min_learning_strengths: number;
    
    /** Maximum attention span in minutes */
    max_attention_span_minutes: number;
  };
  
  /** Data retention compliance */
  retention_policy: {
    /** Default context retention period in days */
    default_retention_days: number;
    
    /** Maximum retention period in days */
    max_retention_days: number;
    
    /** Grace period before auto-deletion in days */
    grace_period_days: number;
  };
}

/**
 * Context state transition rules
 */
export interface ContextStateTransition {
  from: LearningContextState;
  to: LearningContextState;
  conditions: Array<{
    field: keyof AITutorContext | string;
    operator: '>=' | '<=' | '>' | '<' | '==' | '!=' | 'includes' | 'not_includes';
    value: any;
  }>;
  auto_transition?: boolean;
  requires_validation?: boolean;
}

// =============================================================================
// API AND OPERATIONS TYPES
// =============================================================================

/**
 * Input for creating new AI tutor context
 */
export interface CreateAITutorContextInput {
  /** User ID */
  user_id: UUID;
  
  /** Course ID */
  course_id: UUID;
  
  /** Optional session ID for session-specific contexts */
  session_id?: UUID;
  
  /** Context type */
  context_type: AITutorContextType;
  
  /** Initial learning profile data */
  initial_learning_profile?: Partial<LearningProfile>;
  
  /** AI configuration */
  ai_config?: Partial<AIIntegration['config']>;
  
  /** Custom retention period in days */
  custom_retention_days?: number;
}

/**
 * Input for updating AI tutor context
 */
export interface UpdateAITutorContextInput {
  /** Context ID */
  id: UUID;
  
  /** Updated learning profile */
  learning_profile_updates?: Partial<LearningProfile>;
  
  /** New AI interaction to add */
  new_interaction?: Omit<AIInteraction, 'id' | 'timestamp'>;
  
  /** Current context updates */
  current_context_updates?: Partial<CurrentLearningContext>;
  
  /** AI configuration updates */
  ai_config_updates?: Partial<AIIntegration['config']>;
  
  /** State transition */
  new_state?: LearningContextState;
}

/**
 * Query options for AI tutor contexts
 */
export interface AITutorContextQueryOptions {
  /** Filter by user ID */
  user_id?: UUID;
  
  /** Filter by course ID */
  course_id?: UUID;
  
  /** Filter by session ID */
  session_id?: UUID;
  
  /** Filter by context type */
  context_type?: AITutorContextType | AITutorContextType[];
  
  /** Filter by context state */
  context_state?: LearningContextState | LearningContextState[];
  
  /** Filter by creation date range */
  created_after?: Date;
  created_before?: Date;
  
  /** Filter by expiration status */
  include_expired?: boolean;
  
  /** Include interaction history in response */
  include_interactions?: boolean;
  
  /** Limit number of interactions returned */
  max_interactions?: number;
  
  /** Sorting options */
  sort_by?: 'created_at' | 'updated_at' | 'expires_at';
  sort_order?: 'asc' | 'desc';
  
  /** Pagination */
  limit?: number;
  offset?: number;
}

/**
 * AI tutor context analytics and insights
 */
export interface AITutorContextAnalytics {
  /** Context effectiveness metrics */
  effectiveness: {
    /** Average interaction effectiveness rating */
    avg_effectiveness_rating: number;
    
    /** User satisfaction rate */
    satisfaction_rate: number;
    
    /** Learning improvement rate */
    improvement_rate: number;
    
    /** Context adaptation success rate */
    adaptation_success_rate: number;
  };
  
  /** Usage patterns */
  usage_patterns: {
    /** Most active interaction types */
    top_interaction_types: Array<{
      type: AIInteractionType;
      count: number;
      avg_effectiveness: number;
    }>;
    
    /** Peak usage hours */
    peak_hours: number[];
    
    /** Average session duration minutes */
    avg_session_duration_minutes: number;
    
    /** Interaction frequency per day */
    daily_interaction_frequency: number;
  };
  
  /** Learning progress insights */
  learning_insights: {
    /** Skills showing improvement */
    improving_skills: Array<{
      skill: SkillType;
      improvement_rate: number;
      confidence_increase: number;
    }>;
    
    /** Skills needing attention */
    attention_needed_skills: Array<{
      skill: SkillType;
      weakness_severity: 'low' | 'medium' | 'high';
      recommendation: string;
    }>;
    
    /** Learning style effectiveness */
    style_effectiveness: Record<LearningStyle, number>;
    
    /** Optimal study patterns */
    optimal_patterns: {
      best_study_time: StudyTime;
      optimal_session_length: number;
      most_effective_tutoring_mode: TutoringMode;
    };
  };
  
  /** AI integration analytics */
  ai_analytics: {
    /** API performance metrics */
    api_performance: {
      avg_response_time_ms: number;
      success_rate: number;
      error_rate: number;
      uptime_percentage: number;
    };
    
    /** Usage statistics */
    usage_stats: {
      total_requests: number;
      tokens_consumed: number;
      cost_estimate: number;
      efficiency_rating: number;
    };
  };
}

/**
 * Context recommendation system output
 */
export interface ContextRecommendation {
  /** Recommendation type */
  type: 'learning_strategy' | 'difficulty_adjustment' | 'study_schedule' | 'skill_focus' | 'tutoring_mode';
  
  /** Recommendation title */
  title: string;
  
  /** Detailed description */
  description: string;
  
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  /** Expected impact */
  expected_impact: {
    /** Projected improvement in performance */
    performance_improvement: number; // 0.0 to 1.0
    
    /** Estimated time to see results */
    time_to_results_days: number;
    
    /** Confidence in recommendation */
    confidence_level: number; // 0.0 to 1.0
  };
  
  /** Implementation details */
  implementation: {
    /** Required actions */
    required_actions: string[];
    
    /** Estimated implementation time */
    implementation_time_minutes: number;
    
    /** Required resources */
    required_resources: string[];
  };
  
  /** Success metrics */
  success_metrics: Array<{
    metric: string;
    target_value: number;
    measurement_method: string;
  }>;
  
  /** Expiration date for recommendation */
  expires_at: Date;
}

// =============================================================================
// UTILITY TYPES AND CONSTANTS
// =============================================================================

/**
 * Type for creating AI tutor context (omits auto-generated fields)
 */
export type CreateAITutorContextData = Omit<AITutorContext, 
  'id' | 'created_at' | 'updated_at' | 'expires_at'
>;

/**
 * Type for updating AI tutor context (all fields optional except id)
 */
export type UpdateAITutorContextData = Partial<Omit<AITutorContext, 
  'id' | 'created_at' | 'user_id' | 'course_id'
>> & {
  id: UUID;
};

/**
 * AI tutor context summary for lists and quick access
 */
export interface AITutorContextSummary {
  /** Context ID */
  id: UUID;
  
  /** User ID */
  user_id: UUID;
  
  /** Course ID */
  course_id: UUID;
  
  /** Context type */
  context_type: AITutorContextType;
  
  /** Current state */
  context_state: LearningContextState;
  
  /** Last interaction timestamp */
  last_interaction?: Date;
  
  /** Number of interactions */
  interaction_count: number;
  
  /** Context effectiveness rating */
  effectiveness_rating: number;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Expiration timestamp */
  expires_at: Date;
}

/**
 * Batch operations for AI tutor contexts
 */
export interface BatchContextOperation {
  /** Operation type */
  action: 'cleanup_expired' | 'archive_old' | 'optimize_contexts' | 'refresh_ai_sessions';
  
  /** Query filters for batch operation */
  filters: AITutorContextQueryOptions;
  
  /** Dry run mode */
  dry_run?: boolean;
  
  /** Operation parameters */
  parameters?: Record<string, any>;
}

// =============================================================================
// VALIDATION CONSTANTS AND RULES
// =============================================================================

/**
 * Default validation rules for AI tutor contexts
 */
export const DEFAULT_AI_TUTOR_CONTEXT_VALIDATION_RULES: AITutorContextValidationRules = {
  ai_validation: {
    session_id_pattern: '^[a-zA-Z0-9_-]{8,64}$',
    max_session_duration_hours: 24,
    min_response_time_ms: 100,
    max_consecutive_errors: 5
  },
  interaction_history: {
    max_interactions: 100,
    min_effectiveness_threshold: 2.0,
    cleanup_interval_days: 30
  },
  learning_profile: {
    required_fields: ['primary_learning_style', 'preferred_study_time', 'feedback_frequency'],
    min_learning_strengths: 1,
    max_attention_span_minutes: 180
  },
  retention_policy: {
    default_retention_days: 365,
    max_retention_days: 2555, // 7 years
    grace_period_days: 30
  }
};

/**
 * Context state transition rules
 */
export const CONTEXT_STATE_TRANSITIONS: ContextStateTransition[] = [
  {
    from: LearningContextState.ACTIVE,
    to: LearningContextState.LEARNING,
    conditions: [
      { field: 'interaction_history', operator: '>=', value: 5 }
    ],
    auto_transition: true
  },
  {
    from: LearningContextState.LEARNING,
    to: LearningContextState.OPTIMIZED,
    conditions: [
      { field: 'interaction_history', operator: '>=', value: 20 },
      { field: 'effectiveness_rating', operator: '>=', value: 4.0 }
    ],
    auto_transition: true,
    requires_validation: true
  },
  {
    from: LearningContextState.OPTIMIZED,
    to: LearningContextState.EXPIRED,
    conditions: [
      { field: 'expires_at', operator: '<=', value: 'now' }
    ],
    auto_transition: true
  }
];

/**
 * Data retention periods by context type
 */
export const CONTEXT_RETENTION_PERIODS: Record<AITutorContextType, number> = {
  [AITutorContextType.GENERAL]: 365,          // 1 year
  [AITutorContextType.SESSION_SPECIFIC]: 90,  // 3 months
  [AITutorContextType.WEAKNESS_FOCUSED]: 180  // 6 months
};

/**
 * Default tutoring mode configurations
 */
export const DEFAULT_TUTORING_MODES: Record<TutoringMode, Partial<CurrentLearningContext>> = {
  [TutoringMode.ADAPTIVE]: {
    tutoring_mode: TutoringMode.ADAPTIVE,
    active_strategies: ['difficulty_adjustment', 'personalized_feedback', 'progress_tracking']
  },
  [TutoringMode.SOCRATIC]: {
    tutoring_mode: TutoringMode.SOCRATIC,
    active_strategies: ['guided_questioning', 'critical_thinking', 'discovery_learning']
  },
  [TutoringMode.INSTRUCTIONAL]: {
    tutoring_mode: TutoringMode.INSTRUCTIONAL,
    active_strategies: ['direct_instruction', 'structured_learning', 'concept_explanation']
  },
  [TutoringMode.EXPLORATORY]: {
    tutoring_mode: TutoringMode.EXPLORATORY,
    active_strategies: ['hint_system', 'exploration_encouragement', 'mistake_learning']
  },
  [TutoringMode.PRACTICE_FOCUSED]: {
    tutoring_mode: TutoringMode.PRACTICE_FOCUSED,
    active_strategies: ['immediate_feedback', 'repetition', 'skill_drilling']
  }
};

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if context type is valid
 */
export function isValidAITutorContextType(value: unknown): value is AITutorContextType {
  return typeof value === 'string' && 
    Object.values(AITutorContextType).includes(value as AITutorContextType);
}

/**
 * Type guard to check if interaction type is valid
 */
export function isValidAIInteractionType(value: unknown): value is AIInteractionType {
  return typeof value === 'string' && 
    Object.values(AIInteractionType).includes(value as AIInteractionType);
}

/**
 * Type guard to check if context state is valid
 */
export function isValidLearningContextState(value: unknown): value is LearningContextState {
  return typeof value === 'string' && 
    Object.values(LearningContextState).includes(value as LearningContextState);
}

/**
 * Type guard to check if AI session ID is valid
 */
export function isValidAISessionId(sessionId: string): boolean {
  const pattern = new RegExp(DEFAULT_AI_TUTOR_CONTEXT_VALIDATION_RULES.ai_validation.session_id_pattern);
  return pattern.test(sessionId);
}

/**
 * Utility function to calculate context expiration date
 */
export function calculateContextExpiration(
  contextType: AITutorContextType,
  createdAt: Date = new Date()
): Date {
  const retentionDays = CONTEXT_RETENTION_PERIODS[contextType];
  const expirationDate = new Date(createdAt);
  expirationDate.setDate(expirationDate.getDate() + retentionDays);
  return expirationDate;
}

/**
 * Utility function to check if context is expired
 */
export function isContextExpired(context: AITutorContext): boolean {
  return new Date() > context.expires_at;
}

/**
 * Utility function to check if context can transition to new state
 */
export function canTransitionToState(
  context: AITutorContext,
  targetState: LearningContextState
): boolean {
  const validTransitions = CONTEXT_STATE_TRANSITIONS.filter(
    transition => transition.from === context.context_state && transition.to === targetState
  );
  
  return validTransitions.some(transition => {
    return transition.conditions.every(condition => {
      const fieldValue = getNestedProperty(context, condition.field);
      return evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  });
}

/**
 * Helper function to get nested property value
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Helper function to evaluate condition
 */
function evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
  switch (operator) {
    case '>=': return fieldValue >= expectedValue;
    case '<=': return fieldValue <= expectedValue;
    case '>': return fieldValue > expectedValue;
    case '<': return fieldValue < expectedValue;
    case '==': return fieldValue === expectedValue;
    case '!=': return fieldValue !== expectedValue;
    case 'includes': return Array.isArray(fieldValue) && fieldValue.includes(expectedValue);
    case 'not_includes': return Array.isArray(fieldValue) && !fieldValue.includes(expectedValue);
    default: return false;
  }
}

/**
 * Utility function to sanitize interaction history (keep only recent/effective ones)
 */
export function sanitizeInteractionHistory(
  interactions: AIInteraction[],
  maxInteractions: number = DEFAULT_AI_TUTOR_CONTEXT_VALIDATION_RULES.interaction_history.max_interactions,
  minEffectiveness: number = DEFAULT_AI_TUTOR_CONTEXT_VALIDATION_RULES.interaction_history.min_effectiveness_threshold
): AIInteraction[] {
  return interactions
    .filter(interaction => 
      !interaction.effectiveness_rating || interaction.effectiveness_rating >= minEffectiveness
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxInteractions);
}

/**
 * Utility function to generate context recommendations
 */
export function generateContextRecommendations(
  context: AITutorContext,
  analytics: AITutorContextAnalytics
): ContextRecommendation[] {
  const recommendations: ContextRecommendation[] = [];
  
  // Add recommendations based on analytics
  if (analytics.effectiveness.satisfaction_rate < 0.7) {
    recommendations.push({
      type: 'tutoring_mode',
      title: 'Consider changing tutoring approach',
      description: 'User satisfaction is below optimal levels. Try a different tutoring mode.',
      priority: 'high',
      expected_impact: {
        performance_improvement: 0.2,
        time_to_results_days: 7,
        confidence_level: 0.8
      },
      implementation: {
        required_actions: ['Assess current mode effectiveness', 'Switch to adaptive mode', 'Monitor user feedback'],
        implementation_time_minutes: 15,
        required_resources: ['User feedback data', 'Performance metrics']
      },
      success_metrics: [
        {
          metric: 'satisfaction_rate',
          target_value: 0.8,
          measurement_method: 'User feedback scoring'
        }
      ],
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    });
  }
  
  return recommendations;
}

// Re-export commonly used types for convenience
export type { UUID } from './exam-session';
export type { PreferredLanguage, LearningStyle, StudyTime, FeedbackFrequency } from './user-profile';
export type { CourseLanguage, CourseLevel, SkillType } from './course';