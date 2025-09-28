import { ExamensSection } from "@/components/academia/examens/examens-section";
import { CourseLayoutWrapper } from "@/components/academia/course-layout-wrapper";
import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  fetchCoursesByLanguage,
  type ResolvedCourse,
} from "@/lib/academia/course-data";

interface ExamensPageProps {
  params: {
    idioma: string;
    nivel: string;
  };
}

type SessionData = {
  exam_id?: string;
  examId?: string;
  provider_id?: string;
  provider?: string;
  exam_provider?: string;
  section_scores?: Record<string, number>;
  sections?: Record<string, number>;
  passed?: boolean;
  result?: { passed?: boolean };
  time_remaining?: number;
  [key: string]: unknown;
};

interface ExamSessionRow {
  id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  score: number | null;
  session_type: string;
  component: string;
  session_data: SessionData | null;
  is_completed: boolean | null;
  created_at?: string;
  updated_at?: string;
}

function normalizeScore(score: number | null): number | undefined {
  if (typeof score !== 'number') {
    return undefined;
  }

  if (score <= 1) {
    return Math.round(score * 100);
  }

  return Math.round(score);
}

function mapSessionToExamAttempt(
  session: ExamSessionRow,
  course: ResolvedCourse | undefined
) {
  const sessionData: SessionData = session.session_data && typeof session.session_data === 'object'
    ? session.session_data
    : {};

  const rawExamId = sessionData.exam_id || sessionData.examId;
  const rawProviderId = sessionData.provider_id || sessionData.provider || sessionData.exam_provider;

  let examId = typeof rawExamId === 'string' ? rawExamId : undefined;
  let providerId = typeof rawProviderId === 'string' ? rawProviderId : undefined;

  if (!providerId && course?.config) {
    const providerKeys = Object.keys(course.config.providers || {});
    providerId = providerKeys.length === 1 ? providerKeys[0] : undefined;
  }

  if (!examId && providerId && course?.config) {
    const providerExams = course.config.providers?.[providerId]?.examIds || [];
    if (providerExams.length === 1) {
      examId = providerExams[0];
    }
  }

  const normalizedScore = normalizeScore(session.score);
  const sectionScores = sessionData.section_scores || sessionData.sections || {};

  const passedFromData = sessionData.passed ?? sessionData.result?.passed;
  const passed = typeof passedFromData === 'boolean'
    ? passedFromData
    : normalizedScore !== undefined
      ? normalizedScore >= 60
      : undefined;

  const examResults = Array.isArray(sessionData.exam_results)
    ? sessionData.exam_results
    : normalizedScore !== undefined
      ? [{
          total_score: normalizedScore,
          section_scores: sectionScores,
          passed: passed ?? false,
        }]
      : undefined;

  return {
    id: session.id,
    exam_id: examId,
    provider_id: providerId,
    status: session.is_completed || session.completed_at ? 'completed' : 'in_progress',
    score: normalizedScore,
    started_at: session.started_at,
    finished_at: session.completed_at || undefined,
    time_remaining: sessionData.time_remaining ?? undefined,
    is_completed: Boolean(session.is_completed || session.completed_at),
    passed,
    component: session.component,
    exam_results: examResults,
  };
}

export default async function ExamensPage({ params }: ExamensPageProps) {
  const { idioma, nivel } = await params;
  const courseSlug = `${idioma}_${nivel.toLowerCase()}`;

  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const resolvedCourses = await fetchCoursesByLanguage(client, idioma);
  const course = resolvedCourses.find((entry) => entry.id === courseSlug);
  const courseDbId = course?.dbId;

  let examHistory: ReturnType<typeof mapSessionToExamAttempt>[] = [];

  if (courseDbId) {
    const { data: sessions, error } = await client
      .from('exam_sessions')
      .select('id, started_at, completed_at, duration_seconds, score, session_type, component, session_data, is_completed, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('course_id', courseDbId)
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[examens/page] Failed to load exam sessions', { error, userId: user.id, courseDbId });
    } else if (sessions) {
      examHistory = sessions.map((session: ExamSessionRow) => mapSessionToExamAttempt(session, course));
    }
  }

  const layoutUser = {
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata || {},
  };

  return (
    <CourseLayoutWrapper user={layoutUser} language={idioma} level={nivel}>
      <ExamensSection examHistory={examHistory} />
    </CourseLayoutWrapper>
  );
}
