/**
 * Swipe de la Norma Game - Zod Validation Schemas
 *
 * Comprehensive validation schemas for all API requests, responses, and data structures
 * used in the swipe-based language normalization game.
 */

import { z } from 'zod';
import type {
  Language,
  Level,
  ExamProvider,
  Skill,
  UserChoice,
  InputMethod,
  SessionDuration
} from '@/lib/types/swipe-game';

// =============================================================================
// BASIC TYPE SCHEMAS
// =============================================================================

/** Language validation schema */
const LanguageSchema = z.enum(['es', 'val', 'en'] as const, {
  errorMap: () => ({ message: 'Language must be one of: es, val, en' })
});

/** CEFR level validation schema */
const LevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const, {
  errorMap: () => ({ message: 'Level must be a valid CEFR level: A1, A2, B1, B2, C1, C2' })
});

/** Exam provider validation schema */
const ExamProviderSchema = z.enum(['EOI', 'Cambridge', 'DELE', 'JQCV'] as const, {
  errorMap: () => ({ message: 'Exam provider must be one of: EOI, Cambridge, DELE, JQCV' })
});

/** Skill validation schema */
const SkillSchema = z.enum(['reading', 'writing', 'listening', 'speaking', 'vocabulary', 'grammar'] as const, {
  errorMap: () => ({ message: 'Skill must be one of: reading, writing, listening, speaking, vocabulary, grammar' })
});

/** User choice validation schema */
const UserChoiceSchema = z.enum(['apta', 'no_apta'] as const, {
  errorMap: () => ({ message: 'User choice must be either "apta" or "no_apta"' })
});

/** Input method validation schema */
const InputMethodSchema = z.enum(['keyboard', 'mouse', 'touch'] as const).optional();

/** Session duration validation schema */
const SessionDurationSchema = z.number().refine((val) => [20, 30, 60, 120].includes(val), {
  message: 'Session duration must be one of: 20, 30, 60, or 120 seconds'
});

/** UUID validation schema */
const UuidSchema = z.string().uuid({
  message: 'Must be a valid UUID'
});

/** Non-empty string schema */
const NonEmptyStringSchema = z.string().min(1, {
  message: 'String cannot be empty'
});

/** Positive integer schema */
const PositiveIntegerSchema = z.number().int().positive({
  message: 'Must be a positive integer'
});

/** Non-negative integer schema */
const NonNegativeIntegerSchema = z.number().int().min(0, {
  message: 'Must be a non-negative integer'
});

/** ELO rating schema (typically 800-2400 range) */
const EloRatingSchema = z.number().int().min(800).max(2400).default(1500);

/** Latency in milliseconds (0-10000ms reasonable range) */
const LatencySchema = z.number().int().min(0).max(10000, {
  message: 'Latency must be between 0 and 10000 milliseconds'
});

/** Score delta schema (between -2 and +2) */
const ScoreDeltaSchema = z.number().min(-2).max(2, {
  message: 'Score delta must be between -2 and +2'
});

/** Percentage schema (0-100) */
const PercentageSchema = z.number().min(0).max(100, {
  message: 'Percentage must be between 0 and 100'
});

/** ISO timestamp schema */
const TimestampSchema = z.string().datetime({
  message: 'Must be a valid ISO timestamp'
});

// =============================================================================
// SWIPE ITEM SCHEMAS
// =============================================================================

/** Rule override schema for exam/skill specific rules */
const RuleOverrideSchema = z.object({
  exam: ExamProviderSchema,
  skill: SkillSchema,
  exam_safe: z.boolean(),
  note: z.string().optional()
});

/** Complete swipe item schema */
const SwipeItemSchema = z.object({
  id: NonEmptyStringSchema,
  term: NonEmptyStringSchema,
  lemma: z.string().optional(),
  lang: LanguageSchema,
  level: LevelSchema,
  exam: ExamProviderSchema,
  skill_scope: z.array(SkillSchema).min(1, {
    message: 'At least one skill must be specified'
  }),
  tags: z.array(z.string()).default([]),
  exam_safe: z.boolean(),
  example: z.string().optional(),
  explanation_short: z.string().optional(),
  suggested: z.string().optional(),
  rule_overrides: z.array(RuleOverrideSchema).default([]),
  difficulty_elo: EloRatingSchema,
  content_version: NonEmptyStringSchema,
  active: z.boolean().default(true),
  created_at: TimestampSchema,
  updated_at: TimestampSchema
});

/** Simplified item for game display */
const SwipeItemDisplaySchema = z.object({
  id: NonEmptyStringSchema,
  term: NonEmptyStringSchema,
  example: z.string().optional(),
  difficulty_elo: EloRatingSchema,
  tags: z.array(z.string()).default([])
});

