/**
 * GET /api/v1/score/rubrics
 * POST /api/v1/score/rubrics
 * Manage scoring rubrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { createScoringDbFromRequest, setTenantContext } from '@/lib/scoring/db/client';
import {
  ScoringProviderSchema,
  CEFRLevelSchema,
  TaskTypeSchema,
  CreateRubricSchema,
  validateRubric,
  type CreateRubric
} from '@/lib/scoring/schemas';

// GET - List rubrics with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filter parameters
    const filters: {
      provider?: any;
      level?: any;
      task?: any;
      active_only?: boolean;
    } = {
      active_only: searchParams.get('active_only') !== 'false'
    };

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

    // Parse pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    // Create Supabase client and get user
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create scoring database client
    const scoringDb = await createScoringDbFromRequest(request);

    // Get rubrics
    const rubricsResult = await scoringDb.rubrics.getAllRubrics(filters, {
      page,
      limit,
      sort_by: 'created_at',
      sort_order: 'desc'
    });

    if (!rubricsResult.success) {
      return NextResponse.json(
        { success: false, error: rubricsResult.error || 'Failed to get rubrics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rubrics: rubricsResult.data || [],
      pagination: {
        page,
        limit,
        total: rubricsResult.data?.length || 0
      }
    });

  } catch (error) {
    console.error('Error in GET /api/v1/score/rubrics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST - Create new rubric (admin only)
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate rubric data
    const validation = CreateRubricSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid rubric data',
          details: validation.error.issues
        },
        { status: 400 }
      );
    }

    const rubricData: CreateRubric = validation.data;

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

    // Check if a rubric with the same provider/level/task/version already exists
    const existingRubrics = await scoringDb.rubrics.getAllRubrics({
      provider: rubricData.provider,
      level: rubricData.level,
      task: rubricData.task,
      active_only: false
    });

    if (existingRubrics.success && existingRubrics.data) {
      const duplicate = existingRubrics.data.find(r => r.version === rubricData.version);
      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: `Rubric with version ${rubricData.version} already exists for ${rubricData.provider}-${rubricData.level}-${rubricData.task}`
          },
          { status: 409 }
        );
      }
    }

    // If this is set as active, deactivate any existing active rubric
    if (rubricData.is_active) {
      const activeRubric = await scoringDb.rubrics.getActiveRubric(
        rubricData.provider,
        rubricData.level,
        rubricData.task
      );

      if (activeRubric.success && activeRubric.data) {
        await scoringDb.rubrics.updateRubric(activeRubric.data.id, { is_active: false });
      }
    }

    // Create the rubric
    const createResult = await scoringDb.rubrics.createRubric(rubricData);

    if (!createResult.success || !createResult.data) {
      return NextResponse.json(
        { success: false, error: createResult.error || 'Failed to create rubric' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rubric: createResult.data,
      message: 'Rubric created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/v1/score/rubrics:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}