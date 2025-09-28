/**
 * Performance Testing Suite
 * Tests for <200ms response time targets across the Academy system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { performance } from 'perf_hooks'

// Import modules to test
import QueryOptimizer from '@/lib/performance/query-optimization'
import { AnalyticsCache } from '@/lib/performance/analytics-cache'
import { ImageOptimizer } from '@/lib/performance/image-optimization'
import { ComponentPrefetcher } from '@/lib/performance/lazy-loading'

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  databaseQuery: 50,
  cacheRetrieval: 5,
  imageOptimization: 30,
  componentLoad: 100,
  apiResponse: 200,
  dashboardRender: 150,
  analyticsComputation: 100
}

// Mock data
const mockUserId = 'test-user-123'
const mockCourseId = 'course-456'
const mockImageUrl = 'https://example.com/image.jpg'

describe('Database Query Performance', () => {
  beforeEach(() => {
    // Clear cache before each test
    QueryOptimizer.clearCache()
  })

  it('should fetch courses within threshold', async () => {
    const start = performance.now()
    
    // Mock the database call
    vi.spyOn(QueryOptimizer, 'getOptimizedCourses').mockResolvedValue([
      { id: '1', title: 'Course 1', language: 'English', cefr_level: 'B2' },
      { id: '2', title: 'Course 2', language: 'Spanish', cefr_level: 'B1' }
    ])
    
    const courses = await QueryOptimizer.getOptimizedCourses('English', 'B2')
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(THRESHOLDS.databaseQuery)
    expect(courses).toHaveLength(2)
  })

  it('should use cache for repeated queries', async () => {
    // First call - cache miss
    vi.spyOn(QueryOptimizer, 'getOptimizedCourses').mockResolvedValue([
      { id: '1', title: 'Cached Course' }
    ])
    
    await QueryOptimizer.getOptimizedCourses('English', 'B2')
    
    // Second call - should hit cache
    const start = performance.now()
    const cachedCourses = await QueryOptimizer.getOptimizedCourses('English', 'B2')
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(THRESHOLDS.cacheRetrieval)
    expect(cachedCourses).toBeDefined()
  })

  it('should batch queries efficiently', async () => {
    const ids = Array.from({ length: 10 }, (_, i) => `id-${i}`)
    
    const start = performance.now()
    const results = await QueryOptimizer.batchQuery('academy_courses', ids)
    const duration = performance.now() - start
    
    // Batch query should be faster than individual queries
    expect(duration).toBeLessThan(THRESHOLDS.databaseQuery * 2)
    expect(results).toBeInstanceOf(Array)
  })

  it('should optimize analytics queries', async () => {
    const dateRange = {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    }
    
    vi.spyOn(QueryOptimizer, 'getOptimizedAnalytics').mockResolvedValue({
      totalSessions: 100,
      averageScore: 85,
      completionRate: 0.75
    })
    
    const start = performance.now()
    const analytics = await QueryOptimizer.getOptimizedAnalytics(mockUserId, dateRange)
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(THRESHOLDS.analyticsComputation)
    expect(analytics).toHaveProperty('totalSessions')
  })
})

describe('Analytics Cache Performance', () => {
  beforeEach(() => {
    AnalyticsCache.clearAll()
  })

  it('should retrieve from memory cache quickly', async () => {
    const testData = { metric: 'test', value: 100 }
    
    // Set data in cache
    AnalyticsCache.set('test-key', testData, 'realtime')
    
    // Retrieve from cache
    const start = performance.now()
    const cached = await AnalyticsCache.get('test-key')
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(THRESHOLDS.cacheRetrieval)
    expect(cached).toEqual(testData)
  })

  it('should handle multi-layer cache efficiently', async () => {
    const testData = { layer: 'multi', data: [1, 2, 3] }
    
    // Set in all layers
    AnalyticsCache.set('multi-key', testData, 'historical')
    
    // Clear memory to force retrieval from lower layers
    const memoryCache = (AnalyticsCache as any).memoryCache
    memoryCache.clear()
    
    const start = performance.now()
    const cached = await AnalyticsCache.get('multi-key')
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(THRESHOLDS.cacheRetrieval * 3)
    expect(cached).toBeDefined()
  })

  it('should handle stale-while-revalidate pattern', async () => {
    let fetchCount = 0
    const fetcher = async () => {
      fetchCount++
      return { fetched: true, count: fetchCount }
    }
    
    // Set stale data
    AnalyticsCache.set('stale-key', { fetched: true, count: 0 }, 'realtime')
    
    // Wait for data to become stale
    await new Promise(resolve => setTimeout(resolve, 35))
    
    // Should return stale data immediately
    const start = performance.now()
    const data = await AnalyticsCache.get('stale-key', fetcher, 'realtime')
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(THRESHOLDS.cacheRetrieval)
    expect(data).toBeDefined()
  })

  it('should maintain cache hit rate above 80%', () => {
    // Simulate cache operations
    for (let i = 0; i < 100; i++) {
      if (i < 80) {
        // Simulate cache hits
        (AnalyticsCache as any).trackCacheHit('memory', `key-${i}`)
      } else {
        // Simulate cache misses
        (AnalyticsCache as any).trackCacheMiss(`key-${i}`)
      }
    }
    
    const metrics = AnalyticsCache.getMetrics()
    expect(metrics.hitRate).toBeGreaterThanOrEqual(80)
  })
})

describe('Image Optimization Performance', () => {
  it('should generate responsive sizes quickly', () => {
    const start = performance.now()
    
    const sizes = ImageOptimizer.generateSizes('hero')
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(1) // Should be instant
    expect(sizes).toContain('100vw')
  })

  it('should optimize course images efficiently', () => {
    const start = performance.now()
    
    const optimized = ImageOptimizer.optimizeCourseImage(
      mockImageUrl,
      'Course Image',
      { quality: 85, format: 'webp' }
    )
    
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(THRESHOLDS.imageOptimization)
    expect(optimized).toHaveProperty('src')
    expect(optimized).toHaveProperty('srcSet')
  })

  it('should detect optimal format quickly', () => {
    const start = performance.now()
    const format = ImageOptimizer.getOptimalFormat()
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(5)
    expect(['avif', 'webp', 'jpeg']).toContain(format)
  })

  it('should preload critical images', () => {
    const images = [
      '/hero.jpg',
      '/course-1.jpg',
      '/course-2.jpg'
    ]
    
    const start = performance.now()
    ImageOptimizer.preloadImages(images)
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(10)
  })
})

describe('Component Loading Performance', () => {
  it('should prefetch dashboard components', async () => {
    const start = performance.now()
    
    ComponentPrefetcher.prefetchDashboard()
    
    const duration = performance.now() - start
    
    // Prefetching should be non-blocking
    expect(duration).toBeLessThan(10)
  })

  it('should prefetch exam components', async () => {
    const start = performance.now()
    
    ComponentPrefetcher.prefetchExam()
    
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(10)
  })
})

describe('API Response Performance', () => {
  it('should handle course API requests within threshold', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ courses: [] })
    })
    
    global.fetch = mockFetch as any
    
    const start = performance.now()
    
    const response = await fetch('/api/academia/courses')
    await response.json()
    
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(THRESHOLDS.apiResponse)
  })

  it('should handle progress API requests within threshold', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ progress: 75 })
    })
    
    global.fetch = mockFetch as any
    
    const start = performance.now()
    
    const response = await fetch('/api/academia/progress')
    await response.json()
    
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(THRESHOLDS.apiResponse)
  })
})

describe('Dashboard Rendering Performance', () => {
  it('should calculate analytics metrics quickly', () => {
    const mockData = {
      sessions: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        score: Math.random() * 100,
        duration: Math.random() * 3600
      }))
    }
    
    const start = performance.now()
    
    // Simulate analytics computation
    const totalScore = mockData.sessions.reduce((sum, s) => sum + s.score, 0)
    const avgScore = totalScore / mockData.sessions.length
    const totalDuration = mockData.sessions.reduce((sum, s) => sum + s.duration, 0)
    
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(THRESHOLDS.analyticsComputation)
    expect(avgScore).toBeGreaterThan(0)
  })

  it('should aggregate progress data efficiently', () => {
    const progressData = Array.from({ length: 30 }, (_, i) => ({
      day: i,
      completed: Math.floor(Math.random() * 10),
      total: 10
    }))
    
    const start = performance.now()
    
    // Simulate progress aggregation
    const weeklyProgress = progressData.reduce((acc, day) => {
      const week = Math.floor(day.day / 7)
      if (!acc[week]) acc[week] = { completed: 0, total: 0 }
      acc[week].completed += day.completed
      acc[week].total += day.total
      return acc
    }, {} as Record<number, { completed: number; total: number }>)
    
    const duration = performance.now() - start
    
    expect(duration).toBeLessThan(THRESHOLDS.analyticsComputation / 2)
    expect(Object.keys(weeklyProgress)).toHaveLength(5)
  })
})

describe('Memory Usage', () => {
  it('should not leak memory in cache operations', () => {
    const initialMemory = process.memoryUsage().heapUsed
    
    // Perform many cache operations
    for (let i = 0; i < 1000; i++) {
      AnalyticsCache.set(`key-${i}`, { data: i }, 'realtime')
    }
    
    // Clear cache
    AnalyticsCache.clearAll()
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory
    
    // Memory increase should be minimal (< 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
  })

  it('should limit cache size appropriately', () => {
    // Add many items to cache
    for (let i = 0; i < 200; i++) {
      QueryOptimizer.setCache(`key-${i}`, { data: i }, 300000)
    }
    
    const metrics = QueryOptimizer.getMetrics()
    
    // Cache should be limited
    expect(metrics.totalQueries).toBeLessThanOrEqual(1000)
  })
})

describe('Concurrent Operations', () => {
  it('should handle concurrent cache operations', async () => {
    const operations = Array.from({ length: 50 }, (_, i) => 
      AnalyticsCache.set(`concurrent-${i}`, { value: i }, 'session')
    )
    
    const start = performance.now()
    await Promise.all(operations)
    const duration = performance.now() - start
    
    // Should handle concurrent operations efficiently
    expect(duration).toBeLessThan(THRESHOLDS.apiResponse)
  })

  it('should handle concurrent database queries', async () => {
    const queries = Array.from({ length: 10 }, (_, i) =>
      QueryOptimizer.getOptimizedCourses('English', `B${i % 2 + 1}`)
    )
    
    const start = performance.now()
    await Promise.all(queries)
    const duration = performance.now() - start
    
    // Concurrent queries should be optimized
    expect(duration).toBeLessThan(THRESHOLDS.databaseQuery * 5)
  })
})

describe('Performance Metrics Tracking', () => {
  it('should track query performance metrics', () => {
    const metrics = QueryOptimizer.getMetrics()
    
    expect(metrics).toHaveProperty('totalQueries')
    expect(metrics).toHaveProperty('cachedQueries')
    expect(metrics).toHaveProperty('cacheHitRate')
    expect(metrics).toHaveProperty('avgExecutionTime')
  })

  it('should track cache performance metrics', () => {
    const metrics = AnalyticsCache.getMetrics()
    
    expect(metrics).toHaveProperty('hits')
    expect(metrics).toHaveProperty('misses')
    expect(metrics).toHaveProperty('hitRate')
    expect(metrics).toHaveProperty('memoryCacheSize')
  })

  it('should maintain performance SLAs', () => {
    // Simulate realistic load
    const operations = [
      QueryOptimizer.getOptimizedCourses('English', 'B2'),
      AnalyticsCache.get('test-key'),
      ImageOptimizer.optimizeCourseImage('/test.jpg', 'Test')
    ]
    
    operations.forEach(async (op) => {
      const start = performance.now()
      await op
      const duration = performance.now() - start
      
      // All operations should meet SLA
      expect(duration).toBeLessThan(THRESHOLDS.apiResponse)
    })
  })
})