/** Deck request schema */
const DeckRequestSchema = z.object({
  lang: LanguageSchema,
  level: LevelSchema,
  exam: ExamProviderSchema,
  skill: SkillSchema,
  size: PositiveIntegerSchema.max(100).default(50)
});

/** Deck response schema */
const DeckResponseSchema = z.object({
  session_suggested_size: PositiveIntegerSchema,
  items: z.array(SwipeItemDisplaySchema)
});

// =============================================================================
// GAME SESSION SCHEMAS
// =============================================================================

/** Game configuration schema */
const GameConfigSchema = z.object({
  lang: LanguageSchema,
  level: LevelSchema,
  exam: ExamProviderSchema,
  skill: SkillSchema,
  duration_s: SessionDurationSchema
});

/** Client session start request schema (without user_id) */
const ClientSessionStartRequestSchema = z.object({
  lang: LanguageSchema,
  level: LevelSchema,
  exam: ExamProviderSchema,
  skill: SkillSchema,
  duration_s: SessionDurationSchema
});

/** Start session request schema (internal use with user_id) */
const StartSessionRequestSchema = z.object({
  user_id: NonEmptyStringSchema,
  lang: LanguageSchema,
  level: LevelSchema,
  exam: ExamProviderSchema,
  skill: SkillSchema,
  duration_s: SessionDurationSchema
});

/** Start session response schema */
const StartSessionResponseSchema = z.object({
  session_id: NonEmptyStringSchema,
  deck_size: PositiveIntegerSchema,
  started_at: TimestampSchema
});

/** Session summary schema */
const SessionSummarySchema = z.object({
  score_total: z.number(),
  answers_total: NonNegativeIntegerSchema,
  correct: NonNegativeIntegerSchema,
  incorrect: NonNegativeIntegerSchema,
  accuracy_pct: PercentageSchema,
  items_per_min: z.number().min(0),
  streak_max: NonNegativeIntegerSchema.optional(),
  error_buckets: z.record(z.string(), NonNegativeIntegerSchema).optional()
});

/** End session request schema */
const EndSessionRequestSchema = z.object({
  session_id: NonEmptyStringSchema,
  ended_at: TimestampSchema,
  summary: SessionSummarySchema
});

/** Complete swipe session schema */
const SwipeSessionSchema = z.object({
  id: NonEmptyStringSchema,
  user_id: NonEmptyStringSchema,
  config: GameConfigSchema,
  duration_s: SessionDurationSchema,
  started_at: TimestampSchema,
  ended_at: TimestampSchema.optional(),
  score_total: z.number().optional(),
  answers_total: NonNegativeIntegerSchema.optional(),
  correct: NonNegativeIntegerSchema.optional(),
  incorrect: NonNegativeIntegerSchema.optional(),
  accuracy_pct: PercentageSchema.optional(),
  items_per_min: z.number().min(0).optional(),
  streak_max: NonNegativeIntegerSchema.optional(),
  avg_latency_ms: NonNegativeIntegerSchema.optional(),
  error_buckets: z.record(z.string(), NonNegativeIntegerSchema).optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema
});

// =============================================================================
// ANSWER TRACKING SCHEMAS
// =============================================================================

/** Submit answer request schema */
const SubmitAnswerRequestSchema = z.object({
  answer_id: NonEmptyStringSchema,
  session_id: NonEmptyStringSchema,
  user_id: NonEmptyStringSchema,
  item_id: NonEmptyStringSchema,
  lang: LanguageSchema,
  level: LevelSchema,
  exam: ExamProviderSchema,
  skill: SkillSchema,
  tags: z.array(z.string()).default([]),
  user_choice: UserChoiceSchema,
  correct: z.boolean(),
  score_delta: ScoreDeltaSchema,
  shown_at: TimestampSchema,
  answered_at: TimestampSchema,
  latency_ms: LatencySchema,
  input_method: InputMethodSchema,
  item_difficulty: EloRatingSchema.optional(),
  content_version: z.string().optional(),
  app_version: z.string().optional(),
  suspicious: z.boolean().default(false)
}).refine(
  (data) => new Date(data.answered_at) >= new Date(data.shown_at),
  {
    message: 'Answer time must be after or equal to shown time',
    path: ['answered_at']
  }
).refine(
  (data) => {
    const latency = new Date(data.answered_at).getTime() - new Date(data.shown_at).getTime();
    return Math.abs(latency - data.latency_ms) < 1000; // Allow 1 second tolerance
  },
  {
    message: 'Latency calculation must match timestamp difference',
    path: ['latency_ms']
  }
);

