/**
 * Scoring Engine Cache Utilities
 * Provides intelligent caching for rubrics, settings, and model responses
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ScoringCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Get cached value
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached value
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }

  /**
   * Delete cached value
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: Array<{ key: string; age: number; ttl: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl
    }));

    return {
      size: this.cache.size,
      entries
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Generate cache key for rubric
   */
  static rubricKey(provider: string, level: string, task: string): string {
    return `rubric:${provider}:${level}:${task}`;
  }

  /**
   * Generate cache key for settings
   */
  static settingsKey(tenantId: string, setting: string): string {
    return `settings:${tenantId}:${setting}`;
  }

  /**
   * Generate cache key for model response
   */
  static modelResponseKey(modelName: string, contentHash: string): string {
    return `model:${modelName}:${contentHash}`;
  }

  /**
   * Generate content hash for caching
   */
  static generateContentHash(content: string): string {
    // Simple hash function - in production, use crypto.subtle.digest
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Global cache instance
export const scoringCache = new ScoringCache();

// Cache helper functions
export const cacheHelpers = {
  /**
   * Cache rubric for 1 hour
   */
  cacheRubric: (provider: string, level: string, task: string, rubric: any) => {
    const key = ScoringCache.rubricKey(provider, level, task);
    scoringCache.set(key, rubric, 60 * 60 * 1000); // 1 hour
  },

  /**
   * Get cached rubric
   */
  getCachedRubric: (provider: string, level: string, task: string) => {
    const key = ScoringCache.rubricKey(provider, level, task);
    return scoringCache.get(key);
  },

  /**
   * Cache tenant settings for 30 minutes
   */
  cacheSettings: (tenantId: string, setting: string, value: any) => {
    const key = ScoringCache.settingsKey(tenantId, setting);
    scoringCache.set(key, value, 30 * 60 * 1000); // 30 minutes
  },

  /**
   * Get cached settings
   */
  getCachedSettings: (tenantId: string, setting: string) => {
    const key = ScoringCache.settingsKey(tenantId, setting);
    return scoringCache.get(key);
  },

  /**
   * Cache model response for 24 hours
   */
  cacheModelResponse: (modelName: string, content: string, response: any) => {
    const contentHash = ScoringCache.generateContentHash(content);
    const key = ScoringCache.modelResponseKey(modelName, contentHash);
    scoringCache.set(key, response, 24 * 60 * 60 * 1000); // 24 hours
  },

  /**
   * Get cached model response
   */
  getCachedModelResponse: (modelName: string, content: string) => {
    const contentHash = ScoringCache.generateContentHash(content);
    const key = ScoringCache.modelResponseKey(modelName, contentHash);
    return scoringCache.get(key);
  },

  /**
   * Clear all caches
   */
  clearAll: () => {
    scoringCache.clear();
  },

  /**
   * Get cache statistics
   */
  getStats: () => {
    return scoringCache.getStats();
  },

  /**
   * Cleanup expired entries
   */
  cleanup: () => {
    return scoringCache.cleanup();
  }
};

// Auto-cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cacheHelpers.cleanup();
  }, 10 * 60 * 1000);
}