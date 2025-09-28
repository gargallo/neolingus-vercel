import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import DashboardOverview from "@/components/academia/course-dashboard";
import { CourseContextProvider } from "@/components/academia/course-context-provider";
import { Suspense } from "react";
import Link from "next/link";
import { Play, ArrowLeft, BookOpen, Trophy, Target } from "lucide-react";
import { loadCourseConfiguration } from "@/lib/exam-engine/utils/config-loader";

interface Props {
  params: { idioma: string; nivel: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idioma, nivel } = await params;
  const displayLanguage = getLanguageDisplayName(idioma);
  const displayLevel = nivel.toUpperCase();

  return {
    title: `${displayLanguage} ${displayLevel} - Academia Neolingus`,
    description: `Dashboard del curso de ${displayLanguage} nivel ${displayLevel}. Accede a simuladores, progreso y análisis personalizados.`,
    keywords: [
      displayLanguage,
      displayLevel,
      "dashboard",
      "progreso",
      "exámenes",
      "simuladores",
    ],
    openGraph: {
      title: `${displayLanguage} ${displayLevel} Dashboard - Academia Neolingus`,
      description: `Progresa en tu curso de ${displayLanguage} nivel ${displayLevel}`,
      type: "website",
    },
  };
}

interface Course {
  id: string;
  title: string;
  language: string;
  level: string;
  institution: string;
  description: string;
  cultural_context: string[];
  image_url: string | null;
  exam_providers?: string[];
  total_exams?: number;
}

interface UserCourse {
  course_id: string;
  subscription_status: string;
  access_expires_at: string;
  courses: Course;
}

interface UserProgress {
  course_id: string;
  total_sessions: number;
  average_score: number;
  last_session: string | null;
  achievements_count: number;
  component_progress?: {
    reading?: number;
    writing?: number;
    listening?: number;
    speaking?: number;
  };
  strengths?: string[];
  weaknesses?: string[];
  readiness_score?: number;
  estimated_study_hours?: number;
  target_exam_date?: string | null;
  analytics?: {
    weekly_progress_rate?: number;
    componentAnalysis?: Record<string, any>;
  };
}

interface AvailableExam {
  examId: string;
  title: string;
  providerSlug: string;
  providerName: string;
  duration: number | null;
  difficulty: string | null;
}

interface ProviderOption {
  slug: string;
  name: string;
  description?: string;
  total_exams?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: "exam" | "streak" | "score" | "milestone";
  earned_at: string;
  metadata?: Record<string, any>;
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
  return (
    languageNames[language.toLowerCase()] ||
    language.charAt(0).toUpperCase() + language.slice(1)
  );
}

function isValidLanguage(language: string): boolean {
  const validLanguages = [
    "english",
    "valenciano",
    "spanish",
    "french",
    "german",
    "italian",
    "portuguese",
  ];
  return validLanguages.includes(language.toLowerCase());
}

function isValidLevel(level: string): boolean {
  const validLevels = ["a1", "a2", "b1", "b2", "c1", "c2"];
  return validLevels.includes(level.toLowerCase());
}

