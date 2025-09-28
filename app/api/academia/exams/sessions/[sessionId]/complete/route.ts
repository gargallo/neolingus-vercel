/**
 * POST /api/academia/exams/sessions/[sessionId]/complete
 * Complete an exam session and trigger automatic scoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { createScoringDbFromRequest, setTenantContext } from '@/lib/scoring/db/client';
import { createScoringJob, processScoringJob } from '@/lib/scoring/queue/processor';
import { validateScoreRequest } from '@/lib/scoring/schemas';
import type { ScoringProvider, CEFRLevel, TaskType } from '@/lib/scoring/schemas';

interface RouteParams {
  sessionId: string;
}

interface CompleteSessionRequest {
  responses: Record<string, any>;
  duration_seconds: number;
  session_data?: Record<string, any>;
}

// Map exam components to scoring task types
const COMPONENT_TO_TASK_MAP: Record<string, TaskType> = {
  'reading': 'reading',
  'writing': 'writing',
  'listening': 'listening',
  'speaking': 'speaking',
  'use_of_english': 'use_of_english',
  'mediation': 'mediation'
};

// Map certification types to scoring providers
const CERTIFICATION_TO_PROVIDER_MAP: Record<string, ScoringProvider> = {
  'EOI': 'EOI',
  'JQCV': 'JQCV',
  'Cambridge': 'Cambridge',
  'Cervantes': 'Cervantes'
};

export async function POST(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { sessionId } = params;

    // Validate sessionId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body: CompleteSessionRequest = await request.json();

    if (!body.responses || typeof body.responses !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Responses are required' },
        { status: 400 }
      );
    }

    if (typeof body.duration_seconds !== 'number' || body.duration_seconds < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid duration_seconds is required' },
        { status: 400 }
      );
    }

    // Create Supabase client and get user
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the exam session with course information
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select(`
        *,
        courses (
          id,
          title,
          language,
          level,
          certification_type
        )
      `)
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user owns this session
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Exam session not found' },
        { status: 404 }
      );
    }

    // Check if session is already completed
    if (session.is_completed) {
      return NextResponse.json(
        { success: false, error: 'Exam session is already completed' },
        { status: 400 }
      );
    }

    // Update session as completed
    const completedAt = new Date().toISOString();
    const { data: updatedSession, error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        completed_at: completedAt,
        duration_seconds: body.duration_seconds,
        responses: body.responses,
        is_completed: true,
        session_data: {
          ...session.session_data,
          ...body.session_data,
          completed_via_api: true,
          completion_timestamp: Date.now()
        },
        updated_at: completedAt
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update session:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to complete session' },
        { status: 500 }
      );
    }

    // Determine if this session should trigger scoring
    let scoringAttemptId: string | null = null;
    let scoringError: string | null = null;

    try {
      // Check if we can map this session to scoring parameters
      const course = session.courses;
      if (!course) {
        throw new Error('Course information not available');
      }

      const taskType = COMPONENT_TO_TASK_MAP[session.component];
      const provider = CERTIFICATION_TO_PROVIDER_MAP[course.certification_type];

      if (!taskType) {
        throw new Error(`Unsupported component for scoring: ${session.component}`);
      }

      if (!provider) {
        throw new Error(`Unsupported certification type for scoring: ${course.certification_type}`);
      }

      // Prepare scoring payload based on component type
      let scoringPayload: any = {};

      if (session.component === 'writing') {
        // Extract writing-specific data from responses
        const writingText = body.responses.text || body.responses.essay || body.responses.writing;
        const prompt = body.responses.prompt || session.session_data?.prompt || 'Writing task';

        if (writingText && typeof writingText === 'string' && writingText.length >= 50) {
          scoringPayload = {
            text: writingText,
            prompt: prompt,
            task_type: body.responses.task_type || 'essay',
            word_limit: body.responses.word_limit
          };
        } else {
          throw new Error('Insufficient writing content for scoring');
        }
      } else if (session.component === 'speaking') {
        // Extract speaking-specific data
        const audioUrl = body.responses.audio_url;
        const transcript = body.responses.transcript;
        const prompt = body.responses.prompt || session.session_data?.prompt || 'Speaking task';

        if (audioUrl || (transcript && transcript.length >= 20)) {
          scoringPayload = {
            audio_url: audioUrl,
            transcript: transcript,
            duration_seconds: body.duration_seconds,
            prompt: prompt,
            task_type: body.responses.task_type || 'monologue'
          };
        } else {
          throw new Error('Insufficient speaking content for scoring');
        }
      } else {
        // For other components (reading, listening, etc.), use answers format
        scoringPayload = {
          answers: body.responses.answers || body.responses,
          question_types: body.responses.question_types,
          text_passages: body.responses.text_passages,
          audio_urls: body.responses.audio_urls,
          transcripts: body.responses.transcripts
        };
      }

      // Get tenant ID
      const tenantId = user.user_metadata?.tenant_id || 'neolingus';
      await setTenantContext(supabase, tenantId);

      // Create scoring database client
      const scoringDb = await createScoringDbFromRequest(request);

      // Create scoring attempt
      const attemptResult = await scoringDb.attempts.createAttempt({
        tenant_id: tenantId,
        user_id: user.id,
        exam_session_id: sessionId,
        exam_id: session.id,
        provider: provider,
        level: course.level as CEFRLevel,
        task: taskType,
        payload: scoringPayload
      });

      if (attemptResult.success && attemptResult.data) {
        scoringAttemptId = attemptResult.data.id;

        // Optionally process scoring immediately for better UX
        // In production, this would be queued for background processing
        if (process.env.NODE_ENV !== 'production') {
          const job = createScoringJob(attemptResult.data, 'normal');
          try {
            await processScoringJob(job);
          } catch (scoringProcessError) {
            console.warn('Immediate scoring failed, will be processed in background:', scoringProcessError);
          }
        }
      } else {
        scoringError = attemptResult.error || 'Failed to create scoring attempt';
      }

    } catch (error) {
      console.warn('Scoring setup failed:', error);
      scoringError = error instanceof Error ? error.message : 'Unknown scoring error';
    }

    // Update user progress (this could be enhanced with actual progress calculation)
    try {
      const { error: progressError } = await supabase
        .from('user_course_progress')
        .update({
          overall_progress: Math.min(100, (session.session_data?.progress || 0) + 10),
          last_session_at: completedAt,
          updated_at: completedAt
        })
        .eq('user_id', user.id)
        .eq('course_id', session.course_id);

      if (progressError) {
        console.warn('Failed to update progress:', progressError);
      }
    } catch (progressUpdateError) {
      console.warn('Progress update error:', progressUpdateError);
    }

    // Prepare response
    const response = {
      success: true,
      session: updatedSession,
      message: 'Exam session completed successfully',
      scoring: {
        enabled: !!scoringAttemptId,
        attempt_id: scoringAttemptId,
        error: scoringError,
        status: scoringAttemptId ? 'queued' : 'not_applicable'
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Error completing exam session:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET method to check completion status
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { sessionId } = params;

    // Create Supabase client and get user
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get session with scoring attempt information
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select(`
        id,
        is_completed,
        completed_at,
        score,
        detailed_scores,
        ai_feedback
      `)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Try to get scoring attempt if exists
    let scoringAttempt = null;
    try {
      const scoringDb = await createScoringDbFromRequest(request);
      const attemptsResult = await scoringDb.attempts.getAttempts(
        { exam_session_id: sessionId },
        { limit: 1 }
      );

      if (attemptsResult.success && attemptsResult.data && attemptsResult.data.length > 0) {
        scoringAttempt = attemptsResult.data[0];
      }
    } catch (scoringError) {
      console.warn('Failed to get scoring attempt:', scoringError);
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        is_completed: session.is_completed,
        completed_at: session.completed_at,
        has_score: !!session.score,
        has_ai_feedback: !!session.ai_feedback
      },
      scoring: scoringAttempt ? {
        attempt_id: scoringAttempt.id,
        status: scoringAttempt.status,
        has_score: !!scoringAttempt.score_json,
        created_at: scoringAttempt.created_at
      } : null
    });

  } catch (error) {
    console.error('Error getting session completion status:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}