# Quickstart: Scoring Engine Validation

**Date**: 2025-09-22
**Purpose**: End-to-end validation scenarios for scoring engine implementation

## Prerequisites

### Environment Setup
```bash
# 1. Database setup
npm run setup-database
npm run db:migrate

# 2. Environment variables
OPENAI_API_KEY=<your-key>
DEEPSEEK_API_KEY=<your-key>
UPSTASH_REDIS_URL=<redis-url>
UPSTASH_QSTASH_URL=<qstash-url>
SUPABASE_URL=<your-url>
SUPABASE_ANON_KEY=<your-key>

# 3. Seed initial data
npm run seed:scoring-rubrics
```

### Required Dependencies
- Next.js 15 with App Router
- Supabase client configured
- AI SDK with OpenAI and DeepSeek providers
- QStash/Upstash for queue processing
- Zod for validation

## Validation Scenarios

### Scenario 1: Database Schema Validation

**Objective**: Verify all scoring tables exist with proper constraints and indexes

```sql
-- Test: Check table existence
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'scoring_%';

-- Expected: scoring_rubrics, scoring_attempts, scoring_attempt_events,
--          scoring_correctors, scoring_webhooks, scoring_settings

-- Test: Check constraints
SELECT constraint_name, constraint_type FROM information_schema.table_constraints
WHERE table_name = 'scoring_attempts';

-- Expected: Primary key, foreign keys, check constraints for status/provider/level/task

-- Test: Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'scoring_attempts';

-- Expected: idx_sc_attempts_status, idx_sc_attempts_plt, idx_sc_attempts_created
```

**Success Criteria**:
- All 6 scoring tables exist
- All foreign key constraints properly reference parent tables
- All check constraints enforce valid enum values
- Performance indexes exist on frequently queried columns

### Scenario 2: Rubric Management

**Objective**: Test complete rubric CRUD operations

```typescript
// Test: Create EOI C1 Writing rubric
const rubricRequest = {
  provider: "EOI",
  level: "C1",
  task: "writing",
  version: "EOI-C1-WR-v1",
  criteria: [
    {
      id: "task_achievement",
      name: "Task Achievement",
      description: "How well the task requirements are fulfilled",
      weight: 0.25,
      bands: [
        { score: 0, descriptor: "Task not addressed" },
        { score: 1, descriptor: "Minimal task fulfillment" },
        { score: 2, descriptor: "Adequate task fulfillment" },
        { score: 3, descriptor: "Good task fulfillment" },
        { score: 4, descriptor: "Excellent task fulfillment" }
      ]
    },
    {
      id: "coherence_cohesion",
      name: "Coherence and Cohesion",
      description: "Logical organization and linking of ideas",
      weight: 0.25,
      bands: [
        { score: 0, descriptor: "No coherent organization" },
        { score: 1, descriptor: "Limited coherence" },
        { score: 2, descriptor: "Generally coherent" },
        { score: 3, descriptor: "Well organized" },
        { score: 4, descriptor: "Highly coherent and cohesive" }
      ]
    }
  ],
  totalScore: { min: 0, max: 8, passThreshold: 5 }
};

const response = await fetch('/api/v1/rubrics', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(rubricRequest)
});

// Expected: 201 Created with rubric ID
```

**Success Criteria**:
- Rubric created with unique ID
- Version constraint enforced (no duplicates)
- JSON schema validation passes
- Active rubric can be retrieved via GET

### Scenario 3: Synchronous Scoring (Reading/MCQ)

**Objective**: Test immediate scoring for objective tasks

```typescript
// Test: Score Reading comprehension answers
const scoringRequest = {
  provider: "EOI",
  level: "B2",
  task: "reading",
  payload: {
    answers: [
      { questionId: "q1", answer: "A", timeSpent: 45 },
      { questionId: "q2", answer: "C", timeSpent: 52 },
      { questionId: "q3", answer: "B", timeSpent: 38 },
      { questionId: "q4", answer: "A", timeSpent: 41 },
      { questionId: "q5", answer: "D", timeSpent: 49 }
    ]
  },
  examId: "eoi-b2-reading-sample-01"
};

const response = await fetch('/api/v1/score', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID()
  },
  body: JSON.stringify(scoringRequest)
});

// Expected: 200 OK with immediate scoring result
const result = await response.json();

console.assert(result.status === 'scored');
console.assert(typeof result.score.totalScore === 'number');
console.assert(typeof result.score.percentage === 'number');
console.assert(typeof result.score.pass === 'boolean');
```

