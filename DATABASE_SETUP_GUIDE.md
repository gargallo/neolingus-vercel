# Database Setup Guide

This guide explains how to resolve the `PGRST202` error and set up the complete Neolingus database schema.

## Understanding the PGRST202 Error

### What is PGRST202?

The `PGRST202` error occurs when PostgREST (used by Supabase) cannot find a requested function or RPC endpoint. In our case, it specifically refers to:

```
Error: PGRST202 - Could not find the function get_user_dashboard_data in any accessible schema
```

### Why This Happens

1. **Missing Function**: The `get_user_dashboard_data` function hasn't been created in the database
2. **Incomplete Migrations**: Database migrations weren't applied correctly
3. **Schema Issues**: Function exists but in wrong schema or with wrong permissions
4. **Timing Issues**: Function exists but dependent tables are missing

### Impact on Application

When this error occurs:
- Dashboard API endpoints return 503 errors
- User analytics data cannot be retrieved
- Modern dashboard features are unavailable
- Application health checks fail

## Quick Start

Run the automated setup script:

```bash
chmod +x scripts/setup-database-complete.sh
./scripts/setup-database-complete.sh
```

This script will:
- Verify Supabase CLI and project connectivity
- Push local migrations to the database
- Execute the comprehensive migration script
- Verify all components are working correctly

## Manual Setup (If Automated Script Fails)

### Prerequisites

1. **Supabase CLI installed**:
   ```bash
   npm install -g supabase
   ```

2. **Project linked to Supabase**:
   ```bash
   supabase link
   ```

3. **Environment variables configured**:
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

### Step 1: Apply Standard Migrations

```bash
# Apply all pending migrations
supabase db push
```

### Step 2: Execute Comprehensive Migration

```bash
supabase sql --file="supabase/migrations/apply-all-migrations.sql"
```

### Step 3: Verify Function Exists

```bash
supabase sql --query="SELECT routine_schema, routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_user_dashboard_data';"
```

## Required Database Schema

### Core Tables

The following tables must exist for the application to function:

#### 1. User Management
- `user_profiles` - User account information and preferences
- `user_analytics` - Engagement metrics and achievement tracking
- `user_course_enrollments` - Course subscriptions and access

#### 2. Course System
- `courses` - Available language courses
- `exam_sessions` - Individual exam attempts
- `course_progress` - Learning progress tracking

#### 3. Dashboard System
- `dashboard_widgets` - Configurable dashboard components
- `user_widget_preferences` - Personalized widget layouts
- `user_progress_visualizations` - Custom progress charts

#### 4. Plan Management
- `plans` - Subscription plans with features and pricing
- Plan linking via `user_course_enrollments.plan_id`

### Critical Functions

#### `get_user_dashboard_data(p_user_id UUID)`

**Purpose**: Primary function for dashboard data retrieval

**Returns**:
```sql
TABLE(
    user_stats JSONB,      -- User analytics and engagement data
    configured_widgets JSONB,  -- Dashboard widget configuration
    recent_progress JSONB     -- Recent progress and achievements
)
```

**Usage**:
```sql
SELECT * FROM get_user_dashboard_data('user-uuid-here');
```

## Troubleshooting

### Common Issues

#### 1. `PGRST202` Error - Function Not Found

**Symptoms**:
```
PGRST202: Could not find the function get_user_dashboard_data in the schema cache
```

**Solution**:
```bash
# Run the comprehensive migration
./scripts/setup-database-complete.sh

# Or manually execute
cat supabase/migrations/apply-all-migrations.sql | supabase db remote --experimental
```

#### 2. Missing Tables Error

**Symptoms**:
```
relation "user_analytics" does not exist
```

**Solution**:
```bash
# Reset and reapply all migrations
supabase db reset
./scripts/setup-database-complete.sh
```

#### 3. Permission Errors

**Symptoms**:
```
permission denied for relation user_analytics
```

**Solution**:
- Check that Row Level Security (RLS) policies are properly configured
- Verify user authentication in your application
- Ensure the user has the correct role assignments

#### 4. Supabase CLI Connection Issues

**Symptoms**:
```
Error: Cannot connect to Supabase project
```

**Solution**:
```bash
# Re-link your project
supabase link

# Check status
supabase status

# Verify environment variables
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

### Advanced Troubleshooting

#### Check Migration Status

```sql
-- View applied migrations
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;
```

#### Manually Test Function

```sql
-- Test with a dummy UUID
SELECT get_user_dashboard_data('00000000-0000-0000-0000-000000000000'::uuid);
```

#### Check RLS Policies

```sql
-- View RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

#### Verify Indexes

```sql
-- Check critical indexes exist
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('user_analytics', 'dashboard_widgets', 'courses');
```

## Migration Details

### What the Comprehensive Migration Creates

1. **Core Tables**: All essential tables with proper constraints and indexes
2. **Functions**: `get_user_dashboard_data` and XP calculation functions
3. **Triggers**: Automatic `updated_at` timestamp management
4. **RLS Policies**: Secure access control for all tables
5. **Default Data**: Sample courses, widgets, and plans
6. **Indexes**: Performance-optimized database indexes

### Migration Order

The migration script applies changes in this order:

1. Extensions and basic setup
2. User profiles system
3. Course and exam tables
4. Modern dashboard schema
5. Plan management tables
6. AI agents system
7. Performance indexes
8. Essential functions (**including `get_user_dashboard_data`**)
9. Triggers and automation
10. Row Level Security (RLS)
11. Default data insertion
12. Verification queries

## Verification Checklist

After running the setup, verify these components:

- [ ] Supabase CLI connectivity
- [ ] All migrations applied successfully
- [ ] `get_user_dashboard_data` function exists
- [ ] Critical tables present (`user_analytics`, `dashboard_widgets`, `courses`, `user_course_enrollments`)
- [ ] Function executes without errors
- [ ] Health endpoint returns `"healthy"` status
- [ ] Dashboard loads without `PGRST202` errors

## Support

If you continue to experience issues:

1. **Check the health endpoint**: `GET /api/health` for detailed diagnostics
2. **Review application logs**: Look for specific error details
3. **Verify environment**: Ensure all environment variables are correctly set
4. **Database connection**: Test direct database connectivity
5. **Migration state**: Check which migrations have been applied

## Performance Notes

- The database includes optimized indexes for common query patterns
- JSONB fields use GIN indexes for efficient querying
- RLS policies are designed for minimal performance impact
- Function execution is optimized for dashboard loading speeds

The setup creates a production-ready database schema that can handle thousands of concurrent users while maintaining fast dashboard loading times.