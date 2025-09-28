import { createSupabaseClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import ExamsHeader from "@/components/admin/exams/exams-header";
import ExamsList from "@/components/admin/exams/exams-list";
import type { ExamTemplate } from "@/types/exam-system";

export default async function AdminExamsPage() {
  const supabase = await createSupabaseClient();

  // Get current admin user role
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, active')
    .eq('user_id', user.id)
    .single();

  // Check if user has access to exam management
  if (!adminUser || !adminUser.active || !['super_admin', 'admin', 'course_manager'].includes(adminUser.role)) {
    notFound();
  }

  // Get exam templates with statistics
  const { data: examTemplates, error } = await supabase
    .from('exam_templates')
    .select(`
      *,
      exam_content(count),
      user_exam_attempts(count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching exam templates:', error);
    return (
      <div className="space-y-6">
        <ExamsHeader adminRole={adminUser.role} />
        <div className="text-center py-8 text-red-600">
          Error loading exam templates. Please try again.
        </div>
      </div>
    );
  }

  // Process exam templates data to include statistics
  const exams: (ExamTemplate & { contentCount: number; attemptsCount: number })[] =
    examTemplates?.map(exam => ({
      ...exam,
      contentCount: Array.isArray(exam.exam_content)
        ? exam.exam_content.length
        : 0,
      attemptsCount: Array.isArray(exam.user_exam_attempts)
        ? exam.user_exam_attempts.length
        : 0
    })) || [];

  return (
    <div className="space-y-6">
      <ExamsHeader adminRole={adminUser.role} />
      <ExamsList exams={exams} adminRole={adminUser.role} />
    </div>
  );
}