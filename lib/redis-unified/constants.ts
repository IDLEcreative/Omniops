/**
 * Redis Unified - Configuration Constants
 */

/**
 * Queue namespace configuration
 * Centralizes all queue names and their priorities
 */
export const QUEUE_NAMESPACES = {
  // Web scraping queues
  SCRAPE: {
    HIGH_PRIORITY: 'queue:scrape:high',
    NORMAL: 'queue:scrape:normal',
    LOW_PRIORITY: 'queue:scrape:low',
    FAILED: 'queue:scrape:failed',
  },

  // WooCommerce sync queues
  WOOCOMMERCE: {
    SYNC: 'queue:woocommerce:sync',
    WEBHOOK: 'queue:woocommerce:webhook',
    CACHE: 'queue:woocommerce:cache',
  },

  // Embedding generation queues
  EMBEDDINGS: {
    GENERATE: 'queue:embeddings:generate',
    UPDATE: 'queue:embeddings:update',
  },

  // Analytics and reporting
  ANALYTICS: {
    EVENTS: 'queue:analytics:events',
    REPORTS: 'queue:analytics:reports',
  },

  // System maintenance
  MAINTENANCE: {
    CLEANUP: 'queue:maintenance:cleanup',
    BACKUP: 'queue:maintenance:backup',
  },
} as const;

/**
 * Queue priorities (higher number = higher priority)
 */
export const QUEUE_PRIORITIES = {
  CRITICAL: 10,
  HIGH: 7,
  NORMAL: 5,
  LOW: 3,
  BACKGROUND: 1,
} as const;

/**
 * Rate limiting configuration per domain/operation
 */
export const RATE_LIMITS = {
  // Scraping rate limits
  SCRAPE_PER_DOMAIN: {
    requests: 10,
    window: 60, // seconds
  },

  // API rate limits
  API_PER_CLIENT: {
    requests: 100,
    window: 60, // seconds
  },

  // Embedding generation rate limits
  EMBEDDINGS_PER_MINUTE: {
    requests: 60,
    window: 60, // seconds
  },
} as const;

/**
 * Deduplication configuration
 */
export const DEDUP_CONFIG = {
  // Content hash TTL
  CONTENT_HASH_TTL: 86400, // 24 hours

  // Job deduplication window
  JOB_DEDUP_WINDOW: 3600, // 1 hour

  // Result cache TTL
  RESULT_CACHE_TTL: 7200, // 2 hours
} as const;

/**
 * Detect if running during build time
 */
export const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-export' ||
  process.argv.includes('build');
