import { getMonitor, Alert } from './scrape-monitor';
import { getQueueManager } from '../queue/scrape-queue';
import { logger } from '../logger';
import type {
  DashboardData,
  WorkerInfo,
  JobActivity,
  DayStats
} from './dashboard-data-types';

/**
 * Data collection functions for dashboard metrics
 */
export class DashboardDataCollector {
  private monitor = getMonitor();
  private queueManager = getQueueManager();

  /**
   * Get system overview information
   */
  async getSystemOverview(): Promise<DashboardData['overview']> {
    const health = await this.monitor.getSystemHealth();

    return {
      systemStatus: health.status,
      uptime: health.uptime,
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Get queue-related data
   */
  async getQueueData(): Promise<DashboardData['queue']> {
    try {
      const metrics = await this.monitor.getMetrics();
      const queueMetrics = metrics.queue;

      const totalJobs = queueMetrics.waiting + queueMetrics.active +
                       queueMetrics.completed + queueMetrics.failed;

      return {
        activeJobs: queueMetrics.active,
        waitingJobs: queueMetrics.waiting,
        failedJobs: queueMetrics.failed,
        completedJobs: queueMetrics.completed,
        totalJobs,
        throughput: queueMetrics.throughput,
        avgProcessingTime: queueMetrics.avgProcessingTime,
      };
    } catch (error) {
      logger.warn('Could not fetch queue metrics from monitor, falling back to direct queue stats:', error as Record<string, any>);
      // Fallback to direct queue stats
      const queueStats = await this.queueManager.getQueueStats();

      const totalJobs = queueStats.waiting + queueStats.active +
                       queueStats.completed + queueStats.failed;

      return {
        activeJobs: queueStats.active,
        waitingJobs: queueStats.waiting,
        failedJobs: queueStats.failed,
        completedJobs: queueStats.completed,
        totalJobs,
        throughput: 0, // Not available from basic stats
        avgProcessingTime: 0, // Not available from basic stats
      };
    }
  }

  /**
   * Get worker information
   */
  async getWorkerData(): Promise<DashboardData['workers']> {
    try {
      const workerMetrics = await this.monitor.getWorkerStatus();
      const workers: WorkerInfo[] = [];

      // Transform worker metrics into dashboard format
      for (const worker of workerMetrics) {
        workers.push({
          id: worker.id || `worker-${workers.length}`,
          status: worker.isRunning ? 'active' : 'failed',
          currentJob: worker.currentJobId,
          processedJobs: worker.jobsProcessed || 0,
          errors: worker.errors || 0,
          uptime: worker.uptime || 0,
          memoryUsage: worker.memoryUsage,
          cpuUsage: worker.cpuUsage,
        });
      }

      const activeWorkers = workers.filter(w => w.status === 'active').length;
      const failedWorkers = workers.filter(w => w.status === 'failed').length;

      return {
        totalWorkers: workers.length,
        activeWorkers,
        idleWorkers: Math.max(0, workers.length - activeWorkers - failedWorkers),
        failedWorkers,
        workerDetails: workers,
      };
    } catch (error) {
      logger.warn('Could not fetch worker data:', error as Record<string, any>);
      // Return default worker data with basic queue metrics
      const metrics = await this.monitor.getMetrics();
      return {
        totalWorkers: metrics.workers.total,
        activeWorkers: metrics.workers.active,
        idleWorkers: metrics.workers.idle,
        failedWorkers: metrics.workers.failed,
        workerDetails: [],
      };
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceData(): Promise<DashboardData['performance']> {
    const metrics = await this.monitor.getMetrics();

    // Calculate success rate
    const totalJobs = metrics.queue.completed + metrics.queue.failed;
    const successRate = totalJobs > 0 ?
      (metrics.queue.completed / totalJobs) * 100 : 100;

    return {
      successRate: Math.round(successRate * 100) / 100,
      avgResponseTime: metrics.queue.avgProcessingTime,
      memoryUsage: Math.round(metrics.memory.percentUsed * 10000) / 100,
      redisStatus: metrics.redis.connected ? 'connected' : 'disconnected',
    };
  }

  /**
   * Get recent activity data
   */
  async getRecentActivity(): Promise<DashboardData['recentActivity']> {
    const alerts = this.monitor.getActiveAlerts();

    // Get recent job activity
    const completedJobs: JobActivity[] = [];
    const failedJobs: JobActivity[] = [];

    try {
      const recentJobs = await this.getRecentJobs();

      for (const job of recentJobs) {
        const activity: JobActivity = {
          id: job.id,
          type: job.type as JobActivity['type'],
          url: job.url,
          status: job.status as JobActivity['status'],
          duration: job.duration,
          timestamp: job.completedAt || job.createdAt,
          error: job.error,
        };

        if (job.status === 'completed') {
          completedJobs.push(activity);
        } else if (job.status === 'failed') {
          failedJobs.push(activity);
        }
      }
    } catch (error) {
      logger.warn('Could not fetch recent job activity:', error as Record<string, any>);
    }

    return {
      completedJobs: completedJobs.slice(0, 10), // Last 10 completed
      failedJobs: failedJobs.slice(0, 10), // Last 10 failed
      alerts: alerts.slice(0, 5), // Last 5 active alerts
    };
  }

  /**
   * Get statistical data
   */
  async getStatistics(): Promise<DashboardData['statistics']> {
    try {
      // Get basic queue stats
      const queueStats = await this.queueManager.getQueueStats();

      // Create simplified stats from queue data
      const today: DayStats = {
        jobsProcessed: queueStats.completed + queueStats.failed,
        jobsSucceeded: queueStats.completed,
        jobsFailed: queueStats.failed,
        avgProcessingTime: 0, // Would need to calculate from job data
        peakQueueDepth: queueStats.active + queueStats.waiting,
        successRate: (queueStats.completed + queueStats.failed) > 0 ?
          (queueStats.completed / (queueStats.completed + queueStats.failed)) * 100 : 100,
      };

      return {
        today,
        yesterday: { ...today, jobsProcessed: 0 }, // Placeholder
        last7Days: {
          totalJobs: today.jobsProcessed,
          successRate: today.successRate,
          avgDailyJobs: today.jobsProcessed,
          peakDay: new Date().toISOString().split('T')[0] || '',
          peakDayJobs: today.jobsProcessed,
        },
        last30Days: {
          totalJobs: today.jobsProcessed,
          successRate: today.successRate,
          avgDailyJobs: today.jobsProcessed / 30,
          peakDay: new Date().toISOString().split('T')[0] || '',
          peakDayJobs: today.jobsProcessed,
        },
      };
    } catch (error) {
      logger.error('Error getting statistics:', error);
      throw error;
    }
  }

  /**
   * Get recent jobs (placeholder - would need implementation in scrape job manager)
   */
  private async getRecentJobs(): Promise<any[]> {
    // This would need to be implemented in the scrape job manager
    // For now, return empty array
    return [];
  }
}

/**
 * Singleton instance for data collection
 */
let dataCollector: DashboardDataCollector | null = null;

/**
 * Get the singleton data collector
 */
export function getDataCollector(): DashboardDataCollector {
  if (!dataCollector) {
    dataCollector = new DashboardDataCollector();
  }
  return dataCollector;
}
