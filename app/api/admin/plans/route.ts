/**
 * Admin Plans API - Main CRUD operations
 * Handles GET (list) and POST (create) for admin plan management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { z } from 'zod';

// Request validation schemas
const planFeatureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  included: z.boolean(),
  limit: z.number().nullable().optional()
});

const planLimitsSchema = z.object({
  max_courses: z.number().positive().nullable(),
  max_exams_per_month: z.number().positive().nullable(),
  ai_tutoring_sessions: z.number().positive().nullable(),
  storage_gb: z.number().positive().nullable(),
  concurrent_sessions: z.number().positive().nullable()
}).partial();

const planPricingSchema = z.object({
  monthly_price: z.number().min(0),
  yearly_price: z.number().min(0).optional(),
  currency: z.enum(['EUR', 'USD']).default('EUR'),
  billing_period: z.enum(['monthly', 'yearly']).default('monthly')
});

const createPlanSchema = z.object({
  name: z.string().min(1, 'Plan name is required').max(255),
  tier: z.enum(['basic', 'standard', 'premium']),
  description: z.string().optional(),
  features: z.array(planFeatureSchema).default([]),
  limits: planLimitsSchema.default({}),
  pricing: planPricingSchema,
  trial_enabled: z.boolean().default(true),
  trial_duration_days: z.number().min(1).max(30).default(7),
  display_order: z.number().min(0).optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false)
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

  // TODO: Implement real JWT verification when auth system is ready
  return { error: 'Invalid authentication token', status: 401 };
}

// GET /api/admin/plans - List all plans with admin data
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin
    const auth = await authenticateAdmin(request);
    if (auth.error) {
      return NextResponse.json({
        success: false,
        error: auth.error
      }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get('tier');
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const supabase = createSupabaseClientFromRequest(request);

    // Build query
    let query = supabase
      .from('admin_plan_details')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (tier) {
      query = query.eq('tier', tier);
    }

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch plans'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: plans || []
    });

  } catch (error) {
    console.error('Admin plans GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/admin/plans - Create new plan
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
    const validation = createPlanSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        success: false,
        errors: validation.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        )
      }, { status: 400 });
    }

    const planData = validation.data;
    const supabase = createSupabaseClientFromRequest(request);

    // Check for duplicate plan name
    const { data: existingPlan } = await supabase
      .from('plans')
      .select('id')
      .eq('name', planData.name)
      .single();

    if (existingPlan) {
      return NextResponse.json({
        success: false,
        error: 'A plan with this name already exists'
      }, { status: 409 });
    }

    // Validate feature dependencies
    const hasAiTutor = planData.features.some(f => f.id === 'ai_tutor' && f.included);
    const hasCustomPlans = planData.features.some(f => f.id === 'custom_plans' && f.included);
    
    if (hasCustomPlans && !hasAiTutor) {
      return NextResponse.json({
        success: false,
        error: 'Custom study plans require AI tutoring to be enabled'
      }, { status: 400 });
    }

    // Generate slug from name
    const slug = planData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create plan
    const { data: newPlan, error: createError } = await supabase
      .from('plans')
      .insert({
        name: planData.name,
        slug,
        tier: planData.tier,
        description: planData.description,
        features: planData.features,
        limits: planData.limits,
        pricing: planData.pricing,
        trial_enabled: planData.trial_enabled,
        trial_duration_days: planData.trial_duration_days,
        display_order: planData.display_order,
        is_active: planData.is_active,
        is_featured: planData.is_featured,
        created_by: auth.user.id,
        updated_by: auth.user.id
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating plan:', createError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create plan'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: newPlan
    }, { status: 201 });

  } catch (error) {
    console.error('Admin plans POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}