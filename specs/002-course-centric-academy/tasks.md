# Implementation Tasks: Scoring Engine

**Branch**: `002-course-centric-academy` | **Date**: 2025-09-22
**Methodology**: Test-Driven Development (TDD) with RED-GREEN-REFACTOR cycle

## Task Generation Strategy

Tasks are generated from the comprehensive scoring engine documentation in `/docs/scoring-engine/` and follow the constitutional TDD requirement:
1. **Contract Tests**: API endpoint contract validation
2. **Integration Tests**: Database and system integration
3. **E2E Tests**: Complete user workflow validation
4. **Unit Tests**: Individual component logic
5. **Implementation**: Make tests pass following TDD cycle

**Ordering Priority**:
- Database foundation → API layer → Business logic → UI → Integration
- Tests before implementation (NON-NEGOTIABLE)
- Dependencies resolved before dependents
- [P] indicates parallel execution opportunities

## Phase 1: Foundation & Database (Tasks 1-4)

### Task 1: Database Schema Implementation [P]
**Priority**: CRITICAL
**Estimated Time**: 4 hours
**Dependencies**: None

**TDD Sequence**:
1. **Contract Test**: Database schema validation
```sql
-- Test file: tests/scoring/database/schema.test.sql
-- Verify all tables exist with correct structure
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name LIKE 'scoring_%';
-- Must return exactly 6 tables
```

2. **Integration Test**: Foreign key relationships
```sql
-- Test cascade behavior and constraint enforcement
INSERT INTO scoring_attempts (rubric_id, ...)
VALUES ('invalid-uuid', ...);  -- Should fail FK constraint
```

3. **RED**: Run tests - they should fail (no tables exist)

4. **Implementation**:
   - Create migration: `supabase/migrations/20250922000000_scoring_engine.sql`
   - Include all 6 tables from `database-schema.md`
   - Add indexes: `idx_sc_attempts_status`, `idx_sc_attempts_plt`, etc.
   - Add constraints: CHECK clauses for enums, UNIQUE constraints

5. **GREEN**: Run tests - they should pass

6. **REFACTOR**: Optimize indexes based on query patterns

**Definition of Done**:
- [ ] All 6 scoring tables created with proper constraints
- [ ] Foreign key relationships working correctly
- [ ] Performance indexes created and functional
- [ ] Migration is idempotent and has rollback capability
- [ ] All database tests passing

**Files Changed**:
- `supabase/migrations/20250922000000_scoring_engine.sql`
- `tests/scoring/database/schema.test.sql`
- `tests/scoring/database/constraints.test.sql`

### Task 2: Database Seed Data [P]
**Priority**: HIGH
**Estimated Time**: 2 hours
**Dependencies**: Task 1

**TDD Sequence**:
1. **Contract Test**: Seed data validation
```typescript
// tests/scoring/database/seed.test.ts
describe('Scoring Rubrics Seed', () => {
  it('should create 4 base rubrics', async () => {
    const rubrics = await supabase.from('scoring_rubrics')
      .select('*').eq('is_active', true);
    expect(rubrics.data).toHaveLength(4);
  });
});
```

2. **RED**: Run test - should fail (no seed data)

3. **Implementation**:
   - Create `scripts/seed-scoring-rubrics.ts`
   - Generate EOI-C1-WR-v1, EOI-C1-SP-v1, CAM-B2-WR-v1, JQCV-C1-MED-v1
   - Validate against JSON schema from `data-model.md`

4. **GREEN**: Run test - should pass

**Definition of Done**:
- [ ] 4 base rubrics seeded successfully
- [ ] Each rubric has valid JSON structure
- [ ] Version constraints enforced
- [ ] Seed script is idempotent

**Files Changed**:
- `scripts/seed-scoring-rubrics.ts`
- `package.json` (add seed script)
- `tests/scoring/database/seed.test.ts`

### Task 3: Zod Validation Schemas [P]
**Priority**: HIGH
**Estimated Time**: 3 hours
**Dependencies**: None

