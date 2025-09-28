"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  ChevronRight,
  Trophy,
  TrendingUp,
  Sparkles,
  PlayCircle,
  ArrowRight
} from "lucide-react";

interface Course {
  id: string;
  title: string;
  language: string;
  level: string;
  certification_type: string;
  description: string;
  components: string[];
  exam_providers?: string[];
  total_exams?: number;
  image?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  duration_weeks?: number;
  enrolled_count?: number;
  instructor?: string;
}

interface UserEnrollment {
  course_id: string;
  subscription_status: string;
  subscription_tier?: string;
  access_expires_at?: string;
}

interface CourseSelectionInterfaceProps {
  courses: Course[];
  userEnrollments: UserEnrollment[];
  userId: string;
  user: any;
  demoMode?: boolean;
}

const LANGUAGE_LABELS = {
  english: "Inglés",
  valenciano: "Valencià",
  spanish: "Español",
  french: "Francés",
  german: "Alemán"
};

const DIFFICULTY_COLORS = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

const LEVEL_COLORS = {
  a1: "from-emerald-400 to-emerald-600",
  a2: "from-emerald-500 to-emerald-700",
  b1: "from-amber-400 to-orange-500",
  b2: "from-orange-500 to-red-500",
  c1: "from-purple-500 to-indigo-600",
  c2: "from-indigo-600 to-purple-700"
};

const LANGUAGE_GRADIENTS = {
  english: "from-blue-600 via-purple-600 to-indigo-700",
  valenciano: "from-orange-500 via-red-500 to-pink-600",
  spanish: "from-green-500 via-teal-500 to-blue-600",
  french: "from-purple-500 via-pink-500 to-red-500",
  german: "from-gray-600 via-slate-700 to-black",
  italian: "from-green-600 via-red-500 to-red-600"
};

