#!/usr/bin/env node

/**
 * User Setup Script for daniel@visionari.es
 * 
 * This script bootstraps the daniel@visionari.es user with:
 * - User profile with 24.5€ subscription plan
 * - Active enrollments to all available courses
 * - Realistic progress data for all courses
 * 
 * Usage: node scripts/setup-daniel-user.js
 * 
 * Requirements:
 * - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const USER_EMAIL = 'daniel@visionari.es';
const USER_PASSWORD = 'NeolingusDemo2025!'; // Temporary password for demo
const SUBSCRIPTION_PLAN = 'premium'; // For 24.5€ plan
const SUBSCRIPTION_TIER = 'premium';

// Create Supabase admin client
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Main setup function
async function setupDanielUser() {
  const supabase = createAdminClient();
  
  console.log('🚀 Starting user setup for daniel@visionari.es...\n');

  try {
    // Step 1: Create or get the user in Supabase Auth
    console.log('📧 Creating user account...');
    
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    let user = existingUsers.users.find(u => u.email === USER_EMAIL);
    
    if (!user) {
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: USER_EMAIL,
        password: USER_PASSWORD,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          full_name: 'Daniel Visionari',
          subscription_plan: SUBSCRIPTION_PLAN,
        }
      });

      if (authError) {
        throw new Error(`Failed to create user: ${authError.message}`);
      }

      user = authData.user;
      console.log(`✅ User created successfully with ID: ${user.id}`);
    } else {
      console.log(`✅ User already exists with ID: ${user.id}`);
      
      // Update user metadata to ensure subscription plan is set
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          full_name: 'Daniel Visionari',
          subscription_plan: SUBSCRIPTION_PLAN,
        }
      });

      if (updateError) {
        console.log(`⚠️  Warning: Failed to update user metadata: ${updateError.message}`);
      }
    }

    // Step 2: Create or update user profile
    console.log('👤 Setting up user profile...');
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: 'Daniel Visionari',
        preferred_language: 'english',
        gdpr_consent: true,
        gdpr_consent_date: new Date().toISOString(),
        lopd_consent: true,
        data_retention_preference: 'standard',
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to create user profile: ${profileError.message}`);
    }

    console.log('✅ User profile created/updated successfully');

    // Step 3: Get all available courses
    console.log('📚 Fetching available courses...');
    
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        *,
        certification_modules:certification_module_id (
          name,
          code,
          language,
          certification_body
        )
      `)
      .eq('is_active', true);

    if (coursesError) {
      throw new Error(`Failed to fetch courses: ${coursesError.message}`);
    }

    if (!courses || courses.length === 0) {
      console.log('⚠️  No active courses found. Please ensure courses are properly seeded.');
      return;
    }

    console.log(`✅ Found ${courses.length} active courses:`);
    courses.forEach(course => {
      console.log(`   - ${course.title} (${course.language} ${course.level.toUpperCase()})`);
    });

    // Step 4: Create enrollments for all courses
    console.log('\n🎓 Creating course enrollments...');
    
    const enrollments = [];
    for (const course of courses) {
      const accessExpiresAt = new Date();
      accessExpiresAt.setFullYear(accessExpiresAt.getFullYear() + 1); // 1 year access

      const { data: enrollment, error: enrollmentError } = await supabase
        .from('user_course_enrollments')
        .upsert({
          user_id: user.id,
          course_id: course.id,
          subscription_status: 'active',
          subscription_tier: SUBSCRIPTION_TIER,
          access_expires_at: accessExpiresAt.toISOString(),
        })
        .select()
        .single();

      if (enrollmentError) {
        console.log(`⚠️  Failed to create enrollment for ${course.title}: ${enrollmentError.message}`);
      } else {
        enrollments.push(enrollment);
        console.log(`   ✅ Enrolled in: ${course.title}`);
      }
    }

    // Step 5: Create realistic progress data for each course
    console.log('\n📈 Creating course progress data...');
    
    const progressRecords = [];
    for (const course of courses) {
      // Generate realistic progress based on course level
      const baseProgress = course.level === 'b2' ? 0.4 + Math.random() * 0.3 : 0.2 + Math.random() * 0.4;
      const variation = 0.15; // ±15% variation between components

      const componentProgress = {
        reading: Math.min(1.0, Math.max(0.1, baseProgress + (Math.random() - 0.5) * variation)),
        writing: Math.min(1.0, Math.max(0.1, baseProgress + (Math.random() - 0.5) * variation)),
        listening: Math.min(1.0, Math.max(0.1, baseProgress + (Math.random() - 0.5) * variation)),
        speaking: Math.min(1.0, Math.max(0.1, baseProgress + (Math.random() - 0.5) * variation)),
      };

      // Calculate overall progress as average
      const overallProgress = Object.values(componentProgress).reduce((sum, val) => sum + val, 0) / 4;

      // Generate strengths and weaknesses based on progress
      const skills = ['vocabulary', 'grammar', 'pronunciation', 'fluency', 'comprehension'];
      const strengths = [];
      const weaknesses = [];

      // Higher progress components become strengths
      Object.entries(componentProgress).forEach(([component, progress]) => {
        if (progress > overallProgress + 0.1) {
          strengths.push(component);
        } else if (progress < overallProgress - 0.1) {
          weaknesses.push(component);
        }
      });

      // Add some general skills
      if (strengths.length < 2) {
        strengths.push(skills[Math.floor(Math.random() * skills.length)]);
      }
      if (weaknesses.length < 1) {
        weaknesses.push(skills[Math.floor(Math.random() * skills.length)]);
      }

      const { data: progress, error: progressError } = await supabase
        .from('user_course_progress')
        .upsert({
          user_id: user.id,
          course_id: course.id,
          overall_progress: Math.round(overallProgress * 100) / 100, // Round to 2 decimal places
          component_progress: componentProgress,
          strengths: strengths,
          weaknesses: weaknesses,
          readiness_score: Math.round(overallProgress * 0.85 * 100) / 100,
          estimated_study_hours: Math.floor(80 + (1 - overallProgress) * 120),
          target_exam_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        })
        .select()
        .single();

      if (progressError) {
        console.log(`⚠️  Failed to create progress for ${course.title}: ${progressError.message}`);
      } else {
        progressRecords.push(progress);
        console.log(`   ✅ Progress created for: ${course.title} (${Math.round(overallProgress * 100)}% complete)`);
      }
    }

    // Step 6: Summary
    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👤 User: ${profile.full_name} (${profile.email})`);
    console.log(`   🎓 Enrollments: ${enrollments.length} courses`);
    console.log(`   📈 Progress records: ${progressRecords.length} courses`);
    console.log(`   💳 Subscription: ${SUBSCRIPTION_TIER} plan`);
    console.log(`   📅 Access expires: 1 year from now`);
    
    console.log('\n🔑 Login credentials:');
    console.log(`   Email: ${USER_EMAIL}`);
    console.log(`   Password: ${USER_PASSWORD}`);
    
    console.log('\n✅ The user can now log in and access all enrolled courses!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the setup
if (require.main === module) {
  setupDanielUser().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { setupDanielUser };