**Success Criteria**:
- Response returns in <200ms
- Score calculation accurate against answer key
- All response fields populated correctly
- Idempotency key prevents duplicate scoring

### Scenario 4: Asynchronous Scoring (Writing)

**Objective**: Test queued scoring for subjective tasks

```typescript
// Test: Score Writing task
const writingRequest = {
  provider: "EOI",
  level: "C1",
  task: "writing",
  payload: {
    text: `In today's interconnected world, social media platforms have become ubiquitous tools for communication and information sharing. While these platforms offer unprecedented opportunities for global connectivity and democratic participation, they also present significant challenges regarding privacy, misinformation, and social polarization.

The benefits of social media are manifold. These platforms democratize information access, allowing individuals to share their perspectives and access diverse viewpoints from around the globe. They facilitate social movements, enable emergency communication, and provide valuable platforms for businesses to reach customers. Moreover, they have revolutionized how we maintain relationships across geographical boundaries.

However, the drawbacks are equally significant. Privacy concerns arise as personal data is harvested and monetized. The spread of misinformation can undermine democratic processes and public health initiatives. Additionally, algorithmic filter bubbles can reinforce existing beliefs and contribute to societal polarization.

In conclusion, while social media has transformed communication in largely positive ways, we must address its negative consequences through thoughtful regulation, improved digital literacy, and responsible platform governance to harness its benefits while mitigating its risks.`,
    prompt: "Write an essay discussing the advantages and disadvantages of social media in modern society. Your essay should be approximately 250 words and include a clear introduction, body paragraphs with supporting arguments, and a conclusion.",
    timeSpent: 1800,
    wordCount: 187
  },
  examId: "eoi-c1-writing-task-1"
};

const response = await fetch('/api/v1/score', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': crypto.randomUUID()
  },
  body: JSON.stringify(writingRequest)
});

// Expected: 202 Accepted for async processing
const queued = await response.json();
console.assert(response.status === 202);
console.assert(queued.status === 'queued');

// Test: Poll for completion
let attempts = 0;
while (attempts < 30) { // Max 30 seconds
  await new Promise(resolve => setTimeout(resolve, 1000));

  const statusResponse = await fetch(`/api/v1/score/${queued.attemptId}`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });

  const status = await statusResponse.json();

  if (status.status === 'scored') {
    console.assert(status.score.criteria.length > 0);
    console.assert(status.score.criteria.every(c => c.evidence.length > 0));
    console.assert(typeof status.score.overallFeedback === 'string');
    break;
  } else if (status.status === 'failed') {
    throw new Error(`Scoring failed: ${status.error}`);
  }

  attempts++;
}
```

**Success Criteria**:
- Request queued successfully (202 response)
- Processing completes within 30 seconds
- Score includes detailed criterion breakdown
- Evidence and feedback provided for each criterion
- Committee consensus metadata available in qc_json

### Scenario 5: Speaking Task with ASR

**Objective**: Test speech recognition and oral assessment pipeline

