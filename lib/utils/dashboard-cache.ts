/**
 * Dashboard Data Caching Utility
 *
 * Provides efficient caching mechanisms for dashboard data transformations
 * to reduce computation overhead and improve performance.
 */

import { ExamSession, UserProgress } from '@/lib/exam-engine/types';
import { StatCard, Activity } from '@/components/academia/types/dashboard-interfaces';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
}

class DashboardCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttl = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100; // 100 entries default
  }

  set(key: string, data: T): void {
    // Remove expired entries if cache is at capacity
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));

    // If still at capacity, remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.25));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// Cache instances for different data types
export const statsCache = new DashboardCache<StatCard[]>({
  ttl: 2 * 60 * 1000, // 2 minutes for stats
  maxSize: 50
});

export const activitiesCache = new DashboardCache<Activity[]>({
  ttl: 30 * 1000, // 30 seconds for activities
  maxSize: 30
});

export const progressCache = new DashboardCache<number>({
  ttl: 5 * 60 * 1000, // 5 minutes for progress calculations
  maxSize: 100
});

// Helper functions for generating cache keys
export function generateStatsKey(courseId: string, progressData: any, sessionsCount: number): string {
  const progressHash = progressData ? JSON.stringify(progressData).slice(0, 100) : 'null';
  return `stats_${courseId}_${progressHash}_${sessionsCount}`;
}

export function generateActivitiesKey(sessions: ExamSession[], maxItems: number): string {
  const sessionsHash = sessions.map(s => `${s.id}_${s.score}`).join('|').slice(0, 100);
  return `activities_${sessionsHash}_${maxItems}`;
}

export function generateProgressKey(componentProgress: any): string {
  const progressHash = componentProgress ? JSON.stringify(componentProgress) : 'null';
  return `progress_${progressHash}`;
}

// Cached transformation functions
export function getCachedStats(
  key: string,
  generator: () => StatCard[]
): StatCard[] {
  const cached = statsCache.get(key);
  if (cached) {
    return cached;
  }

  const result = generator();
  statsCache.set(key, result);
  return result;
}

export function getCachedActivities(
  key: string,
  generator: () => Activity[]
): Activity[] {
  const cached = activitiesCache.get(key);
  if (cached) {
    return cached;
  }

  const result = generator();
  activitiesCache.set(key, result);
  return result;
}

export function getCachedProgress(
  key: string,
  generator: () => number
): number {
  const cached = progressCache.get(key);
  if (cached !== null) {
    return cached;
  }

  const result = generator();
  progressCache.set(key, result);
  return result;
}

// Cache warming function for preloading common calculations
export function warmDashboardCache(
  courseId: string,
  progress: UserProgress | null,
  sessions: ExamSession[]
): void {
  try {
    // Pre-warm stats cache
    const statsKey = generateStatsKey(courseId, progress, sessions.length);
    if (!statsCache.has(statsKey)) {
      // We would call the actual transform function here
      console.log(`Warming stats cache for course ${courseId}`);
    }

    // Pre-warm activities cache
    const activitiesKey = generateActivitiesKey(sessions, 5);
    if (!activitiesCache.has(activitiesKey)) {
      console.log(`Warming activities cache for course ${courseId}`);
    }

    // Pre-warm progress cache
    if (progress?.component_progress) {
      const progressKey = generateProgressKey(progress.component_progress);
      if (!progressCache.has(progressKey)) {
        console.log(`Warming progress cache for course ${courseId}`);
      }
    }
  } catch (error) {
    console.warn('Cache warming failed:', error);
  }
}

// Performance monitoring
export function getCacheStats() {
  return {
    stats: {
      size: statsCache.size(),
      hitRate: 0 // Would need to track hits/misses for real implementation
    },
    activities: {
      size: activitiesCache.size(),
      hitRate: 0
    },
    progress: {
      size: progressCache.size(),
      hitRate: 0
    }
  };
}

// Cleanup function to be called periodically
export function cleanupCaches(): void {
  statsCache.cleanup();
  activitiesCache.cleanup();
  progressCache.cleanup();
}

// Initialize cleanup interval
if (typeof window !== 'undefined') {
  setInterval(cleanupCaches, 60 * 1000); // Cleanup every minute
}