**TDD Sequence**:
1. **Contract Test**: Schema validation
```typescript
// tests/scoring/validation/schemas.test.ts
describe('Scoring Schemas', () => {
  it('should validate scoring request', () => {
    const validRequest = { provider: 'EOI', level: 'B2', task: 'writing', payload: {...} };
    expect(() => ScoringRequestSchema.parse(validRequest)).not.toThrow();
  });

  it('should reject invalid provider', () => {
    const invalidRequest = { provider: 'INVALID', level: 'B2', task: 'writing' };
    expect(() => ScoringRequestSchema.parse(invalidRequest)).toThrow();
  });
});
```

2. **RED**: Run test - should fail (no schemas exist)

3. **Implementation**:
   - Create `lib/scoring/schemas.ts`
   - Implement all schemas from `data-model.md`:
     - ScoringRequestSchema, RubricSchema, ScoreJsonSchema, QcJsonSchema
   - Add strict enum validation for providers/levels/tasks

4. **GREEN**: Run test - should pass

**Definition of Done**:
- [ ] All scoring schemas implemented with Zod
- [ ] Comprehensive validation test coverage
- [ ] Error messages are descriptive and helpful
- [ ] Type inference working correctly

**Files Changed**:
- `lib/scoring/schemas.ts`
- `lib/scoring/types.ts`
- `tests/scoring/validation/schemas.test.ts`

### Task 4: Supabase Client Utilities [P]
**Priority**: MEDIUM
**Estimated Time**: 2 hours
**Dependencies**: Task 1

**TDD Sequence**:
1. **Integration Test**: Database operations
```typescript
// tests/scoring/db/operations.test.ts
describe('Scoring Database Operations', () => {
  it('should create scoring attempt', async () => {
    const attempt = await createScoringAttempt({...validData});
    expect(attempt.id).toBeDefined();
  });
});
```

2. **RED**: Run test - should fail (no utilities exist)

3. **Implementation**:
   - Create `lib/scoring/db.ts`
   - Implement CRUD operations for all scoring tables
   - Add proper error handling and logging

4. **GREEN**: Run test - should pass

**Definition of Done**:
- [ ] All CRUD operations implemented
- [ ] Proper error handling and logging
- [ ] Transaction support where needed
- [ ] Integration tests passing

**Files Changed**:
- `lib/scoring/db.ts`
- `tests/scoring/db/operations.test.ts`

## Phase 2: API Layer (Tasks 5-9)

### Task 5: Core API Route Handlers
**Priority**: CRITICAL
**Estimated Time**: 6 hours
**Dependencies**: Tasks 1, 3

**TDD Sequence**:
1. **Contract Test**: API endpoint contracts
```typescript
// tests/scoring/api/score.test.ts
describe('POST /api/v1/score', () => {
  it('should return 202 for writing task', async () => {
    const response = await POST('/api/v1/score', writingRequest);
    expect(response.status).toBe(202);
    expect(response.body.attemptId).toBeDefined();
  });

  it('should return 200 for reading task', async () => {
    const response = await POST('/api/v1/score', readingRequest);
    expect(response.status).toBe(200);
    expect(response.body.score).toBeDefined();
  });
});
```

2. **RED**: Run test - should fail (no API routes exist)

3. **Implementation**:
   - Create `app/api/v1/score/route.ts`
   - Create `app/api/v1/score/[id]/route.ts`
   - Implement authentication middleware
   - Add idempotency key handling

4. **GREEN**: Run test - should pass

**Definition of Done**:
- [ ] POST /api/v1/score endpoint working
- [ ] GET /api/v1/score/[id] endpoint working
- [ ] Authentication and authorization working
- [ ] Idempotency key support implemented
- [ ] All HTTP status codes correct

**Files Changed**:
- `app/api/v1/score/route.ts`
- `app/api/v1/score/[id]/route.ts`
- `middleware.ts` (if auth changes needed)
- `tests/scoring/api/score.test.ts`

### Task 6: Rubrics Management API
**Priority**: HIGH
**Estimated Time**: 4 hours
**Dependencies**: Tasks 2, 3

**TDD Sequence**:
1. **Contract Test**: Rubrics CRUD operations
```typescript
// tests/scoring/api/rubrics.test.ts
describe('Rubrics API', () => {
  it('should create new rubric', async () => {
    const response = await POST('/api/v1/rubrics', validRubric);
    expect(response.status).toBe(201);
  });

  it('should enforce version uniqueness', async () => {
    await POST('/api/v1/rubrics', validRubric);
    const response = await POST('/api/v1/rubrics', validRubric);
    expect(response.status).toBe(409);
  });
});
```

