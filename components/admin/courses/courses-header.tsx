"use client";

import { Button } from "@/components/ui/button";
import { Plus, BookOpen, BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CoursesHeaderProps {
  adminRole?: string;
}

export default function CoursesHeader({ adminRole }: CoursesHeaderProps) {
  const router = useRouter();
  
  const canCreateCourse = ['super_admin', 'admin', 'course_manager'].includes(adminRole || '');

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Course Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage language courses, exams, and cultural contexts
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Analytics */}
        {(adminRole === 'admin' || adminRole === 'super_admin') && (
          <Link href="/admin/analytics/courses">
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Course Analytics
            </Button>
          </Link>
        )}

        {/* Bulk Import */}
        {canCreateCourse && (
          <Button variant="outline" onClick={() => router.push('/admin/courses/import')}>
            <BookOpen className="w-4 h-4 mr-2" />
            Import Courses
          </Button>
        )}

        {/* Create Course */}
        {canCreateCourse && (
          <Button onClick={() => router.push('/admin/courses/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        )}
      </div>
    </div>
  );
}