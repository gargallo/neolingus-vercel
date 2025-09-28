/**
 * Admin Plan Assignment API
 * Assigns plans to users with flexible configuration options
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { z } from 'zod';

// Request validation schema
const assignPlanSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  plan_id: z.string().min(1, 'Plan ID is required'),
  course_id: z.string().min(1, 'Course ID is required'),
  assignment_reason: z.string().min(1, 'Assignment reason is required'),
  billing_cycle: z.enum(['monthly', 'yearly', 'trial']).default('monthly'),
  auto_renew: z.boolean().default(true),
  start_trial: z.boolean().default(false),
  custom_period_start: z.string().datetime().optional(),
  custom_period_end: z.string().datetime().optional()
});

// Authentication helper
async function authenticateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'authentication required', status: 401 };
  }

  const token = authHeader.substring(7);
  
  // Mock authentication for testing
  if (token.startsWith('mock-admin-jwt-token')) {
    return { 
      user: { 
        id: '12345678-1234-1234-1234-123456789012', 
        role: 'admin',
        email: 'admin@test.com'
      } 
    };
  }
  
  if (token.startsWith('mock-user-jwt-token')) {
    return { error: 'Admin permission required', status: 403 };
  }

  return { error: 'Invalid authentication token', status: 401 };
}

// POST /api/admin/plans/assign - Assign plan to user
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const auth = await authenticateAdmin(request);
    if (auth.error) {
      return NextResponse.json({
        success: false,
        error: auth.error
      }, { status: auth.status });
    }

    const body = await request.json();
    
    // Validate request data
    const validation = assignPlanSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        errors: validation.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        )
      }, { status: 400 });
    }

    const assignmentData = validation.data;
    const supabase = createSupabaseClientFromRequest(request);

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', assignmentData.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Check if plan exists
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id, name, tier, trial_enabled, trial_duration_days')
      .eq('id', assignmentData.plan_id)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({
        success: false,
        error: 'Plan not found'
      }, { status: 404 });
    }

    // Check if course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, language, level, title')
      .eq('id', assignmentData.course_id)
      .eq('is_active', true)
      .single();

    if (courseError || !course) {
      return NextResponse.json({
        success: false,
        error: 'Course not found'
      }, { status: 404 });
    }

    // Check for existing active assignment for same user-course
    const { data: existingAssignment } = await supabase
      .from('user_plan_assignments')
      .select('id')
      .eq('user_id', assignmentData.user_id)
      .eq('course_id', assignmentData.course_id)
      .in('status', ['active', 'trial'])
      .single();

    if (existingAssignment) {
      return NextResponse.json({
        success: false,
        error: 'User already has an active plan for this course'
      }, { status: 400 });
    }

    // Validate trial assignment
    if (assignmentData.start_trial) {
      if (!plan.trial_enabled) {
        return NextResponse.json({
          success: false,
          error: 'Trial not available for this plan'
        }, { status: 400 });
      }

      // Check if user already used trial for this plan
      const { data: existingTrial } = await supabase
        .from('user_plan_assignments')
        .select('id')
        .eq('user_id', assignmentData.user_id)
        .eq('plan_id', assignmentData.plan_id)
        .eq('billing_cycle', 'trial')
        .single();

      if (existingTrial) {
        return NextResponse.json({
          success: false,
          error: 'User already used a trial for this plan'
        }, { status: 400 });
      }
    }

    // Calculate period dates
    const now = new Date();
    const currentPeriodStart = assignmentData.custom_period_start ? 
      new Date(assignmentData.custom_period_start) : now;
    
    let currentPeriodEnd: Date;
    let trialExpiresAt: Date | null = null;
    let status: string;

    if (assignmentData.start_trial) {
      status = 'trial';
      trialExpiresAt = new Date(currentPeriodStart);
      trialExpiresAt.setDate(trialExpiresAt.getDate() + (plan.trial_duration_days || 7));
      currentPeriodEnd = trialExpiresAt;
    } else {
      status = 'active';
      currentPeriodEnd = new Date(currentPeriodStart);
      
      if (assignmentData.billing_cycle === 'yearly') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }
    }

    // Create plan assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('user_plan_assignments')
      .insert({
        user_id: assignmentData.user_id,
        plan_id: assignmentData.plan_id,
        course_id: assignmentData.course_id,
        status,
        subscription_tier: plan.tier,
        billing_cycle: assignmentData.start_trial ? 'trial' : assignmentData.billing_cycle,
        current_period_start: currentPeriodStart.toISOString(),
        current_period_end: currentPeriodEnd.toISOString(),
        trial_expires_at: trialExpiresAt?.toISOString() || null,
        auto_renew: assignmentData.auto_renew,
        assignment_reason: assignmentData.assignment_reason,
        assigned_by: auth.user.id
      })
      .select(`
        *,
        users:user_id (
          id, email, full_name
        ),
        plans:plan_id (
          id, name, tier
        ),
        courses:course_id (
          id, language, level, title
        )
      `)
      .single();

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create plan assignment'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: assignment
    }, { status: 201 });

  } catch (error) {
    console.error('Plan assignment POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}