import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "../../../../utils/supabase/server";

/**
 * POST /api/demo/setup
 * 
 * Sets up demo data for testing purposes
 * Creates user profile, enrollment, and progress data
 * 
 * @param request - Next.js request object  
 * @returns JSON response with setup results
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Create or update user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || "Demo User",
        preferred_language: "english",
        gdpr_consent: true,
        gdpr_consent_date: new Date().toISOString(),
        lopd_consent: true,
        data_retention_preference: "standard",
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return NextResponse.json(
        { success: false, error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    // Get available courses
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("*")
      .eq("is_active", true)
      .limit(3);

    if (coursesError) {
      console.error("Courses fetch error:", coursesError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    const createdEnrollments = [];
    const createdProgress = [];

    // Create enrollments and progress for each course
    for (const course of courses || []) {
      // Create enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from("user_course_enrollments")
        .upsert({
          user_id: user.id,
          course_id: course.id,
          subscription_status: "active",
          subscription_tier: "standard",
          access_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        })
        .select()
        .single();

      if (!enrollmentError) {
        createdEnrollments.push(enrollment);
      }

      // Create progress record with some demo progress
      const progressValue = Math.random() * 0.7 + 0.1; // Random between 0.1 and 0.8
      const { data: progress, error: progressError } = await supabase
        .from("user_course_progress")
        .upsert({
          user_id: user.id,
          course_id: course.id,
          overall_progress: progressValue,
          component_progress: {
            reading: Math.max(0, progressValue + (Math.random() - 0.5) * 0.2),
            writing: Math.max(0, progressValue + (Math.random() - 0.5) * 0.2),
            listening: Math.max(0, progressValue + (Math.random() - 0.5) * 0.2),
            speaking: Math.max(0, progressValue + (Math.random() - 0.5) * 0.2),
          },
          strengths: ["vocabulary", "grammar"],
          weaknesses: ["pronunciation"],
          readiness_score: progressValue * 0.8,
          estimated_study_hours: Math.floor(50 + (1 - progressValue) * 100),
        })
        .select()
        .single();

      if (!progressError) {
        createdProgress.push(progress);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          profile,
          enrollments: createdEnrollments,
          progress: createdProgress,
          courses: courses || [],
        },
        message: `Demo data setup completed for ${user.email}`,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Unexpected error in demo setup:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}