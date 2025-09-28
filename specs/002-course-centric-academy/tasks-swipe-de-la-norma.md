# Tasks: Swipe de la Norma Game

**Input**: Comprehensive game specification from `/docs/games/swiper/NeoLingus_Swipe_de_la_Norma_Spec.md`
**Prerequisites**: Detailed specification with database schema, API contracts, and game mechanics

## Execution Flow (main)
```
1. Loaded specification from games/swiper directory
   → Core feature: Swipe-based language normalization game
   → Tech stack: Next.js 15, Supabase PostgreSQL, TypeScript
   → Platform: Web application with mobile-responsive design
2. Extracted entities: SwipeItems, SwipeSessions, SwipeAnswers, SwipeUserSkill, SwipeItemStats
3. API endpoints: /swipe/deck, /swipe/session/start, /swipe/answer, /swipe/session/end, /swipe/stats/user
4. Generated tasks by category:
   → Setup: Database schema, API structure, frontend components
   → Tests: API contract tests, integration tests for game flow
   → Core: Game engine, scoring logic, ELO system
   → Integration: Real-time updates, analytics, content management
   → Polish: Accessibility, performance optimization, content seeding
5. Applied TDD: All tests before implementation
6. Marked parallel execution where files are independent
7. Dependencies: Database → API → Frontend → Analytics
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web app**: Next.js app structure with `app/`, `lib/`, `components/`
- Database: Supabase migrations in `supabase/migrations/`
- Tests: `__tests__/` directory structure

## Phase 3.1: Setup
- [ ] T001 Create database migration for swipe game tables in `supabase/migrations/20250924000000_create_swipe_game_system.sql`
- [ ] T002 [P] Initialize game types and interfaces in `lib/types/swipe-game.ts`
- [ ] T003 [P] Configure Zod validation schemas in `lib/validation/swipe-schemas.ts`
- [ ] T004 [P] Setup game configuration constants in `lib/config/swipe-config.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### API Contract Tests
- [ ] T005 [P] Contract test GET /api/swipe/deck in `__tests__/api/swipe/deck.test.ts`
- [ ] T006 [P] Contract test POST /api/swipe/session/start in `__tests__/api/swipe/session-start.test.ts`
- [ ] T007 [P] Contract test POST /api/swipe/answer in `__tests__/api/swipe/answer.test.ts`
- [ ] T008 [P] Contract test POST /api/swipe/session/end in `__tests__/api/swipe/session-end.test.ts`
- [ ] T009 [P] Contract test GET /api/swipe/stats/user in `__tests__/api/swipe/stats.test.ts`
- [ ] T010 [P] Contract test GET /api/swipe/recommendations/next-pack in `__tests__/api/swipe/recommendations.test.ts`

### Integration Tests
- [ ] T011 [P] Integration test complete game session flow in `__tests__/integration/swipe-game-flow.test.ts`
- [ ] T012 [P] Integration test ELO rating updates in `__tests__/integration/swipe-elo-system.test.ts`
- [ ] T013 [P] Integration test analytics and recommendations in `__tests__/integration/swipe-analytics.test.ts`
- [ ] T014 [P] Integration test content filtering and deck building in `__tests__/integration/swipe-deck-builder.test.ts`

### Component Tests
- [ ] T015 [P] Component test SwipeCard UI in `__tests__/components/swipe-card.test.tsx`
- [ ] T016 [P] Component test GameTimer in `__tests__/components/game-timer.test.tsx`
- [ ] T017 [P] Component test ScoreDisplay in `__tests__/components/score-display.test.tsx`
- [ ] T018 [P] Component test GameResults in `__tests__/components/game-results.test.tsx`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Database Models and Services
- [ ] T019 [P] SwipeItem model with content validation in `lib/models/swipe-item.ts`
- [ ] T020 [P] SwipeSession model with scoring logic in `lib/models/swipe-session.ts`
- [ ] T021 [P] SwipeAnswer model with latency tracking in `lib/models/swipe-answer.ts`
- [ ] T022 [P] SwipeUserSkill model with ELO calculations in `lib/models/swipe-user-skill.ts`

