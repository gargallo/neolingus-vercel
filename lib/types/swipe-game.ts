/**
 * Swipe de la Norma Game - Type Definitions
 *
 * Comprehensive TypeScript interfaces for the swipe-based language normalization game.
 * Based on the specification from docs/games/swiper/NeoLingus_Swipe_de_la_Norma_Spec.md
 */

// =============================================================================
// CORE GAME TYPES
// =============================================================================

/** Supported languages in the game */
export type Language = 'es' | 'val' | 'en';

/** CEFR language proficiency levels */
export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

/** Certification exam providers */
export type ExamProvider = 'EOI' | 'Cambridge' | 'DELE' | 'JQCV';

/** Language skills being tested */
export type Skill = 'W' | 'R' | 'Med' | 'S';

/** User's swipe choice for an item */
export type UserChoice = 'apta' | 'no_apta';

/** Input methods for tracking user interaction */
export type InputMethod = 'keyboard' | 'mouse' | 'touch';

/** Game session durations in seconds */
export type SessionDuration = 20 | 30 | 60 | 120;

// =============================================================================
// SWIPE ITEM INTERFACES
// =============================================================================

/** Override rules for specific exam/skill combinations */
export interface RuleOverride {
  exam: ExamProvider;
  skill: Skill;
  exam_safe: boolean;
  note?: string;
}

