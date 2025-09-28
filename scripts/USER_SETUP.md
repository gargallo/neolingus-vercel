# User Setup Guide - daniel@visionari.es

This guide explains how to set up the demo user `daniel@visionari.es` with full access to all available courses in the Neolingus Academy system.

## Overview

The setup process creates:
- ✅ User account in Supabase Auth
- ✅ User profile with premium subscription (24.5€ plan)
- ✅ Active enrollments to all available courses
- ✅ Realistic progress data for each course
- ✅ 1-year access to all content

## Prerequisites

1. **Environment Variables**: Ensure your `.env` file contains:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Database Migration**: Make sure the database migration has been run:
   ```bash
   # The migration should already be applied, but if needed:
   # Apply migration: supabase/migrations/20250910000000_create_academy_system.sql
   ```

3. **Dependencies**: Ensure Node.js dependencies are installed:
   ```bash
   npm install
   ```

## Setup Methods

### Method 1: Bash Script (Recommended)

The easiest way to set up the user:

```bash
# From the project root directory
./scripts/setup-daniel.sh
```

This script will:
1. Check for required environment variables
2. Try to use the API endpoint (if server is running)
3. Fall back to direct script execution if needed
4. Display the login credentials

### Method 2: Direct Node.js Script

Run the Node.js script directly:

```bash
# From the project root directory
node scripts/setup-daniel-user.js
```

### Method 3: API Endpoint

If your development server is running, you can use the API endpoint:

```bash
# Start the development server first
npm run dev

# In another terminal, call the setup API
curl -X POST http://localhost:3000/api/setup/daniel \
  -H "Content-Type: application/json"
```

Or visit the endpoint in your browser:
```
POST http://localhost:3000/api/setup/daniel
```

## Login Credentials

After successful setup, use these credentials to log in:

```
Email: daniel@visionari.es
Password: NeolingusDemo2025!
```

## What Gets Created

### User Profile
- **Name**: Daniel Visionari
- **Email**: daniel@visionari.es
- **Subscription**: Premium plan (24.5€)
- **GDPR/LOPD**: Consents are set to true
- **Preferred Language**: English
- **Access Duration**: 1 year

### Course Enrollments
The user will be enrolled in ALL active courses, which currently include:
- English B2 - EOI Certification
- English C1 - EOI Certification  
- Valencià B2 - JQCV Certification
- Valencià C1 - JQCV Certification

### Progress Data
For each course, realistic progress data is generated:
- **Overall Progress**: 20-70% (varies by course level)
- **Component Progress**: Individual scores for reading, writing, listening, speaking
- **Strengths**: Automatically assigned based on higher-performing components
- **Weaknesses**: Automatically assigned based on lower-performing components
- **Readiness Score**: 85% of overall progress
- **Study Hours**: Estimated remaining hours (80-200 hours)
- **Target Exam Date**: 90 days from setup date

## Verification

After running the setup, you can verify it worked by:

1. **Starting the development server**:
   ```bash
   npm run dev
   ```

2. **Logging in**:
   - Navigate to the login page
   - Enter the credentials above
   - You should see the user's dashboard with all enrolled courses

3. **Checking the database** (optional):
   ```sql
   -- Check user profile
   SELECT * FROM user_profiles WHERE email = 'daniel@visionari.es';
   
   -- Check enrollments
   SELECT * FROM user_course_enrollments 
   WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'daniel@visionari.es');
   
   -- Check progress
   SELECT * FROM user_course_progress 
   WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'daniel@visionari.es');
   ```

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Check that your `.env` file exists and contains the required variables
   - Make sure you're using `SUPABASE_SERVICE_ROLE_KEY`, not the anon key

2. **"No active courses found"**
   - Ensure the database migration has been applied
   - Check that courses are marked as `is_active = true` in the database

3. **"User already exists"**
   - The script handles existing users gracefully
   - It will update the existing user's metadata and create missing enrollments/progress

4. **"Connection refused" (when using API method)**
   - Make sure the development server is running (`npm run dev`)
   - The script will automatically fall back to direct execution

### Manual Cleanup (if needed)

To remove the user and start over:

```sql
-- Delete in this order to respect foreign key constraints
DELETE FROM user_course_progress WHERE user_id = (
  SELECT id FROM user_profiles WHERE email = 'daniel@visionari.es'
);

DELETE FROM user_course_enrollments WHERE user_id = (
  SELECT id FROM user_profiles WHERE email = 'daniel@visionari.es'
);

DELETE FROM user_profiles WHERE email = 'daniel@visionari.es';

-- Delete from auth (requires admin access)
-- This would need to be done through Supabase dashboard or admin API
```

## Success Indicators

After successful setup, you should see:
- ✅ User account created/updated
- ✅ User profile created
- ✅ X course enrollments (where X is the number of active courses)
- ✅ X progress records created
- ✅ Login credentials displayed

The user will now be able to log in and access their enrolled courses without seeing demo data.