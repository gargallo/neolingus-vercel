import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClient } from "../../../../../../utils/supabase/server";
import { courseService } from "../../../../../../lib/services/course-service";
import type { CourseLanguage } from "../../../../../../lib/types/academia";
import { isValidCourseLanguage } from "../../../../../../lib/services/course-service";

/**
 * GET /api/academia/courses/by-language/[language]
 * 
 * Retrieves courses filtered by language with proper validation
 * Uses course service for enhanced functionality and caching
 * 
 * @param request - Next.js request object
 * @param params - Route parameters containing language
 * @returns JSON response with language-specific courses
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ language: string }> }
) {
  try {
    // Get user from authentication
    const supabase = await createSupabaseClient();
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

    const { language } = await params;

    // Validate language parameter
    if (!isValidCourseLanguage(language)) {
      return NextResponse.json(
        { success: false, error: "Invalid language parameter" },
        { status: 400 }
      );
    }

    // Use course service to fetch courses by language
    const courses = await courseService.getCoursesByLanguage(
      language as CourseLanguage, 
      user.id
    );

    return NextResponse.json({
      success: true,
      data: courses,
      language,
      total: courses.length,
    });

  } catch (error) {
    console.error("Unexpected error in GET /api/academia/courses/by-language/[language]:", error);
    
    // Handle specific service errors
    if (error instanceof Error && error.message.includes('CourseServiceError')) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}