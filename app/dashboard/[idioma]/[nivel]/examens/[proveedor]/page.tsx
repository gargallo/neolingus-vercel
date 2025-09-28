import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { CourseLayoutWrapper } from "@/components/academia/course-layout-wrapper";
import { ProviderExamsList } from "@/components/academia/examens/provider-exams-list";
import Link from "next/link";
import { fetchCoursesByLanguage } from "@/lib/academia/course-data";
import type { ExamConfiguration } from "@/lib/exam-engine/types/exam-config";

interface Props {
  params: { idioma: string; nivel: string; proveedor: string };
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  total_questions: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  exam_type: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

interface ExamAttempt {
  id: string;
  exam_id: string;
  user_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  time_spent: number;
  status: "in_progress" | "completed" | "abandoned";
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
  session_data: SessionData | null;
  is_completed: boolean | null;
  component: string | null;
}

interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  official: boolean;
  website: string | null;
  logo_url: string | null;
}

function getLanguageDisplayName(language: string): string {
  const languageNames: Record<string, string> = {
    english: "Inglés",
    valenciano: "Valenciano",
    spanish: "Español",
    french: "Francés",
    german: "Alemán",
    italian: "Italiano",
    portuguese: "Portugués",
  };
  return languageNames[language.toLowerCase()] || language.charAt(0).toUpperCase() + language.slice(1);
}

