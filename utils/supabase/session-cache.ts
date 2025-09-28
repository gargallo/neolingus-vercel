/**
 * Session cache to reduce OAuth API calls
 */

interface CachedSession {
  user: any;
  timestamp: number;
  expires: number;
}

const sessionCache = new Map<string, CachedSession>();
const CACHE_DURATION = 30000; // 30 seconds
const MAX_CACHE_SIZE = 1000; // Prevent memory leaks

/**
 * Generate a cache key from request cookies
 */
function generateCacheKey(cookies: any): string {
  const authCookies = cookies.getAll()
    .filter((c: any) => c.name.includes('supabase'))
    .map((c: any) => `${c.name}=${c.value.substring(0, 20)}`)
    .join('|');

  return authCookies || 'anonymous';
}

/**
 * Get cached session if valid
 */
export function getCachedSession(cookies: any): any | null {
  const key = generateCacheKey(cookies);
  const cached = sessionCache.get(key);

  if (!cached) return null;

  const now = Date.now();
  if (now > cached.expires) {
    sessionCache.delete(key);
    return null;
  }

  return cached.user;
}

/**
 * Cache a session
 */
export function setCachedSession(cookies: any, user: any): void {
  // Clean up old entries if cache is too large
  if (sessionCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = sessionCache.keys().next().value;
    sessionCache.delete(oldestKey);
  }

  const key = generateCacheKey(cookies);
  const now = Date.now();

  sessionCache.set(key, {
    user,
    timestamp: now,
    expires: now + CACHE_DURATION
  });
}

/**
 * Clear all cached sessions
 */
export function clearSessionCache(): void {
  sessionCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: sessionCache.size,
    maxSize: MAX_CACHE_SIZE,
    hitRate: 0 // Would need to track hits/misses
  };
}