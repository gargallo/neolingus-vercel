/**
 * Exam Session Service - T027
 * 
 * Business logic layer for exam session management with comprehensive state management,
 * real-time synchronization, and intelligent session handling.
 * 
 * Features:
 * - Complete exam session lifecycle management
 * - Real-time session state synchronization
 * - Advanced session analytics and scoring
 * - Session resumption and recovery
 * - Performance optimization with intelligent caching
 * - Comprehensive validation and error handling
 * - Integration with exam engine and AI systems
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import type {
  ExamSession,
  CreateExamSessionInput,
  UpdateExamSessionInput,
  CompleteExamSessionInput,
  ExamSessionAnalytics,
  ExamSessionQueryOptions,
  ExamSessionType,
  ExamSessionState,
  SessionData,
  UserResponse,
  DetailedScores,
  ImprovementSuggestion,
  UUID,
  PercentageValue,
  CourseComponent,
  ExamComponent
} from '../types/dashboard';
import { mcpClient, mcp } from '../../utils/supabase/mcp-config';
import { UniversalExamEngine } from '../exam-engine/core/universal-engine';
import type { Database } from '../../utils/types/database';

// =============================================================================
// SERVICE CONFIGURATION AND TYPES
// =============================================================================

interface ExamServiceConfig {
  enableCaching: boolean;
  cacheTimeoutMs: number;
  retryAttempts: number;
  enableRealtime: boolean;
  enableAnalytics: boolean;
  sessionTimeoutMs: number;
  autoSaveIntervalMs: number;
  maxConcurrentSessions: number;
}

const DEFAULT_CONFIG: ExamServiceConfig = {
  enableCaching: true,
  cacheTimeoutMs: 5 * 60 * 1000, // 5 minutes
  retryAttempts: 3,
  enableRealtime: true,
  enableAnalytics: true,
  sessionTimeoutMs: 3 * 60 * 60 * 1000, // 3 hours
  autoSaveIntervalMs: 30 * 1000, // 30 seconds
  maxConcurrentSessions: 5,
};

interface SessionCacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  isActive: boolean;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class ExamServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ExamServiceError';
  }
}

const createNotFoundError = (sessionId: string) =>
  new ExamServiceError(`Exam session not found: ${sessionId}`, 'SESSION_NOT_FOUND', 404);

const createValidationError = (message: string, details?: Record<string, unknown>) =>
  new ExamServiceError(message, 'VALIDATION_ERROR', 400, details);

const createSessionStateError = (message: string, currentState?: string) =>
  new ExamServiceError(
    message,
    'INVALID_SESSION_STATE',
    409,
    currentState ? { currentState } : undefined
  );

const createDatabaseError = (message: string, originalError?: unknown) =>
  new ExamServiceError(
    message,
    'DATABASE_ERROR',
    500,
    originalError ? { originalError: String(originalError) } : undefined
  );

const createConcurrencyError = (maxSessions: number) =>
  new ExamServiceError(
    `Maximum concurrent sessions exceeded. Limit: ${maxSessions}`,
    'TOO_MANY_SESSIONS',
    429
  );

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

function validateExamSessionData(data: Partial<ExamSession>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.session_type && !isValidExamSessionType(data.session_type)) {
    errors.push(`Invalid session type: ${data.session_type}`);
  }

  if (data.component && !isValidExamComponent(data.component)) {
    errors.push(`Invalid component: ${data.component}`);
  }

  if (data.duration_seconds !== undefined && data.duration_seconds < 0) {
    errors.push('Duration cannot be negative');
  }

  if (data.score !== undefined && (data.score < 0 || data.score > 1)) {
    errors.push('Score must be between 0 and 1');
  }

  if (data.state && !isValidExamSessionState(data.state)) {
    errors.push(`Invalid session state: ${data.state}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidExamSessionType(type: string): type is ExamSessionType {
  return ['practice', 'mock_exam', 'diagnostic', 'adaptive'].includes(type);
}

function isValidExamComponent(component: string): component is ExamComponent {
  return ['reading', 'writing', 'listening', 'speaking', 'grammar', 'vocabulary'].includes(component);
}

function isValidExamSessionState(state: string): state is ExamSessionState {
  return ['created', 'in_progress', 'paused', 'completed', 'abandoned', 'expired'].includes(state);
}

// =============================================================================
// SESSION CACHE MANAGEMENT
// =============================================================================

class ExamSessionCache {
  private cache = new Map<string, SessionCacheEntry<any>>();
  private readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    this.timeoutMs = timeoutMs;
  }

  set<T>(key: string, data: T, isActive: boolean = false): void {
    const timestamp = Date.now();
    this.cache.set(key, {
      data,
      timestamp,
      expiresAt: timestamp + (isActive ? this.timeoutMs * 2 : this.timeoutMs),
      isActive,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  getActiveSessions(): string[] {
    return Array.from(this.cache.entries())
      .filter(([, entry]) => entry.isActive && Date.now() <= entry.expiresAt)
      .map(([key]) => key);
  }

  setSessionInactive(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      entry.isActive = false;
      this.cache.set(key, entry.data, false);
    }
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

// =============================================================================
// SESSION ANALYTICS UTILITIES
// =============================================================================

function calculateSessionAnalytics(session: ExamSession): ExamSessionAnalytics {
  const responses = session.responses || [];
  const totalQuestions = responses.length;
  
  if (totalQuestions === 0) {
    return {
      total_questions: 0,
      correct_answers: 0,
      accuracy_rate: 0,
      average_response_time: 0,
      time_per_question: {},
      component_scores: {},
      difficulty_performance: {},
      improvement_areas: [],
      strengths: [],
    };
  }

  const correctAnswers = responses.filter(r => r.is_correct).length;
  const accuracyRate = correctAnswers / totalQuestions;
  
  const responseTimes = responses
    .filter(r => r.response_time_ms)
    .map(r => r.response_time_ms!);
  
  const averageResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0;

  // Calculate time per question
  const timePerQuestion = responses.reduce((acc, response, index) => ({
    ...acc,
    [index + 1]: response.response_time_ms || 0,
  }), {} as Record<string, number>);

  // Calculate component scores
  const componentScores = responses.reduce((acc, response) => {
    const component = response.question_metadata?.component || 'general';
    if (!acc[component]) {
      acc[component] = { correct: 0, total: 0 };
    }
    acc[component].total += 1;
    if (response.is_correct) {
      acc[component].correct += 1;
    }
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  const componentScorePercentages = Object.entries(componentScores).reduce((acc, [component, stats]) => ({
    ...acc,
    [component]: stats.total > 0 ? stats.correct / stats.total : 0,
  }), {} as Record<string, number>);

  // Calculate difficulty performance
  const difficultyPerformance = responses.reduce((acc, response) => {
    const difficulty = response.question_metadata?.difficulty || 'medium';
    if (!acc[difficulty]) {
      acc[difficulty] = { correct: 0, total: 0 };
    }
    acc[difficulty].total += 1;
    if (response.is_correct) {
      acc[difficulty].correct += 1;
    }
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  const difficultyScores = Object.entries(difficultyPerformance).reduce((acc, [difficulty, stats]) => ({
    ...acc,
    [difficulty]: stats.total > 0 ? stats.correct / stats.total : 0,
  }), {} as Record<string, number>);

  // Identify improvement areas and strengths
  const sortedComponents = Object.entries(componentScorePercentages)
    .sort(([, a], [, b]) => a - b);
  
  const improvementAreas = sortedComponents
    .filter(([, score]) => score < 0.7)
    .map(([component]) => component);
  
  const strengths = sortedComponents
    .filter(([, score]) => score >= 0.8)
    .map(([component]) => component);

  return {
    total_questions: totalQuestions,
    correct_answers: correctAnswers,
    accuracy_rate: accuracyRate,
    average_response_time: averageResponseTime,
    time_per_question: timePerQuestion,
    component_scores: componentScorePercentages,
    difficulty_performance: difficultyScores,
    improvement_areas: improvementAreas,
    strengths: strengths,
  };
}

function generateImprovementSuggestions(
  session: ExamSession,
  analytics: ExamSessionAnalytics
): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];

  // Accuracy-based suggestions
  if (analytics.accuracy_rate < 0.6) {
    suggestions.push({
      type: 'accuracy',
      priority: 'high',
      title: 'Focus on foundational concepts',
      description: `Your accuracy rate is ${(analytics.accuracy_rate * 100).toFixed(1)}%. Review basic concepts and practice more fundamental questions.`,
      recommended_actions: [
        'Review course materials for weak areas',
        'Practice with easier questions first',
        'Take your time to read questions carefully',
      ],
      estimated_improvement: 0.15,
    });
  }

  // Time management suggestions
  if (analytics.average_response_time > 60000) { // More than 1 minute per question
    suggestions.push({
      type: 'time_management',
      priority: 'medium',
      title: 'Improve response speed',
      description: `Your average response time is ${(analytics.average_response_time / 1000).toFixed(1)} seconds. Practice to improve your speed.`,
      recommended_actions: [
        'Practice timed exercises',
        'Learn to eliminate obviously wrong answers quickly',
        'Build familiarity with question types',
      ],
      estimated_improvement: 0.1,
    });
  }

  // Component-specific suggestions
  for (const area of analytics.improvement_areas) {
    const score = analytics.component_scores[area];
    if (score < 0.7) {
      suggestions.push({
        type: 'component_focus',
        priority: score < 0.5 ? 'high' : 'medium',
        title: `Strengthen ${area} skills`,
        description: `Your ${area} score is ${(score * 100).toFixed(1)}%. This area needs focused attention.`,
        recommended_actions: [
          `Practice more ${area} exercises`,
          `Review ${area} strategies and techniques`,
          `Seek additional resources for ${area}`,
        ],
        estimated_improvement: 0.2,
        component: area,
      });
    }
  }

  // Strengths reinforcement
  if (analytics.strengths.length > 0) {
    suggestions.push({
      type: 'strength_building',
      priority: 'low',
      title: 'Leverage your strengths',
      description: `You excel at ${analytics.strengths.join(', ')}. Use these strengths to boost overall performance.`,
      recommended_actions: [
        'Continue practicing strong areas to maintain excellence',
        'Use strong areas to compensate during actual exams',
        'Help others in these areas to reinforce your knowledge',
      ],
      estimated_improvement: 0.05,
    });
  }

  return suggestions.slice(0, 5); // Limit to top 5 suggestions
}

// =============================================================================
// MAIN EXAM SERVICE CLASS
// =============================================================================

export class ExamService {
  private cache: ExamSessionCache;
  private config: ExamServiceConfig;
  private examEngine: UniversalExamEngine;
  private realTimeSubscriptions = new Map<string, ReturnType<typeof mcpClient.subscribeToTable>>();
  private autoSaveTimers = new Map<string, NodeJS.Timeout>();

  constructor(config: Partial<ExamServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new ExamSessionCache(this.config.cacheTimeoutMs);
    this.examEngine = new UniversalExamEngine();
  }

  // ===========================================================================
  // PUBLIC API METHODS - SESSION LIFECYCLE
  // ===========================================================================

  /**
   * Create a new exam session
   */
  async createExamSession(
    sessionData: CreateExamSessionInput,
    userId: string
  ): Promise<ExamSession> {
    // Validate input data
    const validation = validateExamSessionData(sessionData);
    if (!validation.isValid) {
      throw createValidationError('Invalid exam session data', {
        errors: validation.errors,
      });
    }

    // Check concurrent session limit
    await this.checkConcurrentSessionLimit(sessionData.user_id);

    try {
      // Generate session configuration using exam engine
      const examConfig = await this.examEngine.generateExamConfig({
        certificationModule: sessionData.course_id,
        component: sessionData.component as CourseComponent,
        sessionType: sessionData.session_type,
        userId: sessionData.user_id,
      });

      const now = new Date();
      const sessionDataPayload: SessionData = {
        examConfig,
        startTime: now.toISOString(),
        allowedTime: examConfig.timeLimit,
        currentQuestionIndex: 0,
        questionsGenerated: false,
        isResumed: false,
      };

      const result = await mcp.query(
        async () => {
          const client = mcpClient.getClient();
          return await client
            .from('exam_sessions')
            .insert([{
              user_id: sessionData.user_id,
              course_id: sessionData.course_id,
              session_type: sessionData.session_type,
              component: sessionData.component,
              started_at: now.toISOString(),
              duration_seconds: 0,
              score: 0,
              responses: [],
              detailed_scores: {},
              improvement_suggestions: [],
              is_completed: false,
              state: 'created',
              session_data: sessionDataPayload,
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
            }])
            .select()
            .single();
        },
        {
          table: 'exam_sessions',
          action: 'insert',
          userId,
          metadata: { sessionData },
        }
      );

      if (result.error) {
        throw createDatabaseError('Failed to create exam session', result.error);
      }

      const session = result.data as ExamSession;

      // Cache the active session
      this.cache.set(`session:${session.id}`, session, true);
      this.cache.set(`user_sessions:${sessionData.user_id}`, [session], true);

      // Start auto-save timer
      this.startAutoSave(session.id);

      return session;
    } catch (error) {
      if (error instanceof ExamServiceError) {
        throw error;
      }
      throw createDatabaseError('Unexpected error while creating exam session', error);
    }
  }

  /**
   * Get exam session by ID
   */
  async getExamSession(
    sessionId: UUID,
    userId?: string,
    options?: ExamSessionQueryOptions
  ): Promise<ExamSession> {
    const cacheKey = `session:${sessionId}`;
    
    // Check cache first
    if (this.config.enableCaching && !options?.bypassCache) {
      const cached = this.cache.get<ExamSession>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await mcp.query(
        async () => {
          const client = mcpClient.getClient();
          let query = client
            .from('exam_sessions')
            .select('*')
            .eq('id', sessionId);

          if (userId) {
            query = query.eq('user_id', userId);
          }

          return await query.maybeSingle();
        },
        {
          table: 'exam_sessions',
          action: 'select',
          userId,
          metadata: { sessionId, options },
        }
      );

      if (result.error) {
        throw createDatabaseError('Failed to fetch exam session', result.error);
      }

      if (!result.data) {
        throw createNotFoundError(sessionId);
      }

      const session = result.data as ExamSession;

      // Cache the result
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, session, !session.is_completed);
      }

      return session;
    } catch (error) {
      if (error instanceof ExamServiceError) {
        throw error;
      }
      throw createDatabaseError('Unexpected error while fetching exam session', error);
    }
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(
    userId: UUID,
    options?: ExamSessionQueryOptions
  ): Promise<ExamSession[]> {
    const cacheKey = `user_sessions:${userId}`;
    
    // Check cache first
    if (this.config.enableCaching && !options?.bypassCache) {
      const cached = this.cache.get<ExamSession[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await mcp.query(
        async () => {
          const client = mcpClient.getClient();
          let query = client
            .from('exam_sessions')
            .select('*')
            .eq('user_id', userId);

          if (options?.courseId) {
            query = query.eq('course_id', options.courseId);
          }

          if (options?.sessionType) {
            query = query.eq('session_type', options.sessionType);
          }

          if (options?.state) {
            query = query.eq('state', options.state);
          }

          if (options?.includeCompleted === false) {
            query = query.eq('is_completed', false);
          }

          query = query.order('started_at', { ascending: false });

          if (options?.limit) {
            query = query.limit(options.limit);
          }

          return await query;
        },
        {
          table: 'exam_sessions',
          action: 'select',
          userId,
          metadata: { options },
        }
      );

      if (result.error) {
        throw createDatabaseError('Failed to fetch user sessions', result.error);
      }

      const sessions = (result.data || []) as ExamSession[];

      // Cache the result
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, sessions);
      }

      return sessions;
    } catch (error) {
      if (error instanceof ExamServiceError) {
        throw error;
      }
      throw createDatabaseError('Unexpected error while fetching user sessions', error);
    }
  }

  /**
   * Update exam session with response data
   */
  async updateExamSession(
    sessionId: UUID,
    updates: UpdateExamSessionInput,
    operatorUserId: string
  ): Promise<ExamSession> {
    // Validate update data
    const validation = validateExamSessionData(updates);
    if (!validation.isValid) {
      throw createValidationError('Invalid session update data', {
        errors: validation.errors,
      });
    }

    try {
      // Get current session to validate state transitions
      const currentSession = await this.getExamSession(sessionId, undefined, { bypassCache: true });
      
      // Validate state transitions
      if (updates.state) {
        this.validateStateTransition(currentSession.state, updates.state);
      }

      // Calculate updated duration
      const now = new Date();
      const startedAt = new Date(currentSession.started_at);
      const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

      const result = await mcp.query(
        async () => {
          const client = mcpClient.getClient();
          return await client
            .from('exam_sessions')
            .update({
              ...updates,
              duration_seconds: updates.duration_seconds || durationSeconds,
              updated_at: now.toISOString(),
            })
            .eq('id', sessionId)
            .select()
            .single();
        },
        {
          table: 'exam_sessions',
          action: 'update',
          userId: operatorUserId,
          metadata: { sessionId, updates },
        }
      );

      if (result.error) {
        throw createDatabaseError('Failed to update exam session', result.error);
      }

      if (!result.data) {
        throw createNotFoundError(sessionId);
      }

      const updatedSession = result.data as ExamSession;

      // Update cache
      this.cache.set(`session:${sessionId}`, updatedSession, !updatedSession.is_completed);
      this.cache.invalidate(`user_sessions:${updatedSession.user_id}`);

      // If session is completed, stop auto-save and mark cache as inactive
      if (updatedSession.is_completed || updatedSession.state === 'completed') {
        this.stopAutoSave(sessionId);
        this.cache.setSessionInactive(`session:${sessionId}`);
      }

      return updatedSession;
    } catch (error) {
      if (error instanceof ExamServiceError) {
        throw error;
      }
      throw createDatabaseError('Unexpected error while updating exam session', error);
    }
  }

  /**
   * Complete exam session with final scoring and analytics
   */
  async completeExamSession(
    sessionId: UUID,
    completionData: CompleteExamSessionInput,
    operatorUserId: string
  ): Promise<ExamSession> {
    try {
      const currentSession = await this.getExamSession(sessionId, undefined, { bypassCache: true });
      
      // Validate session can be completed
      if (currentSession.is_completed) {
        throw createSessionStateError('Session is already completed', currentSession.state);
      }

      if (currentSession.state === 'abandoned' || currentSession.state === 'expired') {
        throw createSessionStateError('Cannot complete session in current state', currentSession.state);
      }

      // Calculate final analytics
      const analytics = this.config.enableAnalytics 
        ? calculateSessionAnalytics({ ...currentSession, ...completionData })
        : undefined;

      // Generate improvement suggestions
      const improvementSuggestions = this.config.enableAnalytics && analytics
        ? generateImprovementSuggestions({ ...currentSession, ...completionData }, analytics)
        : [];

      // Calculate detailed scores using exam engine
      const detailedScores = await this.examEngine.calculateDetailedScores(
        completionData.responses || currentSession.responses || [],
        currentSession.session_data?.examConfig
      );

      const now = new Date();
      const startedAt = new Date(currentSession.started_at);
      const finalDurationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

      const result = await mcp.query(
        async () => {
          const client = mcpClient.getClient();
          return await client
            .from('exam_sessions')
            .update({
              ...completionData,
              duration_seconds: finalDurationSeconds,
              detailed_scores: detailedScores,
              improvement_suggestions: improvementSuggestions,
              is_completed: true,
              state: 'completed',
              completed_at: now.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq('id', sessionId)
            .select()
            .single();
        },
        {
          table: 'exam_sessions',
          action: 'complete',
          userId: operatorUserId,
          metadata: { sessionId, completionData, analytics },
        }
      );

      if (result.error) {
        throw createDatabaseError('Failed to complete exam session', result.error);
      }

      const completedSession = result.data as ExamSession;

      // Update cache and mark as inactive
      this.cache.set(`session:${sessionId}`, completedSession, false);
      this.cache.invalidate(`user_sessions:${completedSession.user_id}`);

      // Stop auto-save
      this.stopAutoSave(sessionId);

      return completedSession;
    } catch (error) {
      if (error instanceof ExamServiceError) {
        throw error;
      }
      throw createDatabaseError('Unexpected error while completing exam session', error);
    }
  }

  /**
   * Abandon/Cancel exam session
   */
  async abandonExamSession(
    sessionId: UUID,
    reason: string,
    operatorUserId: string
  ): Promise<ExamSession> {
    try {
      const result = await mcp.query(
        async () => {
          const client = mcpClient.getClient();
          return await client
            .from('exam_sessions')
            .update({
              state: 'abandoned',
              abandonment_reason: reason,
              abandoned_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', sessionId)
            .select()
            .single();
        },
        {
          table: 'exam_sessions',
          action: 'abandon',
          userId: operatorUserId,
          metadata: { sessionId, reason },
        }
      );

      if (result.error) {
        throw createDatabaseError('Failed to abandon exam session', result.error);
      }

      if (!result.data) {
        throw createNotFoundError(sessionId);
      }

      const abandonedSession = result.data as ExamSession;

      // Update cache and mark as inactive
      this.cache.set(`session:${sessionId}`, abandonedSession, false);
      this.cache.invalidate(`user_sessions:${abandonedSession.user_id}`);

      // Stop auto-save
      this.stopAutoSave(sessionId);

      return abandonedSession;
    } catch (error) {
      if (error instanceof ExamServiceError) {
        throw error;
      }
      throw createDatabaseError('Unexpected error while abandoning exam session', error);
    }
  }

  // ===========================================================================
  // SESSION STATE MANAGEMENT
  // ===========================================================================

  /**
   * Validate session state transitions
   */
  private validateStateTransition(currentState: ExamSessionState, newState: ExamSessionState): void {
    const validTransitions: Record<ExamSessionState, ExamSessionState[]> = {
      created: ['in_progress', 'abandoned'],
      in_progress: ['paused', 'completed', 'abandoned', 'expired'],
      paused: ['in_progress', 'abandoned', 'expired'],
      completed: [], // Terminal state
      abandoned: [], // Terminal state
      expired: [], // Terminal state
    };

    const allowedStates = validTransitions[currentState] || [];
    
    if (!allowedStates.includes(newState)) {
      throw createSessionStateError(
        `Invalid state transition from ${currentState} to ${newState}`,
        currentState
      );
    }
  }

  /**
   * Check concurrent session limit for user
   */
  private async checkConcurrentSessionLimit(userId: UUID): Promise<void> {
    const activeSessions = await this.getUserSessions(userId, {
      includeCompleted: false,
      bypassCache: true,
    });

    if (activeSessions.length >= this.config.maxConcurrentSessions) {
      throw createConcurrencyError(this.config.maxConcurrentSessions);
    }
  }

  // ===========================================================================
  // AUTO-SAVE AND RECOVERY
  // ===========================================================================

  /**
   * Start auto-save timer for session
   */
  private startAutoSave(sessionId: UUID): void {
    if (this.autoSaveTimers.has(sessionId)) {
      return; // Already running
    }

    const timer = setInterval(async () => {
      try {
        await this.performAutoSave(sessionId);
      } catch (error) {
        console.error(`Auto-save failed for session ${sessionId}:`, error);
      }
    }, this.config.autoSaveIntervalMs);

    this.autoSaveTimers.set(sessionId, timer);
  }

  /**
   * Stop auto-save timer for session
   */
  private stopAutoSave(sessionId: UUID): void {
    const timer = this.autoSaveTimers.get(sessionId);
    if (timer) {
      clearInterval(timer);
      this.autoSaveTimers.delete(sessionId);
    }
  }

  /**
   * Perform auto-save operation
   */
  private async performAutoSave(sessionId: UUID): Promise<void> {
    const session = this.cache.get<ExamSession>(`session:${sessionId}`);
    if (!session || session.is_completed) {
      this.stopAutoSave(sessionId);
      return;
    }

    // Only auto-save if session has been modified
    const now = new Date();
    const lastUpdate = new Date(session.updated_at);
    const timeSinceUpdate = now.getTime() - lastUpdate.getTime();

    if (timeSinceUpdate < this.config.autoSaveIntervalMs) {
      return; // Too recent, skip
    }

    await mcp.query(
      async () => {
        const client = mcpClient.getClient();
        return await client
          .from('exam_sessions')
          .update({
            updated_at: now.toISOString(),
          })
          .eq('id', sessionId);
      },
      {
        table: 'exam_sessions',
        action: 'auto_save',
        metadata: { sessionId },
      }
    );
  }

  // ===========================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ===========================================================================

  /**
   * Subscribe to session changes for real-time updates
   */
  subscribeToSessionChanges(
    sessionId: UUID,
    callback: (payload: any) => void
  ): string {
    if (!this.config.enableRealtime) {
      throw new Error('Real-time subscriptions are disabled');
    }

    const subscriptionId = `session_${sessionId}_${Date.now()}`;
    
    const subscription = mcp.subscribe(
      'exam_sessions',
      `id=eq.${sessionId}`,
      (payload) => {
        // Update cache
        if (payload.new) {
          this.cache.set(`session:${sessionId}`, payload.new, !payload.new.is_completed);
        }
        
        callback(payload);
      }
    );

    this.realTimeSubscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }

  /**
   * Unsubscribe from session changes
   */
  unsubscribeFromSessionChanges(subscriptionId: string): void {
    const subscription = this.realTimeSubscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.realTimeSubscriptions.delete(subscriptionId);
    }
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Get session analytics
   */
  getSessionAnalytics(session: ExamSession): ExamSessionAnalytics {
    return calculateSessionAnalytics(session);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: boolean;
    cache: boolean;
    examEngine: boolean;
    autoSaveTimers: number;
    subscriptions: number;
  }> {
    let databaseHealthy = false;
    let examEngineHealthy = false;

    try {
      await mcp.query(
        async () => {
          const client = mcpClient.getClient();
          return await client.from('exam_sessions').select('id').limit(1);
        },
        {
          table: 'exam_sessions',
          action: 'health_check',
          metadata: { component: 'exam-service' },
        }
      );
      databaseHealthy = true;
    } catch {
      databaseHealthy = false;
    }

    try {
      examEngineHealthy = await this.examEngine.healthCheck();
    } catch {
      examEngineHealthy = false;
    }

    return {
      status: databaseHealthy && examEngineHealthy ? 'healthy' : 'unhealthy',
      database: databaseHealthy,
      cache: true,
      examEngine: examEngineHealthy,
      autoSaveTimers: this.autoSaveTimers.size,
      subscriptions: this.realTimeSubscriptions.size,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Stop all auto-save timers
    for (const timer of this.autoSaveTimers.values()) {
      clearInterval(timer);
    }
    this.autoSaveTimers.clear();

    // Unsubscribe from all real-time subscriptions
    for (const subscription of this.realTimeSubscriptions.values()) {
      subscription.unsubscribe();
    }
    this.realTimeSubscriptions.clear();

    // Clear cache
    this.cache.invalidate();
  }
}

// =============================================================================
// SINGLETON INSTANCE AND EXPORTS
// =============================================================================

// Create singleton instance with production configuration
export const examService = new ExamService({
  enableCaching: process.env.NODE_ENV === 'production',
  enableRealtime: process.env.NODE_ENV === 'production',
  enableAnalytics: true,
});

// Export types and utilities
export type { ExamServiceConfig, ExamServiceError };
export { 
  validateExamSessionData, 
  isValidExamSessionType, 
  isValidExamComponent, 
  isValidExamSessionState,
  calculateSessionAnalytics,
  generateImprovementSuggestions
};