/**
 * GET /api/v1/score/health
 * Health check endpoint for scoring system
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { createScoringDbFromRequest } from '@/lib/scoring/db/client';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const checks: Record<string, { status: 'ok' | 'error'; response_time?: number; error?: string }> = {};

  try {
    // Check database connection
    const dbStartTime = Date.now();
    try {
      const supabase = await createSupabaseClientFromRequest(request);
      const { error } = await supabase.from('scoring_rubrics').select('count').limit(1);

      if (error) {
        checks.database = { status: 'error', error: error.message };
      } else {
        checks.database = {
          status: 'ok',
          response_time: Date.now() - dbStartTime
        };
      }
    } catch (err) {
      checks.database = {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown database error'
      };
    }

    // Check scoring database client
    const scoringDbStartTime = Date.now();
    try {
      const scoringDb = await createScoringDbFromRequest(request);
      const rubricResult = await scoringDb.rubrics.getAllRubrics({ active_only: true }, { limit: 1 });

      if (!rubricResult.success) {
        checks.scoring_db = { status: 'error', error: rubricResult.error };
      } else {
        checks.scoring_db = {
          status: 'ok',
          response_time: Date.now() - scoringDbStartTime
        };
      }
    } catch (err) {
      checks.scoring_db = {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown scoring db error'
      };
    }

    // Check active rubrics count
    try {
      const scoringDb = await createScoringDbFromRequest(request);
      const rubricsResult = await scoringDb.rubrics.getAllRubrics({ active_only: true });

      if (rubricsResult.success) {
        const count = rubricsResult.data?.length || 0;
        checks.active_rubrics = {
          status: count > 0 ? 'ok' : 'error',
          error: count === 0 ? 'No active rubrics found' : undefined
        };
      } else {
        checks.active_rubrics = { status: 'error', error: rubricsResult.error };
      }
    } catch (err) {
      checks.active_rubrics = {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown rubrics check error'
      };
    }

    // Check recent attempts (last 24 hours)
    try {
      const scoringDb = await createScoringDbFromRequest(request);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const attemptsResult = await scoringDb.attempts.getAttempts(
        { created_after: twentyFourHoursAgo },
        { limit: 100 }
      );

      if (attemptsResult.success) {
        const count = attemptsResult.data?.length || 0;
        checks.recent_attempts = {
          status: 'ok',
          response_time: Date.now() - startTime
        };
      } else {
        checks.recent_attempts = { status: 'error', error: attemptsResult.error };
      }
    } catch (err) {
      checks.recent_attempts = {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown attempts check error'
      };
    }

    // Calculate overall status
    const allOk = Object.values(checks).every(check => check.status === 'ok');
    const totalResponseTime = Date.now() - startTime;

    const healthStatus = {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      response_time_ms: totalResponseTime,
      version: '1.0.0',
      checks
    };

    const statusCode = allOk ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });

  } catch (error) {
    console.error('Error in /api/v1/score/health:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        response_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown health check error',
        checks
      },
      { status: 503 }
    );
  }
}

// HEAD method for simple ping
export async function HEAD(request: NextRequest) {
  try {
    // Simple database connectivity check
    const supabase = await createSupabaseClientFromRequest(request);
    const { error } = await supabase.from('scoring_rubrics').select('count').limit(1);

    if (error) {
      return new NextResponse(null, { status: 503 });
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Health-Status': 'ok'
      }
    });

  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}