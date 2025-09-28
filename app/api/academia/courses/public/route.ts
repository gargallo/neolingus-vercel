import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/academia/courses/public
 * 
 * Public endpoint for fetching basic course information
 * No authentication required - for course discovery
 */
export async function GET() {
  try {
    // Use service role for public data access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: courses, error } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        language,
        level,
        certification_type,
        description,
        components,
        certification_modules!inner(
          name,
          code,
          official_website
        )
      `)
      .eq("is_active", true)
      .order("language")
      .order("level");

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch courses" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: courses,
      count: courses?.length || 0,
      message: "Courses fetched successfully"
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}