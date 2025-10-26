import { getRedisClient } from '@/lib/redis-unified';
import type { HealthCheckResult, QueueMetrics } from './types';

/**
 * Check Queue System Health
 */
export async function checkQueues(queues: string[]): Promise<HealthCheckResult> {
  try {
    const redis = getRedisClient();
    const queueMetrics: QueueMetrics[] = [];

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
export async function checkWorkers(): Promise<HealthCheckResult> {
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
