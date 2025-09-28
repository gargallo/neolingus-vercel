import { createSupabaseClient } from "@/utils/supabase/server";
import CoursesHeader from "@/components/admin/courses/courses-header";
import CoursesList from "@/components/admin/courses/courses-list";

export default async function AdminCoursesPage() {
  const supabase = await createSupabaseClient();
  
  // Get current admin user role
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user?.id)
    .single();

  // Get courses with enrollment statistics
  const { data: coursesData, error } = await supabase
    .from('courses')
    .select(`
      *,
      user_course_enrollments(count),
      exam_sessions(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching courses:', error);
    return (
      <div className="space-y-6">
        <CoursesHeader adminRole={adminUser?.role} />
        <div className="text-center py-8 text-red-600">
          Error loading courses. Please try again.
        </div>
      </div>
    );
  }

  // Process courses data to include statistics
  const courses = coursesData?.map(course => {
    const enrollmentCount = Array.isArray(course.user_course_enrollments) 
      ? course.user_course_enrollments.length 
      : 0;
    
    const examSessionCount = Array.isArray(course.exam_sessions)
      ? course.exam_sessions.length
      : 0;

    return {
      ...course,
      enrollmentCount,
      examSessionCount
    };
  }) || [];

  return (
    <div className="space-y-6">
      <CoursesHeader adminRole={adminUser?.role} />
      <CoursesList courses={courses} adminRole={adminUser?.role} />
    </div>
  );
}