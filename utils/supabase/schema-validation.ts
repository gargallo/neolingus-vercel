/**
 * Supabase Database Schema Validation
 * 
 * Comprehensive validation functions for all academia entities ensuring data integrity
 * with the MCP integration and proper error handling with type safety.
 * 
 * Based on: supabase/migrations/20250910000000_create_academy_system.sql
 * Types from: lib/types/academia.ts
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { z } from 'zod';
import type {
  // Base types
  UUID,
  JSONObject,
  Timestamp,
  PercentageValue,
  
  // Academia entities
  UserProfile,
  CertificationModule,
  Course,
  UserCourseProgress,
  ExamSession,
  AITutorContext,
  
  // Academia unified types
  AcademiaUserEnrollment,
  AcademiaExamSessionComplete,
  
  // Enums
  DataRetentionPreference,
  UserProfileStatus,
  PreferredLanguage,
  CertificationPhase,
  LanguageCode,
  CourseLanguage,
  CourseLevel,
  CertificationType,
  SkillType,
  ProgressState,
  ExamSessionType,
  ExamComponent,
  ExamSessionState,
  AITutorContextType,
  LearningContextState,
  
  // Validation types
  AcademiaDataIntegrityRules,
  DEFAULT_ACADEMIA_VALIDATION_RULES
} from '../../lib/types/academia';

// =============================================================================
// ZOD SCHEMA DEFINITIONS
// =============================================================================

/**
 * Base UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Base timestamp validation schema
 */
export const timestampSchema = z.union([z.date(), z.string().datetime()]).transform((val) => 
  typeof val === 'string' ? new Date(val) : val
);

/**
 * Percentage value schema (0.0 to 1.0)
 */
export const percentageSchema = z.number().min(0.0).max(1.0);

/**
 * JSON object schema
 */
export const jsonObjectSchema = z.record(z.unknown());

// =============================================================================
// ENTITY VALIDATION SCHEMAS
// =============================================================================

/**
 * UserProfile validation schema
 */
export const userProfileSchema = z.object({
  id: uuidSchema,
  email: z.string().email().max(255),
  full_name: z.string().min(2).max(255),
  preferred_language: z.enum(['en', 'es', 'ca', 'fr', 'de', 'it', 'pt']),
  gdpr_consent: z.boolean(),
  gdpr_consent_date: timestampSchema,
  lopd_consent: z.boolean(),
  data_retention_preference: z.enum(['minimal', 'standard', 'extended']),
  created_at: timestampSchema,
  last_active: timestampSchema,
  status: z.enum(['active', 'inactive', 'pending_verification', 'suspended', 'pending_deletion']),
  email_verified: z.boolean(),
  email_verified_at: timestampSchema.optional().nullable(),
  updated_at: timestampSchema
}).refine((data) => {
  // GDPR consent must be true and have consent date
  return data.gdpr_consent === true && data.gdpr_consent_date instanceof Date;
}, {
  message: "GDPR consent required with valid consent date",
  path: ["gdpr_consent"]
});

/**
 * CertificationModule validation schema
 */
export const certificationModuleSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/, "Code must be lowercase alphanumeric with underscores"),
  language: z.enum(['en', 'es', 'va', 'ca', 'fr', 'de', 'it', 'pt']),
  certification_body: z.string().min(1).max(255),
  official_website: z.string().url().optional(),
  exam_structure: jsonObjectSchema,
  content_config: jsonObjectSchema,
  compliance_requirements: jsonObjectSchema,
  is_active: z.boolean(),
  phase: z.enum([1, 2, 3]),
  launch_date: timestampSchema.optional().nullable(),
  version: z.string().max(20),
  created_at: timestampSchema,
  updated_at: timestampSchema
}).refine((data) => {
  // Active modules must have launch date
  return !data.is_active || (data.launch_date && data.launch_date instanceof Date);
}, {
  message: "Active modules must have a valid launch date",
  path: ["launch_date"]
});

/**
 * Course validation schema
 */
