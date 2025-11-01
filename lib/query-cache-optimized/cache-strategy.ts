/**
 * Query Cache - Caching Strategy Determination
 */

import { CACHEABLE_PATTERNS, DEFAULT_CACHE_OPTIONS } from './constants';
import type { SmartCacheOptions } from './types';

/**
 * Determine if a query should be cached based on its type and content
 */
export function shouldCache(queryType: string, queryContent: string): SmartCacheOptions {
  // Check each pattern
  for (const [type, config] of Object.entries(CACHEABLE_PATTERNS)) {
    if (config.patterns.some((p) => p.test(queryContent))) {
      return config.options;
    }
  }

  // Default: cache at domain level for 30 minutes
  return DEFAULT_CACHE_OPTIONS;
}