// Loading components
function LoadingDashboard() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Modern Header skeleton */}
      <div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-slate-200 to-gray-300 rounded-3xl shadow-lg p-8"
      >
        <div className="flex items-center gap-6 mb-6">
          <div className="w-12 h-12 bg-slate-300 rounded-xl"></div>
          <div className="flex-1">
            <div className="h-10 bg-slate-300 rounded-2xl w-1/2 mb-3"></div>
            <div className="h-4 bg-slate-300 rounded-xl w-3/4"></div>
          </div>
        </div>
      </div>

      {/* Modern Progress cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="relative overflow-hidden bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg p-6"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
            <div className="relative">
              <div className="h-6 bg-slate-300 rounded-xl w-3/4 mb-3"></div>
              <div className="h-8 bg-slate-300 rounded-xl w-1/2 mb-3"></div>
              <div className="h-2 bg-slate-300 rounded-full w-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Modern Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 rounded-3xl shadow-xl border border-blue-100/50 p-8"
        >
          <div className="h-6 bg-slate-300 rounded-xl w-1/3 mb-6"></div>
          <div className="h-64 bg-gradient-to-br from-slate-200 to-gray-300 rounded-2xl"></div>
        </div>
        <div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30 rounded-3xl shadow-xl border border-purple-100/50 p-8"
        >
          <div className="h-6 bg-slate-300 rounded-xl w-1/3 mb-6"></div>
          <div className="h-64 bg-gradient-to-br from-slate-200 to-gray-300 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
}

// Data fetching functions with performance optimizations
async function fetchCourseByLanguageAndLevel(
  client: any,
  language: string,
  level: string
): Promise<Course | null> {
  try {
    // Add request timeout and cache headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/academia/courses/by-language/${language}/${level}`,
      {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${
            (
              await client.auth.getSession()
            ).data.session?.access_token
          }`,
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        console.warn(
          "Course request unauthorized, falling back to demo content"
        );
        return getDemoCourse(language, level);
      }
      const errorText = await response.text();
      console.error("🚨 Course fetch failed:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorBody: errorText,
      });
      throw new Error(
        `Failed to fetch course: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.course || null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Course fetch timeout, using demo data");
    } else {
      console.error("Error fetching course:", error);
    }
    // Return demo data as fallback
    return getDemoCourse(language, level);
  }
}

async function fetchUserCourseProgress(
  client: any,
  userId: string,
  courseId: string
): Promise<UserProgress | null> {
  try {
    // Add request timeout and performance optimizations
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/academia/progress/${courseId}`,
      {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${
            (
              await client.auth.getSession()
            ).data.session?.access_token
          }`,
          "Cache-Control": "public, max-age=60", // Cache for 1 minute (progress changes more frequently)
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        console.warn("Progress request unauthorized, using demo progress data");
        return null; // Will be handled by the calling function
      }
      const errorText = await response.text();
      console.error("🚨 Progress fetch failed:", {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorBody: errorText,
      });
      throw new Error(
        `Failed to fetch progress: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.progress || null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Progress fetch timeout, using demo data");
    } else {
      console.error("Error fetching progress:", error);
    }
    // Extract language and level from courseId for demo progress
    const [language, level] = courseId.split("_");
    return getDemoProgress(language, level);
  }
}

async function fetchCourseAchievements(
  client: any,
  userId: string,
  courseId: string
): Promise<Achievement[]> {
  // For now, return demo achievements
  // TODO: Implement real achievements API
  return [
    {
      id: "course_start",
      title: "¡Buen Comienzo!",
      description: "Has comenzado tu curso",
      type: "milestone",
      earned_at: new Date().toISOString(),
    },
    {
      id: "first_exam",
      title: "Primer Examen",
      description: "Has completado tu primer simulacro",
      type: "exam",
      earned_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "score_80",
      title: "Puntuación Alta",
      description: "Has obtenido más del 80% en un examen",
      type: "score",
      earned_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function getDemoCourse(language: string, level: string): Course {
  const displayLanguage = getLanguageDisplayName(language);
  const displayLevel = level.toUpperCase();

  const courseData: Record<string, Record<string, Partial<Course>>> = {
    english: {
      b2: {
        title: "English B2 First",
        institution: "Cambridge English / EOI",
        description:
          "Preparation for Cambridge B2 First and EOI B2 examinations",
        cultural_context: [
          "Work situations",
          "Academic contexts",
          "Complex topics",
        ],
        exam_providers: ["cambridge", "eoi"],
        total_exams: 22,
      },
      c1: {
        title: "English C1 Advanced",
        institution: "Cambridge English / EOI",
        description:
          "Preparation for Cambridge C1 Advanced and EOI C1 examinations",
        cultural_context: [
          "Professional communication",
          "Academic writing",
          "Complex arguments",
        ],
        exam_providers: ["cambridge", "eoi"],
        total_exams: 25,
      },
    },
    valenciano: {
      c1: {
        title: "Valencià C1",
        institution: "EOI / CIEACOVA",
        description:
          "Preparació per als exàmens oficials de valencià nivell C1",
        cultural_context: [
          "Literatura valenciana",
          "Tradicions valencianes",
          "Història del País Valencià",
        ],
        exam_providers: ["eoi", "cieacova"],
        total_exams: 15,
      },
    },
  };

  const specificData =
    courseData[language.toLowerCase()]?.[level.toLowerCase()] || {};

  return {
    id: `${language}_${level}`,
    title: specificData.title || `${displayLanguage} ${displayLevel}`,
    language: language,
    level: level,
    institution: specificData.institution || "EOI",
    description:
      specificData.description ||
      `Preparación para el nivel ${displayLevel} de ${displayLanguage}`,
    cultural_context: specificData.cultural_context || ["Contextos generales"],
    image_url: null,
    exam_providers: specificData.exam_providers || ["eoi"],
    total_exams: specificData.total_exams || 10,
  };
}

function getDemoProgress(language: string, level: string): UserProgress {
  return {
    course_id: `${language}_${level}`,
    total_sessions: Math.floor(Math.random() * 30) + 10,
    average_score: Math.floor(Math.random() * 30) + 65,
    last_session: new Date(
      Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000
    ).toISOString(),
    achievements_count: Math.floor(Math.random() * 5) + 3,
    component_progress: {
      reading: Math.random() * 0.4 + 0.6,
      writing: Math.random() * 0.3 + 0.5,
      listening: Math.random() * 0.4 + 0.5,
      speaking: Math.random() * 0.3 + 0.4,
    },
    strengths: ["Comprensión lectora", "Vocabulario"],
    weaknesses: ["Expresión oral", "Gramática compleja"],
    readiness_score: Math.random() * 0.3 + 0.6,
    estimated_study_hours: Math.floor(Math.random() * 50) + 20,
    target_exam_date: new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ).toISOString(),
  };
}

// Server Components for data fetching
async function CourseDashboardSection({
  language,
  level,
  userId,
  client,
}: {
  language: string;
  level: string;
  userId: string;
  client: any;
}) {
  // Fetch course first to get the real course ID
  const course = await fetchCourseByLanguageAndLevel(client, language, level);

  // Use the actual course ID if available, otherwise fall back to constructed ID
  const courseId = course?.id || `${language}_${level}`;

  // Load course configuration first to ensure we have provider data
  let courseConfig = null;
  try {
    courseConfig = await loadCourseConfiguration(`${language}_${level}`);
  } catch (error) {
    console.error("Failed to load course configuration for dashboard:", error);
    // Create minimal fallback config
    courseConfig = {
      courseId: `${language}_${level}`,
      language,
      level,
      providers: {},
      examConfigs: {},
    };
  }

  const [progress, achievements] = await Promise.all([
    fetchUserCourseProgress(client, userId, courseId).catch((error) => {
      console.warn("Failed to fetch progress, using demo data:", error);
      return getDemoProgress(language, level);
    }),
    fetchCourseAchievements(client, userId, courseId),
  ]);

  // Transform course configuration into available exams with better error handling
  const availableExams: AvailableExam[] = [];

  if (courseConfig && courseConfig.providers) {
    try {
      const transformedExams = Object.entries(courseConfig.providers).flatMap(
        ([providerSlug, provider]: [string, any]) => {
          if (!provider || typeof provider !== "object") {
            console.warn(`Invalid provider data for ${providerSlug}`);
            return [];
          }

          const examIds = Array.isArray(provider.examIds)
            ? provider.examIds
            : [];
          return examIds.map((examId: string) => {
            const examMeta = courseConfig?.examConfigs?.[examId];
            return {
              providerSlug,
              providerName: provider.name || providerSlug.toUpperCase(),
              examId,
              title: examMeta?.metadata?.title || examId.replace(/_/g, " "),
              duration: examMeta?.metadata?.duration ?? null,
              difficulty: examMeta?.metadata?.officialExam
                ? "official"
                : "practice",
            };
          });
        }
      );

      availableExams.push(...transformedExams);
    } catch (error) {
      console.error("Error transforming course configuration:", error);
    }
  }

  // Determine provider information
  const providerFallback =
    Array.isArray(course?.exam_providers) && course.exam_providers.length > 0
      ? String(course.exam_providers[0]).toLowerCase().replace(/\s+/g, "-")
      : "eoi";

  const defaultProvider = availableExams[0]?.providerSlug || providerFallback;
  const defaultProviderName =
    availableExams.find((exam) => exam.providerSlug === defaultProvider)
      ?.providerName ||
    course?.institution?.split("/")?.[0]?.trim() ||
    defaultProvider.toUpperCase();

  // Determine exam components
  const componentKeys = progress?.component_progress
    ? Object.keys(progress.component_progress)
    : [];
  const examComponents =
    componentKeys.length > 0
      ? componentKeys
      : ["reading", "writing", "listening", "speaking"];

  if (!course) {
    return (
      <div className="text-center py-16">
        <div className="relative overflow-hidden bg-gradient-to-br from-red-50 via-pink-50/50 to-rose-50/30 rounded-3xl shadow-xl border border-red-100/50 p-12 max-w-md mx-auto">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-gradient-to-br from-red-400/10 to-pink-400/10 rounded-full blur-2xl"></div>

          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center border border-red-200/50">
              <BookOpen className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Curso no encontrado
            </h3>
            <p className="text-gray-600 leading-relaxed mb-8">
              El curso solicitado no está disponible o no tienes acceso a él.
            </p>
            <Link
              href={`/dashboard/${language}`}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver a {getLanguageDisplayName(language)}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Transform progress data to match DashboardOverview interface
  const transformedProgressData = progress
    ? {
        overallProgress: progress.readiness_score
          ? progress.readiness_score * 100
          : 0,
        recentActivity: [
          {
            id: "recent-1",
            type: "exam",
            examTitle: "Practice Exam",
            score: progress.average_score,
            duration: 120,
            date: progress.last_session
              ? new Date(progress.last_session)
              : new Date(),
          },
        ],
        weeklyStats: {
          sessionsCompleted: progress.total_sessions || 0,
          hoursStudied: progress.estimated_study_hours || 0,
          averageScore: progress.average_score || 0,
          improvement: 5.2, // Mock improvement data
        },
      }
    : null;

  return (
    <CourseContextProvider courseConfig={courseConfig} userId={userId}>
      <div className="space-y-8">
        {/* Course Dashboard with proper context */}
        <DashboardOverview
          courseData={{
            id: course.id,
            language: course.language,
            level: course.level,
            title: course.title,
            description: course.description,
            provider: defaultProvider,
            providerName: defaultProviderName,
            totalExams: availableExams.length,
            completedExams: progress?.total_sessions || 0,
            averageScore: progress?.average_score || 0,
            timeSpent: progress?.estimated_study_hours || 0,
            lastActivity: progress?.last_session
              ? new Date(progress.last_session)
              : null,
          }}
          progressData={transformedProgressData}
          isLoading={false}
          error={null}
        />
      </div>
    </CourseContextProvider>
  );
}

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <div className="w-full">{children}</div>;
}

