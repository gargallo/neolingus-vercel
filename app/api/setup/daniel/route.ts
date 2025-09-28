import { NextRequest, NextResponse } from "next/server";
import { adminSupabase } from "../../../../utils/supabase/admin";

/**
 * POST /api/setup/daniel
 * 
 * Sets up daniel@visionari.es with full access to all courses
 * Creates user account, profile, enrollments, and progress data
 * 
 * This is a one-time setup endpoint for the demo user
 */

const USER_EMAIL = 'daniel@visionari.es';
const USER_PASSWORD = 'NeolingusDemo2025!';
const SUBSCRIPTION_TIER = 'premium';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting user setup for daniel@visionari.es...');

    // Step 1: Create or get the user in Supabase Auth
    console.log('📧 Creating user account...');
    
    // Check if user already exists
    const { data: existingUsers, error: listError } = await adminSupabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    let user = existingUsers.users.find(u => u.email === USER_EMAIL);
    
    if (!user) {
      // Create new user
      const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
        email: USER_EMAIL,
        password: USER_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Daniel Visionari',
          subscription_plan: 'premium',
        }
      });

      if (authError) {
        throw new Error(`Failed to create user: ${authError.message}`);
      }

      user = authData.user;
      console.log(`✅ User created successfully with ID: ${user.id}`);
    } else {
      console.log(`✅ User already exists with ID: ${user.id}`);
      
      // Update user metadata
      const { error: updateError } = await adminSupabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          full_name: 'Daniel Visionari',
          subscription_plan: 'premium',
        }
      });

      if (updateError) {
        console.log(`⚠️ Warning: Failed to update user metadata: ${updateError.message}`);
      }
    }

    // Step 2: Create or update user profile
    console.log('👤 Setting up user profile...');
    
    const { data: profile, error: profileError } = await adminSupabase
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

    // Step 3: Get all available courses
    console.log('📚 Fetching available courses...');
    
    const { data: courses, error: coursesError } = await adminSupabase
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
      return NextResponse.json(
        { 
          success: false, 
          error: "No active courses found. Please ensure courses are properly seeded." 
        },
        { status: 404 }
      );
    }

    // Step 4: Create enrollments for all courses
    console.log('🎓 Creating course enrollments...');
    
    const enrollments = [];
    for (const course of courses) {
      const accessExpiresAt = new Date();
      accessExpiresAt.setFullYear(accessExpiresAt.getFullYear() + 1);

      const { data: enrollment, error: enrollmentError } = await adminSupabase
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

      if (!enrollmentError) {
        enrollments.push(enrollment);
        console.log(`   ✅ Enrolled in: ${course.title}`);
      } else {
        console.log(`⚠️ Failed to create enrollment for ${course.title}: ${enrollmentError.message}`);
      }
    }

    // Step 5: Create realistic progress data for each course
    console.log('📈 Creating course progress data...');
    
    const progressRecords = [];
    for (const course of courses) {
      // Generate realistic progress based on course level
      const baseProgress = course.level === 'b2' ? 0.4 + Math.random() * 0.3 : 0.2 + Math.random() * 0.4;
      const variation = 0.15;

      const componentProgress = {
        reading: Math.min(1.0, Math.max(0.1, baseProgress + (Math.random() - 0.5) * variation)),
        writing: Math.min(1.0, Math.max(0.1, baseProgress + (Math.random() - 0.5) * variation)),
        listening: Math.min(1.0, Math.max(0.1, baseProgress + (Math.random() - 0.5) * variation)),
        speaking: Math.min(1.0, Math.max(0.1, baseProgress + (Math.random() - 0.5) * variation)),
      };

      const overallProgress = Object.values(componentProgress).reduce((sum, val) => sum + val, 0) / 4;

      // Generate strengths and weaknesses
      const skills = ['vocabulary', 'grammar', 'pronunciation', 'fluency', 'comprehension'];
      const strengths: string[] = [];
      const weaknesses: string[] = [];

      Object.entries(componentProgress).forEach(([component, progress]) => {
        if (progress > overallProgress + 0.1) {
          strengths.push(component);
        } else if (progress < overallProgress - 0.1) {
          weaknesses.push(component);
        }
      });

      // Ensure at least some strengths and weaknesses
      if (strengths.length < 2) {
        strengths.push(skills[Math.floor(Math.random() * skills.length)]);
      }
      if (weaknesses.length < 1) {
        weaknesses.push(skills[Math.floor(Math.random() * skills.length)]);
      }

      const { data: progress, error: progressError } = await adminSupabase
        .from('user_course_progress')
        .upsert({
          user_id: user.id,
          course_id: course.id,
          overall_progress: Math.round(overallProgress * 100) / 100,
          component_progress: componentProgress,
          strengths: strengths,
          weaknesses: weaknesses,
          readiness_score: Math.round(overallProgress * 0.85 * 100) / 100,
          estimated_study_hours: Math.floor(80 + (1 - overallProgress) * 120),
          target_exam_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single();

      if (!progressError) {
        progressRecords.push(progress);
        console.log(`   ✅ Progress created for: ${course.title} (${Math.round(overallProgress * 100)}% complete)`);
      } else {
        console.log(`⚠️ Failed to create progress for ${course.title}: ${progressError.message}`);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: profile.full_name,
        },
        profile,
        enrollments: enrollments.length,
        progress: progressRecords.length,
        courses: courses.map(c => ({
          id: c.id,
          title: c.title,
          language: c.language,
          level: c.level,
        })),
      },
      credentials: {
        email: USER_EMAIL,
        password: USER_PASSWORD,
      },
      message: `Setup completed successfully! User can now log in with ${enrollments.length} course enrollments.`,
    });

  } catch (error) {
    console.error('Setup failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}