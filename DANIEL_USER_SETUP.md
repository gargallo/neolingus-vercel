# Daniel User Setup - Complete

## Overview
I've created a comprehensive setup system for daniel@visionari.es that will provide full access to all available courses in the Neolingus Academy system.

## Files Created

### 1. Node.js Setup Script
**File**: `/scripts/setup-daniel-user.js`
- Comprehensive user setup script
- Creates user account, profile, enrollments, and progress data
- Uses Supabase Admin API to bypass RLS
- Generates realistic progress data for all courses

### 2. API Endpoint
**File**: `/app/api/setup/daniel/route.ts`
- REST API endpoint for user setup
- Same functionality as Node.js script but accessible via HTTP
- URL: `POST /api/setup/daniel`
- Returns JSON response with setup status

### 3. Bash Script Runner
**File**: `/scripts/setup-daniel.sh` (executable)
- Easy-to-use bash script that handles the entire process
- Tries API endpoint first, falls back to direct script execution
- Includes error handling and user-friendly output

### 4. Documentation
**File**: `/scripts/USER_SETUP.md`
- Comprehensive guide for using the setup system
- Troubleshooting section
- Verification steps

### 5. Package.json Integration
- Added `setup-daniel` npm script for easy execution

## What Gets Set Up

### User Account
- **Email**: daniel@visionari.es
- **Password**: NeolingusDemo2025!
- **Subscription**: Premium plan (24.5€)
- **Access Duration**: 1 year

### Course Enrollments
The user will be enrolled in ALL active courses:
- English B2 - EOI Certification
- English C1 - EOI Certification
- Valencià B2 - JQCV Certification
- Valencià C1 - JQCV Certification

### Progress Data
- Realistic progress percentages (20-70% per course)
- Component-specific scores (reading, writing, listening, speaking)
- Auto-generated strengths and weaknesses
- Readiness scores and estimated study hours
- Target exam dates (90 days out)

## Usage Options

### Option 1: Simple Bash Script (Recommended)
```bash
./scripts/setup-daniel.sh
```

### Option 2: NPM Script
```bash
npm run setup-daniel
```

### Option 3: Direct Node.js
```bash
node scripts/setup-daniel-user.js
```

### Option 4: API Endpoint
```bash
# With server running
curl -X POST http://localhost:3000/api/setup/daniel
```

## Expected Result
After running any of the setup methods, daniel@visionari.es will be able to:

1. **Log in** with the provided credentials
2. **See real course data** instead of demo placeholders
3. **Access all enrolled courses** with premium subscription benefits
4. **View realistic progress** across all course components
5. **Use all academy features** including AI tutor, exam simulator, etc.

## Environment Requirements
Make sure your `.env` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Next Steps
1. Ensure Supabase environment variables are configured
2. Run one of the setup methods above
3. Start the development server: `npm run dev`
4. Test login with daniel@visionari.es / NeolingusDemo2025!
5. Verify course access and data display

The setup is now complete and ready to use!