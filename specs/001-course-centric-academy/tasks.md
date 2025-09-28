# Tasks: Course-Centric Academy Architecture

**Input**: Design documents from `/specs/001-course-centric-academy/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```
1. Load plan.md from feature directory
   \u2192 COMPLETE: Tech stack (Next.js, React, TypeScript, Supabase MCP, Context7)
   \u2192 Extract: Course-centric architecture, app-like UI, educational compliance
2. Load optional design documents:
   \u2192 data-model.md: Entities (Language, Level, Course, ExamType, UserProgress, ExamSession, Question)
   \u2192 contracts/: API endpoints for course selection, dashboard, exams
   \u2192 research.md: Routing decisions, UI system, MCP integration, exam formats
3. Generate tasks by category:
   \u2192 Setup: Next.js structure, dependencies, MCP configuration
   \u2192 Tests: API contract tests, exam simulation tests
   \u2192 Core: Course routing, UI components, exam engine
   \u2192 Integration: MCP data flows, AI features, authentication
   \u2192 Polish: Performance optimization, educational validation
4. Apply task rules:
   \u2192 Course modules can be parallel [P]
   \u2192 Shared components sequential
   \u2192 Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   \u2192 All API endpoints have tests \u2713
   \u2192 All entities have models \u2713
   \u2192 All course types implemented \u2713
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js App Router**: `app/`, `components/`, `lib/`, `utils/`
- **Course-specific**: `app/dashboard/[idioma]/[nivel]/`
- **Test structure**: `__tests__/`, `tests/`
- **Spec compliance**: All paths follow Neolingus Constitution v3.0.0

## Phase 3.1: Setup & Configuration

- [ ] T001 Configure Next.js App Router structure for course-centric routing
- [ ] T002 Install and configure MCP dependencies (Supabase MCP, Context7)
- [ ] T003 [P] Setup Tailwind CSS 4.0+ with app-like design tokens
- [ ] T004 [P] Configure TypeScript strict mode and educational data types
- [ ] T005 Setup Supabase database schema for course isolation
- [ ] T006 [P] Configure ESLint and Prettier for educational code standards

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### API Contract Tests

- [ ] T007 [P] Contract test GET /api/languages in `__tests__/api/languages.test.ts`
- [ ] T008 [P] Contract test GET /api/languages/{id}/levels in `__tests__/api/levels.test.ts`
- [ ] T009 [P] Contract test GET /api/courses/{id} in `__tests__/api/courses.test.ts`
- [ ] T010 [P] Contract test GET /api/courses/{id}/exam-types in `__tests__/api/exam-types.test.ts`
- [ ] T011 [P] Contract test POST /api/exam-sessions in `__tests__/api/exam-sessions.test.ts`
- [ ] T012 [P] Contract test PATCH /api/exam-sessions/{id} in `__tests__/api/exam-sessions-update.test.ts`
- [ ] T013 [P] Contract test GET /api/user/progress/{courseId} in `__tests__/api/user-progress.test.ts`

### Integration Tests

- [ ] T014 [P] Integration test language selection flow in `__tests__/integration/language-selection.test.ts`
- [ ] T015 [P] Integration test course dashboard access in `__tests__/integration/course-dashboard.test.ts`
- [ ] T016 [P] Integration test exam session lifecycle in `__tests__/integration/exam-session.test.ts`
- [ ] T017 [P] Integration test course switching in `__tests__/integration/course-switching.test.ts`
- [ ] T018 [P] Integration test MCP data operations in `__tests__/integration/mcp-operations.test.ts`

### Educational Compliance Tests

