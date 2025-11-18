import { getRedisClient } from '@/lib/redis';
import type Redis from 'ioredis';
import type { RedisClientWithFallback } from './redis-fallback';

export class DomainRefreshLock {
  private static LOCK_TTL = 300; // 5 minutes in seconds
  private static KEY_PREFIX = 'domain:refresh:lock:';
  private redis: Redis | RedisClientWithFallback;

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Attempt to acquire lock for domain refresh
   * @param domainId Domain UUID
   * @returns true if lock acquired, false if already locked
   */
  async acquire(domainId: string): Promise<boolean> {
    const key = `${DomainRefreshLock.KEY_PREFIX}${domainId}`;
    const timestamp = Date.now().toString();

    // Check if lock already exists
    const exists = await this.redis.exists(key);
    if (exists === 1) {
      console.log(`[DomainLock] ⏸️ Domain ${domainId} already locked (refresh in progress)`);
      return false;
    }

    // Acquire lock with expiry
    await this.redis.setex(key, DomainRefreshLock.LOCK_TTL, timestamp);
    return true;
  }

  /**
   * Release lock for domain
   * @param domainId Domain UUID
   */
  async release(domainId: string): Promise<void> {
    const key = `${DomainRefreshLock.KEY_PREFIX}${domainId}`;
    await this.redis.del(key);
  }

  /**
   * Check if domain is currently locked
   * @param domainId Domain UUID
   * @returns true if locked, false otherwise
   */
  async isLocked(domainId: string): Promise<boolean> {
    const key = `${DomainRefreshLock.KEY_PREFIX}${domainId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Get time remaining on lock (in seconds)
   * @param domainId Domain UUID
   * @returns seconds remaining, or -2 if not locked
   * Note: Returns TTL value for real Redis, returns TTL for in-memory fallback
   */
  async getTimeRemaining(domainId: string): Promise<number> {
    const key = `${DomainRefreshLock.KEY_PREFIX}${domainId}`;

    // Check if using real Redis (has ttl method) or fallback
    if ('ttl' in this.redis && typeof this.redis.ttl === 'function') {
      return await this.redis.ttl(key);
    }

    // Fallback: Check if exists, return TTL value or -2 (key doesn't exist)
    const exists = await this.redis.exists(key);
    if (exists === 0) {
      return -2; // Key doesn't exist (Redis convention)
    }

    // For fallback, we can't get exact TTL, so return expected TTL
    // This is a limitation of the in-memory fallback
    return DomainRefreshLock.LOCK_TTL;
  }

  /**
   * Force release a lock (use with caution - for admin/cleanup only)
   * @param domainId Domain UUID
   */
  async forceRelease(domainId: string): Promise<void> {
    await this.release(domainId);
  }
}
