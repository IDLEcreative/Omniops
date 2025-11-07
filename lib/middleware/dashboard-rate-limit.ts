/**
 * Dashboard-Specific Rate Limiting
 *
 * Protects dashboard endpoints from abuse while allowing legitimate use.
 * Uses Redis-backed rate limiting for distributed consistency.
 *
 * Limits:
 * - Dashboard Queries: 100 requests/minute per user (generous for UI interactions)
 * - Bulk Operations: 10 requests/minute per user (prevent bulk action spam)
 * - Analytics: 30 requests/minute per user (balance between UX and DB load)
 * - Export Operations: 5 requests/5 minutes per user (expensive operations)
 *
 * Features:
 * - User-based rate limiting (not IP-based, prevents VPN bypass)
 * - Separate limits for different endpoint types
 * - Graceful degradation if Redis unavailable (fail-open)
 * - Detailed error responses with retry information
 * - Rate limit headers on all responses
 */

import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import type { User } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Rate limit configurations for different dashboard endpoints
 */
const RATE_LIMITS = {
  // Dashboard queries: moderate load, frequent refresh
  dashboard: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
  // Bulk operations: can be expensive, limit strictly
  bulkActions: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // Analytics: moderate queries, less frequent than dashboard
  analytics: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
  },
  // Export operations: very expensive, very restrictive
  export: {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
} as const;

export type DashboardEndpoint = keyof typeof RATE_LIMITS;

/**
 * Check rate limit for dashboard endpoint
 *
 * @param user - Authenticated user (or identifier string)
 * @param endpoint - Which dashboard endpoint is being accessed
 * @returns null if allowed, NextResponse (429) if rate limited
 */
export async function checkDashboardRateLimit(
  user: User | string,
  endpoint: DashboardEndpoint
): Promise<null | NextResponse> {
  const config = RATE_LIMITS[endpoint];
  const userId = typeof user === 'string' ? user : user.id;
  const userEmail = typeof user === 'string' ? user : user.email;
  const identifier = `dashboard:${endpoint}:${userId}`;

  try {
    const result = await checkRateLimit(
      identifier,
      config.maxRequests,
      config.windowMs
    );

    if (!result.allowed) {
      const resetTime = new Date(result.resetTime);
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      logger.warn('Dashboard rate limit exceeded', {
        userId,
        email: userEmail,
        endpoint,
        resetTime: resetTime.toISOString(),
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests to ${endpoint}. Please try again in ${retryAfter} seconds.`,
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
            'X-RateLimit-Remaining': '0',
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
      userId,
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
 * @param user - Authenticated user (or identifier string)
 * @param endpoint - Which dashboard endpoint was accessed
 * @returns Response with rate limit headers
 */
export async function addDashboardRateLimitHeaders(
  response: NextResponse,
  user: User | string,
  endpoint: DashboardEndpoint
): Promise<NextResponse> {
  const config = RATE_LIMITS[endpoint];
  const userId = typeof user === 'string' ? user : user.id;
  const identifier = `dashboard:${endpoint}:${userId}`;

  try {
    // Get current rate limit status without incrementing
    const result = await checkRateLimit(
      identifier,
      config.maxRequests,
      config.windowMs
    );

    const resetTime = new Date(result.resetTime);

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, result.remaining - 1).toString());
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
 * Rate limit wrapper for dashboard endpoints
 *
 * Combines rate limit check with automatic header injection.
 * Use this in API routes for clean, consistent rate limiting.
 *
 * @param user - Authenticated user
 * @param endpoint - Dashboard endpoint type
 * @param handler - Function that generates the response
 * @returns Response with rate limiting applied
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const user = await getAuthenticatedUser(request);
 *
 *   return withDashboardRateLimit(user, 'dashboard', async () => {
 *     const data = await fetchDashboardData();
 *     return NextResponse.json(data);
 *   });
 * }
 * ```
 */
export async function withDashboardRateLimit(
  user: User | string,
  endpoint: DashboardEndpoint,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Check rate limit first
  const rateLimitResponse = await checkDashboardRateLimit(user, endpoint);
  if (rateLimitResponse) {
    return rateLimitResponse; // Rate limit exceeded
  }

  // Execute handler
  const response = await handler();

  // Add rate limit headers to successful response
  await addDashboardRateLimitHeaders(response, user, endpoint);

  return response;
}

/**
 * Get rate limit configuration for an endpoint
 *
 * @param endpoint - Dashboard endpoint type
 * @returns Rate limit configuration
 */
export function getRateLimitConfig(endpoint: DashboardEndpoint) {
  return RATE_LIMITS[endpoint];
}

/**
 * Check if user has reached their rate limit without incrementing
 *
 * Useful for warning users before they hit the limit.
 *
 * @param user - Authenticated user
 * @param endpoint - Dashboard endpoint type
 * @returns Rate limit status
 */
export async function getDashboardRateLimitStatus(
  user: User | string,
  endpoint: DashboardEndpoint
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}> {
  const config = RATE_LIMITS[endpoint];
  const userId = typeof user === 'string' ? user : user.id;
  const identifier = `dashboard:${endpoint}:${userId}`;

  try {
    const result = await checkRateLimit(
      identifier,
      config.maxRequests,
      config.windowMs
    );

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetTime: result.resetTime,
      limit: config.maxRequests,
    };
  } catch (error) {
    logger.error('Failed to get rate limit status', {
      userId,
      endpoint,
      error: error instanceof Error ? error.message : String(error)
    });

    // Return permissive defaults on error
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
      limit: config.maxRequests,
    };
  }
}
