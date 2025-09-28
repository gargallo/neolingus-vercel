/**
 * SwipeSession Model
 *
 * Database operations for swipe game sessions including:
 * - Session lifecycle management (create, update, complete)
 * - Progress tracking and real-time updates
 * - Session analytics and performance metrics
 * - User session history and statistics
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SwipeSession,
  SwipeSessionSummary,
  SessionStatus,
  Language,
  Level,
  ExamProvider,
  Skill,
  CreateSessionParams,
  SessionFilters,
  SessionAnalytics
} from '@/lib/types/swipe-game';

export class SwipeSessionModel {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new swipe session
   */
  async create(params: CreateSessionParams): Promise<SwipeSession> {
    const sessionData = {
      user_id: params.user_id,
      config: {
        lang: params.lang,
        level: params.level,
        exam: params.exam,
        skill: params.skill
      },
      duration_s: params.duration_s,
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('swipe_sessions')
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating swipe session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a session by ID
   */
  async getById(id: string): Promise<SwipeSession | null> {
    const { data, error } = await this.supabase
      .from('swipe_sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching swipe session:', error);
      return null;
    }

    return data;
  }

  /**
   * Update session progress and status
   */
  async updateProgress(
    id: string,
    updates: {
      answers_count?: number;
      current_score?: number;
      status?: SessionStatus;
      ended_at?: string;
      summary?: SwipeSessionSummary;
    }
  ): Promise<SwipeSession> {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('swipe_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating session progress:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }

    return data;
  }

  /**
   * Complete a session with final summary
   */
  async complete(id: string, summary: SwipeSessionSummary): Promise<SwipeSession> {
    const updateData = {
      status: 'completed' as SessionStatus,
      ended_at: new Date().toISOString(),
      summary: summary,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('swipe_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error completing session:', error);
      throw new Error(`Failed to complete session: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's session history with filtering
   */
  async getUserSessions(
    userId: string,
    filters: SessionFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<SwipeSession[]> {
    let query = this.supabase
      .from('swipe_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.lang) {
      query = query.eq('lang', filters.lang);
    }
    if (filters.level) {
      query = query.eq('level', filters.level);
    }
    if (filters.exam) {
      query = query.eq('exam', filters.exam);
    }
    if (filters.skill) {
      query = query.eq('skill', filters.skill);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get session analytics for a user
   */
  async getUserAnalytics(
    userId: string,
    timespan: '7d' | '30d' | '90d' | 'all' = '30d'
  ): Promise<SessionAnalytics> {
    const { data, error } = await this.supabase
      .rpc('get_user_session_analytics', {
        p_user_id: userId,
        p_timespan: timespan
      });

    if (error) {
      console.error('Error fetching user analytics:', error);
      return {
        total_sessions: 0,
        total_answers: 0,
        avg_accuracy: 0,
        avg_score: 0,
        total_time_minutes: 0,
        best_streak: 0,
        accuracy_trend: [],
        score_trend: [],
        tag_performance: {},
        difficulty_progression: []
      };
    }

    return data;
  }

  /**
   * Get active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<SwipeSession[]> {
    const { data, error } = await this.supabase
      .from('swipe_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active sessions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Abandon/cancel an active session
   */
  async abandon(id: string): Promise<SwipeSession> {
    const updateData = {
      status: 'abandoned' as SessionStatus,
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('swipe_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error abandoning session:', error);
      throw new Error(`Failed to abandon session: ${error.message}`);
    }

    return data;
  }

  /**
   * Get session performance comparison
   */
  async comparePerformance(
    userId: string,
    sessionId: string,
    compareWith: 'previous' | 'average' | 'best' = 'previous'
  ): Promise<{
    current: SwipeSessionSummary;
    comparison: SwipeSessionSummary;
    improvements: {
      score: number;
      accuracy: number;
      speed: number;
      streak: number;
    };
  } | null> {
    const { data, error } = await this.supabase
      .rpc('compare_session_performance', {
        p_user_id: userId,
        p_session_id: sessionId,
        p_compare_with: compareWith
      });

    if (error) {
      console.error('Error comparing session performance:', error);
      return null;
    }

    return data;
  }

  /**
   * Get session leaderboard data
   */
  async getLeaderboard(
    lang: Language,
    level: Level,
    exam: ExamProvider,
    timespan: '24h' | '7d' | '30d' = '7d',
    limit: number = 10
  ): Promise<Array<{
    user_id: string;
    username?: string;
    best_score: number;
    best_accuracy: number;
    total_sessions: number;
    rank: number;
  }>> {
    const { data, error } = await this.supabase
      .rpc('get_session_leaderboard', {
        p_lang: lang,
        p_level: level,
        p_exam: exam,
        p_timespan: timespan,
        p_limit: limit
      });

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get session statistics for admin dashboard
   */
  async getAdminStats(
    filters: {
      lang?: Language;
      level?: Level;
      exam?: ExamProvider;
      date_from?: string;
      date_to?: string;
    } = {}
  ): Promise<{
    total_sessions: number;
    active_sessions: number;
    avg_completion_rate: number;
    avg_session_duration: number;
    most_popular_configs: Array<{
      lang: string;
      level: string;
      exam: string;
      count: number;
    }>;
    performance_trends: Array<{
      date: string;
      avg_score: number;
      avg_accuracy: number;
      session_count: number;
    }>;
  }> {
    const { data, error } = await this.supabase
      .rpc('get_admin_session_stats', {
        p_lang: filters.lang || null,
        p_level: filters.level || null,
        p_exam: filters.exam || null,
        p_date_from: filters.date_from || null,
        p_date_to: filters.date_to || null
      });

    if (error) {
      console.error('Error fetching admin stats:', error);
      return {
        total_sessions: 0,
        active_sessions: 0,
        avg_completion_rate: 0,
        avg_session_duration: 0,
        most_popular_configs: [],
        performance_trends: []
      };
    }

    return data;
  }

  /**
   * Clean up old abandoned sessions
   */
  async cleanupAbandonedSessions(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

    const { data, error } = await this.supabase
      .from('swipe_sessions')
      .update({
        status: 'abandoned',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('status', 'active')
      .lt('created_at', cutoffTime.toISOString())
      .select('id');

    if (error) {
      console.error('Error cleaning up abandoned sessions:', error);
      return 0;
    }

    return data?.length || 0;
  }

  /**
   * Get session duration statistics
   */
  async getDurationStats(
    userId?: string,
    timespan: '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    avg_duration: number;
    median_duration: number;
    completion_rate: number;
    duration_distribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  }> {
    const { data, error } = await this.supabase
      .rpc('get_session_duration_stats', {
        p_user_id: userId || null,
        p_timespan: timespan
      });

    if (error) {
      console.error('Error fetching duration stats:', error);
      return {
        avg_duration: 0,
        median_duration: 0,
        completion_rate: 0,
        duration_distribution: []
      };
    }

    return data;
  }

  /**
   * Export session data for analytics
   */
  async exportUserData(
    userId: string,
    format: 'json' | 'csv' = 'json',
    dateRange?: { from: string; to: string }
  ): Promise<SwipeSession[]> {
    let query = this.supabase
      .from('swipe_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error exporting user data:', error);
      return [];
    }

    return data || [];
  }
}