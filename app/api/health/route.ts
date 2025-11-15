import { NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 10; // 10 seconds for health checks (includes DB queries, Redis ping, error log lookups)
import { createClient } from '@/lib/supabase-server';
import { errorLogger } from '@/lib/error-logger';
import { withErrorHandler } from '@/lib/api-error-handler';

async function handler() {
  const startTime = Date.now();
  const checks = {
    api: 'ok',
    database: 'checking',
    redis: 'checking',
    memory: 'checking',
    errors: 'checking',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check database connection
    let dbLatency = 0;
    const dbStart = Date.now();
    const supabase = await createClient();
    
    if (!supabase) {
      checks.database = 'unavailable';
    } else {
      const { error: dbError } = await supabase.from('conversations').select('count').limit(1);
      dbLatency = Date.now() - dbStart;
      checks.database = dbError ? 'error' : 'ok';
    }
    
    // Check Redis connection
    let redisLatency = 0;
    try {
      const redisStart = Date.now();
      const { getRedisClient } = await import('@/lib/redis');
      const redis = getRedisClient();
      if (redis && 'ping' in redis) {
        await (redis as any).ping();
        checks.redis = 'ok';
      } else {
        checks.redis = 'not-configured';
      }
      redisLatency = Date.now() - redisStart;
    } catch (error) {
      checks.redis = 'error';
    }
    
    // Check memory usage
    const mem = process.memoryUsage();
    const memoryUsagePercent = (mem.heapUsed / mem.heapTotal) * 100;
    checks.memory = memoryUsagePercent > 90 ? 'critical' : 
                    memoryUsagePercent > 70 ? 'warning' : 'ok';
    
    // Check recent errors
    try {
      const recentErrors = await errorLogger.getRecentErrors(10);
      const criticalErrors = recentErrors.filter(e => e.severity === 'critical');
      checks.errors = criticalErrors.length > 0 ? 'critical' : 
                      recentErrors.length > 5 ? 'warning' : 'ok';
    } catch {
      checks.errors = 'unknown';
    }
    
    // Add detailed metrics
    const detailedChecks = {
      ...checks,
      latency: {
        database: `${dbLatency}ms`,
        redis: `${redisLatency}ms`,
      },
      memory: {
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
        percentage: Math.round(memoryUsagePercent),
      },
    };

    const allHealthy = checks.api === 'ok' && 
                      checks.database === 'ok' && 
                      checks.memory !== 'critical' &&
                      checks.errors !== 'critical';
    
    const isDegraded = !allHealthy && checks.database === 'ok';
    const responseTime = Date.now() - startTime;
    
    // Log health check if degraded or unhealthy
    if (!allHealthy) {
      console.warn('Health check degraded/unhealthy', {
        status: allHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy',
        responseTime,
        checks: detailedChecks,
      });
    }
    
    return NextResponse.json(
      { 
        status: allHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy',
        checks: detailedChecks,
        responseTime: `${responseTime}ms`,
      },
      { 
        status: allHealthy || isDegraded ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );
  } catch (error) {
    checks.database = 'error';
    const responseTime = Date.now() - startTime;
    
    console.error('Health check failed:', error);
    await errorLogger.logError(error, { endpoint: '/api/health', checks });
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        checks,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: `${responseTime}ms`,
      },
      { status: 503 }
    );
  }
}

export const GET = withErrorHandler(handler);
