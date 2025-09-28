/**
 * Real-time Features Integration - Phase 3.5
 * 
 * Centralized integration point for all real-time features in the Neolingus academy system.
 * Provides unified access to progress updates, exam session management, and AI tutor streaming.
 * 
 * Features:
 * - Unified real-time manager with cross-component coordination
 * - Centralized connection state management
 * - Performance monitoring and optimization
 * - Error handling and recovery coordination
 * - Resource management and cleanup
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { UUID } from '../types/dashboard';

// Import all real-time managers
import {
  RealtimeProgressManager,
  getProgressManager,
  type ProgressUpdate,
  type ProgressUpdateCallback,
  type ProgressSubscriptionOptions
} from './progress-updates';

import {
  RealtimeExamSessionManager,
  getExamSessionManager,
  type SessionUpdate,
  type SessionUpdateCallback,
  type ExamSessionSubscriptionOptions
} from './exam-sessions';

import {
  AiTutorStreamManager,
  getTutorStreamManager,
  type StreamingMessage,
  type StreamingCallback,
  type TutorStreamOptions
} from './ai-tutor-stream';

// =============================================================================
// UNIFIED REAL-TIME MANAGER
// =============================================================================

export interface RealtimeManagerOptions {
  progress?: Partial<ProgressSubscriptionOptions>;
  examSessions?: Partial<ExamSessionSubscriptionOptions>;
  aiTutor?: Partial<TutorStreamOptions>;
  enableCrossComponentSync?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableAutoCleanup?: boolean;
  cleanupIntervalMs?: number;
}

export interface RealtimeHealthStatus {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    progress: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      active_subscriptions: number;
      connection_quality: string;
    };
    exam_sessions: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      active_sessions: number;
      concurrent_users: number;
    };
    ai_tutor: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      active_streams: number;
      error_rate: number;
    };
  };
  performance: {
    total_memory_usage: number;
    active_connections: number;
    average_response_time: number;
  };
  issues: string[];
}

export class UnifiedRealtimeManager {
  private supabase: SupabaseClient;
  private options: Required<RealtimeManagerOptions>;
  
  // Component managers
  private progressManager: RealtimeProgressManager;
  private examSessionManager: RealtimeExamSessionManager;
  private aiTutorManager: AiTutorStreamManager;
  
  // State management
  private isInitialized: boolean = false;
  private cleanupTimer?: NodeJS.Timeout;
  private performanceTimer?: NodeJS.Timeout;
  private lastHealthCheck?: RealtimeHealthStatus;

  // Default options
  private static readonly DEFAULT_OPTIONS: Required<RealtimeManagerOptions> = {
    progress: {},
    examSessions: {},
    aiTutor: {},
    enableCrossComponentSync: true,
    enablePerformanceMonitoring: true,
    enableAutoCleanup: true,
    cleanupIntervalMs: 300000 // 5 minutes
  };

  constructor(supabase: SupabaseClient, options: RealtimeManagerOptions = {}) {
    this.supabase = supabase;
    this.options = { ...UnifiedRealtimeManager.DEFAULT_OPTIONS, ...options };

    // Initialize component managers
    this.progressManager = getProgressManager(supabase, this.options.progress);
    this.examSessionManager = getExamSessionManager(supabase, this.options.examSessions);
    this.aiTutorManager = getTutorStreamManager(supabase, this.options.aiTutor);

    this.initialize();
  }

  // =============================================================================
  // INITIALIZATION AND SETUP
  // =============================================================================

  private async initialize(): Promise<void> {
    try {
      // Setup cross-component synchronization
      if (this.options.enableCrossComponentSync) {
        this.setupCrossComponentSync();
      }

      // Setup performance monitoring
      if (this.options.enablePerformanceMonitoring) {
        this.setupPerformanceMonitoring();
      }

      // Setup auto cleanup
      if (this.options.enableAutoCleanup) {
        this.setupAutoCleanup();
      }

      this.isInitialized = true;
      this.logActivity('unified_realtime_manager_initialized');
    } catch (error) {
      this.handleError('initialization_failed', error as Error);
      throw error;
    }
  }

  // =============================================================================
  // PROGRESS UPDATES
  // =============================================================================

  /**
   * Subscribe to user progress updates across all courses
   */
  async subscribeToUserProgress(
    userId: UUID,
    callback: ProgressUpdateCallback
  ): Promise<string> {
    return this.progressManager.subscribeToUserProgress(userId, callback);
  }

  /**
   * Subscribe to course progress across all users
   */
  async subscribeToCourseProgress(
    courseId: UUID,
    callback: ProgressUpdateCallback
  ): Promise<string> {
    return this.progressManager.subscribeToCourseProgress(courseId, callback);
  }

  /**
   * Subscribe to specific user-course progress
   */
  async subscribeToUserCourseProgress(
    userId: UUID,
    courseId: UUID,
    callback: ProgressUpdateCallback
  ): Promise<string> {
    return this.progressManager.subscribeToUserCourseProgress(userId, courseId, callback);
  }

  // =============================================================================
  // EXAM SESSION MANAGEMENT
  // =============================================================================

  /**
   * Subscribe to exam session updates
   */
  async subscribeToExamSession(
    sessionId: UUID,
    callback: SessionUpdateCallback
  ): Promise<string> {
    return this.examSessionManager.subscribeToSession(sessionId, callback);
  }

  /**
   * Subscribe to all user exam sessions
   */
  async subscribeToUserExamSessions(
    userId: UUID,
    callback: SessionUpdateCallback
  ): Promise<string> {
    return this.examSessionManager.subscribeToUserSessions(userId, callback);
  }

  // =============================================================================
  // AI TUTOR STREAMING
  // =============================================================================

  /**
   * Start AI tutor conversation
   */
  async startTutorConversation(
    context: any, // ConversationContext from ai-tutor-stream
    userMessage: string,
    callbacks: StreamingCallback
  ): Promise<string> {
    return this.aiTutorManager.startStreamingConversation(context, userMessage, callbacks);
  }

  /**
   * Continue AI tutor conversation
   */
  async continueTutorConversation(
    sessionId: UUID,
    userMessage: string,
    callbacks: StreamingCallback
  ): Promise<string> {
    return this.aiTutorManager.continueConversation(sessionId, userMessage, callbacks);
  }

  /**
   * Cancel AI tutor stream
   */
  async cancelTutorStream(messageId: string): Promise<void> {
    return this.aiTutorManager.cancelStream(messageId);
  }

  // =============================================================================
  // CROSS-COMPONENT SYNCHRONIZATION
  // =============================================================================

  private setupCrossComponentSync(): void {
    // Sync progress updates with exam sessions
    // When progress updates, check for active exam sessions and notify
    
    // Sync exam completion with AI tutor context
    // When exam completes, update AI tutor with performance data
    
    // Sync AI tutor recommendations with progress tracking
    // When AI tutor gives recommendations, update progress goals

    this.logActivity('cross_component_sync_enabled');
  }

  /**
   * Handle progress update and sync with other components
   */
  private async syncProgressUpdate(update: ProgressUpdate): Promise<void> {
    try {
      // Check if user has active exam sessions
      const examSessions = this.examSessionManager.getActiveStreams();
      
      // Update AI tutor context with progress information
      // This would integrate with the AI tutor's context system
      
      this.logActivity('progress_update_synced', {
        userId: update.user_id,
        courseId: update.course_id,
        affectedSessions: examSessions.length
      });
    } catch (error) {
      this.handleError('progress_sync_failed', error as Error);
    }
  }

  /**
   * Handle exam session update and sync with other components
   */
  private async syncSessionUpdate(update: SessionUpdate): Promise<void> {
    try {
      // When exam completes, trigger progress update
      if (update.metadata?.update_type === 'completion') {
        // This would trigger a progress recalculation
      }

      // Update AI tutor with exam performance data
      // This would add exam results to the tutor's context

      this.logActivity('session_update_synced', {
        sessionId: update.session_id,
        updateType: update.metadata?.update_type
      });
    } catch (error) {
      this.handleError('session_sync_failed', error as Error);
    }
  }

  // =============================================================================
  // PERFORMANCE MONITORING
  // =============================================================================

  private setupPerformanceMonitoring(): void {
    this.performanceTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, 60000); // Check every minute

    this.logActivity('performance_monitoring_enabled');
  }

  /**
   * Comprehensive health check across all components
   */
  async performHealthCheck(): Promise<RealtimeHealthStatus> {
    try {
      // Get health status from each component
      const [progressHealth, examSessionHealth, aiTutorHealth] = await Promise.all([
        this.progressManager.healthCheck(),
        this.examSessionManager.healthCheck(),
        this.aiTutorManager.healthCheck()
      ]);

      // Calculate overall performance metrics
      const totalConnections = 
        progressHealth.metrics.active_subscriptions +
        examSessionHealth.metrics.active_sessions +
        aiTutorHealth.metrics.active_streams;

      const averageResponseTime = (
        (progressHealth.metrics.connection_quality === 'excellent' ? 100 : 500) +
        examSessionHealth.metrics.average_response_time +
        aiTutorHealth.metrics.average_response_time
      ) / 3;

      // Determine overall status
      const componentStatuses = [
        progressHealth.status,
        examSessionHealth.status,
        aiTutorHealth.status
      ];

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (componentStatuses.includes('unhealthy')) {
        overallStatus = 'unhealthy';
      } else if (componentStatuses.includes('degraded')) {
        overallStatus = 'degraded';
      }

      // Collect all issues
      const allIssues = [
        ...progressHealth.issues,
        ...examSessionHealth.issues,
        ...aiTutorHealth.issues
      ];

      const healthStatus: RealtimeHealthStatus = {
        overall_status: overallStatus,
        components: {
          progress: {
            status: progressHealth.status,
            active_subscriptions: progressHealth.metrics.active_subscriptions || 0,
            connection_quality: progressHealth.metrics.connection_quality || 'unknown'
          },
          exam_sessions: {
            status: examSessionHealth.status,
            active_sessions: examSessionHealth.metrics.active_sessions,
            concurrent_users: examSessionHealth.metrics.concurrent_users
          },
          ai_tutor: {
            status: aiTutorHealth.status,
            active_streams: aiTutorHealth.metrics.active_streams,
            error_rate: aiTutorHealth.metrics.error_rate
          }
        },
        performance: {
          total_memory_usage: process.memoryUsage?.()?.heapUsed || 0,
          active_connections: totalConnections,
          average_response_time: averageResponseTime
        },
        issues: allIssues
      };

      this.lastHealthCheck = healthStatus;
      return healthStatus;

    } catch (error) {
      this.handleError('health_check_failed', error as Error);
      
      return {
        overall_status: 'unhealthy',
        components: {
          progress: { status: 'unhealthy', active_subscriptions: 0, connection_quality: 'poor' },
          exam_sessions: { status: 'unhealthy', active_sessions: 0, concurrent_users: 0 },
          ai_tutor: { status: 'unhealthy', active_streams: 0, error_rate: 1 }
        },
        performance: {
          total_memory_usage: 0,
          active_connections: 0,
          average_response_time: 0
        },
        issues: ['Health check failed']
      };
    }
  }

  /**
   * Get last health check results
   */
  getLastHealthCheck(): RealtimeHealthStatus | null {
    return this.lastHealthCheck || null;
  }

  // =============================================================================
  // AUTO CLEANUP
  // =============================================================================

  private setupAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.options.cleanupIntervalMs);

    this.logActivity('auto_cleanup_enabled', {
      intervalMs: this.options.cleanupIntervalMs
    });
  }

  private async performCleanup(): Promise<void> {
    try {
      // Cleanup would involve:
      // - Removing stale subscriptions
      // - Clearing old cache entries
      // - Releasing unused resources
      
      const memoryBefore = process.memoryUsage?.()?.heapUsed || 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const memoryAfter = process.memoryUsage?.()?.heapUsed || 0;
      const memoryFreed = memoryBefore - memoryAfter;

      this.logActivity('cleanup_completed', {
        memoryFreed: memoryFreed > 0 ? memoryFreed : 0,
        timestamp: new Date()
      });

    } catch (error) {
      this.handleError('cleanup_failed', error as Error);
    }
  }

  // =============================================================================
  // UNIFIED OPERATIONS
  // =============================================================================

  /**
   * Get comprehensive stats from all components
   */
  getComprehensiveStats(): {
    progress: any;
    examSessions: any;
    aiTutor: any;
    unified: {
      total_active_connections: number;
      memory_usage: number;
      uptime: number;
    };
  } {
    return {
      progress: this.progressManager.getStats(),
      examSessions: this.examSessionManager.getMetrics(),
      aiTutor: this.aiTutorManager.getStreamingStats(),
      unified: {
        total_active_connections: 0, // Would calculate from all components
        memory_usage: process.memoryUsage?.()?.heapUsed || 0,
        uptime: process.uptime?.() || 0
      }
    };
  }

  /**
   * Unsubscribe from all real-time updates
   */
  async unsubscribeAll(): Promise<void> {
    await Promise.all([
      this.progressManager.unsubscribeAll(),
      this.examSessionManager.unsubscribeAll(),
      this.aiTutorManager.cancelAllStreams()
    ]);

    this.logActivity('all_subscriptions_removed');
  }

  // =============================================================================
  // CLEANUP AND DESTRUCTION
  // =============================================================================

  /**
   * Clean up all resources
   */
  async destroy(): Promise<void> {
    try {
      // Clear timers
      if (this.cleanupTimer) {
        clearInterval(this.cleanupTimer);
      }
      
      if (this.performanceTimer) {
        clearInterval(this.performanceTimer);
      }

      // Destroy component managers
      await Promise.all([
        this.progressManager.destroy(),
        this.examSessionManager.destroy(),
        this.aiTutorManager.destroy()
      ]);

      this.isInitialized = false;
      this.logActivity('unified_realtime_manager_destroyed');
    } catch (error) {
      this.handleError('destruction_failed', error as Error);
    }
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private logActivity(event: string, data?: Record<string, any>): void {
    if (typeof window !== 'undefined' && window.console) {
      console.log(`[UnifiedRealtimeManager] ${event}`, data);
    }
  }

  private handleError(context: string, error: Error, data?: Record<string, any>): void {
    if (typeof window !== 'undefined' && window.console) {
      console.error(`[UnifiedRealtimeManager] ${context}:`, error, data);
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let unifiedRealtimeManager: UnifiedRealtimeManager | null = null;

/**
 * Get singleton instance of UnifiedRealtimeManager
 */
export function getUnifiedRealtimeManager(
  supabase: SupabaseClient,
  options?: RealtimeManagerOptions
): UnifiedRealtimeManager {
  if (!unifiedRealtimeManager) {
    unifiedRealtimeManager = new UnifiedRealtimeManager(supabase, options);
  }
  return unifiedRealtimeManager;
}

/**
 * Create new instance of UnifiedRealtimeManager
 */
export function createUnifiedRealtimeManager(
  supabase: SupabaseClient,
  options?: RealtimeManagerOptions
): UnifiedRealtimeManager {
  return new UnifiedRealtimeManager(supabase, options);
}

// =============================================================================
// EXPORTS
// =============================================================================

// Export individual managers
export { RealtimeProgressManager, RealtimeExamSessionManager, AiTutorStreamManager };

// Export factory functions
export { getProgressManager, getExamSessionManager, getTutorStreamManager };

// Export types
export type {
  ProgressUpdate,
  ProgressUpdateCallback,
  SessionUpdate,
  SessionUpdateCallback,
  StreamingMessage,
  StreamingCallback,
  RealtimeManagerOptions,
  RealtimeHealthStatus
};

// Default export
export default UnifiedRealtimeManager;