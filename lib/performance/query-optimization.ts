/**
 * Database Query Optimization Module
 * Optimizes queries for the Academy system with caching and indexing strategies
 */

import { createClient } from '@/utils/supabase/server'

interface QueryCacheEntry {
  data: any
  timestamp: number
  ttl: number
}

interface QueryMetrics {
  query: string
  executionTime: number
  rowCount: number
  cached: boolean
  timestamp: Date
}

class QueryOptimizer {
  private static cache = new Map<string, QueryCacheEntry>()
  private static metrics: QueryMetrics[] = []
  private static readonly DEFAULT_TTL = 300000 // 5 minutes
  private static readonly MAX_METRICS = 1000

  /**
   * Optimized course query with proper indexing hints
   */
  static async getOptimizedCourses(
    language?: string,
    level?: string,
    includeProgress?: boolean,
    userId?: string
  ) {
    const supabase = await createClient()
    const cacheKey = `courses:${language}:${level}:${includeProgress}:${userId}`
    
    // Check cache first
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      this.recordMetric('getCourses', 0, cached.length, true)
      return cached
    }

    const startTime = Date.now()
    
    let query = supabase
      .from('academy_courses')
      .select(`
        *,
        academy_modules!inner(
          id,
          title,
          order_index,
          is_active
        )
      `)
      .eq('is_active', true)
      .order('order_index', { ascending: true })

    if (language) {
      query = query.eq('language', language)
    }

    if (level) {
      query = query.eq('cefr_level', level)
    }

    // Include progress if requested and user provided
    if (includeProgress && userId) {
      query = query.select(`
        *,
        academy_modules!inner(*),
        academy_user_progress!left(
          completed_percentage,
          last_activity,
          streak_days
        )
      `)
    }

    const { data, error } = await query

    if (error) throw error

    const executionTime = Date.now() - startTime
    this.recordMetric('getCourses', executionTime, data?.length || 0, false)
    
    // Cache the result
    this.setCache(cacheKey, data, this.DEFAULT_TTL)
    
    return data
  }

  /**
   * Optimized exam results query with aggregation
   */
  static async getOptimizedExamResults(
    userId: string,
    courseId?: string,
    limit = 10
  ) {
    const supabase = await createClient()
    const cacheKey = `exam-results:${userId}:${courseId}:${limit}`
    
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      this.recordMetric('getExamResults', 0, cached.length, true)
      return cached
    }

    const startTime = Date.now()
    
    // Use RPC for optimized aggregation
    const { data, error } = await supabase.rpc('get_user_exam_results', {
      p_user_id: userId,
      p_course_id: courseId,
      p_limit: limit
    })

    if (error) throw error

    const executionTime = Date.now() - startTime
    this.recordMetric('getExamResults', executionTime, data?.length || 0, false)
    
    this.setCache(cacheKey, data, this.DEFAULT_TTL)
    
    return data
  }

  /**
   * Batch query optimization for multiple entities
   */
  static async batchQuery<T>(
    table: string,
    ids: string[],
    columns = '*'
  ): Promise<T[]> {
    if (ids.length === 0) return []

    const supabase = await createClient()
    const cacheKey = `batch:${table}:${ids.join(',')}`
    
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      this.recordMetric(`batch-${table}`, 0, cached.length, true)
      return cached
    }

    const startTime = Date.now()
    
    // Use IN operator for batch fetching
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .in('id', ids)

    if (error) throw error

    const executionTime = Date.now() - startTime
    this.recordMetric(`batch-${table}`, executionTime, data?.length || 0, false)
    
    this.setCache(cacheKey, data, this.DEFAULT_TTL)
    
    return data as T[]
  }

  /**
   * Optimized analytics query with materialized view
   */
  static async getOptimizedAnalytics(
    userId: string,
    dateRange: { start: Date; end: Date }
  ) {
    const supabase = await createClient()
    const cacheKey = `analytics:${userId}:${dateRange.start.toISOString()}:${dateRange.end.toISOString()}`
    
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      this.recordMetric('getAnalytics', 0, 1, true)
      return cached
    }

    const startTime = Date.now()
    
    // Use materialized view for faster analytics
    const { data, error } = await supabase
      .from('academy_analytics_view')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateRange.start.toISOString())
      .lte('date', dateRange.end.toISOString())
      .single()

    if (error && error.code !== 'PGRST116') throw error

    const executionTime = Date.now() - startTime
    this.recordMetric('getAnalytics', executionTime, 1, false)
    
    // Cache analytics for longer (30 minutes)
    this.setCache(cacheKey, data, this.DEFAULT_TTL * 6)
    
    return data
  }

  /**
   * Prefetch related data for performance
   */
  static async prefetchRelatedData(
    entity: string,
    id: string,
    relations: string[]
  ) {
    const supabase = await createClient()
    const cacheKey = `prefetch:${entity}:${id}:${relations.join(',')}`
    
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const startTime = Date.now()
    
    // Build select query with relations
    const selectQuery = `*, ${relations.join(', ')}`
    
    const { data, error } = await supabase
      .from(entity)
      .select(selectQuery)
      .eq('id', id)
      .single()

    if (error) throw error

    const executionTime = Date.now() - startTime
    this.recordMetric(`prefetch-${entity}`, executionTime, 1, false)
    
    this.setCache(cacheKey, data, this.DEFAULT_TTL)
    
    return data
  }

  /**
   * Cache management utilities
   */
  private static getFromCache(key: string): any {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  private static setCache(key: string, data: any, ttl: number) {
    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Clear cache for specific patterns
   */
  static clearCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear()
      return
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Performance metrics recording
   */
  private static recordMetric(
    query: string,
    executionTime: number,
    rowCount: number,
    cached: boolean
  ) {
    this.metrics.push({
      query,
      executionTime,
      rowCount,
      cached,
      timestamp: new Date()
    })
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS)
    }
  }

  /**
   * Get performance metrics
   */
  static getMetrics() {
    const totalQueries = this.metrics.length
    const cachedQueries = this.metrics.filter(m => m.cached).length
    const avgExecutionTime = this.metrics
      .filter(m => !m.cached)
      .reduce((sum, m) => sum + m.executionTime, 0) / (totalQueries - cachedQueries || 1)
    
    return {
      totalQueries,
      cachedQueries,
      cacheHitRate: (cachedQueries / totalQueries) * 100,
      avgExecutionTime,
      recentQueries: this.metrics.slice(-10)
    }
  }
}

// Database connection pooling configuration
export const connectionPoolConfig = {
  max: 20, // Maximum connections
  min: 5,  // Minimum connections
  idle: 10000, // Close idle connections after 10 seconds
  acquire: 30000, // Maximum time to acquire connection
  evict: 1000 // Check for idle connections every second
}

// Index recommendations for optimal performance
export const indexRecommendations = [
  'CREATE INDEX idx_courses_language_level ON academy_courses(language, cefr_level) WHERE is_active = true',
  'CREATE INDEX idx_modules_course_order ON academy_modules(course_id, order_index) WHERE is_active = true',
  'CREATE INDEX idx_progress_user_course ON academy_user_progress(user_id, course_id)',
  'CREATE INDEX idx_exam_results_user_date ON academy_exam_results(user_id, created_at DESC)',
  'CREATE INDEX idx_analytics_user_date ON academy_analytics(user_id, date DESC)',
  'CREATE INDEX idx_achievements_user ON academy_achievements(user_id) WHERE unlocked = true'
]

export default QueryOptimizer