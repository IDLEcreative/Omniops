/**
 * Multi-Dimensional Rate Limiting
 * Combines IP + User ID + Endpoint for granular protection
 * Uses Redis sorted sets for efficient sliding window implementation
 */

import { getRedisClient } from './redis';

interface RateLimitConfig {
  limit: number;
  window: number; // seconds
}

// Endpoint-specific rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - strict limits
  '/api/auth/login': { limit: 5, window: 900 },        // 5 per 15min
  '/api/auth/signup': { limit: 3, window: 3600 },      // 3 per hour
  '/api/auth/me': { limit: 30, window: 60 },           // 30 per minute

  // Chat endpoints - moderate limits
  '/api/chat': { limit: 100, window: 60 },             // 100 per minute
  '/api/recommendations': { limit: 50, window: 60 },   // 50 per minute

  // Privacy/GDPR endpoints - very strict limits
  '/api/gdpr/export': { limit: 2, window: 3600 },      // 2 per hour
  '/api/gdpr/delete': { limit: 1, window: 86400 },     // 1 per day
  '/api/privacy/export': { limit: 2, window: 3600 },   // 2 per hour
  '/api/privacy/delete': { limit: 1, window: 86400 },  // 1 per day

  // WooCommerce endpoints - moderate limits
  '/api/woocommerce/configure': { limit: 10, window: 300 },      // 10 per 5min
  '/api/woocommerce/credentials': { limit: 10, window: 60 },     // 10 per min
  '/api/woocommerce/products': { limit: 30, window: 60 },        // 30 per min
  '/api/woocommerce/abandoned-carts': { limit: 20, window: 60 }, // 20 per min

  // Shopify endpoints - moderate limits
  '/api/shopify/configure': { limit: 10, window: 300 },    // 10 per 5min
  '/api/shopify/products': { limit: 30, window: 60 },      // 30 per min

  // Admin endpoints - strict limits
  '/api/admin/cleanup': { limit: 5, window: 300 },         // 5 per 5min

  // Stripe webhook - moderate limits (100/min to handle bursts)
  '/api/stripe/webhook': { limit: 100, window: 60 },       // 100 per min

  // WooCommerce webhook - moderate limits
  '/api/webhooks/woocommerce/order-created': { limit: 100, window: 60 }, // 100 per min

  // Default catch-all
  'default': { limit: 60, window: 60 },                    // 60 per minute
};

export interface EnhancedRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

/**
 * Multi-dimensional rate limiting using IP + User ID + Endpoint
 * Provides granular control and prevents abuse across dimensions
 */
export async function checkEnhancedRateLimit(params: {
  ip: string;
  userId?: string;
  endpoint: string;
}): Promise<EnhancedRateLimitResult> {
  const redis = getRedisClient();

  try {
    // Get config for this endpoint
    const config = getEndpointConfig(params.endpoint);

    // Create composite key: IP + User + Endpoint
    const key = `ratelimit:${params.ip}:${params.userId || 'anon'}:${normalizeEndpoint(params.endpoint)}`;

    const now = Date.now();
    const windowStart = now - (config.window * 1000);

    // Check if this is a real Redis client (has zRemRangeByScore method)
    // @ts-expect-error - zRemRangeByScore may not exist on fallback client
    if (typeof redis.zRemRangeByScore === 'function') {
      // Remove old entries outside the window
      // @ts-expect-error - we checked above
      await redis.zRemRangeByScore(key, 0, windowStart);

      // Count requests in current window
      // @ts-expect-error - zCard may not exist on fallback
      const count = await redis.zCard(key);

      if (count >= config.limit) {
        // Rate limit exceeded - get reset time
        // @ts-expect-error - zRange may not exist on fallback
        const oldestEntry = await redis.zRange(key, 0, 0, { BY: 'SCORE' });
        const resetTime = oldestEntry?.length > 0
          ? parseInt(oldestEntry[0]) + (config.window * 1000)
          : now + (config.window * 1000);

        return {
          allowed: false,
          remaining: 0,
          resetTime,
          limit: config.limit,
        };
      }

      // Add this request to the sorted set
      // @ts-expect-error - zAdd may not exist on fallback
      await redis.zAdd(key, { score: now, value: `${now}` });
      await redis.expire(key, config.window);

      return {
        allowed: true,
        remaining: config.limit - count - 1,
        resetTime: now + (config.window * 1000),
        limit: config.limit,
      };
    } else {
      // Fallback for simple Redis client - use simple counter approach
      const currentValue = await redis.get(key);
      const currentCount = currentValue ? parseInt(currentValue, 10) : 0;

      if (currentCount >= config.limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: now + (config.window * 1000),
          limit: config.limit,
        };
      }

      // Increment and set expiry
      const newCount = await redis.incr(key);
      if (currentCount === 0) {
        await redis.expire(key, config.window);
      }

      return {
        allowed: true,
        remaining: Math.max(0, config.limit - newCount),
        resetTime: now + (config.window * 1000),
        limit: config.limit,
      };
    }

  } catch (error) {
    // SECURITY: Fail closed on errors to prevent rate limit bypass
    console.error('[Enhanced Rate Limit] Error:', error);

    return {
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60000,
      limit: 0,
    };
  }
}

/**
 * Get rate limit configuration for an endpoint
 * Supports exact match and pattern matching
 */
function getEndpointConfig(endpoint: string): RateLimitConfig {
  // Normalize endpoint
  const normalized = normalizeEndpoint(endpoint);

  // Exact match
  if (RATE_LIMITS[normalized]) {
    return RATE_LIMITS[normalized];
  }

  // Pattern match (e.g., /api/woocommerce/*)
  for (const pattern in RATE_LIMITS) {
    if (pattern.endsWith('*') && normalized.startsWith(pattern.slice(0, -1))) {
      return RATE_LIMITS[pattern];
    }
  }

  return RATE_LIMITS.default;
}

/**
 * Normalize endpoint for consistent key generation
 * Removes query params and trailing slashes
 */
function normalizeEndpoint(endpoint: string): string {
  return endpoint.split('?')[0].replace(/\/$/, '');
}

/**
 * Extract client IP from request headers
 * Handles multiple proxy scenarios (Vercel, Cloudflare, etc.)
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const cfConnectingIp = headers.get('cf-connecting-ip');

  // Prefer CF-Connecting-IP (Cloudflare), then X-Real-IP, then X-Forwarded-For
  if (cfConnectingIp) return cfConnectingIp;
  if (realIp) return realIp;
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  return 'unknown';
}

/**
 * Create rate limit response with proper headers
 */
export function createRateLimitResponse(
  result: EnhancedRateLimitResult,
  corsHeaders?: Record<string, string>
): Response {
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000));

  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...(corsHeaders || {}),
        'Content-Type': 'application/json',
        'Retry-After': retryAfterSeconds.toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.resetTime.toString(),
      },
    }
  );
}

/**
 * Get rate limit headers for successful requests
 */
export function getRateLimitHeaders(result: EnhancedRateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  };
}
