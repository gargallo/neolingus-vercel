import { createSupabaseClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileQuestion,
  Clock,
  Users,
  Play,
  Download,
  ArrowLeft,
  Target,
  Trophy,
  CheckCircle,
  BookOpen,
  Volume2,
  FileText
} from "lucide-react";
import Link from "next/link";
import type { ExamTemplate, ExamContent } from "@/types/exam-system";

interface ExamDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ExamDetailPage({ params }: ExamDetailPageProps) {
  const { id } = params;
  const supabase = await createSupabaseClient();

  // Get exam template with content
  const { data: examData, error } = await supabase
    .from('exam_templates')
    .select(`
      *,
      exam_content(*),
      user_exam_attempts(count)
    `)
    .eq('id', id)
    .eq('is_published', true)
    .eq('is_active', true)
    .single();

  if (error || !examData) {
    notFound();
  }

  const exam: ExamTemplate & { content: ExamContent[]; attemptsCount: number } = {
    ...examData,
    content: examData.exam_content || [],
    attemptsCount: Array.isArray(examData.user_exam_attempts) ? examData.user_exam_attempts.length : 0
  };

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

  // Group content by section
  const contentBySection = exam.content.reduce((acc, content) => {
    if (!acc[content.section_id]) {
      acc[content.section_id] = [];
    }
    acc[content.section_id].push(content);
    return acc;
  }, {} as Record<string, ExamContent[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <Button variant="ghost" className="gap-2 mb-4" asChild>
            <Link href="/examenes">
              <ArrowLeft className="w-4 h-4" />
              Volver a Exámenes
            </Link>
          </Button>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Link href="/examenes" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Exámenes
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">{exam.name}</span>
          </div>
        </div>

        {/* Header */}
        <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl mb-8">
          <CardHeader>
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-xl">
                  <FileQuestion className="w-8 h-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {exam.name}
                  </CardTitle>
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline" className="text-sm">
                      {getLanguageDisplay(exam.language)}
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      {exam.level}
                    </Badge>
                    <Badge className={getDifficultyColor(exam.difficulty_level)}>
                      {exam.difficulty_level}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                    {exam.description || `Examen oficial de ${getProviderDisplay(exam.provider)} para ${getLanguageDisplay(exam.language)} nivel ${exam.level}`}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" asChild>
                  <Link href={`/examenes/${exam.id}/practicar`}>
                    <Play className="w-5 h-5" />
                    Comenzar Examen
                  </Link>
                </Button>
                {exam.pdf_path && (
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Descargar PDF
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/20">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Duración</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {exam.estimated_duration} min
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/20">
                    <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Preguntas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {exam.content.length || exam.total_questions || 'N/A'}
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">Intentos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {exam.attemptsCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exam Info */}
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Información del Examen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Proveedor</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getProviderDisplay(exam.provider)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Habilidad</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {getSkillDisplay(exam.skill)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Puntuación máxima</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {exam.max_score || 100} puntos
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nota mínima</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {exam.scoring_criteria.passing_score || 60}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Versión</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {exam.version}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Exam Content Structure */}
        {exam.sections && exam.sections.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Estructura del Examen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {exam.sections.map((section, index) => (
                  <div key={section.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {section.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {section.duration} minutos
                        </p>
                      </div>
                    </div>
                    {section.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
                        {section.description}
                      </p>
                    )}
                    {section.parts && section.parts.length > 0 && (
                      <div className="ml-11 space-y-2">
                        {section.parts.map((part, partIndex) => (
                          <div key={part.id} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {part.name}: {part.question_count} preguntas
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Resources */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Recursos Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exam.pdf_path && (
                <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <FileText className="w-6 h-6 text-red-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">PDF Oficial</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Examen original</p>
                  </div>
                </div>
              )}

              {exam.audio_paths && exam.audio_paths.length > 0 && (
                <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Volume2 className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Audio</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {exam.audio_paths.length} archivo{exam.audio_paths.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Simulador Interactivo</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Evaluación automática</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        {exam.instructions && (
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Instrucciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exam.instructions.general && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">General</h4>
                  <p className="text-gray-600 dark:text-gray-400">{exam.instructions.general}</p>
                </div>
              )}

              {exam.instructions.technical && exam.instructions.technical.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Técnicas</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {exam.instructions.technical.map((instruction, index) => (
                      <li key={index} className="text-gray-600 dark:text-gray-400">
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {exam.instructions.warnings && exam.instructions.warnings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Advertencias</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {exam.instructions.warnings.map((warning, index) => (
                      <li key={index} className="text-amber-600 dark:text-amber-400">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <div className="text-center">
          <Button size="lg" className="gap-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-4" asChild>
            <Link href={`/examenes/${exam.id}/practicar`}>
              <Play className="w-6 h-6" />
              Comenzar Examen Ahora
            </Link>
          </Button>
          <p className="text-gray-600 dark:text-gray-400 mt-4">
            Simulador exacto al examen oficial con evaluación automática
          </p>
        </div>
      </div>
    </div>
  );
}