import { createSupabaseClientFromRequest } from "@/utils/supabase/server";
import { loadCourseConfiguration } from "@/lib/exam-engine/utils/config-loader";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const client = createSupabaseClientFromRequest(request);
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await context.params;

    // Verify user has access to this course
    const { data: courseAccess } = await client
      .from('user_course_enrollments')
      .select('subscription_status')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('subscription_status', 'active')
      .single();

    if (!courseAccess) {
      return NextResponse.json({ error: "No access to this course" }, { status: 403 });
    }

    // Load course configuration
    const courseConfig = await loadCourseConfiguration(courseId);
    const providers = courseConfig.providers;

    // Get user's exam history for this course
    const { data: examHistory } = await client
      .from('exam_sessions')
      .select(`
        id,
        exam_id,
        provider_id,
        status,
        started_at,
        finished_at,
        time_remaining,
        exam_results (
          total_score,
          section_scores,
          passed,
          detailed_feedback
        )
      `)
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .order('started_at', { ascending: false });

    // Structure the response by provider
    const examsByProvider = Object.entries(providers).map(([providerId, provider]) => {
      const providerExams = provider.examIds.map(examId => {
        const examConfig = courseConfig.examConfigs[examId];
        const userAttempts = examHistory?.filter(h => h.exam_id === examId) || [];
        
        return {
          examId,
          title: examConfig.metadata.title,
          duration: examConfig.metadata.duration,
          totalQuestions: examConfig.metadata.totalQuestions,
          passingScore: examConfig.metadata.passingScore,
          year: examConfig.metadata.year,
          official: examConfig.metadata.officialExam,
          attempts: userAttempts.length,
          bestScore: userAttempts.reduce((best, attempt) => {
            const score = attempt.exam_results?.[0]?.total_score || 0;
            return Math.max(best, score);
          }, 0),
          lastAttempt: userAttempts[0] || null,
          canRetake: true, // TODO: Implement retake logic
          simulatorPath: `/dashboard/${courseConfig.metadata.language}/${courseConfig.metadata.level}/examens/${providerId}/${examId}/simulador`
        };
      });

      return {
        providerId,
        name: provider.name,
        description: provider.description,
        official: provider.official,
        exams: providerExams
      };
    });

    // Course statistics
    const totalAttempts = examHistory?.length || 0;
    const completedExams = examHistory?.filter(h => h.status === 'completed').length || 0;
    const passedExams = examHistory?.filter(h => h.exam_results?.[0]?.passed).length || 0;
    const averageScore = examHistory?.reduce((sum, h) => sum + (h.exam_results?.[0]?.total_score || 0), 0) / Math.max(completedExams, 1);

    return NextResponse.json({
      course: {
        courseId,
        title: courseConfig.metadata.title,
        language: courseConfig.metadata.language,
        level: courseConfig.metadata.level,
        institution: courseConfig.metadata.institution
      },
      providers: examsByProvider,
      statistics: {
        totalAttempts,
        completedExams,
        passedExams,
        averageScore: Math.round(averageScore * 10) / 10,
        passRate: completedExams > 0 ? Math.round((passedExams / completedExams) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Error in course exams API:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" }, 
      { status: 500 }
    );
  }
}