/** Complete swipe answer schema */
const SwipeAnswerSchema = z.object({
  id: NonEmptyStringSchema,
  session_id: NonEmptyStringSchema,
  user_id: NonEmptyStringSchema,
  item_id: NonEmptyStringSchema,
  user_choice: UserChoiceSchema,
  correct: z.boolean(),
  score_delta: ScoreDeltaSchema,
  latency_ms: LatencySchema,
  input_method: InputMethodSchema,
  shown_at: TimestampSchema,
  answered_at: TimestampSchema,
  item_difficulty: EloRatingSchema.optional(),
  app_version: z.string().optional(),
  content_version: z.string().optional(),
  suspicious: z.boolean(),
  tags: z.array(z.string()).default([]),
  created_at: TimestampSchema
});

// =============================================================================
// ELO RATING SCHEMAS
// =============================================================================

/** User skill rating schema */
const SwipeUserSkillSchema = z.object({
  user_id: NonEmptyStringSchema,
  lang: LanguageSchema,
  exam: ExamProviderSchema,
  skill: SkillSchema,
  tag: NonEmptyStringSchema,
  rating_elo: EloRatingSchema,
  rd: z.number().min(0).max(500).default(350), // Rating deviation
  last_update: TimestampSchema,
  created_at: TimestampSchema
});

/** Item statistics schema */
const SwipeItemStatsSchema = z.object({
  item_id: NonEmptyStringSchema,
  plays: NonNegativeIntegerSchema,
  correct: NonNegativeIntegerSchema,
  incorrect: NonNegativeIntegerSchema,
  avg_latency_ms: NonNegativeIntegerSchema,
  difficulty_elo: EloRatingSchema,
  last_played: TimestampSchema.optional(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema
});

/** ELO calculation parameters schema */
const EloParamsSchema = z.object({
  user_rating: EloRatingSchema,
  item_rating: EloRatingSchema,
  k_factor: z.number().int().min(10).max(40).default(20),
  correct: z.boolean()
});

/** ELO calculation result schema */
const EloResultSchema = z.object({
  user_delta: z.number().int(),
  item_delta: z.number().int(),
  expected_score: z.number().min(0).max(1)
});

// =============================================================================
// ANALYTICS AND RECOMMENDATIONS SCHEMAS
// =============================================================================

/** User statistics request schema */
const UserStatsRequestSchema = z.object({
  user_id: NonEmptyStringSchema,
  span: z.enum(['7d', '30d'] as const).default('7d')
});

/** User statistics response schema */
const UserStatsSchema = z.object({
  total_sessions: NonNegativeIntegerSchema,
  total_answers: NonNegativeIntegerSchema,
  overall_accuracy: PercentageSchema,
  accuracy_by_tag: z.record(z.string(), PercentageSchema),
  false_positives: NonNegativeIntegerSchema,
  false_negatives: NonNegativeIntegerSchema,
  items_per_min_by_duration: z.record(z.string(), z.number().min(0)),
  streak_stats: z.object({
    current: NonNegativeIntegerSchema,
    max: NonNegativeIntegerSchema,
    average: z.number().min(0)
  }),
  improvement_trend: z.object({
    accuracy_change: z.number(),
    speed_change: z.number()
  })
});

/** Recommendation schema */
const RecommendationSchema = z.object({
  next_pack_tags: z.array(z.string()),
  mini_writing_prompt: z.string().optional(),
  deadline_suggested_days: PositiveIntegerSchema,
  rationale: NonEmptyStringSchema
});

/** Recommendations response schema */
const RecommendationsResponseSchema = z.object({
  items: z.array(SwipeItemDisplaySchema),
  recommendation: RecommendationSchema,
  estimated_difficulty: z.number().min(0).max(1)
});

// =============================================================================
// API RESPONSE SCHEMAS
// =============================================================================

/** Standard API error schema */
const ApiErrorSchema = z.object({
  error: NonEmptyStringSchema,
  message: NonEmptyStringSchema,
  details: z.record(z.any()).optional(),
  timestamp: TimestampSchema
});

/** Generic API response schema */
const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: ApiErrorSchema.optional()
  }).refine(
    (data) => data.success ? data.data !== undefined : data.error !== undefined,
    {
      message: 'Response must have data when success=true or error when success=false'
    }
  );

/** Health status schema */
const HealthStatusSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy'] as const),
  timestamp: TimestampSchema,
  version: z.string().optional(),
  dependencies: z.record(
    z.string(),
    z.object({
      status: z.enum(['healthy', 'degraded', 'unhealthy'] as const),
      responseTime: z.number().min(0).optional(),
      error: z.string().optional()
    })
  ).optional()
});