```typescript
// Test: Upload and score speaking sample
const speakingRequest = {
  provider: "Cambridge",
  level: "B2",
  task: "speaking",
  payload: {
    audioUrl: "https://storage.example.com/speaking-samples/cambridge-b2-part2-sample.mp3",
    duration: 120,
    prompt: "Describe a memorable journey you have taken. You should say: where you went, who you went with, what you did there, and explain why it was memorable.",
    interactionType: "monologue"
  },
  examId: "cambridge-b2-speaking-part2"
};

const response = await fetch('/api/v1/score', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(speakingRequest)
});

// Expected: 202 Accepted for async processing
const queued = await response.json();

// Poll for completion with longer timeout (speaking takes more time)
let attempts = 0;
while (attempts < 60) { // Max 60 seconds for speaking
  await new Promise(resolve => setTimeout(resolve, 1000));

  const statusResponse = await fetch(`/api/v1/score/${queued.attemptId}`, {
    headers: { 'Authorization': `Bearer ${userToken}` }
  });

  const status = await statusResponse.json();

  if (status.status === 'scored') {
    // Validate speaking-specific criteria
    const fluencyCriterion = status.score.criteria.find(c => c.criterionId === 'fluency_coherence');
    const pronunciationCriterion = status.score.criteria.find(c => c.criterionId === 'pronunciation');

    console.assert(fluencyCriterion !== undefined);
    console.assert(pronunciationCriterion !== undefined);

    // Check ASR metadata
    console.assert(status.qc_json.feature_extraction.words_per_minute > 0);
    console.assert(Array.isArray(status.qc_json.feature_extraction.pause_analysis));

    break;
  }

  attempts++;
}
```

**Success Criteria**:
- Audio file processed successfully by ASR
- Transcript generated with timestamps
- Speaking-specific criteria evaluated (fluency, pronunciation, vocabulary, grammar)
- Prosodic features extracted (pace, pauses, stress patterns)
- Quality metrics include speech rate and disfluency detection

### Scenario 6: Admin Interface Integration

**Objective**: Test admin dashboard functionality

```typescript
// Test: Admin can view scoring attempts
const adminResponse = await fetch('/api/v1/admin/scoring/attempts', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

const attempts = await adminResponse.json();
console.assert(Array.isArray(attempts.data));

// Test: Admin can manage rubrics
const rubricResponse = await fetch('/api/v1/admin/scoring/rubrics', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

const rubrics = await rubricResponse.json();
console.assert(Array.isArray(rubrics.data));

// Test: Analytics dashboard data
const analyticsResponse = await fetch('/api/v1/admin/scoring/analytics?period=7d', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

const analytics = await analyticsResponse.json();
console.assert(typeof analytics.totalAttempts === 'number');
console.assert(typeof analytics.averageProcessingTime === 'number');
console.assert(Array.isArray(analytics.scoreDistribution));
```

**Success Criteria**:
- Admin can view all scoring attempts with filtering
- Rubric management interface works correctly
- Analytics show accurate performance metrics
- Real-time updates work via WebSocket/SSE

### Scenario 7: Webhook Delivery

**Objective**: Test webhook notification system

```typescript
// Test: Register webhook
const webhookRequest = {
  url: "https://example.com/webhooks/scoring",
  events: ["attempt.scored", "attempt.failed"],
  secret: "webhook-secret-key"
};

const webhookResponse = await fetch('/api/v1/webhooks', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(webhookRequest)
});

const webhook = await webhookResponse.json();
console.assert(webhook.id);

// Submit scoring request and verify webhook delivery
const scoringResponse = await fetch('/api/v1/score', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    provider: "EOI",
    level: "B2",
    task: "reading",
    payload: { answers: [{ questionId: "q1", answer: "A" }] }
  })
});

// Webhook should be called with HMAC signature
```

**Success Criteria**:
- Webhook registered successfully
- Scoring completion triggers webhook call
- HMAC signature validation passes
- Webhook payload includes attempt ID and score data

### Scenario 8: Error Handling and Recovery

**Objective**: Test system resilience and error scenarios

```typescript
// Test: Invalid provider/level/task combination
const invalidRequest = {
  provider: "InvalidProvider",
  level: "B2",
  task: "writing",
  payload: { text: "Sample text" }
};

const errorResponse = await fetch('/api/v1/score', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(invalidRequest)
});

console.assert(errorResponse.status === 422);

// Test: AI model failure handling
// (Mock OpenAI API failure to test fallback to secondary model)

// Test: Queue overflow protection
// (Submit many requests to test rate limiting)

// Test: Malformed payload handling
const malformedRequest = {
  provider: "EOI",
  level: "B2",
  task: "writing"
  // Missing required payload field
};

const malformedResponse = await fetch('/api/v1/score', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(malformedRequest)
});

console.assert(malformedResponse.status === 400);
```