/** Core swipe item structure */
export interface SwipeItem {
  id: string;
  term: string;
  lemma?: string;
  lang: Language;
  level: Level;
  exam: ExamProvider;
  skill_scope: Skill[];
  tags: string[];
  exam_safe: boolean;
  example?: string;
  explanation_short?: string;
  suggested?: string;
  rule_overrides: RuleOverride[];
  difficulty_elo: number;
  content_version: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Simplified item for game display */
export interface SwipeItemDisplay {
  id: string;
  term: string;
  example?: string;
  difficulty_elo: number;
  tags: string[];
}

/** Request structure for getting a deck of items */
export interface DeckRequest {
  lang: Language;
  level: Level;
  exam: ExamProvider;
  skill: Skill;
  size?: number;
}

/** Response structure for deck endpoint */
export interface DeckResponse {
  session_suggested_size: number;
  items: SwipeItemDisplay[];
}

// =============================================================================
// GAME SESSION INTERFACES
// =============================================================================

/** Game configuration for a session */
export interface GameConfig {
  lang: Language;
  level: Level;
  exam: ExamProvider;
  skill: Skill;
  duration_s: SessionDuration;
}

/** Game session data structure */
export interface SwipeSession {
  id: string;
  user_id: string;
  config: GameConfig;
  duration_s: SessionDuration;
  started_at: string;
  ended_at?: string;
  score_total?: number;
  answers_total?: number;
  correct?: number;
  incorrect?: number;
  accuracy_pct?: number;
  items_per_min?: number;
  streak_max?: number;
  avg_latency_ms?: number;
  error_buckets?: Record<string, number>;
  created_at: string;
  updated_at: string;
}

/** Request to start a new session */
export interface StartSessionRequest {
  user_id: string;
  lang: Language;
  level: Level;
  exam: ExamProvider;
  skill: Skill;
  duration_s: SessionDuration;
}

/** Response when starting a session */
export interface StartSessionResponse {
  session_id: string;
  deck_size: number;
  started_at: string;
}

/** Session summary for end-of-game display */
export interface SessionSummary {
  score_total: number;
  answers_total: number;
  correct: number;
  incorrect: number;
  accuracy_pct: number;
  items_per_min: number;
  streak_max?: number;
  error_buckets?: Record<string, number>;
}

/** Request to end a session */
export interface EndSessionRequest {
  session_id: string;
  ended_at: string;
  summary: SessionSummary;
}

// =============================================================================
// ANSWER TRACKING INTERFACES
// =============================================================================

/** Individual answer event */
export interface SwipeAnswer {
  id: string;
  session_id: string;
  user_id: string;
  item_id: string;
  user_choice: UserChoice;
  correct: boolean;
  score_delta: number;
  latency_ms: number;
  input_method?: InputMethod;
  shown_at: string;
  answered_at: string;
  item_difficulty?: number;
  app_version?: string;
  content_version?: string;
  suspicious: boolean;
  tags: string[];
  created_at: string;
}

/** Request to submit an answer */
export interface SubmitAnswerRequest {
  answer_id: string;
  session_id: string;
  user_id: string;
  item_id: string;
  lang: Language;
  level: Level;
  exam: ExamProvider;
  skill: Skill;
  tags: string[];
  user_choice: UserChoice;
  correct: boolean;
  score_delta: number;
  shown_at: string;
  answered_at: string;
  latency_ms: number;
  input_method?: InputMethod;
  item_difficulty?: number;
  content_version?: string;
  app_version?: string;
  suspicious: boolean;
}

// =============================================================================
// ELO RATING SYSTEM INTERFACES
// =============================================================================

/** User skill rating per category */
export interface SwipeUserSkill {
  user_id: string;
  lang: Language;
  exam: ExamProvider;
  skill: Skill;
  tag: string;
  rating_elo: number;
  rd: number; // Rating deviation
  last_update: string;
  created_at: string;
}

/** Item statistics for difficulty calibration */
export interface SwipeItemStats {
  item_id: string;
  plays: number;
  correct: number;
  incorrect: number;
  avg_latency_ms: number;
  difficulty_elo: number;
  last_played?: string;
  created_at: string;
  updated_at: string;
}

/** ELO calculation parameters */
export interface EloParams {
  user_rating: number;
  item_rating: number;
  k_factor: number;
  correct: boolean;
}

/** ELO calculation result */
export interface EloResult {
  user_delta: number;
  item_delta: number;
  expected_score: number;
}

// =============================================================================
// ANALYTICS AND RECOMMENDATIONS
// =============================================================================

/** User statistics request parameters */
export interface UserStatsRequest {
  user_id: string;
  span: '7d' | '30d';
}

/** Aggregated user statistics */
export interface UserStats {
  total_sessions: number;
  total_answers: number;
  overall_accuracy: number;
  accuracy_by_tag: Record<string, number>;
  false_positives: number;
  false_negatives: number;
  items_per_min_by_duration: Record<SessionDuration, number>;
  streak_stats: {
    current: number;
    max: number;
    average: number;
  };
  improvement_trend: {
    accuracy_change: number;
    speed_change: number;
  };
}

/** Recommendation for next practice pack */
export interface Recommendation {
  next_pack_tags: string[];
  mini_writing_prompt?: string;
  deadline_suggested_days: number;
  rationale: string;
}

/** Complete recommendations response */
export interface RecommendationsResponse {
  items: SwipeItemDisplay[];
  recommendation: Recommendation;
  estimated_difficulty: number;
}

// =============================================================================
// FRONTEND COMPONENT INTERFACES
// =============================================================================

/** Props for the main swipe card component */
export interface SwipeCardProps {
  item: SwipeItemDisplay;
  onSwipe: (choice: UserChoice) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  correctAnswer?: boolean;
  explanation?: string;
  suggested?: string;
}

/** Props for the game timer component */
export interface GameTimerProps {
  duration: SessionDuration;
  started: boolean;
  onTimeUp: () => void;
  onPause?: () => void;
  onResume?: () => void;
}

/** Props for the score display component */
export interface ScoreDisplayProps {
  score: number;
  streak: number;
  answered: number;
  correct: number;
  accuracy: number;
  timeRemaining: number;
}

/** Props for game controls */
export interface GameControlsProps {
  onLeftSwipe: () => void;
  onRightSwipe: () => void;
  onPause: () => void;
  disabled?: boolean;
  showHelp?: boolean;
}

/** Props for game setup/configuration */
export interface GameSetupProps {
  onStartGame: (config: GameConfig) => void;
  availableLanguages: Language[];
  availableLevels: Level[];
  availableExams: ExamProvider[];
  availableSkills: Skill[];
  defaultConfig?: Partial<GameConfig>;
}

/** Props for game results display */
export interface GameResultsProps {
  session: SwipeSession;
  stats: UserStats;
  recommendations: RecommendationsResponse;
  onPlayAgain: () => void;
  onViewDetails: () => void;
  onNextPack: () => void;
}

// =============================================================================
// GAME STATE MANAGEMENT
// =============================================================================

/** Current game state */
export interface GameState {
  phase: 'setup' | 'playing' | 'paused' | 'finished';
  session?: SwipeSession;
  currentItem?: SwipeItemDisplay;
  deck: SwipeItemDisplay[];
  deckPosition: number;
  score: number;
  streak: number;
  currentStreak: number;
  answers: SwipeAnswer[];
  timeRemaining: number;
  isPaused: boolean;
  showFeedback: boolean;
  lastAnswer?: {
    correct: boolean;
    explanation?: string;
    suggested?: string;
  };
}

/** Game actions for state management */
export type GameAction =
  | { type: 'START_GAME'; config: GameConfig; deck: SwipeItemDisplay[] }
  | { type: 'NEXT_ITEM' }
  | { type: 'SUBMIT_ANSWER'; choice: UserChoice; correct: boolean; score_delta: number }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'TIME_TICK'; timeRemaining: number }
  | { type: 'END_GAME'; summary: SessionSummary }
  | { type: 'RESET_GAME' };

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/** Standard API error response */
export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

