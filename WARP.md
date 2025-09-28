# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

NeoLingus Academy is a **course-centric language learning platform** built with Next.js 15, Supabase, and AI integration. The platform follows a unique architecture where language selection leads to level selection, which then provides a fully adapted course dashboard tailored to specific certifications (EOI English, JQCV Valenciano).

### Core Architecture Principles

- **Course-Centric Design**: Everything revolves around language → level → certification combinations
- **Cultural Adaptation**: Each language course has its own UI theme, navigation, and cultural context
- **AI-Powered Learning**: Vercel AI SDK with OpenAI integration for tutoring and exam generation
- **MCP Integration**: All database operations MUST use Supabase MCP for consistency and auditability
- **Certification Authenticity**: Exam content faithfully replicates official formats (EOI, JQCV, Cambridge, etc.)

## Development Commands

### Essential Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Run all tests
npm test
```

### Database & Setup Commands

```bash
# Initial database setup (creates admin user)
npm run setup

# Advanced setup options
npm run setup-admin         # Create admin user only
npm run setup-database      # Database setup only
npm run setup-db            # Direct database setup
npm run setup-final         # Final production setup
npm run verify-db           # Verify database structure
npm run create-tables       # Create missing tables

# Apply database migrations
npm run apply-testing-migration
```

### Testing Commands

```bash
# Run unit tests with Vitest
npm test

# Integration test scenarios (check __tests__/integration/)
npm test -- scenario-1-course-selection
npm test -- scenario-2-dashboard-access
npm test -- scenario-3-exam-simulation
npm test -- scenario-4-ai-tutoring
npm test -- scenario-5-progress-analytics
npm test -- scenario-6-valenciano-localization
```

## Architecture Overview

### Directory Structure
```
app/                 # Next.js App Router
├── academia/        # Main academy pages  
├── admin/           # Administrative dashboard
├── (auth)/          # Authentication layouts
└── protected/       # Protected content

components/          # React components
├── academia/        # Course-specific components
├── admin/           # Admin components
└── homepage/        # Landing page components

lib/                 # Business logic
├── ai-agents/       # Context7 AI service integration
├── data/            # Static data and content
├── integration/     # Feature integration modules
├── themes/          # Course-specific theming
└── types/           # TypeScript definitions

utils/               # Utilities and helpers
├── ai/              # AI client utilities
├── auth.ts          # Authentication helpers
├── supabase/        # Supabase MCP configuration
└── types/           # Database types

specs/               # Specification-driven development
├── 001-course-centric-academy/  # Core feature specs
└── 002-course-centric-academy/  # Extended feature specs

supabase/            # Database schema and policies
├── migrations/      # SQL migration files
├── functions/       # Database functions
└── policies/        # Row Level Security policies
```

### Key Architectural Concepts

#### 1. Course-Centric Entity Model
Each course is defined by the combination of:
- **Language**: English, Valenciano, Spanish, etc.
- **Level**: B2, C1 (EOI) or Elemental, Mitjà, Superior (JQCV)  
- **Certification Type**: EOI, JQCV, Cambridge, DELE, etc.

This creates unique course contexts like `english-b2-eoi` or `valenciano-mitja-jqcv`.

#### 2. MCP-First Database Operations
**CRITICAL**: All database operations must use the Supabase MCP client from `utils/supabase/mcp-config.ts`. This ensures:
- Consistent error handling and retry logic
- Audit logging for educational data compliance (GDPR/LOPD)
- Request tracking and performance monitoring

```typescript
// Correct approach - use MCP client
import { mcpClient } from '@/utils/supabase/mcp-config';

