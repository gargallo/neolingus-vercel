import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CourseContextProvider } from "@/components/academia/course-context-provider";
import { loadCourseConfiguration } from "@/lib/exam-engine/utils/config-loader";
import { notFound } from "next/navigation";

interface CourseLayoutProps {
  children: React.ReactNode;
  params: {
    idioma: string;
    nivel: string;
  };
}

export default async function CourseLayout({ 
  children, 
  params 
}: CourseLayoutProps) {
  const { idioma, nivel } = await params;
  const courseId = `${idioma}_${nivel.toLowerCase()}`;
  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return redirect('/sign-in');
  }

  // Load course configuration
  let courseConfig;
  try {
    courseConfig = await loadCourseConfiguration(courseId);
  } catch (error) {
    console.error('Failed to load course configuration:', error);
    return notFound();
  }

  return (
    <CourseContextProvider courseConfig={courseConfig} userId={user.id}>
      {children}
    </CourseContextProvider>
  );
}
