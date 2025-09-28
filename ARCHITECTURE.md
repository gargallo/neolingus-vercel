# Neolingus Academy Platform - Architecture Documentation

**A course-centric language learning platform with AI integration and universal exam engine**

## 🏗️ System Architecture Overview

Neolingus is a modern language learning platform built with Next.js 15, Supabase, and comprehensive AI integration. The architecture follows a course-centric approach where everything revolves around language certification preparation.

### Core Architectural Principles

1. **Course-Centric Design**: All features center around courses (language + level + certification type)
2. **Universal Exam Engine**: Unified simulation engine supporting multiple exam formats
3. **AI-First Approach**: Integrated AI tutoring and content generation throughout
4. **MCP Integration**: Model Context Protocol for advanced AI capabilities
5. **GDPR/LOPD Compliance**: Built-in data protection and privacy controls

## 📁 Project Structure

```
neolingus/
├── app/                          # Next.js 15 App Router
│   ├── academia/                 # Student-facing pages
│   │   └── [idioma]/[nivel]/     # Dynamic course routing
│   ├── admin/                    # Administrative interface
│   └── api/                      # API routes and endpoints
├── components/                   # React components
│   ├── academia/                 # Student interface components
│   ├── admin/                    # Admin interface components
│   └── ui/                       # Reusable UI components
├── lib/                          # Business logic and utilities
│   ├── exam-engine/              # Universal exam simulation engine
│   ├── ai-agents/                # AI integration services
│   ├── services/                 # Business logic services
│   └── types/                    # TypeScript definitions
├── utils/                        # Helper functions
│   └── supabase/                 # Database client utilities
└── supabase/                     # Database schema and migrations
```

## 🧠 Core Systems

### 1. Universal Exam Engine
**Location**: `/lib/exam-engine/`

A sophisticated simulation engine that supports multiple certification types:

- **Supported Certifications**: EOI English, JQCV Valenciano, Cambridge, IELTS
- **Core Engines**: Timer, Progress, Session, Scoring, Analytics
- **Adaptive Features**: Course-specific scoring, cultural context awareness
- **Real-time Features**: Live progress tracking, automated saving

```typescript
// Example: Starting an exam session
const engine = new UniversalExamEngine({
  courseConfig: englishB2Config,
  examId: "cambridge-b2-first",
  userId: "user_123",
  sessionId: "session_456"
});

await engine.startExam();
```

### 2. AI Integration System
**Location**: `/lib/ai-agents/`

Multi-provider AI system supporting educational contexts:

- **Providers**: Anthropic Claude, OpenAI GPT, Google AI
- **Services**: AI Tutoring, Content Generation, Progress Analysis
- **Features**: Context-aware responses, exam-specific guidance
- **Integration**: Vercel AI SDK for unified API

```typescript
// Example: AI tutoring session
const tutor = new AITutorService();
const session = await tutor.createTutorSession(userId, courseId, "grammar");
const response = await tutor.sendMessage(sessionId, "Help me with B2 conditionals");
```

### 3. Course Management System
**Location**: `/lib/types/course.ts`, `/lib/services/`

Comprehensive course architecture supporting:

- **Multi-Language Support**: English, Valenciano, Spanish, French, German
- **Certification Types**: EOI, JQCV, Cambridge, IELTS, DELE, etc.
- **Component System**: Reading, Writing, Listening, Speaking modules
- **Progress Tracking**: Real-time progress with component breakdown

### 4. Data Layer (Supabase)
**Location**: `/supabase/`, `/utils/supabase/`

PostgreSQL-based data layer with:

- **Authentication**: Supabase Auth with OAuth providers
- **Real-time**: Live progress updates and session management
- **MCP Integration**: Model Context Protocol for AI operations
- **GDPR Compliance**: Built-in privacy controls and data retention

## 🔄 Data Flow Architecture

### 1. Student Learning Flow
```
Student Login → Course Selection → Dashboard → Exam Simulation → AI Tutoring → Progress Analytics
```

### 2. Admin Management Flow
```
Admin Login → User Management → Course Configuration → Analytics Dashboard → Agent Management
```

### 3. AI Integration Flow
```
User Request → AI Service → Provider API → Context Processing → Response Generation → UI Update
```

## 🎨 UI/UX Architecture

### Design System
- **Framework**: Tailwind CSS with custom design tokens
- **Components**: Radix UI primitives with custom styling
- **Theming**: Course-specific themes with cultural adaptation
- **Responsive**: Mobile-first design with adaptive layouts