### Game Engine Core
- [ ] T023 SwipeGameEngine service with session management in `lib/services/swipe-game-engine.ts`
- [ ] T024 ScoringService with +1/-1.33 logic in `lib/services/scoring-service.ts`
- [ ] T025 ELORatingSystem with user/item rating updates in `lib/services/elo-rating-system.ts`
- [ ] T026 DeckBuilderService with adaptive difficulty in `lib/services/deck-builder-service.ts`

### API Endpoints
- [ ] T027 GET /api/swipe/deck endpoint in `app/api/swipe/deck/route.ts`
- [ ] T028 POST /api/swipe/session/start endpoint in `app/api/swipe/session/start/route.ts`
- [ ] T029 POST /api/swipe/answer endpoint in `app/api/swipe/answer/route.ts`
- [ ] T030 POST /api/swipe/session/end endpoint in `app/api/swipe/session/end/route.ts`
- [ ] T031 GET /api/swipe/stats/user endpoint in `app/api/swipe/stats/user/route.ts`
- [ ] T032 GET /api/swipe/recommendations/next-pack endpoint in `app/api/swipe/recommendations/next-pack/route.ts`

### Frontend Components
- [ ] T033 [P] SwipeCard component with gesture support in `components/swipe/swipe-card.tsx`
- [ ] T034 [P] GameTimer component with countdown display in `components/swipe/game-timer.tsx`
- [ ] T035 [P] ScoreDisplay component with real-time updates in `components/swipe/score-display.tsx`
- [ ] T036 [P] GameControls component with keyboard shortcuts in `components/swipe/game-controls.tsx`
- [ ] T037 GameSetup component with configuration options in `components/swipe/game-setup.tsx`
- [ ] T038 GameResults component with session summary in `components/swipe/game-results.tsx`

### Game Pages
- [ ] T039 Swipe game main page in `app/games/swipe/page.tsx`
- [ ] T040 Game configuration page in `app/games/swipe/setup/page.tsx`
- [ ] T041 Game results page with analytics in `app/games/swipe/results/page.tsx`

## Phase 3.4: Integration

### Analytics and Recommendations
- [ ] T042 AnalyticsService with error bucket tracking in `lib/services/analytics-service.ts`
- [ ] T043 RecommendationEngine with next-pack suggestions in `lib/services/recommendation-engine.ts`
- [ ] T044 ContentService with version management in `lib/services/content-service.ts`

### Game State Management
- [ ] T045 GameStateProvider for session persistence in `lib/providers/game-state-provider.tsx`
- [ ] T046 Real-time score updates with optimistic UI in `lib/hooks/use-game-session.ts`
- [ ] T047 Keyboard navigation and accessibility in `lib/hooks/use-keyboard-controls.ts`

### Anti-cheat and Quality
- [ ] T048 SuspiciousActivityDetector with timing validation in `lib/services/suspicious-activity-detector.ts`
- [ ] T049 ContentQualityService with item statistics in `lib/services/content-quality-service.ts`

## Phase 3.5: Polish

### Performance and UX
- [ ] T050 [P] Game performance optimization with 60fps animations in `lib/utils/game-performance.ts`
- [ ] T051 [P] Accessibility improvements with ARIA labels in `lib/utils/game-accessibility.ts`
- [ ] T052 [P] Mobile responsive design with touch gestures in `styles/swipe-game.css`
- [ ] T053 [P] Loading states and error boundaries in `components/swipe/game-loading.tsx`

### Content Management
- [ ] T054 [P] Content seeding script with 150 initial items in `scripts/seed-swipe-content.ts`
- [ ] T055 [P] Content validation utilities in `lib/utils/content-validation.ts`
- [ ] T056 [P] Admin interface for content management in `app/admin/swipe-content/page.tsx`

