# Research: Course-Centric Academy Architecture

## Course-Centric Routing Architecture

**Decision**: Implement dynamic routing using Next.js App Router with nested layouts
**Rationale**:

- Next.js 15.2.4+ App Router provides excellent support for nested layouts and dynamic segments
- Pattern `/dashboard/[idioma]/[nivel]` allows complete UI adaptation per course
- Server components enable optimal performance for course-specific content loading
- Middleware can handle course validation and redirection

**Alternatives considered**:

- Query parameters: Rejected due to poor UX and SEO
- Subdomain routing: Rejected due to complexity and DNS management overhead
- Hash routing: Rejected due to server-side rendering limitations

## App-Like UI Design System

**Decision**: Modern component architecture with Tailwind CSS 4.0+ and shadcn/ui
**Rationale**:

- Tailwind CSS 4.0+ provides excellent performance with CSS-in-JS optimizations
- shadcn/ui components offer consistent, accessible, and customizable design system
- Framer Motion for smooth animations and transitions
- CSS Grid and Flexbox for responsive layouts

**Alternatives considered**:

- Material-UI: Rejected due to less customization flexibility
- Chakra UI: Rejected due to bundle size concerns
- Custom CSS: Rejected due to maintenance overhead

## MCP Integration for Educational Data

**Decision**: Implement Supabase MCP with Context7 for all educational operations
**Rationale**:

- Constitutional requirement for data consistency and auditability
- Context7 provides superior AI context management for educational content
- Supabase MCP ensures reliable database operations with educational data governance
- Enables proper GDPR/LOPD compliance tracking

**Alternatives considered**:

- Direct Supabase client: Constitutional violation
- Other MCP providers: Context7 specifically required for AI contexts

## Authentic Exam Format Implementation

**Decision**: Component-based exam engine with JSON configuration
**Rationale**:

- Each certification type (EOI, JQCV) can have independent exam configurations
- Reusable components for common question types (multiple choice, essay, listening)
- Timer and scoring engines specific to official certification requirements
- Adaptive UI that matches official exam interfaces

**Alternatives considered**:

- Third-party exam platforms: Rejected due to lack of customization
- Hardcoded exam logic: Rejected due to scalability issues

## AI-Powered Features Integration

**Decision**: Vercel AI SDK Core with multi-provider support
**Rationale**:

- Already integrated in the project with OpenAI GPT-4+
- Stream-based responses for real-time tutoring
- Context7 integration for educational context management
- Cost optimization through intelligent prompt engineering

**Alternatives considered**:

- Direct OpenAI API: Rejected due to complexity and cost management
- LangChain: Rejected due to bundle size and complexity

## Multi-Language Internationalization

**Decision**: Next.js built-in i18n with custom course context adaptation
**Rationale**:

- Native Next.js i18n supports locale detection and routing
- Custom context providers for course-specific language adaptation
- Content adaptation beyond translation (cultural context, exam formats)
- SEO optimization for different language markets

**Alternatives considered**:

- react-i18next: Rejected due to SSR complexity
- Manual language switching: Rejected due to poor UX

## Performance Optimization Strategy

**Decision**: Course-specific code splitting with Next.js dynamic imports
**Rationale**:

- Each course loads only relevant components and content
- Exam engines loaded on-demand to minimize initial bundle
- Image optimization for course-specific media content
- Service worker for offline exam capabilities

**Alternatives considered**:

- Single bundle: Rejected due to performance impact
- Micro-frontends: Rejected due to complexity overhead

## Authentication and Progress Tracking

**Decision**: Supabase Auth with course-specific progress isolation
**Rationale**:

- Leverages existing Supabase integration
- Row-level security for course-specific data
- Progress tracking separated by course context
- Integration with Update.dev for entitlements

**Alternatives considered**:

- Shared progress model: Rejected due to course isolation requirements
- Firebase Auth: Rejected due to existing Supabase infrastructure
