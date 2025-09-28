/**
 * Zod Validation Schemas for Scoring Engine
 * Provides comprehensive validation for all scoring-related data structures
 */

import { z } from 'zod';

// Common enums and constants
export const ScoringProviderSchema = z.enum(['EOI', 'JQCV', 'Cambridge', 'Cervantes']);
export const CEFRLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
export const TaskTypeSchema = z.enum(['reading', 'listening', 'use_of_english', 'writing', 'speaking', 'mediation']);
export const AttemptStatusSchema = z.enum(['queued', 'processing', 'scored', 'failed']);
export const EventTypeSchema = z.enum(['created', 'queued', 'started', 'scored', 'failed', 're_scored', 'appeal']);

// Base types
export type ScoringProvider = z.infer<typeof ScoringProviderSchema>;
export type CEFRLevel = z.infer<typeof CEFRLevelSchema>;
export type TaskType = z.infer<typeof TaskTypeSchema>;
export type AttemptStatus = z.infer<typeof AttemptStatusSchema>;
export type EventType = z.infer<typeof EventTypeSchema>;

// Rubric Band Schema
export const RubricBandSchema = z.object({
  score: z.number().min(0),
  descriptor: z.string().min(1).max(1000),
  examples: z.array(z.string()).optional()
});

// Rubric Criterion Schema
export const RubricCriterionSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  weight: z.number().min(0).max(1),
  bands: z.array(RubricBandSchema).min(1).max(10)
});

// Rubric JSON Schema (for rubrics table)
export const RubricJsonSchema = z.object({
  version: z.string().min(1).max(50),
  provider: ScoringProviderSchema,
  level: CEFRLevelSchema,
  task: TaskTypeSchema,
  criteria: z.array(RubricCriterionSchema).min(1).max(10),
  total_score: z.object({
    min: z.number().min(0),
    max: z.number().min(1),
    pass_threshold: z.number().min(0).optional()
  }),
  instructions: z.string().max(2000).optional(),
  time_limit: z.number().min(0).optional() // in seconds
});

// Scoring Rubric Database Schema
export const ScoringRubricSchema = z.object({
  id: z.string().uuid(),
  provider: ScoringProviderSchema,
  level: CEFRLevelSchema,
  task: TaskTypeSchema,
  version: z.string().min(1).max(50),
  json: RubricJsonSchema,
  is_active: z.boolean().default(true),
  archived_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

// Create Rubric Input Schema
export const CreateRubricSchema = z.object({
  provider: ScoringProviderSchema,
  level: CEFRLevelSchema,
  task: TaskTypeSchema,
  version: z.string().min(1).max(50),
  json: RubricJsonSchema,
  is_active: z.boolean().default(true)
});

// Scoring Payload Schemas for different task types
export const WritingPayloadSchema = z.object({
  text: z.string().min(50).max(10000),
  prompt: z.string().min(1).max(2000),
  task_type: z.enum(['essay', 'email', 'letter', 'report', 'review', 'article']).optional(),
  word_limit: z.number().min(0).optional(),
  source_text: z.string().max(5000).optional() // for summary tasks
});

export const SpeakingPayloadSchema = z.object({
  audio_url: z.string().url(),
  transcript: z.string().max(5000).optional(),
  duration_seconds: z.number().min(1).max(1800),
  prompt: z.string().min(1).max(2000),
  task_type: z.enum(['monologue', 'interaction', 'presentation', 'roleplay']).optional()
});

export const ReadingPayloadSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  text_passages: z.array(z.string()).min(1).max(10),
  question_types: z.array(z.enum(['multiple_choice', 'true_false', 'gap_fill', 'matching', 'short_answer'])).optional()
});

export const ListeningPayloadSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  audio_urls: z.array(z.string().url()).min(1).max(10),
  transcripts: z.array(z.string()).optional(),
  question_types: z.array(z.enum(['multiple_choice', 'true_false', 'gap_fill', 'matching', 'short_answer'])).optional()
});