2. **Implementation**:
   - Create `app/api/v1/rubrics/route.ts`
   - Create `app/api/v1/rubrics/[id]/route.ts`
   - Add admin-only authorization
   - Implement version conflict detection

**Definition of Done**:
- [ ] Full CRUD operations for rubrics
- [ ] Admin authorization enforced
- [ ] Version uniqueness constraints
- [ ] JSON schema validation

**Files Changed**:
- `app/api/v1/rubrics/route.ts`
- `app/api/v1/rubrics/[id]/route.ts`
- `tests/scoring/api/rubrics.test.ts`

### Task 7: Webhooks API
**Priority**: MEDIUM
**Estimated Time**: 3 hours
**Dependencies**: Task 3

**TDD Sequence**:
1. **Contract Test**: Webhook registration
```typescript
// tests/scoring/api/webhooks.test.ts
describe('Webhooks API', () => {
  it('should register webhook', async () => {
    const response = await POST('/api/v1/webhooks', webhookData);
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });
});
```

2. **Implementation**:
   - Create `app/api/v1/webhooks/route.ts`
   - Add HMAC signature generation
   - Implement webhook delivery logic

**Definition of Done**:
- [ ] Webhook registration working
- [ ] HMAC signature validation
- [ ] Webhook delivery mechanism
- [ ] Error handling and retries

**Files Changed**:
- `app/api/v1/webhooks/route.ts`
- `lib/scoring/webhooks.ts`
- `tests/scoring/api/webhooks.test.ts`

### Task 8: Health Check Endpoint
**Priority**: LOW
**Estimated Time**: 1 hour
**Dependencies**: Task 1

**TDD Sequence**:
1. **Contract Test**: Health status reporting
```typescript
// tests/scoring/api/health.test.ts
describe('Health API', () => {
  it('should return healthy status', async () => {
    const response = await GET('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });
});
```

2. **Implementation**:
   - Create `app/api/v1/health/route.ts`
   - Check database connectivity
   - Check external dependencies

**Definition of Done**:
- [ ] Health endpoint returns proper status
- [ ] Dependency checks implemented
- [ ] Proper error responses for unhealthy state

**Files Changed**:
- `app/api/v1/health/route.ts`
- `tests/scoring/api/health.test.ts`

### Task 9: API Authentication & Authorization
**Priority**: CRITICAL
**Estimated Time**: 3 hours
**Dependencies**: Task 5

**TDD Sequence**:
1. **Integration Test**: JWT token validation
```typescript
// tests/scoring/auth/jwt.test.ts
describe('JWT Authentication', () => {
  it('should validate score:write scope', async () => {
    const token = generateToken(['score:write']);
    const response = await POST('/api/v1/score', data, { Authorization: `Bearer ${token}` });
    expect(response.status).not.toBe(403);
  });
});
```

2. **Implementation**:
   - Enhance JWT middleware for scoring scopes
   - Add role-based access control
   - Implement scope validation

**Definition of Done**:
- [ ] JWT validation with scopes working
- [ ] Role-based access control implemented
- [ ] Proper error responses for auth failures
- [ ] All API routes protected appropriately

**Files Changed**:
- `lib/auth/scoring.ts`
- `middleware.ts`
- `tests/scoring/auth/jwt.test.ts`

## Phase 3: Scoring Pipelines (Tasks 10-14)

### Task 10: MCQ/Reading Scoring Pipeline
**Priority**: HIGH
**Estimated Time**: 4 hours
**Dependencies**: Task 5

**TDD Sequence**:
1. **Unit Test**: Answer key validation
```typescript
// tests/scoring/pipelines/mcq.test.ts
describe('MCQ Scoring Pipeline', () => {
  it('should score reading answers correctly', () => {
    const answers = [{ questionId: 'q1', answer: 'A' }];
    const answerKey = [{ questionId: 'q1', correctAnswer: 'A', points: 1 }];
    const result = scoreMCQ(answers, answerKey);
    expect(result.totalScore).toBe(1);
  });
});
```

2. **RED**: Run test - should fail

3. **Implementation**:
   - Create `lib/scoring/pipelines/mcq.ts`
   - Implement answer key matching
   - Add partial credit support
   - Calculate timing metrics

4. **GREEN**: Run test - should pass

