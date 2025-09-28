import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { AcademiaHeader } from "@/components/academia/dashboard-header";
import { CoursesGrid } from "@/components/academia/courses-grid";
import { CourseSelection } from "@/components/academia/course-selection";
import { Achievements } from "@/components/academia/achievements";
import { ProgressAnalytics } from "@/components/academia/progress-analytics";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Academia Neolingus - Tu Plataforma de Idiomas",
  description: "Accede a todos tus cursos de idiomas y prepárate para aprobar tus exámenes oficiales con simuladores y contenido personalizado.",
  keywords: ["idiomas", "exámenes", "preparación", "Valencia", "inglés", "valenciano", "EOI", "Cambridge"],
  openGraph: {
    title: "Academia Neolingus",
    description: "Prepárate para aprobar tus exámenes oficiales de idiomas",
    type: "website",
  },
};

interface Course {
  id: string;
  title: string;
  language: string;
  level: string;
  institution: string;
  description: string;
  cultural_context: string[];
  image_url: string | undefined;
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
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: "exam" | "streak" | "score" | "milestone";
  earned_at: string;
  metadata?: Record<string, any>;
}

// Loading components
function LoadingCard() {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
        <div className="h-20 bg-slate-200 rounded mb-4"></div>
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
      </div>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <LoadingCard key={i} />
      ))}
    </div>
  );
}

function LoadingStats() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Data fetching functions
async function fetchUserCourses(client: any, userId: string): Promise<UserCourse[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/academia/courses`, {
      headers: {
        'Authorization': `Bearer ${(await client.auth.getSession()).data.session?.access_token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    
    const data = await response.json();
    return data.courses || [];
  } catch (error) {
    console.error('Error fetching user courses:', error);
    // Return demo data as fallback
    return getDemoCourses();
  }
}

async function fetchUserProgress(client: any, userId: string): Promise<UserProgress[]> {
  try {
    const courses = await fetchUserCourses(client, userId);
    const progressPromises = courses.map(async (userCourse) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/academia/progress/${userCourse.course_id}`,
        {
          headers: {
            'Authorization': `Bearer ${(await client.auth.getSession()).data.session?.access_token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          course_id: userCourse.course_id,
          ...data.progress,
        };
      }
      
      // Return default progress if API fails
      return {
        course_id: userCourse.course_id,
        total_sessions: 0,
        average_score: 0,
        last_session: null,
        achievements_count: 0,
      };
    });
    
    return await Promise.all(progressPromises);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }
}

async function fetchUserAchievements(client: any, userId: string): Promise<Achievement[]> {
  // For now, return demo achievements
  // TODO: Implement real achievements API
  return [
    {
      id: "first_exam",
      title: "Primer Examen",
      description: "Has completado tu primer simulacro de examen",
      type: "milestone",
      earned_at: new Date().toISOString(),
    },
    {
      id: "streak_7",
      title: "Racha de 7 Días",
      description: "Has estudiado 7 días consecutivos",
      type: "streak",
      earned_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function getDemoCourses(): UserCourse[] {
  return [
    {
      course_id: "valenciano_c1",
      subscription_status: "active",
      access_expires_at: new Date(
        Date.now() + 90 * 24 * 60 * 60 * 1000
      ).toISOString(),
      courses: {
        id: "valenciano_c1",
        title: "Valencià C1",
        language: "valenciano",
        level: "C1",
        institution: "EOI / CIEACOVA",
        description:
          "Preparació per als exàmens oficials de valencià nivell C1",
        cultural_context: [
          "Literatura valenciana",
          "Tradicions valencianes",
          "Història del País Valencià",
        ],
        image_url: undefined,
        exam_providers: ["eoi", "cieacova"],
        total_exams: 15,
      },
    },
    {
      course_id: "ingles_b2",
      subscription_status: "active",
      access_expires_at: new Date(
        Date.now() + 60 * 24 * 60 * 60 * 1000
      ).toISOString(),
      courses: {
        id: "ingles_b2",
        title: "English B2 First",
        language: "english",
        level: "B2",
        institution: "Cambridge English / EOI",
        description:
          "Preparation for Cambridge B2 First and EOI B2 examinations",
        cultural_context: [
          "Everyday contexts",
          "Work situations",
          "Social interactions",
        ],
        image_url: undefined,
        exam_providers: ["cambridge", "eoi"],
        total_exams: 22,
      },
    },
  ];
}

// Server Components for data fetching
async function UserCoursesSection({ userId, client }: { userId: string; client: any }) {
  const userCourses = await fetchUserCourses(client, userId);
  const userProgress = await fetchUserProgress(client, userId);
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Tus Cursos Activos</h2>
        <CoursesGrid courses={userCourses} userProgress={userProgress} />
      </div>
      
      {userCourses.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Tu Progreso</h2>
          <ProgressAnalytics 
            courses={userCourses.map(uc => uc.courses)} 
            userProgress={userProgress}
          />
        </div>
      )}
    </div>
  );
}

async function UserAchievementsSection({ userId, client }: { userId: string; client: any }) {
  const achievements = await fetchUserAchievements(client, userId);
  
  if (achievements.length === 0) return null;
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Logros Recientes</h2>
      <Achievements userId={userId} achievements={achievements} />
    </div>
  );
}

