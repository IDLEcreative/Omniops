import { getRedisClient, getJobManager } from '@/lib/redis-unified';
import type { HealthCheckResult } from './checks';

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  responseTime: string;
  checks: HealthCheckResult[];
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
  metrics?: any;
}

/**
 * Build health response from check results
 */
export function buildHealthResponse(
  healthChecks: HealthCheckResult[],
  overallStatus: 'healthy' | 'degraded' | 'unhealthy',
  responseTime: number,
  verboseMetrics?: any
): HealthResponse {
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime}ms`,
    checks: healthChecks,
    summary: {
      total: healthChecks.length,
      healthy: healthChecks.filter(c => c.status === 'healthy').length,
      degraded: healthChecks.filter(c => c.status === 'degraded').length,
      unhealthy: healthChecks.filter(c => c.status === 'unhealthy').length,
    },
    ...(verboseMetrics && { metrics: verboseMetrics }),
  };
}

/**
 * Calculate overall status from individual checks
 */
export function calculateOverallStatus(checks: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
  const hasUnhealthy = checks.some(c => c.status === 'unhealthy' && isCriticalService(c.service));
  const hasDegraded = checks.some(c => c.status === 'degraded' || c.status === 'unhealthy');

  if (hasUnhealthy) return 'unhealthy';
  if (hasDegraded) return 'degraded';
  return 'healthy';
}

/**
 * Determine if a service is critical (unhealthy = overall unhealthy)
 */
function isCriticalService(service: string): boolean {
  const criticalServices = ['database', 'api'];
  return criticalServices.includes(service);
}

/**
 * Get HTTP status code from health status
 */
export function getHTTPStatus(status: 'healthy' | 'degraded' | 'unhealthy'): number {
  switch (status) {
    case 'healthy':
      return 200;
    case 'degraded':
      return 206; // Partial Content
    case 'unhealthy':
      return 503; // Service Unavailable
  }
}

/**
 * Build response headers
 */
export function buildResponseHeaders(
  responseTime: number,
  overallStatus: 'healthy' | 'degraded' | 'unhealthy'
): Record<string, string> {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'X-Response-Time': `${responseTime}ms`,
    'X-Health-Status': overallStatus,
  };
}

/**
 * Get Detailed Metrics (for verbose mode)
 */
export async function getDetailedMetrics() {
  const jobManager = getJobManager();

  try {
    const healthStatus = await jobManager.getHealthStatus();
    const redis = getRedisClient();

    // Get Redis info
    const redisKeys = await redis.keys('*');

    return {
      redis: {
        ...healthStatus,
        totalKeys: redisKeys.length,
        keysByPattern: {
          jobs: redisKeys.filter(k => k.startsWith('crawl:job')).length,
          results: redisKeys.filter(k => k.startsWith('crawl:results')).length,
          cache: redisKeys.filter(k => k.startsWith('cache:')).length,
          queue: redisKeys.filter(k => k.startsWith('bull:')).length,
        },
      },
      process: {
        pid: process.pid,
        version: process.version,
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        serviceType: process.env.SERVICE_TYPE || 'web',
      },
    };
  } catch (error) {
    return {
      error: 'Failed to get detailed metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
