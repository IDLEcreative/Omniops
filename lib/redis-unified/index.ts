/**
 * Redis Unified - Public API
 * Single source of truth for all Redis connections
 */

// Export client management
export { getRedisClient, getJobManager } from './client';

// Export constants
export {
  QUEUE_NAMESPACES,
  QUEUE_PRIORITIES,
  RATE_LIMITS,
  DEDUP_CONFIG,
} from './constants';

// Export helpers
export { getQueueKey, isDuplicateJob, checkRateLimit } from './helpers';

// Export lifecycle management
export { gracefulShutdown } from './lifecycle';

// Export types
export type { ResilientRedisClient, MemoryAwareCrawlJobManager } from './types';