- [ ] T019 [P] EOI B2 format validation test in `__tests__/educational/eoi-b2-format.test.ts`
- [ ] T020 [P] JQCV format validation test in `__tests__/educational/jqcv-format.test.ts`
- [ ] T021 [P] AI feedback quality test in `__tests__/educational/ai-feedback.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Models & MCP Integration

- [ ] T022 [P] Language model with MCP operations in `lib/models/language.ts`
- [ ] T023 [P] Level model with MCP operations in `lib/models/level.ts`
- [ ] T024 [P] Course model with MCP operations in `lib/models/course.ts`
- [ ] T025 [P] ExamType model with MCP operations in `lib/models/exam-type.ts`
- [ ] T026 [P] UserProgress model with MCP operations in `lib/models/user-progress.ts`
- [ ] T027 [P] ExamSession model with MCP operations in `lib/models/exam-session.ts`
- [ ] T028 [P] Question model with MCP operations in `lib/models/question.ts`

### API Route Implementation

- [ ] T029 Implement GET /api/languages route in `app/api/languages/route.ts`
- [ ] T030 Implement GET /api/languages/[id]/levels route in `app/api/languages/[id]/levels/route.ts`
- [ ] T031 Implement GET /api/courses/[id] route in `app/api/courses/[id]/route.ts`
- [ ] T032 Implement GET /api/courses/[id]/exam-types route in `app/api/courses/[id]/exam-types/route.ts`
- [ ] T033 Implement POST /api/exam-sessions route in `app/api/exam-sessions/route.ts`
- [ ] T034 Implement PATCH /api/exam-sessions/[id] route in `app/api/exam-sessions/[id]/route.ts`
- [ ] T035 Implement GET /api/user/progress/[courseId] route in `app/api/user/progress/[courseId]/route.ts`

### Course-Centric UI Components

- [ ] T036 [P] Language selection component in `components/course/language-selector.tsx`
- [ ] T037 [P] Level selection component in `components/course/level-selector.tsx`
- [ ] T038 [P] Course dashboard layout in `components/course/course-dashboard.tsx`
- [ ] T039 [P] Course header with adaptation in `components/course/course-header.tsx`
- [ ] T040 [P] Exam type grid component in `components/course/exam-type-grid.tsx`
- [ ] T041 [P] Progress tracking component in `components/course/progress-tracker.tsx`

### Course-Specific Pages

- [ ] T042 Academia homepage at `app/dashboard/page.tsx`
- [ ] T043 Language selection page at `app/dashboard/[idioma]/page.tsx`
- [ ] T044 Course dashboard page at `app/dashboard/[idioma]/[nivel]/page.tsx`
- [ ] T045 Course layout with theme adaptation at `app/dashboard/[idioma]/[nivel]/layout.tsx`

## Phase 3.4: Exam Engine & AI Integration

### Exam Components

- [ ] T046 [P] Base exam component in `components/exam/exam-base.tsx`
- [ ] T047 [P] Multiple choice question component in `components/exam/multiple-choice.tsx`
- [ ] T048 [P] Essay question component in `components/exam/essay-question.tsx`
- [ ] T049 [P] Listening exam component in `components/exam/listening-exam.tsx`
- [ ] T050 [P] Speaking exam component in `components/exam/speaking-exam.tsx`
- [ ] T051 [P] Exam timer component in `components/exam/exam-timer.tsx`
- [ ] T052 [P] Exam progress component in `components/exam/exam-progress.tsx`

### AI-Powered Features

- [ ] T053 AI tutor integration with Context7 in `lib/ai/ai-tutor.ts`
- [ ] T054 [P] Exam feedback generator in `lib/ai/exam-feedback.ts`
- [ ] T055 [P] AI content adaptation in `lib/ai/content-adapter.ts`
- [ ] T056 Context7 configuration for courses in `lib/ai/context-config.ts`

### Educational Certification Modules

- [ ] T057 [P] EOI B2 exam configuration in `lib/certifications/eoi-b2.ts`
- [ ] T058 [P] EOI C1 exam configuration in `lib/certifications/eoi-c1.ts`
- [ ] T059 [P] JQCV exam configuration in `lib/certifications/jqcv.ts`
- [ ] T060 [P] Certification validator in `lib/certifications/validator.ts`

## Phase 3.5: Advanced Features & Integration

### Course Theming & Localization

- [ ] T061 [P] Course theme provider in `components/theme/course-theme-provider.tsx`
- [ ] T062 [P] Cultural adaptation utilities in `lib/utils/cultural-adaptation.ts`
- [ ] T063 [P] Language-specific layouts in `components/layout/language-layout.tsx`
- [ ] T064 Course-specific middleware in `middleware.ts` (course validation)

### Performance & User Experience

- [ ] T065 [P] Course-specific code splitting in `lib/utils/code-splitting.ts`
- [ ] T066 [P] Exam session state management in `lib/state/exam-state.ts`
- [ ] T067 [P] Progress synchronization in `lib/sync/progress-sync.ts`
- [ ] T068 Offline exam capabilities in `lib/offline/exam-offline.ts`

### Authentication & Access Control

- [ ] T069 Course-specific authentication in `lib/auth/course-auth.ts`
- [ ] T070 [P] Progress isolation utilities in `lib/auth/progress-isolation.ts`
- [ ] T071 [P] Entitlement checking per course in `lib/auth/course-entitlements.ts`

## Phase 3.6: Educational Validation & Polish

### Educational Compliance

- [ ] T072 [P] EOI format validation in `lib/validation/eoi-compliance.ts`
- [ ] T073 [P] JQCV format validation in `lib/validation/jqcv-compliance.ts`
- [ ] T074 [P] Cultural sensitivity validation in `lib/validation/cultural-validation.ts`
- [ ] T075 AI feedback pedagogical review in `lib/validation/ai-pedagogy.ts`

### Performance & Testing

- [ ] T076 [P] Unit tests for course components in `__tests__/unit/course-components.test.ts`
- [ ] T077 [P] Unit tests for exam engine in `__tests__/unit/exam-engine.test.ts`
- [ ] T078 [P] Performance tests (<200ms transitions) in `__tests__/performance/page-transitions.test.ts`
- [ ] T079 [P] Accessibility tests for multi-language in `__tests__/accessibility/multi-language.test.ts`
- [ ] T080 [P] Mobile responsiveness tests in `__tests__/responsive/mobile-adaptation.test.ts`

### Documentation & Deployment

- [ ] T081 [P] Update README with course architecture in `README.md`
- [ ] T082 [P] Document MCP integration in `docs/mcp-integration.md`
- [ ] T083 [P] Educational compliance documentation in `docs/educational-compliance.md`
- [ ] T084 [P] API documentation update in `docs/api.md`
- [ ] T085 Run complete quickstart validation from `specs/001-course-centric-academy/quickstart.md`

## Dependencies

### Critical Path

1. **Setup** (T001-T006) → **Tests** (T007-T021) → **Models** (T022-T028)
2. **Models** → **API Routes** (T029-T035)
3. **API Routes** → **UI Components** (T036-T045)
4. **UI Components** → **Pages** (T042-T045)
5. **Core** → **Exam Engine** (T046-T060)
6. **Exam Engine** → **AI Integration** (T053-T056)
7. **Everything** → **Validation** (T072-T085)

### Parallel Execution Opportunities

- **Course Models** (T022-T028): All can run in parallel
- **UI Components** (T036-T041): Independent component development
- **Exam Components** (T046-T052): Different question types
- **Certification Modules** (T057-T060): Independent per certification
- **Educational Tests** (T019-T021): Different compliance standards

## Parallel Example

```
# Phase 3.2 - Launch contract tests together:
Task: \"Contract test GET /api/languages in __tests__/api/languages.test.ts\"
Task: \"Contract test GET /api/languages/{id}/levels in __tests__/api/levels.test.ts\"
Task: \"Contract test GET /api/courses/{id} in __tests__/api/courses.test.ts\"
Task: \"Contract test GET /api/courses/{id}/exam-types in __tests__/api/exam-types.test.ts\"

