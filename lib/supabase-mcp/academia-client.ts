/**
 * Academia MCP Client
 * 
 * MCP client specifically configured for academia operations with enhanced
 * error handling, retry logic, and integration with the existing MCP setup.
 * 
 * Provides type-safe database operations for all academia entities with
 * validation, caching, and real-time capabilities.
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { mcpClient, type MCPConfig } from '../../utils/supabase/mcp-config';
import {
  validateUserProfile,
  validateCertificationModule,
  validateCourse,
  validateUserCourseProgress,
  validateExamSession,
  validateAITutorContext,
  validateCompleteAcademiaEnrollment,
  validateUniqueUserCourseProgress,
  validateUniqueExamSessionCombo,
  type ValidationResult,
  type BatchValidationResult
} from '../../utils/supabase/schema-validation';
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
  AcademiaDashboard,
  AcademiaCourseCatalog,
  AcademiaLearningSession,
  
  // API types
  AcademiaCourseEnrollmentRequest,
  AcademiaCourseEnrollmentResponse,
  AcademiaSessionStartRequest,
  AcademiaSessionStartResponse,
  AcademiaAnalyticsRequest,
  AcademiaAnalyticsResponse,
  
  // Validation types
  DEFAULT_ACADEMIA_VALIDATION_RULES,
  canEnrollInCourse,
  canStartSession,
  validateAcademiaDataConsistency
} from '../types/dashboard';

// =============================================================================
// ACADEMIA MCP CLIENT CLASS
// =============================================================================

/**
 * Academia MCP Client Configuration
 */
export interface AcademiaMCPConfig extends MCPConfig {
  /** Enable data validation on all operations */
  enableValidation: boolean;
  
  /** Enable caching for read operations */
  enableCaching: boolean;
  
  /** Cache TTL in seconds */
  cacheTtlSeconds: number;
  
  /** Enable real-time subscriptions */
  enableRealtime: boolean;
  
  /** Maximum batch operation size */
  maxBatchSize: number;
  
  /** Enable performance monitoring */
  enablePerformanceMetrics: boolean;
}

/**
 * Default academia MCP configuration
 */
const DEFAULT_ACADEMIA_MCP_CONFIG: Partial<AcademiaMCPConfig> = {
  enableValidation: true,
  enableCaching: true,
  cacheTtlSeconds: 300, // 5 minutes
  enableRealtime: true,
  maxBatchSize: 50,
  enablePerformanceMetrics: true
};

/**
 * Academia MCP operation result
 */
export interface AcademiaMCPResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: JSONObject;
    validation_errors?: ValidationResult;
  };
  metadata: {
    operation_id: string;
    timestamp: Timestamp;
    duration_ms: number;
    cached: boolean;
    validated: boolean;
    affected_rows?: number;
  };
}

/**
 * Cache entry structure
 */
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  operation_count: number;
  total_duration_ms: number;
  average_duration_ms: number;
  cache_hit_rate: number;
  error_rate: number;
  last_reset: Timestamp;
}

/**
 * Main Academia MCP Client
 */
export class AcademiaMCPClient {
  private config: AcademiaMCPConfig;
  private cache = new Map<string, CacheEntry>();
  private performanceMetrics: PerformanceMetrics = {
    operation_count: 0,
    total_duration_ms: 0,
    average_duration_ms: 0,
    cache_hit_rate: 0,
    error_rate: 0,
    last_reset: new Date()
  };

  constructor(config: Partial<AcademiaMCPConfig> = {}) {
    this.config = {
      ...DEFAULT_ACADEMIA_MCP_CONFIG,
      ...config,
      // Inherit base MCP config
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      enableLogging: config.enableLogging ?? true,
      retryAttempts: config.retryAttempts ?? 3,
      timeoutMs: config.timeoutMs ?? 30000
    } as AcademiaMCPConfig;
  }

  // ==========================================================================
  // CORE MCP OPERATIONS
  // ==========================================================================

