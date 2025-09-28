# Implementation Plan: Scoring Engine Integration

**Branch**: `002-course-centric-academy` | **Date**: 2025-09-22 | **Spec**: [/specs/002-course-centric-academy/spec.md]
**Input**: Comprehensive scoring engine implementation from `/docs/scoring-engine/` directory

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Implement a comprehensive, multi-provider scoring engine for the NeoLingus platform that provides automated assessment for language certification exams (EOI, JQCV, Cambridge, Cervantes). The system includes database migrations, REST API endpoints, AI-powered scoring pipelines for all skill types (Reading, Listening, Writing, Speaking, Mediation), admin interface, queue processing, observability, and full integration with the existing exam system.

## Technical Context
**Language/Version**: TypeScript 5.x / Next.js 15 / Node.js 20+
**Primary Dependencies**: Next.js App Router, Supabase (PostgreSQL), Zod validation, AI SDK, Queue systems (QStash/Upstash)
**Storage**: Supabase PostgreSQL with vector extensions, Blob storage for audio files, Redis for caching
**Testing**: Vitest for unit tests, Playwright for E2E testing, database integration tests
**Target Platform**: Web application (server-side + client-side), deployed on Vercel/cloud platforms
**Project Type**: web - full-stack application with frontend and backend components
**Performance Goals**: <200ms API response times, support 1000+ concurrent scoring requests, real-time score updates
**Constraints**: GDPR/LOPD compliance, reproducible scoring (temperature=0), audit trail requirements, cost optimization
**Scale/Scope**: Multi-provider (4+ certification types), 14 detailed implementation tasks, 6 database tables, 6+ API endpoints

**User Requirements Summary**: Implementar toda la implementación de todas las tareas del directorio docs/scoring-engine de manera ordenada, metodica, evitando errores, tomando decisiones de desarrollo profesionales, e integrarlo con el sistema actual de examenes y documentarlo completamente.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 1 (Next.js web app with integrated scoring engine)
- Using framework directly? YES - Next.js App Router with route handlers, no wrapper abstractions
- Single data model? YES - Database schema serves API directly with Zod validation
- Avoiding patterns? YES - Direct Supabase client usage, no Repository pattern

**Architecture**:
- EVERY feature as library? Scoring engine modules are self-contained with clear interfaces
- Libraries listed: scoring-engine (pipelines), scoring-api (endpoints), scoring-admin (UI), scoring-db (migrations)
- CLI per library: Database migrations, rubric seeding, queue management utilities
- Library docs: Documentation included in each module with clear API interfaces

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES - Tests written first for API contracts
- Git commits show tests before implementation? Will be enforced in task execution
- Order: Contract→Integration→E2E→Unit strictly followed? YES - API contracts, database integration, E2E scoring flows
- Real dependencies used? YES - Actual Supabase database, real AI models for testing
- Integration tests for: Database schema, API endpoints, scoring pipelines, admin interface
- FORBIDDEN: Implementation before test, skipping RED phase

**Observability**:
- Structured logging included? YES - Comprehensive logging for scoring attempts, performance metrics
- Frontend logs → backend? YES - Admin interface logs to backend audit trail
- Error context sufficient? YES - Full error tracking with attempt IDs and audit events

**Versioning**:
- Version number assigned? 1.0.0 (initial scoring engine release)
- BUILD increments on every change? YES - Each task increment builds version
- Breaking changes handled? YES - Database migrations with rollback, API versioning

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 2 (Web application) - Next.js app with scoring engine integration

```
app/
├── api/v1/
│   ├── score/
│   ├── rubrics/
│   ├── webhooks/
│   └── health/
├── admin/scoring/
│   ├── rubrics/
│   ├── attempts/
│   ├── analytics/
│   └── settings/
lib/scoring/
├── pipelines/
├── db/
├── queues/
└── types/
supabase/migrations/
tests/scoring/
├── api/
├── pipelines/
└── integration/
```

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*