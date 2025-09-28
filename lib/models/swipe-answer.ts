/**
 * SwipeAnswer Model
 *
 * Database operations for swipe game answers including:
 * - Answer submission and validation
 * - Performance tracking and analytics
 * - User learning progress measurement
 * - Answer pattern analysis
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SwipeAnswer,
  UserChoice,
  Language,
  Level,
  ExamProvider,
  Skill,
  AnswerAnalytics,
  LearningInsights
} from '@/lib/types/swipe-game';

export class SwipeAnswerModel {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Submit a new answer to the database
   */
  async submit(answer: Omit<SwipeAnswer, 'id' | 'created_at'>): Promise<SwipeAnswer> {
    const answerData = {
      ...answer,
      created_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('swipe_answers')
      .insert([answerData])
      .select()
      .single();

    if (error) {
      console.error('Error submitting answer:', error);
      throw new Error(`Failed to submit answer: ${error.message}`);
    }

    return data;
  }

  /**
   * Get answers for a specific session
   */
  async getBySession(sessionId: string): Promise<SwipeAnswer[]> {
    const { data, error } = await this.supabase
      .from('swipe_answers')
      .select('*')
      .eq('session_id', sessionId)
      .order('answered_at', { ascending: true });

    if (error) {
      console.error('Error fetching session answers:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's answer history with filtering
   */
  async getUserAnswers(
    userId: string,
    filters: {
      lang?: Language;
      level?: Level;
      exam?: ExamProvider;
      skill?: Skill;
      correct?: boolean;
      date_from?: string;
      date_to?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<SwipeAnswer[]> {
    let query = this.supabase
      .from('swipe_answers')
      .select('*')
      .eq('user_id', userId)
      .order('answered_at', { ascending: false });

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
    if (filters.correct !== undefined) {
      query = query.eq('correct', filters.correct);
    }
    if (filters.date_from) {
      query = query.gte('answered_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('answered_at', filters.date_to);
    }

    // Apply pagination
    if (filters.limit) {
      const offset = filters.offset || 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user answers:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get answer analytics for a user
   */
  async getUserAnalytics(
    userId: string,
    timespan: '7d' | '30d' | '90d' | 'all' = '30d'
  ): Promise<AnswerAnalytics> {
    const { data, error } = await this.supabase
      .rpc('get_user_answer_analytics', {
        p_user_id: userId,
        p_timespan: timespan
      });

    if (error) {
      console.error('Error fetching answer analytics:', error);
      return {
        total_answers: 0,
        correct_answers: 0,
        accuracy_percentage: 0,
        avg_response_time: 0,
        score_progression: [],
        tag_performance: {},
        difficulty_performance: {},
        time_of_day_performance: {},
        streak_analysis: {
          current_streak: 0,
          longest_streak: 0,
          streak_history: []
        }
      };
    }

    return data;
  }

  /**
   * Get learning insights based on answer patterns
   */
  async getLearningInsights(userId: string): Promise<LearningInsights> {
    const { data, error } = await this.supabase
      .rpc('get_learning_insights', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error fetching learning insights:', error);
      return {
        strengths: [],
        weakness_areas: [],
        recommended_focus: [],
        difficulty_trend: 'stable',
        learning_velocity: 0,
        mastery_progress: {},
        next_milestones: []
      };
    }

    return data;
  }

  /**
   * Get answers by item to analyze item difficulty
   */
  async getByItem(itemId: string, limit: number = 100): Promise<SwipeAnswer[]> {
    const { data, error } = await this.supabase
      .from('swipe_answers')
      .select('*')
      .eq('item_id', itemId)
      .order('answered_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching item answers:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Calculate item accuracy rate
   */
  async getItemAccuracy(itemId: string): Promise<{
    total_answers: number;
    correct_answers: number;
    accuracy_rate: number;
    avg_response_time: number;
  }> {
    const { data, error } = await this.supabase
      .rpc('calculate_item_accuracy', {
        p_item_id: itemId
      });

    if (error) {
      console.error('Error calculating item accuracy:', error);
      return {
        total_answers: 0,
        correct_answers: 0,
        accuracy_rate: 0,
        avg_response_time: 0
      };
    }

    return data;
  }

  /**
   * Get user's performance by tag
   */
  async getTagPerformance(
    userId: string,
    timespan: '7d' | '30d' | '90d' = '30d'
  ): Promise<Record<string, {
    total: number;
    correct: number;
    accuracy: number;
    avg_time: number;
    improvement_trend: 'improving' | 'stable' | 'declining';
  }>> {
    const { data, error } = await this.supabase
      .rpc('get_tag_performance', {
        p_user_id: userId,
        p_timespan: timespan
      });

    if (error) {
      console.error('Error fetching tag performance:', error);
      return {};
    }

    return data || {};
  }

  /**
   * Detect suspicious answer patterns
   */
  async detectSuspiciousAnswers(
    sessionId: string
  ): Promise<Array<{
    answer_id: string;
    suspicion_reasons: string[];
    confidence_score: number;
  }>> {
    const { data, error } = await this.supabase
      .rpc('detect_suspicious_patterns', {
        p_session_id: sessionId
      });

    if (error) {
      console.error('Error detecting suspicious answers:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Mark answer as suspicious
   */
  async markSuspicious(answerId: string, reason: string): Promise<void> {
    const { error } = await this.supabase
      .from('swipe_answers')
      .update({
        suspicious: true,
        suspicious_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', answerId);

    if (error) {
      console.error('Error marking answer as suspicious:', error);
      throw new Error(`Failed to mark answer as suspicious: ${error.message}`);
    }
  }

  /**
   * Get response time distribution for user
   */
  async getResponseTimeDistribution(
    userId: string,
    timespan: '7d' | '30d' | '90d' = '30d'
  ): Promise<{
    percentiles: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
      p95: number;
    };
    distribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    avg_by_correctness: {
      correct_avg: number;
      incorrect_avg: number;
    };
  }> {
    const { data, error } = await this.supabase
      .rpc('get_response_time_distribution', {
        p_user_id: userId,
        p_timespan: timespan
      });

    if (error) {
      console.error('Error fetching response time distribution:', error);
      return {
        percentiles: { p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 },
        distribution: [],
        avg_by_correctness: { correct_avg: 0, incorrect_avg: 0 }
      };
    }

    return data;
  }

  /**
   * Get user's mistake patterns
   */
  async getMistakePatterns(userId: string): Promise<Array<{
    item_id: string;
    term: string;
    mistake_count: number;
    last_mistake: string;
    pattern_type: 'recurring' | 'recent' | 'systematic';
    suggested_review: boolean;
  }>> {
    const { data, error } = await this.supabase
      .rpc('analyze_mistake_patterns', {
        p_user_id: userId
      });

    if (error) {
      console.error('Error analyzing mistake patterns:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Calculate user's learning curve
   */
  async getLearningCurve(
    userId: string,
    lang: Language,
    level: Level,
    exam: ExamProvider
  ): Promise<Array<{
    date: string;
    cumulative_answers: number;
    accuracy_rate: number;
    avg_score: number;
    confidence_interval: [number, number];
  }>> {
    const { data, error } = await this.supabase
      .rpc('calculate_learning_curve', {
        p_user_id: userId,
        p_lang: lang,
        p_level: level,
        p_exam: exam
      });

    if (error) {
      console.error('Error calculating learning curve:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get comparative performance metrics
   */
  async getComparativePerformance(
    userId: string,
    compareWith: 'all_users' | 'same_level' | 'same_exam' = 'same_level'
  ): Promise<{
    user_percentile: number;
    user_accuracy: number;
    comparison_accuracy: number;
    user_speed: number;
    comparison_speed: number;
    rank_position: number;
    total_users: number;
  }> {
    const { data, error } = await this.supabase
      .rpc('get_comparative_performance', {
        p_user_id: userId,
        p_compare_with: compareWith
      });

    if (error) {
      console.error('Error fetching comparative performance:', error);
      return {
        user_percentile: 0,
        user_accuracy: 0,
        comparison_accuracy: 0,
        user_speed: 0,
        comparison_speed: 0,
        rank_position: 0,
        total_users: 0
      };
    }

    return data;
  }

  /**
   * Bulk export answers for data analysis
   */
  async exportAnswers(
    userId: string,
    filters: {
      date_from?: string;
      date_to?: string;
      lang?: Language;
      level?: Level;
      exam?: ExamProvider;
    } = {}
  ): Promise<SwipeAnswer[]> {
    let query = this.supabase
      .from('swipe_answers')
      .select('*')
      .eq('user_id', userId)
      .order('answered_at', { ascending: true });

    // Apply filters
    if (filters.date_from) {
      query = query.gte('answered_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('answered_at', filters.date_to);
    }
    if (filters.lang) {
      query = query.eq('lang', filters.lang);
    }
    if (filters.level) {
      query = query.eq('level', filters.level);
    }
    if (filters.exam) {
      query = query.eq('exam', filters.exam);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error exporting answers:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Delete user's answer data (GDPR compliance)
   */
  async deleteUserData(userId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('swipe_answers')
      .delete()
      .eq('user_id', userId)
      .select('id');

    if (error) {
      console.error('Error deleting user answer data:', error);
      throw new Error(`Failed to delete user data: ${error.message}`);
    }

    return data?.length || 0;
  }

  /**
   * Get answer statistics for admin dashboard
   */
  async getAdminStats(
    filters: {
      date_from?: string;
      date_to?: string;
      lang?: Language;
      level?: Level;
      exam?: ExamProvider;
    } = {}
  ): Promise<{
    total_answers: number;
    overall_accuracy: number;
    avg_response_time: number;
    suspicious_count: number;
    top_performing_items: Array<{
      item_id: string;
      term: string;
      accuracy_rate: number;
      answer_count: number;
    }>;
    struggling_items: Array<{
      item_id: string;
      term: string;
      accuracy_rate: number;
      answer_count: number;
    }>;
  }> {
    const { data, error } = await this.supabase
      .rpc('get_admin_answer_stats', {
        p_date_from: filters.date_from || null,
        p_date_to: filters.date_to || null,
        p_lang: filters.lang || null,
        p_level: filters.level || null,
        p_exam: filters.exam || null
      });

    if (error) {
      console.error('Error fetching admin answer stats:', error);
      return {
        total_answers: 0,
        overall_accuracy: 0,
        avg_response_time: 0,
        suspicious_count: 0,
        top_performing_items: [],
        struggling_items: []
      };
    }

    return data;
  }
}