export const UseOfEnglishPayloadSchema = z.object({
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
  task_types: z.array(z.enum(['cloze', 'word_formation', 'key_word_transformation', 'multiple_choice'])),
  text_passages: z.array(z.string()).min(1).max(5)
});

export const MediationPayloadSchema = z.object({
  source_text: z.string().min(100).max(5000),
  target_language: z.string().min(2).max(10),
  source_language: z.string().min(2).max(10),
  mediation_type: z.enum(['summary', 'translation', 'interpretation', 'explanation']),
  output: z.string().min(50).max(3000),
  context: z.string().max(1000).optional()
});

// Task-specific payload schemas with discriminator
export const WritingTaskPayloadSchema = WritingPayloadSchema.extend({
  task_type: z.literal('writing')
});

export const SpeakingTaskPayloadSchema = SpeakingPayloadSchema.extend({
  task_type: z.literal('speaking')
});

export const ReadingTaskPayloadSchema = ReadingPayloadSchema.extend({
  task_type: z.literal('reading')
});

export const ListeningTaskPayloadSchema = ListeningPayloadSchema.extend({
  task_type: z.literal('listening')
});

export const UseOfEnglishTaskPayloadSchema = UseOfEnglishPayloadSchema.extend({
  task_type: z.literal('use_of_english')
});

export const MediationTaskPayloadSchema = MediationPayloadSchema.extend({
  task_type: z.literal('mediation')
});

// Generic payload schema that handles all task types
export const ScoringPayloadSchema = z.discriminatedUnion('task_type', [
  WritingTaskPayloadSchema,
  SpeakingTaskPayloadSchema,
  ReadingTaskPayloadSchema,
  ListeningTaskPayloadSchema,
  UseOfEnglishTaskPayloadSchema,
  MediationTaskPayloadSchema
]);

// Model Configuration Schema
export const ModelConfigSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'deepseek', 'vercel']),
  name: z.string().min(1).max(100),
  temperature: z.number().min(0).max(2).default(0),
  seed: z.number().int().min(0).optional(),
  weight: z.number().min(0).max(1).default(1)
});

// Committee Configuration Schema
export const CommitteeConfigSchema = z.array(ModelConfigSchema).min(1).max(5);

// Criterion Score Schema (for individual criterion results)
export const CriterionScoreSchema = z.object({
  criterion_id: z.string().min(1).max(50),
  score: z.number().min(0),
  max_score: z.number().min(1),
  band: z.number().min(1),
  evidence: z.array(z.string()).min(0).max(10),
  confidence: z.number().min(0).max(1)
});

// Overall Score JSON Schema (for attempts table)
export const ScoreJsonSchema = z.object({
  attempt_id: z.string().uuid(),
  total_score: z.number().min(0),
  max_score: z.number().min(1),
  percentage: z.number().min(0).max(100),
  pass: z.boolean(),
  criteria_scores: z.array(CriterionScoreSchema).min(1),
  overall_feedback: z.string().max(2000).optional(),
  improvement_areas: z.array(z.string()).max(5).optional(),
  strengths: z.array(z.string()).max(5).optional(),
  timestamp: z.string().datetime()
});

// Quality Control JSON Schema
export const QcJsonSchema = z.object({
  attempt_id: z.string().uuid(),
  processing_time_ms: z.number().min(0),
  model_costs: z.record(z.string(), z.number().min(0)),
  disagreement_score: z.number().min(0).max(1),
  confidence_intervals: z.record(z.string(), z.array(z.number()).length(2)),
  feature_extraction: z.object({
    word_count: z.number().int().min(0).optional(),
    readability_score: z.number().min(0).max(100).optional(),
    grammar_errors: z.number().int().min(0).optional(),
    vocabulary_level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']).optional()
  }).optional(),
  quality_flags: z.array(z.string()).max(10),
  committee_consensus: z.object({
    unanimous: z.boolean(),
    majority_threshold: z.number().min(0).max(1),
    outlier_scores: z.array(z.string()).max(3)
  })
});

