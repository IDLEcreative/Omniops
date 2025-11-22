/**
 * Detailed Health Check Endpoint
 *
 * Provides focused health status for critical services:
 * - Database (Supabase)
 * - Redis cache
 * - OpenAI API
 *
 * Used by uptime monitoring services (Better Uptime, UptimeRobot, etc.)
 *
 * Response format:
 * {
 *   status: 'healthy' | 'degraded' | 'unhealthy',
 *   timestamp: ISO string,
 *   checks: {
 *     database: { status, latency, message? },
 *     redis: { status, latency, message? },
 *     openai: { status, latency, message? }
 *   }
 * }
 *
 * HTTP Status Codes:
 * - 200: All services healthy
 * - 503: One or more services unhealthy
 *
 * LOC: ~220 lines
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ServiceCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: ServiceCheck;
    redis: ServiceCheck;
    openai: ServiceCheck;
  };
}

/**
 * Check Supabase database health
 */
async function checkDatabase(): Promise<ServiceCheck> {
  const startTime = performance.now();

  try {
    const { createServiceRoleClient } = await import('@/lib/supabase-server');
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return {
        status: 'unhealthy',
        latency: performance.now() - startTime,
        message: 'Database client unavailable'
      };
    }

    // Simple query to verify database connectivity
    const { error } = await supabase
      .from('customer_configs')
      .select('id')
      .limit(1);

    const latency = performance.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        latency,
        message: `Database query failed: ${error.message}`
      };
    }

    // Check latency thresholds
    if (latency > 1000) {
      return {
        status: 'degraded',
        latency,
        message: 'Database response time high'
      };
    }

    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: performance.now() - startTime,
      message: error instanceof Error ? error.message : 'Database check failed'
    };
  }
}

/**
 * Check Redis health
 */
async function checkRedis(): Promise<ServiceCheck> {
  const startTime = performance.now();

  try {
    const { createClient } = await import('@/lib/redis-unified');
    const redis = createClient('health-check');

    if (!redis) {
      return {
        status: 'unhealthy',
        latency: performance.now() - startTime,
        message: 'Redis client unavailable'
      };
    }

    // Test Redis with a simple ping
    await redis.set('health-check', Date.now().toString(), { EX: 10 });
    await redis.get('health-check');

    const latency = performance.now() - startTime;

    // Check latency thresholds
    if (latency > 500) {
      return {
        status: 'degraded',
        latency,
        message: 'Redis response time high'
      };
    }

    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: performance.now() - startTime,
      message: error instanceof Error ? error.message : 'Redis check failed'
    };
  }
}

/**
 * Check OpenAI API health
 */
async function checkOpenAI(): Promise<ServiceCheck> {
  const startTime = performance.now();

  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        status: 'unhealthy',
        latency: performance.now() - startTime,
        message: 'OpenAI API key not configured'
      };
    }

    const { getOpenAIClient } = await import('@/lib/chat/openai-client');
    const client = getOpenAIClient();

    if (!client) {
      return {
        status: 'unhealthy',
        latency: performance.now() - startTime,
        message: 'OpenAI client unavailable'
      };
    }

    // Simple API call to verify connectivity
    // Using models.list as a lightweight check
    await client.models.list();

    const latency = performance.now() - startTime;

    // Check latency thresholds
    if (latency > 2000) {
      return {
        status: 'degraded',
        latency,
        message: 'OpenAI response time high'
      };
    }

    return {
      status: 'healthy',
      latency
    };
  } catch (error: any) {
    const latency = performance.now() - startTime;

    // Check if it's a rate limit or quota error
    if (error?.status === 429) {
      return {
        status: 'degraded',
        latency,
        message: 'OpenAI rate limit reached'
      };
    }

    return {
      status: 'unhealthy',
      latency,
      message: error?.message || 'OpenAI check failed'
    };
  }
}

/**
 * Calculate overall system health
 */
function calculateOverallStatus(checks: {
  database: ServiceCheck;
  redis: ServiceCheck;
  openai: ServiceCheck;
}): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = [checks.database.status, checks.redis.status, checks.openai.status];

  // If any service is unhealthy, overall is unhealthy
  if (statuses.includes('unhealthy')) {
    return 'unhealthy';
  }

  // If any service is degraded, overall is degraded
  if (statuses.includes('degraded')) {
    return 'degraded';
  }

  return 'healthy';
}

/**
 * GET /api/health/detailed
 * Returns detailed health check for monitoring services
 */
export async function GET(request: NextRequest): Promise<NextResponse<HealthResponse>> {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    openai: await checkOpenAI()
  };

  const overallStatus = calculateOverallStatus(checks);

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks
  };

  // Return 503 if unhealthy, 200 if healthy or degraded
  const httpStatus = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Health-Status': overallStatus
    }
  });
}
