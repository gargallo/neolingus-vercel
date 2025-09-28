/**
 * Swipe Game Deck API
 *
 * GET /api/swipe/deck
 * Generates a balanced deck of items for swipe game sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { SwipeGameService } from '@/lib/services/swipe-game-service';
import { DeckRequestSchema, DeckResponseSchema } from '@/lib/validation/swipe-schemas';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang');
    const level = url.searchParams.get('level');
    const exam = url.searchParams.get('exam');
    const skill = url.searchParams.get('skill');
    const sizeParam = url.searchParams.get('size');
    const tagsParam = url.searchParams.get('tags');
    const difficultyParam = url.searchParams.get('difficulty');
    const userIdParam = url.searchParams.get('user_id');

    // Parse and validate request
    const requestData = {
      lang,
      level,
      exam,
      skill,
      size: sizeParam ? parseInt(sizeParam, 10) : 20,
      tags: tagsParam ? tagsParam.split(',').map(tag => tag.trim()) : undefined,
      difficulty_target: difficultyParam ? parseInt(difficultyParam, 10) : undefined,
      user_id: userIdParam || undefined
    };

    const validatedRequest = DeckRequestSchema.parse(requestData);

    // Initialize service
    const gameService = new SwipeGameService();

    // Generate deck
    const deckResult = await gameService.generateDeck({
      lang: validatedRequest.lang,
      level: validatedRequest.level,
      exam: validatedRequest.exam,
      skill: validatedRequest.skill,
      size: validatedRequest.size,
      tags: validatedRequest.tags,
      difficulty_target: validatedRequest.difficulty_target,
      user_id: validatedRequest.user_id
    });

    // Validate response
    const responseData = {
      success: true,
      items: deckResult.items,
      metadata: deckResult.metadata,
      session_suggested_size: deckResult.session_suggested_size,
      estimated_difficulty: deckResult.estimated_difficulty
    };

    const validatedResponse = DeckResponseSchema.parse(responseData);

    return NextResponse.json(validatedResponse);

  } catch (error: any) {
    console.error('Deck generation error:', error);

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request parameters',
          details: error.errors
        },
        { status: 400 }
      );
    }

    // Handle service errors
    if (error.message) {
      return NextResponse.json(
        {
          success: false,
          error: error.message
        },
        { status: error.message.includes('not found') ? 404 : 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate deck'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check for POST requests
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedRequest = DeckRequestSchema.parse(body);

    // Override user_id with authenticated user
    const deckParams = {
      ...validatedRequest,
      user_id: user.id
    };

    // Initialize service
    const gameService = new SwipeGameService();

    // Generate personalized deck
    const deckResult = await gameService.generateDeck(deckParams);

    // Validate and return response
    const responseData = {
      success: true,
      items: deckResult.items,
      metadata: deckResult.metadata,
      session_suggested_size: deckResult.session_suggested_size,
      estimated_difficulty: deckResult.estimated_difficulty
    };

    const validatedResponse = DeckResponseSchema.parse(responseData);
    return NextResponse.json(validatedResponse);

  } catch (error: any) {
    console.error('Personalized deck generation error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate personalized deck'
      },
      { status: 500 }
    );
  }
}