/** Generic API response wrapper */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/** Health check response */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version?: string;
  dependencies?: Record<string, {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime?: number;
    error?: string;
  }>;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Game configuration validation result */
export interface ConfigValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Timing utilities for performance monitoring */
export interface TimingMetrics {
  render_time_ms: number;
  interaction_latency_ms: number;
  api_response_time_ms: number;
  total_session_time_ms: number;
}

/** Accessibility configuration */
export interface AccessibilityConfig {
  high_contrast: boolean;
  reduce_motion: boolean;
  keyboard_navigation: boolean;
  screen_reader_support: boolean;
  font_size_multiplier: number;
}

/** Content version information */
export interface ContentVersion {
  version: string;
  lang: Language;
  release_date: string;
  items_count: number;
  changelog?: string[];
}

// =============================================================================
// CONSTANTS AND ENUMS
// =============================================================================

/** Default ELO rating for new users and items */
export const DEFAULT_ELO_RATING = 1500;

/** K-factor range for ELO calculations */
export const ELO_K_FACTOR_RANGE = { min: 16, max: 24 };

/** Minimum latency threshold to detect suspicious activity */
export const MIN_LATENCY_THRESHOLD_MS = 250;

/** Score deltas for correct/incorrect answers */
export const SCORE_DELTAS = {
  CORRECT: 1,
  INCORRECT: -1.33
} as const;

/** Session duration options in seconds */
export const SESSION_DURATIONS = [20, 30, 60, 120] as const;

/** Performance thresholds */
export const PERFORMANCE_THRESHOLDS = {
  TARGET_RESPONSE_TIME_MS: 250,
  TARGET_FPS: 60,
  ACCURACY_IMPROVEMENT_TARGET: 0.25, // 25% improvement
  RETENTION_TARGET_SESSIONS: 30,
  RETENTION_TARGET_DAYS: 5
} as const;

// =============================================================================
// TYPE GUARDS
// =============================================================================

/** Type guard for Language */
export function isLanguage(value: string): value is Language {
  return ['es', 'val', 'en'].includes(value);
}

/** Type guard for Level */
export function isLevel(value: string): value is Level {
  return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(value);
}

/** Type guard for ExamProvider */
export function isExamProvider(value: string): value is ExamProvider {
  return ['EOI', 'Cambridge', 'DELE', 'JQCV'].includes(value);
}

/** Type guard for Skill */
export function isSkill(value: string): value is Skill {
  return ['W', 'R', 'Med', 'S'].includes(value);
}

/** Type guard for UserChoice */
export function isUserChoice(value: string): value is UserChoice {
  return ['apta', 'no_apta'].includes(value);
}

/** Type guard for SessionDuration */
export function isSessionDuration(value: number): value is SessionDuration {
  return [20, 30, 60, 120].includes(value);
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  // Core types
  SwipeItem,
  SwipeItemDisplay,
  SwipeSession,
  SwipeAnswer,
  SwipeUserSkill,
  SwipeItemStats,

  // Request/Response types
  DeckRequest,
  DeckResponse,
  StartSessionRequest,
  StartSessionResponse,
  EndSessionRequest,
  SubmitAnswerRequest,
  UserStatsRequest,
  UserStats,
  RecommendationsResponse,

  // Component props
  SwipeCardProps,
  GameTimerProps,
  ScoreDisplayProps,
  GameControlsProps,
  GameSetupProps,
  GameResultsProps,

  // State management
  GameState,
  GameAction,

  // Utility types
  ApiResponse,
  ApiError,
  HealthStatus,
  ConfigValidation,
  TimingMetrics,
  AccessibilityConfig,
  ContentVersion
};

export {
  // Constants
  DEFAULT_ELO_RATING,
  ELO_K_FACTOR_RANGE,
  MIN_LATENCY_THRESHOLD_MS,
  SCORE_DELTAS,
  SESSION_DURATIONS,
  PERFORMANCE_THRESHOLDS,

  // Type guards
  isLanguage,
  isLevel,
  isExamProvider,
  isSkill,
  isUserChoice,
  isSessionDuration
};