  /**
   * Execute academia MCP operation with validation, caching, and monitoring
   */
  private async executeOperation<T>(
    operationName: string,
    operation: () => Promise<{ data: T | null; error: any }>,
    options: {
      table: string;
      action: string;
      userId?: UUID;
      cacheKey?: string;
      skipCache?: boolean;
      validate?: (data: T) => ValidationResult<T>;
      metadata?: JSONObject;
    }
  ): Promise<AcademiaMCPResult<T>> {
    const startTime = performance.now();
    const operationId = `academia_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Check cache if enabled and key provided
      if (this.config.enableCaching && options.cacheKey && !options.skipCache) {
        const cached = this.getFromCache<T>(options.cacheKey);
        if (cached) {
          const duration = performance.now() - startTime;
          this.updatePerformanceMetrics(duration, true, false);
          
          return {
            success: true,
            data: cached,
            metadata: {
              operation_id: operationId,
              timestamp: new Date(),
              duration_ms: duration,
              cached: true,
              validated: false // Cached data assumed pre-validated
            }
          };
        }
      }

      // Execute MCP operation
      const result = await mcpClient.mcpQuery(operation, {
        table: options.table,
        action: options.action,
        userId: options.userId,
        metadata: {
          operation_name: operationName,
          operation_id: operationId,
          ...options.metadata
        }
      });

      const duration = performance.now() - startTime;
      
      // Handle operation error
      if (result.error) {
        this.updatePerformanceMetrics(duration, false, true);
        
        return {
          success: false,
          error: {
            code: 'MCP_OPERATION_ERROR',
            message: result.error.message || 'MCP operation failed',
            details: result.error
          },
          metadata: {
            operation_id: operationId,
            timestamp: new Date(),
            duration_ms: duration,
            cached: false,
            validated: false
          }
        };
      }

      // Validate result if validation function provided
      let validationResult: ValidationResult<T> | undefined;
      if (this.config.enableValidation && options.validate && result.data) {
        validationResult = options.validate(result.data);
        
        if (!validationResult.isValid) {
          this.updatePerformanceMetrics(duration, false, true);
          
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Data validation failed',
              details: { validation_errors: validationResult.errors },
              validation_errors: validationResult
            },
            metadata: {
              operation_id: operationId,
              timestamp: new Date(),
              duration_ms: duration,
              cached: false,
              validated: true
            }
          };
        }
      }

      // Cache successful result if caching enabled
      if (this.config.enableCaching && options.cacheKey && result.data) {
        this.setCache(options.cacheKey, result.data);
      }

      this.updatePerformanceMetrics(duration, false, false);

      return {
        success: true,
        data: result.data || undefined,
        metadata: {
          operation_id: operationId,
          timestamp: new Date(),
          duration_ms: duration,
          cached: false,
          validated: !!validationResult,
          affected_rows: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0
        }
      };

    } catch (error) {
      const duration = performance.now() - startTime;
      this.updatePerformanceMetrics(duration, false, true);

      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error instanceof Error ? error.message : 'Unexpected error occurred',
          details: { error }
        },
        metadata: {
          operation_id: operationId,
          timestamp: new Date(),
          duration_ms: duration,
          cached: false,
          validated: false
        }
      };
    }
  }

  // ==========================================================================
  // USER PROFILE OPERATIONS
  // ==========================================================================

  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: UUID): Promise<AcademiaMCPResult<UserProfile>> {
    return this.executeOperation(
      'getUserProfile',
      async () => {
        const result = await mcpClient.getClient()
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();
        return result;
      },
      {
        table: 'user_profiles',
        action: 'select',
        userId,
        cacheKey: `user_profile:${userId}`,
        validate: validateUserProfile
      }
    );
  }

  /**
   * Create user profile
   */
  async createUserProfile(profileData: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>): Promise<AcademiaMCPResult<UserProfile>> {
    return this.executeOperation(
      'createUserProfile',
      async () => {
        const result = await mcpClient.getClient()
          .from('user_profiles')
          .insert({
            ...profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();
        return result;
      },
      {
        table: 'user_profiles',
        action: 'insert',
        userId: profileData.email, // Use email as identifier for creation
        validate: validateUserProfile,
        skipCache: true
      }
    );
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: UUID, updates: Partial<UserProfile>): Promise<AcademiaMCPResult<UserProfile>> {
    // Invalidate cache
    this.invalidateCache(`user_profile:${userId}`);

    return this.executeOperation(
      'updateUserProfile',
      async () => {
        const result = await mcpClient.getClient()
          .from('user_profiles')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
          .select('*')
          .single();
        return result;
      },
      {
        table: 'user_profiles',
        action: 'update',
        userId,
        validate: validateUserProfile,
        skipCache: true
      }
    );
  }

  // ==========================================================================
  // COURSE OPERATIONS
  // ==========================================================================

  /**
   * Get certification module by ID or code
   */
  async getCertificationModule(idOrCode: UUID): Promise<AcademiaMCPResult<CertificationModule>> {
    return this.executeOperation(
      'getCertificationModule',
      async () => {
        // Try by ID first, then by code if UUID format fails
        let result = await mcpClient.getClient()
          .from('certification_modules')
          .select('*')
          .eq('id', idOrCode)
          .single();
        
        if (result.error && !result.data) {
          // Try by code
          result = await mcpClient.getClient()
            .from('certification_modules')
            .select('*')
            .eq('code', idOrCode)
            .single();
        }
        
        return result;
      },
      {
        table: 'certification_modules',
        action: 'select',
        cacheKey: `certification_module:${idOrCode}`,
        validate: validateCertificationModule
      }
    );
  }

  /**
   * Create certification module
   */
  async createCertificationModule(
    moduleData: Omit<CertificationModule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AcademiaMCPResult<CertificationModule>> {
    return this.executeOperation(
      'createCertificationModule',
      async () => {
        const result = await mcpClient.getClient()
          .from('certification_modules')
          .insert({
            ...moduleData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();
        return result;
      },
      {
        table: 'certification_modules',
        action: 'insert',
        validate: validateCertificationModule,
        skipCache: true
      }
    );
  }

  /**
   * Create course
   */
  async createCourse(courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<AcademiaMCPResult<Course>> {
    return this.executeOperation(
      'createCourse',
      async () => {
        const result = await mcpClient.getClient()
          .from('courses')
          .insert({
            ...courseData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();
        return result;
      },
      {
        table: 'courses',
        action: 'insert',
        validate: validateCourse,
        skipCache: true
      }
    );
  }

  /**
   * Get course by ID
   */
  async getCourse(courseId: UUID): Promise<AcademiaMCPResult<Course>> {
    return this.executeOperation(
      'getCourse',
      async () => {
        const result = await mcpClient.getClient()
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        return result;
      },
      {
        table: 'courses',
        action: 'select',
        cacheKey: `course:${courseId}`,
        validate: validateCourse
      }
    );
  }

  /**
   * List active courses
   */
  async listActiveCourses(): Promise<AcademiaMCPResult<Course[]>> {
    return this.executeOperation(
      'listActiveCourses',
      async () => {
        const result = await mcpClient.getClient()
          .from('courses')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        return result;
      },
      {
        table: 'courses',
        action: 'select',
        cacheKey: 'courses:active',
        validate: (data: Course[]) => {
          const errors: any[] = [];
          const warnings: any[] = [];
          
          for (const course of data) {
            const validation = validateCourse(course);
            if (!validation.isValid) {
              errors.push(...validation.errors);
            }
            warnings.push(...validation.warnings);
          }
          
          return {
            isValid: errors.length === 0,
            data,
            errors,
            warnings
          };
        }
      }
    );
  }

  /**
   * Get courses by language and certification type
   */
  async getCoursesByLanguageAndCertification(
    language: string,
    certificationType: string
  ): Promise<AcademiaMCPResult<Course[]>> {
    return this.executeOperation(
      'getCoursesByLanguageAndCertification',
      async () => {
        const result = await mcpClient.getClient()
          .from('courses')
          .select('*')
          .eq('language', language)
          .eq('certification_type', certificationType)
          .eq('is_active', true)
          .order('level');
        return result;
      },
      {
        table: 'courses',
        action: 'select',
        cacheKey: `courses:${language}:${certificationType}`,
        metadata: { language, certificationType }
      }
    );
  }

  // ==========================================================================
  // ENROLLMENT OPERATIONS
  // ==========================================================================

  /**
   * Get user enrollments with complete data
   */
  async getUserEnrollments(userId: UUID): Promise<AcademiaMCPResult<AcademiaUserEnrollment[]>> {
    return this.executeOperation(
      'getUserEnrollments',
      async () => {
        // Complex query to get all related data
        const result = await mcpClient.getClient()
          .from('user_course_enrollments')
          .select(`
            *,
            user_profiles(*),
            courses(*),
            user_course_progress(*)
          `)
          .eq('user_id', userId);

        // Transform the data to match AcademiaUserEnrollment structure
        if (result.data) {
          const transformedData = await Promise.all(
            result.data.map(async (enrollment: any) => {
              // Get certification module
              const certModuleResult = await mcpClient.getClient()
                .from('certification_modules')
                .select('*')
                .eq('id', enrollment.courses.certification_module_id)
                .single();

              // Get recent sessions
              const sessionsResult = await mcpClient.getClient()
                .from('exam_sessions')
                .select('*')
                .eq('user_id', userId)
                .eq('course_id', enrollment.course_id)
                .order('started_at', { ascending: false })
                .limit(5);

              // Get AI contexts
              const contextsResult = await mcpClient.getClient()
                .from('ai_tutor_contexts')
                .select('*')
                .eq('user_id', userId)
                .eq('course_id', enrollment.course_id);

              return {
                id: enrollment.id,
                user: enrollment.user_profiles,
                course: enrollment.courses,
                certification_module: certModuleResult.data,
                progress: enrollment.user_course_progress[0], // Assuming one progress per enrollment
                enrollment: {
                  enrollment_date: enrollment.enrollment_date,
                  subscription_status: enrollment.subscription_status,
                  access_expires_at: enrollment.access_expires_at,
                  subscription_tier: enrollment.subscription_tier,
                  created_at: enrollment.created_at,
                  updated_at: enrollment.updated_at
                },
                recent_sessions: sessionsResult.data || [],
                ai_contexts: contextsResult.data || []
              } as AcademiaUserEnrollment;
            })
          );

          return { data: transformedData, error: null };
        }

        return result;
      },
      {
        table: 'user_course_enrollments',
        action: 'select',
        userId,
        cacheKey: `enrollments:${userId}`,
        validate: (data: AcademiaUserEnrollment[]) => {
          const errors: any[] = [];
          const warnings: any[] = [];
          
          for (const enrollment of data) {
            const validation = validateCompleteAcademiaEnrollment(enrollment);
            if (!validation.overall_valid) {
              errors.push(...validation.cross_entity_results.flatMap(r => r.errors));
            }
            warnings.push(...validation.cross_entity_results.flatMap(r => r.warnings));
          }
          
          return {
            isValid: errors.length === 0,
            data,
            errors,
            warnings
          };
        }
      }
    );
  }

  /**
   * Create course enrollment
   */
  async createCourseEnrollment(
    request: AcademiaCourseEnrollmentRequest
  ): Promise<AcademiaMCPResult<AcademiaCourseEnrollmentResponse>> {
    return this.executeOperation(
      'createCourseEnrollment',
      async () => {
        // First, validate prerequisites and business rules
        const [userResult, courseResult, existingEnrollmentsResult] = await Promise.all([
          mcpClient.getClient().from('user_profiles').select('*').eq('id', request.user_id).single(),
          mcpClient.getClient().from('courses').select('*').eq('id', request.course_id).single(),
          mcpClient.getClient().from('user_course_enrollments').select('*').eq('user_id', request.user_id)
        ]);

        if (userResult.error || courseResult.error) {
          return {
            data: {
              success: false,
              error: {
                code: 'ENTITY_NOT_FOUND',
                message: userResult.error?.message || courseResult.error?.message || 'User or course not found'
              },
              next_steps: []
            },
            error: null
          };
        }

        // Check enrollment eligibility
        const existingEnrollments = (existingEnrollmentsResult.data || []).map((e: any) => ({
          enrollment: { subscription_status: e.subscription_status }
        })) as AcademiaUserEnrollment[];

        if (!canEnrollInCourse(userResult.data, courseResult.data, existingEnrollments)) {
          return {
            data: {
              success: false,
              error: {
                code: 'ENROLLMENT_NOT_ALLOWED',
                message: 'User cannot enroll in this course due to eligibility requirements'
              },
              next_steps: [
                {
                  action: 'verify_requirements',
                  description: 'Check GDPR consent and email verification status'
                }
              ]
            },
            error: null
          };
        }

        // Create enrollment record
        const enrollmentResult = await mcpClient.getClient()
          .from('user_course_enrollments')
          .insert({
            user_id: request.user_id,
            course_id: request.course_id,
            subscription_tier: request.subscription_tier,
            enrollment_date: new Date().toISOString(),
            subscription_status: 'active',
            access_expires_at: request.target_exam_date?.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();

        if (enrollmentResult.error) {
          return {
            data: {
              success: false,
              error: {
                code: 'ENROLLMENT_CREATION_FAILED',
                message: enrollmentResult.error.message
              },
              next_steps: []
            },
            error: null
          };
        }

        // Create initial progress record
        const progressResult = await mcpClient.getClient()
          .from('user_course_progress')
          .insert({
            user_id: request.user_id,
            course_id: request.course_id,
            enrollment_date: new Date().toISOString(),
            overall_progress: 0.0,
            component_progress: request.initial_assessment || {},
            readiness_score: 0.0,
            estimated_study_hours: 0,
            target_exam_date: request.target_exam_date?.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();

        // Create enrollment response
        const enrollmentResponse: AcademiaCourseEnrollmentResponse = {
          success: true,
          enrollment: {
            id: enrollmentResult.data.id,
            user: userResult.data,
            course: courseResult.data,
            certification_module: {}, // Would need to fetch this
            progress: progressResult.data,
            enrollment: {
              enrollment_date: enrollmentResult.data.enrollment_date,
              subscription_status: enrollmentResult.data.subscription_status,
              access_expires_at: enrollmentResult.data.access_expires_at,
              subscription_tier: enrollmentResult.data.subscription_tier,
              created_at: enrollmentResult.data.created_at,
              updated_at: enrollmentResult.data.updated_at
            },
            recent_sessions: [],
            ai_contexts: []
          } as AcademiaUserEnrollment,
          next_steps: [
            {
              action: 'take_diagnostic',
              description: 'Take a diagnostic test to assess your current level',
              url: `/dashboard/${courseResult.data.language}/${courseResult.data.level}/diagnostic`
            },
            {
              action: 'setup_study_plan',
              description: 'Create your personalized study plan'
            }
          ]
        };

        // Invalidate related caches
        this.invalidateCache(`enrollments:${request.user_id}`);
        this.invalidateCache(`courses:active`);

        return { data: enrollmentResponse, error: null };
      },
      {
        table: 'user_course_enrollments',
        action: 'insert',
        userId: request.user_id,
        metadata: {
          course_id: request.course_id,
          subscription_tier: request.subscription_tier
        },
        skipCache: true
      }
    );
  }

  // ==========================================================================
  // EXAM SESSION OPERATIONS
  // ==========================================================================

  /**
   * Create exam session
   */
  async createExamSession(
    sessionData: Omit<ExamSession, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AcademiaMCPResult<ExamSession>> {
    return this.executeOperation(
      'createExamSession',
      async () => {
        const result = await mcpClient.getClient()
          .from('exam_sessions')
          .insert({
            ...sessionData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();
        return result;
      },
      {
        table: 'exam_sessions',
        action: 'insert',
        userId: sessionData.user_id,
        validate: validateExamSession,
        metadata: {
          course_id: sessionData.course_id,
          session_type: sessionData.session_type,
          component: sessionData.component
        },
        skipCache: true
      }
    );
  }

  /**
   * Update exam session
   */
  async updateExamSession(
    sessionId: UUID,
    updates: Partial<ExamSession>
  ): Promise<AcademiaMCPResult<ExamSession>> {
    return this.executeOperation(
      'updateExamSession',
      async () => {
        const result = await mcpClient.getClient()
          .from('exam_sessions')
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)
          .select('*')
          .single();
        return result;
      },
      {
        table: 'exam_sessions',
        action: 'update',
        validate: validateExamSession,
        metadata: { session_id: sessionId },
        skipCache: true
      }
    );
  }

  /**
   * Get user's recent exam sessions
   */
  async getUserRecentSessions(
    userId: UUID,
    limit: number = 10
  ): Promise<AcademiaMCPResult<ExamSession[]>> {
    return this.executeOperation(
      'getUserRecentSessions',
      async () => {
        const result = await mcpClient.getClient()
          .from('exam_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('started_at', { ascending: false })
          .limit(limit);
        return result;
      },
      {
        table: 'exam_sessions',
        action: 'select',
        userId,
        cacheKey: `sessions:${userId}:recent:${limit}`,
        metadata: { limit }
      }
    );
  }

  // ==========================================================================
  // AI TUTOR CONTEXT OPERATIONS
  // ==========================================================================

  /**
   * Get or create AI tutor context for user and course
   */
  async getOrCreateAITutorContext(
    userId: UUID,
    courseId: UUID,
    contextType: 'general' | 'session_specific' | 'weakness_focused' = 'general'
  ): Promise<AcademiaMCPResult<AITutorContext>> {
    return this.executeOperation(
      'getOrCreateAITutorContext',
      async () => {
        // First try to get existing context
        const existingResult = await mcpClient.getClient()
          .from('ai_tutor_contexts')
          .select('*')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('context_type', contextType)
          .not('expires_at', 'lt', new Date().toISOString())
          .single();

        if (existingResult.data) {
          return existingResult;
        }

        // Create new context if none exists
        const newContextResult = await mcpClient.getClient()
          .from('ai_tutor_contexts')
          .insert({
            user_id: userId,
            course_id: courseId,
            context_type: contextType,
            learning_profile: {},
            interaction_history: [],
            current_context: {},
            ai_session_metadata: {},
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();

        return newContextResult;
      },
      {
        table: 'ai_tutor_contexts',
        action: 'select_or_insert',
        userId,
        validate: validateAITutorContext,
        metadata: { courseId, contextType },
        skipCache: true
      }
    );
  }

  // ==========================================================================
  // DASHBOARD AND ANALYTICS OPERATIONS
  // ==========================================================================

  /**
   * Get complete academia dashboard for user
   */
  async getAcademiaDashboard(userId: UUID): Promise<AcademiaMCPResult<AcademiaDashboard>> {
    return this.executeOperation(
      'getAcademiaDashboard',
      async () => {
        // Get all dashboard components in parallel
        const [
          userResult,
          enrollmentsResult,
          availableCoursesResult,
          certModulesResult,
          recentSessionsResult
        ] = await Promise.all([
          this.getUserProfile(userId),
          this.getUserEnrollments(userId),
          this.listActiveCourses(),
          mcpClient.mcpQuery(
            () => mcpClient.getClient().from('certification_modules').select('*').eq('is_active', true),
            { table: 'certification_modules', action: 'select' }
          ),
          this.getUserRecentSessions(userId, 5)
        ]);

        if (!userResult.success || !userResult.data) {
          return { data: null, error: { message: 'User not found' } };
        }

        const dashboard: AcademiaDashboard = {
          user: userResult.data,
          enrollments: enrollmentsResult.data || [],
          available_courses: availableCoursesResult.data || [],
          available_certifications: certModulesResult.data || [],
          recent_activity: {
            recent_sessions: recentSessionsResult.data || [],
            recent_ai_interactions: [],
            recent_milestones: []
          },
          analytics: {
            overall_performance: this.calculateOverallPerformance(enrollmentsResult.data || []),
            weekly_study_hours: this.calculateWeeklyStudyHours(recentSessionsResult.data || []),
            study_streak_days: this.calculateStudyStreak(recentSessionsResult.data || []),
            performance_trends: []
          },
          recommendations: {
            suggested_courses: [],
            study_recommendations: [],
            context_recommendations: []
          }
        };

        return { data: dashboard, error: null };
      },
      {
        table: 'dashboard',
        action: 'aggregate',
        userId,
        cacheKey: `dashboard:${userId}`,
        metadata: { dashboard_type: 'complete' }
      }
    );
  }

  // ==========================================================================
  // CACHE MANAGEMENT
  // ==========================================================================

  /**
   * Get data from cache
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set data in cache
   */
  private setCache<T>(key: string, data: T, ttlSeconds?: number): void {
    if (!this.config.enableCaching) return;
    
    const ttl = ttlSeconds || this.config.cacheTtlSeconds;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      key
    });
  }

  /**
   * Invalidate cache entry
   */
  private invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ==========================================================================
  // PERFORMANCE MONITORING
  // ==========================================================================

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(duration: number, cached: boolean, error: boolean): void {
    if (!this.config.enablePerformanceMetrics) return;

    this.performanceMetrics.operation_count++;
    this.performanceMetrics.total_duration_ms += duration;
    this.performanceMetrics.average_duration_ms = 
      this.performanceMetrics.total_duration_ms / this.performanceMetrics.operation_count;

    // Update cache hit rate
    const totalOperations = this.performanceMetrics.operation_count;
    const cacheHits = cached ? 1 : 0;
    this.performanceMetrics.cache_hit_rate = 
      (this.performanceMetrics.cache_hit_rate * (totalOperations - 1) + cacheHits) / totalOperations;

    // Update error rate
    const errors = error ? 1 : 0;
    this.performanceMetrics.error_rate = 
      (this.performanceMetrics.error_rate * (totalOperations - 1) + errors) / totalOperations;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics
   */
  resetPerformanceMetrics(): void {
    this.performanceMetrics = {
      operation_count: 0,
      total_duration_ms: 0,
      average_duration_ms: 0,
      cache_hit_rate: 0,
      error_rate: 0,
      last_reset: new Date()
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Calculate overall performance from enrollments
   */
  private calculateOverallPerformance(enrollments: AcademiaUserEnrollment[]): PercentageValue {
    if (enrollments.length === 0) return 0.0;
    
    const totalProgress = enrollments.reduce((sum, enrollment) => {
      return sum + enrollment.progress.overall_progress;
    }, 0);
    
    return Math.min(1.0, Math.max(0.0, totalProgress / enrollments.length));
  }

  /**
   * Calculate weekly study hours from recent sessions
   */
  private calculateWeeklyStudyHours(sessions: ExamSession[]): number {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklySeconds = sessions
      .filter(session => new Date(session.started_at) >= oneWeekAgo)
      .reduce((sum, session) => sum + session.duration_seconds, 0);
    
    return Math.round((weeklySeconds / 3600) * 100) / 100; // Convert to hours with 2 decimal places
  }

  /**
   * Calculate current study streak
   */
  private calculateStudyStreak(sessions: ExamSession[]): number {
    if (sessions.length === 0) return 0;
    
    // Sort sessions by date (most recent first)
    const sortedSessions = sessions
      .filter(s => s.is_completed)
      .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.started_at);
      sessionDate.setHours(0, 0, 0, 0);
      
      const daysDifference = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysDifference === streak) {
        streak++;
      } else if (daysDifference > streak) {
        break;
      }
    }
    
    return streak;
  }
}

// =============================================================================
// SINGLETON INSTANCE AND EXPORTS
// =============================================================================

/**
 * Singleton academia MCP client instance
 */
export const academiaMCPClient = new AcademiaMCPClient();

/**
 * Convenience exports for common operations
 */
export const academiaOperations = {
  // User operations
  getUserProfile: academiaMCPClient.getUserProfile.bind(academiaMCPClient),
  createUserProfile: academiaMCPClient.createUserProfile.bind(academiaMCPClient),
  updateUserProfile: academiaMCPClient.updateUserProfile.bind(academiaMCPClient),
  
  // Certification module operations
  getCertificationModule: academiaMCPClient.getCertificationModule.bind(academiaMCPClient),
  createCertificationModule: academiaMCPClient.createCertificationModule.bind(academiaMCPClient),
  
  // Course operations
  getCourse: academiaMCPClient.getCourse.bind(academiaMCPClient),
  createCourse: academiaMCPClient.createCourse.bind(academiaMCPClient),
  listActiveCourses: academiaMCPClient.listActiveCourses.bind(academiaMCPClient),
  getCoursesByLanguageAndCertification: academiaMCPClient.getCoursesByLanguageAndCertification.bind(academiaMCPClient),
  
  // Enrollment operations
  getUserEnrollments: academiaMCPClient.getUserEnrollments.bind(academiaMCPClient),
  createCourseEnrollment: academiaMCPClient.createCourseEnrollment.bind(academiaMCPClient),
  
  // Session operations
  createExamSession: academiaMCPClient.createExamSession.bind(academiaMCPClient),
  updateExamSession: academiaMCPClient.updateExamSession.bind(academiaMCPClient),
  getUserRecentSessions: academiaMCPClient.getUserRecentSessions.bind(academiaMCPClient),
  
  // AI context operations
  getOrCreateAITutorContext: academiaMCPClient.getOrCreateAITutorContext.bind(academiaMCPClient),
  
  // Dashboard operations
  getAcademiaDashboard: academiaMCPClient.getAcademiaDashboard.bind(academiaMCPClient),
  
  // Performance monitoring
  getPerformanceMetrics: academiaMCPClient.getPerformanceMetrics.bind(academiaMCPClient),
  resetPerformanceMetrics: academiaMCPClient.resetPerformanceMetrics.bind(academiaMCPClient),
  clearCache: academiaMCPClient.clearCache.bind(academiaMCPClient)
};

// Export types
export type {
  AcademiaMCPConfig,
  AcademiaMCPResult,
  PerformanceMetrics
};