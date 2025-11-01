/**
 * Query Cache - Constants and Patterns
 */

import type { SmartCacheOptions } from './types';

/**
 * Cacheable query patterns with appropriate caching strategies
 */
export const CACHEABLE_PATTERNS: Record<
  string,
  { patterns: RegExp[]; options: SmartCacheOptions }
> = {
  // High cache value - common across users
  embedding_search: {
    patterns: [
      /price|cost|shipping|delivery|return|warranty|hours|location|contact/i,
    ],
    options: { cacheLevel: 'both', scope: 'domain', ttlSeconds: 3600 },
  },

  // Medium cache value - semi-common queries
  product_search: {
    patterns: [/spare parts|ford|toyota|honda|nissan|bmw|mercedes/i],
    options: { cacheLevel: 'both', scope: 'domain', ttlSeconds: 1800 },
  },

  // Low cache value - personalized
  order_status: {
    patterns: [/order #|my order|tracking|where is my/i],
    options: { cacheLevel: 'none', scope: 'user', ttlSeconds: 0 },
  },

  // No cache - real-time data
  inventory: {
    patterns: [/in stock|availability|how many left/i],
    options: { cacheLevel: 'none', scope: 'user', ttlSeconds: 0 },
  },
};

/**
 * Default cache options
 */
export const DEFAULT_CACHE_OPTIONS: SmartCacheOptions = {
  cacheLevel: 'memory',
  scope: 'domain',
  ttlSeconds: 1800, // 30 minutes
};

/**
 * Memory cache size limit
 */
export const MAX_MEMORY_CACHE_SIZE = 1000;
