import { createSupabaseClient } from "@/utils/supabase/server";
import { TareasSection } from "@/components/academia/tareas/tareas-section";
import { CourseLayoutWrapper } from "@/components/academia/course-layout-wrapper";

interface TareasPageProps {
  params: {
    idioma: string;
    nivel: string;
  };
}

export default async function TareasPage({ params }: TareasPageProps) {
  const { idioma, nivel } = await params;
  const courseId = `${idioma}_${nivel.toLowerCase()}`;

  // Mock user for demo mode
  const user = {
    id: "demo-user-123",
    email: "demo@neolingus.com",
    user_metadata: { full_name: "Demo User" }
  };

  // Get user's task history for this course (mock data for demo)
  const taskHistory: any[] = [];

  return (
    <CourseLayoutWrapper user={user} language={idioma} level={nivel}>
      <TareasSection taskHistory={taskHistory} />
    </CourseLayoutWrapper>
  );
}