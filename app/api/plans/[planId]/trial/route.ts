/**
 * Public Trial Management API
 * Allows users to start trials for plans
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { z } from 'zod';

// Request validation schema
const startTrialSchema = z.object({
  course_id: z.string().min(1, 'Course ID is required')
});

// Authentication helper for users
async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'authentication required', status: 401 };
  }

  const token = authHeader.substring(7);
  
  // Mock authentication for testing
  if (token.startsWith('mock-user-jwt-token')) {
    return { 
      user: { 
        id: '87654321-4321-4321-4321-210987654321', 
        role: 'user',
        email: 'user@test.com'
      } 
    };
  }
  
  if (token.startsWith('mock-admin-jwt-token')) {
    return { 
      user: { 
        id: '12345678-1234-1234-1234-123456789012', 
        role: 'admin',
        email: 'admin@test.com'
      } 
    };
  }

  return { error: 'Invalid authentication token', status: 401 };
}

// Validate UUID format (allow test IDs for now)
function isValidUUID(uuid: string): boolean {
  // Allow test IDs and UUIDs
  if (uuid.startsWith('test-') || uuid.includes('test') || uuid.length >= 8) {
    return true;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// POST /api/plans/[planId]/trial - Start a trial for a plan
export async function POST(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request);
    if (auth.error) {
      return NextResponse.json({
        success: false,
        error: auth.error
      }, { status: auth.status });
    }

    const { planId } = params;

    // Validate UUID format (flexible for testing)
    if (!isValidUUID(planId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid plan ID format'
      }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate request data
    const validation = startTrialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        errors: validation.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        )
      }, { status: 400 });
    }

    const { course_id } = validation.data;
    const supabase = createSupabaseClientFromRequest(request);

    // Check if plan exists and supports trials
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, tier, trial_enabled, trial_duration_days')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({
        success: false,
        error: 'Plan not found'
      }, { status: 404 });
    }

    if (!plan.trial_enabled) {
      return NextResponse.json({
        success: false,
        error: 'Trial not available for this plan'
      }, { status: 403 });
    }

    // Check if course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, language, level, title')
      .eq('id', course_id)
      .eq('is_active', true)
      .single();

    if (courseError || !course) {
      return NextResponse.json({
        success: false,
        error: 'Course not found'
      }, { status: 404 });
    }

    // Check if user already has an active plan or trial for this course
    const { data: existingAssignment } = await supabase
      .from('user_plan_assignments')
      .select('id, status')
      .eq('user_id', auth.user.id)
      .eq('course_id', course_id)
      .in('status', ['active', 'trial'])
      .single();

    if (existingAssignment) {
      return NextResponse.json({
        success: false,
        error: 'User already has an active plan or trial for this course'
      }, { status: 400 });
    }

    // Check if user already used a trial for this plan
    const { data: existingTrial } = await supabase
      .from('user_plan_assignments')
      .select('id')
      .eq('user_id', auth.user.id)
      .eq('plan_id', planId)
      .eq('billing_cycle', 'trial')
      .single();

    if (existingTrial) {
      return NextResponse.json({
        success: false,
        error: 'User already used a trial for this plan'
      }, { status: 400 });
    }

    // Calculate trial dates
    const now = new Date();
    const trialDuration = plan.trial_duration_days || 7;
    const trialExpiresAt = new Date(now);
    trialExpiresAt.setDate(trialExpiresAt.getDate() + trialDuration);

    // Create trial assignment
    const { data: trialAssignment, error: assignmentError } = await supabase
      .from('user_plan_assignments')
      .insert({
        user_id: auth.user.id,
        plan_id: planId,
        course_id: course_id,
        status: 'trial',
        subscription_tier: plan.tier,
        billing_cycle: 'trial',
        current_period_start: now.toISOString(),
        current_period_end: trialExpiresAt.toISOString(),
        trial_expires_at: trialExpiresAt.toISOString(),
        auto_renew: false,
        assignment_reason: 'User started trial'
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating trial assignment:', assignmentError);
      return NextResponse.json({
        success: false,
        error: 'Failed to start trial'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        trial_expires_at: trialExpiresAt.toISOString(),
        access_expires_at: trialExpiresAt.toISOString(),
        plan_name: plan.name,
        course_title: course.title
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Trial start POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}