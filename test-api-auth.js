#!/usr/bin/env node

const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const { createClient } = require('@supabase/supabase-js');

async function testAuthenticatedAPI() {
  console.log('🔐 Testing Authenticated API Endpoints\n');

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Test with existing user (daniel@visionari.es)
  console.log('1️⃣ Testing with Service Role Authentication:');
  
  try {
    // Use service role client for direct database access
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Test courses query directly
    const { data: courses, error } = await serviceSupabase
      .from('courses')
      .select(`
        id, 
        title, 
        language, 
        level, 
        certification_type,
        is_active,
        created_at,
        certification_modules!inner(name, code)
      `)
      .eq('is_active', true);

    if (error) {
      console.log(`   ❌ Direct query error: ${error.message}`);
    } else {
      console.log(`   ✅ Successfully fetched ${courses.length} active courses`);
      courses.forEach(course => {
        console.log(`      - ${course.title}`);
        console.log(`        Language: ${course.language}, Level: ${course.level}`);
        console.log(`        Certification: ${course.certification_modules.name} (${course.certification_modules.code})`);
        console.log(`        Active: ${course.is_active}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log(`   ❌ Service role exception: ${err.message}`);
  }

  // Test course enrollments
  console.log('2️⃣ Testing Course Enrollments:');
  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: enrollments, error } = await serviceSupabase
      .from('user_course_enrollments')
      .select(`
        id,
        enrollment_date,
        subscription_status,
        user_profiles!inner(email, full_name),
        courses!inner(title, language, level)
      `);

    if (error) {
      console.log(`   ❌ Enrollments query error: ${error.message}`);
    } else {
      console.log(`   ✅ Found ${enrollments.length} course enrollments`);
      enrollments.forEach(enrollment => {
        console.log(`      - ${enrollment.user_profiles.email} enrolled in ${enrollment.courses.title}`);
        console.log(`        Status: ${enrollment.subscription_status}`);
        console.log(`        Date: ${new Date(enrollment.enrollment_date).toLocaleDateString()}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log(`   ❌ Enrollments exception: ${err.message}`);
  }

  // Test admin functionality
  console.log('3️⃣ Testing Admin User Access:');
  try {
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: adminUsers, error } = await serviceSupabase
      .from('admin_users')
      .select('id, role, active, last_login, created_at');

    if (error) {
      console.log(`   ❌ Admin users query error: ${error.message}`);
    } else {
      console.log(`   ✅ Found ${adminUsers.length} admin users`);
      adminUsers.forEach(admin => {
        console.log(`      - Role: ${admin.role}, Active: ${admin.active}`);
        console.log(`        Last Login: ${admin.last_login || 'Never'}`);
        console.log(`        Created: ${new Date(admin.created_at).toLocaleDateString()}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log(`   ❌ Admin users exception: ${err.message}`);
  }

  console.log('🎯 API Authentication Test Complete!');
}

testAuthenticatedAPI().catch(console.error);