function getProviderDisplayName(provider: string): string {
  const providerNames: Record<string, string> = {
    cambridge: "Cambridge English",
    eoi: "EOI",
    cieacova: "CIEACOVA",
    jqcv: "JQCV",
    dele: "DELE",
    delf: "DELF",
    goethe: "Goethe Institut",
  };
  return providerNames[provider.toLowerCase()] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

function isValidLanguage(language: string): boolean {
  const validLanguages = ["english", "valenciano", "spanish", "french", "german", "italian", "portuguese"];
  return validLanguages.includes(language.toLowerCase());
}

function isValidLevel(level: string): boolean {
  const validLevels = ["a1", "a2", "b1", "b2", "c1", "c2"];
  return validLevels.includes(level.toLowerCase());
}

function isValidProvider(provider: string): boolean {
  const validProviders = ["cambridge", "eoi", "cieacova", "jqcv", "dele", "delf", "goethe"];
  return validProviders.includes(provider.toLowerCase());
}

function normalizeScore(score: number | null): number | null {
  if (typeof score !== 'number') {
    return null;
  }
  return score <= 1 ? Math.round(score * 100) : Math.round(score);
}

function mapExamConfigToExam(examConfig: ExamConfiguration, providerId: string): Exam {
  const metadata = examConfig.metadata || {};
  const structureSections = (() => {
    const structure = (examConfig as { structure?: { sections?: unknown } }).structure;
    if (structure && Array.isArray(structure.sections)) {
      return structure.sections as Array<{ duration?: number; questions?: number }>;
    }
    // Some configurations use `sections` at the top level instead of `structure`
    if (Array.isArray((examConfig as { sections?: unknown }).sections)) {
      return (examConfig as { sections: Array<{ duration?: number; questions?: number }> }).sections;
    }
    return [] as Array<{ duration?: number; questions?: number }>;
  })();

  const duration = metadata.duration || structureSections.reduce((total, section) => total + (section.duration || 0), 0);
  const totalQuestions = metadata.totalQuestions || structureSections.reduce((total, section) => total + (section.questions || 0), 0);

  const difficulty = (metadata.difficulty || 'intermediate') as Exam['difficulty'];

  return {
    id: examConfig.examId,
    title: metadata.title || examConfig.examId,
    description: metadata.description || 'Examen oficial preparado conforme a la certificación vigente.',
    duration,
    total_questions: totalQuestions,
    difficulty,
    exam_type: metadata.examType || 'complete',
    provider: metadata.provider || providerId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function mapSessionsToAttempts(
  sessions: ExamSessionRow[],
  providerId: string,
  fallbackExamIds: string[],
  userId: string
): ExamAttempt[] {
  const primaryExamId = fallbackExamIds[0];

  return sessions.map((session) => {
    const sessionData: SessionData = session.session_data && typeof session.session_data === 'object'
      ? session.session_data
      : {};

    const rawExamId = sessionData.exam_id || sessionData.examId;
    let examId = typeof rawExamId === 'string' ? rawExamId : undefined;

    if (!examId && sessionData.provider_id && typeof sessionData.provider_id === 'string') {
      examId = fallbackExamIds.find((id) => id.includes(sessionData.provider_id)) || examId;
    }

    if (!examId) {
      examId = primaryExamId || `${providerId}_practice`;
    }

    return {
      id: session.id,
      exam_id: examId,
      user_id: userId,
      started_at: session.started_at,
      completed_at: session.completed_at,
      score: normalizeScore(session.score),
      time_spent: Math.max(Math.round((session.duration_seconds || 0) / 60), 0),
      status: session.is_completed || session.completed_at ? 'completed' : 'in_progress',
    };
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idioma, nivel, proveedor } = await params;
  const displayLanguage = getLanguageDisplayName(idioma);
  const displayLevel = nivel.toUpperCase();
  const displayProvider = getProviderDisplayName(proveedor);
  
  return {
    title: `${displayProvider} - ${displayLanguage} ${displayLevel} - Academia Neolingus`,
    description: `Simuladores de examen ${displayProvider} para ${displayLanguage} nivel ${displayLevel}. Practica con exámenes oficiales.`,
    keywords: [displayLanguage, displayLevel, displayProvider, "exámenes", "simuladores", "preparación"],
    openGraph: {
      title: `Exámenes ${displayProvider} - ${displayLanguage} ${displayLevel}`,
      description: `Practica con simuladores oficiales de ${displayProvider}`,
      type: "website",
    },
  };
}

export default async function ProviderExamPage({ params }: Props) {
  const { idioma, nivel, proveedor } = await params;

  if (!isValidLanguage(idioma) || !isValidLevel(nivel) || !isValidProvider(proveedor)) {
    notFound();
  }

  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  const courseSlug = `${idioma}_${nivel.toLowerCase()}`;
  const resolvedCourses = await fetchCoursesByLanguage(client, idioma);
  const course = resolvedCourses.find((entry) => entry.id === courseSlug);

  if (!course) {
    notFound();
  }

  const providerConfig = course.config?.providers?.[proveedor];

  if (!providerConfig) {
    notFound();
  }

  const providerExamIds = providerConfig.examIds || [];
  const exams: Exam[] = providerExamIds
    .map((examId) => course.config?.examConfigs?.[examId])
    .filter((config): config is ExamConfiguration => Boolean(config))
    .map((config) => mapExamConfigToExam(config, proveedor));

  const website = typeof (providerConfig as { website?: unknown }).website === 'string'
    ? (providerConfig as { website: string }).website
    : null;
  const logoUrl = typeof (providerConfig as { logo_url?: unknown }).logo_url === 'string'
    ? (providerConfig as { logo_url: string }).logo_url
    : null;

  const providerInfo: ProviderInfo = {
    id: proveedor,
    name: providerConfig.name || getProviderDisplayName(proveedor),
    description: providerConfig.description || `Simuladores oficiales de ${getProviderDisplayName(proveedor)} nivel ${nivel.toUpperCase()}.`,
    official: providerConfig.official ?? true,
    website,
    logo_url: logoUrl,
  };

  let examAttempts: ExamAttempt[] = [];

  if (course.dbId) {
    const { data: sessions, error } = await client
      .from('exam_sessions')
      .select('id, started_at, completed_at, duration_seconds, score, session_data, is_completed, component')
      .eq('user_id', user.id)
      .eq('course_id', course.dbId)
      .order('started_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[provider/page] Failed to fetch exam sessions', { error, userId: user.id, courseId: course.dbId });
    } else if (sessions) {
      const filteredSessions = sessions.filter((session) => {
        const sessionData = session.session_data && typeof session.session_data === 'object'
          ? session.session_data
          : {};
        const providerFromSession = sessionData.provider_id || sessionData.provider || sessionData.exam_provider;
        return !providerFromSession || providerFromSession === proveedor;
      });

      examAttempts = mapSessionsToAttempts(filteredSessions, proveedor, providerExamIds, user.id);
    }
  }

  const layoutUser = {
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata || {},
  };

  return (
    <CourseLayoutWrapper user={layoutUser} language={idioma} level={nivel}>
      <div className="space-y-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link href={`/dashboard/${idioma}/${nivel}`} className="hover:text-slate-700 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link href={`/dashboard/${idioma}/${nivel}/examens`} className="hover:text-slate-700 transition-colors">
            Exámenes
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-medium">{providerInfo.name}</span>
        </nav>

        <ProviderExamsList
          exams={exams}
          provider={providerInfo}
          examAttempts={examAttempts}
          courseId={courseSlug}
        />
      </div>
    </CourseLayoutWrapper>
  );
}
