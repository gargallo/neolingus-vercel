# Data Model: Scoring Engine

**Date**: 2025-09-22
**Context**: Database schema and entity relationships for NeoLingus scoring engine

## Core Entities

### ScoringRubric

Represents a versioned scoring rubric for a specific provider, level, and task combination.

**Fields**:
- `id` (UUID, PK): Unique identifier
- `provider` (TEXT, NOT NULL): Certification provider (EOI, JQCV, Cambridge, Cervantes)
- `level` (TEXT, NOT NULL): CEFR level (A1, A2, B1, B2, C1, C2)
- `task` (TEXT, NOT NULL): Skill type (reading, listening, use_of_english, writing, speaking, mediation)
- `version` (TEXT, NOT NULL): Version identifier (e.g., EOI-C1-WR-v3)
- `json` (JSONB, NOT NULL): Complete rubric definition with criteria and scoring bands
- `is_active` (BOOLEAN, DEFAULT true): Whether this rubric version is currently active
- `archived_at` (TIMESTAMPTZ, NULL): When rubric was archived
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): Creation timestamp
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): Last update timestamp

**Constraints**:
- UNIQUE(provider, level, task, version)
- CHECK(provider IN ('EOI', 'JQCV', 'Cambridge', 'Cervantes'))
- CHECK(level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'))
- CHECK(task IN ('reading', 'listening', 'use_of_english', 'writing', 'speaking', 'mediation'))

**Relationships**:
- One-to-many with ScoringAttempt (via rubric_id)
- One-to-many with ScoringCorrector (via rubric_id, optional override)

### ScoringAttempt

Represents a single scoring attempt with its payload, processing status, and results.

**Fields**:
- `id` (UUID, PK): Unique identifier
- `tenant_id` (TEXT, NOT NULL): Multi-tenant identifier
- `user_id` (UUID, NULL): User who made the attempt
- `exam_session_id` (UUID, NULL): Optional link to existing exam session
- `exam_id` (TEXT, NULL): External exam identifier
- `provider` (TEXT, NOT NULL): Certification provider
- `level` (TEXT, NOT NULL): CEFR level
- `task` (TEXT, NOT NULL): Skill type
- `payload` (JSONB, NOT NULL, DEFAULT '{}'): Input data (answers, text, audioUrl, sourceText)
- `status` (TEXT, NOT NULL, DEFAULT 'queued'): Processing status
- `rubric_id` (UUID, NOT NULL): Reference to scoring rubric used
- `rubric_ver` (TEXT, NOT NULL): Rubric version for audit trail
- `model_name` (TEXT, NOT NULL): Primary AI model used
- `committee` (JSONB, DEFAULT '[]'): Array of participating models
- `score_json` (JSONB, NULL): Normalized scoring results
- `qc_json` (JSONB, NULL): Quality control metrics (latency, disagreement, cost)
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): Creation timestamp
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): Last update timestamp

**Constraints**:
- CHECK(status IN ('queued', 'processing', 'scored', 'failed'))
- FOREIGN KEY(rubric_id) REFERENCES scoring_rubrics(id)
- FOREIGN KEY(exam_session_id) REFERENCES exam_sessions(id) ON DELETE SET NULL

**Relationships**:
- Many-to-one with ScoringRubric (via rubric_id)
- One-to-many with ScoringAttemptEvent (via attempt_id)
- Optional many-to-one with exam_sessions (via exam_session_id)

### ScoringAttemptEvent

Immutable audit log for all state transitions and important events in scoring attempts.

**Fields**:
- `id` (UUID, PK): Unique identifier
- `attempt_id` (UUID, NOT NULL): Reference to scoring attempt
- `type` (TEXT, NOT NULL): Event type
- `data` (JSONB, NOT NULL, DEFAULT '{}'): Event-specific data
- `at` (TIMESTAMPTZ, DEFAULT NOW()): Event timestamp

**Constraints**:
- CHECK(type IN ('created', 'queued', 'started', 'scored', 'failed', 're_scored', 'appeal'))
- FOREIGN KEY(attempt_id) REFERENCES scoring_attempts(id) ON DELETE CASCADE

**Relationships**:
- Many-to-one with ScoringAttempt (via attempt_id)

### ScoringCorrector

