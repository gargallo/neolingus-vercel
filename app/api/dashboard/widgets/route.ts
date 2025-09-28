import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "@/utils/supabase/server";
import { z } from "zod";

// Validation schemas
const widgetsQuerySchema = z.object({
  category: z.enum(['progress', 'courses', 'achievements', 'analytics', 'social']).optional(),
  subscription_tier: z.enum(['basic', 'standard', 'premium']).optional()
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = widgetsQuerySchema.parse({
      category: searchParams.get('category') || undefined,
      subscription_tier: searchParams.get('subscription_tier') || undefined
    });

    // Build query filters
    let query = supabase
      .from('dashboard_widgets')
      .select('*')
      .eq('is_active', true);

    // Filter by category if specified
    if (queryParams.category) {
      query = query.eq('metadata->>category', queryParams.category);
    }

    // Filter by subscription tier if specified
    if (queryParams.subscription_tier) {
      query = query.or(`metadata->>'min_subscription_tier' is null,metadata->>'min_subscription_tier'.eq.${queryParams.subscription_tier},metadata->>'min_subscription_tier'.eq.basic`);
      
      // Handle tier hierarchy (premium can access standard and basic, standard can access basic)
      if (queryParams.subscription_tier === 'premium') {
        query = query.or(`metadata->>'min_subscription_tier'.eq.standard,metadata->>'min_subscription_tier'.eq.basic`);
      } else if (queryParams.subscription_tier === 'standard') {
        query = query.or(`metadata->>'min_subscription_tier'.eq.basic`);
      }
    }

    query = query.order('metadata->>category', { ascending: true })
                 .order('config->>title', { ascending: true });

    const { data: widgets, error } = await query;

    if (error) {
      console.error('Widgets query error:', error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch widgets" },
        { status: 500 }
      );
    }

    // Process widgets for response
    const processedWidgets = widgets.map(widget => ({
      id: widget.id,
      widget_type: widget.widget_type,
      config: widget.config,
      metadata: {
        category: widget.metadata.category,
        description: widget.metadata.description,
        requires_subscription: widget.metadata.requires_subscription || false,
        min_subscription_tier: widget.metadata.min_subscription_tier || null,
        is_customizable: widget.metadata.is_customizable || false,
        supports_drill_down: widget.metadata.supports_drill_down || false
      },
      default_settings: widget.default_settings,
      is_active: widget.is_active
    }));

    return NextResponse.json({
      success: true,
      data: processedWidgets,
      meta: {
        total_count: processedWidgets.length,
        filters_applied: {
          category: queryParams.category || null,
          subscription_tier: queryParams.subscription_tier || null
        },
        categories: [...new Set(processedWidgets.map(w => w.metadata.category))],
        cache_ttl: 600 // 10 minutes cache for widget definitions
      }
    });

  } catch (error) {
    console.error('Widgets API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid query parameters",
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Create new widget (admin only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate widget creation data
    const createWidgetSchema = z.object({
      widget_type: z.string().min(1).max(100),
      config: z.object({
        title: z.string().min(1),
        size: z.enum(['small', 'medium', 'large', 'full-width']),
        position: z.object({
          row: z.number().int().min(1),
          column: z.number().int().min(1),
          span_rows: z.number().int().min(1).default(1),
          span_columns: z.number().int().min(1).default(1)
        }).optional(),
        refresh_interval: z.number().int().positive().optional(),
        data_source: z.string().min(1),
        filters: z.object({}).optional()
      }),
      metadata: z.object({
        category: z.enum(['progress', 'courses', 'achievements', 'analytics', 'social']),
        description: z.string().min(1),
        requires_subscription: z.boolean().default(false),
        min_subscription_tier: z.enum(['basic', 'standard', 'premium']).optional(),
        is_customizable: z.boolean().default(true),
        supports_drill_down: z.boolean().default(false)
      }),
      default_settings: z.object({
        is_visible: z.boolean().default(true),
        is_collapsible: z.boolean().default(false),
        default_collapsed: z.boolean().default(false),
        user_sortable: z.boolean().default(true),
        admin_only: z.boolean().default(false)
      }).optional()
    });

    const validatedData = createWidgetSchema.parse(body);

    // Check for duplicate widget_type
    const { data: existingWidget } = await supabase
      .from('dashboard_widgets')
      .select('id')
      .eq('widget_type', validatedData.widget_type)
      .single();

    if (existingWidget) {
      return NextResponse.json(
        { success: false, error: "Widget type already exists" },
        { status: 400 }
      );
    }

    // Create widget
    const { data: newWidget, error } = await supabase
      .from('dashboard_widgets')
      .insert({
        ...validatedData,
        created_by: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Widget creation error:', error);
      return NextResponse.json(
        { success: false, error: "Failed to create widget" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newWidget,
      meta: {
        created_by: user.id,
        created_at: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Widget creation API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid widget data",
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}