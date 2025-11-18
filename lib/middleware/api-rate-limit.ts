/**
 * Comprehensive API Rate Limiting Middleware
 *
 * Protects ALL public API endpoints from abuse with tiered rate limiting.
 * Uses Redis-backed distributed rate limiting for consistency across instances.
 *
 * Rate Limit Tiers:
 * - Chat endpoints: 50 requests/15 minutes (resource-intensive AI operations)
 * - Scraping endpoints: 10 requests/15 minutes (very resource-intensive web crawling)
 * - Write operations: 100 requests/15 minutes (mutations, creates, updates, deletes)
 * - Read operations: 200 requests/15 minutes (queries, fetches)
 * - Webhooks: No limit (validated via signature)
 *
 * Features:
 * - IP-based rate limiting for unauthenticated requests
 * - User-based rate limiting for authenticated requests (prevents VPN bypass)
 * - Automatic endpoint type detection
 * - Proper HTTP 429 responses with Retry-After header
 * - Rate limit headers on all responses (X-RateLimit-*)
 * - Trusted IP bypass for internal services
 * - Graceful degradation if Redis unavailable (fail-open)
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/**
 * Rate limit configurations for different endpoint types
 *
 * Format: maxRequests per windowMs milliseconds
 */
export const RATE_LIMIT_TIERS = {
  // AI chat endpoints - resource-intensive (GPT-4, embeddings, etc.)
  chat: {
    maxRequests: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
    description: 'AI chat operations'
  },
  // Web scraping - very resource-intensive (Playwright, crawling)
  scraping: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    description: 'Web scraping operations'
  },
  // Write operations - mutations, creates, updates, deletes
  write: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    description: 'Write operations'
  },
  // Read operations - queries, fetches
  read: {
    maxRequests: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
    description: 'Read operations'
  },
  // Webhooks - no limit (validated via signature)
  webhook: {
    maxRequests: Infinity,
    windowMs: 15 * 60 * 1000, // Not used
    description: 'Webhook callbacks'
  }
} as const;

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

/**
 * Endpoint patterns mapped to rate limit tiers
 */
const ENDPOINT_PATTERNS: Record<string, RateLimitTier> = {
  // Chat endpoints (resource-intensive)
  '/api/chat': 'chat',
  '/api/ai-quote': 'chat',

  // Scraping endpoints (very resource-intensive)
  '/api/scrape': 'scraping',
  '/api/setup-rag': 'scraping',

  // Webhooks (no limit, validated via signature)
  '/api/stripe/webhook': 'webhook',
  '/api/whatsapp/webhook': 'webhook',

  // Write operations (mutations)
  '/api/organizations': 'write',
  '/api/privacy/delete': 'write',
  '/api/customer': 'write',
  '/api/training': 'write',
  '/api/autonomous/operations': 'write',

  // Read operations (queries) - default for most endpoints
  // All other endpoints fall into this category
};

/**
 * Trusted IPs that bypass rate limiting
 *
 * Configure via TRUSTED_IPS environment variable (comma-separated)
 * Examples: internal services, monitoring systems, CI/CD
 */
function getTrustedIPs(): string[] {
  const trustedIPs = process.env.TRUSTED_IPS?.split(',').map(ip => ip.trim()) || [];
  return trustedIPs;
}

/**
 * Get client IP from request headers
 *
 * Handles various proxy headers (Vercel, Cloudflare, etc.)
 */
export function getClientIP(request: NextRequest): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
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

/**
 * Determine rate limit tier for endpoint
 *
 * Checks endpoint patterns and HTTP method to determine appropriate tier.
 */
export function determineRateLimitTier(pathname: string, method: string): RateLimitTier {
  // Check exact matches first
  for (const [pattern, tier] of Object.entries(ENDPOINT_PATTERNS)) {
    if (pathname.startsWith(pattern)) {
      return tier;
    }
  }

  // Default based on HTTP method
  if (method === 'GET' || method === 'HEAD') {
    return 'read';
  }

  // POST, PUT, PATCH, DELETE = write operations
  return 'write';
}

/**
 * Check if IP is trusted (bypasses rate limiting)
 */
export function isTrustedIP(ip: string): boolean {
  const trustedIPs = getTrustedIPs();
  return trustedIPs.includes(ip);
}

