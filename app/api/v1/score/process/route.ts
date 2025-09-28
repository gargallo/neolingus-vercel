/**
 * POST /api/v1/score/process
 * Manual scoring trigger endpoint (admin only)
 * For testing and processing queued attempts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { createScoringDbFromRequest, setTenantContext } from '@/lib/scoring/db/client';
import { processScoringJob, createScoringJob } from '@/lib/scoring/queue/processor';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { attempt_id, priority = 'normal', process_all_queued = false } = body;

    // Create Supabase client and get user
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
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

    if (process_all_queued) {
      // Process all queued attempts
      const queuedAttempts = await scoringDb.attempts.getAttempts(
        { status: 'queued' },
        { limit: 50 } // Limit to 50 attempts at once
      );

      if (!queuedAttempts.success || !queuedAttempts.data) {
        return NextResponse.json(
          { success: false, error: 'Failed to get queued attempts' },
          { status: 500 }
        );
      }

      if (queuedAttempts.data.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'No queued attempts found',
          processed: 0
        });
      }

      // Create jobs for all queued attempts
      const jobs = queuedAttempts.data.map(attempt =>
        createScoringJob(attempt, priority)
      );

      // Process jobs (in a real implementation, these would be added to a queue)
      const results = [];
      const errors = [];

      for (const job of jobs) {
        try {
          const result = await processScoringJob(job);
          if (result.success) {
            results.push(result);
          } else {
            errors.push({ attempt_id: result.attempt_id, error: result.error });
          }
        } catch (error) {
          errors.push({
            attempt_id: job.attempt_id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Processed ${results.length} attempts`,
        processed: results.length,
        failed: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      });

    } else if (attempt_id) {
      // Process specific attempt
      if (typeof attempt_id !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid attempt_id format' },
          { status: 400 }
        );
      }

      // Validate attempt ID format (UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(attempt_id)) {
        return NextResponse.json(
          { success: false, error: 'Invalid attempt ID format' },
          { status: 400 }
        );
      }

      // Get the attempt
      const attemptResult = await scoringDb.attempts.getAttempt(attempt_id);
      if (!attemptResult.success || !attemptResult.data) {
        return NextResponse.json(
          { success: false, error: 'Attempt not found' },
          { status: 404 }
        );
      }

      const attempt = attemptResult.data;

      // Create and process the job
      const job = createScoringJob(attempt, priority);
      const result = await processScoringJob(job);

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Attempt processed successfully',
          result
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to process attempt',
            result
          },
          { status: 500 }
        );
      }

    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Either attempt_id or process_all_queued must be specified'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in /api/v1/score/process:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET method to check processing status
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client and get user
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
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

    // Get queue statistics
    const queuedResult = await scoringDb.attempts.getAttempts({ status: 'queued' });
    const processingResult = await scoringDb.attempts.getAttempts({ status: 'processing' });
    const recentScoredResult = await scoringDb.attempts.getAttempts(
      {
        status: 'scored',
        created_after: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    );

    const stats = {
      queued: queuedResult.success ? queuedResult.data?.length || 0 : 0,
      processing: processingResult.success ? processingResult.data?.length || 0 : 0,
      scored_today: recentScoredResult.success ? recentScoredResult.data?.length || 0 : 0
    };

    return NextResponse.json({
      success: true,
      queue_stats: stats,
      message: 'Queue status retrieved successfully'
    });

  } catch (error) {
    console.error('Error in GET /api/v1/score/process:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}