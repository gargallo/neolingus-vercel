/**
 * Swipe Game Session End API
 *
 * POST /api/swipe/session/end
 * Completes a session and generates final analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { SwipeGameService } from '@/lib/services/swipe-game-service';
import { SessionEndRequestSchema, SessionEndResponseSchema } from '@/lib/validation/swipe-schemas';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedRequest = SessionEndRequestSchema.parse(body);

    // Initialize game service
    const gameService = new SwipeGameService();

    // End session with analysis
    const sessionResult = await gameService.endSession(
      validatedRequest.session_id,
      validatedRequest.ended_at,
      validatedRequest.summary
    );

    // Prepare response data
    const responseData = {
      success: sessionResult.success,
      final_summary: sessionResult.final_summary,
      performance_analysis: {
        level_assessment: sessionResult.performance_analysis.level_assessment,
        strengths: sessionResult.performance_analysis.strengths,
        improvement_areas: sessionResult.performance_analysis.improvement_areas,
        difficulty_trend: sessionResult.performance_analysis.difficulty_trend,
        consistency_score: sessionResult.performance_analysis.consistency_score
      },
      next_recommendations: {
        next_session_difficulty: sessionResult.next_recommendations.next_session_difficulty,
        recommended_focus: sessionResult.next_recommendations.recommended_focus,
        estimated_improvement_time: sessionResult.next_recommendations.estimated_improvement_time,
        practice_frequency: sessionResult.next_recommendations.practice_frequency,
        specific_areas: sessionResult.next_recommendations.specific_areas
      },
      achievements: [], // This would be calculated based on performance
      progress_update: {
        skill_level_change: 0, // This would come from ELO calculation
        milestone_reached: false,
        badges_earned: []
      }
    };

    // Validate response
    const validatedResponse = SessionEndResponseSchema.parse(responseData);

    return NextResponse.json(validatedResponse);

  } catch (error: any) {
    console.error('Session end error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid session end data',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    // Handle specific business logic errors
    if (error.message.includes('Session not found')) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    if (error.message.includes('already completed')) {
      return NextResponse.json(
        { success: false, error: 'Session already completed' },
        { status: 400 }
      );
    }

    if (error.message.includes('Invalid session state')) {
      return NextResponse.json(
        { success: false, error: 'Session is in invalid state for completion' },
        { status: 400 }
      );
    }

    // Handle database/service errors
    if (error.message.includes('Failed to complete session')) {
      return NextResponse.json(
        { success: false, error: 'Unable to complete session. Please try again.' },
        { status: 500 }
      );
    }

    if (error.message.includes('Failed to generate analysis')) {
      return NextResponse.json(
        { success: false, error: 'Session completed but analysis failed. Check your results later.' },
        { status: 202 } // Accepted but incomplete
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Initialize game service
    const gameService = new SwipeGameService();

    // Get session details (this would be implemented in the service)
    // For now, returning mock data structure
    return NextResponse.json({
      success: true,
      session: {
        id: sessionId,
        status: 'active', // or 'completed', 'abandoned'
        can_end: true,
        estimated_score: 0,
        answers_count: 0
      },
      preview_analysis: {
        current_accuracy: 0,
        performance_trend: 'stable'
      }
    });

  } catch (error: any) {
    console.error('Session info error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get session information'
      },
      { status: 500 }
    );
  }
}