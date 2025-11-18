/**
 * Rate Limiter
 *
 * Handles rate limiting for autonomous operations using Redis.
 *
 * @module lib/autonomous/queue/rate-limiter
 */

import { Queue } from 'bullmq';

/**
 * Check if organization has exceeded rate limit
 *
 * Uses Redis INCR and EXPIRE to implement a sliding window rate limit.
 * Rate limit is per organization per hour.
 *
 * @param queue BullMQ Queue instance (for Redis client access)
 * @param organizationId Organization ID to check
 * @param rateLimitPerOrg Maximum operations per hour per organization
 * @throws Error if rate limit exceeded
 *
 * @example
 * try {
 *   await checkRateLimit(queue, 'org-123', 10);
 *   // Proceed with operation
 * } catch (error) {
 *   // Rate limit exceeded
 * }
 */
export async function checkRateLimit(
  queue: Queue,
  organizationId: string,
  rateLimitPerOrg: number
): Promise<void> {
  try {
    const client = await queue.client;
    const key = `ratelimit:operations:${organizationId}`;
    const count = await client.incr(key);

    if (count === 1) {
      // Set expiry on first request
      await client.expire(key, 3600); // 1 hour
    }

    if (count > rateLimitPerOrg) {
      throw new Error(`Rate limit exceeded for organization ${organizationId}`);
    }
  } catch (error) {
    if ((error as Error).message.includes('Rate limit')) {
      throw error;
    }
    // Don't fail on rate limit errors, just log
    console.warn('[OperationQueue] Rate limit check failed:', error);
  }
}

/**
 * Get current rate limit usage for an organization
 *
 * @param queue BullMQ Queue instance (for Redis client access)
 * @param organizationId Organization ID to check
 * @returns Current count and remaining TTL in seconds
 *
 * @example
 * const { count, ttl } = await getRateLimitUsage(queue, 'org-123');
 * console.log(`${count} operations used, resets in ${ttl}s`);
 */
export async function getRateLimitUsage(
  queue: Queue,
  organizationId: string
): Promise<{ count: number; ttl: number }> {
  try {
    const client = await queue.client;
    const key = `ratelimit:operations:${organizationId}`;

    const count = await client.get(key);
    const ttl = await client.ttl(key);

    return {
      count: count ? parseInt(count, 10) : 0,
      ttl: ttl || 0,
    };
  } catch (error) {
    console.warn('[OperationQueue] Failed to get rate limit usage:', error);
    return { count: 0, ttl: 0 };
  }
}

/**
 * Reset rate limit for an organization
 *
 * @param queue BullMQ Queue instance (for Redis client access)
 * @param organizationId Organization ID to reset
 *
 * @example
 * await resetRateLimit(queue, 'org-123');
 */
export async function resetRateLimit(
  queue: Queue,
  organizationId: string
): Promise<void> {
  try {
    const client = await queue.client;
    const key = `ratelimit:operations:${organizationId}`;
    await client.del(key);
  } catch (error) {
    console.warn('[OperationQueue] Failed to reset rate limit:', error);
  }
}
