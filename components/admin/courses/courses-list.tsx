"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, Users, BookOpen, Globe, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Course {
  id: string;
  course_id: string;
  title: string;
  language: string;
  level: string;
  institution: string;
  region: string;
  description: string | null;
  cultural_context: string[] | null;
  image_url: string | null;
  available: boolean;
  created_at: string;
  enrollmentCount: number;
  examSessionCount: number;
}

interface CoursesListProps {
  courses: Course[];
  adminRole?: string;
}

export default function CoursesList({ courses, adminRole }: CoursesListProps) {
  const router = useRouter();
  const [updatingCourse, setUpdatingCourse] = useState<string | null>(null);
  
  const canEdit = ['super_admin', 'admin', 'course_manager'].includes(adminRole || '');
  const canDelete = ['super_admin', 'admin'].includes(adminRole || '');

  const handleAvailabilityToggle = async (courseId: string, currentAvailability: boolean) => {
    setUpdatingCourse(courseId);
    
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !currentAvailability })
      });

      if (response.ok) {
        // Refresh the page or update local state
        window.location.reload();
      } else {
        console.error('Failed to update course availability');
      }
    } catch (error) {
      console.error('Error updating course:', error);
    } finally {
      setUpdatingCourse(null);
    }
  };

  const handleAction = async (action: string, course: Course) => {
    switch (action) {
      case 'view':
        router.push(`/admin/courses/${course.course_id}`);
        break;
      case 'edit':
        router.push(`/admin/courses/${course.course_id}/edit`);
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) {
          try {
            const response = await fetch(`/api/admin/courses/${course.course_id}`, {
              method: 'DELETE'
            });
            if (response.ok) {
              window.location.reload();
            }
          } catch (error) {
            console.error('Error deleting course:', error);
          }
        }
        break;
      case 'students':
        router.push(`/admin/courses/${course.course_id}/students`);
        break;
      case 'exams':
        router.push(`/admin/courses/${course.course_id}/exams`);
        break;
    }
  };

  const getLevelColor = (level: string) => {
    const colors: { [key: string]: string } = {
      'A1': 'bg-green-100 text-green-800',
      'A2': 'bg-blue-100 text-blue-800',
      'B1': 'bg-yellow-100 text-yellow-800',
      'B2': 'bg-orange-100 text-orange-800',
      'C1': 'bg-red-100 text-red-800',
      'C2': 'bg-purple-100 text-purple-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getLanguageFlag = (language: string) => {
    const flags: { [key: string]: string } = {
      'english': '🇬🇧',
      'valenciano': '🏴‍☠️', // Valencia flag or custom
      'catalan': '🏴‍☠️',
      'spanish': '🇪🇸',
      'french': '🇫🇷',
      'german': '🇩🇪'
    };
    return flags[language.toLowerCase()] || '🌍';
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="p-6 hover:shadow-md transition-shadow">
            {/* Course Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getLanguageFlag(course.language)}</span>
                  <h3 className="font-semibold text-lg">{course.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getLevelColor(course.level)}>
                    {course.level}
                  </Badge>
                  <Badge variant="outline">
                    {course.institution}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={course.available}
                  onCheckedChange={() => handleAvailabilityToggle(course.course_id, course.available)}
                  disabled={updatingCourse === course.course_id || !canEdit}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleAction('view', course)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    
                    {canEdit && (
                      <DropdownMenuItem onClick={() => handleAction('edit', course)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Course
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={() => handleAction('students', course)}>
                      <Users className="w-4 h-4 mr-2" />
                      View Students
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleAction('exams', course)}>
                      <Award className="w-4 h-4 mr-2" />
                      Manage Exams
                    </DropdownMenuItem>
                    
                    {canDelete && (
                      <DropdownMenuItem 
                        onClick={() => handleAction('delete', course)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Course
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Course Description */}
            {course.description && (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {course.description}
              </p>
            )}

            {/* Cultural Context */}
            {course.cultural_context && course.cultural_context.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Cultural Context:</p>
                <div className="flex flex-wrap gap-1">
                  {course.cultural_context.slice(0, 3).map((context, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {context}
                    </Badge>
                  ))}
                  {course.cultural_context.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{course.cultural_context.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Course Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm font-medium">{course.enrollmentCount}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <BookOpen className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm font-medium">{course.examSessionCount}</p>
                <p className="text-xs text-muted-foreground">Exams</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Globe className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-sm font-medium">{course.region}</p>
                <p className="text-xs text-muted-foreground">Region</p>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="mt-4 pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Created: {new Date(course.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${course.available ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>{course.available ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <Card className="p-8 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">No courses found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by creating your first course.
          </p>
          {canEdit && (
            <Button onClick={() => router.push('/admin/courses/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}