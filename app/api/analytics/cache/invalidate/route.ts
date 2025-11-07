import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { checkAnalyticsRateLimit } from '@/lib/middleware/analytics-rate-limit';
import { getSearchCacheManager } from '@/lib/search-cache';
import { getRedisClient } from '@/lib/redis';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cache Invalidation Endpoint (Admin Only)
 *
 * POST /api/analytics/cache/invalidate
 *
 * Clears analytics caches:
 * - Dashboard analytics cache
 * - Business intelligence cache
 * - Query cache (Redis)
 *
 * Query Parameters:
 * - type: 'dashboard' | 'bi' | 'all' (default: 'all')
 * - domain: specific domain to clear (optional)
 *
 * Security:
 * - Requires admin authentication
 * - Rate limited to 5 requests per minute
 *
 * Example:
 * POST /api/analytics/cache/invalidate?type=bi&domain=example.com
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication: Admin only
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult; // Return 401/403 error
    }
    const { user, organizationId } = authResult;

    // 2. Rate Limiting: 5 requests per minute
    const rateLimitError = await checkAnalyticsRateLimit(user, 'cacheInvalidation');
    if (rateLimitError) {
      return rateLimitError; // Return 429 error
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const domain = searchParams.get('domain');

    // Validate type
    if (!['dashboard', 'bi', 'all'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid cache type. Must be: dashboard, bi, or all' },
        { status: 400 }
      );
    }

    logger.info('Cache invalidation requested', {
      userId: user.id,
      organizationId,
      type,
      domain,
      timestamp: new Date().toISOString()
    });

    const cacheManager = getSearchCacheManager();
    const redis = getRedisClient();
    const results = {
      deletedKeys: 0,
      errors: 0
    };

    // 4. Clear caches based on type
    if (type === 'dashboard' || type === 'all') {
      try {
        // Dashboard analytics cache pattern
        const pattern = domain
          ? `analytics:dashboard:${domain}:*`
          : 'analytics:dashboard:*';

        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          const deleted = await redis.del(...keys);
          results.deletedKeys += deleted;
          logger.info(`Deleted ${deleted} dashboard cache keys`);
        }
      } catch (error) {
        logger.error('Failed to clear dashboard cache', error);
        results.errors++;
      }
    }

    if (type === 'bi' || type === 'all') {
      try {
        // BI analytics cache pattern
        const pattern = domain
          ? `analytics:bi:${domain}:*`
          : 'analytics:bi:*';

        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          const deleted = await redis.del(...keys);
          results.deletedKeys += deleted;
          logger.info(`Deleted ${deleted} BI cache keys`);
        }
      } catch (error) {
        logger.error('Failed to clear BI cache', error);
        results.errors++;
      }
    }

    if (type === 'all') {
      try {
        // Clear query cache (used by search-cache manager)
        const pattern = domain
          ? `cache:*:${domain}:*`
          : 'cache:*';

        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          const deleted = await redis.del(...keys);
          results.deletedKeys += deleted;
          logger.info(`Deleted ${deleted} query cache keys`);
        }
      } catch (error) {
        logger.error('Failed to clear query cache', error);
        results.errors++;
      }
    }

    logger.info('Cache invalidation completed', {
      userId: user.id,
      organizationId,
      type,
      domain,
      results,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Cache invalidation completed',
      type,
      domain: domain || 'all',
      deletedKeys: results.deletedKeys,
      errors: results.errors
    });

  } catch (error) {
    logger.error('Cache invalidation error', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check cache stats (admin only)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    const redis = getRedisClient();
    const stats: Record<string, number> = {};

    if (type === 'dashboard' || type === 'all') {
      const dashboardKeys = await redis.keys('analytics:dashboard:*');
      stats.dashboardCacheKeys = dashboardKeys.length;
    }

    if (type === 'bi' || type === 'all') {
      const biKeys = await redis.keys('analytics:bi:*');
      stats.biCacheKeys = biKeys.length;
    }

    if (type === 'all') {
      const queryCacheKeys = await redis.keys('cache:*');
      stats.queryCacheKeys = queryCacheKeys.length;
    }

    return NextResponse.json({
      type,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get cache stats', error);
    return NextResponse.json(
      { error: 'Failed to fetch cache stats' },
      { status: 500 }
    );
  }
}
