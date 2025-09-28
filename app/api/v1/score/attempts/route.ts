/**
 * GET /api/v1/score/attempts
 * List scoring attempts with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { createScoringDbFromRequest, setTenantContext } from '@/lib/scoring/db/client';
import type { AttemptFilters, PaginationParams } from '@/lib/scoring/db/client';
import {
  ScoringProviderSchema,
  CEFRLevelSchema,
  TaskTypeSchema,
  AttemptStatusSchema,
  ListAttemptsResponseSchema,
  type ListAttemptsResponse
} from '@/lib/scoring/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 items per page
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc';

    const pagination: PaginationParams = {
      page,
      limit,
      sort_by,
      sort_order
    };

    // Parse filter parameters
    const filters: AttemptFilters = {};

    if (searchParams.get('provider')) {
      const providerResult = ScoringProviderSchema.safeParse(searchParams.get('provider'));
      if (providerResult.success) {
        filters.provider = providerResult.data;
      }
    }

    if (searchParams.get('level')) {
      const levelResult = CEFRLevelSchema.safeParse(searchParams.get('level'));
      if (levelResult.success) {
        filters.level = levelResult.data;
      }
    }

    if (searchParams.get('task')) {
      const taskResult = TaskTypeSchema.safeParse(searchParams.get('task'));
      if (taskResult.success) {
        filters.task = taskResult.data;
      }
    }

    if (searchParams.get('status')) {
      const statusResult = AttemptStatusSchema.safeParse(searchParams.get('status'));
      if (statusResult.success) {
        filters.status = statusResult.data;
      }
    }

    if (searchParams.get('user_id')) {
      filters.user_id = searchParams.get('user_id')!;
    }

    if (searchParams.get('exam_session_id')) {
      filters.exam_session_id = searchParams.get('exam_session_id')!;
    }

    if (searchParams.get('created_after')) {
      const date = new Date(searchParams.get('created_after')!);
      if (!isNaN(date.getTime())) {
        filters.created_after = date;
      }
    }

    if (searchParams.get('created_before')) {
      const date = new Date(searchParams.get('created_before')!);
      if (!isNaN(date.getTime())) {
        filters.created_before = date;
      }
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

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = adminUser && ['super_admin', 'admin'].includes(adminUser.role);

    // If not admin, filter to only user's own attempts
    if (!isAdmin) {
      filters.user_id = user.id;
    }

    // Get tenant ID and set context
    const tenantId = user.user_metadata?.tenant_id || 'default';
    await setTenantContext(supabase, tenantId);

    // Create scoring database client
    const scoringDb = await createScoringDbFromRequest(request);

    // Get attempts with filters and pagination
    const attemptsResult = await scoringDb.attempts.getAttempts(filters, pagination);

    if (!attemptsResult.success) {
      return NextResponse.json(
        { success: false, error: attemptsResult.error || 'Failed to get attempts' },
        { status: 500 }
      );
    }

    // Get total count for pagination (simplified - in production might want to optimize)
    const totalResult = await scoringDb.attempts.getAttempts(filters);
    const total = totalResult.success ? totalResult.data?.length || 0 : 0;

    // Prepare response
    const response: ListAttemptsResponse = {
      success: true,
      attempts: attemptsResult.data || [],
      pagination: {
        page,
        limit,
        total,
        has_more: page * limit < total
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in /api/v1/score/attempts:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST method to create multiple attempts (batch scoring)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attempts } = body;

    if (!Array.isArray(attempts) || attempts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid request. Expected array of attempts.' },
        { status: 400 }
      );
    }

    if (attempts.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Batch size too large. Maximum 10 attempts per batch.' },
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

    const results = [];
    const errors = [];

    // Process each attempt
    for (let i = 0; i < attempts.length; i++) {
      try {
        const attemptData = {
          ...attempts[i],
          tenant_id: tenantId,
          user_id: attempts[i].user_id || user.id
        };

        const result = await scoringDb.attempts.createAttempt(attemptData);

        if (result.success && result.data) {
          results.push({
            index: i,
            attempt_id: result.data.id,
            status: result.data.status
          });
        } else {
          errors.push({
            index: i,
            error: result.error || 'Failed to create attempt'
          });
        }
      } catch (err) {
        errors.push({
          index: i,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      created: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error in POST /api/v1/score/attempts:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}