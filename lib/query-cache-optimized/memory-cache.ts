/**
 * Query Cache - In-Memory Cache Operations
 */

import { MAX_MEMORY_CACHE_SIZE } from './constants';

// Shared memory cache
const memoryCache = new Map<string, any>();

/**
 * Get value from memory cache
 */
export function getFromMemory<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Set value in memory cache
 */
export function setInMemory<T>(key: string, data: T, ttlSeconds?: number): void {
  const ttl = ttlSeconds || 3600;
  memoryCache.set(key, {
    data,
    expiresAt: Date.now() + ttl * 1000,
  });

  // Prevent memory leak
  if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
    const firstKey = memoryCache.keys().next().value;
    if (firstKey !== undefined) {
      memoryCache.delete(firstKey);
    }
  }
}

/**
 * Get memory cache statistics
 */
export function getMemoryCacheStats() {
  const stats = {
    global: { count: 0, size: 0 },
    domain: { count: 0, size: 0 },
    user: { count: 0, size: 0 },
    total: { count: 0, size: 0 },
  };

  for (const [key, value] of memoryCache) {
    const size = JSON.stringify(value).length;
    stats.total.count++;
    stats.total.size += size;

    // Rough scope detection based on key pattern
    if (key.includes('_conversation')) {
      stats.user.count++;
      stats.user.size += size;
    } else if (key.includes('_domain')) {
      stats.domain.count++;
      stats.domain.size += size;
    } else {
      stats.global.count++;
      stats.global.size += size;
    }
  }

  return stats;
}

/**
 * Clear memory cache by scope
 */
export function clearMemoryCacheByScope(
  scope: 'user' | 'domain' | 'global',
  identifier?: string
): number {
  const keysToDelete: string[] = [];

  for (const [key] of memoryCache) {
    if (scope === 'user' && identifier && key.includes(identifier)) {
      keysToDelete.push(key);
    } else if (scope === 'domain' && identifier && key.includes(identifier)) {
      keysToDelete.push(key);
    } else if (
      scope === 'global' &&
      !key.includes('_domain') &&
      !key.includes('_conversation')
    ) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => memoryCache.delete(key));
  return keysToDelete.length;
}

/**
 * Get the underlying memory cache (for inspection)
 */
export function getMemoryCache(): Map<string, any> {
  return memoryCache;
}
