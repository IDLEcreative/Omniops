import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getRedisClient, getJobManager, QUEUE_NAMESPACES } from '@/lib/redis-unified';
import { logger } from '@/lib/logger';
import os from 'os';

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  details?: any;
  error?: string;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  uptime: number;
  loadAverage: number[];
}

interface QueueMetrics {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

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
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const verbose = request.nextUrl.searchParams.get('verbose') === 'true';
  
  const healthChecks: HealthCheckResult[] = [];
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // 1. API Health Check
  healthChecks.push({
    service: 'api',
    status: 'healthy',
    details: {
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
    },
  });

  // 2. Database Health Check
  const dbCheck = await checkDatabase();
  healthChecks.push(dbCheck);
  if (dbCheck.status === 'unhealthy') overallStatus = 'unhealthy';
  else if (dbCheck.status === 'degraded') overallStatus = 'degraded';

  // 3. Redis Health Check
  const redisCheck = await checkRedis();
  healthChecks.push(redisCheck);
  if (redisCheck.status === 'unhealthy') overallStatus = 'degraded'; // Can work with fallback

  // 4. Queue System Health Check
  const queueCheck = await checkQueues();
  healthChecks.push(queueCheck);
  if (queueCheck.status === 'unhealthy') overallStatus = 'degraded';

  // 5. Worker Health Check
  const workerCheck = await checkWorkers();
  healthChecks.push(workerCheck);
  if (workerCheck.status === 'unhealthy') overallStatus = 'degraded';

  // 6. System Resources Check
  const systemCheck = checkSystemResources();
  healthChecks.push(systemCheck);
  if (systemCheck.status === 'unhealthy') overallStatus = 'degraded';

  // 7. External Services Check (if verbose)
  if (verbose) {
    const openaiCheck = await checkOpenAI();
    healthChecks.push(openaiCheck);
    
    // Add more external service checks as needed
  }

  const responseTime = Date.now() - startTime;

  // Build response
  const response = {
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
  };

  // Add detailed metrics if verbose
  if (verbose) {
    response['metrics'] = await getDetailedMetrics();
  }

  // Log health check
  logger.debug('Comprehensive health check performed', {
    status: overallStatus,
    responseTime,
    summary: response.summary,
  });

  // Set appropriate HTTP status code
  const httpStatus = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 206 : 503;

  return NextResponse.json(response, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Response-Time': `${responseTime}ms`,
      'X-Health-Status': overallStatus,
    },
  });
}

/**
 * Check Database Health
 */
