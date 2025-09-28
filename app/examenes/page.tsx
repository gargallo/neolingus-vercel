import { createSupabaseClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  FileQuestion,
  Clock,
  Users,
  Search,
  Filter,
  Play,
  BookOpen,
  Trophy,
  Target
} from "lucide-react";
import Link from "next/link";
import type { ExamTemplate } from "@/types/exam-system";

export default async function ExamenesPage() {
  const supabase = await createSupabaseClient();

  // Get published exam templates
  const { data: examTemplates, error } = await supabase
    .from('exam_templates')
    .select(`
      *,
      exam_content(count),
      user_exam_attempts(count)
    `)
    .eq('is_published', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching exam templates:', error);
  }

  const exams: (ExamTemplate & { contentCount: number; attemptsCount: number })[] =
    examTemplates?.map(exam => ({
      ...exam,
      contentCount: Array.isArray(exam.exam_content) ? exam.exam_content.length : 0,
      attemptsCount: Array.isArray(exam.user_exam_attempts) ? exam.user_exam_attempts.length : 0
    })) || [];

  const getLanguageDisplay = (language: string) => {
    const languages: Record<string, string> = {
      english: 'Inglés',
      valenciano: 'Valenciano',
      spanish: 'Español',
      french: 'Francés',
      german: 'Alemán',
      italian: 'Italiano',
      portuguese: 'Portugués'
    };
    return languages[language] || language;
  };

  const getProviderDisplay = (provider: string) => {
    const providers: Record<string, string> = {
      cambridge: 'Cambridge',
      eoi: 'EOI',
      cieacova: 'CIEACOVA',
      jqcv: 'JQCV',
      dele: 'DELE',
      delf: 'DELF',
      goethe: 'Goethe'
    };
    return providers[provider] || provider;
  };

  const getSkillDisplay = (skill: string) => {
    const skills: Record<string, string> = {
      reading: 'Reading',
      writing: 'Writing',
      listening: 'Listening',
      speaking: 'Speaking',
      use_of_english: 'Use of English',
      mediation: 'Mediación',
      integrated: 'Completo'
    };
    return skills[skill] || skill;
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      advanced: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  // Group exams by language for better organization
  const examsByLanguage = exams.reduce((acc, exam) => {
    if (!acc[exam.language]) {
      acc[exam.language] = [];
    }
    acc[exam.language].push(exam);
    return acc;
  }, {} as Record<string, typeof exams>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
              <FileQuestion className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Exámenes Oficiales
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Practica con exámenes oficiales reales de diferentes proveedores.
            Simuladores exactos a los exámenes originales con evaluación automática.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 border-0 shadow-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar exámenes por idioma, nivel, proveedor..."
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="english">Inglés</SelectItem>
                    <SelectItem value="valenciano">Valenciano</SelectItem>
                    <SelectItem value="spanish">Español</SelectItem>
                  </SelectContent>
                </Select>

                <Select defaultValue="all">
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="A1">A1</SelectItem>
                    <SelectItem value="A2">A2</SelectItem>
                    <SelectItem value="B1">B1</SelectItem>
                    <SelectItem value="B2">B2</SelectItem>
                    <SelectItem value="C1">C1</SelectItem>
                    <SelectItem value="C2">C2</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                  <FileQuestion className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Exámenes Disponibles</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{exams.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                  <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Idiomas</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {Object.keys(examsByLanguage).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/20">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Intentos Totales</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {exams.reduce((sum, exam) => sum + exam.attemptsCount, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/20">
                  <Trophy className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Proveedores</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {new Set(exams.map(e => e.provider)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exams by Language */}
        {Object.keys(examsByLanguage).length === 0 ? (
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileQuestion className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No hay exámenes disponibles
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                Los exámenes están siendo preparados. Vuelve pronto para practicar con exámenes oficiales reales.
              </p>
              <Button asChild>
                <Link href="/">Volver al inicio</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          Object.entries(examsByLanguage).map(([language, languageExams]) => (
            <div key={language} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getLanguageDisplay(language)}
                </h2>
                <Badge variant="outline" className="text-sm">
                  {languageExams.length} examen{languageExams.length !== 1 ? 'es' : ''}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {languageExams.map((exam) => (
                  <Card
                    key={exam.id}
                    className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {exam.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline">{exam.level}</Badge>
                            <Badge className={getDifficultyColor(exam.difficulty_level)}>
                              {exam.difficulty_level}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                          <FileQuestion className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-between mb-2">
                          <span>{getProviderDisplay(exam.provider)}</span>
                          <span>{getSkillDisplay(exam.skill)}</span>
                        </div>
                        {exam.description && (
                          <p className="line-clamp-2">{exam.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{exam.estimated_duration}min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span>{exam.contentCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{exam.attemptsCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button className="flex-1 gap-2" asChild>
                          <Link href={`/examenes/${exam.id}/practicar`}>
                            <Play className="w-4 h-4" />
                            Practicar
                          </Link>
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2" asChild>
                          <Link href={`/examenes/${exam.id}`}>
                            <FileQuestion className="w-4 h-4" />
                            Ver Detalles
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}