import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "../../../../../utils/auth";
import { aiTutorService } from "../../../../../lib/services/ai-tutor-service";
import { courseService } from "../../../../../lib/services/course-service";
import { progressService } from "../../../../../lib/services/progress-service";
import type { UUID } from "../../../../../lib/types/academia";

/**
 * POST /api/ai/tutor/chat
 * 
 * Handles AI tutor chat interactions with comprehensive validation
 * Uses AI tutor service for enhanced tutoring and context management
 * 
 * @param request - Next.js request object
 * @returns JSON response with AI tutor response or error
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { course_id, message, context_type = "general", session_id } = body;

    // Validate required fields
    if (!course_id) {
      return NextResponse.json(
        { success: false, error: "course_id is required" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "message is required" },
        { status: 400 }
      );
    }

    // Validate message content
    if (typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid message: message cannot be empty" },
        { status: 400 }
      );
    }

    if (message.length > 10000) {
      return NextResponse.json(
        { success: false, error: "Invalid message: message too long (max 10000 characters)" },
        { status: 400 }
      );
    }

    // Validate course_id format (basic UUID check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(course_id)) {
      return NextResponse.json(
        { success: false, error: "Invalid course_id format" },
        { status: 400 }
      );
    }

    // Validate context_type
    const validContextTypes = ['general', 'session_specific', 'weakness_focused'];
    if (!validContextTypes.includes(context_type)) {
      return NextResponse.json(
        { success: false, error: "Invalid context_type" },
        { status: 400 }
      );
    }

    // Sanitize message (basic security measure)
    const sanitizedMessage = message
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[script removed]')
      .replace(/<img\b[^>]*>/gi, '[image removed]')
      .replace(/DROP TABLE/gi, '[SQL removed]')
      .trim();

    // Check for unexpected fields (basic security)
    const allowedFields = ['course_id', 'message', 'context_type', 'session_id'];
    const bodyKeys = Object.keys(body);
    const unexpectedFields = bodyKeys.filter(key => !allowedFields.includes(key));
    
    if (unexpectedFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Unexpected field: ${unexpectedFields[0]}` },
        { status: 400 }
      );
    }

    // Get course and verify it exists
    let course;
    try {
      course = await courseService.getCourseById(course_id as UUID, user.id);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Get user progress to check enrollment
    let userProgress;
    try {
      userProgress = await progressService.getProgressByUserAndCourse(
        user.id as UUID,
        course_id as UUID,
        { includeAnalytics: false }
      );
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "User not enrolled in course" },
        { status: 404 }
      );
    }

    // Prepare tutor context
    const tutorContext = {
      courseId: course_id,
      userId: user.id,
      contextType: context_type,
      sessionId: session_id || null,
      courseLevel: course.level,
      courseLanguage: course.language,
      userProgress: userProgress?.overall_progress || 0
    };

    // Use AI tutor service to send message
    const aiResponse = await aiTutorService.sendMessage(sanitizedMessage, tutorContext);

    // Set security headers
    const response = NextResponse.json({
      message: aiResponse.message,
      suggestions: aiResponse.suggestions || [],
      resources: aiResponse.resources || [],
      context_updated: aiResponse.context_updated || false
    });

    response.headers.set('x-content-type-options', 'nosniff');
    response.headers.set('x-frame-options', 'DENY');

    return response;

  } catch (error) {
    console.error("Unexpected error in POST /api/ai/tutor/chat:", error);
    
    // Handle specific service errors
    if (error instanceof Error) {
      if (error.message.includes('AI service unavailable')) {
        return NextResponse.json(
          { success: false, error: "AI service unavailable" },
          { status: 500 }
        );
      }
      
      if (error.message.includes('AITutorServiceError')) {
        return NextResponse.json(
          { success: false, error: "Failed to process AI request" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}