# Phase 3.3 - Launch model creation together:
Task: \"Language model with MCP operations in lib/models/language.ts\"
Task: \"Level model with MCP operations in lib/models/level.ts\"
Task: \"Course model with MCP operations in lib/models/course.ts\"
Task: \"ExamType model with MCP operations in lib/models/exam-type.ts\"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (constitutional requirement)
- Commit after each task for educational audit trail
- MCP integration mandatory for all data operations
- Educational compliance validation at every stage
- Cultural adaptation required for each language course

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - Each API endpoint → contract test task [P]
   - Each endpoint → implementation task
2. **From Data Model**:
   - Each entity → MCP model creation task [P]
   - Relationships → service layer tasks
3. **From User Stories**:

   - Each course flow → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Educational Requirements**:

   - Each certification → compliance validation task [P]
   - Each exam type → authentic format task [P]
   - AI features → pedagogical validation tasks

5. **Ordering**:
   - Setup → Tests → Models → APIs → UI → Exams → AI → Validation
   - Educational validation throughout process
   - MCP integration in all data tasks

## Validation Checklist

_GATE: Checked by main() before returning_

- [x] All API contracts have corresponding tests
- [x] All entities have MCP model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Educational compliance integrated throughout
- [x] Course isolation maintained in all tasks
- [x] MCP integration specified for all data operations
- [x] Cultural adaptation addressed per language
