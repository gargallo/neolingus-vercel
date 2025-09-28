# Scoring Engine Integration Guide

## Overview

The NeoLingus Scoring Engine is a comprehensive AI-powered assessment system that provides automated scoring for language certification exams across multiple providers (EOI, JQCV, Cambridge, Cervantes) and skill types (reading, listening, writing, speaking, mediation, use_of_english).

## Architecture

### Core Components

1. **Database Schema**: 6 tables handling rubrics, attempts, events, correctors, webhooks, and settings
2. **API Layer**: RESTful endpoints for scoring operations
3. **Scoring Pipelines**: AI-powered scoring logic with model committees
4. **Queue Processing**: Asynchronous scoring with retry mechanisms
5. **Validation Layer**: Comprehensive Zod schemas for type safety

### Technology Stack

- **Backend**: Next.js 15 App Router
- **Database**: Supabase (PostgreSQL) with RLS
- **AI Models**: OpenAI GPT-4o-mini, DeepSeek R1, Claude 3 Haiku
- **Validation**: Zod schemas
- **Queue**: Custom processor (ready for QStash integration)

## Quick Start

### 1. Database Setup

The scoring engine requires the following migrations to be applied:

```bash
# Apply database schema
npx supabase db push

# Verify tables were created
npx supabase db dump --schema public | grep scoring_
```

### 2. Environment Variables

Add the following to your `.env.local`:

```env
# AI Provider API Keys
OPENAI_API_KEY=your_openai_key
DEEPSEEK_API_KEY=your_deepseek_key
ANTHROPIC_API_KEY=your_anthropic_key

# Supabase Configuration (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Seed Data

The system includes default rubrics and correctors:

```sql
-- Verify seed data was inserted
SELECT provider, level, task, version FROM scoring_rubrics WHERE is_active = true;
SELECT name, provider, level, task FROM scoring_correctors WHERE active = true;
```

### 4. Basic Usage

```typescript
import { createScoringDbClient } from '@/lib/scoring/db/client';

// Create scoring client
const scoringDb = createScoringDbClient();

// Create a scoring attempt
const attempt = await scoringDb.attempts.createAttempt({
  tenant_id: 'your-tenant',
  user_id: 'user-uuid',
  provider: 'EOI',
  level: 'B2',
  task: 'writing',
  payload: {
    text: 'Student essay text...',
    prompt: 'Essay prompt...',
    task_type: 'essay'
  }
});
```

## API Reference

### Core Endpoints

#### POST /api/v1/score
Create a new scoring attempt.

```typescript
const response = await fetch('/api/v1/score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    provider: 'EOI',
    level: 'B2',
    task: 'writing',
    payload: {
      text: 'Student response...',
      prompt: 'Write an essay about...',
      task_type: 'essay'
    }
  })
});
```

#### GET /api/v1/score/[attemptId]
Retrieve scoring results.

```typescript
const response = await fetch(`/api/v1/score/${attemptId}`);
const result = await response.json();

if (result.success && result.score) {
  console.log('Total Score:', result.score.total_score);
  console.log('Percentage:', result.score.percentage);
  console.log('Pass:', result.score.pass);
}
```

#### GET /api/v1/score/attempts
List scoring attempts with filtering.

```typescript
const response = await fetch('/api/v1/score/attempts?provider=EOI&level=B2&status=scored');
```

#### GET /api/v1/score/health
Health check endpoint.

```typescript
const response = await fetch('/api/v1/score/health');
const health = await response.json();
```

### Admin Endpoints

#### GET /api/v1/score/rubrics
List available rubrics.

#### POST /api/v1/score/rubrics
Create new rubric (admin only).

#### POST /api/v1/score/process
Manually trigger scoring (admin only).

## Database Schema

### Main Tables

1. **scoring_rubrics**: Versioned rubrics for each provider/level/task
2. **scoring_attempts**: Individual scoring attempts
3. **scoring_attempt_events**: Audit log for all state changes
4. **scoring_correctors**: AI model committee configurations
5. **scoring_webhooks**: Webhook subscriptions
6. **scoring_settings**: Tenant-specific configurations

### Key Relationships

```sql
scoring_rubrics 1:N scoring_attempts
scoring_attempts 1:N scoring_attempt_events
scoring_correctors N:1 scoring_rubrics (optional)
```

## Scoring Pipeline

### Supported Task Types

1. **Writing**: Essays, emails, reports, reviews
2. **Speaking**: Monologues, interactions, presentations
3. **Reading**: Multiple choice, gap-fill, matching
4. **Listening**: Audio comprehension tasks
5. **Use of English**: Grammar and vocabulary
6. **Mediation**: Cross-language tasks

### AI Model Committee

The system uses multiple AI models for consensus scoring:

- **Primary**: OpenAI GPT-4o-mini (60% weight)
- **Secondary**: DeepSeek R1 (40% weight)
- **Tertiary**: Claude 3 Haiku (optional)

### Quality Control

- **Disagreement Detection**: Flags when models disagree significantly
- **Confidence Scoring**: Rates reliability of each score
- **Processing Metrics**: Tracks latency and costs
- **Feature Extraction**: Analyzes text characteristics

## Integration Examples

### Basic Writing Assessment

```typescript
import { scoreAttempt } from '@/lib/scoring/pipelines';

