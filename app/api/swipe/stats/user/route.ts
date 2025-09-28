/**
 * Swipe Game User Statistics API
 *
 * GET /api/swipe/stats/user
 * Gets comprehensive user statistics and performance data
 */

import { NextRequest, NextResponse } from 'next/server';
import { SwipeGameService } from '@/lib/services/swipe-game-service';
import { UserStatsResponseSchema } from '@/lib/validation/swipe-schemas';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';

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
    const userIdParam = url.searchParams.get('user_id');
    const timespan = url.searchParams.get('span') as '7d' | '30d' | '90d' || '30d';
    const includeDetailed = url.searchParams.get('detailed') === 'true';

    // Use authenticated user ID or provided user_id (for admin access)
    const targetUserId = userIdParam || user.id;

    // Security check: only allow access to own data unless admin
    if (userIdParam && userIdParam !== user.id) {
      // Check if user has admin privileges
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Validate timespan
    if (!['7d', '30d', '90d'].includes(timespan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid timespan. Use 7d, 30d, or 90d' },
        { status: 400 }
      );
    }

    // Initialize game service
    const gameService = new SwipeGameService();

    // Get user statistics
    const userStats = await gameService.getUserStats(targetUserId, timespan);

    // Prepare basic response data
    let responseData = {
      success: true,
      user_id: targetUserId,
      timespan,
      stats: {
        total_sessions: userStats.total_sessions,
        total_answers: userStats.total_answers,
        overall_accuracy: userStats.overall_accuracy,
        avg_score: userStats.avg_score,
        best_session: userStats.best_session,
        recent_performance: userStats.recent_performance,
        skill_levels: userStats.skill_levels
      }
    };

    // Add detailed information if requested
    if (includeDetailed) {
      // This would be expanded with additional service calls
      responseData = {
        ...responseData,
        detailed_stats: {
          accuracy_by_skill: {}, // Would be populated by service
          difficulty_progression: [], // Would be populated by service
          tag_performance: {}, // Would be populated by service
          time_of_day_performance: {}, // Would be populated by service
          streak_analysis: {
            current_streak: 0,
            longest_streak: 0,
            average_streak: 0
          },
          improvement_metrics: {
            weekly_change: 0,
            monthly_change: 0,
            learning_velocity: 0
          }
        }
      };
    }

    // Validate response
    const validatedResponse = UserStatsResponseSchema.parse(responseData);

    return NextResponse.json(validatedResponse);

  } catch (error: any) {
    console.error('User stats error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid response data structure',
          details: error.errors
        },
        { status: 500 }
      );
    }

    // Handle specific errors
    if (error.message.includes('User not found')) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (error.message.includes('Access denied')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve user statistics'
      },
      { status: 500 }
    );
  }
}

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

    // Parse request body for bulk stats request
    const body = await request.json();
    const { user_ids, timespan = '30d', metrics = [] } = body;

    // Check admin permissions for bulk requests
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Validate input
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'user_ids array is required' },
        { status: 400 }
      );
    }

    if (user_ids.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 users per request' },
        { status: 400 }
      );
    }

    // Initialize game service
    const gameService = new SwipeGameService();

    // Get stats for all requested users
    const bulkStats = await Promise.all(
      user_ids.map(async (userId: string) => {
        try {
          const stats = await gameService.getUserStats(userId, timespan);
          return {
            user_id: userId,
            stats,
            success: true
          };
        } catch (error) {
          return {
            user_id: userId,
            error: 'Failed to retrieve stats',
            success: false
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      results: bulkStats,
      summary: {
        total_requested: user_ids.length,
        successful: bulkStats.filter(s => s.success).length,
        failed: bulkStats.filter(s => !s.success).length
      }
    });

  } catch (error: any) {
    console.error('Bulk user stats error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve bulk user statistics'
      },
      { status: 500 }
    );
  }
}