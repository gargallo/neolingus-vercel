import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { CourseSelection } from "@/components/academia/course-selection";
import { ProgressAnalytics } from "@/components/academia/progress-analytics";
import {
  fetchCoursesByLanguage,
  fetchUserCourseEnrollments,
  fetchCourseProgressSummaries,
  type ResolvedCourse,
} from "@/lib/academia/course-data";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/types/database";
import Link from "next/link";

interface Props {
  params: { idioma: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { idioma: language } = await params;
  const displayName = getLanguageDisplayName(language);
  
  return {
    title: `${displayName} - Academia Neolingus`,
    description: `Cursos de ${displayName}. Prepárate para tus exámenes oficiales con simuladores y contenido personalizado.`,
    keywords: [displayName, "exámenes", "preparación", "cursos", "idiomas"],
    openGraph: {
      title: `Cursos de ${displayName} - Academia Neolingus`,
      description: `Prepárate para aprobar tus exámenes oficiales de ${displayName}`,
      type: "website",
    },
  };
}

interface Course {
  id: string;
  db_id?: string;
  title: string;
  language: string;
  level: string;
  institution: string;
  description: string;
  cultural_context: string[];
  image_url: string | null;
  exam_providers?: string[];
  total_exams?: number;
  config?: ResolvedCourse['config'];
}

interface UserCourse {
  course_id: string;
  course_slug?: string;
  subscription_status: string;
  access_expires_at: string | null;
  courses: Course;
}

interface UserProgress {
  course_id: string;
  total_sessions: number;
  average_score: number;
  last_session: string | null;
  achievements_count: number;
  pass_rate?: number;
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

function isValidLanguage(language: string): boolean {
  const validLanguages = ["english", "valenciano", "spanish", "french", "german", "italian", "portuguese"];
  return validLanguages.includes(language.toLowerCase());
}

// Data helpers
function mapResolvedCourse(resolved: ResolvedCourse): Course {
  return {
    id: resolved.id,
    db_id: resolved.dbId,
    title: resolved.title,
    language: resolved.language,
    level: resolved.level,
    institution: resolved.institution,
    description: resolved.description,
    cultural_context: resolved.culturalContext,
    image_url: resolved.imageUrl,
    exam_providers: resolved.examProviders,
    total_exams: resolved.totalExams,
    config: resolved.config,
  };
}

function buildCourseMaps(courses: Course[]) {
  const byDbId = new Map<string, Course>();
  const bySlug = new Map<string, Course>();

  courses.forEach((course) => {
    if (course.db_id) {
      byDbId.set(course.db_id, course);
    }
    bySlug.set(course.id, course);
  });

  return { byDbId, bySlug };
}

function calculateQuickStats(courses: Course[]) {
  const levelSet = new Set<string>();
  const providerSet = new Set<string>();
  let totalExams = 0;

  courses.forEach((course) => {
    levelSet.add(course.level.toUpperCase());
    totalExams += course.total_exams || 0;
    (course.exam_providers || []).forEach((provider) => providerSet.add(provider));
  });

  return {
    levelCount: levelSet.size,
    totalExams,
    providerCount: providerSet.size,
  };
}

async function buildLanguageCourseData({
  client,
  language,
  userId,
  initialCourses,
}: {
  client: SupabaseClient<Database>;
  language: string;
  userId: string;
  initialCourses?: ResolvedCourse[];
}): Promise<{
  availableCourses: Course[];
  userCourses: UserCourse[];
  userProgress: UserProgress[];
}> {
  const resolvedCourses = initialCourses && initialCourses.length > 0
    ? initialCourses
    : await fetchCoursesByLanguage(client, language);

  const availableCourses = resolvedCourses.map(mapResolvedCourse);
  const { byDbId, bySlug } = buildCourseMaps(availableCourses);

  const enrollments = await fetchUserCourseEnrollments(client, userId);

  const userCourses: UserCourse[] = enrollments
    .map((enrollment) => {
      const matched = byDbId.get(enrollment.courseId) || bySlug.get(enrollment.courseId);
      if (!matched) {
        return null;
      }

      if (matched.language.toLowerCase() !== language.toLowerCase()) {
        return null;
      }

      return {
        course_id: matched.db_id ?? matched.id,
        course_slug: matched.id,
        subscription_status: enrollment.subscriptionStatus,
        access_expires_at: enrollment.accessExpiresAt,
        courses: matched,
      } as UserCourse;
    })
    .filter((course): course is UserCourse => Boolean(course));

  const courseIdsForProgress = userCourses
    .map((userCourse) => userCourse.courses.db_id)
    .filter((id): id is string => Boolean(id));

  const progressSummaries = await fetchCourseProgressSummaries(client, userId, courseIdsForProgress);

  const userProgress: UserProgress[] = userCourses.map((userCourse) => {
    const dbId = userCourse.courses.db_id;
    const summary = dbId ? progressSummaries[dbId] : undefined;

    return {
      course_id: userCourse.course_id,
      total_sessions: summary?.totalSessions ?? 0,
      average_score: summary?.averageScore ?? 0,
      last_session: summary?.lastSession ?? null,
      achievements_count: summary?.achievements ?? 0,
      pass_rate: summary?.passRate,
    };
  });

  return {
    availableCourses,
    userCourses,
    userProgress,
  };
}

// Server Components for data fetching
function LanguageCoursesSection({
  language,
  availableCourses,
  userCourses,
  userProgress,
}: {
  language: string;
  availableCourses: Course[];
  userCourses: UserCourse[];
  userProgress: UserProgress[];
}) {
  return (
    <div className="space-y-8">
      {userCourses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Tus Cursos Activos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {userCourses.map((userCourse) => (
              <Link
                key={userCourse.course_id}
                href={`/dashboard/${userCourse.courses.language.toLowerCase()}/${userCourse.courses.level.toLowerCase()}`}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {userCourse.courses.title}
                  </h3>
                  <div className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Activo
                  </div>
                </div>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                  {userCourse.courses.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">
                    {userCourse.courses.institution}
                  </span>
                  <span className="text-blue-600 font-medium">
                    {userCourse.courses.total_exams || 0} exámenes
                  </span>
                </div>
              </Link>
            ))}
          </div>
          
          {userProgress.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Tu Progreso</h3>
              <ProgressAnalytics 
                courses={userCourses.map(uc => uc.courses)} 
                userProgress={userProgress}
              />
            </div>
          )}
        </div>
      )}
      
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {userCourses.length > 0 ? 'Otros Cursos Disponibles' : 'Cursos Disponibles'}
        </h2>
        <CourseSelection 
          initialLanguage={language} 
          availableCourses={availableCourses}
        />
      </div>
    </div>
  );
}

export default async function LanguagePage({ params }: Props) {
  const { idioma } = await params;
  
  // Validate language parameter
  if (!isValidLanguage(idioma)) {
    notFound();
  }
  
  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const displayName = getLanguageDisplayName(idioma);

  const { availableCourses, userCourses, userProgress } = await buildLanguageCourseData({
    client,
    language: idioma,
    userId: user.id,
  });

  const quickStats = calculateQuickStats(availableCourses);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-white/50 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">
                  Cursos de {displayName}
                </h1>
                <p className="text-xl text-slate-600">
                  Perfecciona tu {displayName.toLowerCase()} con nuestros simuladores de examen
                </p>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {userCourses.length}
              </div>
              <div className="text-sm text-slate-600">Cursos Activos</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {quickStats.levelCount}
              </div>
              <div className="text-sm text-slate-600">Niveles Disponibles</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {quickStats.totalExams}
              </div>
              <div className="text-sm text-slate-600">Total Exámenes</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {quickStats.providerCount}
              </div>
              <div className="text-sm text-slate-600">Proveedores</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <LanguageCoursesSection
          language={idioma}
          availableCourses={availableCourses}
          userCourses={userCourses}
          userProgress={userProgress}
        />
        
        {/* Breadcrumb Navigation */}
        <nav className="mt-12 pt-8 border-t border-slate-200" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-slate-500">
            <li>
              <Link href="/" className="hover:text-slate-700 transition-colors">
                Inicio
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-slate-700 transition-colors">
                Academia
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-slate-900 font-medium">{displayName}</span>
            </li>
          </ol>
        </nav>
      </main>
    </div>
  );
}

// Generate static params for common languages
export async function generateStaticParams() {
  return [
    { idioma: 'english' },
    { idioma: 'valenciano' },
    { idioma: 'spanish' },
    { idioma: 'french' },
    { idioma: 'german' },
    { idioma: 'italian' },
  ];
}

// 404 page for invalid languages
export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.034 0-3.9.785-5.291 2.076M6.343 6.343a8 8 0 1011.314 0M12 2v6m-6 6h12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Idioma no encontrado
          </h2>
          <p className="text-slate-600 mb-6">
            Lo sentimos, el idioma que buscas no está disponible en nuestra plataforma.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a Academia
          </Link>
        </div>
      </div>
    </div>
  );
}
