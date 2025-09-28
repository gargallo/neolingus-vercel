import { NextRequest, NextResponse } from "next/server";
import { createSupabaseClientFromRequest } from "@/utils/supabase/server";
import { z } from "zod";

// Demo data function
function getDemoDashboardData(userId: string) {
  const demoWidgets = [
    {
      widget: {
        id: 'demo-progress-1',
        widget_type: 'progress_overview',
        config: {
          size: 'large',
          position: { row: 1, col: 1 },
          title: 'Progress Overview'
        },
        metadata: {
          category: 'analytics',
          description: 'Shows overall learning progress'
        },
        default_settings: {},
        is_active: true
      },
      preferences: {
        id: 'pref-progress-1',
        position: { row: 1, column: 1, span_rows: 1, span_columns: 2 },
        settings: {
          is_visible: true,
          is_collapsed: false,
          custom_title: 'Your Progress'
        }
      }
    },
    {
      widget: {
        id: 'demo-courses-1',
        widget_type: 'course_cards',
        config: {
          size: 'medium',
          position: { row: 1, col: 2 },
          title: 'My Courses'
        },
        metadata: {
          category: 'courses',
          description: 'Active course enrollment cards'
        },
        default_settings: {},
        is_active: true
      },
      preferences: {
        id: 'pref-courses-1',
        position: { row: 1, column: 3, span_rows: 1, span_columns: 2 },
        settings: {
          is_visible: true,
          is_collapsed: false,
          custom_title: 'My Courses'
        }
      }
    },
    {
      widget: {
        id: 'demo-achievements-1',
        widget_type: 'achievement_showcase',
        config: {
          size: 'medium',
          position: { row: 2, col: 1 },
          title: 'Achievements'
        },
        metadata: {
          category: 'gamification',
          description: 'Badges and achievements showcase'
        },
        default_settings: {},
        is_active: true
      },
      preferences: {
        id: 'pref-achievements-1',
        position: { row: 2, column: 1, span_rows: 1, span_columns: 1 },
        settings: {
          is_visible: true,
          is_collapsed: false,
          custom_title: 'Achievements'
        }
      }
    },
    {
      widget: {
        id: 'demo-streak-1',
        widget_type: 'streak_tracker',
        config: {
          size: 'small',
          position: { row: 2, col: 2 },
          title: 'Study Streak'
        },
        metadata: {
          category: 'engagement',
          description: 'Daily study streak tracker'
        },
        default_settings: {},
        is_active: true
      },
      preferences: {
        id: 'pref-streak-1',
        position: { row: 2, column: 2, span_rows: 1, span_columns: 1 },
        settings: {
          is_visible: true,
          is_collapsed: false,
          custom_title: 'Study Streak'
        }
      }
    },
    {
      widget: {
        id: 'demo-analytics-1',
        widget_type: 'study_analytics',
        config: {
          size: 'large',
          position: { row: 3, col: 1 },
          title: 'Study Analytics'
        },
        metadata: {
          category: 'analytics',
          description: 'Detailed study performance metrics'
        },
        default_settings: {},
        is_active: true
      },
      preferences: {
        id: 'pref-analytics-1',
        position: { row: 3, column: 1, span_rows: 1, span_columns: 2 },
        settings: {
          is_visible: true,
          is_collapsed: false,
          custom_title: 'Study Analytics'
        }
      }
    }
  ];

  const demoDashboard = {
    user_stats: {
      engagement: {
        total_login_days: 42,
        current_streak: 12,
        longest_streak: 28,
        last_activity_at: new Date().toISOString(),
        session_count_today: 3,
        total_study_minutes: 3840, // 64 hours
        weekly_study_minutes: [180, 120, 90, 240, 150, 300, 90]
      },
      achievements: {
        total_xp: 2340,
        current_level: 8,
        badges_earned: [
          { id: 'first_session', name: 'First Steps', rarity: 'common' },
          { id: 'week_streak', name: 'Week Warrior', rarity: 'rare' },
          { id: 'perfectionist', name: 'Perfect Score', rarity: 'epic' }
        ],
        milestones_reached: ['100_xp', '500_xp', '1000_xp', '2000_xp'],
        next_milestone: {
          id: '2500_xp',
          progress: 0.936,
          required_xp: 2500
        }
      },
      preferences: {
        study_goal_minutes_daily: 60,
        preferred_study_times: ['morning', 'evening'],
        difficulty_preference: 'adaptive',
        notification_preferences: {
          streak_reminders: true,
          achievement_alerts: true,
          study_goal_reminders: true,
          weekly_progress_summary: true
        }
      },
      dashboard_config: {
        layout: 'comfortable',
        theme: 'auto',
        widget_order: ['progress_overview', 'course_cards', 'achievement_showcase', 'streak_tracker', 'study_analytics'],
        hidden_widgets: [],
        quick_actions: ['start_session', 'view_progress', 'check_achievements']
      },
      performance: {
        average_session_score: 87.3,
        improvement_rate: 12.5,
        weak_areas: ['listening_comprehension', 'advanced_grammar'],
        strong_areas: ['vocabulary', 'basic_grammar', 'reading_comprehension'],
        recommended_study_path: 'Focus on listening exercises and advanced grammar patterns'
      }
    },
    widgets: demoWidgets,
    recent_progress: [
      {
        course_id: 'valenciano_c1',
        session_date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        score: 92,
        components: ['reading', 'listening'],
        xp_earned: 45
      },
      {
        course_id: 'english_b2',
        session_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        score: 78,
        components: ['writing', 'speaking'],
        xp_earned: 32
      }
    ],
    achievements: {
      total_xp: 2340,
      current_level: 8,
      badges: [
        { id: 'first_session', name: 'First Steps', description: 'Complete your first study session', rarity: 'common' },
        { id: 'week_streak', name: 'Week Warrior', description: 'Study for 7 consecutive days', rarity: 'rare' },
        { id: 'perfectionist', name: 'Perfect Score', description: 'Score 100% on any exam', rarity: 'epic' }
      ],
      milestones: [
        { id: '100_xp', name: '100 XP Milestone', completed: true },
        { id: '500_xp', name: '500 XP Milestone', completed: true },
        { id: '1000_xp', name: '1000 XP Milestone', completed: true },
        { id: '2000_xp', name: '2000 XP Milestone', completed: true }
      ],
      streaks: {
        current: 12,
        longest: 28,
        weekly_streak: true,
        monthly_streak: false
      }
    },
    theme: {
      theme: 'auto',
      layout: 'comfortable',
      animations_enabled: true,
      notifications_enabled: true,
      accent_color: null,
      font_size: 'medium',
      high_contrast: false
    }
  };

  return NextResponse.json({
    success: true,
    data: demoDashboard,
    meta: {
      user_id: userId,
      demo_mode: true,
      timeframe: 'month',
      widget_count: demoWidgets.length,
      mobile_optimized: false,
      cache_ttl: 0,
      last_updated: new Date().toISOString()
    }
  });
}