/**
 * Apply rate limiting to API request
 *
 * @param request - Next.js request object
 * @param user - Authenticated user (optional, for user-based rate limiting)
 * @returns null if allowed, NextResponse (429) if rate limited
 */
export async function applyRateLimit(
  request: NextRequest,
  user?: { id: string; email?: string }
): Promise<null | NextResponse> {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Determine rate limit tier
  const tier = determineRateLimitTier(pathname, method);
  const config = RATE_LIMIT_TIERS[tier];

  // Webhooks bypass rate limiting (validated via signature)
  if (tier === 'webhook') {
    return null;
  }

  // Get client IP
  const clientIP = getClientIP(request);

  // Check if IP is trusted (bypass rate limiting)
  if (isTrustedIP(clientIP)) {
    logger.debug('Trusted IP bypassing rate limit', { ip: clientIP, pathname });
    return null;
  }

  // Build rate limit identifier
  // Prefer user-based (prevents VPN bypass), fallback to IP-based
  const identifier = user
    ? `api:${tier}:user:${user.id}`
    : `api:${tier}:ip:${clientIP}`;

  try {
    const result = await checkRateLimit(
      identifier,
      config.maxRequests,
      config.windowMs
    );

    if (!result.allowed) {
      const resetTime = new Date(result.resetTime);
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);

      logger.warn('API rate limit exceeded', {
        identifier: user ? `user:${user.id}` : `ip:${clientIP}`,
        email: user?.email,
        tier,
        pathname,
        method,
        resetTime: resetTime.toISOString(),
        timestamp: new Date().toISOString()
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests to ${config.description}. Please try again in ${retryAfter} seconds.`,
          retryAfter,
          resetTime: resetTime.toISOString(),
          limit: config.maxRequests,
          window: `${config.windowMs / 1000}s`,
          tier
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toISOString(),
            'X-RateLimit-Tier': tier
          }
        }
      );
    }

    // Rate limit check passed
    return null;

  } catch (error) {
    // Log error but allow request (fail-open for availability)
    logger.error('Rate limit check failed', {
      identifier: user ? `user:${user.id}` : `ip:${clientIP}`,
      tier,
      pathname,
      error: error instanceof Error ? error.message : String(error)
    });

    return null; // Allow request on error
  }
}

/**
 * Add rate limit headers to response
 *
 * Informs client of their current rate limit status.
 * Helps clients implement proactive rate limit handling.
 */
export async function addRateLimitHeaders(
  response: NextResponse,
  request: NextRequest,
  user?: { id: string; email?: string }
): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Determine rate limit tier
  const tier = determineRateLimitTier(pathname, method);
  const config = RATE_LIMIT_TIERS[tier];

  // Skip webhooks
  if (tier === 'webhook') {
    return response;
  }

  // Get client IP
  const clientIP = getClientIP(request);

  // Build rate limit identifier
  const identifier = user
    ? `api:${tier}:user:${user.id}`
    : `api:${tier}:ip:${clientIP}`;

  try {
    const result = await checkRateLimit(
      identifier,
      config.maxRequests,
      config.windowMs
    );

    const resetTime = new Date(result.resetTime);

    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', Math.max(0, result.remaining - 1).toString());
    response.headers.set('X-RateLimit-Reset', resetTime.toISOString());
    response.headers.set('X-RateLimit-Tier', tier);

  } catch (error) {
    // Silently fail - don't block response if headers can't be set
    logger.debug('Failed to add rate limit headers', {
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return response;
}

/**
 * Wrapper for API routes with automatic rate limiting
 *
 * Combines rate limit check with automatic header injection.
 * Use this in API routes for clean, consistent rate limiting.
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withAPIRateLimit(request, async () => {
 *     const data = await fetchData();
 *     return NextResponse.json(data);
 *   });
 * }
 * ```
 */
export async function withAPIRateLimit(
  request: NextRequest,
  handler: () => Promise<NextResponse>,
  user?: { id: string; email?: string }
): Promise<NextResponse> {
  // Check rate limit first
  const rateLimitResponse = await applyRateLimit(request, user);
  if (rateLimitResponse) {
    return rateLimitResponse; // Rate limit exceeded
  }

  // Execute handler
  const response = await handler();

  // Add rate limit headers to successful response
  await addRateLimitHeaders(response, request, user);

  return response;
}
