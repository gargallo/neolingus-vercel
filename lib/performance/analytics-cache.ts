/**
 * Analytics Caching Strategies
 * Implements multi-layer caching for analytics data
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  etag?: string
  version: number
}

interface CacheStrategy {
  ttl: number
  staleWhileRevalidate?: boolean
  maxStale?: number
  compression?: boolean
}

interface AnalyticsData {
  [key: string]: any
}

/**
 * Multi-layer cache implementation
 */
export class AnalyticsCache {
  // Memory cache (L1)
  private static memoryCache = new Map<string, CacheEntry<any>>()
  
  // Session storage cache (L2)
  private static sessionCache = typeof window !== 'undefined' ? window.sessionStorage : null
  
  // Local storage cache (L3)
  private static localStorage = typeof window !== 'undefined' ? window.localStorage : null
  
  // Cache configuration
  private static readonly VERSION = 1
  private static readonly MAX_MEMORY_ENTRIES = 100
  private static readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB
  
  // Cache strategies by data type
  private static strategies: Record<string, CacheStrategy> = {
    // Real-time data (short TTL)
    'realtime': {
      ttl: 30000, // 30 seconds
      staleWhileRevalidate: true,
      maxStale: 60000 // 1 minute
    },
    
    // Session data (medium TTL)
    'session': {
      ttl: 300000, // 5 minutes
      staleWhileRevalidate: true,
      maxStale: 600000 // 10 minutes
    },
    
    // Historical data (long TTL)
    'historical': {
      ttl: 3600000, // 1 hour
      staleWhileRevalidate: true,
      maxStale: 7200000, // 2 hours
      compression: true
    },
    
    // Aggregated data (very long TTL)
    'aggregated': {
      ttl: 86400000, // 24 hours
      staleWhileRevalidate: true,
      maxStale: 172800000, // 48 hours
      compression: true
    }
  }

  /**
   * Get data from cache with fallback layers
   */
  static async get<T>(
    key: string,
    fetcher?: () => Promise<T>,
    strategy: keyof typeof AnalyticsCache.strategies = 'session'
  ): Promise<T | null> {
    // Try L1 (memory)
    const memoryEntry = this.getFromMemory<T>(key)
    if (memoryEntry && this.isValid(memoryEntry)) {
      this.trackCacheHit('memory', key)
      return memoryEntry.data
    }

    // Try L2 (session storage)
    const sessionEntry = this.getFromSession<T>(key)
    if (sessionEntry && this.isValid(sessionEntry)) {
      // Promote to memory cache
      this.setMemory(key, sessionEntry.data, sessionEntry.ttl)
      this.trackCacheHit('session', key)
      return sessionEntry.data
    }

    // Try L3 (local storage)
    const localEntry = this.getFromLocal<T>(key)
    if (localEntry && this.isValid(localEntry)) {
      // Promote to higher layers
      this.setMemory(key, localEntry.data, localEntry.ttl)
      this.setSession(key, localEntry.data, localEntry.ttl)
      this.trackCacheHit('local', key)
      return localEntry.data
    }

    // Handle stale-while-revalidate
    const staleEntry = memoryEntry || sessionEntry || localEntry
    const cacheStrategy = this.strategies[strategy]
    
    if (staleEntry && cacheStrategy.staleWhileRevalidate) {
      const age = Date.now() - staleEntry.timestamp
      if (age < staleEntry.ttl + (cacheStrategy.maxStale || 0)) {
        // Return stale data and revalidate in background
        if (fetcher) {
          this.revalidateInBackground(key, fetcher, strategy)
        }
        this.trackCacheHit('stale', key)
        return staleEntry.data
      }
    }

    // Cache miss - fetch fresh data
    if (fetcher) {
      this.trackCacheMiss(key)
      const data = await fetcher()
      this.set(key, data, strategy)
      return data
    }

    return null
  }

  /**
   * Set data in all cache layers
   */
  static set<T>(
    key: string,
    data: T,
    strategy: keyof typeof AnalyticsCache.strategies = 'session'
  ): void {
    const cacheStrategy = this.strategies[strategy]
    const ttl = cacheStrategy.ttl

    // Set in all layers based on strategy
    this.setMemory(key, data, ttl)
    
    if (ttl > 60000) { // > 1 minute
      this.setSession(key, data, ttl)
    }
    
    if (ttl > 300000) { // > 5 minutes
      this.setLocal(key, data, ttl, cacheStrategy.compression)
    }
  }