export const courseSchema = z.object({
  id: uuidSchema,
  certification_module_id: uuidSchema,
  language: z.enum(['english', 'valenciano', 'spanish', 'french', 'german', 'italian', 'portuguese']),
  level: z.enum(['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'basic', 'intermediate', 'advanced', 'elemental', 'mitja', 'superior']),
  certification_type: z.enum(['eoi', 'jqcv', 'delf', 'dalf', 'goethe', 'cambridge', 'ielts', 'toefl', 'dele', 'cils', 'celpe']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  components: z.array(z.enum(['reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary'])),
  assessment_rubric: jsonObjectSchema,
  is_active: z.boolean(),
  created_at: timestampSchema,
  updated_at: timestampSchema
}).refine((data) => {
  // Components array must not be empty
  return data.components.length > 0;
}, {
  message: "Course must have at least one component",
  path: ["components"]
});

/**
 * UserCourseEnrollment validation schema
 */
export const userCourseEnrollmentSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  course_id: uuidSchema,
  enrollment_date: timestampSchema,
  subscription_status: z.enum(['active', 'expired', 'cancelled']),
  access_expires_at: timestampSchema.optional().nullable(),
  subscription_tier: z.enum(['basic', 'standard', 'premium']),
  created_at: timestampSchema,
  updated_at: timestampSchema
});

/**
 * UserCourseProgress validation schema
 */
export const userCourseProgressSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  course_id: uuidSchema,
  enrollment_date: timestampSchema,
  last_activity: timestampSchema,
  overall_progress: percentageSchema,
  component_progress: jsonObjectSchema,
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  readiness_score: percentageSchema,
  estimated_study_hours: z.number().int().min(0),
  target_exam_date: timestampSchema.optional().nullable(),
  created_at: timestampSchema,
  updated_at: timestampSchema
}).refine((data) => {
  // Component progress values must be valid percentages
  const componentProgress = data.component_progress as Record<string, unknown>;
  for (const [key, value] of Object.entries(componentProgress)) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      return false;
    }
  }
  return true;
}, {
  message: "All component progress values must be between 0.0 and 1.0",
  path: ["component_progress"]
});

/**
 * ExamSession validation schema
 */
export const examSessionSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  course_id: uuidSchema,
  progress_id: uuidSchema,
  session_type: z.enum(['practice', 'mock_exam', 'diagnostic']),
  component: z.enum(['reading', 'writing', 'listening', 'speaking']),
  started_at: timestampSchema,
  completed_at: timestampSchema.optional().nullable(),
  duration_seconds: z.number().int().min(0),
  responses: jsonObjectSchema,
  score: percentageSchema.optional().nullable(),
  detailed_scores: jsonObjectSchema,
  ai_feedback: z.string().optional(),
  improvement_suggestions: z.array(z.string()),
  is_completed: z.boolean(),
  session_data: jsonObjectSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema
}).refine((data) => {
  // Completed sessions must have completion timestamp and score
  if (data.is_completed) {
    return data.completed_at instanceof Date && typeof data.score === 'number';
  }
  return true;
}, {
  message: "Completed sessions must have completion timestamp and score",
  path: ["is_completed"]
});

/**
 * AITutorContext validation schema
 */
export const aiTutorContextSchema = z.object({
  id: uuidSchema,
  user_id: uuidSchema,
  course_id: uuidSchema,
  session_id: uuidSchema.optional().nullable(),
  context_type: z.enum(['general', 'session_specific', 'weakness_focused']),
  learning_profile: jsonObjectSchema,
  interaction_history: z.array(jsonObjectSchema).max(100),
  current_context: jsonObjectSchema,
  ai_session_metadata: jsonObjectSchema,
  created_at: timestampSchema,
  updated_at: timestampSchema,
  expires_at: timestampSchema
}).refine((data) => {
  // Expires_at must be in the future for active contexts
  return data.expires_at > new Date();
}, {
  message: "AI context expiration date must be in the future",
  path: ["expires_at"]
});

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validation result type
 */
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error type
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/**
 * Validation warning type
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/**
 * Validate UserProfile data
 */
export function validateUserProfile(data: unknown): ValidationResult<UserProfile> {
  try {
    const validData = userProfileSchema.parse(data) as UserProfile;
    const warnings: ValidationWarning[] = [];
    
    // Check for warnings
    if (validData.last_active < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
      warnings.push({
        field: 'last_active',
        message: 'User has been inactive for more than 30 days',
        code: 'INACTIVE_USER'
      });
    }
    
    return {
      isValid: true,
      data: validData,
      errors: [],
      warnings
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code.toUpperCase(),
          value: err.input
        })),
        warnings: []
      };
    }
    
    return {
      isValid: false,
      errors: [{
        field: 'unknown',
        message: 'Unknown validation error',
        code: 'UNKNOWN_ERROR'
      }],
      warnings: []
    };
  }
}

