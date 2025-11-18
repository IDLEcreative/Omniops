import { NextRequest, NextResponse } from 'next/server';
import { QUEUE_NAMESPACES } from '@/lib/redis-unified';
import { logger } from '@/lib/logger';
import {
  checkAPI,
  checkDatabase,
  checkRedis,
  checkQueues,
  checkWorkers,
  checkSystemResources,
  checkOpenAI,
  type HealthCheckResult,
} from './checks';
import {
  buildHealthResponse,
  calculateOverallStatus,
  getHTTPStatus,
  buildResponseHeaders,
  getDetailedMetrics,
} from './formatters';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Comprehensive Health Check Endpoint
 *
 * Provides detailed health status for:
 * - API service
 * - Database (Supabase)
 * - Redis
 * - Queue system
 * - Workers
 * - System resources
 * - External services (verbose mode)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const verbose = request.nextUrl.searchParams.get('verbose') === 'true';

    const healthChecks: HealthCheckResult[] = [];

    // 1. API Health Check
    healthChecks.push(checkAPI());

    // 2. Database Health Check
    const dbCheck = await checkDatabase();
    healthChecks.push(dbCheck);

    // 3. Redis Health Check
    const redisCheck = await checkRedis();
    healthChecks.push(redisCheck);

    // 4. Queue System Health Check
    const queues = [
      QUEUE_NAMESPACES.SCRAPE.NORMAL,
      QUEUE_NAMESPACES.EMBEDDINGS.GENERATE,
      QUEUE_NAMESPACES.WOOCOMMERCE.SYNC,
    ];
    const queueCheck = await checkQueues(queues);
    healthChecks.push(queueCheck);

    // 5. Worker Health Check
    const workerCheck = await checkWorkers();
    healthChecks.push(workerCheck);

    // 6. System Resources Check
    const systemCheck = checkSystemResources();
    healthChecks.push(systemCheck);

    // 7. External Services Check (if verbose)
    if (verbose) {
      const openaiCheck = await checkOpenAI();
      healthChecks.push(openaiCheck);
    }

    const responseTime = Date.now() - startTime;

    // Calculate overall status
    const overallStatus = calculateOverallStatus(healthChecks);

    // Get detailed metrics if verbose
    const metrics = verbose ? await getDetailedMetrics() : undefined;

    // Build response
    const response = buildHealthResponse(healthChecks, overallStatus, responseTime, metrics);

    // Log health check
    logger.debug('Comprehensive health check performed', {
      status: overallStatus,
      responseTime,
      summary: response.summary,
    });

    // Set HTTP status and headers
    const httpStatus = getHTTPStatus(overallStatus);
    const headers = buildResponseHeaders(responseTime, overallStatus);

    return NextResponse.json(response, {
      status: httpStatus,
      headers,
    });
  } catch (error) {
    console.error('[Health Check] Comprehensive check failed:', error);
    logger.error('Comprehensive health check error', { error });

    return NextResponse.json(
      {
        status: 'error',
        checks: [],
        summary: { healthy: 0, unhealthy: 0, total: 0 },
        responseTime: Date.now() - startTime,
        error: 'Failed to perform health check'
      },
      { status: 500 }
    );
  }
}
