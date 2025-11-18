// Redis-based rate limiter for serverless/multi-instance environments
import { getRedisClient } from './redis';
import type Redis from 'ioredis';
import type { RedisClientWithFallback } from './redis-fallback';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

/**
 * Check rate limit using Redis for distributed rate limiting
 * Uses atomic INCR operations to ensure consistency across instances
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 50,
  windowMs: number = 60 * 1000 // 1 minute
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const resetTime = now + windowMs;

  try {
    // Check if this is a real Redis client (has pipeline method)
    // @ts-expect-error - pipeline may not exist on fallback client
    if (typeof redis.pipeline === 'function') {
      // Use Redis transaction for atomic operations
      // @ts-expect-error - we checked above
      const pipeline = redis.pipeline();

      // Get current count
      pipeline.get(key);
      // Increment counter atomically
      pipeline.incr(key);
      // Set expiry if this is the first request
      pipeline.pexpire(key, windowMs);

      const results = await pipeline.exec();

      if (!results) {
        throw new Error('Redis pipeline failed');
      }

      // Extract results: [get, incr, pexpire]
      const currentCount = results[1]?.[1] as number || 1;

      // Check if rate limit exceeded
      if (currentCount > maxRequests) {
        // Get actual TTL for accurate resetTime
        // @ts-expect-error - pttl may not exist on fallback
        const ttl = typeof redis.pttl === 'function' ? await redis.pttl(key) : -1;
        const actualResetTime = ttl > 0 ? now + ttl : resetTime;

        return {
          allowed: false,
          remaining: 0,
          resetTime: actualResetTime
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - currentCount),
        resetTime
      };
    } else {
      // Fallback client - use simpler operations
      const currentValue = await redis.get(key);
      const currentCount = currentValue ? parseInt(currentValue, 10) : 0;

      if (currentCount >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetTime
        };
      }

      // Increment and set expiry
      const newCount = await redis.incr(key);
      if (currentCount === 0) {
        // Use expire() with seconds for fallback client compatibility
        const windowSeconds = Math.ceil(windowMs / 1000);
        await redis.expire(key, windowSeconds);
      }

      return {
        allowed: true,
        remaining: Math.max(0, maxRequests - newCount),
        resetTime
      };
    }

  } catch (error) {
    // SECURITY: Fail closed on Redis errors to prevent rate limit bypass
    console.error('[Rate Limit] Redis error, BLOCKING request:', error);

    return {
      allowed: false,
      remaining: 0,
      resetTime
    };
  }
}

/**
 * Domain-based rate limiting with tiered limits
 * In production, customer tier should be fetched from database
 */
export async function checkDomainRateLimit(domain: string): Promise<RateLimitResult> {
  // Different limits for different domains (could be stored in DB)
  const limits = {
    default: { requests: 100, window: 60 * 1000 }, // 100 per minute
    premium: { requests: 500, window: 60 * 1000 }, // 500 per minute
  };

  const limit = limits.default; // In production, check customer tier from DB
  return checkRateLimit(`domain:${domain}`, limit.requests, limit.window);
}

/**
 * Rate limiting for expensive operations (scraping, RAG setup, training)
 * Strict limits to prevent abuse while allowing legitimate use
 */
export async function checkExpensiveOpRateLimit(identifier: string): Promise<RateLimitResult> {
  // 10 requests per hour for resource-intensive operations
  return checkRateLimit(
    `expensive:${identifier}`,
    10, // max 10 requests
    60 * 60 * 1000 // per hour
  );
}

/**
 * Reset rate limit for a specific identifier (useful for testing or admin overrides)
 */
export async function resetRateLimit(identifier: string): Promise<void> {
  const redis = getRedisClient();
  const key = `ratelimit:${identifier}`;

  try {
    await redis.del(key);
  } catch (error) {
    console.error('[Rate Limit] Failed to reset rate limit:', error);
  }
}

/**
 * Get current rate limit status without incrementing
 * Useful for checking status before expensive operations
 */
export async function getRateLimitStatus(
  identifier: string,
  maxRequests: number = 50,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  try {
    const currentCount = await redis.get(key);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    // @ts-expect-error - pttl may not exist on fallback client
    const ttl = typeof redis.pttl === 'function' ? await redis.pttl(key) : -1;
    const resetTime = ttl > 0 ? now + ttl : now + windowMs;

    return {
      allowed: count < maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetTime
    };
  } catch (error) {
    console.error('[Rate Limit] Failed to get status:', error);
    return {
      allowed: true,
      remaining: maxRequests,
      resetTime: now + windowMs
    };
  }
}
