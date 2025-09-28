import { createSupabaseClient } from "@/utils/supabase/server";
import { JuegosSection } from "@/components/academia/juegos/juegos-section";
import { CourseLayoutWrapper } from "@/components/academia/course-layout-wrapper";

interface JuegosPageProps {
  params: {
    idioma: string;
    nivel: string;
  };
}

export default async function JuegosPage({ params }: JuegosPageProps) {
  const { idioma, nivel } = await params;
  const courseId = `${idioma}_${nivel.toLowerCase()}`;

  // Mock user for demo mode
  const user = {
    id: "demo-user-123",
    email: "demo@neolingus.com",
    user_metadata: { full_name: "Demo User" }
  };

  // Get user's game history for this course (mock data for demo)
  const gameHistory: any[] = [];

  return (
    <CourseLayoutWrapper user={user} language={idioma} level={nivel}>
      <JuegosSection gameHistory={gameHistory} />
    </CourseLayoutWrapper>
  );
}