/**
 * Validate CertificationModule data
 */
export function validateCertificationModule(data: unknown): ValidationResult<CertificationModule> {
  try {
    const validData = certificationModuleSchema.parse(data) as CertificationModule;
    const warnings: ValidationWarning[] = [];
    
    // Check exam structure validity
    const examStructure = validData.exam_structure as any;
    if (examStructure && examStructure.components) {
      const totalWeight = examStructure.components.reduce(
        (sum: number, comp: any) => sum + (comp.weight_percentage || 0), 
        0
      );
      if (Math.abs(totalWeight - 100) > 0.01) {
        warnings.push({
          field: 'exam_structure.components',
          message: `Component weights sum to ${totalWeight}%, should be 100%`,
          code: 'INVALID_WEIGHT_DISTRIBUTION'
        });
      }
    }
    
    return {
      isValid: true,
      data: validData,
      errors: [],
      warnings
    };
  } catch (error) {
    return handleZodValidationError(error);
  }
}

/**
 * Validate Course data
 */
export function validateCourse(data: unknown): ValidationResult<Course> {
  try {
    const validData = courseSchema.parse(data) as Course;
    const warnings: ValidationWarning[] = [];
    
    // Check language-certification compatibility
    const languageCertificationMap: Record<string, string[]> = {
      'english': ['eoi', 'cambridge', 'ielts', 'toefl'],
      'valenciano': ['jqcv', 'eoi'],
      'spanish': ['dele', 'eoi'],
      'french': ['delf', 'dalf', 'eoi'],
      'german': ['goethe', 'eoi'],
      'italian': ['cils', 'eoi'],
      'portuguese': ['celpe', 'eoi']
    };
    
    const allowedCerts = languageCertificationMap[validData.language] || [];
    if (!allowedCerts.includes(validData.certification_type)) {
      warnings.push({
        field: 'certification_type',
        message: `Certification type '${validData.certification_type}' may not be suitable for language '${validData.language}'`,
        code: 'QUESTIONABLE_LANGUAGE_CERTIFICATION_COMBO'
      });
    }
    
    return {
      isValid: true,
      data: validData,
      errors: [],
      warnings
    };
  } catch (error) {
    return handleZodValidationError(error);
  }
}

/**
 * Validate UserCourseProgress data
 */
export function validateUserCourseProgress(data: unknown): ValidationResult<UserCourseProgress> {
  try {
    const validData = userCourseProgressSchema.parse(data) as UserCourseProgress;
    const warnings: ValidationWarning[] = [];
    
    // Check progress consistency
    const componentProgress = validData.component_progress as Record<string, number>;
    const componentValues = Object.values(componentProgress);
    
    if (componentValues.length > 0) {
      const avgComponentProgress = componentValues.reduce((sum, val) => sum + val, 0) / componentValues.length;
      const progressDifference = Math.abs(validData.overall_progress - avgComponentProgress);
      
      if (progressDifference > 0.2) {
        warnings.push({
          field: 'overall_progress',
          message: `Overall progress (${validData.overall_progress}) differs significantly from component average (${avgComponentProgress.toFixed(2)})`,
          code: 'PROGRESS_INCONSISTENCY'
        });
      }
    }
    
    return {
      isValid: true,
      data: validData,
      errors: [],
      warnings
    };
  } catch (error) {
    return handleZodValidationError(error);
  }
}

/**
 * Validate ExamSession data
 */
export function validateExamSession(data: unknown): ValidationResult<ExamSession> {
  try {
    const validData = examSessionSchema.parse(data) as ExamSession;
    const warnings: ValidationWarning[] = [];
    
    // Check session duration reasonableness
    const maxDurationHours = 4;
    const maxDurationSeconds = maxDurationHours * 60 * 60;
    
    if (validData.duration_seconds > maxDurationSeconds) {
      warnings.push({
        field: 'duration_seconds',
        message: `Session duration (${validData.duration_seconds}s) exceeds reasonable limit (${maxDurationHours}h)`,
        code: 'EXCESSIVE_DURATION'
      });
    }
    
    // Check score reasonableness for completed sessions
    if (validData.is_completed && validData.score !== null && validData.score !== undefined) {
      if (validData.score < 0.1) {
        warnings.push({
          field: 'score',
          message: 'Very low score may indicate session issues or need for additional support',
          code: 'LOW_PERFORMANCE'
        });
      }
    }
    
    return {
      isValid: true,
      data: validData,
      errors: [],
      warnings
    };
  } catch (error) {
    return handleZodValidationError(error);
  }
}