  /**
   * Memory cache operations
   */
  private static getFromMemory<T>(key: string): CacheEntry<T> | null {
    return this.memoryCache.get(key) || null
  }

  private static setMemory<T>(key: string, data: T, ttl: number): void {
    // Implement LRU eviction
    if (this.memoryCache.size >= this.MAX_MEMORY_ENTRIES) {
      const firstKey = this.memoryCache.keys().next().value
      this.memoryCache.delete(firstKey)
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.VERSION
    })
  }

  /**
   * Session storage operations
   */
  private static getFromSession<T>(key: string): CacheEntry<T> | null {
    if (!this.sessionCache) return null

    try {
      const item = this.sessionCache.getItem(this.getCacheKey(key))
      if (item) {
        return JSON.parse(item)
      }
    } catch (error) {
      console.error('Session cache read error:', error)
    }
    
    return null
  }

  private static setSession<T>(key: string, data: T, ttl: number): void {
    if (!this.sessionCache) return

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
        version: this.VERSION
      }
      
      this.sessionCache.setItem(
        this.getCacheKey(key),
        JSON.stringify(entry)
      )
    } catch (error) {
      console.error('Session cache write error:', error)
      // Clear old entries if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldEntries('session')
      }
    }
  }

  /**
   * Local storage operations with compression
   */
  private static getFromLocal<T>(key: string): CacheEntry<T> | null {
    if (!this.localStorage) return null

    try {
      const item = this.localStorage.getItem(this.getCacheKey(key))
      if (item) {
        const entry = JSON.parse(item) as CacheEntry<T>
        
        // Decompress if needed
        if (typeof entry.data === 'string' && entry.data.startsWith('compressed:')) {
          entry.data = this.decompress(entry.data.slice(11))
        }
        
        return entry
      }
    } catch (error) {
      console.error('Local cache read error:', error)
    }
    
    return null
  }

  private static setLocal<T>(
    key: string,
    data: T,
    ttl: number,
    compress = false
  ): void {
    if (!this.localStorage) return

    try {
      let processedData: any = data
      
      // Compress if needed
      if (compress && typeof data === 'object') {
        processedData = 'compressed:' + this.compress(JSON.stringify(data))
      }
      
      const entry: CacheEntry<any> = {
        data: processedData,
        timestamp: Date.now(),
        ttl,
        version: this.VERSION
      }
      
      this.localStorage.setItem(
        this.getCacheKey(key),
        JSON.stringify(entry)
      )
    } catch (error) {
      console.error('Local cache write error:', error)
      // Clear old entries if quota exceeded
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.clearOldEntries('local')
      }
    }
  }

  /**
   * Cache validation
   */
  private static isValid<T>(entry: CacheEntry<T>): boolean {
    if (entry.version !== this.VERSION) return false
    
    const age = Date.now() - entry.timestamp
    return age < entry.ttl
  }

  /**
   * Background revalidation
   */
  private static async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    strategy: keyof typeof AnalyticsCache.strategies
  ): Promise<void> {
    try {
      const data = await fetcher()
      this.set(key, data, strategy)
    } catch (error) {
      console.error('Background revalidation failed:', error)
    }
  }

  /**
   * Cache key generation
   */
  private static getCacheKey(key: string): string {
    return `analytics_cache_${key}`
  }

  /**
   * Compression utilities
   */
  private static compress(data: string): string {
    // Simple compression using base64 encoding
    // In production, use a proper compression library
    return btoa(encodeURIComponent(data))
  }

  private static decompress(data: string): any {
    try {
      return JSON.parse(decodeURIComponent(atob(data)))
    } catch {
      return data
    }
  }

  /**
   * Cache maintenance
   */
  static clearOldEntries(layer: 'memory' | 'session' | 'local' = 'memory'): void {
    const now = Date.now()
    
    switch (layer) {
      case 'memory':
        for (const [key, entry] of this.memoryCache.entries()) {
          if (now - entry.timestamp > entry.ttl) {
            this.memoryCache.delete(key)
          }
        }
        break
        
      case 'session':
        if (!this.sessionCache) return
        const sessionKeys = Object.keys(this.sessionCache)
        sessionKeys.forEach(key => {
          if (key.startsWith('analytics_cache_')) {
            try {
              const item = this.sessionCache!.getItem(key)
              if (item) {
                const entry = JSON.parse(item)
                if (now - entry.timestamp > entry.ttl) {
                  this.sessionCache!.removeItem(key)
                }
              }
            } catch {
              this.sessionCache!.removeItem(key)
            }
          }
        })
        break
        
      case 'local':
        if (!this.localStorage) return
        const localKeys = Object.keys(this.localStorage)
        localKeys.forEach(key => {
          if (key.startsWith('analytics_cache_')) {
            try {
              const item = this.localStorage!.getItem(key)
              if (item) {
                const entry = JSON.parse(item)
                if (now - entry.timestamp > entry.ttl) {
                  this.localStorage!.removeItem(key)
                }
              }
            } catch {
              this.localStorage!.removeItem(key)
            }
          }
        })
        break
    }
  }

  /**
   * Clear all cache layers
   */
  static clearAll(): void {
    this.memoryCache.clear()
    
    if (this.sessionCache) {
      const keys = Object.keys(this.sessionCache)
      keys.forEach(key => {
        if (key.startsWith('analytics_cache_')) {
          this.sessionCache!.removeItem(key)
        }
      })
    }
    
    if (this.localStorage) {
      const keys = Object.keys(this.localStorage)
      keys.forEach(key => {
        if (key.startsWith('analytics_cache_')) {
          this.localStorage!.removeItem(key)
        }
      })
    }
  }

  /**
   * Cache metrics
   */
  private static hits = { memory: 0, session: 0, local: 0, stale: 0 }
  private static misses = 0

  private static trackCacheHit(layer: keyof typeof AnalyticsCache.hits, key: string): void {
    this.hits[layer]++
  }

  private static trackCacheMiss(key: string): void {
    this.misses++
  }

  static getMetrics() {
    const total = Object.values(this.hits).reduce((sum, val) => sum + val, 0) + this.misses
    const hitRate = total > 0 ? (total - this.misses) / total * 100 : 0

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate,
      memoryCacheSize: this.memoryCache.size,
      sessionCacheKeys: this.sessionCache ? 
        Object.keys(this.sessionCache).filter(k => k.startsWith('analytics_cache_')).length : 0,
      localCacheKeys: this.localStorage ? 
        Object.keys(this.localStorage).filter(k => k.startsWith('analytics_cache_')).length : 0
    }
  }
}