// Scoring Attempt Database Schema
export const ScoringAttemptSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().min(1).max(100),
  user_id: z.string().uuid().nullable(),
  exam_session_id: z.string().uuid().nullable(),
  exam_id: z.string().max(100).nullable(),
  provider: ScoringProviderSchema,
  level: CEFRLevelSchema,
  task: TaskTypeSchema,
  payload: z.record(z.string(), z.any()), // Generic JSON object
  status: AttemptStatusSchema,
  rubric_id: z.string().uuid(),
  rubric_ver: z.string().min(1).max(50),
  model_name: z.string().min(1).max(100),
  committee: CommitteeConfigSchema.default([]),
  score_json: ScoreJsonSchema.nullable(),
  qc_json: QcJsonSchema.nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

// Create Scoring Attempt Input Schema
export const CreateScoringAttemptSchema = z.object({
  tenant_id: z.string().min(1).max(100),
  user_id: z.string().uuid().optional(),
  exam_session_id: z.string().uuid().optional(),
  exam_id: z.string().max(100).optional(),
  provider: ScoringProviderSchema,
  level: CEFRLevelSchema,
  task: TaskTypeSchema,
  payload: z.record(z.string(), z.any()),
  model_name: z.string().min(1).max(100).default('gpt-4o-mini')
});

// Scoring Attempt Event Schema
export const ScoringAttemptEventSchema = z.object({
  id: z.string().uuid(),
  attempt_id: z.string().uuid(),
  type: EventTypeSchema,
  data: z.record(z.string(), z.any()).default({}),
  at: z.date()
});

// Corrector Configuration Schema
export const ScoringCorrectorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable(),
  provider: ScoringProviderSchema,
  level: CEFRLevelSchema,
  task: TaskTypeSchema,
  committee: CommitteeConfigSchema,
  model_config: z.object({
    max_tokens: z.number().int().min(100).max(10000).default(2000),
    temperature: z.number().min(0).max(2).default(0),
    response_format: z.enum(['json', 'text']).default('json')
  }),
  prompt_version: z.string().min(1).max(50).default('PROMPT_WR_v1'),
  rubric_id: z.string().uuid().nullable(),
  active: z.boolean().default(true),
  created_by: z.string().uuid().nullable(),
  created_at: z.date(),
  updated_at: z.date()
});

// Create Corrector Input Schema
export const CreateCorrectorSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  provider: ScoringProviderSchema,
  level: CEFRLevelSchema,
  task: TaskTypeSchema,
  committee: CommitteeConfigSchema,
  model_config: z.object({
    max_tokens: z.number().int().min(100).max(10000).default(2000),
    temperature: z.number().min(0).max(2).default(0),
    response_format: z.enum(['json', 'text']).default('json')
  }).optional(),
  prompt_version: z.string().min(1).max(50).default('PROMPT_WR_v1'),
  rubric_id: z.string().uuid().optional(),
  active: z.boolean().default(true)
});

// Webhook Schema
export const ScoringWebhookSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1).default(['attempt.scored']),
  secret: z.string().min(32).max(128),
  active: z.boolean().default(true),
  created_at: z.date()
});

// Create Webhook Input Schema
export const CreateWebhookSchema = z.object({
  tenant_id: z.string().min(1).max(100),
  url: z.string().url(),
  events: z.array(z.string()).min(1).default(['attempt.scored']),
  secret: z.string().min(32).max(128).optional() // Will be generated if not provided
});

// Settings Schema
export const ScoringSettingsSchema = z.object({
  tenant_id: z.string().min(1).max(100),
  defaults: z.object({
    model_name: z.string().min(1).max(100).default('gpt-4o-mini'),
    committee: CommitteeConfigSchema.optional(),
    timeout: z.number().int().min(1000).max(300000).default(60000), // 1s to 5min
    retries: z.number().int().min(0).max(5).default(2),
    quality_threshold: z.number().min(0).max(1).default(0.8)
  }),
  weights: z.record(z.string(), z.record(z.string(), z.number().min(0).max(2))),
  equivalences: z.record(z.string(), z.record(z.string(), z.object({
    min: z.number().min(0),
    max: z.number().min(0)
  }))),
  updated_at: z.date()
});

