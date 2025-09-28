/**
 * SwipeItem Model
 *
 * Database operations for swipe game items including:
 * - CRUD operations for swipe items
 * - Deck generation with filtering and difficulty balancing
 * - ELO rating updates and difficulty tracking
 * - Statistics aggregation and analytics
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SwipeItem,
  SwipeItemFilters,
  SwipeItemStats,
  Language,
  Level,
  ExamProvider,
  DeckGenerationParams,
  DeckGenerationResult
} from '@/lib/types/swipe-game';

export class SwipeItemModel {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get a single swipe item by ID
   */
  async getById(id: string): Promise<SwipeItem | null> {
    const { data, error } = await this.supabase
      .from('swipe_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching swipe item:', error);
      return null;
    }

    return data;
  }

  /**
   * Get multiple swipe items with filtering
   */
  async getItems(filters: SwipeItemFilters): Promise<SwipeItem[]> {
    let query = this.supabase
      .from('swipe_items')
      .select('*');

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
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }
    if (filters.difficulty_min !== undefined) {
      query = query.gte('difficulty_elo', filters.difficulty_min);
    }
    if (filters.difficulty_max !== undefined) {
      query = query.lte('difficulty_elo', filters.difficulty_max);
    }
    if (filters.exam_safe !== undefined) {
      query = query.eq('exam_safe', filters.exam_safe);
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching swipe items:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Generate a balanced deck of items for a game session
   */
  async generateDeck(params: DeckGenerationParams): Promise<DeckGenerationResult> {
    const { data, error } = await this.supabase
      .rpc('generate_swipe_deck', {
        p_lang: params.lang,
        p_level: params.level,
        p_exam: params.exam,
        p_skill: params.skill,
        p_size: params.size,
        p_user_id: params.user_id || null,
        p_tags: params.tags || null,
        p_difficulty_target: params.difficulty_target || null
      });

    if (error) {
      console.error('Error generating deck:', error);
      throw new Error(`Failed to generate deck: ${error.message}`);
    }

    return {
      items: data.items || [],
      metadata: {
        total_available: data.metadata?.total_available || 0,
        difficulty_range: data.metadata?.difficulty_range || { min: 1200, max: 1800 },
        tag_distribution: data.metadata?.tag_distribution || {},
        balance_score: data.metadata?.balance_score || 0.5
      },
      session_suggested_size: data.session_suggested_size || params.size,
      estimated_difficulty: data.estimated_difficulty || 1500
    };
  }

  /**
   * Update item difficulty (ELO rating) after user interaction
   */
  async updateDifficulty(
    itemId: string,
    userCorrect: boolean,
    userElo: number,
    kFactor: number = 20
  ): Promise<number> {
    const { data, error } = await this.supabase
      .rpc('update_item_elo', {
        p_item_id: itemId,
        p_user_correct: userCorrect,
        p_user_elo: userElo,
        p_k_factor: kFactor
      });

    if (error) {
      console.error('Error updating item ELO:', error);
      throw new Error(`Failed to update item difficulty: ${error.message}`);
    }

    return data;
  }

  /**
   * Get item statistics and performance metrics
   */
  async getItemStats(itemId: string): Promise<SwipeItemStats | null> {
    const { data, error } = await this.supabase
      .from('swipe_item_stats')
      .select('*')
      .eq('item_id', itemId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No stats found, return null
        return null;
      }
      console.error('Error fetching item stats:', error);
      return null;
    }

    return data;
  }

  /**
   * Update item statistics after user interaction
   */
  async updateItemStats(
    itemId: string,
    correct: boolean,
    responseTimeMs: number,
    userId?: string
  ): Promise<void> {
    const { error } = await this.supabase
      .rpc('update_item_statistics', {
        p_item_id: itemId,
        p_correct: correct,
        p_response_time_ms: responseTimeMs,
        p_user_id: userId || null
      });

    if (error) {
      console.error('Error updating item stats:', error);
      throw new Error(`Failed to update item statistics: ${error.message}`);
    }
  }

  /**
   * Create a new swipe item
   */
  async create(item: Omit<SwipeItem, 'id' | 'created_at' | 'updated_at'>): Promise<SwipeItem> {
    const { data, error } = await this.supabase
      .from('swipe_items')
      .insert([item])
      .select()
      .single();

    if (error) {
      console.error('Error creating swipe item:', error);
      throw new Error(`Failed to create item: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing swipe item
   */
  async update(id: string, updates: Partial<SwipeItem>): Promise<SwipeItem> {
    const { data, error } = await this.supabase
      .from('swipe_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating swipe item:', error);
      throw new Error(`Failed to update item: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a swipe item
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('swipe_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting swipe item:', error);
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  /**
   * Get items by tag with difficulty distribution
   */
  async getByTag(
    tag: string,
    lang: Language,
    level: Level,
    exam: ExamProvider,
    limit: number = 50
  ): Promise<SwipeItem[]> {
    const { data, error } = await this.supabase
      .from('swipe_items')
      .select('*')
      .contains('tags', [tag])
      .eq('lang', lang)
      .eq('level', level)
      .eq('exam', exam)
      .order('difficulty_elo')
      .limit(limit);

    if (error) {
      console.error('Error fetching items by tag:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get difficulty distribution for given filters
   */
  async getDifficultyDistribution(filters: SwipeItemFilters): Promise<{
    min: number;
    max: number;
    avg: number;
    quartiles: [number, number, number];
    count: number;
  }> {
    const { data, error } = await this.supabase
      .rpc('get_difficulty_distribution', {
        p_lang: filters.lang,
        p_level: filters.level,
        p_exam: filters.exam,
        p_tags: filters.tags || null
      });

    if (error) {
      console.error('Error getting difficulty distribution:', error);
      return {
        min: 1200,
        max: 1800,
        avg: 1500,
        quartiles: [1350, 1500, 1650],
        count: 0
      };
    }

    return data;
  }

  /**
   * Search items by term content
   */
  async searchItems(
    searchTerm: string,
    filters: SwipeItemFilters,
    limit: number = 20
  ): Promise<SwipeItem[]> {
    let query = this.supabase
      .from('swipe_items')
      .select('*')
      .or(`term.ilike.%${searchTerm}%,example.ilike.%${searchTerm}%`)
      .limit(limit);

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

    const { data, error } = await query;

    if (error) {
      console.error('Error searching items:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get random items for quick practice
   */
  async getRandomItems(
    filters: SwipeItemFilters,
    count: number = 10
  ): Promise<SwipeItem[]> {
    const { data, error } = await this.supabase
      .rpc('get_random_swipe_items', {
        p_lang: filters.lang,
        p_level: filters.level,
        p_exam: filters.exam,
        p_count: count,
        p_tags: filters.tags || null
      });

    if (error) {
      console.error('Error getting random items:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Bulk import items from array
   */
  async bulkImport(items: Omit<SwipeItem, 'id' | 'created_at' | 'updated_at'>[]): Promise<SwipeItem[]> {
    const { data, error } = await this.supabase
      .from('swipe_items')
      .insert(items)
      .select();

    if (error) {
      console.error('Error bulk importing items:', error);
      throw new Error(`Failed to bulk import items: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get tag usage statistics
   */
  async getTagStats(lang?: Language, level?: Level, exam?: ExamProvider): Promise<{
    tag: string;
    count: number;
    avg_difficulty: number;
  }[]> {
    const { data, error } = await this.supabase
      .rpc('get_tag_statistics', {
        p_lang: lang || null,
        p_level: level || null,
        p_exam: exam || null
      });

    if (error) {
      console.error('Error getting tag stats:', error);
      return [];
    }

    return data || [];
  }
}