import { createSupabaseClient } from "@/utils/supabase/server";
import { EstadisticasSection } from "@/components/academia/estadisticas/estadisticas-section";
import { CourseLayoutWrapper } from "@/components/academia/course-layout-wrapper";

interface EstadisticasPageProps {
  params: {
    idioma: string;
    nivel: string;
  };
}

export default async function EstadisticasPage({ params }: EstadisticasPageProps) {
  const { idioma, nivel } = await params;
  const courseId = `${idioma}_${nivel.toLowerCase()}`;

  // Mock user for demo mode
  const user = {
    id: "demo-user-123",
    email: "demo@neolingus.com",
    user_metadata: { full_name: "Demo User" }
  };

  // Mock statistics data for demo
  const statsData = {
    exams: [],
    practice: [],
    progress: null,
    timeSpent: []
  };

  return (
    <CourseLayoutWrapper user={user} language={idioma} level={nivel}>
      <EstadisticasSection statsData={statsData} />
    </CourseLayoutWrapper>
  );
}