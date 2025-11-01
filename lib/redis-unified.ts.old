/**
 * Unified Redis Client Configuration
 * This is the single source of truth for all Redis connections in the application.
 * It consolidates the resilient redis-enhanced client for all use cases.
 */

import { ResilientRedisClient, MemoryAwareCrawlJobManager } from './redis-enhanced';
import { EventEmitter } from 'events';

// Detect build time to suppress connection errors
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NEXT_PHASE === 'phase-export' ||
                    process.argv.includes('build');

// Singleton instances
let unifiedRedisClient: ResilientRedisClient | null = null;
let unifiedJobManager: MemoryAwareCrawlJobManager | null = null;

// Minimal in-memory Redis replacement used when REDIS_URL is not set.
class InMemoryRedisClient extends EventEmitter {
  private store = new Map<string, any>();
  private lists = new Map<string, string[]>();

  // Compatibility with ResilientRedisClient API (subset)
  async ping(): Promise<boolean> {
    return false; // Not a real Redis connection
  }

  async get(key: string): Promise<string | null> {
    const v = this.store.get(key);
    if (v === undefined) return null;
    return typeof v === 'string' ? v : JSON.stringify(v);
  }

  async set(key: string, value: string, _ttl?: number): Promise<boolean> {
    this.store.set(key, value);
    return true;
  }

  async del(key: string): Promise<number> {
    const existed = this.store.delete(key) || this.lists.delete(key);
    return existed ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const current = parseInt((await this.get(key)) || '0', 10) || 0;
    const next = current + 1;
    await this.set(key, String(next));
    return next;
  }

  async expire(_key: string, _seconds: number): Promise<boolean> {
    // TTL not implemented for in-memory fallback
    return true;
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key) || this.lists.has(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    const list = this.lists.get(key) || [];
    const end = stop === -1 ? list.length : Math.min(stop + 1, list.length);
    return list.slice(start, end);
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    const list = this.lists.get(key) || [];
    list.push(...values);
    this.lists.set(key, list);
    return list.length;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/[-\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*') + '$');
    const keys = new Set<string>([...this.store.keys(), ...this.lists.keys()]);
    return [...keys].filter(k => regex.test(k));
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const v = this.store.get(key);
    if (v && typeof v === 'object') return v;
    return {};
  }

  async disconnect(): Promise<void> {
    // no-op for in-memory
  }

  getStatus(): { connected: boolean; circuitBreakerOpen: boolean; fallbackSize: number } {
    return {
      connected: false,
      circuitBreakerOpen: true, // mark as degraded
      fallbackSize: this.store.size + this.lists.size,
    };
  }
}

/**
 * Get the unified Redis client instance
 * All Redis operations should go through this client
 */
export function getRedisClient(): ResilientRedisClient {
  if (!unifiedRedisClient) {
    if (!process.env.REDIS_URL) {
      // Use in-memory fallback when no Redis URL is configured
      // Cast to ResilientRedisClient for compatibility (public API is compatible)
      unifiedRedisClient = new InMemoryRedisClient() as unknown as ResilientRedisClient;
    } else {
      unifiedRedisClient = new ResilientRedisClient(
        process.env.REDIS_URL
      );
    }
    
    // Set up monitoring (suppressed during build time)
    if (!isBuildTime) {
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
