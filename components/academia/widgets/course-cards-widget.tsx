"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { spanishTranslations } from "@/lib/translations/spanish";
import { BookOpen, Clock, TrendingUp, Award, Sparkles } from "lucide-react";

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
}

interface UserCourse {
  course_id: string;
  subscription_status: string;
  access_expires_at: string;
  courses?: Course; // Made optional for direct course objects
}

interface CourseCardsWidgetProps {
  config: {
    title: string;
    size: string;
  };
  settings: {
    is_visible: boolean;
    is_collapsed: boolean;
    custom_title?: string;
  };
  dashboardData: any;
  userId: string;
  demoMode?: boolean;
  onToggleVisibility: (isVisible: boolean) => void;
}

export function CourseCardsWidget({ 
  config, 
  settings, 
  dashboardData, 
  userId,
  demoMode = false,
  onToggleVisibility 
}: CourseCardsWidgetProps) {
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { courses: t } = spanishTranslations;

  // Fetch user courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        if (demoMode) {
          // Provide demo course data
          const demoCourses: UserCourse[] = [
            {
              course_id: 'english_b2',
              subscription_status: 'active',
              access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              courses: {
                id: 'english_b2',
                title: 'Inglés B2 - Intermedio Alto',
                language: 'english',
                level: 'b2',
                certification_type: 'eoi',
                description: 'Curso completo de inglés nivel B2 que prepara para exámenes de certificación oficiales.',
                components: ['Comprensión Lectora', 'Comprensión Auditiva', 'Expresión Escrita', 'Expresión Oral', 'Gramática'],
                exam_providers: ['EOI', 'Cambridge'],
                total_exams: 15
              }
            },
            {
              course_id: 'valenciano_c1',
              subscription_status: 'active',
              access_expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
              courses: {
                id: 'valenciano_c1',
                title: 'Valenciano C1 - Avanzado',
                language: 'valenciano',
                level: 'c1',
                certification_type: 'jqcv',
                description: 'Curso avanzado de valenciano para certificación C1 a través de JQCV.',
                components: ['Comprensión Lectora', 'Comprensión Oral', 'Expresión Escrita', 'Expresión Oral'],
                exam_providers: ['JQCV'],
                total_exams: 12
              }
            }
          ];
          setCourses(demoCourses);
        } else {
          const response = await fetch(`/api/academia/courses`);
          if (response.ok) {
            const result = await response.json();
            // Convert Course objects to UserCourse objects with proper field mapping
            const userCourses: UserCourse[] = (result.data || []).map((course: any) => ({
              course_id: course.course_id,
              subscription_status: 'active', // Default for now
              access_expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months
              courses: {
                id: course.course_id,
                title: course.title,
                language: course.language,
                level: course.level,
                certification_type: course.institution?.toLowerCase() || 'unknown',
                description: course.description,
                components: ['reading', 'writing', 'listening', 'speaking'],
                exam_providers: [course.institution],
                total_exams: 15
              }
            }));
            setCourses(userCourses);
          } else {
            // If API fails, fall back to demo courses
            const demoCourses: UserCourse[] = [
              {
                course_id: 'english_b2',
                subscription_status: 'active',
                access_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                courses: {
                  id: 'english_b2',
                  title: 'Inglés B2 - Intermedio Alto',
                  language: 'english',
                  level: 'b2',
                  certification_type: 'eoi',
                  description: 'Curso completo de inglés nivel B2 que prepara para exámenes de certificación oficiales.',
                  components: ['Comprensión Lectora', 'Comprensión Auditiva', 'Expresión Escrita', 'Expresión Oral', 'Gramática'],
                  exam_providers: ['EOI', 'Cambridge'],
                  total_exams: 15
                }
              },
              {
                course_id: 'valenciano_c1',
                subscription_status: 'active',
                access_expires_at: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
                courses: {
                  id: 'valenciano_c1',
                  title: 'Valenciano C1 - Avanzado',
                  language: 'valenciano',
                  level: 'c1',
                  certification_type: 'jqcv',
                  description: 'Curso avanzado de valenciano para certificación C1 a través de JQCV.',
                  components: ['Comprensión Lectora', 'Comprensión Oral', 'Expresión Escrita', 'Expresión Oral'],
                  exam_providers: ['JQCV'],
                  total_exams: 12
                }
              }
            ];
            setCourses(demoCourses);
          }
        }
      } catch (error) {
        console.error('Failed to fetch courses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [userId, demoMode]);

  // Mock progress data for courses
  const getProgressForCourse = (courseId: string) => {
    // This would typically come from the API
    const mockProgress = {
      overall_completion: Math.random() * 100,
      sessions_completed: Math.floor(Math.random() * 20),
      last_session: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      average_score: 70 + Math.random() * 30,
      next_exam: Math.random() > 0.5 ? 'Comprensión Lectora' : null
    };
    return mockProgress;
  };

  const getCertificationColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'eoi':
        return 'bg-blue-100 text-blue-800';
      case 'jqcv':
        return 'bg-orange-100 text-orange-800';
      case 'cambridge':
        return 'bg-green-100 text-green-800';
      case 'dele':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLanguageFlag = (language: string) => {
    switch (language.toLowerCase()) {
      case 'english':
        return '🇬🇧';
      case 'valenciano':
      case 'català':
        return '🏴󠁥󠁳󠁶󠁣󠁿';
      case 'español':
        return '🇪🇸';
      case 'français':
        return '🇫🇷';
      default:
        return '🌐';
    }
  };

  if (settings.is_collapsed) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">
            {settings.custom_title || t.title}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {courses.length} {t.navigation.courses.toLowerCase()}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* Handle expand */}}
              className="h-6 w-6 p-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {settings.custom_title || t.title}
          </h3>
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
          {spanishTranslations.status.loading}
        </p>
      </Card>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {settings.custom_title || t.title}
          </h3>
        </div>
        <div className="text-center py-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-full mx-auto mb-6 flex items-center justify-center"
          >
            <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              {t.empty}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
              ¡Comienza tu viaje de aprendizaje explorando nuestros cursos disponibles!
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6"
          >
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6"
            >
              {t.actions.startCourse}
            </Button>
          </motion.div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10 border-blue-100 dark:border-blue-800/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {settings.custom_title || t.title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
            {courses.length} {t.status.enrolled.toLowerCase()}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {/* Handle settings */}}
            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Course Cards */}
      <div className="space-y-4">
        {courses.map((userCourse, index) => {
          const course = userCourse.courses;
          if (!course) {
            console.warn('Course data missing for userCourse:', userCourse);
            return null;
          }
          
          const progress = getProgressForCourse(course.id);
          const daysUntilExpiry = Math.ceil(
            (new Date(userCourse.access_expires_at).getTime() - Date.now()) / 
            (1000 * 60 * 60 * 24)
          );

          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -2, scale: 1.01 }}
              className="relative"
            >
              <Card className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden">
                {/* Achievement Badge for high progress */}
                {progress.overall_completion >= 80 && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute top-2 right-2 z-10"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-yellow-400 rounded-full shadow-sm">
                      <Award className="w-4 h-4 text-yellow-800" />
                    </div>
                  </motion.div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getLanguageFlag(course.language)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {course.title}
                        </h4>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getCertificationColor(course.certification_type)}`}
                        >
                          {t.certifications[course.certification_type.toLowerCase()] || course.certification_type.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <div className="font-medium">{t.levels[course.level.toLowerCase()] || course.level.toUpperCase()}</div>
                    {daysUntilExpiry > 0 && (
                      <div className={`mt-1 ${daysUntilExpiry <= 7 ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                        {daysUntilExpiry} {spanishTranslations.time.days}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Section */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.progress.completionRate}</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {Math.round(progress.overall_completion)}%
                    </span>
                  </div>
                  <div className="relative">
                    <Progress value={progress.overall_completion} className="h-3" />
                    {progress.overall_completion >= 90 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {progress.sessions_completed} {(t.progress.lessonsCompleted || 'sesiones').toLowerCase()}
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {Math.round(progress.average_score)}% {spanishTranslations.formatting.average}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {progress.last_session.toLocaleDateString('es-ES')}
                  </div>
                </div>

                {/* Skills/Components */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {course.components.map((component, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                    >
                      {component}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="text-xs px-3 py-1 h-7 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to course
                        window.location.href = `/dashboard/${course.language}/${course.level}`;
                      }}
                    >
                      {t.actions.continueStudying}
                    </Button>
                    {progress.next_exam && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1 h-7 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to specific exam
                        }}
                      >
                        {progress.next_exam}
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Show course menu
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </Button>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Action */}
      {courses.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
          >
            {spanishTranslations.actions.view} {t.title}
          </Button>
        </div>
      )}
    </Card>
  );
}