async function checkDatabase(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const supabase = await createClient();
    
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
async function checkRedis(): Promise<HealthCheckResult> {
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

/**
 * Check Queue System Health
 */
async function checkQueues(): Promise<HealthCheckResult> {
  try {
    const redis = getRedisClient();
    const queueMetrics: QueueMetrics[] = [];
    
    // Check main queues
    const queues = [
      QUEUE_NAMESPACES.SCRAPE.NORMAL,
      QUEUE_NAMESPACES.EMBEDDINGS.GENERATE,
      QUEUE_NAMESPACES.WOOCOMMERCE.SYNC,
    ];
    
    for (const queueName of queues) {
      // Get queue metrics (simplified - BullMQ specific keys)
      const waiting = await redis.get(`bull:${queueName}:wait`) || 0;
      const active = await redis.get(`bull:${queueName}:active`) || 0;
      const completed = await redis.get(`bull:${queueName}:completed`) || 0;
      const failed = await redis.get(`bull:${queueName}:failed`) || 0;
      
      queueMetrics.push({
        name: queueName,
        waiting: parseInt(waiting.toString()),
        active: parseInt(active.toString()),
        completed: parseInt(completed.toString()),
        failed: parseInt(failed.toString()),
        delayed: 0,
      });
    }
    
    // Determine health based on queue backlogs
    const totalWaiting = queueMetrics.reduce((sum, q) => sum + q.waiting, 0);
    const totalFailed = queueMetrics.reduce((sum, q) => sum + q.failed, 0);
    
    const status = totalWaiting < 100 && totalFailed < 10 ? 'healthy' :
                   totalWaiting < 1000 && totalFailed < 100 ? 'degraded' : 'unhealthy';
    
    return {
      service: 'queues',
      status,
      details: {
        queues: queueMetrics,
        summary: {
          totalWaiting,
          totalActive: queueMetrics.reduce((sum, q) => sum + q.active, 0),
          totalCompleted: queueMetrics.reduce((sum, q) => sum + q.completed, 0),
          totalFailed,
        },
      },
    };
  } catch (error) {
    return {
      service: 'queues',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check Worker Health
 */
async function checkWorkers(): Promise<HealthCheckResult> {
  try {
    const redis = getRedisClient();
    const workerKeys = await redis.keys('worker:health:*');
    
    const workers = [];
    let healthyWorkers = 0;
    let unhealthyWorkers = 0;
    
    for (const key of workerKeys) {
      const healthData = await redis.get(key);
      if (healthData) {
        const health = JSON.parse(healthData);
        const lastHeartbeat = new Date(health.lastHeartbeat);
        const timeSinceHeartbeat = Date.now() - lastHeartbeat.getTime();
        
        const isHealthy = timeSinceHeartbeat < 120000 && health.status === 'running';
        
        if (isHealthy) healthyWorkers++;
        else unhealthyWorkers++;
        
        workers.push({
          type: health.type,
          status: health.status,
          healthy: isHealthy,
          lastHeartbeat: health.lastHeartbeat,
          jobsProcessed: health.jobsProcessed,
          jobsFailed: health.jobsFailed,
          memoryUsage: health.memoryUsage,
        });
      }
    }
    
    const status = healthyWorkers > 0 && unhealthyWorkers === 0 ? 'healthy' :
                   healthyWorkers > 0 ? 'degraded' : 'unhealthy';
    
    return {
      service: 'workers',
      status,
      details: {
        workers,
        summary: {
          total: workers.length,
          healthy: healthyWorkers,
          unhealthy: unhealthyWorkers,
        },
      },
    };
  } catch (error) {
    return {
      service: 'workers',
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check System Resources
 */
function checkSystemResources(): HealthCheckResult {
  const metrics: SystemMetrics = {
    cpu: {
      usage: os.loadavg()[0] / os.cpus().length * 100,
      cores: os.cpus().length,
    },
    memory: {
      used: (os.totalmem() - os.freemem()),
      total: os.totalmem(),
      percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100,
    },
    uptime: os.uptime(),
    loadAverage: os.loadavg(),
  };
  
  // Determine health based on resource usage
  const cpuHealthy = metrics.cpu.usage < 80;
  const memoryHealthy = metrics.memory.percentage < 85;
  
  const status = cpuHealthy && memoryHealthy ? 'healthy' :
                 cpuHealthy || memoryHealthy ? 'degraded' : 'unhealthy';
  
  return {
    service: 'system',
    status,
    details: {
      cpu: {
        usage: `${metrics.cpu.usage.toFixed(2)}%`,
        cores: metrics.cpu.cores,
        loadAverage: metrics.loadAverage,
      },
      memory: {
        used: `${(metrics.memory.used / 1024 / 1024 / 1024).toFixed(2)}GB`,
        total: `${(metrics.memory.total / 1024 / 1024 / 1024).toFixed(2)}GB`,
        percentage: `${metrics.memory.percentage.toFixed(2)}%`,
      },
      uptime: `${Math.floor(metrics.uptime / 3600)}h ${Math.floor((metrics.uptime % 3600) / 60)}m`,
    },
  };
}

/**
 * Check OpenAI Service
 */
async function checkOpenAI(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Simple check - verify API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return {
        service: 'openai',
        status: 'unhealthy',
        error: 'OpenAI API key not configured',
      };
    }
    
    // Could add actual API call here if needed
    // For now, just check configuration
    
    return {
      service: 'openai',
      status: 'healthy',
      latency: Date.now() - startTime,
      details: {
        configured: true,
      },
    };
  } catch (error) {
    return {
      service: 'openai',
      status: 'unhealthy',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get Detailed Metrics (for verbose mode)
 */
async function getDetailedMetrics() {
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