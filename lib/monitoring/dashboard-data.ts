import { getMonitor, SystemHealth, SystemMetrics, Alert } from './scrape-monitor';
import { getQueueManager } from '../queue/scrape-queue';
import { scrapeJobManager } from '../scrape-job-manager';
import { logger } from '../logger';

/**
 * Dashboard-specific data structures for the monitoring interface
 */
export interface DashboardData {
  overview: {
    systemStatus: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    lastUpdated: string;
  };
  queue: {
    activeJobs: number;
    waitingJobs: number;
    failedJobs: number;
    completedJobs: number;
    totalJobs: number;
    throughput: number; // jobs per minute
    avgProcessingTime: number; // in milliseconds
  };
  workers: {
    totalWorkers: number;
    activeWorkers: number;
    idleWorkers: number;
    failedWorkers: number;
    workerDetails: WorkerInfo[];
  };
  performance: {
    successRate: number; // percentage
    avgResponseTime: number; // milliseconds
    memoryUsage: number; // percentage
    redisStatus: 'connected' | 'disconnected' | 'degraded';
  };
  recentActivity: {
    completedJobs: JobActivity[];
    failedJobs: JobActivity[];
    alerts: Alert[];
  };
  statistics: {
    today: DayStats;
    yesterday: DayStats;
    last7Days: PeriodStats;
    last30Days: PeriodStats;
  };
}

export interface WorkerInfo {
  id: string;
  status: 'active' | 'idle' | 'failed' | 'unknown';
  currentJob?: string;
  processedJobs: number;
  errors: number;
  uptime: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface JobActivity {
  id: string;
  type: 'single-page' | 'full-crawl' | 'refresh';
  url: string;
  status: 'completed' | 'failed';
  duration: number;
  timestamp: string;
  error?: string;
}

export interface DayStats {
  jobsProcessed: number;
  jobsSucceeded: number;
  jobsFailed: number;
  avgProcessingTime: number;
  peakQueueDepth: number;
  successRate: number;
}

export interface PeriodStats {
  totalJobs: number;
  successRate: number;
  avgDailyJobs: number;
  peakDay: string;
  peakDayJobs: number;
}

/**
 * Main class for aggregating and formatting dashboard data
 */
export class DashboardDataAggregator {
  private monitor = getMonitor();
  private queueManager = getQueueManager();

