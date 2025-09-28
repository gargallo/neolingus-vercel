# Claude Code Context - Neolingus Academy Course Dashboard Redesign

**Project**: Neolingus Course-Centric Academy with Course Dashboard Redesign
**Architecture**: Next.js 15 App Router + Supabase + TypeScript
**Updated**: 2025-09-17

## Recent Context (Course Dashboard Redesign Feature)

### New Feature: Course Dashboard Redesign
- **Purpose**: Remove redundant "Proveedores de examen" section and implement modern card-based layout
- **Integration**: Redesign existing course dashboard while maintaining functionality
- **Key Requirements**: Remove provider showcase, add statistics cards, activity timeline, quick actions

### Database Extensions Added
```sql
-- New tables for plan management
CREATE TABLE plans (
    id UUID PRIMARY KEY,
    name VARCHAR(255) UNIQUE,
    tier VARCHAR(20) CHECK (tier IN ('basic', 'standard', 'premium')),
    features JSONB DEFAULT '[]',
    pricing JSONB DEFAULT '{}',
    trial_enabled BOOLEAN DEFAULT true,
    trial_duration_days INTEGER DEFAULT 7
);

-- Extended user_course_enrollments with plan fields
ALTER TABLE user_course_enrollments 
ADD COLUMN plan_id UUID REFERENCES plans(id),
ADD COLUMN trial_started_at TIMESTAMPTZ,
ADD COLUMN trial_expires_at TIMESTAMPTZ;
```

### API Endpoints to Implement
```typescript
// Admin plan management
/api/admin/plans                 // GET (list), POST (create)
/api/admin/plans/[id]           // GET, PUT, DELETE
/api/admin/plans/[id]/subscribers // GET subscribers
/api/admin/plans/assign         // POST assign plan to user
/api/admin/users/[id]/plans     // GET user plans, PUT change plan

// Public plan information  
/api/plans                      // GET active plans for signup
/api/plans/[id]/trial          // POST start trial
```

### Component Structure to Create
```
app/admin/plans/
├── page.tsx              # Plans list with CRUD
├── create/page.tsx       # Plan creation form
├── [id]/
│   ├── page.tsx         # Plan details/edit
│   ├── subscribers/page.tsx # Plan subscribers view
components/admin/plans/
├── plan-list.tsx        # Plans data table
├── plan-form.tsx        # Plan create/edit form
├── subscriber-list.tsx  # Plan subscribers table
├── plan-assignment.tsx  # User plan assignment component
components/plans/
├── plan-selection.tsx   # Frontend plan cards
├── plan-comparison.tsx  # Plan feature comparison
├── trial-banner.tsx     # Trial status indicator
```

## Project Overview

### Core Architecture
- **Framework**: Next.js 15 with App Router pattern
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Authentication**: Supabase Auth with middleware protection
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: React Server Components + Client Components
- **Real-time**: Supabase Realtime subscriptions

### Course-Centric Structure
```
/dashboard/[idioma]/[nivel]/        # Dynamic course routes
  ├── page.tsx                     # Course dashboard
  ├── examens/[proveedor]/         # Exam provider routes
  │   └── [examId]/simulador/      # Exam simulator
  └── layout.tsx                   # Course-specific layout

/admin/                            # Admin panel
  ├── users/                       # User management
  ├── courses/                     # Course management
  ├── analytics/                   # Usage analytics
  └── plans/                       # NEW: Plan management
```

### Key Database Tables
```sql
-- Existing core tables
user_profiles               # User accounts with GDPR consent
courses                     # Language courses (english_b2, valenciano_c1)  
user_course_enrollments     # User course subscriptions with tiers
exam_sessions              # Individual exam attempts with AI feedback
user_course_progress       # Progress tracking and analytics

-- New plan management tables
plans                      # Subscription plans with features/pricing
plan_templates            # Reusable plan configurations
```

### Authentication Flow
- Middleware in `middleware.ts` handles route protection
- Admin routes require `super_admin` or `admin` role
- Course access controlled by subscription status and tier
- API routes use `createSupabaseClientFromRequest()` for auth

### MCP Integration Patterns
```typescript
// Supabase MCP for database operations
import { mcpClient } from '@/utils/supabase/mcp-config';

// Database operations through MCP
const result = await mcpClient.query({
  table: 'plans',
  operation: 'select',
  filters: { is_active: true }
});
```

## Development Patterns

### API Route Pattern
```typescript
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseClientFromRequest(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Implementation
}
```

### Component Pattern
```typescript
// Server Component for data fetching
async function PlansList() {
  const supabase = await createSupabaseClient();
  const { data: plans } = await supabase.from('plans').select('*');
  
  return <PlansTable plans={plans} />;
}

// Client Component for interactions
'use client';
function PlansTable({ plans }: { plans: Plan[] }) {
  // Interactive functionality
}
```

### Form Validation Pattern
```typescript
import { z } from 'zod';

const planSchema = z.object({
  name: z.string().min(1).max(255),
  tier: z.enum(['basic', 'standard', 'premium']),
  features: z.array(planFeatureSchema),
  pricing: planPricingSchema
});
```

## Important Implementation Notes

### Security Requirements
- All admin operations require role verification
- Plan assignments create audit trail in `plan_change_history`
- Trial periods are time-bounded and automatically expire
- GDPR compliance maintained for subscription data

### Performance Considerations  
- Plan metadata cached in Redis for frontend performance
- Database indexes on `(plan_id, subscription_status)` for admin queries
- Pagination for plan subscriber lists
- Real-time updates via Supabase Realtime for plan changes

### Error Handling Patterns
```typescript
// API error responses
if (!plan) {
  return NextResponse.json(
    { success: false, error: "Plan not found" },
    { status: 404 }
  );
}

// Frontend error boundaries for plan selection UI
// Graceful degradation when plan data unavailable
```

### Testing Strategy
- API route tests using Vitest
- Component tests for plan selection flow
- E2E tests for complete admin plan management workflow
- Database performance tests for plan queries

## Current Status
- ✅ Research and design phase complete
- ✅ Data model and API contracts defined  
- ✅ Quickstart validation scenarios documented
- ⏳ Ready for implementation phase

## Next Steps
1. Create database migrations for plan tables
2. Implement admin plan CRUD API routes
3. Build admin plan management UI components
4. Create frontend plan selection components
5. Add trial management logic
6. Integration testing with existing course system