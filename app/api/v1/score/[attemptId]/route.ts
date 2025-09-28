/**
 * GET /api/v1/score/[attemptId]
 * Get scoring attempt results and status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { createScoringDbFromRequest, setTenantContext } from '@/lib/scoring/db/client';
import { GetScoreResponseSchema, type GetScoreResponse } from '@/lib/scoring/schemas';

interface RouteParams {
  attemptId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { attemptId } = params;

    // Validate attemptId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(attemptId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid attempt ID format' },
        { status: 400 }
      );
    }

    // Create Supabase client and get user
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tenant ID and set context
    const tenantId = user.user_metadata?.tenant_id || 'default';
    await setTenantContext(supabase, tenantId);

    // Create scoring database client
    const scoringDb = await createScoringDbFromRequest(request);

    // Get the scoring attempt
    const attemptResult = await scoringDb.attempts.getAttempt(attemptId);

    if (!attemptResult.success || !attemptResult.data) {
      return NextResponse.json(
        { success: false, error: 'Scoring attempt not found' },
        { status: 404 }
      );
    }

    const attempt = attemptResult.data;

    // Check if user has permission to access this attempt
    // Users can only access their own attempts unless they're admins
    if (attempt.user_id !== user.id) {
      // Check if user is admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!adminUser || !['super_admin', 'admin'].includes(adminUser.role)) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Prepare response
    const response: GetScoreResponse = {
      success: true,
      attempt: attempt,
      score: attempt.score_json || undefined,
      qc: attempt.qc_json || undefined
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error(`Error in /api/v1/score/${params.attemptId}:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// PUT method to update attempt (for re-scoring)
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { attemptId } = params;

    // Validate attemptId format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(attemptId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid attempt ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action } = body;

    if (action !== 're_score') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Only "re_score" is supported.' },
        { status: 400 }
      );
    }

    // Create Supabase client and get user
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (only admins can re-score)
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminUser || !['super_admin', 'admin'].includes(adminUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Get tenant ID and set context
    const tenantId = user.user_metadata?.tenant_id || 'default';
    await setTenantContext(supabase, tenantId);

    // Create scoring database client
    const scoringDb = await createScoringDbFromRequest(request);

    // Get the scoring attempt
    const attemptResult = await scoringDb.attempts.getAttempt(attemptId);

    if (!attemptResult.success || !attemptResult.data) {
      return NextResponse.json(
        { success: false, error: 'Scoring attempt not found' },
        { status: 404 }
      );
    }

    const attempt = attemptResult.data;

    // Reset attempt status to queued for re-scoring
    const updateResult = await scoringDb.attempts.updateAttemptStatus(
      attemptId,
      'queued',
      {
        score_json: null,
        qc_json: null
      }
    );

    if (!updateResult.success) {
      return NextResponse.json(
        { success: false, error: updateResult.error || 'Failed to queue re-scoring' },
        { status: 500 }
      );
    }

    // TODO: Queue the re-scoring job
    // For now, we'll just return success

    return NextResponse.json({
      success: true,
      message: 'Attempt queued for re-scoring',
      attempt_id: attemptId,
      status: 'queued'
    });

  } catch (error) {
    console.error(`Error in PUT /api/v1/score/${params.attemptId}:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}