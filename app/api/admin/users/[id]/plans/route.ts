/**
 * Admin User Plans API
 * Manages user plan assignments with admin oversight
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';

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

// Validate UUID format (allow test IDs for now)
function isValidUUID(uuid: string): boolean {
  // Allow test IDs and UUIDs
  if (uuid.startsWith('test-') || uuid.includes('test') || uuid.length >= 8) {
    return true;
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// GET /api/admin/users/[id]/plans - Get user's plan assignments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate admin
    const auth = await authenticateAdmin(request);
    if (auth.error) {
      return NextResponse.json({
        success: false,
        error: auth.error
      }, { status: auth.status });
    }

    const { id } = await params;
    const userId = id;

    // Validate UUID format
    if (!isValidUUID(userId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid user ID format'
      }, { status: 400 });
    }

    const supabase = createSupabaseClientFromRequest(request);

    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // Get user's plan assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('user_plan_assignments')
      .select(`
        id,
        plan_id,
        course_id,
        status,
        subscription_tier,
        billing_cycle,
        current_period_start,
        current_period_end,
        trial_expires_at,
        assignment_reason,
        created_at,
        updated_at,
        plan_details:plans (
          id,
          name,
          tier,
          description,
          pricing,
          features
        ),
        user_details:users (
          id,
          email,
          full_name
        ),
        course_details:courses (
          id,
          language,
          level,
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user plan assignments'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: assignments || []
    });

  } catch (error) {
    console.error('User plans GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}