const attempt = {
  provider: 'EOI',
  level: 'B2',
  task: 'writing',
  payload: {
    text: 'Student essay...',
    prompt: 'Discuss the advantages and disadvantages of social media.',
    task_type: 'essay'
  }
};

const result = await scoreAttempt(attempt, rubric, committee);
```

### Webhook Integration

```typescript
// Register webhook
await fetch('/api/v1/score/webhooks', {
  method: 'POST',
  body: JSON.stringify({
    url: 'https://your-app.com/webhooks/scoring',
    events: ['attempt.scored', 'attempt.failed']
  })
});

// Webhook payload structure
{
  "event": "attempt.scored",
  "attempt_id": "uuid",
  "score": { /* ScoreJson */ },
  "timestamp": "2025-09-22T10:00:00Z"
}
```

### Batch Processing

```typescript
// Create multiple attempts
const attempts = await fetch('/api/v1/score/attempts', {
  method: 'POST',
  body: JSON.stringify({
    attempts: [
      { provider: 'EOI', level: 'B2', task: 'writing', payload: {...} },
      { provider: 'Cambridge', level: 'B2', task: 'speaking', payload: {...} }
    ]
  })
});

// Process all queued attempts (admin)
await fetch('/api/v1/score/process', {
  method: 'POST',
  body: JSON.stringify({ process_all_queued: true })
});
```

## Testing

### Running Tests

```bash
# Unit tests
npm test lib/scoring/schemas

# Integration tests
npm test tests/scoring/integration

# API tests
npm test tests/scoring/api
```

### Test Data

```typescript
const testPayload = {
  text: 'A well-structured essay of appropriate length...',
  prompt: 'Write about your favorite hobby',
  task_type: 'essay',
  word_limit: 250
};
```

## Performance Optimization

### Database Indexes

Key indexes are automatically created:
- `idx_sc_attempts_status` for queue processing
- `idx_sc_attempts_plt` for provider/level/task lookups
- `idx_sc_rubrics_active` for active rubric queries

### Caching Strategy

- Rubrics cached for 1 hour
- Model responses cached by content hash
- Settings cached per tenant

### Rate Limiting

- 10 requests per minute per user
- Configurable via tenant settings
- Bypass available for admin users

## Security

### Row Level Security (RLS)

- Tenant isolation enforced at database level
- Users can only access their own attempts
- Admins have cross-tenant access

### API Security

- JWT authentication required
- Admin endpoints require role verification
- Webhook signatures for secure callbacks

### Data Privacy

- GDPR/LOPD compliant data handling
- Automatic data retention policies
- Right to erasure implementation

## Monitoring

### Health Checks

```bash
# Simple ping
curl -I /api/v1/score/health

# Detailed health status
curl /api/v1/score/health
```

### Metrics

- Scoring throughput (attempts/hour)
- Average processing time
- Model success rates
- Quality control flags

### Logging

Structured logging for:
- Attempt creation and completion
- Model API calls and responses
- Error tracking and debugging
- Performance monitoring

## Troubleshooting

### Common Issues

1. **No Active Rubric Found**
   - Check rubric seed data
   - Verify provider/level/task combination
   - Ensure rubric is marked as active

2. **AI Model API Errors**
   - Verify API keys are set
   - Check model availability
   - Review rate limiting

3. **Database Connection Issues**
   - Verify Supabase configuration
   - Check RLS policies
   - Validate tenant context

### Debug Mode

```typescript
// Enable detailed logging
process.env.SCORING_DEBUG = 'true';

// Check queue status
const response = await fetch('/api/v1/score/process');
const status = await response.json();
```

## Migration from Existing Systems

### From Legacy Scoring

1. Export existing rubrics to JSON format
2. Import via POST /api/v1/score/rubrics
3. Migrate attempt history (optional)
4. Update client applications to use new API

### Data Migration Script

```typescript
// Example migration helper
async function migrateRubric(legacyRubric: any) {
  const newRubric = {
    provider: mapProvider(legacyRubric.provider),
    level: mapLevel(legacyRubric.level),
    task: mapTask(legacyRubric.task),
    version: `MIGRATED-${legacyRubric.id}`,
    json: transformRubricFormat(legacyRubric)
  };

  return await fetch('/api/v1/score/rubrics', {
    method: 'POST',
    body: JSON.stringify(newRubric)
  });
}
```

## Support

For technical support and questions:
- Check health endpoint: `/api/v1/score/health`
- Review integration tests for examples
- Consult API documentation for detailed schemas
- Monitor application logs for error details

## Changelog

### Version 1.0.0 (2025-09-22)
- Initial scoring engine implementation
- Support for EOI, Cambridge, JQCV, Cervantes providers
- AI model committee scoring
- Complete API and database schema
- Integration tests and documentation