import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "@/utils/supabase/server";
import { z } from "zod";

// Validation schemas
const widgetPreferenceSchema = z.object({
  widget_id: z.string().uuid(),
  position: z.object({
    row: z.number().int().min(1),
    column: z.number().int().min(1),
    span_rows: z.number().int().min(1).default(1),
    span_columns: z.number().int().min(1).default(1)
  }),
  settings: z.object({
    is_visible: z.boolean().default(true),
    is_collapsed: z.boolean().default(false),
    refresh_interval: z.number().int().positive().optional(),
    custom_title: z.string().optional(),
    filters: z.object({}).optional(),
    display_options: z.object({}).optional()
  }).optional()
});

const widgetPreferencesUpdateSchema = z.array(widgetPreferenceSchema);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = id;
    const isOwnData = user.id === userId;
    
    // Verify access permissions
    if (!isOwnData) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 }
        );
      }
    }

    // Get user widget preferences with widget information
    const { data: preferences, error } = await supabase
      .from('user_widget_preferences')
      .select(`
        id,
        widget_id,
        position,
        settings,
        created_at,
        updated_at,
        dashboard_widgets (
          id,
          widget_type,
          config,
          metadata,
          default_settings,
          is_active
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Widget preferences query error:', error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch widget preferences" },
        { status: 500 }
      );
    }

    // If no preferences exist, get default widgets and create preferences
    if (!preferences || preferences.length === 0) {
      const { data: defaultWidgets } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('is_active', true)
        .order('config->>title');

      // Create default preferences for all active widgets
      if (defaultWidgets && defaultWidgets.length > 0) {
        const defaultPreferences = defaultWidgets.map((widget, index) => ({
          user_id: userId,
          widget_id: widget.id,
          position: widget.config?.position || {
            row: Math.floor(index / 2) + 1,
            column: (index % 2) + 1,
            span_rows: 1,
            span_columns: 1
          },
          settings: {
            is_visible: widget.default_settings?.is_visible !== false,
            is_collapsed: widget.default_settings?.default_collapsed || false,
            ...widget.default_settings
          }
        }));

        const { data: createdPreferences, error: createError } = await supabase
          .from('user_widget_preferences')
          .insert(defaultPreferences)
          .select(`
            id,
            widget_id,
            position,
            settings,
            created_at,
            updated_at,
            dashboard_widgets (
              id,
              widget_type,
              config,
              metadata,
              default_settings,
              is_active
            )
          `);

        if (createError) {
          console.error('Error creating default preferences:', createError);
          return NextResponse.json(
            { success: false, error: "Failed to initialize widget preferences" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          data: createdPreferences || [],
          meta: {
            user_id: userId,
            preferences_count: createdPreferences?.length || 0,
            initialized_defaults: true,
            cache_ttl: 300
          }
        });
      }
    }

    // Filter out preferences for inactive widgets
    const activePreferences = preferences?.filter(p => 
      p.dashboard_widgets && p.dashboard_widgets.is_active
    ) || [];

    // Sort by position (row, then column)
    activePreferences.sort((a, b) => {
      const aRow = a.position?.row || 1;
      const bRow = b.position?.row || 1;
      if (aRow !== bRow) return aRow - bRow;
      
      const aCol = a.position?.column || 1;
      const bCol = b.position?.column || 1;
      return aCol - bCol;
    });

    return NextResponse.json({
      success: true,
      data: activePreferences,
      meta: {
        user_id: userId,
        preferences_count: activePreferences.length,
        cache_ttl: 300,
        last_updated: activePreferences.length > 0 
          ? Math.max(...activePreferences.map(p => new Date(p.updated_at).getTime()))
          : null
      }
    });

  } catch (error) {
    console.error('Widget preferences GET error:', error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = id;
    
    // Only allow users to update their own preferences
    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedPreferences = widgetPreferencesUpdateSchema.parse(body);

    // Validate that all widget IDs exist and are active
    const widgetIds = validatedPreferences.map(p => p.widget_id);
    const { data: widgets, error: widgetError } = await supabase
      .from('dashboard_widgets')
      .select('id')
      .in('id', widgetIds)
      .eq('is_active', true);

    if (widgetError) {
      console.error('Widget validation error:', widgetError);
      return NextResponse.json(
        { success: false, error: "Failed to validate widgets" },
        { status: 500 }
      );
    }

    const validWidgetIds = new Set(widgets?.map(w => w.id) || []);
    const invalidWidgets = widgetIds.filter(id => !validWidgetIds.has(id));

    if (invalidWidgets.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid widget IDs",
          details: { invalid_widgets: invalidWidgets }
        },
        { status: 400 }
      );
    }

    // Check for position conflicts
    const positionMap = new Map();
    const conflicts = [];

    validatedPreferences.forEach(pref => {
      const posKey = `${pref.position.row}-${pref.position.column}`;
      if (positionMap.has(posKey)) {
        conflicts.push({
          position: pref.position,
          widgets: [positionMap.get(posKey), pref.widget_id]
        });
      } else {
        positionMap.set(posKey, pref.widget_id);
      }
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Position conflicts detected",
          details: { conflicts }
        },
        { status: 400 }
      );
    }

    // Delete existing preferences for this user
    const { error: deleteError } = await supabase
      .from('user_widget_preferences')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Error deleting existing preferences:', deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    // Insert new preferences
    const preferencesToInsert = validatedPreferences.map(pref => ({
      user_id: userId,
      widget_id: pref.widget_id,
      position: pref.position,
      settings: pref.settings || {
        is_visible: true,
        is_collapsed: false
      }
    }));

    const { data: updatedPreferences, error: insertError } = await supabase
      .from('user_widget_preferences')
      .insert(preferencesToInsert)
      .select(`
        id,
        widget_id,
        position,
        settings,
        created_at,
        updated_at,
        dashboard_widgets (
          id,
          widget_type,
          config,
          metadata,
          default_settings,
          is_active
        )
      `);

    if (insertError) {
      console.error('Error inserting preferences:', insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save preferences" },
        { status: 500 }
      );
    }

    // Update user analytics dashboard_config with new widget order
    const widgetOrder = updatedPreferences
      ?.sort((a, b) => {
        const aRow = a.position?.row || 1;
        const bRow = b.position?.row || 1;
        if (aRow !== bRow) return aRow - bRow;
        
        const aCol = a.position?.column || 1;
        const bCol = b.position?.column || 1;
        return aCol - bCol;
      })
      .map(p => p.dashboard_widgets?.widget_type)
      .filter(Boolean);

    if (widgetOrder && widgetOrder.length > 0) {
      await supabase
        .from('user_analytics')
        .update({
          dashboard_config: supabase.raw(`dashboard_config || '{"widget_order": ${JSON.stringify(widgetOrder)}}'::jsonb`)
        })
        .eq('user_id', userId);
    }

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
      meta: {
        user_id: userId,
        preferences_updated: updatedPreferences?.length || 0,
        widget_order: widgetOrder,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Widget preferences PUT error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid preference data",
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

// Patch specific widget preference
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = id;
    
    // Only allow users to update their own preferences
    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    const patchSchema = z.object({
      widget_id: z.string().uuid(),
      position: z.object({
        row: z.number().int().min(1),
        column: z.number().int().min(1),
        span_rows: z.number().int().min(1),
        span_columns: z.number().int().min(1)
      }).optional(),
      settings: z.object({
        is_visible: z.boolean().optional(),
        is_collapsed: z.boolean().optional(),
        refresh_interval: z.number().int().positive().optional(),
        custom_title: z.string().optional(),
        filters: z.object({}).optional(),
        display_options: z.object({}).optional()
      }).optional()
    });

    const validatedData = patchSchema.parse(body);

    // Check if preference exists
    const { data: existingPreference } = await supabase
      .from('user_widget_preferences')
      .select('id')
      .eq('user_id', userId)
      .eq('widget_id', validatedData.widget_id)
      .single();

    if (!existingPreference) {
      return NextResponse.json(
        { success: false, error: "Widget preference not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: any = {};
    if (validatedData.position) {
      updates.position = validatedData.position;
    }
    if (validatedData.settings) {
      updates.settings = validatedData.settings;
    }

    // Perform update
    const { data: updatedPreference, error } = await supabase
      .from('user_widget_preferences')
      .update(updates)
      .eq('user_id', userId)
      .eq('widget_id', validatedData.widget_id)
      .select(`
        id,
        widget_id,
        position,
        settings,
        updated_at,
        dashboard_widgets (
          widget_type,
          config
        )
      `)
      .single();

    if (error) {
      console.error('Widget preference update error:', error);
      return NextResponse.json(
        { success: false, error: "Failed to update preference" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPreference,
      meta: {
        user_id: userId,
        widget_id: validatedData.widget_id,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Widget preference PATCH error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request data",
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