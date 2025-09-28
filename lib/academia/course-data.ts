import {
  loadCourseConfiguration,
  getCoursesByLanguage as getConfigCoursesByLanguage,
} from '@/lib/exam-engine/utils/config-loader';
import type { CourseConfiguration } from '@/lib/exam-engine/types/course-config';
import type { Database } from '@/utils/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ResolvedCourse {
  id: string;
  dbId: string;
  title: string;
  language: string;
  level: string;
  institution: string;
  description: string;
  culturalContext: string[];
  imageUrl: string | null;
  examProviders: string[];
  totalExams: number;
  config?: CourseConfiguration | null;
}

export interface CourseEnrollment {
  courseId: string;
  subscriptionStatus: string;
  accessExpiresAt: string | null;
}

export interface CourseProgressSummary {
  totalSessions: number;
  completedSessions: number;
  passRate: number;
  averageScore: number;
  lastSession: string | null;
  achievements: number;
}

type DbClient = SupabaseClient<Database>;

const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function buildCourseSlug(language: string, level: string): string {
  return `${language.toLowerCase()}_${level.toLowerCase()}`;
}

function orderByLevel<T extends { level: string }>(entries: T[]): T[] {
  return entries.sort((a, b) => {
    const aIndex = LEVEL_ORDER.indexOf(a.level.toUpperCase());
    const bIndex = LEVEL_ORDER.indexOf(b.level.toUpperCase());
    if (aIndex === -1 || bIndex === -1) {
      return a.level.localeCompare(b.level);
    }
    return aIndex - bIndex;
  });
}

async function enrichCourseWithConfig(
  course: Database['public']['Tables']['courses']['Row'],
  slug: string
): Promise<Omit<ResolvedCourse, 'config'> & { config?: CourseConfiguration | null }> {
  try {
    const config = await loadCourseConfiguration(slug);
    const providers = Object.keys(config.providers || {});
    const totalExams = providers.reduce((sum, providerId) => {
      const exams = config.providers[providerId]?.examIds || [];
      return sum + exams.length;
    }, 0);

    return {
      id: slug,
      dbId: course.id,
      title: config.metadata.title,
      language: course.language,
      level: course.level.toUpperCase(),
      institution: config.metadata.institution,
      description: config.metadata.description || course.description || '',
      culturalContext: config.metadata.culturalContext || [],
      imageUrl: null,
      examProviders: providers,
      totalExams,
      config,
    };
  } catch (error) {
    console.warn('[course-data] Missing course configuration for slug', slug, error);
    return {
      id: slug,
      dbId: course.id,
      title: course.title,
      language: course.language,
      level: course.level.toUpperCase(),
      institution: course.certification_type || 'Academia Neolingus',
      description: course.description || '',
      culturalContext: [],
      imageUrl: null,
      examProviders: [],
      totalExams: 0,
    };
  }
}

export async function fetchCoursesByLanguage(
  client: DbClient,
  language: string
): Promise<ResolvedCourse[]> {
  const normalizedLanguage = language.toLowerCase();

  const { data, error } = await client
    .from('courses')
    .select('id, language, level, certification_type, title, description, components, assessment_rubric, created_at')
    .eq('is_active', true)
    .eq('language', normalizedLanguage)
    .order('level', { ascending: true });

  if (error) {
    console.error('[course-data] Failed to fetch courses by language', { language, error });
  }

  if (!data || data.length === 0) {
    const configFallback = getConfigCoursesByLanguage(normalizedLanguage);
    if (!configFallback.length) {
      return [];
    }

    const fallbackCourses = configFallback.map((config) => {
      const providers = Object.keys(config.providers || {});
      const totalExams = providers.reduce((sum, providerId) => {
        const exams = config.providers[providerId]?.examIds || [];
        return sum + exams.length;
      }, 0);

      return {
        id: config.courseId,
        dbId: config.courseId,
        title: config.metadata.title,
        language: config.metadata.language,
        level: config.metadata.level.toUpperCase(),
        institution: config.metadata.institution,
        description: config.metadata.description || '',
        culturalContext: config.metadata.culturalContext || [],
        imageUrl: null,
        examProviders: providers,
        totalExams,
        config,
      } satisfies ResolvedCourse;
    });

    return orderByLevel(fallbackCourses);
  }

  const courses = await Promise.all(
    (data || []).map(async (course) => {
      const slug = buildCourseSlug(course.language, course.level);
      return enrichCourseWithConfig(course, slug);
    })
  );

  return orderByLevel(courses);
}

