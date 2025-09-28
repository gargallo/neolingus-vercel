import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { CourseLayoutWrapper } from "@/components/academia/course-layout-wrapper";
import { ExamSimulatorWrapper } from "@/components/exam-simulator/exam-simulator-wrapper";
import { ExamDataService } from "@/lib/services/exam-data.service";
import { Suspense } from "react";

interface ExamSimulatorPageProps {
  params: {
    idioma: string;
    nivel: string;
    proveedor: string;
    examId: string;
  };
}

export async function generateMetadata({ params }: ExamSimulatorPageProps): Promise<Metadata> {
  const { idioma, nivel, proveedor, examId } = await params;
  const examInfo = await ExamDataService.getExamInfo(examId);

  if (!examInfo) {
    return {
      title: "Examen no encontrado - Academia Neolingus",
    };
  }

  const displayLanguage = getLanguageDisplayName(idioma);
  const displayLevel = nivel.toUpperCase();

  return {
    title: `Simulador: ${examInfo.title} - ${displayLanguage} ${displayLevel} - Academia Neolingus`,
    description: `Simulador interactivo del examen ${examInfo.title}. Practica en condiciones reales de examen.`,
    keywords: [displayLanguage, displayLevel, examInfo.provider, "simulador", "examen", "práctica"],
    openGraph: {
      title: `Simulador: ${examInfo.title}`,
      description: `Practica con el simulador oficial de ${examInfo.title}`,
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

// Loading component for simulator
function SimulatorLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Loading header */}
        <div className="animate-pulse mb-8">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>

        {/* Loading simulator interface */}
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-xl shadow-2xl p-8">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                <div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                </div>
              </div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-20 mb-4"></div>
                  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                </div>
              ))}
            </div>

            <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Server component for exam simulator
async function ExamSimulatorSection({
  language,
  level,
  provider,
  examId,
  userId,
  client
}: {
  language: string;
  level: string;
  provider: string;
  examId: string;
  userId: string;
  client: any;
}) {
  // Fetch exam data
  const examData = await ExamDataService.getExamData(examId);

  if (!examData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6-4h6m-6 8h6m-3-12v12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Examen no encontrado
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            No se pudo cargar el contenido del examen. Verifica que el ID del examen sea correcto.
          </p>
          <a
            href={`/dashboard/${language}/${level}/examens/${provider}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a Exámenes
          </a>
        </div>
      </div>
    );
  }

  return (
    <ExamSimulatorWrapper
      examTemplate={examData.template}
      examContent={examData.content}
      questions={examData.questions}
      userId={userId}
      mode="practice"
      language={language}
      level={level}
      provider={provider}
    />
  );
}

export default async function ExamSimulatorPage({ params }: ExamSimulatorPageProps) {
  const { idioma, nivel, proveedor, examId } = await params;

  // Validate parameters
  if (!isValidLanguage(idioma) || !isValidLevel(nivel) || !isValidProvider(proveedor)) {
    notFound();
  }

  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Mock user for demo (same structure as other pages)
  const mockUser = {
    id: user.id,
    email: user.email || "demo@neolingus.com",
    user_metadata: {
      full_name: "Usuario Demo",
      subscription_type: "Basic Plan"
    }
  };

  return (
    <CourseLayoutWrapper user={mockUser} language={idioma} level={nivel}>
      <Suspense fallback={<SimulatorLoading />}>
        <ExamSimulatorSection
          language={idioma}
          level={nivel}
          provider={proveedor}
          examId={examId}
          userId={user.id}
          client={client}
        />
      </Suspense>
    </CourseLayoutWrapper>
  );
}

// Generate static params for common exams
export async function generateStaticParams() {
  // Generate params for common exam IDs based on the patterns we use
  const routes = [
    // Cambridge English B2
    { idioma: 'english', nivel: 'b2', proveedor: 'cambridge', examId: 'cambridge_b2_first_001' },
    { idioma: 'english', nivel: 'b2', proveedor: 'cambridge', examId: 'cambridge_b2_first_002' },
    { idioma: 'english', nivel: 'b2', proveedor: 'cambridge', examId: 'cambridge_b2_reading_001' },

    // EOI English B2
    { idioma: 'english', nivel: 'b2', proveedor: 'eoi', examId: 'eoi_b2_mock_001' },
    { idioma: 'english', nivel: 'b2', proveedor: 'eoi', examId: 'eoi_b2_mock_002' },

    // CIEACOVA Valenciano C1
    { idioma: 'valenciano', nivel: 'c1', proveedor: 'cieacova', examId: 'cieacova_c1_001' },
    { idioma: 'valenciano', nivel: 'c1', proveedor: 'cieacova', examId: 'cieacova_c1_002' },

    // JQCV Valenciano C1
    { idioma: 'valenciano', nivel: 'c1', proveedor: 'jqcv', examId: 'jqcv_c1_001' },
  ];

  return routes;
}