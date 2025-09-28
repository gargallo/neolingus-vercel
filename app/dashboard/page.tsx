import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { CourseSelectionInterface } from "@/components/academia/course-selection-interface";

export const metadata: Metadata = {
  title: "NeoLingus - Dashboard",
  description: "Descubre rutas personalizadas de aprendizaje con la IA de NeoLingus.",
  keywords: ["idiomas", "cursos", "inglés", "valenciano", "Cambridge", "EOI", "JQCV", "certificación"],
  openGraph: {
    title: "Academia Neolingus - Cursos de Idiomas",
    description: "Selecciona tu curso de idiomas y comienza tu preparación",
    type: "website",
  },
};

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

// Fetch all available courses
async function fetchAvailableCourses(client: any): Promise<Course[]> {
  try {
    const { data: courses, error } = await client
      .from('courses')
      .select(`
        id,
        title,
        language,
        level,
        certification_type,
        description,
        is_active
      `)
      .eq('is_active', true)
      .order('language', { ascending: true })
      .order('level', { ascending: true });

    if (error) {
      console.error('Database error fetching courses:', error);
      return getDefaultCourses();
    }

    if (!courses || courses.length === 0) {
      return getDefaultCourses();
    }

    // Transform to match expected Course interface
    return courses.map((course: any) => ({
      id: course.id,
      title: course.title,
      language: course.language,
      level: course.level,
      certification_type: course.certification_type.toLowerCase(),
      description: course.description,
      components: ["reading", "writing", "listening", "speaking"],
      exam_providers: [course.certification_type.toLowerCase()],
      total_exams: 15,
      difficulty: getDifficultyFromLevel(course.level),
      duration_weeks: 12,
      enrolled_count: 0,
      instructor: getInstructorForCourse(course.language)
    }));
  } catch (error) {
    console.error('Error fetching available courses:', error);
    return getDefaultCourses();
  }
}

// Fetch user's current enrollments
async function fetchUserEnrollments(client: any, userId: string): Promise<UserEnrollment[]> {
  try {
    const { data: enrollments, error } = await client
      .from('user_course_enrollments')
      .select(`
        course_id,
        subscription_status,
        subscription_tier,
        access_expires_at
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Database error fetching enrollments:', error);
      return [];
    }

    return enrollments || [];
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    return [];
  }
}

function getDifficultyFromLevel(level: string): 'beginner' | 'intermediate' | 'advanced' {
  const lowerLevel = level.toLowerCase();
  if (lowerLevel.includes('a1') || lowerLevel.includes('a2')) return 'beginner';
  if (lowerLevel.includes('b1') || lowerLevel.includes('b2')) return 'intermediate';
  return 'advanced';
}

function getInstructorForCourse(language: string): string {
  const instructors = {
    english: ['Sarah Johnson', 'Michael Brown', 'Emily Davis'],
    valenciano: ['Carme Martínez', 'Joan Pérez', 'Anna Soler'],
    spanish: ['Carmen García', 'Antonio López', 'María Fernández']
  };

  const langInstructors = instructors[language as keyof typeof instructors] || instructors.english;
  return langInstructors[Math.floor(Math.random() * langInstructors.length)];
}

function getDefaultCourses(): Course[] {
  return [
    {
      id: "valenciano_c1",
      title: "Valencià C1 - JQCV Certification",
      language: "valenciano",
      level: "c1",
      certification_type: "jqcv",
      description: "Certificació de valencià nivell avançat segons estàndards JQCV i MECR C1. Prepara't per a l'examen oficial amb continguts especialitzats.",
      components: ["reading", "writing", "listening", "speaking"],
      exam_providers: ["jqcv"],
      total_exams: 15,
      difficulty: 'advanced',
      duration_weeks: 16,
      enrolled_count: 342,
      instructor: "Carme Martínez"
    },
    {
      id: "ingles_b2",
      title: "English B2 - EOI Certification",
      language: "english",
      level: "b2",
      certification_type: "eoi",
      description: "Upper-intermediate English certification following EOI standards and CEFR B2 guidelines. Perfect for academic and professional advancement.",
      components: ["reading", "writing", "listening", "speaking"],
      exam_providers: ["eoi"],
      total_exams: 22,
      difficulty: 'intermediate',
      duration_weeks: 12,
      enrolled_count: 567,
      instructor: "Sarah Johnson"
    },
    {
      id: "ingles_c1",
      title: "English C1 - Cambridge Advanced",
      language: "english",
      level: "c1",
      certification_type: "cambridge",
      description: "Advanced English certification with Cambridge CAE preparation. Achieve fluency for university and professional environments.",
      components: ["reading", "writing", "listening", "speaking", "use_of_english"],
      exam_providers: ["cambridge"],
      total_exams: 18,
      difficulty: 'advanced',
      duration_weeks: 20,
      enrolled_count: 289,
      instructor: "Michael Brown"
    },
    {
      id: "valenciano_b2",
      title: "Valencià B2 - EOI Certification",
      language: "valenciano",
      level: "b2",
      certification_type: "eoi",
      description: "Certificació de valencià nivell intermedi alt segons EOI. Ideal per a la promoció professional i l'accés a la funció pública.",
      components: ["reading", "writing", "listening", "speaking"],
      exam_providers: ["eoi"],
      total_exams: 20,
      difficulty: 'intermediate',
      duration_weeks: 14,
      enrolled_count: 234,
      instructor: "Joan Pérez"
    },
    {
      id: "ingles_b1",
      title: "English B1 - General Intermediate",
      language: "english",
      level: "b1",
      certification_type: "general",
      description: "Intermediate English course covering everyday communication skills. Perfect foundation for B2 level preparation.",
      components: ["reading", "writing", "listening", "speaking"],
      exam_providers: ["eoi", "cambridge"],
      total_exams: 16,
      difficulty: 'intermediate',
      duration_weeks: 10,
      enrolled_count: 445,
      instructor: "Emily Davis"
    },
    {
      id: "valenciano_c2",
      title: "Valencià C2 - Superieur",
      language: "valenciano",
      level: "c2",
      certification_type: "jqcv",
      description: "Màxim nivell de certificació en valencià. Competència nativa per a l'ensenyament i professions especialitzades.",
      components: ["reading", "writing", "listening", "speaking", "cultural_knowledge"],
      exam_providers: ["jqcv"],
      total_exams: 12,
      difficulty: 'advanced',
      duration_weeks: 24,
      enrolled_count: 89,
      instructor: "Anna Soler"
    }
  ];
}

export default async function AcademiaPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isDemoMode = params?.demo === 'true';

  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  // Allow demo mode bypass
  if (!user && !isDemoMode) {
    return redirect("/sign-in");
  }

  // Use demo user ID in demo mode
  const userId = isDemoMode ? 'demo-user-123' : user!.id;

  // Fetch data
  const [availableCourses, userEnrollments] = await Promise.all([
    fetchAvailableCourses(client),
    !isDemoMode ? fetchUserEnrollments(client, userId) : []
  ]);

  return (
    <CourseSelectionInterface
      courses={availableCourses}
      userEnrollments={userEnrollments}
      userId={userId}
      user={user}
      demoMode={isDemoMode}
    />
  );
}
