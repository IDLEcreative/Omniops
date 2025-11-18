/**
 * Analytics-Specific Rate Limiting
 *
 * Protects analytics endpoints from abuse while allowing legitimate use.
 * Uses Redis-backed rate limiting for distributed consistency.
 *
 * Limits:
 * - Analytics Dashboard: 20 requests/minute per user
 * - Business Intelligence: 10 requests/minute per user (more expensive queries)
 * - Cache Invalidation: 5 requests/minute per admin
 *
 * Features:
 * - User-based rate limiting (not IP-based, prevents VPN bypass)
 * - Separate limits for different endpoint types
 * - Graceful degradation if Redis unavailable
 * - Detailed error responses with retry information
 */

import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import type { User } from '@/types/supabase';
import { logger } from '@/lib/logger';

/**
 * Rate limit configurations for different analytics endpoints
 */
const RATE_LIMITS = {
  // Dashboard analytics: moderate queries, frequent refresh
  dashboard: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  // Analytics exports: heavier payloads, limit to 10/hour
  export: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Business Intelligence: expensive queries, less frequent
  intelligence: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // Cache invalidation: admin-only, very restrictive
  cacheInvalidation: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

export type AnalyticsEndpoint = keyof typeof RATE_LIMITS;

/**
 * Check rate limit for analytics endpoint
 *
 * @param user - Authenticated user
 * @param endpoint - Which analytics endpoint is being accessed
 * @returns null if allowed, NextResponse (429) if rate limited
 */
export async function checkAnalyticsRateLimit(
  user: User,
  endpoint: AnalyticsEndpoint
): Promise<null | NextResponse> {
  const config = RATE_LIMITS[endpoint];
  const identifier = `analytics:${endpoint}:${user.id}`;

  try {
    const result = await checkRateLimit(
      identifier,
      config.maxRequests,
      config.windowMs
    );

    if (!result.allowed) {
      const resetTime = new Date(result.resetTime);
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      logger.warn('Analytics rate limit exceeded', {
        userId: user.id,
        email: user.email,
        endpoint,
        resetTime: resetTime.toISOString(),
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests to ${endpoint} analytics. Please try again in ${retryAfter} seconds.`,
          retryAfter,
          resetTime: resetTime.toISOString(),
          limit: config.maxRequests,
          window: `${config.windowMs / 1000}s`
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': resetTime.toISOString(),
          }
        }
      );
    }

    // Rate limit check passed
    return null;

  } catch (error) {
    // Log error but allow request (fail-open for availability)
    logger.error('Rate limit check failed', {
      userId: user.id,
      endpoint,
      error: error instanceof Error ? error.message : String(error)
    });

    return null; // Allow request on error
  }
}

/**
 * Add rate limit headers to successful response
 *
 * Informs client of their current rate limit status even on successful requests.
 * Helps clients implement proactive rate limit handling.
 *
 * @param response - Response to add headers to
 * @param user - Authenticated user
 * @param endpoint - Which analytics endpoint was accessed
 * @returns Response with rate limit headers
 */
export async function addRateLimitHeaders(
  response: NextResponse,
  user: User,
  endpoint: AnalyticsEndpoint
): Promise<NextResponse> {
  const config = RATE_LIMITS[endpoint];
  const identifier = `analytics:${endpoint}:${user.id}`;

  try {
    const result = await checkRateLimit(
      identifier,
      config.maxRequests,
      config.windowMs
    );

    const resetTime = new Date(result.resetTime);

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toISOString());

  } catch (error) {
    // Silently fail - don't block response if headers can't be set
    logger.debug('Failed to add rate limit headers', {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return response;
}

/**
 * Whitelist admin IPs (if needed for emergency access)
 *
 * In production, this could check against a database of whitelisted IPs
 * or use environment variables for emergency access.
 *
 * @param ip - IP address to check
 * @returns true if whitelisted
 */
export function isWhitelistedIP(ip: string): boolean {
  const whitelistedIPs = process.env.ANALYTICS_WHITELIST_IPS?.split(',') || [];
  return whitelistedIPs.includes(ip);
}

/**
 * Get client IP from request
 *
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 *
 * @param request - Request object
 * @returns Client IP address or 'unknown'
 */
export function getClientIP(request: Request): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return 'unknown';
}
