import { Suspense } from 'react';
import { Metadata } from 'next';
import { CourseLayoutWrapper } from '@/components/academia/course-layout-wrapper';
import MaestroCohesionGame from '@/components/games/maestro-cohesion/maestro-cohesion-game';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { createSupabaseClient } from '@/utils/supabase/server';

interface PageProps {
  params: Promise<{
    idioma: string;
    nivel: string;
  }>;
  searchParams: Promise<{
    mode?: 'substitution' | 'repair' | 'classification';
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { idioma, nivel } = await params;

  return {
    title: `Maestro de Cohesión - ${idioma.toUpperCase()} ${nivel.toUpperCase()} | Neolingus`,
    description: `Juego educativo para dominar los conectores discursivos en ${idioma} nivel ${nivel}. Aprende jugando con inteligencia artificial.`,
    keywords: ['conectores discursivos', 'juego educativo', 'C1', 'B2', 'gramática', idioma],
  };
}

function GameSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-64 mx-auto" />
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Skeleton className="h-12 w-40" />
      </div>
    </div>
  );
}

export default async function MaestroCohesionPage({ params, searchParams }: PageProps) {
  const { idioma, nivel } = await params;
  const { mode = 'substitution' } = await searchParams;

  // Get user data
  const supabase = await createSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  // Validate language parameter
  const validLanguages = ['english', 'spanish', 'valenciano'];
  if (!validLanguages.includes(idioma)) {
    throw new Error(`Invalid language: ${idioma}`);
  }

  // Map language to ISO code
  const languageMap: Record<string, 'en' | 'es' | 'val'> = {
    english: 'en',
    spanish: 'es',
    valenciano: 'val'
  };

  const language = languageMap[idioma];

  // Validate level parameter
  const validLevels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
  if (!validLevels.includes(nivel.toLowerCase())) {
    throw new Error(`Invalid level: ${nivel}`);
  }

  // Validate mode parameter
  const validModes = ['substitution', 'repair', 'classification'];
  if (!validModes.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }

  return (
    <CourseLayoutWrapper user={user} language={idioma} level={nivel}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <Suspense fallback={<GameSkeleton />}>
          <MaestroCohesionGame
            language={language}
            level={nivel}
            mode={mode}
          />
        </Suspense>
      </div>
    </CourseLayoutWrapper>
  );
}