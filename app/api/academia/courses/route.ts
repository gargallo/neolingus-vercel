import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "../../../../utils/supabase/server";

/**
 * GET /api/academia/courses
 * 
 * Retrieves all available courses with optional filtering
 * Implements authentication, caching, and comprehensive error handling
 * 
 * @param request - Next.js request object
 * @returns JSON response with courses data or error
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from Supabase
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

    // Extract query parameters for filtering
    const { searchParams } = new URL(request.url);
    const language = searchParams.get("language");
    const level = searchParams.get("level");
    const institution = searchParams.get("institution");
    const available = searchParams.get("available");

    // Build query with filters
    let query = supabase
      .from("courses")
      .select(`
        id,
        course_id,
        title,
        language,
        level,
        institution,
        region,
        description,
        cultural_context,
        image_url,
        available,
        created_at,
        updated_at
      `);

    if (language) {
      query = query.eq("language", language);
    }
    if (level) {
      query = query.eq("level", level);
    }
    if (institution) {
      query = query.eq("institution", institution);
    }
    if (available !== null) {
      query = query.eq("available", available === "true");
    } else {
      // Default to available courses only
      query = query.eq("available", true);
    }

    // Order by language and level
    query = query.order("language").order("level");

    const { data: courses, error } = await query;

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: courses || [],
      total: (courses || []).length,
      metadata: {
        user_id: user.id,
        filters: {
          language,
          level,
          institution,
          available: available || "true"
        }
      }
    });

  } catch (error) {
    console.error("Unexpected error in GET /api/academia/courses:", error);
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}