  /**
   * Get complete dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      logger.debug('Starting dashboard data aggregation');

      const [systemHealth, queueData, workerData, performanceData, activityData, statsData] = 
        await Promise.allSettled([
          this.getSystemOverview(),
          this.getQueueData(),
          this.getWorkerData(),
          this.getPerformanceData(),
          this.getRecentActivity(),
          this.getStatistics(),
        ]);

      const dashboard: DashboardData = {
        overview: this.extractResult(systemHealth, this.getDefaultOverview()),
        queue: this.extractResult(queueData, this.getDefaultQueue()),
        workers: this.extractResult(workerData, this.getDefaultWorkers()),
        performance: this.extractResult(performanceData, this.getDefaultPerformance()),
        recentActivity: this.extractResult(activityData, this.getDefaultActivity()),
        statistics: this.extractResult(statsData, this.getDefaultStatistics()),
      };

      logger.debug('Dashboard data aggregation completed successfully');
      return dashboard;
    } catch (error) {
      logger.error('Error aggregating dashboard data:', error);
      return this.getEmptyDashboardData();
    }
  }

  /**
   * Get system overview information
   */
  private async getSystemOverview(): Promise<DashboardData['overview']> {
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
  private async getQueueData(): Promise<DashboardData['queue']> {
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
  private async getWorkerData(): Promise<DashboardData['workers']> {
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
  private async getPerformanceData(): Promise<DashboardData['performance']> {
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
  private async getRecentActivity(): Promise<DashboardData['recentActivity']> {
    const alerts = this.monitor.getActiveAlerts();
    
    // Get recent job activity from scrape job manager
    const completedJobs: JobActivity[] = [];
    const failedJobs: JobActivity[] = [];

    try {
      // This would need to be implemented in the scrape job manager
      // For now, we'll return empty arrays
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
  private async getStatistics(): Promise<DashboardData['statistics']> {
    try {
      // Get basic queue stats since scrape job manager may not be available
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
      return this.getDefaultStatistics();
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

  // Helper methods

  private extractResult<T>(settledResult: PromiseSettledResult<T>, defaultValue: T): T {
    if (settledResult.status === 'fulfilled') {
      return settledResult.value;
    } else {
      logger.warn('Promise rejected:', settledResult.reason);
      return defaultValue;
    }
  }

  private getEmptyDashboardData(): DashboardData {
    return {
      overview: this.getDefaultOverview(),
      queue: this.getDefaultQueue(),
      workers: this.getDefaultWorkers(),
      performance: this.getDefaultPerformance(),
      recentActivity: this.getDefaultActivity(),
      statistics: this.getDefaultStatistics(),
    };
  }

  private getDefaultOverview(): DashboardData['overview'] {
    return {
      systemStatus: 'unhealthy',
      uptime: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  private getDefaultQueue(): DashboardData['queue'] {
    return {
      activeJobs: 0,
      waitingJobs: 0,
      failedJobs: 0,
      completedJobs: 0,
      totalJobs: 0,
      throughput: 0,
      avgProcessingTime: 0,
    };
  }

  private getDefaultWorkers(): DashboardData['workers'] {
    return {
      totalWorkers: 0,
      activeWorkers: 0,
      idleWorkers: 0,
      failedWorkers: 0,
      workerDetails: [],
    };
  }

  private getDefaultPerformance(): DashboardData['performance'] {
    return {
      successRate: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      redisStatus: 'disconnected',
    };
  }

  private getDefaultActivity(): DashboardData['recentActivity'] {
    return {
      completedJobs: [],
      failedJobs: [],
      alerts: [],
    };
  }

  private getDefaultStatistics(): DashboardData['statistics'] {
    const emptyDayStats: DayStats = {
      jobsProcessed: 0,
      jobsSucceeded: 0,
      jobsFailed: 0,
      avgProcessingTime: 0,
      peakQueueDepth: 0,
      successRate: 0,
    };

    const emptyPeriodStats: PeriodStats = {
      totalJobs: 0,
      successRate: 0,
      avgDailyJobs: 0,
      peakDay: new Date().toISOString().split('T')[0] || '',
      peakDayJobs: 0,
    };

    return {
      today: emptyDayStats,
      yesterday: emptyDayStats,
      last7Days: emptyPeriodStats,
      last30Days: emptyPeriodStats,
    };
  }
}

/**
 * Singleton instance for dashboard data aggregation
 */
let dashboardAggregator: DashboardDataAggregator | null = null;

/**
 * Get the singleton dashboard data aggregator
 */
export function getDashboardAggregator(): DashboardDataAggregator {
  if (!dashboardAggregator) {
    dashboardAggregator = new DashboardDataAggregator();
  }
  return dashboardAggregator;
}

/**
 * Convenience function to get dashboard data
 */
export async function getDashboardData(): Promise<DashboardData> {
  const aggregator = getDashboardAggregator();
  return await aggregator.getDashboardData();
}

/**
 * Performance metrics calculation utilities
 */
export class PerformanceCalculator {
  /**
   * Calculate success rate percentage
   */
  static calculateSuccessRate(completed: number, failed: number): number {
    const total = completed + failed;
    if (total === 0) return 100;
    return Math.round((completed / total) * 10000) / 100;
  }

  /**
   * Calculate throughput (jobs per minute)
   */
  static calculateThroughput(jobsCompleted: number, timeWindowMs: number): number {
    if (timeWindowMs === 0) return 0;
    const timeWindowMin = timeWindowMs / (1000 * 60);
    return Math.round((jobsCompleted / timeWindowMin) * 100) / 100;
  }

  /**
   * Format uptime as human-readable string
   */
  static formatUptime(uptimeMs: number): string {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Format duration in milliseconds as human-readable string
   */
  static formatDuration(durationMs: number): string {
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${Math.round(durationMs / 100) / 10}s`;
    if (durationMs < 3600000) return `${Math.round(durationMs / 6000) / 10}min`;
    return `${Math.round(durationMs / 360000) / 10}h`;
  }

  /**
   * Get status color for UI components
   */
  static getStatusColor(status: 'healthy' | 'degraded' | 'unhealthy'): string {
    switch (status) {
      case 'healthy': return 'green';
      case 'degraded': return 'yellow';
      case 'unhealthy': return 'red';
      default: return 'gray';
    }
  }
}