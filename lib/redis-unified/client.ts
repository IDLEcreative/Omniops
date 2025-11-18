/**
 * Redis Unified - Client Singleton Management
 */

import { ResilientRedisClient, MemoryAwareCrawlJobManager } from '../redis-enhanced';
import { InMemoryRedisClient } from './in-memory-client';
import { isBuildTime } from './constants';

// Singleton instances
let unifiedRedisClient: ResilientRedisClient | null = null;
let unifiedJobManager: MemoryAwareCrawlJobManager | null = null;

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
      unifiedRedisClient = new ResilientRedisClient(process.env.REDIS_URL);
    }

    // Set up monitoring (suppressed during build time)
    if (!isBuildTime) {
      unifiedRedisClient.on('connected', () => {
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
 * Reset singleton instances (for testing)
 */
export function resetInstances(): void {
  unifiedRedisClient = null;
  unifiedJobManager = null;
}

/**
 * Get current instances (for inspection)
 */
export function getInstances() {
  return {
    client: unifiedRedisClient,
    jobManager: unifiedJobManager,
  };
}