**Definition of Done**:
- [ ] Accurate MCQ scoring implementation
- [ ] Timing analysis working
- [ ] Partial credit support
- [ ] Performance metrics collected

**Files Changed**:
- `lib/scoring/pipelines/mcq.ts`
- `lib/scoring/pipelines/reading.ts`
- `tests/scoring/pipelines/mcq.test.ts`

### Task 11: Writing Scoring Pipeline
**Priority**: CRITICAL
**Estimated Time**: 8 hours
**Dependencies**: Task 5

**TDD Sequence**:
1. **Integration Test**: AI model integration
```typescript
// tests/scoring/pipelines/writing.test.ts
describe('Writing Scoring Pipeline', () => {
  it('should score writing sample with committee', async () => {
    const result = await scoreWriting(sampleText, rubric, committee);
    expect(result.criteria).toHaveLength(4);
    expect(result.disagreement_score).toBeLessThan(0.3);
  });
});
```

2. **Implementation**:
   - Create `lib/scoring/pipelines/writing.ts`
   - Integrate AI SDK with OpenAI and DeepSeek
   - Implement committee consensus logic
   - Add feature extraction (word count, readability)

**Definition of Done**:
- [ ] AI model integration working
- [ ] Committee consensus implemented
- [ ] Feature extraction working
- [ ] Quality metrics collected
- [ ] Evidence extraction working

**Files Changed**:
- `lib/scoring/pipelines/writing.ts`
- `lib/scoring/ai/committee.ts`
- `lib/scoring/features/text-analysis.ts`
- `tests/scoring/pipelines/writing.test.ts`

### Task 12: Speaking Scoring Pipeline
**Priority**: HIGH
**Estimated Time**: 10 hours
**Dependencies**: Task 11

**TDD Sequence**:
1. **Integration Test**: ASR + AI scoring
```typescript
// tests/scoring/pipelines/speaking.test.ts
describe('Speaking Scoring Pipeline', () => {
  it('should transcribe and score speech', async () => {
    const result = await scoreSpeaking(audioUrl, rubric);
    expect(result.transcript).toBeDefined();
    expect(result.prosodic_features.words_per_minute).toBeGreaterThan(0);
  });
});
```

2. **Implementation**:
   - Create `lib/scoring/pipelines/speaking.ts`
   - Integrate Whisper API for ASR
   - Extract prosodic features
   - Score oral proficiency criteria

**Definition of Done**:
- [ ] ASR integration working
- [ ] Prosodic feature extraction
- [ ] Speaking-specific criteria scoring
- [ ] Audio quality validation

**Files Changed**:
- `lib/scoring/pipelines/speaking.ts`
- `lib/scoring/asr/whisper.ts`
- `lib/scoring/features/prosody.ts`
- `tests/scoring/pipelines/speaking.test.ts`

### Task 13: Mediation Scoring Pipeline
**Priority**: MEDIUM
**Estimated Time**: 6 hours
**Dependencies**: Task 11

**TDD Sequence**:
1. **Unit Test**: Cross-lingual analysis
```typescript
// tests/scoring/pipelines/mediation.test.ts
describe('Mediation Scoring Pipeline', () => {
  it('should detect information transfer', () => {
    const result = scoreMediation(targetText, sourceText, rubric);
    expect(result.information_transfer_score).toBeGreaterThan(0.5);
  });
});
```

2. **Implementation**:
   - Create `lib/scoring/pipelines/mediation.ts`
   - Implement source-target comparison
   - Detect information transfer quality
   - Score mediation-specific criteria

**Definition of Done**:
- [ ] Source-target text comparison
- [ ] Information transfer detection
- [ ] Mediation criteria scoring
- [ ] Language register analysis

**Files Changed**:
- `lib/scoring/pipelines/mediation.ts`
- `lib/scoring/features/cross-lingual.ts`
- `tests/scoring/pipelines/mediation.test.ts`

### Task 14: Queue Processing System
**Priority**: CRITICAL
**Estimated Time**: 6 hours
**Dependencies**: Tasks 11, 12, 13

**TDD Sequence**:
1. **Integration Test**: Queue workflow
```typescript
// tests/scoring/queue/processing.test.ts
describe('Queue Processing', () => {
  it('should process writing task asynchronously', async () => {
    const attemptId = await enqueueScoring(writingRequest);
    await waitForCompletion(attemptId, 30000);
    const result = await getScoringResult(attemptId);
    expect(result.status).toBe('scored');
  });
});
```

