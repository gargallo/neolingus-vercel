# Tasks: Academy User Dashboard Implementation

**Input**: Design documents from `/specs/002-course-centric-academy/`  
**Prerequisites**: research.md, data-model.md, contracts/api.yaml, quickstart.md

## Feature Overview

Implement a 100% functional user dashboard for the academy that provides:
- Real-time course progress tracking
- Interactive exam session management
- AI-powered tutoring with streaming responses
- Comprehensive analytics and insights
- Mobile-responsive design
- GDPR/LOPD compliant data handling

## Execution Flow

1. ✅ Analyzed spec documents: research.md (tech stack), data-model.md (6 entities), contracts/api.yaml (11 endpoints), quickstart.md (6 test scenarios)
2. ✅ Current codebase uses simulated data - needs full database integration
3. ✅ Supabase MCP integration required per constitutional requirements
4. ✅ AI SDK integration required for tutoring functionality (Anthropic/OpenAI/Google AI)
5. ✅ All API contracts need implementation and testing

## Phase 3.1: Setup & Database Integration

- [ ] T001 [P] Update TypeScript interfaces in `lib/types/academia.ts` to match data-model entities
- [ ] T002 [P] Create Supabase database schema validation in `utils/supabase/schema-validation.ts`
- [ ] T003 [P] Configure MCP client for academy operations in `lib/supabase-mcp/dashboard-client.ts`
- [ ] T004 Verify database migration `supabase/migrations/20250910000000_create_academy_system.sql` is applied
- [ ] T005 [P] Create seed data generation script in `scripts/seed-academy-data.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### API Contract Tests [P]
- [ ] T006 [P] Contract test GET `/api/academia/courses` in `__tests__/api/courses/get-courses.test.ts`
- [ ] T007 [P] Contract test GET `/api/academia/courses/{language}` in `__tests__/api/courses/get-by-language.test.ts`
- [ ] T008 [P] Contract test GET `/api/academia/courses/{language}/{level}` in `__tests__/api/courses/get-course-detail.test.ts`
- [ ] T009 [P] Contract test POST `/api/academia/courses/{language}/{level}` in `__tests__/api/courses/enroll-course.test.ts`
- [ ] T010 [P] Contract test GET `/api/academia/progress/{courseId}` in `__tests__/api/progress/get-progress.test.ts`
- [ ] T011 [P] Contract test POST `/api/academia/exams/sessions` in `__tests__/api/exams/create-session.test.ts`
- [ ] T012 [P] Contract test GET `/api/academia/exams/sessions/{sessionId}` in `__tests__/api/exams/get-session.test.ts`
- [ ] T013 [P] Contract test PATCH `/api/academia/exams/sessions/{sessionId}` in `__tests__/api/exams/update-session.test.ts`
- [ ] T014 [P] Contract test POST `/api/ai/tutor/chat` in `__tests__/api/ai/tutor-chat.test.ts`

### Integration Tests [P]
- [ ] T015 [P] User journey test: New user course selection in `__tests__/integration/course-selection.test.tsx`
- [ ] T016 [P] User journey test: Course dashboard access in `__tests__/integration/course-dashboard.test.tsx`
- [ ] T017 [P] User journey test: Exam simulation session in `__tests__/integration/exam-session.test.tsx`
- [ ] T018 [P] User journey test: AI tutoring interaction in `__tests__/integration/ai-tutoring.test.tsx`
- [ ] T019 [P] User journey test: Progress analytics in `__tests__/integration/progress-analytics.test.tsx`
- [ ] T020 [P] User journey test: Valenciano localization in `__tests__/integration/valenciano-course.test.tsx`

### Component Tests [P]
- [ ] T021 [P] Dashboard overview component test in `__tests__/components/dashboard-overview.test.tsx`
- [ ] T022 [P] Progress analytics component test in `__tests__/components/progress-analytics.test.tsx`
- [ ] T023 [P] Exam simulator component test in `__tests__/components/exam-simulator.test.tsx`
- [ ] T024 [P] AI tutor chat component test in `__tests__/components/ai-tutor.test.tsx`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Layer & Services [P]
- [ ] T025 [P] Course service with MCP integration in `lib/services/course-service.ts`
- [ ] T026 [P] User progress service in `lib/services/progress-service.ts`
- [ ] T027 [P] Exam session service in `lib/services/exam-service.ts`
- [ ] T028 [P] AI tutor service with AI SDK integration in `lib/services/ai-tutor-service.ts`
- [ ] T029 [P] Analytics calculation utilities in `lib/utils/analytics.ts`

### API Routes Implementation
- [ ] T030 GET `/api/academia/courses` endpoint in `app/api/academia/courses/route.ts`
- [ ] T031 GET `/api/academia/courses/by-language/[language]/route.ts` endpoint 
- [ ] T032 GET `/api/academia/courses/by-language/[language]/[level]/route.ts` endpoint
- [ ] T033 POST course enrollment endpoint in `app/api/academia/courses/by-language/[language]/[level]/route.ts`
- [ ] T034 GET progress endpoint in `app/api/academia/progress/[courseId]/route.ts`
- [ ] T035 POST exam session creation in `app/api/academia/exams/sessions/route.ts`
- [ ] T036 GET exam session retrieval in `app/api/academia/exams/sessions/[sessionId]/route.ts`
- [ ] T037 PATCH exam session update in `app/api/academia/exams/sessions/[sessionId]/route.ts`
- [ ] T038 POST AI tutor chat in `app/api/ai/tutor/chat/route.ts`

### Dashboard Components [P]
- [ ] T039 [P] Enhanced course dashboard in `components/dashboard/course-dashboard.tsx`
- [ ] T040 [P] Real-time progress analytics in `components/dashboard/progress-analytics.tsx`
- [ ] T041 [P] Interactive exam simulator in `components/dashboard/exam-simulator.tsx`
- [ ] T042 [P] AI tutor chat interface in `components/dashboard/ai-tutor.tsx`
- [ ] T043 [P] Course selection interface in `components/dashboard/course-selection.tsx`
- [ ] T044 [P] Achievement system in `components/dashboard/achievements.tsx`

## Phase 3.4: Page Integration

### Main Dashboard Pages
- [ ] T045 Update main academia page in `app/dashboard/page.tsx` with real data integration
- [ ] T046 Language-specific page in `app/dashboard/[idioma]/page.tsx`
- [ ] T047 Course-specific dashboard in `app/dashboard/[idioma]/[nivel]/page.tsx`
- [ ] T048 Exam interface page in `app/dashboard/[idioma]/[nivel]/examens/[proveedor]/page.tsx`
- [ ] T049 Exam simulator page in `app/dashboard/[idioma]/[nivel]/examens/[proveedor]/[examId]/simulador/page.tsx`

### Real-time Features
- [ ] T050 Implement real-time progress updates using Supabase subscriptions in `lib/realtime/progress-updates.ts`
- [ ] T051 Real-time exam session management in `lib/realtime/exam-sessions.ts`
- [ ] T052 AI tutor streaming responses with AI SDK in `lib/realtime/ai-tutor-stream.ts`

## Phase 3.5: Advanced Features

### Analytics & Insights [P]
- [ ] T053 [P] Performance analytics dashboard in `components/dashboard/analytics-dashboard.tsx`
- [ ] T054 [P] Readiness score calculation in `lib/analytics/readiness-score.ts`
- [ ] T055 [P] Weakness identification algorithms in `lib/analytics/weakness-detection.ts`
- [ ] T056 [P] Study recommendations engine in `lib/analytics/recommendations.ts`

### Mobile Optimization [P]
- [ ] T057 [P] Mobile-first responsive design updates in `styles/dashboard-mobile.css`
- [ ] T058 [P] Touch-friendly exam interface in `components/dashboard/mobile-exam.tsx`
- [ ] T059 [P] Offline support for exam sessions in `lib/offline/exam-cache.ts`

### Localization & Accessibility [P]
- [ ] T060 [P] Valenciano language support in `lib/localization/valenciano.ts`
- [ ] T061 [P] GDPR consent management in `components/gdpr/consent-manager.tsx`
- [ ] T062 [P] Accessibility enhancements (WCAG 2.1 AA) in `lib/accessibility/aria-helpers.ts`

## Phase 3.6: Performance & Polish

### Performance Optimization [P]
- [ ] T063 [P] Database query optimization in `lib/performance/query-optimization.ts`
- [ ] T064 [P] Component lazy loading in `lib/performance/lazy-loading.ts`
- [ ] T065 [P] Image optimization for course content in `lib/performance/image-optimization.ts`
- [ ] T066 [P] Caching strategies for analytics in `lib/performance/analytics-cache.ts`

### Final Integration & Testing
- [ ] T067 End-to-end testing with Playwright in `__tests__/e2e/complete-user-journey.spec.ts`
- [ ] T068 Performance testing (<200ms targets) in `__tests__/performance/dashboard-performance.test.ts`
- [ ] T069 Security audit and penetration testing
- [ ] T070 GDPR/LOPD compliance verification
- [ ] T071 Browser compatibility testing (Chrome, Firefox, Safari, Edge)
- [ ] T072 Load testing (100 concurrent users)

### Documentation & Deployment
- [ ] T073 [P] Update API documentation in `docs/api/academia-endpoints.md`
- [ ] T074 [P] User guide creation in `docs/user-guide/dashboard-features.md`
- [ ] T075 [P] Developer documentation in `docs/development/academy-architecture.md`
- [ ] T076 Production deployment checklist
- [ ] T077 Monitoring and alerting setup

## Dependencies

### Critical Path
1. **Setup** (T001-T005) → **Tests** (T006-T024) → **Services** (T025-T029) → **APIs** (T030-T038) → **Components** (T039-T044) → **Pages** (T045-T049)
2. **T004** (database verification) blocks all data-dependent tasks
3. **T025-T029** (services) block **T030-T038** (API routes)
4. **T030-T038** (API routes) block **T045-T049** (pages)

### Parallel Execution Blockers
- T030-T033 share same route file (sequential)
- T036-T037 share same route file (sequential)
- T045-T049 depend on API implementations
- T050-T052 depend on service layer completion

## Parallel Execution Examples

### Phase 3.2: Contract Tests (can run simultaneously)
```bash
# Launch all contract tests together:
Task: "Contract test GET /api/academia/courses in __tests__/api/courses/get-courses.test.ts"
Task: "Contract test GET /api/academia/courses/{language} in __tests__/api/courses/get-by-language.test.ts"
Task: "Contract test GET /api/academia/courses/{language}/{level} in __tests__/api/courses/get-course-detail.test.ts"
Task: "Contract test POST /api/academia/courses/{language}/{level} in __tests__/api/courses/enroll-course.test.ts"
# ... (all T006-T014 can run in parallel)
```

### Phase 3.3: Services Layer (independent implementations)
```bash
# Launch service implementations together:
Task: "Course service with MCP integration in lib/services/course-service.ts"
Task: "User progress service in lib/services/progress-service.ts" 
Task: "Exam session service in lib/services/exam-service.ts"
Task: "AI tutor service with AI SDK integration in lib/services/ai-tutor-service.ts"
Task: "Analytics calculation utilities in lib/utils/analytics.ts"
```

### Phase 3.5: Advanced Features (independent components)
```bash
# Launch advanced features together:
Task: "Performance analytics dashboard in components/dashboard/analytics-dashboard.tsx"
Task: "Mobile-first responsive design updates in styles/dashboard-mobile.css"
Task: "Valenciano language support in lib/localization/valenciano.ts"
Task: "GDPR consent management in components/gdpr/consent-manager.tsx"
```

## Success Criteria

### Functional Requirements ✅
- [ ] Real-time course progress tracking operational
- [ ] Interactive exam sessions with official format compliance
- [ ] AI tutoring with streaming AI SDK integration functional
- [ ] Comprehensive analytics with CEFR-aligned scoring
- [ ] Mobile-responsive design across all devices
- [ ] GDPR/LOPD compliance fully implemented
- [ ] Multi-language support (English/Valenciano) working

### Performance Targets ✅
- [ ] Dashboard load time <200ms
- [ ] AI tutor response time <2s
- [ ] Real-time updates <100ms latency
- [ ] Exam session transitions <50ms
- [ ] Analytics calculations <100ms
- [ ] Mobile performance >90 Lighthouse score

### Quality Gates ✅
- [ ] All 77 tasks completed with tests passing
- [ ] 100% API contract compliance verified
- [ ] Security vulnerabilities addressed
- [ ] Accessibility WCAG 2.1 AA compliance
- [ ] Browser compatibility confirmed
- [ ] Load testing passed (100 concurrent users)

## Notes

- **[P] tasks**: Different files, no dependencies, can run in parallel
- **Sequential tasks**: Share files or have direct dependencies
- **Critical**: T004 (database verification) must complete before data operations
- **TDD**: All tests (T006-T024) must fail before implementation starts
- **MCP Requirement**: All database operations must use Supabase MCP per constitution
- **AI SDK Requirement**: AI tutoring must use direct AI provider APIs (Anthropic/OpenAI/Google AI)