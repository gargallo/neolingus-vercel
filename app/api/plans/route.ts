/**
 * Public Plans API
 * Returns public plan information without admin-specific data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';

// GET /api/plans - Get public plan information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('course_id');

    const supabase = createSupabaseClientFromRequest(request);

    // Build query for public plan data (only active plans)
    let query = supabase
      .from('plans')
      .select(`
        id,
        name,
        slug,
        tier,
        description,
        features,
        pricing,
        trial_enabled,
        trial_duration_days,
        display_order,
        is_featured
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('tier', { ascending: true });

    // Note: Course filtering would require a junction table
    // For now, return all active plans
    
    const { data: plans, error } = await query;

    if (error) {
      console.error('Error fetching public plans:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch plans'
      }, { status: 500 });
    }

    // Filter out sensitive admin data and ensure consistent structure
    const publicPlans = (plans || []).map(plan => ({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      tier: plan.tier,
      description: plan.description,
      features: plan.features,
      pricing: plan.pricing,
      trial_enabled: plan.trial_enabled,
      trial_duration_days: plan.trial_duration_days,
      display_order: plan.display_order,
      is_featured: plan.is_featured,
      is_active: true // Only active plans are returned
    }));

    return NextResponse.json({
      success: true,
      data: publicPlans
    });

  } catch (error) {
    console.error('Public plans GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}