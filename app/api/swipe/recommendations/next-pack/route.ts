/**
 * Swipe Game Recommendations API
 *
 * GET /api/swipe/recommendations/next-pack
 * Provides personalized recommendations for next practice session
 */

import { NextRequest, NextResponse } from 'next/server';
import { SwipeGameService } from '@/lib/services/swipe-game-service';
import { RecommendationsResponseSchema } from '@/lib/validation/swipe-schemas';
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
    const lang = url.searchParams.get('lang');
    const level = url.searchParams.get('level');
    const exam = url.searchParams.get('exam');
    const skill = url.searchParams.get('skill');
    const packSize = parseInt(url.searchParams.get('size') || '20', 10);

    // Use authenticated user ID or provided user_id (for admin access)
    const targetUserId = userIdParam || user.id;

    // Security check: only allow access to own data unless admin
    if (userIdParam && userIdParam !== user.id) {
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

    // Validate required parameters
    if (!lang || !level || !exam || !skill) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: lang, level, exam, skill'
        },
        { status: 400 }
      );
    }

    // Validate parameter values
    const validLanguages = ['es', 'val', 'en'];
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const validExams = ['EOI', 'Cambridge', 'DELE', 'JQCV'];
    const validSkills = ['R', 'W', 'S', 'L'];

    if (!validLanguages.includes(lang)) {
      return NextResponse.json(
        { success: false, error: 'Invalid language' },
        { status: 400 }
      );
    }

    if (!validLevels.includes(level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid level' },
        { status: 400 }
      );
    }

    if (!validExams.includes(exam)) {
      return NextResponse.json(
        { success: false, error: 'Invalid exam provider' },
        { status: 400 }
      );
    }

    if (!validSkills.includes(skill)) {
      return NextResponse.json(
        { success: false, error: 'Invalid skill' },
        { status: 400 }
      );
    }

    if (packSize < 5 || packSize > 50) {
      return NextResponse.json(
        { success: false, error: 'Pack size must be between 5 and 50' },
        { status: 400 }
      );
    }

    // Initialize game service
    const gameService = new SwipeGameService();

    // Get personalized recommendations
    const recommendations = await gameService.getNextPackRecommendations(
      targetUserId,
      lang as any,
      level as any,
      exam as any,
      skill as any
    );

    // Prepare response data
    const responseData = {
      success: true,
      user_id: targetUserId,
      request_params: {
        lang,
        level,
        exam,
        skill,
        size: packSize
      },
      items: recommendations.items.slice(0, packSize), // Limit to requested size
      recommendation: {
        focus_area: recommendations.recommendation.focus_area,
        difficulty_level: recommendations.recommendation.difficulty_level,
        estimated_duration: Math.ceil(packSize * 3), // 3 seconds per item
        next_pack_tags: recommendations.recommendation.next_pack_tags,
        rationale: recommendations.recommendation.rationale,
        confidence_score: 0.85 // This would be calculated by the service
      },
      estimated_difficulty: recommendations.estimated_difficulty,
      learning_path: {
        current_level: 'intermediate', // This would come from user analysis
        target_level: 'advanced',
        progress_percentage: 65,
        milestones: [
          {
            name: 'Grammar Mastery',
            completed: true,
            target_accuracy: 90
          },
          {
            name: 'Vocabulary Expansion',
            completed: false,
            target_accuracy: 85
          }
        ]
      }
    };

    // Validate response
    const validatedResponse = RecommendationsResponseSchema.parse(responseData);

    return NextResponse.json(validatedResponse);

  } catch (error: any) {
    console.error('Recommendations error:', error);

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

    if (error.message.includes('Insufficient data')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not enough user data to generate recommendations. Complete a few practice sessions first.'
        },
        { status: 400 }
      );
    }

    if (error.message.includes('No items available')) {
      return NextResponse.json(
        {
          success: false,
          error: 'No practice items available for the specified criteria'
        },
        { status: 404 }
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate recommendations'
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

    // Parse request body for custom recommendation request
    const body = await request.json();
    const {
      lang,
      level,
      exam,
      skill,
      focus_areas = [],
      difficulty_preference = 'adaptive',
      size = 20,
      exclude_tags = [],
      include_review_items = true
    } = body;

    // Validate required parameters
    if (!lang || !level || !exam || !skill) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: lang, level, exam, skill'
        },
        { status: 400 }
      );
    }

    // Initialize game service
    const gameService = new SwipeGameService();

    // Get customized recommendations
    const recommendations = await gameService.getNextPackRecommendations(
      user.id,
      lang,
      level,
      exam,
      skill
    );

    // Apply custom filters if provided
    let filteredItems = recommendations.items;

    if (exclude_tags.length > 0) {
      filteredItems = filteredItems.filter(item =>
        !item.tags.some(tag => exclude_tags.includes(tag))
      );
    }

    if (focus_areas.length > 0) {
      filteredItems = filteredItems.filter(item =>
        item.tags.some(tag => focus_areas.includes(tag))
      );
    }

    // Apply difficulty preference
    if (difficulty_preference === 'easy') {
      filteredItems = filteredItems.filter(item => item.difficulty_elo < 1400);
    } else if (difficulty_preference === 'hard') {
      filteredItems = filteredItems.filter(item => item.difficulty_elo > 1600);
    }

    // Limit to requested size
    filteredItems = filteredItems.slice(0, size);

    // Prepare response
    const responseData = {
      success: true,
      user_id: user.id,
      request_params: {
        lang,
        level,
        exam,
        skill,
        size,
        focus_areas,
        difficulty_preference,
        exclude_tags,
        include_review_items
      },
      items: filteredItems,
      recommendation: {
        focus_area: focus_areas.length > 0 ? focus_areas.join(', ') : recommendations.recommendation.focus_area,
        difficulty_level: difficulty_preference === 'adaptive' ? recommendations.recommendation.difficulty_level : difficulty_preference,
        estimated_duration: Math.ceil(filteredItems.length * 3),
        next_pack_tags: focus_areas.length > 0 ? focus_areas : recommendations.recommendation.next_pack_tags,
        rationale: `Custom practice pack focusing on ${focus_areas.length > 0 ? focus_areas.join(', ') : 'your learning needs'}`
      },
      estimated_difficulty: filteredItems.reduce((sum, item) => sum + item.difficulty_elo, 0) / filteredItems.length || 1500,
      customization_applied: {
        focus_areas_applied: focus_areas.length > 0,
        difficulty_adjusted: difficulty_preference !== 'adaptive',
        tags_excluded: exclude_tags.length > 0,
        size_adjusted: size !== 20
      }
    };

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Custom recommendations error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate custom recommendations'
      },
      { status: 500 }
    );
  }
}