import { createSupabaseClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/analytics/dashboard - Get dashboard analytics
export async function GET() {
  const supabase = await createSupabaseClient();
  
  // Check admin authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .single();

  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel queries for dashboard metrics
    const [
      totalUsers,
      newUsersThisMonth,
      newUsersThisWeek,
      totalCourses,
      activeCourses,
      totalExamSessions,
      activeExamSessions,
      completedExamSessions,
      totalPayments,
      recentPayments,
      coursesPopularity
    ] = await Promise.all([
      // Total users
      supabase
        .from('auth.users')
        .select('id', { count: 'exact', head: true }),
      
      // New users this month
      supabase
        .from('auth.users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // New users this week
      supabase
        .from('auth.users')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString()),
      
      // Total courses
      supabase
        .from('courses')
        .select('id', { count: 'exact', head: true }),
      
      // Active courses
      supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('available', true),
      
      // Total exam sessions
      supabase
        .from('exam_sessions')
        .select('id', { count: 'exact', head: true }),
      
      // Active exam sessions
      supabase
        .from('exam_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'in_progress'),
      
      // Completed exam sessions
      supabase
        .from('exam_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
      
      // Total payments
      supabase
        .from('payment_transactions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed'),
      
      // Recent payments (last 30 days)
      supabase
        .from('payment_transactions')
        .select('amount', { count: 'exact' })
        .eq('status', 'completed')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Course popularity (enrollments)
      supabase
        .from('user_course_enrollments')
        .select(`
          course_id,
          courses(title, language, level)
        `)
        .eq('subscription_status', 'active')
    ]);

    // Calculate revenue
    const monthlyRevenue = recentPayments.data?.reduce((sum, payment) => 
      sum + parseFloat(payment.amount || '0'), 0) || 0;

    // Process course popularity
    const courseStats = coursesPopularity.data?.reduce((acc: any, enrollment: any) => {
      const courseKey = enrollment.course_id;
      if (!acc[courseKey]) {
        acc[courseKey] = {
          course_id: enrollment.course_id,
          title: enrollment.courses?.title,
          language: enrollment.courses?.language,
          level: enrollment.courses?.level,
          enrollments: 0
        };
      }
      acc[courseKey].enrollments += 1;
      return acc;
    }, {});

    const topCourses = Object.values(courseStats || {})
      .sort((a: any, b: any) => b.enrollments - a.enrollments)
      .slice(0, 5);

    // User growth data (simplified - would need more complex queries for real charts)
    const userGrowth = [
      { month: 'Jan', users: Math.max(0, (totalUsers.count || 0) - 100) },
      { month: 'Feb', users: Math.max(0, (totalUsers.count || 0) - 80) },
      { month: 'Mar', users: Math.max(0, (totalUsers.count || 0) - 60) },
      { month: 'Apr', users: Math.max(0, (totalUsers.count || 0) - 40) },
      { month: 'May', users: Math.max(0, (totalUsers.count || 0) - 20) },
      { month: 'Jun', users: totalUsers.count || 0 },
    ];

    const analytics = {
      overview: {
        totalUsers: totalUsers.count || 0,
        newUsersThisMonth: newUsersThisMonth.count || 0,
        newUsersThisWeek: newUsersThisWeek.count || 0,
        totalCourses: totalCourses.count || 0,
        activeCourses: activeCourses.count || 0,
        totalExamSessions: totalExamSessions.count || 0,
        activeExamSessions: activeExamSessions.count || 0,
        completedExamSessions: completedExamSessions.count || 0,
        totalPayments: totalPayments.count || 0,
        monthlyRevenue: monthlyRevenue,
        conversionRate: totalUsers.count > 0 ? 
          ((totalPayments.count || 0) / totalUsers.count * 100).toFixed(1) : '0.0'
      },
      charts: {
        userGrowth,
        topCourses
      }
    };

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action_type: 'view',
      resource_type_param: 'analytics_dashboard',
      resource_id_param: null
    });

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}