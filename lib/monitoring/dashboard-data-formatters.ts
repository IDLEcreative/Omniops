import type { DashboardData, DayStats, PeriodStats } from './dashboard-data-types';

/**
 * Default data providers for dashboard
 */
export class DashboardDataDefaults {
  static getDefaultOverview(): DashboardData['overview'] {
    return {
      systemStatus: 'unhealthy',
      uptime: 0,
      lastUpdated: new Date().toISOString(),
    };
  }

  static getDefaultQueue(): DashboardData['queue'] {
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

  static getDefaultWorkers(): DashboardData['workers'] {
    return {
      totalWorkers: 0,
      activeWorkers: 0,
      idleWorkers: 0,
      failedWorkers: 0,
      workerDetails: [],
    };
  }

  static getDefaultPerformance(): DashboardData['performance'] {
    return {
      successRate: 0,
      avgResponseTime: 0,
      memoryUsage: 0,
      redisStatus: 'disconnected',
    };
  }

  static getDefaultActivity(): DashboardData['recentActivity'] {
    return {
      completedJobs: [],
      failedJobs: [],
      alerts: [],
    };
  }

  static getDefaultStatistics(): DashboardData['statistics'] {
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

  static getEmptyDashboardData(): DashboardData {
    return {
      overview: this.getDefaultOverview(),
      queue: this.getDefaultQueue(),
      workers: this.getDefaultWorkers(),
      performance: this.getDefaultPerformance(),
      recentActivity: this.getDefaultActivity(),
      statistics: this.getDefaultStatistics(),
    };
  }
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
