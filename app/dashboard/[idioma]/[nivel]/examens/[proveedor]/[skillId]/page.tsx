import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { CourseLayoutWrapper } from "@/components/academia/course-layout-wrapper";
import { getSkillById } from "@/components/academia/examens/skill-definitions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Clock,
  Brain,
  Target,
  Play,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Star,
  Award
} from "lucide-react";
import { createSupabaseClient } from "@/utils/supabase/server";
import { fetchCoursesByLanguage } from "@/lib/academia/course-data";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/types/database";

interface SkillPageProps {
  params: {
    idioma: string;
    nivel: string;
    proveedor: string;
    skillId: string;
  };
}

interface SkillProgressSummary {
  completedSessions: number;
  totalSessions: number;
  averageScore: number;
  bestScore: number;
  timeSpent: number;
  streak: number;
  lastPracticed: Date | null;
}

export async function generateMetadata({ params }: SkillPageProps): Promise<Metadata> {
  const { idioma, nivel, proveedor, skillId } = await params;
  const skill = getSkillById(proveedor, skillId);

  if (!skill) {
    return {
      title: "Skill not found - Academia Neolingus",
    };
  }

  const displayLanguage = getLanguageDisplayName(idioma);
  const displayLevel = nivel.toUpperCase();
  const displayProvider = getProviderDisplayName(proveedor);

  return {
    title: `${skill.name} - ${displayProvider} ${displayLanguage} ${displayLevel} - Academia Neolingus`,
    description: `Practica ${skill.name} para el examen ${displayProvider} de ${displayLanguage} nivel ${displayLevel}. ${skill.description}`,
    keywords: [displayLanguage, displayLevel, displayProvider, skill.name, "examen", "práctica", "simulador"],
    openGraph: {
      title: `${skill.name} - ${displayProvider}`,
      description: skill.description,
      type: "website",
    },
  };
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

function normalizeScore(score: number | null): number | null {
  if (typeof score !== 'number') {
    return null;
  }
  return score <= 1 ? Math.round(score * 100) : Math.round(score);
}

function buildSkillExamId(provider: string, language: string, level: string, skillId: string): string {
  return [provider.toLowerCase(), language.toLowerCase(), level.toLowerCase(), skillId].join('_');
}

type SkillSessionData = {
  skill_id?: string;
  skillId?: string;
  component_id?: string;
  [key: string]: unknown;
};

interface SkillSessionRow {
  id: string;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  score: number | null;
  session_data: SkillSessionData | null;
  is_completed: boolean | null;
  component: string | null;
}

function matchesSkill(session: SkillSessionRow, skillId: string): boolean {
  const sessionData: SkillSessionData = session.session_data && typeof session.session_data === 'object'
    ? session.session_data
    : {};

  // Check skill_id, skillId, or component_id in session data
  const skillFromData = sessionData.skill_id || sessionData.skillId || sessionData.component_id;
  if (typeof skillFromData === 'string' && skillFromData === skillId) {
    return true;
  }

  // Check component field directly (exact match first)
  if (session.component && typeof session.component === 'string') {
    if (session.component === skillId) {
      return true;
    }
    // Fallback: check if component contains skillId or vice versa
    return (
      skillId.toLowerCase().includes(session.component.toLowerCase()) ||
      session.component.toLowerCase().includes(skillId.toLowerCase())
    );
  }

  return false;
}

async function fetchSkillProgress(
  client: SupabaseClient<Database>,
  userId: string,
  courseDbId: string,
  skillId: string
): Promise<SkillProgressSummary> {
  const { data: sessions, error } = await client
    .from('exam_sessions')
    .select('id, started_at, completed_at, duration_seconds, score, session_data, is_completed, component')
    .eq('user_id', userId)
    .eq('course_id', courseDbId)
    .order('started_at', { ascending: false })
    .limit(100)
    .returns<SkillSessionRow[]>();

  if (error || !sessions) {
    if (error) {
      console.error('[skill/page] Failed to fetch sessions', { error, userId, courseDbId });
    }
    return {
      completedSessions: 0,
      totalSessions: 0,
      averageScore: 0,
      bestScore: 0,
      timeSpent: 0,
      streak: 0,
      lastPracticed: null,
    };
  }

  const skillSessions = sessions.filter((session) => matchesSkill(session, skillId));

  if (!skillSessions.length) {
    return {
      completedSessions: 0,
      totalSessions: 0,
      averageScore: 0,
      bestScore: 0,
      timeSpent: 0,
      streak: 0,
      lastPracticed: null,
    };
  }

  let completedSessions = 0;
  let scoreAccumulator = 0;
  let scoredSessions = 0;
  let bestScore = 0;
  let timeSpent = 0;
  let streak = 0;
  let streakRunning = true;
  let lastPracticed: Date | null = null;

  for (const session of skillSessions) {
    const normalizedScore = normalizeScore(session.score);
    const isCompleted = session.is_completed || session.completed_at;

    if (!lastPracticed || (session.started_at && session.started_at > lastPracticed.toISOString())) {
      lastPracticed = session.started_at ? new Date(session.started_at) : lastPracticed;
    }

    timeSpent += Math.max(Math.round((session.duration_seconds || 0) / 60), 0);

    if (isCompleted) {
      completedSessions += 1;
    }

    if (typeof normalizedScore === 'number') {
      scoreAccumulator += normalizedScore;
      scoredSessions += 1;
      if (normalizedScore > bestScore) {
        bestScore = normalizedScore;
      }
    }

    if (streakRunning) {
      const passed = typeof normalizedScore === 'number' ? normalizedScore >= 60 : false;
      if (isCompleted && passed) {
        streak += 1;
      } else if (isCompleted) {
        streakRunning = false;
      }
    }
  }

  const averageScore = scoredSessions > 0 ? Math.round(scoreAccumulator / scoredSessions) : 0;

  return {
    completedSessions,
    totalSessions: skillSessions.length,
    averageScore,
    bestScore,
    timeSpent,
    streak,
    lastPracticed,
  };
}

export default async function SkillPage({ params }: SkillPageProps) {
  const { idioma, nivel, proveedor, skillId } = await params;

  const skill = getSkillById(proveedor, skillId);

  if (!skill) {
    notFound();
  }

  const computedExamId = buildSkillExamId(proveedor, idioma, nivel, skillId);

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

  const progress = await fetchSkillProgress(client, user.id, course.dbId, skillId);
  const progressPercentage = progress.totalSessions > 0
    ? Math.round((progress.completedSessions / progress.totalSessions) * 100)
    : 0;

  const displayLanguage = getLanguageDisplayName(idioma);
  const displayLevel = nivel.toUpperCase();
  const displayProvider = getProviderDisplayName(proveedor);

  const layoutUser = {
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata || {},
  };

  const SkillIcon = skill.icon;

  return (
    <CourseLayoutWrapper user={layoutUser} language={idioma} level={nivel}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20 p-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
            <Link
              href={`/dashboard/${idioma}/${nivel}`}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Academia
            </Link>
            <span>/</span>
            <Link
              href={`/dashboard/${idioma}/${nivel}/examens`}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Exámenes
            </Link>
            <span>/</span>
            <Link
              href={`/dashboard/${idioma}/${nivel}/examens/${proveedor}`}
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {displayProvider}
            </Link>
            <span>/</span>
            <span className="text-slate-900 dark:text-white font-medium">{skill.name}</span>
          </div>

          <Link
            href={`/dashboard/${idioma}/${nivel}/examens/${proveedor}`}
            className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a {displayProvider}
          </Link>
        </div>

        {/* Skill Header */}
        <div className="mb-12">
          <div className="flex items-start gap-6 mb-6">
            <div className={`p-6 rounded-3xl bg-gradient-to-br ${skill.color} shadow-2xl shadow-slate-500/20`}>
              <SkillIcon className="w-16 h-16 text-white" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                  {skill.name}
                </h1>
                <Badge className={`bg-gradient-to-r ${skill.color} text-white border-0 shadow-lg px-4 py-2 text-sm`}>
                  {skill.difficulty}
                </Badge>
              </div>

              <p className="text-xl text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                {skill.description}
              </p>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    Duración: {skill.estimatedTime}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-slate-500" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {displayProvider} {displayLanguage} {displayLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Progreso en esta competencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Sesiones completadas</span>
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                      {progress.completedSessions} / {progress.totalSessions}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-slate-50 dark:bg-slate-900/50 border-0 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Brain className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Media de puntuación</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">{progress.averageScore}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-50 dark:bg-slate-900/50 border-0 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Mejor puntuación</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">{progress.bestScore}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-50 dark:bg-slate-900/50 border-0 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Racha</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">{progress.streak} ✅</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-slate-50 dark:bg-slate-900/50 border-0 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Tiempo dedicado</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">{progress.timeSpent} min</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-50 dark:bg-slate-900/50 border-0 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Última práctica</p>
                          <p className="text-lg font-semibold text-slate-900 dark:text-white">
                            {progress.lastPracticed ? progress.lastPracticed.toLocaleDateString() : 'Pendiente'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button asChild className="w-full h-12" variant="default">
                  <Link href={`/dashboard/${idioma}/${nivel}/examens/${proveedor}/${skillId}/simulador?examId=${computedExamId}`}>
                    <Play className="w-5 h-5 mr-2" />
                    Iniciar práctica de {skill.name}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                  Competencia {skill.difficulty}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {displayProvider}
                  </Badge>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    {displayLanguage} {displayLevel}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Temas principales</h3>
                  <ul className="space-y-2">
                    {skill.topics.map((topic) => (
                      <li key={topic} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Consejo rápido</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Practica en sesiones cortas y mide tu progreso regularmente para alcanzar un nivel experto en {skill.name.toLowerCase()}.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CourseLayoutWrapper>
  );
}
