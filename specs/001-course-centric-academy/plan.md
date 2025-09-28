# Implementation Plan: Course-Centric Academy Architecture

**Branch**: `001-course-centric-academy` | **Date**: 2025-01-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-course-centric-academy/spec.md`

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

Implementation of a course-centric academy architecture that provides personalized language learning experiences through a spectacular app-like interface. Users select their target language (English/Valenciano) and certification level (EOI B2/C1, JQCV), accessing adaptive dashboards with authentic exam formats and AI-powered tutoring. The system ensures complete cultural and linguistic adaptation for each course context while maintaining strict compliance with official certification standards.

## Technical Context

**Language/Version**: TypeScript 5.8+, React 19, Next.js 15.2.4+  
**Primary Dependencies**: Tailwind CSS 4.0+, shadcn/ui, Supabase 2.49.4+, Update.dev, Stripe, Vercel AI SDK  
**Storage**: Supabase (PostgreSQL) with MCP integration, Context7 for AI contexts  
**Testing**: Jest for unit tests, Playwright for E2E exam simulations  
**Target Platform**: Web application (responsive design for desktop/mobile)  
**Project Type**: web - Next.js full-stack application  
**Performance Goals**: <200ms page transitions, <100ms UI responses, real-time exam interactions  
**Constraints**: MCP mandatory for all data operations, GDPR/LOPD compliance, authentic exam formats  
**Scale/Scope**: Multi-language support, modular certification system, AI-powered features

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Neolingus Academy Compliance**:

- Official Certification Focus: ✅ EOI B2/C1 and JQCV standards
- MCP Integration: ✅ Supabase MCP + Context7 mandatory
- Course-Centric Architecture: ✅ Language/level isolation
- AI-First Development: ✅ Educational integrity maintained
- Spanish Educational Foundation: ✅ GDPR/LOPD compliance

**Architecture**:

- Feature modularity: ✅ Each certification as independent module
- Course isolation: ✅ Complete UI/data separation per course
- Scalable framework: ✅ Designed for multi-certification expansion
- Cultural adaptation: ✅ Authentic contexts per language/region

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle: ✅ TDD approach enforced
- Educational validation: ✅ Authentic exam format testing
- Real exam simulation: ✅ Integration with official standards
- AI feature testing: ✅ Contextual AI responses validated

**Performance & User Experience**:

- App-like interface: ✅ Spectacular modern design planned
- Real-time interactions: ✅ Smooth exam session handling
- Responsive design: ✅ Multi-device support
- Accessibility: ✅ Multi-language accessibility compliance

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

**Structure Decision**: Option 2 (Web application) - Next.js full-stack with app/ directory structure for course-centric routing

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

_Prerequisites: research.md complete_

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

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each API endpoint → contract test task [P]
- Each entity (Language, Level, Course, etc.) → model creation task [P]
- Each user story from spec → integration test task
- Course-centric routing implementation tasks
- App-like UI design system tasks
- MCP integration tasks (Supabase MCP + Context7)
- AI-powered features integration tasks
- Educational content validation tasks

**Ordering Strategy**:

- TDD order: Tests before implementation (constitutional requirement)
- Dependency order: Data models → API endpoints → UI components → course integration
- Course isolation: Each language/certification can be developed in parallel
- Mark [P] for parallel execution (independent course modules)

**Educational Validation Tasks**:

- EOI format authentication by certified instructors
- JQCV compliance validation
- Cultural adaptation review
- AI feedback pedagogical validation

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md with educational validation checkpoints

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

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

_Based on Neolingus Constitution v3.0.0 - See `/memory/constitution.md`_
