import { notFound, redirect } from "next/navigation";
import { createSupabaseClient } from "@/utils/supabase/server";
import { loadCourseConfiguration } from "@/lib/exam-engine/utils/config-loader";
import { CourseContextProvider } from "@/components/academia/course-context-provider";
import DashboardOverview from "@/components/academia/course-dashboard";
import { Suspense } from "react";

interface Props {
  params: Promise<{
    idioma: string;
    nivel: string;
  }>;
}

// Utility functions
function getLanguageDisplayName(language: string): string {
  const languageMap: Record<string, string> = {
    valenciano: "Valenciano",
    english: "English",
    frances: "Francés",
    aleman: "Alemán",
    italiano: "Italiano",
    portugues: "Portugués",
  };
  return languageMap[language] || language;
}

function isValidLanguage(language: string): boolean {
  const validLanguages = [
    "valenciano",
    "english",
    "frances",
    "aleman",
    "italiano",
    "portugues",
  ];
  return validLanguages.includes(language);
}

function isValidLevel(level: string): boolean {
  const validLevels = ["a1", "a2", "b1", "b2", "c1", "c2"];
  return validLevels.includes(level.toLowerCase());
}

// Loading component
function LoadingDashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando dashboard...</p>
      </div>
    </div>
  );
}

// Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <div className="w-full">{children}</div>;
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
  const courseId = `${language}_${level.toLowerCase()}`;

  // Load course configuration
  let courseConfig;
  try {
    courseConfig = await loadCourseConfiguration(courseId);
  } catch (error) {
    console.error("Error loading course configuration:", error);
    courseConfig = null;
  }

  if (!courseConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Curso no encontrado
          </h2>
          <p className="text-gray-600">
            No se pudo cargar la configuración del curso.
          </p>
        </div>
      </div>
    );
  }

  // Transform course configuration into available exams
  const availableExams =
    courseConfig.exams?.map((exam: any) => ({
      examId: exam.id,
      title: exam.title,
      providerSlug: exam.provider,
      providerName: exam.providerName || exam.provider,
      duration: exam.duration,
      difficulty: exam.difficulty,
    })) || [];

  // Get default provider
  const defaultProvider = availableExams[0]?.providerSlug || "cieacova";
  const defaultProviderName = availableExams[0]?.providerName || "CIEACOVA";

  // Mock course data
  const course = {
    id: courseId,
    language: getLanguageDisplayName(language),
    level: level.toUpperCase(),
    title: `${getLanguageDisplayName(language)} ${level.toUpperCase()}`,
    description: `Curso de ${getLanguageDisplayName(
      language
    )} nivel ${level.toUpperCase()}`,
    provider: defaultProvider,
    providerName: defaultProviderName,
    totalExams: availableExams.length,
    completedExams: 0,
    averageScore: 0,
    timeSpent: 0,
    lastActivity: null,
  };

  // Mock progress data
  const progress = {
    total_sessions: 0,
    average_score: 0,
    estimated_study_hours: 0,
    last_session: null,
  };

  // Transform progress data
  const transformedProgressData = progress
    ? {
        overallProgress: 0,
        recentActivity: [],
        weeklyStats: {
          sessionsCompleted: progress.total_sessions || 0,
          hoursStudied: progress.estimated_study_hours || 0,
          averageScore: progress.average_score || 0,
          improvement: 5.2,
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

export default async function CoursePage({ params }: Props) {
  const { idioma, nivel } = await params;

  // Validate parameters
  if (!isValidLanguage(idioma) || !isValidLevel(nivel)) {
    notFound();
  }

  // Mock user for demo
  const user = {
    id: "demo-user-123",
    email: "demo@neolingus.com",
  };

  const client = await createSupabaseClient();

  return (
    <div className="min-h-screen">
      {/* Main Content - Solo el dashboard de Figma, sin header ni banner */}
      <ErrorBoundary>
        <CourseDashboardSection
          language={idioma}
          level={nivel}
          userId={user.id}
          client={client}
        />
      </ErrorBoundary>
    </div>
  );
}