// API Request/Response Schemas

// Score Request Schema
export const ScoreRequestSchema = z.object({
  provider: ScoringProviderSchema,
  level: CEFRLevelSchema,
  task: TaskTypeSchema,
  payload: z.record(z.string(), z.any()),
  user_id: z.string().uuid().optional(),
  exam_session_id: z.string().uuid().optional(),
  exam_id: z.string().max(100).optional(),
  model_name: z.string().min(1).max(100).optional(),
  webhook_url: z.string().url().optional()
});

// Score Response Schema
export const ScoreResponseSchema = z.object({
  success: z.boolean(),
  attempt_id: z.string().uuid(),
  status: AttemptStatusSchema,
  estimated_completion: z.string().datetime().optional(),
  webhook_configured: z.boolean().optional(),
  error: z.string().optional()
});

// Get Score Response Schema
export const GetScoreResponseSchema = z.object({
  success: z.boolean(),
  attempt: ScoringAttemptSchema.optional(),
  score: ScoreJsonSchema.optional(),
  qc: QcJsonSchema.optional(),
  error: z.string().optional()
});

// List Attempts Response Schema
export const ListAttemptsResponseSchema = z.object({
  success: z.boolean(),
  attempts: z.array(ScoringAttemptSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    total: z.number().int().min(0),
    has_more: z.boolean()
  }),
  error: z.string().optional()
});

// Validation helper functions
export const validateRubric = (data: unknown) => RubricJsonSchema.safeParse(data);
export const validateScoreRequest = (data: unknown) => ScoreRequestSchema.safeParse(data);
export const validateCreateAttempt = (data: unknown) => CreateScoringAttemptSchema.safeParse(data);
export const validateCreateCorrector = (data: unknown) => CreateCorrectorSchema.safeParse(data);
export const validateCreateWebhook = (data: unknown) => CreateWebhookSchema.safeParse(data);

// Type exports for TypeScript usage
export type RubricJson = z.infer<typeof RubricJsonSchema>;
export type ScoringRubric = z.infer<typeof ScoringRubricSchema>;
export type CreateRubric = z.infer<typeof CreateRubricSchema>;
export type ScoringPayload = z.infer<typeof ScoringPayloadSchema>;
export type WritingPayload = z.infer<typeof WritingPayloadSchema>;
export type SpeakingPayload = z.infer<typeof SpeakingPayloadSchema>;
export type ReadingPayload = z.infer<typeof ReadingPayloadSchema>;
export type ListeningPayload = z.infer<typeof ListeningPayloadSchema>;
export type UseOfEnglishPayload = z.infer<typeof UseOfEnglishPayloadSchema>;
export type MediationPayload = z.infer<typeof MediationPayloadSchema>;
export type ModelConfig = z.infer<typeof ModelConfigSchema>;
export type CommitteeConfig = z.infer<typeof CommitteeConfigSchema>;
export type ScoreJson = z.infer<typeof ScoreJsonSchema>;
export type QcJson = z.infer<typeof QcJsonSchema>;
export type ScoringAttempt = z.infer<typeof ScoringAttemptSchema>;
export type CreateScoringAttempt = z.infer<typeof CreateScoringAttemptSchema>;
export type ScoringAttemptEvent = z.infer<typeof ScoringAttemptEventSchema>;
export type ScoringCorrector = z.infer<typeof ScoringCorrectorSchema>;
export type CreateCorrector = z.infer<typeof CreateCorrectorSchema>;
export type ScoringWebhook = z.infer<typeof ScoringWebhookSchema>;
export type CreateWebhook = z.infer<typeof CreateWebhookSchema>;
export type ScoringSettings = z.infer<typeof ScoringSettingsSchema>;
export type ScoreRequest = z.infer<typeof ScoreRequestSchema>;
export type ScoreResponse = z.infer<typeof ScoreResponseSchema>;
export type GetScoreResponse = z.infer<typeof GetScoreResponseSchema>;
export type ListAttemptsResponse = z.infer<typeof ListAttemptsResponseSchema>;