/**
 * Analytics data prefetching
 */
export class AnalyticsPrefetcher {
  private static prefetchQueue: Array<() => Promise<void>> = []
  private static isPrefetching = false

  static prefetchDashboardData(userId: string): void {
    // Prefetch common dashboard analytics
    this.addToPrefetchQueue(async () => {
      await AnalyticsCache.get(
        `dashboard:${userId}`,
        async () => this.fetchDashboardData(userId),
        'session'
      )
    })

    this.addToPrefetchQueue(async () => {
      await AnalyticsCache.get(
        `progress:${userId}`,
        async () => this.fetchProgressData(userId),
        'historical'
      )
    })
  }

  private static addToPrefetchQueue(task: () => Promise<void>): void {
    this.prefetchQueue.push(task)
    this.processPrefetchQueue()
  }

  private static async processPrefetchQueue(): Promise<void> {
    if (this.isPrefetching || this.prefetchQueue.length === 0) return

    this.isPrefetching = true

    while (this.prefetchQueue.length > 0) {
      const task = this.prefetchQueue.shift()
      if (task) {
        try {
          await task()
        } catch (error) {
          console.error('Prefetch failed:', error)
        }
      }
    }

    this.isPrefetching = false
  }

  // Mock data fetchers - replace with actual API calls
  private static async fetchDashboardData(userId: string): Promise<AnalyticsData> {
    // Simulate API call
    return {
      totalCourses: 5,
      completedCourses: 2,
      averageScore: 85,
      lastActivity: new Date().toISOString()
    }
  }

  private static async fetchProgressData(userId: string): Promise<AnalyticsData> {
    // Simulate API call
    return {
      weeklyProgress: [20, 35, 45, 60, 75, 85, 90],
      monthlyGoals: { completed: 15, total: 20 },
      streakDays: 7
    }
  }
}

export default AnalyticsCache