### Cultural Localization
- **Language-Specific Theming**: Colors, typography, imagery per language
- **RTL Support**: Ready for right-to-left languages
- **Cultural Context**: Integrated cultural elements and imagery

## 🔧 Technical Implementation Details

### Frontend Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS + Custom CSS
- **State Management**: React hooks + Context API
- **UI Components**: Radix UI + Custom components

### Backend Stack
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **API**: Next.js API routes + Supabase functions
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### AI Integration
- **SDK**: Vercel AI SDK
- **Providers**: Anthropic, OpenAI, Google AI
- **Context**: MCP (Model Context Protocol)
- **Streaming**: Real-time AI responses

### Development Tools
- **Testing**: Vitest + Testing Library + Playwright
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Build**: Next.js build system

## 📊 Database Schema Overview

### Core Tables
```sql
-- Course system
certification_modules
courses
user_profiles
user_course_enrollments
user_course_progress

-- Exam system  
exam_sessions
exam_questions
exam_results

-- AI system
ai_tutor_sessions
ai_interactions
agent_configurations
```

### Key Relationships
- Users → Enrollments → Courses → Certification Modules
- Users → Exam Sessions → Results → Progress
- Users → AI Sessions → Interactions

## 🔒 Security & Privacy

### GDPR/LOPD Compliance
- Explicit consent tracking
- Data retention policies
- Right to erasure support
- Privacy-first design

### Authentication & Authorization
- Supabase Auth integration
- Role-based access control
- Session management
- OAuth provider support

### Data Protection
- Encrypted data storage
- Secure API endpoints
- Input validation and sanitization
- Rate limiting and abuse prevention

## 📈 Performance & Scalability

### Optimization Strategies
- Server-side rendering with Next.js
- Database query optimization
- Image optimization and CDN
- Lazy loading and code splitting

### Caching Strategy
- Static generation for content pages
- API response caching
- Client-side state management
- Progressive enhancement

### Monitoring
- Error tracking and reporting
- Performance monitoring
- User analytics
- A/B testing support

## 🚀 Deployment Architecture

### Infrastructure
- **Hosting**: Vercel (Next.js optimized)
- **Database**: Supabase (managed PostgreSQL)
- **Storage**: Supabase Storage
- **CDN**: Vercel Edge Network

### Environment Management
- Development, staging, production environments
- Environment-specific configuration
- Secure secrets management
- CI/CD pipeline integration

## 🧪 Testing Strategy

### Test Coverage
- **Unit Tests**: Component and utility testing
- **Integration Tests**: API and service testing  
- **E2E Tests**: Complete user journey testing
- **Performance Tests**: Load and stress testing

### Testing Tools
- Vitest for unit/integration tests
- Testing Library for component tests
- Playwright for E2E testing
- Jest for specific test scenarios

## 📚 Key Files for AI Understanding

### Configuration Files
- `next.config.ts` - Next.js configuration
- `package.json` - Dependencies and scripts
- `tailwind.config.js` - Styling configuration
- `tsconfig.json` - TypeScript settings

### Type Definitions
- `/lib/types/course.ts` - Course system types
- `/lib/types/exam-session.ts` - Exam system types
- `/lib/types/academia.ts` - Student interface types

### Core Business Logic
- `/lib/exam-engine/core/universal-engine.ts` - Main exam engine
- `/lib/ai-agents/ai-tutor-service.ts` - AI tutoring service
- `/lib/services/course-service.ts` - Course management

### API Endpoints
- `/app/api/academia/` - Student-facing APIs
- `/app/api/admin/` - Administrative APIs
- `/app/api/ai/` - AI integration APIs

### Database Schema
- `/supabase/migrations/` - Database structure
- `/supabase/policies/` - Row-level security policies

## 🔄 Development Workflow

### Getting Started
1. Clone repository and install dependencies
2. Set up environment variables
3. Run database migrations
4. Start development server
5. Access admin panel for configuration

### Code Conventions
- TypeScript strict mode required
- ESLint and Prettier for code formatting
- Conventional commits for version control
- Component-based architecture
- Service layer pattern for business logic

### Feature Development
1. Create feature specification
2. Design database changes
3. Implement API endpoints
4. Build UI components
5. Add comprehensive tests
6. Update documentation

This architecture enables robust, scalable language learning with AI integration while maintaining code quality, performance, and compliance standards.