2. **Implementation**:
   - Create `lib/scoring/queue/processor.ts`
   - Integrate with QStash/Upstash
   - Add retry mechanisms
   - Implement status updates

**Definition of Done**:
- [ ] Queue processing working
- [ ] Retry mechanisms implemented
- [ ] Status updates in real-time
- [ ] Error handling and recovery

**Files Changed**:
- `lib/scoring/queue/processor.ts`
- `app/api/v1/queue/webhook/route.ts`
- `tests/scoring/queue/processing.test.ts`

## Phase 4: Admin Interface (Tasks 15-18)

### Task 15: Admin Scoring Dashboard
**Priority**: HIGH
**Estimated Time**: 8 hours
**Dependencies**: Task 5

**TDD Sequence**:
1. **E2E Test**: Admin dashboard workflow
```typescript
// tests/scoring/e2e/admin-dashboard.test.ts
describe('Admin Scoring Dashboard', () => {
  test('admin can view scoring attempts', async ({ page }) => {
    await page.goto('/admin/scoring/attempts');
    await expect(page.locator('[data-testid="attempts-table"]')).toBeVisible();
  });
});
```

2. **Implementation**:
   - Create `app/admin/scoring/attempts/page.tsx`
   - Create `app/admin/scoring/analytics/page.tsx`
   - Add real-time updates with SSE
   - Implement filtering and pagination

**Definition of Done**:
- [ ] Admin can view all scoring attempts
- [ ] Real-time status updates working
- [ ] Filtering and search working
- [ ] Performance metrics displayed

**Files Changed**:
- `app/admin/scoring/attempts/page.tsx`
- `app/admin/scoring/analytics/page.tsx`
- `components/admin/scoring/`
- `tests/scoring/e2e/admin-dashboard.test.ts`

### Task 16: Rubric Management UI
**Priority**: HIGH
**Estimated Time**: 6 hours
**Dependencies**: Task 6