Represents a configuration profile for automated scoring, defining model committee and parameters.

**Fields**:
- `id` (UUID, PK): Unique identifier
- `name` (TEXT, NOT NULL): Human-readable corrector name
- `description` (TEXT): Optional description
- `provider` (TEXT, NOT NULL): Target certification provider
- `level` (TEXT, NOT NULL): Target CEFR level
- `task` (TEXT, NOT NULL): Target skill type
- `committee` (JSONB, NOT NULL, DEFAULT '[]'): Array of model configurations
- `model_config` (JSONB, NOT NULL, DEFAULT '{}'): Model parameters (max_tokens, temperature, etc.)
- `prompt_version` (TEXT, NOT NULL, DEFAULT 'PROMPT_WR_v1'): Prompt template version
- `rubric_id` (UUID, NULL): Optional rubric override
- `active` (BOOLEAN, DEFAULT true): Whether corrector is active
- `created_by` (UUID, NULL): Admin user who created this corrector
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): Creation timestamp
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): Last update timestamp

**Constraints**:
- UNIQUE(provider, level, task, name)
- FOREIGN KEY(rubric_id) REFERENCES scoring_rubrics(id) ON DELETE SET NULL
- FOREIGN KEY(created_by) REFERENCES admin_users(id)

**Relationships**:
- Optional many-to-one with ScoringRubric (via rubric_id)
- Many-to-one with admin users (via created_by)

### ScoringWebhook

Webhook registration for external systems to receive scoring completion notifications.

**Fields**:
- `id` (UUID, PK): Unique identifier
- `tenant_id` (TEXT, NOT NULL): Multi-tenant identifier
- `url` (TEXT, NOT NULL): Webhook endpoint URL
- `events` (TEXT[], NOT NULL, DEFAULT ARRAY['attempt.scored']): Subscribed event types
- `secret` (TEXT, NOT NULL): HMAC secret for request signing
- `active` (BOOLEAN, DEFAULT true): Whether webhook is active
- `created_at` (TIMESTAMPTZ, DEFAULT NOW()): Creation timestamp

**Relationships**:
- None (standalone configuration entity)

### ScoringSettings

Tenant-specific configuration for scoring behavior and defaults.

**Fields**:
- `tenant_id` (TEXT, PK): Multi-tenant identifier
- `defaults` (JSONB, NOT NULL, DEFAULT '{}'): Default model and committee configuration
- `weights` (JSONB, NOT NULL, DEFAULT '{}'): Provider-specific scoring weights
- `equivalences` (JSONB, NOT NULL, DEFAULT '{}'): Scale conversion tables
- `updated_at` (TIMESTAMPTZ, DEFAULT NOW()): Last update timestamp

**Relationships**:
- None (tenant configuration entity)

## Entity Relationships

```
ScoringRubric ||--o{ ScoringAttempt : uses
ScoringAttempt ||--o{ ScoringAttemptEvent : generates
ScoringRubric ||--o{ ScoringCorrector : overrides (optional)
exam_sessions ||--o{ ScoringAttempt : links_to (optional)
admin_users ||--o{ ScoringCorrector : creates
```

## JSON Schema Definitions

### Rubric JSON Structure

```typescript
interface RubricJson {
  version: string;
  provider: string;
  level: string;
  task: string;
  criteria: Array<{
    id: string;
    name: string;
    description: string;
    weight: number;
    bands: Array<{
      score: number;
      descriptor: string;
      examples?: string[];
    }>;
  }>;
  total_score: {
    min: number;
    max: number;
    pass_threshold?: number;
  };
  instructions?: string;
  time_limit?: number;
}
```

### Score JSON Structure

```typescript
interface ScoreJson {
  attempt_id: string;
  total_score: number;
  max_score: number;
  percentage: number;
  pass: boolean;
  criteria_scores: Array<{
    criterion_id: string;
    score: number;
    max_score: number;
    band: number;
    evidence: string[];
    confidence: number;
  }>;
  overall_feedback?: string;
  improvement_areas?: string[];
  strengths?: string[];
  timestamp: string;
}
```

### QC JSON Structure