// Validation schemas
const getUserDashboardSchema = z.object({
  widgets: z.array(z.string()).optional(),
  timeframe: z.enum(['day', 'week', 'month', 'year']).default('month'),
  mobile: z.string().transform(val => val === 'true').optional()
});

// Zod schema for RPC response validation
const rpcResponseSchema = z.object({
  user_stats: z.object({
    engagement: z.object({
      total_login_days: z.number().default(0),
      current_streak: z.number().default(0),
      longest_streak: z.number().default(0),
      last_activity_at: z.string().nullable().default(null),
      session_count_today: z.number().default(0),
      total_study_minutes: z.number().default(0),
      weekly_study_minutes: z.array(z.number()).default([0, 0, 0, 0, 0, 0, 0])
    }).default({}),
    achievements: z.object({
      total_xp: z.number().default(0),
      current_level: z.number().default(1),
      badges_earned: z.array(z.any()).default([]),
      milestones_reached: z.array(z.string()).default([]),
      next_milestone: z.object({
        id: z.string().default("first_session"),
        progress: z.number().default(0),
        required_xp: z.number().default(10)
      }).default({})
    }).default({}),
    preferences: z.any().default({}),
    dashboard_config: z.any().default({}),
    performance: z.any().default({})
  }).nullable().default(null),
  configured_widgets: z.array(z.any()).default([]),
  recent_progress: z.array(z.any()).default([])
});