export default async function AcademiaPage() {
  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get basic user courses for the course selection component
  const userCourses = await fetchUserCourses(client, user.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AcademiaHeader user={user} />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Bienvenido a tu Academia Personal
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Accede a todos tus cursos de idiomas y prepárate para aprobar tus
              exámenes oficiales con simuladores personalizados y análisis de progreso
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {userCourses.length}
              </div>
              <div className="text-slate-600">Cursos Activos</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {userCourses.reduce((sum, course) => sum + (course.courses.total_exams || 0), 0)}
              </div>
              <div className="text-slate-600">Exámenes Disponibles</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {new Set(userCourses.flatMap(course => course.courses.exam_providers || [])).size}
              </div>
              <div className="text-slate-600">Proveedores de Examen</div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {userCourses && userCourses.length > 0 ? (
          <div className="space-y-12">
            {/* User Courses and Progress */}
            <Suspense fallback={<LoadingGrid />}>
              <UserCoursesSection userId={user.id} client={client} />
            </Suspense>
            
            {/* User Achievements */}
            <Suspense fallback={<LoadingStats />}>
              <UserAchievementsSection userId={user.id} client={client} />
            </Suspense>
            
            {/* Course Selection for New Courses */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Explorar Más Cursos</h2>
              <Suspense fallback={<LoadingGrid />}>
                <CourseSelection />
              </Suspense>
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="max-w-lg mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                ¡Comienza tu Aventura de Aprendizaje!
              </h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                No tienes cursos activos aún. Explora nuestros cursos disponibles y 
                suscríbete para acceder a simuladores de examen, contenido de preparación 
                personalizado y análisis de progreso detallado.
              </p>
              
              {/* Course Selection Component */}
              <div className="mb-8">
                <Suspense fallback={<LoadingGrid />}>
                  <CourseSelection />
                </Suspense>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/protected/pricing"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Ver Planes y Precios
                </a>
                <a
                  href="/about"
                  className="inline-flex items-center px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Más Información
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Breadcrumb Navigation */}
        <nav className="mt-12 pt-8 border-t border-slate-200" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-slate-500">
            <li>
              <a href="/" className="hover:text-slate-700 transition-colors">
                Inicio
              </a>
            </li>
            <li>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>
            <li>
              <span className="text-slate-900 font-medium">Academia</span>
            </li>
          </ol>
        </nav>
      </main>
    </div>
  );
}

// Error boundary for client-side errors
export function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Algo salió mal
          </h2>
          <p className="text-slate-600 mb-6">
            Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar de Nuevo
          </button>
        </div>
      </div>
    </div>
  );
}