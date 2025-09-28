import { createSupabaseClient } from "@/utils/supabase/server";
import { PracticaSection } from "@/components/academia/practica/practica-section";
import { CourseLayoutWrapper } from "@/components/academia/course-layout-wrapper";

interface PracticaPageProps {
  params: {
    idioma: string;
    nivel: string;
  };
}

export default async function PracticaPage({ params }: PracticaPageProps) {
  const { idioma, nivel } = await params;
  const courseId = `${idioma}_${nivel.toLowerCase()}`;

  // Mock user for demo mode
  const user = {
    id: "demo-user-123",
    email: "demo@neolingus.com",
    user_metadata: { full_name: "Demo User" }
  };

  // Get user's practice history for this course (mock data for demo)
  const practiceHistory: any[] = [];

  return (
    <CourseLayoutWrapper user={user} language={idioma} level={nivel}>
      <PracticaSection practiceHistory={practiceHistory} />
    </CourseLayoutWrapper>
  );
}