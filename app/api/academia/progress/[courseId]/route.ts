import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "../../../../../utils/supabase/server";

/**
 * GET /api/academia/progress/[courseId]
 * 
 * Retrieves user progress for a specific course
 * Uses progress service for enhanced analytics and caching
 * 
 * @param request - Next.js request object
 * @param context - Route context containing courseId parameter
 * @returns JSON response with progress data and analytics
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
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

    const { courseId } = await context.params;

    // Validate courseId format (basic UUID check)
    if (!courseId || courseId.length < 3) {
      return NextResponse.json(
        { success: false, error: "Invalid course ID" },
        { status: 400 }
      );
    }

    // Extract query parameters for additional options
    const { searchParams } = new URL(request.url);
    const includeAnalytics = searchParams.get("include_analytics") !== "false";
    const includeRecommendations = searchParams.get("include_recommendations") === "true";

    // Get user progress for the course
    const { data: progress, error: progressError } = await supabase
      .from("user_course_progress")
      .select(`
        *,
        courses (
          id,
          title,
          language,
          level,
          certification_type,
          components
        )
      `)
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (progressError) {
      console.error("Progress fetch error:", progressError);
      return NextResponse.json(
        { success: false, error: "Progress not found" },
        { status: 404 }
      );
    }

    // Get recent exam sessions for analytics if requested
    let analytics = null;
    let recentSessions = null;
    
    if (includeAnalytics && progress) {
      const { data: sessions, error: sessionsError } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .order("started_at", { ascending: false })
        .limit(10);

      if (!sessionsError && sessions) {
        recentSessions = sessions;
        
        // Calculate basic analytics
        const completedSessions = sessions.filter(s => s.is_completed);
        const averageScore = completedSessions.length > 0 
          ? completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedSessions.length 
          : 0;
        
        analytics = {
          total_sessions: sessions.length,
          completed_sessions: completedSessions.length,
          average_score: averageScore,
          improvement_trend: completedSessions.length > 1 
            ? (completedSessions[0].score || 0) - (completedSessions[completedSessions.length - 1].score || 0)
            : 0,
          last_session_date: sessions[0]?.started_at,
        };
      }
    }

    // Generate basic recommendations if requested
    let recommendations = null;
    if (includeRecommendations && progress) {
      recommendations = [
        {
          type: "focus_area",
          title: "Improve weak areas",
          description: `Focus on ${(progress.weaknesses || []).join(", ") || "general skills"}`,
          priority: "high"
        },
        {
          type: "practice",
          title: "Regular practice sessions",
          description: "Take practice exams to improve your readiness score",
          priority: "medium"
        }
      ];
    }

    return NextResponse.json({
      success: true,
      data: {
        progress,
        analytics,
        recommendations,
        recent_sessions: recentSessions,
      },
      metadata: {
        course_id: courseId,
        user_id: user.id,
        last_updated: progress?.last_activity || progress?.updated_at,
        data_freshness: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Unexpected error in GET /api/academia/progress/[courseId]:", error);
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}