export default async function CoursePage({ params }: Props) {
  const { idioma, nivel } = await params;

  // Validate parameters
  if (!isValidLanguage(idioma) || !isValidLevel(nivel)) {
    notFound();
  }

  // TEMPORARY: Skip authentication check to test provider selection
  const client = await createSupabaseClient();
  // const {
  //   data: { user },
  // } = await client.auth.getUser();

  // if (!user) {
  //   return redirect("/sign-in");
  // }

  // Mock user for demo
  const user = {
    id: "demo-user-123",
    email: "demo@neolingus.com",
  };

  const displayLanguage = getLanguageDisplayName(idioma);
  const displayLevel = nivel.toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <main className="container mx-auto px-4 py-8">
        {/* Modern Header Section */}
        <div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl shadow-2xl mb-12"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)] opacity-20"></div>
          <div className="absolute top-0 right-0 -mt-8 -mr-16 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-16 w-48 h-48 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-2xl"></div>

          <div className="relative p-8 md:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="flex items-start gap-6">
                <div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Link
                    href={`/dashboard/${idioma}`}
                    className="group inline-flex items-center justify-center p-3 text-white/80 hover:text-white rounded-2xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/20 hover:border-white/40"
                  >
                    <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="flex-1">
                  <div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex items-center gap-3 mb-4"
                  >
                    <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <Trophy className="h-8 w-8 text-yellow-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                      {displayLanguage} {displayLevel}
                    </h1>
                  </div>

                  <p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-2xl"
                  >
                    Panel de control completo para tu curso de {displayLanguage}{" "}
                    nivel {displayLevel}. Accede a simuladores, análisis de
                    progreso y recursos personalizados.
                  </p>

                  <div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex items-center gap-3 mt-6"
                  >
                    <div className="bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-xl px-4 py-2 text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Nivel {displayLevel}
                    </div>
                    <div className="bg-gradient-to-r from-blue-400 to-indigo-400 text-white border-0 rounded-xl px-4 py-2 shadow-lg text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {displayLanguage}
                    </div>
                  </div>
                </div>
              </div>

              <div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="flex-shrink-0"
              >
                <Link
                  href={`/dashboard/${idioma}/${nivel}/examens`}
                  className="group inline-flex items-center px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-2xl hover:bg-white/30 transition-all duration-300 font-bold shadow-lg hover:shadow-xl border border-white/30 hover:scale-105 transform"
                >
                  <Play className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform" />
                  <span>Acceder a Exámenes</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Error Boundary */}
        <ErrorBoundary>
          <CourseDashboardSection
            language={idioma}
            level={nivel}
            userId={user.id}
            client={client}
          />
        </ErrorBoundary>

        {/* Modern Breadcrumb Navigation */}
        <nav
          className="mt-12 pt-8 border-t border-slate-200/50"
          aria-label="Breadcrumb"
        >
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/50">
            <ol className="flex items-center space-x-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
                >
                  Academia
                </Link>
              </li>
              <li>
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li>
                <Link
                  href={`/dashboard/${idioma}`}
                  className="text-slate-600 hover:text-blue-600 transition-colors font-medium"
                >
                  {displayLanguage}
                </Link>
              </li>
              <li>
                <svg
                  className="w-4 h-4 text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </li>
              <li>
                <span className="text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-lg">
                  {displayLevel}
                </span>
              </li>
            </ol>
          </div>
        </nav>
      </main>
    </div>
  );
}

// Generate static params for common courses
export async function generateStaticParams() {
  const languages = ["english", "valenciano"];
  const levels = ["a2", "b1", "b2", "c1"];

  const params = [];
  for (const idioma of languages) {
    for (const nivel of levels) {
      params.push({ idioma, nivel });
    }
  }

  return params;
}

// 404 page for invalid courses
export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 rounded-3xl shadow-2xl border border-blue-100/50 p-12 text-center"
        >
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl"></div>

          <div className="relative">
            <div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-blue-200/50"
            >
              <BookOpen className="w-10 h-10 text-blue-500" />
            </div>

            <h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-2xl font-bold text-gray-900 mb-4"
            >
              Curso no encontrado
            </h2>

            <p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-gray-600 leading-relaxed mb-8"
            >
              Lo sentimos, el curso que buscas no está disponible o no tienes
              acceso a él.
            </p>

            <div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver a Academia
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
