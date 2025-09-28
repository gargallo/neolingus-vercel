import { NextResponse } from "next/server";
import { createSupabaseClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
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

    // Parse request body
    const body = await request.json();
    const { courseId, analytics } = body;

    // Validate required fields
    if (!courseId || !analytics) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }


    // Verify user is enrolled in this course
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("user_course_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle();

    if (enrollmentError) {
      console.error("Error checking enrollment:", enrollmentError);
      return NextResponse.json(
        { success: false, error: "Failed to verify enrollment" },
        { status: 500 }
      );
    }

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // Generate recommendations based on analytics
    // This is a simplified implementation - in a real app, this would be more complex
    const recommendations = [];

    // Get improvement areas from component analysis
    const improvementAreas = Object.entries(analytics.componentAnalysis)
      .filter(([, analysis]) => analysis.averageScore < 70)
      .map(([component]) => component);

    const strengthAreas = Object.entries(analytics.componentAnalysis)
      .filter(([, analysis]) => analysis.averageScore >= 80)
      .map(([component]) => component);

    // Recommendation based on improvement areas
    if (improvementAreas.length > 0) {
      recommendations.push({
        id: `rec_improve_${Date.now()}`,
        type: "focus_area",
        title: "Focus on Improvement Areas",
        description: `You should focus on improving your skills in: ${improvementAreas.join(
          ", "
        )}`,
        priority: "high",
        action: "practice",
        resources: improvementAreas.map((area) => ({
          title: `Practice ${area} exercises`,
          url: `/dashboard/${courseId}/practice/${area}`,
          type: "internal",
        })),
      });
    }

    // Recommendation based on strength areas
    if (strengthAreas.length > 0) {
      recommendations.push({
        id: `rec_strengthen_${Date.now()}`,
        type: "strength_building",
        title: "Build on Your Strengths",
        description: `Continue practicing your strong areas: ${strengthAreas.join(
          ", "
        )} to maintain excellence`,
        priority: "medium",
        action: "practice",
        resources: strengthAreas.map((area) => ({
          title: `Advanced ${area} challenges`,
          url: `/dashboard/${courseId}/advanced/${area}`,
          type: "internal",
        })),
      });
    }

    // General progress recommendation
    if (analytics.averageScore < 50) {
      recommendations.push({
        id: `rec_progress_${Date.now()}`,
        type: "general",
        title: "Study Plan Recommendation",
        description:
          "Create a consistent study schedule to improve your overall progress",
        priority: "high",
        action: "schedule",
        resources: [
          {
            title: "Study planning guide",
            url: "/resources/study-planning",
            type: "pdf",
          },
        ],
      });
    } else if (analytics.averageScore < 80) {
      recommendations.push({
        id: `rec_advance_${Date.now()}`,
        type: "general",
        title: "Advance to Next Level",
        description:
          "Consider taking a full practice exam to test your readiness",
        priority: "medium",
        action: "assessment",
        resources: [
          {
            title: "Full practice exam",
            url: `/dashboard/${courseId}/exam/full-practice`,
            type: "internal",
          },
        ],
      });
    } else {
      recommendations.push({
        id: `rec_excellence_${Date.now()}`,
        type: "general",
        title: "Maintain Excellence",
        description:
          "Continue your excellent progress with regular review sessions",
        priority: "low",
        action: "review",
        resources: [
          {
            title: "Review past exams",
            url: `/dashboard/${courseId}/review`,
            type: "internal",
          },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (err) {
    console.error("Unexpected error in POST /api/academia/recommendations:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}