/**
 * Swipe Game Session Start API
 *
 * POST /api/swipe/session/start
 * Creates a new swipe game session
 */

import { NextRequest, NextResponse } from 'next/server';
import { SwipeGameService } from '@/lib/services/swipe-game-service';
import { ClientSessionStartRequestSchema, StartSessionResponseSchema } from '@/lib/validation/swipe-schemas';
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
    const validatedRequest = ClientSessionStartRequestSchema.parse(body);

    // Override user_id with authenticated user ID for security
    const sessionParams = {
      ...validatedRequest,
      user_id: user.id
    };

    // Initialize game service
    const gameService = new SwipeGameService(supabase);

    // Start new session
    const sessionResult = await gameService.startSession(sessionParams);

    // Prepare response data
    const responseData = {
      success: true,
      session_id: sessionResult.session_id,
      session: {
        id: sessionResult.session.id,
        user_id: sessionResult.session.user_id,
        lang: sessionResult.session.lang,
        level: sessionResult.session.level,
        exam: sessionResult.session.exam,
        skill: sessionResult.session.skill,
        duration_s: sessionResult.session.duration_s,
        status: sessionResult.session.status,
        started_at: sessionResult.session.started_at,
        created_at: sessionResult.session.created_at
      },
      deck_size: sessionResult.deck_size,
      estimated_difficulty: sessionResult.estimated_difficulty,
      expires_at: new Date(
        new Date(sessionResult.session.started_at).getTime() +
        (sessionResult.session.duration_s * 1000) +
        (5 * 60 * 1000) // 5 minute grace period
      ).toISOString()
    };

    // Validate response
    const validatedResponse = StartSessionResponseSchema.parse(responseData);

    return NextResponse.json(validatedResponse, { status: 201 });

  } catch (error: any) {
    console.error('Session start error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }

    // Handle specific business logic errors
    if (error.message.includes('Invalid language')) {
      return NextResponse.json(
        { success: false, error: 'Unsupported language' },
        { status: 400 }
      );
    }

    if (error.message.includes('Invalid level')) {
      return NextResponse.json(
        { success: false, error: 'Unsupported level' },
        { status: 400 }
      );
    }

    if (error.message.includes('Invalid exam')) {
      return NextResponse.json(
        { success: false, error: 'Unsupported exam provider' },
        { status: 400 }
      );
    }

    if (error.message.includes('Invalid skill')) {
      return NextResponse.json(
        { success: false, error: 'Unsupported skill type' },
        { status: 400 }
      );
    }

    if (error.message.includes('Invalid session duration')) {
      return NextResponse.json(
        { success: false, error: 'Session duration must be between 20 and 300 seconds' },
        { status: 400 }
      );
    }

    // Handle database/service errors
    if (error.message.includes('Failed to create session')) {
      return NextResponse.json(
        { success: false, error: 'Unable to create session. Please try again.' },
        { status: 500 }
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

    // Initialize game service
    const gameService = new SwipeGameService();

    // Get user's active sessions
    const activeSessionsResult = await gameService.getUserStats(user.id, '7d');

    return NextResponse.json({
      success: true,
      active_sessions_count: 0, // This would come from the service
      recent_sessions: activeSessionsResult.recent_performance,
      can_start_new: true
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