/**
 * Swipe Game Answer Submission API
 *
 * POST /api/swipe/answer
 * Submits user answers and calculates scoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { SwipeGameService } from '@/lib/services/swipe-game-service';
import { SubmitAnswerRequestSchema, SubmitAnswerResponseSchema } from '@/lib/validation/swipe-schemas';
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
    const validatedRequest = SubmitAnswerRequestSchema.parse(body);

    // Override user_id with authenticated user ID for security
    const answerParams = {
      ...validatedRequest,
      user_id: user.id
    };

    // Initialize game service
    const gameService = new SwipeGameService();

    // Submit answer and get result
    const answerResult = await gameService.submitAnswer(answerParams);

    // Prepare response data
    const responseData = {
      success: answerResult.success,
      score_delta: answerResult.score_delta,
      new_total_score: answerResult.new_total_score,
      correct: answerResult.correct,
      feedback: {
        explanation: answerResult.explanation || '',
        suggested_improvement: answerResult.suggested_improvement
      },
      session_progress: {
        answers_submitted: Math.floor(Math.random() * 10) + 1, // This would come from service
        estimated_remaining: Math.floor(Math.random() * 10) + 1
      }
    };

    // Validate response
    const validatedResponse = SubmitAnswerResponseSchema.parse(responseData);

    return NextResponse.json(validatedResponse, { status: 201 });

  } catch (error: any) {
    console.error('Answer submission error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid answer data',
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
        { success: false, error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    if (error.message.includes('not active')) {
      return NextResponse.json(
        { success: false, error: 'Session is not active' },
        { status: 400 }
      );
    }

    if (error.message.includes('Item not found')) {
      return NextResponse.json(
        { success: false, error: 'Invalid item ID' },
        { status: 400 }
      );
    }

    if (error.message.includes('Invalid user choice')) {
      return NextResponse.json(
        { success: false, error: 'Answer must be "apta" or "no_apta"' },
        { status: 400 }
      );
    }

    if (error.message.includes('Invalid latency')) {
      return NextResponse.json(
        { success: false, error: 'Invalid response time' },
        { status: 400 }
      );
    }

    if (error.message.includes('Missing required')) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Handle database/service errors
    if (error.message.includes('Failed to submit answer')) {
      return NextResponse.json(
        { success: false, error: 'Unable to submit answer. Please try again.' },
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

    // Get query parameters
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Initialize game service (using the answer model directly for this read operation)
    const gameService = new SwipeGameService();

    // This would typically be a method on the service to get session answers
    // For now, we'll return a simple response structure
    const mockAnswers = []; // This would be replaced with actual service call

    return NextResponse.json({
      success: true,
      answers: mockAnswers,
      pagination: {
        total: mockAnswers.length,
        limit,
        offset,
        has_more: false
      }
    });

  } catch (error: any) {
    console.error('Answer history error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get answer history'
      },
      { status: 500 }
    );
  }
}