/**
 * Validate AITutorContext data
 */
export function validateAITutorContext(data: unknown): ValidationResult<AITutorContext> {
  try {
    const validData = aiTutorContextSchema.parse(data) as AITutorContext;
    const warnings: ValidationWarning[] = [];
    
    // Check interaction history size
    if (validData.interaction_history.length > 80) {
      warnings.push({
        field: 'interaction_history',
        message: `Interaction history approaching limit (${validData.interaction_history.length}/100)`,
        code: 'INTERACTION_HISTORY_NEAR_LIMIT'
      });
    }
    
    // Check context expiration
    const daysUntilExpiration = Math.ceil((validData.expires_at.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    if (daysUntilExpiration < 7) {
      warnings.push({
        field: 'expires_at',
        message: `Context expires in ${daysUntilExpiration} days`,
        code: 'CONTEXT_EXPIRING_SOON'
      });
    }
    
    return {
      isValid: true,
      data: validData,
      errors: [],
      warnings
    };
  } catch (error) {
    return handleZodValidationError(error);
  }
}

// =============================================================================
// CROSS-ENTITY VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate academia enrollment consistency
 */
export function validateAcademiaEnrollmentConsistency(
  enrollment: AcademiaUserEnrollment
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check user-progress consistency
  if (enrollment.progress.user_id !== enrollment.user.id) {
    errors.push({
      field: 'progress.user_id',
      message: 'Progress user ID must match enrollment user ID',
      code: 'USER_ID_MISMATCH'
    });
  }
  
  // Check course-progress consistency
  if (enrollment.progress.course_id !== enrollment.course.id) {
    errors.push({
      field: 'progress.course_id',
      message: 'Progress course ID must match enrollment course ID',
      code: 'COURSE_ID_MISMATCH'
    });
  }
  
  // Check component consistency
  const progressComponents = Object.keys(enrollment.progress.component_progress);
  const courseComponents = enrollment.course.components.map(c => c.skill_type);
  
  for (const component of progressComponents) {
    if (!courseComponents.includes(component as SkillType)) {
      warnings.push({
        field: 'component_progress',
        message: `Progress component '${component}' not found in course components`,
        code: 'COMPONENT_MISMATCH',
        value: component
      });
    }
  }
  
  // Check AI contexts consistency
  for (const context of enrollment.ai_contexts || []) {
    if (context.user_id !== enrollment.user.id) {
      errors.push({
        field: 'ai_contexts',
        message: 'AI context user ID must match enrollment user ID',
        code: 'AI_CONTEXT_USER_ID_MISMATCH'
      });
    }
    
    if (context.course_id !== enrollment.course.id) {
      errors.push({
        field: 'ai_contexts',
        message: 'AI context course ID must match enrollment course ID',
        code: 'AI_CONTEXT_COURSE_ID_MISMATCH'
      });
    }
  }
  
  // Check subscription status validity
  if (enrollment.enrollment.subscription_status === 'active' && 
      enrollment.enrollment.access_expires_at && 
      enrollment.enrollment.access_expires_at < new Date()) {
    warnings.push({
      field: 'enrollment.subscription_status',
      message: 'Active subscription has expired access date',
      code: 'EXPIRED_ACTIVE_SUBSCRIPTION'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate exam session progress linkage
 */
export function validateExamSessionProgressLinkage(
  session: ExamSession,
  progress: UserCourseProgress
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check basic ID consistency
  if (session.user_id !== progress.user_id) {
    errors.push({
      field: 'user_id',
      message: 'Session and progress must have matching user IDs',
      code: 'USER_ID_MISMATCH'
    });
  }
  
  if (session.course_id !== progress.course_id) {
    errors.push({
      field: 'course_id',
      message: 'Session and progress must have matching course IDs',
      code: 'COURSE_ID_MISMATCH'
    });
  }
  
  if (session.progress_id !== progress.id) {
    errors.push({
      field: 'progress_id',
      message: 'Session progress_id must match progress record ID',
      code: 'PROGRESS_ID_MISMATCH'
    });
  }
  
  // Check temporal consistency
  if (session.started_at < progress.enrollment_date) {
    warnings.push({
      field: 'started_at',
      message: 'Session started before user enrollment date',
      code: 'SESSION_BEFORE_ENROLLMENT'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate course certification module consistency
 */
export function validateCourseCertificationConsistency(
  course: Course,
  certificationModule: CertificationModule
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Check language consistency
  const courseLanguageToModuleLanguage: Record<string, string> = {
    'english': 'en',
    'spanish': 'es',
    'valenciano': 'va',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'portuguese': 'pt'
  };
  
  const expectedModuleLanguage = courseLanguageToModuleLanguage[course.language];
  if (expectedModuleLanguage && certificationModule.language !== expectedModuleLanguage) {
    warnings.push({
      field: 'language',
      message: `Course language '${course.language}' may not match module language '${certificationModule.language}'`,
      code: 'LANGUAGE_MISMATCH'
    });
  }
  
  // Check component compatibility
  const moduleStructure = certificationModule.exam_structure as any;
  if (moduleStructure && moduleStructure.components) {
    const moduleComponents = moduleStructure.components.map((c: any) => c.type);
    const courseComponentTypes = course.components.map(c => c.skill_type);
    
    for (const courseComponent of courseComponentTypes) {
      if (!moduleComponents.includes(courseComponent)) {
        warnings.push({
          field: 'components',
          message: `Course component '${courseComponent}' not found in certification module structure`,
          code: 'COMPONENT_NOT_IN_MODULE'
        });
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// =============================================================================
// BATCH VALIDATION FUNCTIONS
// =============================================================================

/**
 * Batch validate multiple entities
 */
export interface BatchValidationResult {
  overall_valid: boolean;
  entity_results: Record<string, ValidationResult>;
  cross_entity_results: ValidationResult[];
  summary: {
    total_entities: number;
    valid_entities: number;
    total_errors: number;
    total_warnings: number;
  };
}

/**
 * Validate complete academia enrollment
 */
export function validateCompleteAcademiaEnrollment(
  enrollment: AcademiaUserEnrollment
): BatchValidationResult {
  const results: Record<string, ValidationResult> = {};
  
  // Validate individual entities
  results.user = validateUserProfile(enrollment.user);
  results.course = validateCourse(enrollment.course);
  results.certification_module = validateCertificationModule(enrollment.certification_module);
  results.progress = validateUserCourseProgress(enrollment.progress);
  
  // Validate recent sessions if any
  if (enrollment.recent_sessions && enrollment.recent_sessions.length > 0) {
    results.recent_sessions = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    for (let i = 0; i < enrollment.recent_sessions.length; i++) {
      const sessionResult = validateExamSession(enrollment.recent_sessions[i]);
      if (!sessionResult.isValid) {
        results.recent_sessions.isValid = false;
        results.recent_sessions.errors.push(...sessionResult.errors.map(err => ({
          ...err,
          field: `session[${i}].${err.field}`
        })));
      }
      results.recent_sessions.warnings.push(...sessionResult.warnings.map(warn => ({
        ...warn,
        field: `session[${i}].${warn.field}`
      })));
    }
  }
  
  // Validate AI contexts if any
  if (enrollment.ai_contexts && enrollment.ai_contexts.length > 0) {
    results.ai_contexts = {
      isValid: true,
      errors: [],
      warnings: []
    };
    
    for (let i = 0; i < enrollment.ai_contexts.length; i++) {
      const contextResult = validateAITutorContext(enrollment.ai_contexts[i]);
      if (!contextResult.isValid) {
        results.ai_contexts.isValid = false;
        results.ai_contexts.errors.push(...contextResult.errors.map(err => ({
          ...err,
          field: `context[${i}].${err.field}`
        })));
      }
      results.ai_contexts.warnings.push(...contextResult.warnings.map(warn => ({
        ...warn,
        field: `context[${i}].${warn.field}`
      })));
    }
  }
  
  // Cross-entity validation
  const crossEntityResults = [
    validateAcademiaEnrollmentConsistency(enrollment),
    validateCourseCertificationConsistency(enrollment.course, enrollment.certification_module)
  ];
  
  // Calculate summary
  const validEntities = Object.values(results).filter(r => r.isValid).length;
  const totalErrors = Object.values(results).reduce((sum, r) => sum + r.errors.length, 0) +
    crossEntityResults.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = Object.values(results).reduce((sum, r) => sum + r.warnings.length, 0) +
    crossEntityResults.reduce((sum, r) => sum + r.warnings.length, 0);
  
  return {
    overall_valid: validEntities === Object.keys(results).length && 
                   crossEntityResults.every(r => r.isValid),
    entity_results: results,
    cross_entity_results: crossEntityResults,
    summary: {
      total_entities: Object.keys(results).length,
      valid_entities: validEntities,
      total_errors: totalErrors,
      total_warnings: totalWarnings
    }
  };
}

// =============================================================================
// DATABASE CONSTRAINT VALIDATION
// =============================================================================

/**
 * Validate database constraints and foreign key relationships
 */
export interface DatabaseConstraintValidation {
  constraint_name: string;
  table_name: string;
  is_valid: boolean;
  violation_message?: string;
}

/**
 * Check unique constraint for course combination (language + level + certification_type)
 */
export function validateUniqueCourseCombo(
  course: Course,
  existingCourses: Course[] = []
): DatabaseConstraintValidation {
  const duplicates = existingCourses.filter(existing => 
    existing.id !== course.id &&
    existing.language === course.language &&
    existing.level === course.level &&
    existing.certification_type === course.certification_type
  );
  
  return {
    constraint_name: 'unique_course_combination',
    table_name: 'courses',
    is_valid: duplicates.length === 0,
    violation_message: duplicates.length > 0 
      ? `Course combination '${course.language}-${course.level}-${course.certification_type}' already exists`
      : undefined
  };
}

/**
 * Check unique constraint for user course progress (user_id + course_id)
 */
export function validateUniqueUserCourseProgress(
  progress: UserCourseProgress,
  existingProgress: UserCourseProgress[] = []
): DatabaseConstraintValidation {
  const duplicates = existingProgress.filter(existing =>
    existing.id !== progress.id &&
    existing.user_id === progress.user_id &&
    existing.course_id === progress.course_id
  );
  
  return {
    constraint_name: 'unique_user_course_progress',
    table_name: 'user_course_progress',
    is_valid: duplicates.length === 0,
    violation_message: duplicates.length > 0
      ? `Progress record for user ${progress.user_id} and course ${progress.course_id} already exists`
      : undefined
  };
}

/**
 * Check unique constraint for exam session combo (to prevent duplicate active sessions)
 */
export function validateUniqueExamSessionCombo(
  session: ExamSession,
  existingSessions: ExamSession[] = []
): DatabaseConstraintValidation {
  const activeDuplicates = existingSessions.filter(existing =>
    existing.id !== session.id &&
    existing.user_id === session.user_id &&
    existing.course_id === session.course_id &&
    existing.session_type === session.session_type &&
    existing.component === session.component &&
    !existing.is_completed &&
    ['started', 'in_progress', 'paused'].includes(existing.current_state as string)
  );
  
  return {
    constraint_name: 'unique_active_exam_session',
    table_name: 'exam_sessions',
    is_valid: activeDuplicates.length === 0,
    violation_message: activeDuplicates.length > 0
      ? `Active exam session already exists for user ${session.user_id}, course ${session.course_id}, type ${session.session_type}, component ${session.component}`
      : undefined
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Handle Zod validation errors
 */
function handleZodValidationError(error: unknown): ValidationResult {
  if (error instanceof z.ZodError) {
    return {
      isValid: false,
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code.toUpperCase(),
        value: err.input
      })),
      warnings: []
    };
  }
  
  return {
    isValid: false,
    errors: [{
      field: 'unknown',
      message: 'Unknown validation error',
      code: 'UNKNOWN_ERROR'
    }],
    warnings: []
  };
}

/**
 * Create validation error
 */
export function createValidationError(
  field: string,
  message: string,
  code: string,
  value?: unknown
): ValidationError {
  return { field, message, code, value };
}

/**
 * Create validation warning
 */
export function createValidationWarning(
  field: string,
  message: string,
  code: string,
  value?: unknown
): ValidationWarning {
  return { field, message, code, value };
}

/**
 * Merge validation results
 */
export function mergeValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(r => r.errors);
  const allWarnings = results.flatMap(r => r.warnings);
  
  return {
    isValid: results.every(r => r.isValid),
    errors: allErrors,
    warnings: allWarnings
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Schema exports
  uuidSchema,
  timestampSchema,
  percentageSchema,
  jsonObjectSchema,
  userProfileSchema,
  certificationModuleSchema,
  courseSchema,
  userCourseEnrollmentSchema,
  userCourseProgressSchema,
  examSessionSchema,
  aiTutorContextSchema,
  
  // Types
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type BatchValidationResult,
  type DatabaseConstraintValidation
};