// Type guard for RPC response validation with Zod
function validateRpcResponse(data: any): data is Array<{ user_stats: any, configured_widgets: any, recent_progress: any }> {
  try {
    if (Array.isArray(data) && data.length > 0) {
      // Validate the first item with Zod schema
      rpcResponseSchema.parse(data[0]);
      return true;
    }
    return false;
  } catch (error) {
    console.warn('RPC response validation failed:', error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for demo mode - restrict to development only (Comment 9)
    const isDemoMode = request.nextUrl.searchParams.get('demo') === 'true';

    if (isDemoMode) {
      // Only allow demo mode in development or when explicitly enabled
      if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_DEMO !== 'true') {
        return NextResponse.json(
          { success: false, error: "Demo mode not available in production" },
          { status: 403 }
        );
      }
      // Return demo data immediately without authentication
      const { id } = await params;
      return getDemoDashboardData(id);
    }

    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user can access this dashboard (own data or admin) - Comment 8: Fix params typing
    const { id } = await params;
    const userId = id;
    const isOwnData = user.id === userId;
    
    if (!isOwnData) {
      // Check if user is admin
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      widgets: searchParams.get('widgets')?.split(','),
      timeframe: searchParams.get('timeframe') || 'month',
      mobile: searchParams.get('mobile')
    };

    const validatedParams = getUserDashboardSchema.parse(queryParams);

    // Optimize for mobile by reducing payload
    const isMobileRequest = validatedParams.mobile || false;

    // Check if user exists in Supabase Auth (they should if they're authenticated)
    let dashboardData = null;
    let userExists = true;
    let dbFunctionAvailable = true;
    let rpcError = null;

    try {
      // Try to get comprehensive dashboard data using the database function
      const { data: dashboardResult, error: dashboardError } = await supabase
        .rpc('get_user_dashboard_data', { p_user_id: userId });

      if (dashboardError) {
        console.error('Dashboard RPC error:', dashboardError);
        rpcError = dashboardError;

        // Comment 5: Check for specific PGRST202 error (function not found)
        if (dashboardError.code === 'PGRST202') {
          dbFunctionAvailable = false;
          // Keep userExists = true since this is a function availability issue, not user existence
          console.error('🚨 DATABASE SETUP INCOMPLETE: The get_user_dashboard_data function is missing from the database.');
          console.error('📋 SOLUTION: Run the database setup script to apply all migrations:');
          console.error('   1. Run: chmod +x scripts/setup-database-complete.sh');
          console.error('   2. Run: ./scripts/setup-database-complete.sh');
          console.error('   3. Or manually apply: supabase/migrations/apply-all-migrations.sql');
          console.error('📖 See DATABASE_SETUP_GUIDE.md for detailed instructions');

          // Fall back to defaults but include migration hints
        } else {
          // For other errors, log and return structured error
          console.error('RPC Error Details:', dashboardError);
          return NextResponse.json({
            success: false,
            error: "Database query failed",
            message: "Unable to retrieve dashboard data",
            meta: {
              error_code: dashboardError.code || 'UNKNOWN_DB_ERROR',
              error_details: dashboardError.message,
              user_id: userId
            }
          }, { status: 500 });
        }
      } else {
        // Comment 6: Guard RPC return type and validate shape
        if (validateRpcResponse(dashboardResult)) {
          dashboardData = dashboardResult;
        } else if (dashboardResult && typeof dashboardResult === 'object' && !Array.isArray(dashboardResult)) {
          // If it's an object (not array), use it directly
          dashboardData = [dashboardResult];
        } else {
          // Trigger default fallback for invalid response shape
          console.warn('Invalid RPC response shape, falling back to defaults');
          dashboardData = null;
        }
      }
    } catch (error: any) {
      console.error('Dashboard data fetch error:', error);
      rpcError = error;

      // Additional check for function-related errors that might be thrown as exceptions
      if (error?.message?.includes('function') || error?.message?.includes('does not exist') || error?.message?.includes('PGRST202')) {
        dbFunctionAvailable = false;
        console.error('🚨 DATABASE SETUP INCOMPLETE: Database function error detected.');
        console.error('📋 Run the database setup script to resolve this issue.');
        // Fall back to defaults
      } else {
        // For other exceptions, return error response
        return NextResponse.json({
          success: false,
          error: "Database configuration error",
          message: "An unexpected error occurred while retrieving dashboard data",
          details: {
            error_code: "DATABASE_EXCEPTION",
            error_message: error.message
          }
        }, { status: 500 });
      }
    }

    if (!dashboardData || dashboardData.length === 0 || !userExists) {
      // Try to initialize analytics for authenticated user (only if they exist in auth.users)
      if (userExists) {
        try {
          const { error: initError } = await supabase
            .from('user_analytics')
            .insert({ user_id: userId });

          if (initError && initError.code !== '23505') { // Ignore duplicate key error
            console.error('Failed to initialize analytics:', initError);
          }
        } catch (error) {
          console.error('Analytics initialization error:', error);
        }
      }

      // Comment 7: Get default widgets for new users with enhanced error handling
      const { data: defaultWidgets, error: defaultWidgetsError } = await supabase
        .from('dashboard_widgets')
        .select('id, widget_type, config, metadata, default_settings, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (defaultWidgetsError) {
        console.error('Default widgets query error:', defaultWidgetsError);

        // Check if error indicates missing table
        if (defaultWidgetsError.message?.includes('relation') && defaultWidgetsError.message?.includes('does not exist')) {
          console.warn('🚨 dashboard_widgets table missing - this indicates incomplete database setup');
          console.warn('📋 Run ./scripts/setup-database-complete.sh to create missing tables');

          // Add to missing migrations metadata
          if (!dbFunctionAvailable) {
            // Already have missing function, add table
          } else {
            dbFunctionAvailable = false; // Mark as needing setup
          }
        }
      }

      // Comment 1: Create default widget configurations with correct mapping
      const defaultWidgetConfigs = (defaultWidgets || []).map((w: any, index: number) => ({
        widget: {
          id: w.id,
          widget_type: w.widget_type,
          config: {
            size: w?.config?.size ?? 'medium',
            position: w?.config?.position ?? { row: Math.floor(index / 2) + 1, col: (index % 2) + 1 },
            title: w?.config?.title ?? w?.metadata?.title ?? w.widget_type
          },
          metadata: {
            category: w?.metadata?.category,
            description: w?.metadata?.description
          },
          default_settings: w?.default_settings ?? {},
          is_active: w.is_active
        },
        preferences: {
          id: `pref_${w.id}`,
          position: { row: Math.floor(index / 2) + 1, column: (index % 2) + 1, span_rows: 1, span_columns: 1 },
          settings: {
            is_visible: true,
            is_collapsed: false,
            custom_title: w?.config?.title ?? w.widget_type
          }
        }
      }));

      // Return empty dashboard structure with default widgets
      const emptyDashboard = {
        user_stats: {
          engagement: {
            total_login_days: 0,
            current_streak: 0,
            longest_streak: 0,
            last_activity_at: null,
            session_count_today: 0,
            total_study_minutes: 0,
            weekly_study_minutes: [0, 0, 0, 0, 0, 0, 0]
          },
          achievements: {
            total_xp: 0,
            current_level: 1,
            badges_earned: [],
            milestones_reached: [],
            next_milestone: {
              id: "first_session",
              progress: 0,
              required_xp: 10
            }
          },
          preferences: {
            study_goal_minutes_daily: 30,
            preferred_study_times: ["evening"],
            difficulty_preference: "adaptive",
            notification_preferences: {
              streak_reminders: true,
              achievement_alerts: true,
              study_goal_reminders: true,
              weekly_progress_summary: true
            }
          },
          dashboard_config: {
            layout: "comfortable",
            theme: "auto",
            widget_order: [],
            hidden_widgets: [],
            quick_actions: ["start_session", "view_progress"]
          },
          performance: {
            average_session_score: 0,
            improvement_rate: 0,
            weak_areas: [],
            strong_areas: [],
            recommended_study_path: ""
          }
        },
        widgets: defaultWidgetConfigs,
        recent_progress: [],
        achievements: {
          total_xp: 0,
          current_level: 1,
          badges: [],
          milestones: [],
          streaks: {
            current: 0,
            longest: 0,
            weekly_streak: false,
            monthly_streak: false
          }
        },
        theme: {
          theme: "auto",
          layout: "comfortable",
          animations_enabled: true,
          notifications_enabled: true,
          accent_color: null,
          font_size: "medium",
          high_contrast: false
        }
      };

      return NextResponse.json({
        success: true,
        data: emptyDashboard,
        meta: {
          timeframe: validatedParams.timeframe,
          mobile_optimized: isMobileRequest,
          cache_ttl: 300,
          missing_migrations: !dbFunctionAvailable ? ['get_user_dashboard_data function'] : undefined,
          hints: !dbFunctionAvailable ? 'Run ./scripts/setup-database-complete.sh to resolve PGRST202 errors' : undefined
        }
      });
    }

    // Comment 6: Safe destructuring with type guard already applied
    const dashboardRow = dashboardData[0];
    const { user_stats, configured_widgets, recent_progress } = dashboardRow;

    // Process widgets based on user preferences
    let processedWidgets = configured_widgets || [];
    
    // Filter widgets if specific ones requested
    if (validatedParams.widgets && validatedParams.widgets.length > 0) {
      processedWidgets = processedWidgets.filter((w: any) => 
        validatedParams.widgets!.includes(w.widget?.widget_type)
      );
    }

    // Mobile optimization - reduce widget data
    if (isMobileRequest) {
      processedWidgets = processedWidgets.map((w: any) => ({
        ...w,
        // Remove heavy data for mobile
        widget: {
          ...w.widget,
          metadata: {
            category: w.widget.metadata?.category,
            description: w.widget.metadata?.description
          }
        }
      }));
    }

    // Get user theme preferences from analytics
    const themePreferences = {
      theme: user_stats?.dashboard_config?.theme || "auto",
      layout: user_stats?.dashboard_config?.layout || "comfortable",
      animations_enabled: true,
      notifications_enabled: user_stats?.preferences?.notification_preferences?.achievement_alerts !== false,
      accent_color: null,
      font_size: "medium",
      high_contrast: false
    };

    // Format achievements data
    const achievements = {
      total_xp: user_stats?.achievements?.total_xp || 0,
      current_level: user_stats?.achievements?.current_level || 1,
      badges: user_stats?.achievements?.badges_earned || [],
      milestones: user_stats?.achievements?.milestones_reached || [],
      streaks: {
        current: user_stats?.engagement?.current_streak || 0,
        longest: user_stats?.engagement?.longest_streak || 0,
        weekly_streak: (user_stats?.engagement?.current_streak || 0) >= 7,
        monthly_streak: (user_stats?.engagement?.current_streak || 0) >= 30
      }
    };

    // Construct response
    const dashboardResponse = {
      user_stats: user_stats || {},
      widgets: processedWidgets,
      recent_progress: recent_progress || [],
      achievements,
      theme: themePreferences
    };

    return NextResponse.json({
      success: true,
      data: dashboardResponse,
      meta: {
        user_id: userId,
        timeframe: validatedParams.timeframe,
        widget_count: processedWidgets.length,
        mobile_optimized: isMobileRequest,
        cache_ttl: isMobileRequest ? 180 : 300, // Shorter cache for mobile
        last_updated: user_stats?.updated_at || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    
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

// Update dashboard configuration
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
    
    // Only allow users to update their own dashboard
    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate dashboard config updates
    const updateSchema = z.object({
      dashboard_config: z.object({
        layout: z.enum(['compact', 'comfortable', 'spacious']).optional(),
        theme: z.enum(['light', 'dark', 'auto']).optional(),
        widget_order: z.array(z.string()).optional(),
        hidden_widgets: z.array(z.string()).optional(),
        quick_actions: z.array(z.string()).optional()
      }).optional(),
      preferences: z.object({
        study_goal_minutes_daily: z.number().min(5).max(480).optional(),
        preferred_study_times: z.array(z.enum(['morning', 'afternoon', 'evening'])).optional(),
        difficulty_preference: z.enum(['adaptive', 'easy', 'medium', 'hard']).optional(),
        notification_preferences: z.object({
          streak_reminders: z.boolean().optional(),
          achievement_alerts: z.boolean().optional(),
          study_goal_reminders: z.boolean().optional(),
          weekly_progress_summary: z.boolean().optional()
        }).optional()
      }).optional()
    });

    const validatedData = updateSchema.parse(body);

    // Build update query
    const updates: any = {};
    
    if (validatedData.dashboard_config) {
      updates.dashboard_config = validatedData.dashboard_config;
    }
    
    if (validatedData.preferences) {
      updates.preferences = validatedData.preferences;
    }

    // Perform update
    const { data, error } = await supabase
      .from('user_analytics')
      .update(updates)
      .eq('user_id', userId)
      .select('dashboard_config, preferences')
      .single();

    if (error) {
      console.error('Dashboard update error:', error);
      return NextResponse.json(
        { success: false, error: "Failed to update dashboard configuration" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      meta: {
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard PATCH error:', error);
    
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