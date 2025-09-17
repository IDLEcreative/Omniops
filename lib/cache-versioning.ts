/**
 * Cache Versioning System
 * Automatically invalidates cache when search logic changes
 */

// Increment this version whenever search logic changes
// This ensures old cached results are invalidated
export const SEARCH_CACHE_VERSION = '2.0.0';

// Version history for tracking changes
export const VERSION_HISTORY = {
  '1.0.0': 'Initial cache implementation',
  '1.1.0': 'Added product enhancement logic',
  '1.2.0': 'Improved metadata search',
  '2.0.0': 'Added short query detection for better brand/keyword searches'
};

/**
 * Get versioned cache key
 * Includes version in key so changing version invalidates all old cache
 */
export function getVersionedCacheKey(baseKey: string): string {
  return `${baseKey}:v${SEARCH_CACHE_VERSION}`;
}