**TDD Sequence**:
1. **E2E Test**: Rubric CRUD operations
```typescript
// tests/scoring/e2e/rubric-management.test.ts
describe('Rubric Management', () => {
  test('admin can create new rubric', async ({ page }) => {
    await page.goto('/admin/scoring/rubrics/create');
    await page.fill('[data-testid="provider-select"]', 'EOI');
    // ... fill form
    await page.click('[data-testid="save-rubric"]');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

2. **Implementation**:
   - Create `app/admin/scoring/rubrics/page.tsx`
   - Create `app/admin/scoring/rubrics/create/page.tsx`
   - Add form validation with Zod
   - Implement version management

**Definition of Done**:
- [ ] Complete rubric CRUD interface
- [ ] Form validation working
- [ ] Version management UI
- [ ] JSON schema validation in forms

**Files Changed**:
- `app/admin/scoring/rubrics/`
- `components/admin/scoring/rubric-form.tsx`
- `tests/scoring/e2e/rubric-management.test.ts`

### Task 17: Scoring Settings Configuration
**Priority**: MEDIUM
**Estimated Time**: 4 hours
**Dependencies**: Task 6

**TDD Sequence**:
1. **E2E Test**: Settings management
```typescript
describe('Scoring Settings', () => {
  test('admin can update default models', async ({ page }) => {
    await page.goto('/admin/scoring/settings');
    await page.selectOption('[data-testid="default-model"]', 'gpt-4o-mini');
    await page.click('[data-testid="save-settings"]');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
```

2. **Implementation**:
   - Create `app/admin/scoring/settings/page.tsx`
   - Add model configuration interface
   - Implement cost threshold settings
   - Add performance tuning options

**Definition of Done**:
- [ ] Model selection and configuration
- [ ] Cost and performance settings
- [ ] Committee configuration UI
- [ ] Settings validation and persistence

**Files Changed**:
- `app/admin/scoring/settings/page.tsx`
- `components/admin/scoring/settings-form.tsx`
- `tests/scoring/e2e/settings.test.ts`

### Task 18: Real-time Analytics Dashboard
**Priority**: MEDIUM
**Estimated Time**: 6 hours
**Dependencies**: Task 15

**TDD Sequence**:
1. **Integration Test**: Analytics data aggregation
```typescript
// tests/scoring/analytics/dashboard.test.ts
describe('Analytics Dashboard', () => {
  it('should calculate performance metrics', async () => {
    const metrics = await getPerformanceMetrics('7d');
    expect(metrics.totalAttempts).toBeGreaterThan(0);
    expect(metrics.averageProcessingTime).toBeDefined();
  });
});
```

2. **Implementation**:
   - Create analytics aggregation queries
   - Add real-time charts with Chart.js
   - Implement performance monitoring
   - Add cost tracking dashboard

**Definition of Done**:
- [ ] Real-time performance metrics
- [ ] Interactive charts and graphs
- [ ] Cost tracking and alerts
- [ ] Quality metrics dashboard

**Files Changed**:
- `lib/scoring/analytics.ts`
- `components/admin/scoring/analytics-charts.tsx`
- `tests/scoring/analytics/dashboard.test.ts`

## Phase 5: Integration & Testing (Tasks 19-22)

### Task 19: Exam System Integration
**Priority**: CRITICAL
**Estimated Time**: 6 hours
**Dependencies**: Task 5

**TDD Sequence**:
1. **Integration Test**: Exam session linkage
```typescript
// tests/scoring/integration/exam-system.test.ts
describe('Exam System Integration', () => {
  it('should link scoring to exam session', async () => {
    const examSession = await createExamSession(userData);
    const scoringResult = await scoreExamSession(examSession.id, answers);
    expect(scoringResult.exam_session_id).toBe(examSession.id);
  });
});
```

2. **Implementation**:
   - Modify exam simulation flow to use scoring API
   - Add scoring results to exam session display
   - Implement progress tracking integration
   - Add score history to user profiles

**Definition of Done**:
- [ ] Exam sessions linked to scoring attempts
- [ ] Scoring results displayed in exam interface
- [ ] User progress tracking updated
- [ ] Score history accessible

**Files Changed**:
- `app/dashboard/[idioma]/[nivel]/examens/[proveedor]/[examId]/page.tsx`
- `lib/exam-scoring-integration.ts`
- `tests/scoring/integration/exam-system.test.ts`

### Task 20: Performance Optimization
**Priority**: HIGH
**Estimated Time**: 4 hours
**Dependencies**: All previous tasks

**TDD Sequence**:
1. **Performance Test**: Load testing
```typescript
// tests/scoring/performance/load.test.ts
describe('Performance Tests', () => {
  it('should handle 100 concurrent requests', async () => {
    const promises = Array(100).fill(0).map(() => scoreMCQ(testData));
    const results = await Promise.all(promises);
    expect(results.every(r => r.processingTime < 200)).toBe(true);
  });
});
```

2. **Implementation**:
   - Add Redis caching for hot data
   - Optimize database queries
   - Implement connection pooling
   - Add query result caching

**Definition of Done**:
- [ ] Response times under 200ms for sync operations
- [ ] Database query optimization complete
- [ ] Caching strategy implemented
- [ ] Load testing passing

**Files Changed**:
- `lib/scoring/cache.ts`
- `lib/scoring/db.ts` (optimization)
- `tests/scoring/performance/load.test.ts`

### Task 21: Security Hardening
**Priority**: CRITICAL
**Estimated Time**: 4 hours
**Dependencies**: Task 9

**TDD Sequence**:
1. **Security Test**: Vulnerability testing
```typescript
// tests/scoring/security/vulnerabilities.test.ts
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE scoring_attempts; --";
    const response = await attemptSQLInjection(maliciousInput);
    expect(response.status).toBe(400);
  });
});
```

2. **Implementation**:
   - Add input sanitization
   - Implement rate limiting
   - Add CSRF protection
   - Audit logging enhancement

**Definition of Done**:
- [ ] Input validation and sanitization
- [ ] Rate limiting implemented
- [ ] Security headers configured
- [ ] Audit logging comprehensive

**Files Changed**:
- `lib/scoring/security.ts`
- `middleware.ts` (security enhancements)
- `tests/scoring/security/vulnerabilities.test.ts`

### Task 22: End-to-End Validation
**Priority**: CRITICAL
**Estimated Time**: 6 hours
**Dependencies**: All previous tasks

**TDD Sequence**:
1. **E2E Test**: Complete user workflows
```typescript
// tests/scoring/e2e/complete-workflow.test.ts
describe('Complete Scoring Workflow', () => {
  test('user can complete exam and receive AI-powered score', async ({ page }) => {
    // Complete exam simulation workflow
    await page.goto('/dashboard/english/b2/examens/eoi');
    await completeWritingExam(page);
    await expectScoringResults(page);
  });
});
```

2. **Implementation**:
   - Run all quickstart scenarios
   - Validate performance benchmarks
   - Test error recovery mechanisms
   - Verify GDPR compliance

**Definition of Done**:
- [ ] All quickstart scenarios passing
- [ ] Performance benchmarks met
- [ ] Error handling validated
- [ ] Privacy controls working

**Files Changed**:
- `tests/scoring/e2e/complete-workflow.test.ts`
- Documentation updates

## Phase 6: Documentation & Deployment (Tasks 23-25)

### Task 23: API Documentation Generation
**Priority**: MEDIUM
**Estimated Time**: 3 hours
**Dependencies**: Task 6

**Implementation**:
- Generate OpenAPI docs from contracts
- Create interactive Swagger UI
- Add code examples for all endpoints
- Document authentication flows

**Definition of Done**:
- [ ] Complete API documentation
- [ ] Interactive documentation UI
- [ ] Code examples in multiple languages
- [ ] Authentication guide complete

**Files Changed**:
- `docs/api/scoring-engine.md`
- `app/docs/api/page.tsx`

### Task 24: Deployment Configuration
**Priority**: HIGH
**Estimated Time**: 4 hours
**Dependencies**: Task 22

**Implementation**:
- Configure production environment variables
- Set up monitoring and alerting
- Configure backup procedures
- Create deployment scripts

**Definition of Done**:
- [ ] Production configuration complete
- [ ] Monitoring and alerting configured
- [ ] Backup procedures documented
- [ ] Deployment pipeline working

**Files Changed**:
- `.env.production`
- `scripts/deploy-scoring.sh`
- `docs/deployment/scoring-engine.md`

### Task 25: User Documentation
**Priority**: LOW
**Estimated Time**: 2 hours
**Dependencies**: Task 23

**Implementation**:
- Create user guides for scoring features
- Document admin interface usage
- Add troubleshooting guides
- Create training materials

**Definition of Done**:
- [ ] Complete user documentation
- [ ] Admin training materials
- [ ] Troubleshooting guides
- [ ] Video tutorials (optional)

**Files Changed**:
- `docs/user/scoring-guide.md`
- `docs/admin/scoring-management.md`

## Quality Gates & Validation

### TDD Compliance Checkpoints
- [ ] All tests written before implementation
- [ ] RED-GREEN-REFACTOR cycle followed
- [ ] Contract tests validate API specifications
- [ ] Integration tests use real dependencies
- [ ] No skipped RED phase in any task

### Constitutional Compliance
- [ ] Library-first architecture maintained
- [ ] Direct framework usage (no wrapper classes)
- [ ] Single data model approach
- [ ] Real dependencies in tests (no mocking critical paths)
- [ ] Structured logging throughout

### Performance Targets
- [ ] Sync scoring: <200ms p95
- [ ] Async queueing: <100ms p95
- [ ] Database queries: <10ms p95
- [ ] Concurrent requests: 100/second capability

### Security Requirements
- [ ] JWT authentication with scopes
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention
- [ ] CSRF protection enabled
- [ ] Rate limiting implemented

### GDPR Compliance
- [ ] Data minimization implemented
- [ ] Right to erasure working
- [ ] Audit logging complete
- [ ] Pseudonymization functional

## Implementation Timeline

**Week 1**: Database foundation (Tasks 1-4)
**Week 2**: Core API development (Tasks 5-9)
**Week 3**: Scoring pipelines (Tasks 10-14)
**Week 4**: Admin interface (Tasks 15-18)
**Week 5**: Integration & testing (Tasks 19-22)
**Week 6**: Documentation & deployment (Tasks 23-25)

**Parallel Opportunities**: Tasks marked [P] can be executed simultaneously by different team members to accelerate delivery.

**Critical Path**: Tasks 1 → 5 → 11 → 14 → 19 → 22 represent the critical path for core functionality.

This comprehensive task list ensures systematic implementation of the complete scoring engine with rigorous TDD methodology and constitutional compliance.