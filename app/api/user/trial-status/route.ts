/**
 * User Trial Status API
 * Returns current trial status for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';

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

// GET /api/user/trial-status - Get user's current trial status
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await authenticateUser(request);
    if (auth.error) {
      return NextResponse.json({
        success: false,
        error: auth.error
      }, { status: auth.status });
    }

    const supabase = createSupabaseClientFromRequest(request);

    // Get user's active trial
    const { data: trialAssignment, error } = await supabase
      .from('user_plan_assignments')
      .select(`
        id,
        status,
        trial_expires_at,
        current_period_end,
        plans (
          id,
          name,
          tier,
          features
        ),
        courses (
          id,
          language,
          level,
          title
        )
      `)
      .eq('user_id', auth.user.id)
      .eq('status', 'trial')
      .eq('billing_cycle', 'trial')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !trialAssignment) {
      return NextResponse.json({
        success: false,
        error: 'No active trial found'
      }, { status: 404 });
    }

    // Calculate days remaining
    const now = new Date();
    const trialEndsAt = new Date(trialAssignment.trial_expires_at);
    const timeDiff = trialEndsAt.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));

    // Extract features available in trial
    const plan = trialAssignment.plans;
    const featuresAvailable = plan.features ? 
      Object.keys(plan.features).filter(key => plan.features[key] === true) : 
      [];

    return NextResponse.json({
      success: true,
      data: {
        is_trial: true,
        trial_ends_at: trialAssignment.trial_expires_at,
        days_remaining: daysRemaining,
        plan_name: plan.name,
        plan_tier: plan.tier,
        features_available: featuresAvailable,
        course_info: trialAssignment.courses
      }
    });

  } catch (error) {
    console.error('Trial status GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}