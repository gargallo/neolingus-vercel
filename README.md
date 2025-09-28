# Neolingus Academy Platform

A course-centric language learning platform built with Next.js, Supabase, and Context7 AI integration.

## 🚨 Important: Database Setup Required

**If you're seeing a `get_user_dashboard_data function does not exist` error**, you need to run the database setup first:

```bash
# Quick fix - run this command:
./scripts/setup-database-complete.sh
```

See the [Database Setup Guide](DATABASE_SETUP_GUIDE.md) for detailed instructions if you encounter any issues.

## Features

- Course-centric architecture (language → level → dedicated dashboard)
- Multi-language certification support (EOI English, JQCV Valenciano)
- Supabase MCP integration for all database operations
- Context7 AI tutoring integration
- GDPR/LOPD compliant data handling
- Real-time progress tracking
- Exam simulation engine
- Modular certification system with phased expansion

## Prerequisites

1. Node.js 18+
2. A Supabase project
3. API keys for AI providers (OpenAI, Anthropic, Google AI)

## Setup Instructions

### 1. Environment Configuration

Copy the `.env.example` file to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Then update the following variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `OPENAI_API_KEY` - Your OpenAI API key (required)
- Other AI provider keys as needed

### 2. Database Setup ⚠️ **CRITICAL STEP**

**Run the automated database setup script:**

```bash
chmod +x scripts/setup-database-complete.sh
./scripts/setup-database-complete.sh
```

This script will:
- Verify Supabase CLI and project connectivity
- Push local migrations to database
- Execute comprehensive migration script
- Verify all components are working correctly

**If you see PGRST202 errors**, this setup script resolves them by creating the missing `get_user_dashboard_data` function.

**Manual steps** (if script fails):

```bash
# 1. Apply standard migrations
supabase db push

# 2. Execute comprehensive migration
supabase sql --file="supabase/migrations/apply-all-migrations.sql"

# 3. Verify function exists
supabase sql --query="SELECT routine_schema, routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'get_user_dashboard_data';"
```

**Troubleshooting:** See [DATABASE_SETUP_GUIDE.md](DATABASE_SETUP_GUIDE.md) for detailed instructions on resolving `PGRST202` errors and database setup issues.

### 3. Admin User Setup

Run the setup script to create the admin user:

```bash
npm run setup
```

This will create an admin user with:
- Email: `admin@neolingus.com`
- Password: `TempAdminPass123!`

**Important**: Change this password immediately after first login!

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000` (or the next available port).

## Project Structure

- `/app` - Next.js App Router pages
- `/components` - React components
- `/lib` - Business logic and utilities
- `/utils` - Helper functions
- `/supabase` - Database migrations and configurations
- `/specs` - Specification-driven development files
- `/__tests__` - Unit and integration tests

## Authentication

The platform uses Supabase Auth for authentication. Users can sign in with email/password or OAuth providers (Google, GitHub).

Admin users have access to the admin dashboard at `/admin`.

## API Routes

- `/api/academia/*` - Academy-related endpoints
- `/api/ai/tutor/*` - AI tutoring endpoints
- `/api/admin/*` - Admin endpoints

## Testing

Run unit tests:

```bash
npm test
```

Run integration tests:

```bash
npm run test:integration
```

## Known Issues

### Database Function Error (RESOLVED)

**Issue:** `get_user_dashboard_data function does not exist` error when starting the application.

**Cause:** Database migrations haven't been applied to create the required functions and tables.

**Solution:** Run the database setup script:
```bash
./scripts/setup-database-complete.sh
```

**Status:** ✅ Resolved with comprehensive database setup script

### Missing Tables

**Issue:** Various table-related errors when using different features.

**Cause:** Incomplete database migration process.

**Solution:** The database setup script applies all migrations in the correct order and verifies completion.

**Health Check:** Use `curl http://localhost:3000/api/health` to verify all components are working.

## Troubleshooting

### Database Connection Issues

1. **Verify environment variables** in `.env.local`
2. **Check Supabase project status** in dashboard
3. **Run health check**: `curl http://localhost:3000/api/health`
4. **Review setup logs** in `database-setup.log`

### Migration Failures

1. **Check database permissions** - ensure user has CREATE privileges
2. **Verify Supabase CLI** is installed and updated
3. **Manual reset**: `supabase db reset` (⚠️ destructive operation)
4. **Contact support** with error logs

### Development Server Issues

1. **Clear Next.js cache**: `rm -rf .next`
2. **Reinstall dependencies**: `rm -rf node_modules && npm install`
3. **Check port conflicts**: Try different port with `npm run dev -- -p 3001`

## Deployment

This project can be deployed to Vercel with minimal configuration. Make sure to:

1. Set the same environment variables in your Vercel project settings
2. Apply database migrations to your production Supabase instance
3. Verify health endpoint after deployment: `https://your-domain.com/api/health`

## License

This project is proprietary and confidential. All rights reserved.