**Success Criteria**:
- Invalid requests return appropriate error codes
- AI model failures trigger fallback mechanisms
- Queue overflow triggers rate limiting
- Malformed requests handled gracefully
- All errors logged with proper context

### Scenario 9: Performance and Scalability

**Objective**: Test system performance under load

```typescript
// Test: Concurrent scoring requests
const concurrentRequests = Array.from({ length: 10 }, (_, i) => ({
  provider: "EOI",
  level: "B2",
  task: "reading",
  payload: {
    answers: [{ questionId: `q${i}`, answer: "A", timeSpent: 30 }]
  },
  examId: `concurrent-test-${i}`
}));

const startTime = Date.now();
const responses = await Promise.all(
  concurrentRequests.map(request =>
    fetch('/api/v1/score', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify(request)
    })
  )
);

const endTime = Date.now();
const processingTime = endTime - startTime;

console.assert(responses.every(r => r.ok));
console.assert(processingTime < 5000); // All requests complete within 5 seconds
```

**Success Criteria**:
- System handles 10 concurrent requests without degradation
- Response times remain under 200ms for sync scoring
- No database connection exhaustion
- Queue processing maintains throughput

### Scenario 10: Data Privacy and GDPR Compliance

**Objective**: Test privacy controls and data handling

```typescript
// Test: Data minimization in scoring requests
const privacyRequest = {
  provider: "EOI",
  level: "B2",
  task: "writing",
  payload: {
    text: "This text contains no PII and should be processed safely."
  }
};

const response = await fetch('/api/v1/score', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(privacyRequest)
});

// Test: Right to erasure
const deletionResponse = await fetch(`/api/v1/user/data/${userId}`, {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${userToken}` }
});

console.assert(deletionResponse.status === 200);

// Verify data actually deleted
const verifyResponse = await fetch(`/api/v1/score/attempts?userId=${userId}`, {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

const attempts = await verifyResponse.json();
console.assert(attempts.data.length === 0);
```

**Success Criteria**:
- No PII stored in scoring payloads unnecessarily
- User data deletion removes all associated scoring attempts
- Audit log maintained for data access
- Pseudonymization working correctly

## Performance Benchmarks

### Response Time Targets
- **Synchronous scoring (MCQ)**: <200ms p95
- **Asynchronous scoring queue**: <100ms p95
- **Status polling**: <50ms p95
- **Rubric retrieval**: <100ms p95

### Throughput Targets
- **Concurrent sync scoring**: 100 requests/second
- **Writing scoring queue**: 10 items/second processing
- **Speaking scoring queue**: 5 items/second processing
- **Database queries**: <10ms p95

### Resource Utilization
- **Database connections**: <80% of pool
- **Memory usage**: <2GB per instance
- **CPU usage**: <70% average
- **Queue depth**: <100 pending items

## Deployment Validation

### Pre-deployment Checklist
- [ ] All database migrations applied successfully
- [ ] Environment variables configured correctly
- [ ] AI model API keys working
- [ ] Queue system connected and functional
- [ ] Webhook endpoints accessible
- [ ] Health check endpoints responding

### Post-deployment Verification
- [ ] All quickstart scenarios pass
- [ ] Performance benchmarks met
- [ ] Error monitoring configured
- [ ] Logging aggregation working
- [ ] Backup systems operational
- [ ] Security scans complete

## Troubleshooting Guide

### Common Issues

**Database connection errors**:
- Check Supabase connection string
- Verify database migrations applied
- Check connection pool settings

**AI model API failures**:
- Verify API keys configured
- Check rate limiting settings
- Ensure fallback models available

**Queue processing stuck**:
- Check QStash configuration
- Verify worker endpoints accessible
- Monitor queue depth metrics

**Webhook delivery failures**:
- Verify webhook URL accessibility
- Check HMAC signature generation
- Monitor retry mechanisms

This quickstart guide provides comprehensive validation scenarios to ensure the scoring engine implementation meets all functional and non-functional requirements before production deployment.