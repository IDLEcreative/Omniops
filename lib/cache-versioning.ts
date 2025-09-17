/**
 * Cache Versioning System
 * Automatically invalidates cache when search logic changes
 */

// Increment this version whenever search logic changes
// This ensures old cached results are invalidated
export const SEARCH_CACHE_VERSION = '3.1.0';

// Version history for tracking changes
export const VERSION_HISTORY = {
  '1.0.0': 'Initial cache implementation',
  '1.1.0': 'Added product enhancement logic',
  '1.2.0': 'Improved metadata search',
  '2.0.0': 'Added short query detection for better brand/keyword searches',
  '3.0.0': 'Fixed Supabase OR limitation by using multiple queries',
  '3.1.0': 'Fixed cache consistency with proper versioning for embeddings and invalidation'
};

/**
 * Get versioned cache key
 * Includes version in key so changing version invalidates all old cache
 */
export function getVersionedCacheKey(baseKey: string): string {
  return `${baseKey}:v${SEARCH_CACHE_VERSION}`;
}

/**
 * Check if a cache key is from the current version
 */
export function isCurrentVersion(cacheKey: string): boolean {
  return cacheKey.endsWith(`:v${SEARCH_CACHE_VERSION}`);
}

/**
 * Extract version from a cache key
 */
export function extractVersion(cacheKey: string): string | null {
  const match = cacheKey.match(/:v(\d+\.\d+\.\d+)$/);
  return match ? match[1] : null;
}

/**
 * Get all previous versions (for cleanup)
 */
export function getPreviousVersions(): string[] {
  return Object.keys(VERSION_HISTORY).filter(v => v !== SEARCH_CACHE_VERSION);
}