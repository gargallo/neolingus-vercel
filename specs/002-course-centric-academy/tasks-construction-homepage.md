# Tasks: Construction Homepage for Non-Logged Users

**Input**: User request to create a construction homepage for non-logged users with login/signup buttons using shadcn
**Prerequisites**: Existing academy architecture from `/specs/002-course-centric-academy/`
**Context**: Replace current demo content with professional construction-themed homepage, with impressive website usignshadcn/ui you can get an example lik e

## Execution Flow Summary

Based on the user's specific request:

1. **Setup**: Configure shadcn/ui components for construction theme
2. **Tests**: Create component and integration tests (TDD approach)
3. **Core**: Build homepage components with auth buttons
4. **Integration**: Connect with existing Supabase auth system
5. **Polish**: Optimize and finalize the homepage experience

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- File paths are relative to project root

## Phase 3.1: Setup & Dependencies

- [ ] T001 Install shadcn/ui components (Button, Card, Badge, Input, Form) if not already installed
- [ ] T002 [P] Create homepage component structure in `components/homepage/`
- [ ] T003 [P] Add construction theme configuration in `lib/themes/construction.ts`
- [ ] T004 [P] Create TypeScript interfaces for homepage props in `lib/types/homepage.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [ ] T005 [P] Component test for ConstructionBanner in `__tests__/components/homepage/construction-banner.test.tsx`
- [ ] T006 [P] Component test for AuthActionButtons in `__tests__/components/homepage/auth-action-buttons.test.tsx`
- [ ] T007 [P] Component test for FeatureShowcase in `__tests__/components/homepage/feature-showcase.test.tsx`
- [ ] T008 [P] Component test for DevelopmentStatus in `__tests__/components/homepage/development-status.test.tsx`
- [ ] T009 [P] Integration test for homepage auth flow in `__tests__/integration/homepage-auth.test.tsx`
- [ ] T010 [P] Integration test for responsive design in `__tests__/integration/homepage-responsive.test.tsx`

## Phase 3.3: Core Homepage Components (ONLY after tests are failing)

### Main Components

- [ ] T011 [P] ConstructionBanner with hero section in `components/homepage/construction-banner.tsx`
- [ ] T012 [P] AuthActionButtons with login/signup in `components/homepage/auth-action-buttons.tsx`
- [ ] T013 [P] FeatureShowcase highlighting academy features in `components/homepage/feature-showcase.tsx`
- [ ] T014 [P] DevelopmentStatus showing progress in `components/homepage/development-status.tsx`
- [ ] T015 [P] ComingSoonCard for upcoming features in `components/homepage/coming-soon-card.tsx`

### Layout Components

- [ ] T016 [P] ConstructionNavigation for non-auth users in `components/homepage/construction-navigation.tsx`
- [ ] T017 [P] ConstructionFooter with contact info in `components/homepage/construction-footer.tsx`
- [ ] T018 ConstructionHomepage main layout in `components/homepage/construction-homepage.tsx`

## Phase 3.4: Page Integration

- [ ] T019 Update main homepage route in `app/page.tsx` to conditionally show construction page
- [ ] T020 Add auth state detection middleware in `middleware.ts` for homepage routing
- [ ] T021 Update app layout in `app/layout.tsx` to handle construction mode

## Phase 3.5: Styling & Animation

- [ ] T022 [P] Construction theme CSS variables in `app/globals.css`
- [ ] T023 [P] Smooth animations for homepage sections in `components/homepage/animations.ts`
- [ ] T024 [P] Responsive design utilities in `lib/utils/responsive-homepage.ts`

## Phase 3.6: Auth Integration

- [ ] T025 Connect AuthActionButtons to existing Supabase auth in current auth system
- [ ] T026 Add post-login redirect logic to course selection
- [ ] T027 Implement signup flow integration with existing user profiles

## Phase 3.7: Content & SEO

- [ ] T028 [P] Homepage content configuration in `lib/content/homepage-content.ts`
- [ ] T029 [P] SEO metadata for construction homepage in `app/page.tsx` head section
- [ ] T030 [P] Add structured data for search engines

## Phase 3.8: Polish & Optimization

- [ ] T031 [P] Optimize images and assets for homepage in `public/homepage/`
- [ ] T032 [P] Add loading states and error boundaries
- [ ] T033 [P] Implement accessibility features (ARIA labels, keyboard navigation)
- [ ] T034 [P] Performance optimization (lazy loading, code splitting)
- [ ] T035 [P] Cross-browser compatibility testing and fixes

## Dependencies

### Critical Dependencies (TDD)

- **Tests (T005-T010) MUST COMPLETE and FAIL** before implementation (T011-T035)
- T001-T004 (setup) blocks T011-T018 (components)

### Component Dependencies

- T011-T017 (individual components) blocks T018 (main layout)
- T018 (main layout) blocks T019 (page integration)
- T025-T027 (auth integration) require T012 (auth buttons)

### Integration Dependencies

- T019-T021 (page integration) blocks T028-T030 (content & SEO)
- T022-T024 (styling) can run parallel with T011-T017
- T031-T035 (polish) require all core functionality complete

## Parallel Execution Examples

### Setup Phase (T001-T004):

```bash
# Can run together - different areas:
Task: "Create homepage component structure in components/homepage/"
Task: "Add construction theme configuration in lib/themes/construction.ts"
Task: "Create TypeScript interfaces for homepage props in lib/types/homepage.ts"
```

### Test Phase (T005-T010):

```bash
# All tests can run together - different files:
Task: "Component test for ConstructionBanner in __tests__/components/homepage/construction-banner.test.tsx"
Task: "Component test for AuthActionButtons in __tests__/components/homepage/auth-action-buttons.test.tsx"
Task: "Component test for FeatureShowcase in __tests__/components/homepage/feature-showcase.test.tsx"
Task: "Component test for DevelopmentStatus in __tests__/components/homepage/development-status.test.tsx"
Task: "Integration test for homepage auth flow in __tests__/integration/homepage-auth.test.tsx"
Task: "Integration test for responsive design in __tests__/integration/homepage-responsive.test.tsx"
```

### Component Development (T011-T017):

```bash
# Individual components can run together:
Task: "ConstructionBanner with hero section in components/homepage/construction-banner.tsx"
Task: "AuthActionButtons with login/signup in components/homepage/auth-action-buttons.tsx"
Task: "FeatureShowcase highlighting academy features in components/homepage/feature-showcase.tsx"
Task: "DevelopmentStatus showing progress in components/homepage/development-status.tsx"
Task: "ComingSoonCard for upcoming features in components/homepage/coming-soon-card.tsx"
Task: "ConstructionNavigation for non-auth users in components/homepage/construction-navigation.tsx"
Task: "ConstructionFooter with contact info in components/homepage/construction-footer.tsx"
```

## Technical Requirements

### Design Specifications

- **Framework**: Use shadcn/ui components exclusively
- **Theme**: Professional construction/development aesthetic
- **Responsive**: Mobile-first responsive design
- **Performance**: Page load < 200ms
- **Accessibility**: WCAG 2.1 AA compliance

### Content Requirements

- **Hero Section**: Clear construction messaging with progress indicator
- **Feature Preview**: Showcase academy capabilities (English/Valenciano courses)
- **Auth CTA**: Prominent login and signup buttons
- **Status Update**: Development progress and timeline
- **Contact Info**: How to get updates or contact team

### Integration Requirements

- **Auth System**: Connect to existing Supabase authentication
- **Routing**: Conditional rendering based on auth state
- **SEO**: Optimize for search engines and social sharing
- **Analytics**: Track homepage engagement (if existing)

## Success Criteria

- [ ] Non-authenticated users see professional construction homepage
- [ ] Login and signup buttons integrate with existing auth system
- [ ] Users redirect to course selection after successful authentication
- [ ] Homepage loads in <200ms with smooth animations
- [ ] Responsive design works on all device sizes
- [ ] All accessibility standards met (WCAG 2.1 AA)
- [ ] SEO metadata properly configured
- [ ] Construction theme looks professional and modern

## Notes

- **Replacement Focus**: This replaces current demo content completely
- **Auth Integration**: Must work with existing Supabase auth system
- **Design Consistency**: Follow existing academy branding and color scheme
- **Performance**: Optimize for fast loading and smooth interactions
- **Future-Proof**: Design should be easy to update as development progresses

## File Structure

```
components/homepage/
├── construction-banner.tsx
├── auth-action-buttons.tsx
├── feature-showcase.tsx
├── development-status.tsx
├── coming-soon-card.tsx
├── construction-navigation.tsx
├── construction-footer.tsx
├── construction-homepage.tsx
├── animations.ts
lib/
├── themes/construction.ts
├── types/homepage.ts
├── content/homepage-content.ts
├── utils/responsive-homepage.ts
__tests__/
├── components/homepage/
└── integration/
public/homepage/
├── images/
└── assets/
```

This structure ensures clean separation of concerns while maintaining compatibility with the existing academy architecture.