```typescript
interface QcJson {
  attempt_id: string;
  processing_time_ms: number;
  model_costs: Record<string, number>;
  disagreement_score: number;
  confidence_intervals: Record<string, [number, number]>;
  feature_extraction: {
    word_count?: number;
    readability_score?: number;
    grammar_errors?: number;
    vocabulary_level?: string;
  };
  quality_flags: string[];
  committee_consensus: {
    unanimous: boolean;
    majority_threshold: number;
    outlier_scores: string[];
  };
}
```

### Committee Configuration

```typescript
interface CommitteeConfig {
  models: Array<{
    provider: string;
    name: string;
    temperature: number;
    seed: number;
    weight: number;
  }>;
  consensus_method: 'median' | 'trimmed_mean' | 'weighted_average';
  disagreement_threshold: number;
  min_models: number;
  max_models: number;
}
```

## State Transitions

### ScoringAttempt Status Flow

```
queued → processing → scored
queued → processing → failed
scored → processing → scored (re-scoring)
failed → processing → scored (retry)
any → failed (terminal errors)
```

### Event Types and Triggers

- `created`: New attempt inserted
- `queued`: Attempt queued for processing
- `started`: Processing began
- `scored`: Scoring completed successfully
- `failed`: Processing failed with error
- `re_scored`: Attempt re-processed
- `appeal`: Manual review requested

## Data Validation Rules

### Input Validation

1. **Provider-Level-Task Combinations**: Must exist in active rubrics
2. **Payload Structure**: Must match expected schema for task type
3. **File References**: Audio/image URLs must be accessible and valid
4. **Text Limits**: Word count and character limits per task type
5. **User Permissions**: Must have valid score:write scope

### Processing Validation

1. **Rubric Compatibility**: Selected rubric must match provider/level/task
2. **Model Availability**: All committee models must be available
3. **Resource Limits**: Must not exceed token/cost budgets
4. **Quality Thresholds**: Minimum confidence scores required
5. **Timeout Handling**: Maximum processing time limits

### Output Validation

1. **Score Ranges**: All scores within rubric-defined ranges
2. **Evidence Requirements**: Minimum evidence citations per criterion
3. **Consistency Checks**: Committee scores within disagreement thresholds
4. **Completeness**: All required fields populated
5. **Format Compliance**: JSON output matches schema exactly

## Performance Considerations

### Database Indexes

```sql
-- Primary lookup patterns
CREATE INDEX idx_sc_attempts_status ON scoring_attempts(status);
CREATE INDEX idx_sc_attempts_plt ON scoring_attempts(provider, level, task);
CREATE INDEX idx_sc_attempts_created ON scoring_attempts(created_at);
CREATE INDEX idx_sc_attempts_session ON scoring_attempts(exam_session_id);

-- Rubric management
CREATE INDEX idx_sc_rubrics_active ON scoring_rubrics(provider, level, task) WHERE is_active = true;
CREATE INDEX idx_sc_rubrics_version ON scoring_rubrics(version);

-- Event auditing
CREATE INDEX idx_sc_events_attempt_time ON scoring_attempt_events(attempt_id, at);
CREATE INDEX idx_sc_events_type ON scoring_attempt_events(type, at);

-- Corrector management
CREATE INDEX idx_sc_correctors_active ON scoring_correctors(provider, level, task, active);
```

### Query Optimization

1. **Hot Path Queries**: Active rubric lookup, attempt status checks
2. **Batch Operations**: Event insertion, score updates
3. **Analytics Queries**: Aggregated performance metrics
4. **Archive Strategy**: Move old attempts to cold storage

## Security Model

### Data Classification

- **Public**: Rubric schemas, API documentation
- **Internal**: Aggregate statistics, performance metrics
- **Confidential**: User attempts, scores, personal data
- **Restricted**: Model prompts, admin configurations

### Access Patterns

1. **Student Users**: Read own scores only
2. **Instructors**: Read student scores in their courses
3. **Admins**: Full CRUD on rubrics, correctors, settings
4. **System**: Internal API access for processing

### Privacy Controls

1. **Data Minimization**: Store only necessary fields
2. **Pseudonymization**: Separate user identity from scoring data
3. **Retention Policies**: Automatic data cleanup
4. **Audit Logging**: Track all data access
5. **Right to Erasure**: Complete data removal on request

This data model provides a robust foundation for the scoring engine while maintaining flexibility for future enhancements and strict compliance with privacy regulations.