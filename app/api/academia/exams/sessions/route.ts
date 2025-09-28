import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "@/utils/supabase/server";

// Types for exam sessions based on database schema
interface ExamSession {
  id: string;
  user_id: string;
  course_id: string;
  progress_id?: string;
  session_type: "practice" | "mock_exam" | "diagnostic";
  component: "reading" | "writing" | "listening" | "speaking";
  started_at: string;
  completed_at: string | null;
  duration_seconds: number;
  responses: Record<string, any>;
  score: number | null;
  detailed_scores: Record<string, any>;
  ai_feedback: string | null;
  improvement_suggestions: any[];
  is_completed: boolean;
  session_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CreateExamSessionInput {
  course_id: string;
  session_type?: "practice" | "mock_exam" | "diagnostic";
  component: "reading" | "writing" | "listening" | "speaking";
}

/**
 * POST /api/academia/exams/sessions
 * 
 * Creates a new exam session for a user
 * 
 * @param request - Next.js request object
 * @returns JSON response with created session data or error
 */
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body: CreateExamSessionInput = await request.json();
    
    if (!body.course_id || !body.component) {
      return NextResponse.json(
        { success: false, error: "course_id and component are required" },
        { status: 400 }
      );
    }

    // Validate course exists
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("id", body.course_id)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Get or create user progress record
    let { data: progress, error: progressError } = await supabase
      .from("user_course_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", body.course_id)
      .single();

    if (progressError) {
      // Create progress record if it doesn't exist
      const { data: newProgress, error: createProgressError } = await supabase
        .from("user_course_progress")
        .insert({
          user_id: user.id,
          course_id: body.course_id,
          overall_progress: 0.0,
          component_progress: {},
          strengths: [],
          weaknesses: [],
          readiness_score: 0.0,
          estimated_study_hours: 0,
        })
        .select("id")
        .single();

      if (createProgressError) {
        console.error("Failed to create progress record:", createProgressError);
        return NextResponse.json(
          { success: false, error: "Failed to create progress record" },
          { status: 500 }
        );
      }
      progress = newProgress;
    }

    // Create new exam session in database
    const sessionData = {
      user_id: user.id,
      course_id: body.course_id,
      progress_id: progress.id,
      session_type: body.session_type || "practice",
      component: body.component,
      started_at: new Date().toISOString(),
      duration_seconds: 0,
      responses: {},
      detailed_scores: {},
      improvement_suggestions: [],
      is_completed: false,
      session_data: {
        user_email: user.email,
        created_via_api: true,
        initial_timestamp: Date.now(),
      },
    };

    const { data: session, error: sessionError } = await supabase
      .from("exam_sessions")
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error("Database error creating session:", sessionError);
      return NextResponse.json(
        { success: false, error: "Failed to create exam session" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        session,
        message: "Exam session created successfully",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Unexpected error in POST /api/academia/exams/sessions:", error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('NOT_ENROLLED')) {
        return NextResponse.json(
          { success: false, error: "Not enrolled in this course" },
          { status: 403 }
        );
      }
      
      if (error.message.includes('JSON')) {
        return NextResponse.json(
          { success: false, error: "Invalid JSON in request body" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/academia/exams/sessions
 * 
 * Retrieves exam sessions for a user
 * Query parameters:
 * - course_id: Filter by specific course
 * - session_type: Filter by session type (practice, mock_exam, diagnostic)
 * - component: Filter by component (reading, writing, listening, speaking)
 * - is_completed: Filter by completion status
 * - limit: Limit number of results (default 10)
 * 
 * @param request - Next.js request object
 * @returns JSON response with session list or error
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from authentication
    const supabase = createSupabaseClientFromRequest(request);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Debug logging
    console.log('🔐 AUTH DEBUG - Sessions GET:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      cookies: request.headers.get('cookie')?.includes('supabase') ? 'Present' : 'Missing'
    });

    if (authError || !user) {
      console.error('🚨 AUTH FAILED - Sessions GET:', authError);
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');
    const sessionType = searchParams.get('session_type') as "practice" | "mock_exam" | "diagnostic" | null;
    const component = searchParams.get('component') as "reading" | "writing" | "listening" | "speaking" | null;
    const isCompleted = searchParams.get('is_completed');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50 results

    // Build query with filters
    let query = supabase
      .from("exam_sessions")
      .select(`
        *,
        courses (
          id,
          title,
          language,
          level,
          certification_type
        )
      `)
      .eq("user_id", user.id);

    if (courseId) {
      query = query.eq("course_id", courseId);
    }
    if (sessionType) {
      query = query.eq("session_type", sessionType);
    }
    if (component) {
      query = query.eq("component", component);
    }
    if (isCompleted !== null) {
      query = query.eq("is_completed", isCompleted === "true");
    }

    // Order by creation date (most recent first) and apply limit
    query = query.order("started_at", { ascending: false }).limit(limit);

    const { data: sessions, error: sessionError } = await query;

    if (sessionError) {
      console.error("Database error fetching sessions:", sessionError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch exam sessions" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        sessions: sessions || [],
        total: (sessions || []).length,
        filters: {
          course_id: courseId,
          session_type: sessionType,
          component,
          is_completed: isCompleted,
          limit,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Unexpected error in GET /api/academia/exams/sessions:", error);
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}