export async function fetchUserCourseEnrollments(
  client: DbClient,
  userId: string
): Promise<CourseEnrollment[]> {
  const { data, error } = await client
    .from('user_course_enrollments')
    .select('course_id, subscription_status, access_expires_at')
    .eq('user_id', userId);

  if (!error && data) {
    return data.map((row) => ({
      courseId: row.course_id,
      subscriptionStatus: row.subscription_status || 'active',
      accessExpiresAt: row.access_expires_at,
    }));
  }

  if (error) {
    if ((error as { code?: string }).code !== '42P01') {
      console.error('[course-data] Failed to fetch user_course_enrollments', { userId, error });
    }
  }

  const fallback = await client
    .from('user_courses')
    .select('course_id, subscription_status, access_expires_at')
    .eq('user_id', userId);

  if (fallback.error) {
    console.error('[course-data] Failed to fetch legacy user_courses', { userId, error: fallback.error });
    return [];
  }

  return (fallback.data || []).map((row) => ({
    courseId: row.course_id,
    subscriptionStatus: row.subscription_status || 'active',
    accessExpiresAt: row.access_expires_at,
  }));
}

export async function fetchCourseProgressSummaries(
  client: DbClient,
  userId: string,
  courseIds: string[]
): Promise<Record<string, CourseProgressSummary>> {
  if (!courseIds.length) {
    return {};
  }

  const uniqueCourseIds = Array.from(new Set(courseIds));

  const [progressResult, sessionsResult] = await Promise.all([
    client
      .from('user_course_progress')
      .select('course_id, last_activity, strengths')
      .eq('user_id', userId)
      .in('course_id', uniqueCourseIds),
    client
      .from('exam_sessions')
      .select('course_id, started_at, score, is_completed')
      .eq('user_id', userId)
      .in('course_id', uniqueCourseIds),
  ]);

  const summaries = new Map<string, CourseProgressSummary & { scoreAccumulator: number }>();

  if (!progressResult.error && progressResult.data) {
    progressResult.data.forEach((row) => {
      const strengths = Array.isArray(row.strengths) ? row.strengths.length : 0;
      summaries.set(row.course_id, {
        totalSessions: 0,
        completedSessions: 0,
        passRate: 0,
        averageScore: 0,
        lastSession: row.last_activity,
        achievements: strengths,
        scoreAccumulator: 0,
      });
    });
  } else if (progressResult.error) {
    console.error('[course-data] Failed to fetch user_course_progress', { userId, error: progressResult.error });
  }

  if (!sessionsResult.error && sessionsResult.data) {
    sessionsResult.data.forEach((session) => {
      const existing = summaries.get(session.course_id) || {
        totalSessions: 0,
        completedSessions: 0,
        passRate: 0,
        averageScore: 0,
        lastSession: null as string | null,
        achievements: 0,
        scoreAccumulator: 0,
      };

      existing.totalSessions += 1;
      if (session.is_completed) {
        existing.completedSessions += 1;
      }
      if (typeof session.score === 'number') {
        existing.scoreAccumulator += session.score;
      }

      if (!existing.lastSession || (session.started_at && session.started_at > existing.lastSession)) {
        existing.lastSession = session.started_at;
      }

      summaries.set(session.course_id, existing);
    });
  } else if (sessionsResult.error) {
    console.error('[course-data] Failed to fetch exam_sessions', { userId, error: sessionsResult.error });
  }

  const result: Record<string, CourseProgressSummary> = {};

  summaries.forEach((value, key) => {
    const averageScore = value.completedSessions > 0
      ? Math.round((value.scoreAccumulator / value.completedSessions) * 100)
      : 0;
    const passRate = value.totalSessions > 0
      ? Math.round((value.completedSessions / value.totalSessions) * 100)
      : 0;

    result[key] = {
      totalSessions: value.totalSessions,
      completedSessions: value.completedSessions,
      passRate,
      averageScore,
      lastSession: value.lastSession,
      achievements: value.achievements,
    };
  });

  return result;
}
