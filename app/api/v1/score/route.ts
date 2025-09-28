/**
 * POST /api/v1/score
 * Main scoring endpoint - creates new scoring attempts and queues them for processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { createScoringDbFromRequest, setTenantContext } from '@/lib/scoring/db/client';
import {
  ScoreRequestSchema,
  ScoreResponseSchema,
  validateScoreRequest,
  type ScoreRequest,
  type ScoreResponse
} from '@/lib/scoring/schemas';

// Rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per user

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateScoreRequest(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const scoreRequest: ScoreRequest = validation.data;

    // Create Supabase client and get user
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Get tenant ID from user metadata or use default
    const tenantId = user.user_metadata?.tenant_id || 'default';

    // Set tenant context for RLS
    await setTenantContext(supabase, tenantId);

    // Create scoring database client
    const scoringDb = await createScoringDbFromRequest(request);

    // Validate that rubric exists for this provider/level/task combination
    const rubricResult = await scoringDb.rubrics.getActiveRubric(
      scoreRequest.provider,
      scoreRequest.level,
      scoreRequest.task
    );

    if (!rubricResult.success || !rubricResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: `No active rubric found for ${scoreRequest.provider} ${scoreRequest.level} ${scoreRequest.task}`
        },
        { status: 400 }
      );
    }

    // Create scoring attempt
    const attemptData = {
      tenant_id: tenantId,
      user_id: scoreRequest.user_id || user.id,
      exam_session_id: scoreRequest.exam_session_id || null,
      exam_id: scoreRequest.exam_id || null,
      provider: scoreRequest.provider,
      level: scoreRequest.level,
      task: scoreRequest.task,
      payload: scoreRequest.payload,
      model_name: scoreRequest.model_name || 'gpt-4o-mini'
    };

    const attemptResult = await scoringDb.attempts.createAttempt(attemptData);

    if (!attemptResult.success || !attemptResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: attemptResult.error || 'Failed to create scoring attempt'
        },
        { status: 500 }
      );
    }

    const attempt = attemptResult.data;

    // TODO: Queue the scoring job (would integrate with QStash or similar)
    // For now, we'll just return the attempt ID

    // Prepare response
    const response: ScoreResponse = {
      success: true,
      attempt_id: attempt.id,
      status: attempt.status,
      estimated_completion: new Date(Date.now() + 60000).toISOString(), // 1 minute estimate
      webhook_configured: !!scoreRequest.webhook_url
    };

    // Log successful request
    console.log(`Scoring attempt created: ${attempt.id} for user ${user.id}`);

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error in /api/v1/score:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET method not allowed for this endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Method not allowed. Use POST to create scoring attempts.' },
    { status: 405 }
  );
}