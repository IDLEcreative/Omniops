/**
 * Unified Redis Client Configuration
 * This is the single source of truth for all Redis connections in the application.
 * It consolidates the resilient redis-enhanced client for all use cases.
 */

import { ResilientRedisClient, MemoryAwareCrawlJobManager } from './redis-enhanced';

// Singleton instances
let unifiedRedisClient: ResilientRedisClient | null = null;
let unifiedJobManager: MemoryAwareCrawlJobManager | null = null;

/**
 * Get the unified Redis client instance
 * All Redis operations should go through this client
 */
export function getRedisClient(): ResilientRedisClient {
  if (!unifiedRedisClient) {
    unifiedRedisClient = new ResilientRedisClient(
      process.env.REDIS_URL || 'redis://localhost:6379'
    );
    
    // Set up monitoring
    unifiedRedisClient.on('connected', () => {
      console.log('[Redis] Connected to Redis server');
    });
    
    unifiedRedisClient.on('disconnected', () => {
      console.warn('[Redis] Disconnected from Redis server - using fallback');
    });
    
    unifiedRedisClient.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
    });
  }
  return unifiedRedisClient;
}

/**
 * Get the unified job manager instance
 * All job/queue operations should go through this manager
 */
export function getJobManager(): MemoryAwareCrawlJobManager {
  if (!unifiedJobManager) {
    unifiedJobManager = new MemoryAwareCrawlJobManager(getRedisClient());
  }
  return unifiedJobManager;
}

/**
 * Queue namespace configuration
 * Centralizes all queue names and their priorities
 */
export const QUEUE_NAMESPACES = {
  // Web scraping queues
  SCRAPE: {
    HIGH_PRIORITY: 'queue:scrape:high',    // Critical scraping jobs
    NORMAL: 'queue:scrape:normal',         // Regular scraping jobs
    LOW_PRIORITY: 'queue:scrape:low',      // Background scraping
    FAILED: 'queue:scrape:failed',         // Failed jobs for retry
  },
  
  // WooCommerce sync queues
  WOOCOMMERCE: {
    SYNC: 'queue:woocommerce:sync',        // Product/order sync
    WEBHOOK: 'queue:woocommerce:webhook',   // Webhook processing
    CACHE: 'queue:woocommerce:cache',      // Cache updates
  },
  
  // Embedding generation queues
  EMBEDDINGS: {
    GENERATE: 'queue:embeddings:generate',  // Generate embeddings
    UPDATE: 'queue:embeddings:update',      // Update existing embeddings
  },
  
  // Analytics and reporting
  ANALYTICS: {
    EVENTS: 'queue:analytics:events',       // Event processing
    REPORTS: 'queue:analytics:reports',     // Report generation
  },
  
  // System maintenance
  MAINTENANCE: {
    CLEANUP: 'queue:maintenance:cleanup',   // Data cleanup jobs
    BACKUP: 'queue:maintenance:backup',     // Backup operations
  }
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
 * Helper function to get queue key with priority
 */
export function getQueueKey(namespace: string, priority: number = QUEUE_PRIORITIES.NORMAL): string {
  if (priority >= QUEUE_PRIORITIES.HIGH) {
    return `${namespace}:high`;
  } else if (priority <= QUEUE_PRIORITIES.LOW) {
    return `${namespace}:low`;
  }
  return `${namespace}:normal`;
}

/**
 * Helper function to check if a job already exists (deduplication)
 */
export async function isDuplicateJob(jobKey: string, windowSeconds: number = DEDUP_CONFIG.JOB_DEDUP_WINDOW): Promise<boolean> {
  const redis = getRedisClient();
  const dedupKey = `dedup:${jobKey}`;
  
  const exists = await redis.exists(dedupKey);
  if (!exists) {
    // Mark as processing to prevent duplicates
    await redis.set(dedupKey, '1', windowSeconds);
    return false;
  }
  
  return true;
}

/**
 * Helper function to apply rate limiting
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = RATE_LIMITS.API_PER_CLIENT.requests,
  window: number = RATE_LIMITS.API_PER_CLIENT.window
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const redis = getRedisClient();
  const key = `rate:${identifier}`;
  
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  const ttl = await redis.get(`${key}:ttl`) || window;
  const resetIn = parseInt(ttl.toString());
  
  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
    resetIn,
  };
}

/**
 * Graceful shutdown helper
 */
export async function gracefulShutdown(): Promise<void> {
  console.log('[Redis] Starting graceful shutdown...');
  
  if (unifiedRedisClient) {
    await unifiedRedisClient.disconnect();
    unifiedRedisClient = null;
  }
  
  if (unifiedJobManager) {
    // Job manager uses the same Redis client, so no separate disconnect needed
    unifiedJobManager = null;
  }
  
  console.log('[Redis] Graceful shutdown complete');
}

// Handle process termination
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Export types for consistency
export type { ResilientRedisClient, MemoryAwareCrawlJobManager } from './redis-enhanced';