export function CourseSelectionInterface({
  courses,
  userEnrollments,
  userId,
  user,
  demoMode = false
}: CourseSelectionInterfaceProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Get unique languages for filter
  const availableLanguages = useMemo(() => {
    const languages = [...new Set(courses.map(course => course.language))];
    return languages.sort();
  }, [courses]);

  // Filter courses based on search and filters
  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           LANGUAGE_LABELS[course.language as keyof typeof LANGUAGE_LABELS]?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesLanguage = selectedLanguage === "all" || course.language === selectedLanguage;
      const matchesDifficulty = selectedDifficulty === "all" || course.difficulty === selectedDifficulty;

      return matchesSearch && matchesLanguage && matchesDifficulty;
    });
  }, [courses, searchTerm, selectedLanguage, selectedDifficulty]);

  // Group courses by language for Netflix-style rows
  const coursesByLanguage = useMemo(() => {
    const grouped = filteredCourses.reduce((acc, course) => {
      if (!acc[course.language]) {
        acc[course.language] = [];
      }
      acc[course.language].push(course);
      return acc;
    }, {} as Record<string, Course[]>);

    // Sort courses within each language by level
    Object.keys(grouped).forEach(language => {
      grouped[language].sort((a, b) => {
        const levelOrder = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
        return levelOrder.indexOf(a.level.toLowerCase()) - levelOrder.indexOf(b.level.toLowerCase());
      });
    });

    return grouped;
  }, [filteredCourses]);

  const featuredCourse = useMemo(() => {
    if (filteredCourses.length > 0) {
      return filteredCourses[0];
    }
    return courses[0] ?? null;
  }, [filteredCourses, courses]);

  const languagesToRender = useMemo(() => {
    if (selectedLanguage !== "all") {
      return coursesByLanguage[selectedLanguage]
        ? [selectedLanguage]
        : [];
    }
    return Object.keys(coursesByLanguage);
  }, [selectedLanguage, coursesByLanguage]);

  const difficultyFilters = [
    { value: "all", label: "Todos los niveles" },
    { value: "beginner", label: "Principiante" },
    { value: "intermediate", label: "Intermedio" },
    { value: "advanced", label: "Avanzado" },
  ];

  const handleCourseClick = async (course: Course) => {
    setIsLoading(true);

    // Add a subtle delay for smooth transition
    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to the course dashboard
    router.push(`/dashboard/${course.language}/${course.level}?course=${course.id}`);
  };

  const isEnrolled = (courseId: string) => {
    return userEnrollments.some(enrollment => enrollment.course_id === courseId);
  };

  const getEnrollmentInfo = (courseId: string) => {
    return userEnrollments.find(enrollment => enrollment.course_id === courseId);
  };

  const CourseCard = ({ course, className = "" }: { course: Course; className?: string }) => {
    const enrolled = isEnrolled(course.id);
    const enrollmentInfo = getEnrollmentInfo(course.id);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          y: -4,
          transition: { duration: 0.15, ease: "easeOut" }
        }}
        whileTap={{ scale: 0.99 }}
        className={`group ${className}`}
      >
        <div
          className="relative h-full cursor-pointer overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
          onClick={() => handleCourseClick(course)}
        >
          {/* Background Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 dark:to-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {/* Course Header with Advanced Gradient */}
          <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${LANGUAGE_GRADIENTS[course.language as keyof typeof LANGUAGE_GRADIENTS] || 'from-blue-600 to-purple-600'}`}>
            {/* Dynamic Pattern Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_30%,rgba(255,255,255,0.05)_50%,transparent_70%)]" />

            {/* Static Decorative Elements */}
            <div className="absolute top-2 right-2 w-12 h-12 bg-white/10 rounded-full blur-sm" />
            <div className="absolute bottom-8 right-8 w-4 h-4 bg-white/20 rounded-full" />

            {/* Level Badge */}
            <div className="absolute top-4 left-4">
              <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${LEVEL_COLORS[course.level.toLowerCase() as keyof typeof LEVEL_COLORS]} text-white font-bold text-sm shadow-lg backdrop-blur-sm border border-white/20 hover:scale-105 transition-transform duration-150`}>
                {course.level.toUpperCase()}
              </div>
            </div>

            {/* Enrollment Status */}
            {enrolled && (
              <div className="absolute top-4 right-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-3 py-1 bg-emerald-500 text-white rounded-full text-sm font-medium shadow-lg backdrop-blur-sm flex items-center gap-1"
                >
                  <Trophy className="w-3 h-3" />
                  Matriculado
                </motion.div>
              </div>
            )}

            {/* Language Title */}
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-white font-bold text-xl leading-tight drop-shadow-lg">
                {LANGUAGE_LABELS[course.language as keyof typeof LANGUAGE_LABELS] || course.language}
              </h3>
              <p className="text-white/90 text-sm font-medium">
                {course.certification_type.toUpperCase()}
              </p>
            </div>

            {/* Hover Arrow */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Course Content */}
          <div className="p-6 space-y-5">
            {/* Title and Description */}
            <div className="space-y-2">
              <h4 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {course.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                {course.description}
              </p>
            </div>

            {/* Course Summary */}
            <div className="space-y-3">
              {/* Course Overview */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-lg p-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {course.level.toUpperCase()} nivel {course.difficulty === 'beginner' ? 'principiante' :
                   course.difficulty === 'intermediate' ? 'intermedio' : 'avanzado'} con {course.total_exams} exámenes prácticos.
                  Duración estimada: {course.duration_weeks} semanas.
                </p>
              </div>

              {/* Providers Section */}
              <div className="space-y-2">
                <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Proveedores de Examen
                </h5>
                <div className="flex flex-wrap gap-2">
                  {course.exam_providers?.map((provider, index) => (
                    <motion.div
                      key={provider}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        provider === 'cambridge'
                          ? 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                          : provider === 'eoi'
                          ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                          : provider === 'jqcv'
                          ? 'bg-gradient-to-r from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-700'
                          : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700/50 dark:to-gray-600/50 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {provider.toUpperCase()}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Difficulty */}
            <div className="flex justify-between items-center pt-2">
              <Badge className={`${DIFFICULTY_COLORS[course.difficulty || 'intermediate']} font-medium px-3 py-1`}>
                {course.difficulty === 'beginner' ? 'Principiante' :
                 course.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
              </Badge>
            </div>

            {/* Action Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                className={`w-full h-12 font-semibold transition-all duration-300 ${
                  enrolled
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-500/25"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-blue-500/25"
                }`}
                variant="default"
              >
                <div className="flex items-center justify-center gap-2">
                  {enrolled ? (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Continuar Curso
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Comenzar Curso
                    </>
                  )}
                </div>
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      {/* Minimal Dashboard Header */}
      <div className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">Academia NeoLingus</h1>
              <Badge className="bg-white/10 text-white/80 border-white/20">
                {demoMode ? 'Demo' : 'Dashboard'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-white/60">
              <span>Bienvenido{user?.email ? `, ${user.email.split('@')[0]}` : ''}</span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white/80"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {featuredCourse && (
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative h-[280px] overflow-hidden sm:h-[320px] md:h-[360px] mt-0"
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              LANGUAGE_GRADIENTS[
                featuredCourse.language as keyof typeof LANGUAGE_GRADIENTS
              ] || "from-blue-600 to-purple-700"
            }`}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_55%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-slate-950/40 to-slate-950" />

          <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end gap-4 px-6 pb-12">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-white/85">
              <span className="rounded-full bg-white/15 px-3 py-1">
                {LANGUAGE_LABELS[featuredCourse.language as keyof typeof LANGUAGE_LABELS] || featuredCourse.language}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                {featuredCourse.level.toUpperCase()}
              </span>
              {featuredCourse.exam_providers?.length ? (
                <span className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-medium">
                  {featuredCourse.exam_providers.map(provider => provider.toUpperCase()).join(' • ')}
                </span>
              ) : null}
            </div>

            <h1 className="text-3xl font-black tracking-tight drop-shadow-[0_18px_64px_rgba(0,0,0,0.45)] sm:text-4xl">
              {featuredCourse.title}
            </h1>
            <p className="max-w-2xl text-sm text-white/80 sm:text-base line-clamp-2">
              {featuredCourse.description}
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Button
                onClick={() => handleCourseClick(featuredCourse)}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-2 font-semibold text-slate-900 shadow-xl transition hover:bg-slate-200"
              >
                <PlayCircle className="h-4 w-4" />
                {isEnrolled(featuredCourse.id) ? "Continuar curso" : "Empezar ahora"}
              </Button>
              <Badge className="rounded-full border border-white/30 bg-white/10 px-4 py-1 text-white/90">
                {(featuredCourse.total_exams ?? 0)} exámenes • {(featuredCourse.duration_weeks ?? 0)} semanas
              </Badge>
            </div>
          </div>
        </motion.section>
      )}

      <div
        className={`relative z-20 mx-auto max-w-7xl px-6 pb-24 ${
          featuredCourse ? "-mt-16 sm:-mt-20" : "pt-16"
        }`}
      >
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-2xl sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/50">
                <Search className="h-4 w-4" />
              </div>
              <Input
                placeholder="Buscar idioma, nivel o certificación"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 rounded-xl border-white/10 bg-white/10 pl-10 pr-3 text-sm text-white placeholder:text-white/50 focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-white/60">
              <TrendingUp className="h-4 w-4" />
              <span>
                {filteredCourses.length} curso{filteredCourses.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {['all', ...availableLanguages].map((languageOption) => {
              const isActive = selectedLanguage === languageOption;
              const label =
                languageOption === 'all'
                  ? 'Todos los idiomas'
                  : LANGUAGE_LABELS[languageOption as keyof typeof LANGUAGE_LABELS] ||
                    languageOption.charAt(0).toUpperCase() + languageOption.slice(1);
              return (
                <button
                  key={languageOption}
                  onClick={() => setSelectedLanguage(languageOption)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-lg shadow-black/40'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {difficultyFilters.map((option) => {
              const isActive = selectedDifficulty === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedDifficulty(option.value)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] transition ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/40'
                      : 'bg-white/5 text-white/60 hover:bg-white/15'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-8 pt-6">
          {languagesToRender.length > 0 ? (
            languagesToRender.map((language) => {
              const languageCourses = coursesByLanguage[language] ?? [];
              const displayName =
                LANGUAGE_LABELS[language as keyof typeof LANGUAGE_LABELS] ||
                language.charAt(0).toUpperCase() + language.slice(1);

              return (
                <motion.section
                  key={language}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">{displayName}</h2>
                      <p className="text-sm text-white/55">
                        {languageCourses.length} curso{languageCourses.length !== 1 ? 's' : ''} disponibles
                      </p>
                    </div>
                    <div className="hidden items-center gap-2 text-sm text-white/50 md:flex">
                      <span>ver todos</span>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent md:block" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-slate-950 via-slate-950/85 to-transparent md:block" />
                    <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {languageCourses.map((course) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          className="min-w-[300px] max-w-[320px] snap-start"
                        />
                      ))}
                    </div>
                  </div>
                </motion.section>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="py-24 text-center"
            >
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
                <Search className="h-9 w-9 text-white/60" />
              </div>
              <h3 className="text-2xl font-semibold text-white">No se encontraron cursos</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
                Ajusta tus filtros o prueba con otra palabra clave para seguir explorando la academia.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedLanguage('all');
                    setSelectedDifficulty('all');
                  }}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  Limpiar filtros
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('inglés')}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  Buscar inglés
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
