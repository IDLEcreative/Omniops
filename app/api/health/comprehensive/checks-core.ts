import { createClient } from '@/lib/supabase-server';
import { getRedisClient } from '@/lib/redis-unified';
import type { HealthCheckResult } from './types';

/**
 * API Health Check (basic info)
 */
export function checkAPI(): HealthCheckResult {
  return {
    service: 'api',
    status: 'healthy',
    details: {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    },
  };
}

/**
 * Check Database Health
 */
export async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const supabase = await createClient();

    if (!supabase) {
      return {
        service: 'database',
        status: 'unhealthy',
        latency: Date.now() - startTime,
        error: 'Database connection unavailable',
      };
    }

    // Perform a simple query
    const { data, error } = await supabase
      .from('conversations')
      .select('count')
      .limit(1)
      .single();

    const latency = Date.now() - startTime;

    if (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        latency,
        error: error.message,
      };
    }

    // Check if latency is acceptable
    const status = latency < 100 ? 'healthy' :
                   latency < 500 ? 'degraded' : 'unhealthy';

    return {
      service: 'database',
      status,
      latency,
      details: {
        provider: 'supabase',
        latencyStatus: latency < 100 ? 'good' : latency < 500 ? 'slow' : 'critical',
      },
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Redis Health
 */
export async function checkRedis(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const redis = getRedisClient();
    const pingResult = await redis.ping();
    const latency = Date.now() - startTime;

    // Get Redis status
    const redisStatus = redis.getStatus();

    if (!pingResult) {
      return {
        service: 'redis',
        status: redisStatus.circuitBreakerOpen ? 'degraded' : 'unhealthy',
        latency,
        details: {
          connected: redisStatus.connected,
          circuitBreakerOpen: redisStatus.circuitBreakerOpen,
          fallbackActive: redisStatus.fallbackSize > 0,
          fallbackSize: redisStatus.fallbackSize,
        },
        error: 'Redis ping failed',
      };
    }

    const status = redisStatus.connected ? 'healthy' :
                   redisStatus.circuitBreakerOpen ? 'degraded' : 'unhealthy';

    return {
      service: 'redis',
      status,
      latency,
      details: {
        connected: redisStatus.connected,
        circuitBreakerOpen: redisStatus.circuitBreakerOpen,
        fallbackActive: redisStatus.fallbackSize > 0,
        fallbackSize: redisStatus.fallbackSize,
      },
    };
  } catch (error) {
    return {
      service: 'redis',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
