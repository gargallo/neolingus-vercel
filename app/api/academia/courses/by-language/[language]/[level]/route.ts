import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "../../../../../../../utils/supabase/server";
import { courseService } from "../../../../../../../lib/services/course-service";
import { mcpClient } from "../../../../../../../utils/supabase/mcp-config";
import type { CourseLanguage, CourseLevel } from "../../../../../../../lib/types/academia";
import { isValidCourseLanguage, isValidCourseLevel } from "../../../../../../../lib/services/course-service";

/**
 * GET /api/academia/courses/by-language/[language]/[level]
 * 
 * Retrieves a specific course by language and level
 * Uses course service for enhanced functionality and validation
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing language and level
 * @returns JSON response with specific course data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ language: string; level: string }> }
) {
  try {
    // Get user from authentication
    const supabase = createSupabaseClientFromRequest(request);
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

    const { language, level } = await params;

    // Validate parameters
    if (!isValidCourseLanguage(language)) {
      return NextResponse.json(
        { success: false, error: "Invalid language parameter" },
        { status: 400 }
      );
    }

    if (!isValidCourseLevel(level)) {
      return NextResponse.json(
        { success: false, error: "Invalid level parameter" },
        { status: 400 }
      );
    }

    // Get courses by language and filter by level
    const courses = await courseService.getCoursesByLanguage(
      language as CourseLanguage, 
      user.id
    );

    const course = courses.find(c => c.level === level);

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
    });

  } catch (error) {
    console.error("Unexpected error in GET /api/academia/courses/by-language/[language]/[level]:", error);
    
    if (error instanceof Error && error.message.includes('CourseServiceError')) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch course" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/academia/courses/by-language/[language]/[level]
 * 
 * Enrolls a user in a specific course by language and level
 * Creates enrollment record and initializes progress tracking
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing language and level
 * @returns JSON response confirming enrollment or error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ language: string; level: string }> }
) {
  try {
    // Get user from authentication
    const supabase = createSupabaseClientFromRequest(request);
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

    const { language, level } = await params;

    // Validate parameters
    if (!isValidCourseLanguage(language)) {
      return NextResponse.json(
        { success: false, error: "Invalid language parameter" },
        { status: 400 }
      );
    }

    if (!isValidCourseLevel(level)) {
      return NextResponse.json(
        { success: false, error: "Invalid level parameter" },
        { status: 400 }
      );
    }

    // Parse optional request body
    let enrollmentData: any = {};
    try {
      const body = await request.text();
      if (body) {
        enrollmentData = JSON.parse(body);
      }
    } catch (error) {
      // Ignore parse errors for empty or invalid JSON - enrollment can proceed with defaults
    }

    // Verify course exists
    const courses = await courseService.getCoursesByLanguage(
      language as CourseLanguage, 
      user.id
    );

    const course = courses.find(c => c.level === level);

    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Use MCP to check existing enrollment and create new enrollment
    const client = mcpClient.getClient();
    
    // Check if user is already enrolled
    const { data: existingEnrollment, error: enrollmentError } = await client
      .from("user_course_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .maybeSingle();

    if (enrollmentError && enrollmentError.code !== 'PGRST116') {
      console.error("Error checking enrollment:", enrollmentError);
      return NextResponse.json(
        { success: false, error: "Failed to check enrollment" },
        { status: 500 }
      );
    }

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: "Already enrolled in this course" },
        { status: 409 }
      );
    }

    // Create initial progress record (serves as enrollment)
    const defaultProgress = {
      user_id: user.id,
      course_id: course.id,
      enrollment_date: new Date().toISOString(),
      last_activity: new Date().toISOString(),
      overall_progress: 0.0,
      component_progress: {
        reading: 0.0,
        writing: 0.0,
        listening: 0.0,
        speaking: 0.0,
      },
      strengths: [],
      weaknesses: [],
      readiness_score: 0.0,
      estimated_study_hours: 0,
      analytics: {
        totalSessions: 0,
        totalTimeSpent: 0,
        averageScore: 0,
        bestScore: 0,
        consistencyScore: 0,
        improvementRate: 0,
        componentAnalysis: {
          reading: {
            sessionsCompleted: 0,
            averageScore: 0,
            bestScore: 0,
            timeSpentMinutes: 0,
            improvementTrend: "stable",
            skillBreakdown: {},
            recommendedFocus: []
          },
          writing: {
            sessionsCompleted: 0,
            averageScore: 0,
            bestScore: 0,
            timeSpentMinutes: 0,
            improvementTrend: "stable",
            skillBreakdown: {},
            recommendedFocus: []
          },
          listening: {
            sessionsCompleted: 0,
            averageScore: 0,
            bestScore: 0,
            timeSpentMinutes: 0,
            improvementTrend: "stable",
            skillBreakdown: {},
            recommendedFocus: []
          },
          speaking: {
            sessionsCompleted: 0,
            averageScore: 0,
            bestScore: 0,
            timeSpentMinutes: 0,
            improvementTrend: "stable",
            skillBreakdown: {},
            recommendedFocus: []
          }
        },
        learningVelocity: 0
      }
    };

    const { data: progressRecord, error: progressError } = await client
      .from("user_course_progress")
      .insert([defaultProgress])
      .select()
      .single();

    if (progressError) {
      console.error("Error creating progress record:", progressError);
      return NextResponse.json(
        { success: false, error: "Failed to enroll in course" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Successfully enrolled in course",
        data: {
          course_id: course.id,
          course_title: course.title,
          language: course.language,
          level: course.level,
          enrollment_id: progressRecord.id,
          enrollment_date: progressRecord.enrollment_date
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Unexpected error in POST /api/academia/courses/by-language/[language]/[level]:", error);
    
    if (error instanceof Error && error.message.includes('CourseServiceError')) {
      return NextResponse.json(
        { success: false, error: "Failed to process enrollment" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
