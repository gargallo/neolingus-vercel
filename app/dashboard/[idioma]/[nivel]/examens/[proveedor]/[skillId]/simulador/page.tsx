import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createSupabaseClient } from '@/utils/supabase/server';
import { CourseLayoutWrapper } from '@/components/academia/course-layout-wrapper';
import { UniversalExamSimulator } from '@/components/exam-simulator/universal-exam-simulator';
import { ExamDataService } from '@/lib/services/exam-data.service';
import { getSkillById } from '@/components/academia/examens/skill-definitions';
import { fetchCoursesByLanguage } from '@/lib/academia/course-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { SkillSimulatorClient } from './skill-simulator-client';

interface SkillSimulatorPageProps {
  params: {
    idioma: string;
    nivel: string;
    proveedor: string;
    skillId: string;
  };
  searchParams?: {
    examId?: string;
  };
}

function getLanguageDisplayName(language: string): string {
  const languageNames: Record<string, string> = {
    english: 'Inglés',
    valenciano: 'Valenciano',
    spanish: 'Español',
    french: 'Francés',
    german: 'Alemán',
    italian: 'Italiano',
    portuguese: 'Portugués',
  };
  return languageNames[language.toLowerCase()] || language.charAt(0).toUpperCase() + language.slice(1);
}

function getProviderDisplayName(provider: string): string {
  const providerNames: Record<string, string> = {
    cambridge: 'Cambridge English',
    eoi: 'EOI',
    cieacova: 'CIEACOVA',
    jqcv: 'JQCV',
    dele: 'DELE',
    delf: 'DELF',
    goethe: 'Goethe Institut',
  };
  return providerNames[provider.toLowerCase()] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

function buildSkillExamId(provider: string, language: string, level: string, skillId: string): string {
  return [provider.toLowerCase(), language.toLowerCase(), level.toLowerCase(), skillId].join('_');
}

export async function generateMetadata({ params }: SkillSimulatorPageProps): Promise<Metadata> {
  const { idioma, nivel, proveedor, skillId } = await params;
  const skill = getSkillById(proveedor, skillId);
  const examId = buildSkillExamId(proveedor, idioma, nivel, skillId);
  const examInfo = await ExamDataService.getExamInfo(examId);

  const displayLanguage = getLanguageDisplayName(idioma);
  const displayLevel = nivel.toUpperCase();
  const displayProvider = getProviderDisplayName(proveedor);

  if (!skill) {
    return {
      title: 'Simulador no disponible - Academia Neolingus',
    };
  }

  return {
    title: examInfo
      ? `Simulador ${examInfo.title} - ${displayLanguage} ${displayLevel}`
      : `Simulador ${skill.name} - ${displayProvider}`,
    description: examInfo?.description || `Practica ${skill.name} amb un simulador oficial ${displayProvider}.`,
    keywords: [displayLanguage, displayLevel, displayProvider, skill.name, 'simulador', 'examen', 'pràctica'],
  };
}

function SimulatorFallback() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-[480px] w-full" />
    </div>
  );
}

export default async function SkillSimulatorPage({ params, searchParams }: SkillSimulatorPageProps) {
  const { idioma, nivel, proveedor, skillId } = await params;
  const skill = getSkillById(proveedor, skillId);

  if (!skill) {
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

  const examId = searchParams?.examId || buildSkillExamId(proveedor, idioma, nivel, skillId);
  const examData = await ExamDataService.getExamData(examId);

  if (!examData) {
    notFound();
  }

  const layoutUser = {
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata || {},
  };

  const SkillIcon = skill.icon;
  const displayLanguage = getLanguageDisplayName(idioma);
  const displayLevel = nivel.toUpperCase();
  const displayProvider = getProviderDisplayName(proveedor);

  return (
    <CourseLayoutWrapper user={layoutUser} language={idioma} level={nivel}>
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Link href={`/dashboard/${idioma}/${nivel}`} className="hover:text-slate-900 dark:hover:text-white">
            Academia
          </Link>
          <span>/</span>
          <Link href={`/dashboard/${idioma}/${nivel}/examens`} className="hover:text-slate-900 dark:hover:text-white">
            Exámenes
          </Link>
          <span>/</span>
          <Link href={`/dashboard/${idioma}/${nivel}/examens/${proveedor}`} className="hover:text-slate-900 dark:hover:text-white">
            {displayProvider}
          </Link>
          <span>/</span>
          <Link href={`/dashboard/${idioma}/${nivel}/examens/${proveedor}/${skillId}`} className="hover:text-slate-900 dark:hover:text-white">
            {skill.name}
          </Link>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">Simulador</span>
        </div>

        <Card className="border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur">
          <CardHeader className="flex flex-col gap-4">
            <Button asChild variant="ghost" className="w-fit text-slate-600 dark:text-slate-400">
              <Link href={`/dashboard/${idioma}/${nivel}/examens/${proveedor}/${skillId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tornar a {skill.name}
              </Link>
            </Button>
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${skill.color} shadow-lg`}>
                <SkillIcon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 space-y-2">
                <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
                  Simulador oficial {displayProvider}
                </CardTitle>
                <p className="text-slate-600 dark:text-slate-300">
                  Practica amb l&apos;examen real utilitzat per la {displayProvider}. Inclou textos, preguntes i temporitzador oficials.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge>{displayLanguage} {displayLevel}</Badge>
                  <Badge variant="outline">{skill.difficulty}</Badge>
                  <Badge variant="outline">{examData.template.total_questions} preguntes</Badge>
                  <Badge variant="outline">{examData.template.estimated_duration} min</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<SimulatorFallback />}>
              <SkillSimulatorClient
                examTemplate={examData.template}
                examContent={examData.content}
                questions={examData.questions}
                userId={user.id}
                courseId={course.dbId}
                skillId={skillId}
                language={idioma}
                level={nivel}
                provider={proveedor}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </CourseLayoutWrapper>
  );
}