// =============================================================================
// GAME STATE SCHEMAS
// =============================================================================

/** Game state schema */
const GameStateSchema = z.object({
  phase: z.enum(['setup', 'playing', 'paused', 'finished'] as const),
  session: SwipeSessionSchema.optional(),
  currentItem: SwipeItemDisplaySchema.optional(),
  deck: z.array(SwipeItemDisplaySchema),
  deckPosition: NonNegativeIntegerSchema,
  score: z.number(),
  streak: NonNegativeIntegerSchema,
  currentStreak: NonNegativeIntegerSchema,
  answers: z.array(SwipeAnswerSchema),
  timeRemaining: NonNegativeIntegerSchema,
  isPaused: z.boolean(),
  showFeedback: z.boolean(),
  lastAnswer: z.object({
    correct: z.boolean(),
    explanation: z.string().optional(),
    suggested: z.string().optional()
  }).optional()
});

// =============================================================================
// CONFIGURATION SCHEMAS
// =============================================================================

/** Accessibility configuration schema */
const AccessibilityConfigSchema = z.object({
  high_contrast: z.boolean().default(false),
  reduce_motion: z.boolean().default(false),
  keyboard_navigation: z.boolean().default(true),
  screen_reader_support: z.boolean().default(true),
  font_size_multiplier: z.number().min(0.5).max(2.0).default(1.0)
});

/** Content version schema */
const ContentVersionSchema = z.object({
  version: NonEmptyStringSchema,
  lang: LanguageSchema,
  release_date: TimestampSchema,
  items_count: PositiveIntegerSchema,
  changelog: z.array(z.string()).optional()
});

/** Config validation result schema */
const ConfigValidationSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string())
});

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/** Validate and parse a swipe item */
function validateSwipeItem(data: unknown) {
  return SwipeItemSchema.safeParse(data);
}

/** Validate and parse a game configuration */
function validateGameConfig(data: unknown) {
  return GameConfigSchema.safeParse(data);
}

/** Validate and parse a session start request */
function validateStartSessionRequest(data: unknown) {
  return StartSessionRequestSchema.safeParse(data);
}

/** Validate and parse an answer submission */
function validateSubmitAnswer(data: unknown) {
  return SubmitAnswerRequestSchema.safeParse(data);
}

/** Validate and parse user stats request */
function validateUserStatsRequest(data: unknown) {
  return UserStatsRequestSchema.safeParse(data);
}

/** Validate suspicious activity based on latency */
function validateSuspiciousActivity(latency_ms: number, threshold_ms: number = 250): boolean {
  return latency_ms < threshold_ms;
}

/** Custom error formatter for validation errors */
function formatValidationError(error: z.ZodError): string {
  return error.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join('; ');
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Basic type schemas
  LanguageSchema,
  LevelSchema,
  ExamProviderSchema,
  SkillSchema,
  UserChoiceSchema,
  InputMethodSchema,
  SessionDurationSchema,
  UuidSchema,
  NonEmptyStringSchema,
  PositiveIntegerSchema,
  NonNegativeIntegerSchema,
  EloRatingSchema,
  LatencySchema,
  ScoreDeltaSchema,
  PercentageSchema,
  TimestampSchema,

  // Entity schemas
  SwipeItemSchema,
  SwipeItemDisplaySchema,
  SwipeSessionSchema,
  SwipeAnswerSchema,
  SwipeUserSkillSchema,
  SwipeItemStatsSchema,

  // Request/Response schemas
  DeckRequestSchema,
  DeckResponseSchema,
  ClientSessionStartRequestSchema,
  StartSessionRequestSchema,
  StartSessionResponseSchema,
  EndSessionRequestSchema,
  SubmitAnswerRequestSchema,
  UserStatsRequestSchema,
  UserStatsSchema,
  RecommendationsResponseSchema,

  // Game state schemas
  GameConfigSchema,
  GameStateSchema,
  SessionSummarySchema,

  // API schemas
  ApiResponseSchema,
  ApiErrorSchema,
  HealthStatusSchema,

  // Configuration schemas
  AccessibilityConfigSchema,
  ContentVersionSchema,
  ConfigValidationSchema,

  // ELO schemas
  EloParamsSchema,
  EloResultSchema,

  // Utility functions
  validateSwipeItem,
  validateGameConfig,
  validateStartSessionRequest,
  validateSubmitAnswer,
  validateUserStatsRequest,
  validateSuspiciousActivity,
  formatValidationError
};