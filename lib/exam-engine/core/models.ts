import {
  Course,
  UserProfile,
  CourseProgress,
  ExamSession,
  ExamQuestion,
  UserAnswer,
  AITutorContext,
  CertificationModule,
} from "../types";
import { z } from "zod";

// Course validation schema
export const CourseSchema = z.object({
  id: z.string().uuid(),
  language: z.string().min(1),
  level: z.string().min(1),
  provider: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  examTypes: z.array(z.string()).min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

// User profile validation schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  preferredLanguage: z.string().min(1),
  timezone: z.string().min(1),
  gdprConsent: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

// Course progress validation schema
export const CourseProgressSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  overallProgress: z.number().min(0).max(100),
  lastAccessed: z.string().datetime(),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.string().datetime(),
});

// Exam session validation schema
export const ExamSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  examType: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(["started", "in_progress", "completed", "paused"]),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  timeLimit: z.number().min(1),
  currentQuestionIndex: z.number().min(0),
  score: z.number().min(0).optional(),
  maxScore: z.number().min(0).optional(),
  createdAt: z.string().datetime(),
});

// Exam question validation schema
export const ExamQuestionSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  questionNumber: z.number().min(1),
  questionText: z.string().min(1),
  questionType: z.enum([
    "multiple_choice",
    "written_response",
    "listening",
    "speaking",
  ]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().or(z.array(z.string())).optional(),
  points: z.number().min(1),
  timeLimit: z.number().min(1).optional(),
  createdAt: z.string().datetime(),
});

// User answer validation schema
export const UserAnswerSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  questionId: z.string().uuid(),
  answer: z.string().min(1),
  answeredAt: z.string().datetime(),
  isCorrect: z.boolean().optional(),
  pointsEarned: z.number().min(0).optional(),
  feedback: z.string().optional(),
});

// AI tutor context validation schema
export const AITutorContextSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  aiSessionMetadata: z.object({
    sessionId: z.string().uuid(),
    provider: z.enum(['anthropic', 'openai']),
    model: z.string(),
    createdAt: z.string(),
  }),
  topic: z.string().min(1),
  language: z.string().min(1).optional(),
  dialect: z.string().min(1).optional(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional(),
  status: z.enum(["active", "completed", "expired"]),
  metadata: z.record(z.string(), z.any()).optional(),
  createdAt: z.string().datetime(),
});

// Certification module validation schema
export const CertificationModuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  provider: z.string().min(1),
  officialUrl: z.string().url().optional(),
  supportedLanguages: z.array(z.string()).min(1),
  certificationLevels: z.array(z.string()).min(1),
  examTypes: z.array(z.string()).min(1),
  cefrAlignment: z.record(z.string(), z.string()).optional(),
  regionalVariants: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

// Validation functions
export function validateCourse(course: unknown): course is Course {
  try {
    CourseSchema.parse(course);
    return true;
  } catch {
    return false;
  }
}

export function validateUserProfile(profile: unknown): profile is UserProfile {
  try {
    UserProfileSchema.parse(profile);
    return true;
  } catch {
    return false;
  }
}

export function validateCourseProgress(
  progress: Record<string, unknown>
): progress is CourseProgress {
  try {
    CourseProgressSchema.parse(progress);
    return true;
  } catch {
    return false;
  }
}

export function validateExamSession(session: unknown): session is ExamSession {
  try {
    ExamSessionSchema.parse(session);
    return true;
  } catch {
    return false;
  }
}

export function validateExamQuestion(question: unknown): question is ExamQuestion {
  try {
    ExamQuestionSchema.parse(question);
    return true;
  } catch {
    return false;
  }
}

export function validateUserAnswer(answer: unknown): answer is UserAnswer {
  try {
    UserAnswerSchema.parse(answer);
    return true;
  } catch {
    return false;
  }
}

export function validateAITutorContext(
  context: Record<string, unknown>
): context is AITutorContext {
  try {
    AITutorContextSchema.parse(context);
    return true;
  } catch {
    return false;
  }
}

export function validateCertificationModule(
  module: Record<string, unknown>
): module is CertificationModule {
  try {
    CertificationModuleSchema.parse(module);
    return true;
  } catch {
    return false;
  }
}

// Data transformation functions
export function transformCourseToDB(course: Course): Record<string, unknown> {
  return {
    id: course.id,
    language: course.language,
    level: course.level,
    provider: course.provider,
    title: course.title,
    description: course.description,
    exam_types: course.examTypes,
    created_at: course.createdAt,
    updated_at: course.updatedAt,
  };
}

export function transformCourseFromDB(dbCourse: Record<string, unknown>): Course {
  return {
    id: dbCourse.id,
    language: dbCourse.language,
    level: dbCourse.level,
    provider: dbCourse.provider,
    title: dbCourse.title,
    description: dbCourse.description,
    examTypes: dbCourse.exam_types,
    createdAt: dbCourse.created_at,
    updatedAt: dbCourse.updated_at,
  };
}

export function transformUserProfileToDB(profile: UserProfile): Record<string, unknown> {
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.fullName,
    preferred_language: profile.preferredLanguage,
    timezone: profile.timezone,
    gdpr_consent: profile.gdprConsent,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  };
}

export function transformUserProfileFromDB(dbProfile: Record<string, unknown>): UserProfile {
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    fullName: dbProfile.full_name,
    preferredLanguage: dbProfile.preferred_language,
    timezone: dbProfile.timezone,
    gdprConsent: dbProfile.gdpr_consent,
    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
  };
}

// Export schemas for use in other parts of the application
export {
  CourseSchema,
  UserProfileSchema,
  CourseProgressSchema,
  ExamSessionSchema,
  ExamQuestionSchema,
  UserAnswerSchema,
  AITutorContextSchema,
  CertificationModuleSchema,
};
