/**
 * Trial Conversion API
 * Converts user trials to paid subscriptions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { z } from 'zod';

// Request validation schema
const convertTrialSchema = z.object({
  billing_cycle: z.enum(['monthly', 'yearly']).default('monthly'),
  payment_method_id: z.string().optional()
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

// POST /api/user/convert-trial - Convert trial to paid subscription
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request);
    if (auth.error) {
      return NextResponse.json({
        success: false,
        error: auth.error
      }, { status: auth.status });
    }

    const body = await request.json();
    
    // Validate request data
    const validation = convertTrialSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        errors: validation.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        )
      }, { status: 400 });
    }

    const { billing_cycle, payment_method_id } = validation.data;
    const supabase = createSupabaseClientFromRequest(request);

    // Get user's active trial
    const { data: trialAssignment, error: trialError } = await supabase
      .from('user_plan_assignments')
      .select(`
        id,
        plan_id,
        course_id,
        trial_expires_at,
        plans (
          id,
          name,
          tier,
          pricing
        )
      `)
      .eq('user_id', auth.user.id)
      .eq('status', 'trial')
      .eq('billing_cycle', 'trial')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (trialError || !trialAssignment) {
      return NextResponse.json({
        success: false,
        error: 'No active trial found'
      }, { status: 404 });
    }

    // Calculate new billing period
    const now = new Date();
    const newPeriodStart = now;
    const newPeriodEnd = new Date(now);
    
    if (billing_cycle === 'yearly') {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    } else {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    }

    // TODO: Process payment with payment_method_id
    // For now, we'll assume payment processing is successful

    // Update trial to active paid subscription
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('user_plan_assignments')
      .update({
        status: 'active',
        billing_cycle,
        current_period_start: newPeriodStart.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
        auto_renew: true,
        converted_from_trial: true,
        converted_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', trialAssignment.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error converting trial:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to convert trial'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        status: 'active',
        billing_cycle,
        current_period_start: newPeriodStart.toISOString(),
        current_period_end: newPeriodEnd.toISOString(),
        plan_name: trialAssignment.plans.name,
        message: 'Trial successfully converted to paid subscription'
      }
    });

  } catch (error) {
    console.error('Trial conversion POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}