### Testing and Documentation
- [ ] T057 [P] Unit tests for ELO calculations in `__tests__/unit/elo-rating.test.ts`
- [ ] T058 [P] Unit tests for scoring logic in `__tests__/unit/scoring-service.test.ts`
- [ ] T059 [P] E2E tests for complete game flow in `__tests__/e2e/swipe-game.spec.ts`
- [ ] T060 [P] Update API documentation in `docs/api/swipe-game.md`
- [ ] T061 [P] Add game tutorial and help content in `components/swipe/game-tutorial.tsx`

## Dependencies
- Database setup (T001) blocks all API tests (T005-T010)
- Type definitions (T002-T004) block all implementation tasks
- Contract tests (T005-T010) before API implementation (T027-T032)
- Component tests (T015-T018) before component implementation (T033-T038)
- Models (T019-T022) before services (T023-T026)
- Services before API endpoints (T027-T032)
- Core components before game pages (T039-T041)
- Game engine before analytics (T042-T044)
- Implementation before performance optimization (T050-T053)

## Parallel Example
```
# Launch database setup and type definitions together:
Task: "Initialize game types and interfaces in lib/types/swipe-game.ts"
Task: "Configure Zod validation schemas in lib/validation/swipe-schemas.ts"
Task: "Setup game configuration constants in lib/config/swipe-config.ts"

# Launch all contract tests together:
Task: "Contract test GET /api/swipe/deck in __tests__/api/swipe/deck.test.ts"
Task: "Contract test POST /api/swipe/session/start in __tests__/api/swipe/session-start.test.ts"
Task: "Contract test POST /api/swipe/answer in __tests__/api/swipe/answer.test.ts"
Task: "Contract test POST /api/swipe/session/end in __tests__/api/swipe/session-end.test.ts"
Task: "Contract test GET /api/swipe/stats/user in __tests__/api/swipe/stats.test.ts"
Task: "Contract test GET /api/swipe/recommendations/next-pack in __tests__/api/swipe/recommendations.test.ts"

# Launch model creation in parallel:
Task: "SwipeItem model with content validation in lib/models/swipe-item.ts"
Task: "SwipeSession model with scoring logic in lib/models/swipe-session.ts"
Task: "SwipeAnswer model with latency tracking in lib/models/swipe-answer.ts"
Task: "SwipeUserSkill model with ELO calculations in lib/models/swipe-user-skill.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Game uses precise timing - implement performance monitoring
- ELO system requires careful mathematical validation
- Accessibility is critical for educational tools
- Content quality directly impacts learning outcomes

## Game-Specific Implementation Details

### Scoring System
- Correct answer: +1 point
- Wrong answer: -1.33 points (allows negative scores)
- Anti-spam: Ignore answers < 250ms
- Streak tracking for engagement

### ELO Rating System
- Separate ratings per (lang, exam, skill, tag)
- K-factor: 16-24 for stability
- Item difficulty adjustment based on global performance
- User skill progression tracking

### Content Rules
- Exam-safe determination by provider and skill
- Rule overrides for specific contexts
- Tag-based error categorization
- Version control for content updates

### Performance Requirements
- < 250ms response time for game actions
- 60fps animations during swipe gestures
- Real-time score updates
- Offline capability for practice mode

### Analytics Goals
- Accuracy improvement: +15-25% in 7 days
- Reduce false positives (critical for writing)
- Increase items/min with stable accuracy
- 60% retention for 5-day streaks

## Validation Checklist
*GATE: Checked before marking feature complete*

- [ ] All API endpoints have contract tests
- [ ] All database models have corresponding services
- [ ] Game timing is accurate and performant
- [ ] ELO calculations are mathematically correct
- [ ] Accessibility standards are met (WCAG 2.1 AA)
- [ ] Content validation prevents quality issues
- [ ] Anti-cheat measures are effective
- [ ] Analytics provide actionable insights
- [ ] Mobile experience is equivalent to desktop
- [ ] Error handling covers edge cases