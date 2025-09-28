'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Course {
  course_id: string;
  subscription_status: string;
  access_expires_at?: string;
  courses: {
    id: string;
    title: string;
    language: string;
    level: string;
    institution: string;
    description: string;
    cultural_context: string[];
    image_url?: string;
  };
}

interface CoursesGridProps {
  courses: Course[];
}

export function CoursesGrid({ courses }: CoursesGridProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <BookOpen className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-lg font-semibold text-slate-700">
            No tienes cursos activos
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Suscríbete a un curso para acceder a simuladores de examen y contenido de preparación
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href="/protected/pricing">
                Ver Planes Disponibles
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((userCourse) => {
        const course = userCourse.courses;
        const isExpiringSoon = userCourse.access_expires_at && 
          new Date(userCourse.access_expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        return (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {course.institution}
                  </CardDescription>
                </div>
                <div className="flex flex-col space-y-1">
                  <Badge variant="outline">
                    {course.level}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {course.language === 'valenciano' ? '🏛️ Valencià' : 
                     course.language === 'english' ? '🇬🇧 English' :
                     course.language === 'catalan' ? '🏛️ Català' : course.language}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                {course.description}
              </p>
              
              {course.cultural_context && course.cultural_context.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-700 mb-2">Contexto Cultural:</p>
                  <div className="flex flex-wrap gap-1">
                    {course.cultural_context.slice(0, 2).map((context, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {context}
                      </Badge>
                    ))}
                    {course.cultural_context.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{course.cultural_context.length - 2} más
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* Subscription Status */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Estado:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">Activo</span>
                  </div>
                </div>

                {/* Expiration Warning */}
                {isExpiringSoon && userCourse.access_expires_at && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <div>
                        <p className="text-xs font-medium text-yellow-800">
                          Expira pronto
                        </p>
                        <p className="text-xs text-yellow-600">
                          {new Date(userCourse.access_expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button asChild className="flex-1">
                    <Link href={`/dashboard/${course.language}/${course.level.toLowerCase()}`}>
                      Acceder al Curso
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/${course.language}/${course.level.toLowerCase()}/examens`}>
                      <Trophy className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}