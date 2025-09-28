import { createSupabaseClient } from "@/utils/supabase/server";
import AnalyticsHeader from "@/components/admin/analytics/analytics-header";
import OverviewStats from "@/components/admin/analytics/overview-stats";
import UserGrowthChart from "@/components/admin/analytics/user-growth-chart";
import CoursePopularityChart from "@/components/admin/analytics/course-popularity-chart";
import RevenueChart from "@/components/admin/analytics/revenue-chart";
import RegionalAnalytics from "@/components/admin/analytics/regional-analytics";

export default async function AdminAnalyticsPage() {
  const supabase = await createSupabaseClient();
  
  // Get current admin user role
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user?.id)
    .single();

  // Fetch analytics data using the API endpoint
  let analyticsData = null;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/analytics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      }
    });
    
    if (response.ok) {
      analyticsData = await response.json();
    }
  } catch (error) {
    console.error('Error fetching analytics:', error);
  }

  // Get additional detailed analytics
  const [
    { data: coursesAnalytics },
    { data: regionalData },
  ] = await Promise.all([
    // Course performance data
    supabase
      .from('courses')
      .select(`
        course_id,
        title,
        language,
        level,
        user_course_enrollments(count),
        exam_sessions(
          status,
          started_at,
          exam_results(percentage_score, passed)
        )
      `),
    
    // Regional distribution
    supabase
      .from('courses')
      .select('region, user_course_enrollments(count)')
      .eq('available', true)
  ]);

  // Process course analytics
  const courseStats = coursesAnalytics?.map(course => ({
    ...course,
    enrollments: Array.isArray(course.user_course_enrollments) ? course.user_course_enrollments.length : 0,
    totalExams: Array.isArray(course.exam_sessions) ? course.exam_sessions.length : 0,
    completedExams: Array.isArray(course.exam_sessions) 
      ? course.exam_sessions.filter(s => s.status === 'completed').length 
      : 0,
    avgScore: Array.isArray(course.exam_sessions) && course.exam_sessions.length > 0
      ? course.exam_sessions
          .filter(s => s.exam_results && s.exam_results.length > 0)
          .reduce((acc, s) => acc + (s.exam_results[0]?.percentage_score || 0), 0) / 
        course.exam_sessions.filter(s => s.exam_results && s.exam_results.length > 0).length
      : 0
  })) || [];

  return (
    <div className="space-y-8">
      <AnalyticsHeader adminRole={adminUser?.role} />
      
      {/* Overview Stats */}
      {analyticsData && (
        <OverviewStats data={analyticsData.overview} />
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        {analyticsData?.charts?.userGrowth && (
          <UserGrowthChart data={analyticsData.charts.userGrowth} />
        )}

        {/* Course Popularity */}
        {analyticsData?.charts?.topCourses && (
          <CoursePopularityChart data={analyticsData.charts.topCourses} />
        )}
      </div>

      {/* Revenue & Regional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        {analyticsData && (
          <RevenueChart monthlyRevenue={analyticsData.overview.monthlyRevenue} />
        )}

        {/* Regional Analytics */}
        {regionalData && (
          <RegionalAnalytics data={regionalData} />
        )}
      </div>

      {/* Course Performance Table */}
      {courseStats.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold text-lg mb-4">Course Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Course</th>
                  <th className="text-right py-2">Students</th>
                  <th className="text-right py-2">Exams</th>
                  <th className="text-right py-2">Completion</th>
                  <th className="text-right py-2">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {courseStats
                  .sort((a, b) => b.enrollments - a.enrollments)
                  .slice(0, 10)
                  .map((course) => (
                    <tr key={course.course_id} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-muted-foreground text-xs">
                            {course.language} • {course.level}
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-2">{course.enrollments}</td>
                      <td className="text-right py-2">{course.totalExams}</td>
                      <td className="text-right py-2">
                        {course.totalExams > 0 
                          ? `${Math.round((course.completedExams / course.totalExams) * 100)}%`
                          : '0%'
                        }
                      </td>
                      <td className="text-right py-2">
                        {course.avgScore > 0 ? `${Math.round(course.avgScore)}%` : '-'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}