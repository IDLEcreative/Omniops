/**
 * Queue system health checking
 */

import { getQueueManager } from '../queue-manager';
import { getJobProcessor } from '../job-processor';
import { QueueMonitor } from '../queue-utils';

/**
 * Health check function for the entire queue system
 */
export async function checkQueueSystemHealth(): Promise<{
  healthy: boolean;
  issues: string[];
  components: {
    queueManager: boolean;
    jobProcessor: boolean;
    redis: boolean;
    deduplication: boolean;
  };
}> {
  const issues: string[] = [];
  const components = {
    queueManager: false,
    jobProcessor: false,
    redis: false,
    deduplication: false,
  };

  try {
    // Test queue manager
    const queueManager = getQueueManager();
    await queueManager.getQueueStats();
    components.queueManager = true;
  } catch (error) {
    issues.push('Queue manager not accessible');
  }

  try {
    // Test job processor
    const jobProcessor = getJobProcessor();
    components.jobProcessor = jobProcessor.isRunning();
    if (!components.jobProcessor) {
      issues.push('Job processor not running');
    }
  } catch (error) {
    issues.push('Job processor not accessible');
  }

  try {
    // Test Redis connection indirectly through queue operations
    const health = await QueueMonitor.getQueueHealth();
    components.redis = health.redis.connected;
    if (!components.redis) {
      issues.push('Redis connection issues');
    }
  } catch (error) {
    issues.push('Cannot verify Redis connection');
  }

  try {
    // Test deduplication
    const queueManager = getQueueManager();
    await queueManager.getDeduplicationStats();
    components.deduplication = true;
  } catch (error) {
    issues.push('Deduplication system issues');
  }

  return {
    healthy: issues.length === 0,
    issues,
    components,
  };
}