// Wrong approach - direct Supabase client usage
import { createClient } from '@supabase/supabase-js';
```

#### 3. AI Integration Architecture
The platform integrates with OpenAI through Vercel AI SDK:
- **AI Tutor**: Real-time streaming responses via `/api/generator?prompt=...`
- **Exam Generation**: Custom exam creation via `/api/generator`
- **Course-Aware Prompts**: AI responses adapt to specific course/certification requirements through contextual prompts

### Theme and Localization System

Each course has its own visual and cultural theme defined in `lib/types/course.ts`:
- **Cultural Context**: Colors, fonts, imagery specific to language/region
- **Localization**: Interface language matches course language  
- **Certification Styling**: Visual elements reflect official exam branding

### Testing Strategy

The platform uses a scenario-based testing approach with integration tests that cover:
- **Scenario 1**: Course selection flow
- **Scenario 2**: Dashboard access and personalization
- **Scenario 3**: Exam simulation authenticity
- **Scenario 4**: AI tutoring effectiveness
- **Scenario 5**: Progress analytics accuracy
- **Scenario 6**: Valenciano localization completeness

## Environment Configuration

### Required Environment Variables
```bash
# Supabase Configuration (required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Provider Configuration (required)
OPENAI_API_KEY=your_openai_api_key

# Optional AI Providers
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key

# Demo Mode (development only)
DEMO_MODE=false
```

### Initial Setup Process
1. Copy `.env.example` to `.env.local`
2. Configure Supabase and AI API keys
3. Run database migration: Apply `supabase/migrations/20250910000000_create_academy_system.sql`
4. Execute `npm run setup` to create admin user
5. Start development with `npm run dev`

## Key Development Patterns

### Course Context Pattern
When developing course-related features, always consider the course context:

```typescript
interface CourseContext {
  language: CourseLanguage;
  level: CourseLevel; 
  certification_type: CertificationType;
  cultural_theme: CourseTheme;
  ui_language: string;
}
```

### MCP Query Pattern
Use the MCP wrapper for all database operations:

```typescript
const result = await mcpClient.mcpQuery(
  async () => {
    return await supabase
      .from('courses')
      .select('*')
      .eq('language', courseLanguage);
  },
  {
    table: 'courses',
    action: 'select',
    userId: user?.id,
    metadata: { courseLanguage }
  }
);
```

### AI Context Integration
When integrating AI features, provide course-specific context:

```typescript
// Build contextual prompts for AI integration
const examPrompt = `Generate a ${level} level ${language} ${examType} exam 
following ${certification} standards. Context: ${course.cultural_context}...`;

const { text } = await generateText({
  model: openai('gpt-4'),
  prompt: examPrompt,
  temperature: 0.7
});
```

## Compliance and Data Handling

### GDPR/LOPD Requirements
The platform handles educational data with strict compliance requirements:
- All user data operations are audited via MCP logging
- Data export functionality available via `mcpClient.exportUserData()`
- Data deletion via `mcpClient.deleteUserData()`
- Educational data changes require proper audit trails

### Security Considerations
- Admin users have role-based access (`super_admin`, `admin`, `course_manager`, `support`)
- Row Level Security (RLS) policies protect user data
- Service role operations are isolated and audited
- AI API keys are server-side only

## Common Integration Points

### Adding New Course Languages
1. Update `CourseLanguage` type in `lib/types/course.ts`
2. Add certification mapping in `LANGUAGE_CERTIFICATION_MAP`
3. Create cultural theme configuration
4. Update UI localization files
5. Add integration tests for new language

### Adding Certification Types  
1. Update `CertificationType` type
2. Define standard components in `STANDARD_COMPONENTS`
3. Create assessment rubric configuration
4. Update exam content generation logic
5. Test with official format requirements

### AI Feature Integration
1. Use Vercel AI SDK with OpenAI in `/app/api/generator/route.ts`
2. Create contextual prompts that include course/certification information
3. Implement streaming responses using `streamText()` for real-time interaction
4. Add entitlement checking via Update.dev for premium features
5. Test with different course contexts and certification requirements

This guidance ensures consistent development practices aligned with the platform's course-centric architecture and compliance requirements.
