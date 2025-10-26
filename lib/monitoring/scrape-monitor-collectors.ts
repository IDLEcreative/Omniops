/**
 * Metric collection functions for scrape monitoring system
 */
import * as os from 'os';
import { ScrapeQueueManager } from '../queue/scrape-queue';
import { ResilientRedisClient } from '../redis-enhanced';
import {
  ComponentHealth,
  SystemMetrics,
  MonitoringConfig,
  QueueMetrics,
  WorkerMetrics,
  MemoryMetrics,
  RedisMetrics,
} from './scrape-monitor-types';

/**
 * Check Redis health
 */
export async function checkRedisHealth(
  redisClient: ResilientRedisClient,
  config: MonitoringConfig
): Promise<ComponentHealth> {
  const startTime = Date.now();

  try {
    const pingResult = await redisClient.ping();
    const responseTime = Date.now() - startTime;

    if (pingResult) {
      return {
        status: responseTime > config.alertThresholds.responseTime.warning ? 'degraded' : 'healthy',
        responseTime,
        lastCheck: new Date(),
        message: `Redis responding in ${responseTime}ms`,
      };
    } else {
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        message: 'Redis ping failed',
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'unhealthy',
      responseTime,
      lastCheck: new Date(),
      message: `Redis connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check queue health
 */
export async function checkQueueHealth(
  queueManager: ScrapeQueueManager,
  config: MonitoringConfig
): Promise<ComponentHealth> {
  try {
    const metrics = await queueManager.getQueueMetrics();
    const queueStats = metrics.queue;

    const totalPendingJobs = queueStats.waiting + queueStats.delayed;
    const isOverloaded = totalPendingJobs > config.alertThresholds.queue.critical;
    const isDegraded = totalPendingJobs > config.alertThresholds.queue.warning;

    return {
      status: isOverloaded ? 'unhealthy' : isDegraded ? 'degraded' : 'healthy',
      lastCheck: new Date(),
      message: `${totalPendingJobs} pending jobs, ${queueStats.active} active`,
      details: {
        ...queueStats,
        redis: metrics.redis,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      lastCheck: new Date(),
      message: `Queue health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check workers health
 */
export async function checkWorkersHealth(): Promise<ComponentHealth> {
  try {
    // Worker metrics not available from ScrapeQueueManager
    const workerMetrics: any[] = [];
    const activeWorkers = 0;
    const failedWorkers = 0;
    const totalWorkers = workerMetrics.length;

    const healthyRatio = activeWorkers / Math.max(totalWorkers, 1);
    const isUnhealthy = healthyRatio < 0.5;
    const isDegraded = healthyRatio < 0.8;

    return {
      status: isUnhealthy ? 'unhealthy' : isDegraded ? 'degraded' : 'healthy',
      lastCheck: new Date(),
      message: `${activeWorkers}/${totalWorkers} workers active, ${failedWorkers} failed`,
      details: {
        total: totalWorkers,
        active: activeWorkers,
        failed: failedWorkers,
        metrics: workerMetrics,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      lastCheck: new Date(),
      message: `Worker health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check memory health
 */
export async function checkMemoryHealth(config: MonitoringConfig): Promise<ComponentHealth> {
  try {
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const percentUsed = memUsage.heapUsed / totalMemory;

    const isCritical = percentUsed > config.alertThresholds.memory.critical;
    const isWarning = percentUsed > config.alertThresholds.memory.warning;

    return {
      status: isCritical ? 'unhealthy' : isWarning ? 'degraded' : 'healthy',
      lastCheck: new Date(),
      message: `Memory usage: ${(percentUsed * 100).toFixed(1)}% (${Math.round(memUsage.heapUsed / 1024 / 1024)}MB)`,
      details: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        rss: memUsage.rss,
        percentUsed,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      lastCheck: new Date(),
      message: `Memory health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<ComponentHealth> {
  try {
    const startTime = Date.now();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        message: 'Database configuration missing',
      };
    }

    const responseTime = Date.now() - startTime;
    return {
      status: 'healthy',
      responseTime,
      lastCheck: new Date(),
      message: 'Database configuration present',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      lastCheck: new Date(),
      message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Collect comprehensive system metrics
 */
export async function collectSystemMetrics(
  queueManager: ScrapeQueueManager,
  redisClient: ResilientRedisClient
): Promise<SystemMetrics> {
  const [queueMetricsData, memoryUsage] = await Promise.all([
    queueManager.getQueueMetrics(),
    Promise.resolve(process.memoryUsage()),
  ]);

  const queueStats = queueMetricsData.queue;
  const workerMetrics: any[] = [];

  const totalMemory = os.totalmem();
  const activeWorkers = workerMetrics.filter((w: any) => w.isRunning);

  return {
    queue: {
      waiting: queueStats.waiting,
      active: queueStats.active,
      completed: queueStats.completed,
      failed: queueStats.failed,
      delayed: queueStats.delayed,
      throughput: 0,
      avgProcessingTime: 0,
    },
    workers: {
      total: workerMetrics.length,
      active: activeWorkers.length,
      idle: workerMetrics.length - activeWorkers.length,
      failed: workerMetrics.filter((w: any) => !w.isRunning).length,
      avgMemoryUsage: 0,
      avgCpuUsage: 0,
    },
    memory: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      percentUsed: memoryUsage.heapUsed / totalMemory,
    },
    redis: {
      connected: await redisClient.ping(),
      memoryUsage: 0,
      keyCount: 0,
      hitRate: 0,
    },
  };
}

/**
 * Get empty metrics template
 */
export function getEmptyMetrics(): SystemMetrics {
  return {
    queue: {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      throughput: 0,
      avgProcessingTime: 0,
    },
    workers: {
      total: 0,
      active: 0,
      idle: 0,
      failed: 0,
      avgMemoryUsage: 0,
      avgCpuUsage: 0,
    },
    memory: {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      rss: 0,
      percentUsed: 0,
    },
    redis: {
      connected: false,
      memoryUsage: 0,
      keyCount: 0,
      hitRate: 0,
    },
  };
}
