import { createSupabaseClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { UniversalExamSimulator } from "@/components/exam-simulator/universal-exam-simulator";
import type { ExamTemplate, ExamContent } from "@/types/exam-system";

interface ExamSimulatorPageProps {
  params: {
    id: string;
  };
  searchParams: {
    mode?: 'practice' | 'mock_exam' | 'diagnostic' | 'timed_practice';
  };
}

export default async function ExamSimulatorPage({ params, searchParams }: ExamSimulatorPageProps) {
  const { id } = params;
  const { mode = 'practice' } = searchParams;
  const supabase = await createSupabaseClient();

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/signin?redirect=/examenes/' + id + '/practicar');
  }

  // Get exam template with content
  const { data: examData, error } = await supabase
    .from('exam_templates')
    .select(`
      *,
      exam_content(*)
    `)
    .eq('id', id)
    .eq('is_published', true)
    .eq('is_active', true)
    .single();

  if (error || !examData) {
    notFound();
  }

  const exam: ExamTemplate & { content: ExamContent[] } = {
    ...examData,
    content: examData.exam_content || []
  };

  // Check if user has access (could be based on subscription, etc.)
  // For now, we'll allow all authenticated users

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UniversalExamSimulator
        template={exam}
        content={exam.content}
        mode={mode}
        userId={user.id}
      />
    </div>
  );
}