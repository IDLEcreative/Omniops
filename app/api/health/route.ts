import { NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

export async function GET() {
  const startTime = Date.now();
  const checks = {
    api: 'ok',
    database: 'checking',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check database connection
    const dbStart = Date.now();
    const supabase = await createClient();
    const { error } = await supabase.from('conversations').select('count').limit(1);
    const dbLatency = Date.now() - dbStart;
    
    checks.database = error ? 'error' : 'ok';
    
    // Add database latency to checks
    const detailedChecks = {
      ...checks,
      databaseLatency: `${dbLatency}ms`,
    };

    const allHealthy = checks.api === 'ok' && checks.database === 'ok';
    const responseTime = Date.now() - startTime;
    
    // Log health check
    logger.debug('Health check performed', {
      status: allHealthy ? 'healthy' : 'unhealthy',
      responseTime,
      checks: detailedChecks,
    });
    
    return NextResponse.json(
      { 
        status: allHealthy ? 'healthy' : 'unhealthy',
        checks: detailedChecks,
        responseTime: `${responseTime}ms`,
      },
      { 
        status: allHealthy ? 200 : 503,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );
  } catch (error) {
    checks.database = 'error';
    const responseTime = Date.now() - startTime;
    
    logger.error('Health check failed', error, { checks });
    
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
