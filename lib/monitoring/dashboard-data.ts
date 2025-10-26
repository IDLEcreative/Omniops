import { logger } from '../logger';
import { getDataCollector } from './dashboard-data-collectors';
import { DashboardDataDefaults } from './dashboard-data-formatters';
import type { DashboardData } from './dashboard-data-types';

/**
 * Main class for aggregating and formatting dashboard data
 */
export class DashboardDataAggregator {
  private collector = getDataCollector();

  /**
   * Get complete dashboard data
   */
  async getDashboardData(): Promise<DashboardData> {
    try {
      logger.debug('Starting dashboard data aggregation');

      const [systemHealth, queueData, workerData, performanceData, activityData, statsData] =
        await Promise.allSettled([
          this.collector.getSystemOverview(),
          this.collector.getQueueData(),
          this.collector.getWorkerData(),
          this.collector.getPerformanceData(),
          this.collector.getRecentActivity(),
          this.collector.getStatistics(),
        ]);

      const dashboard: DashboardData = {
        overview: this.extractResult(systemHealth, DashboardDataDefaults.getDefaultOverview()),
        queue: this.extractResult(queueData, DashboardDataDefaults.getDefaultQueue()),
        workers: this.extractResult(workerData, DashboardDataDefaults.getDefaultWorkers()),
        performance: this.extractResult(performanceData, DashboardDataDefaults.getDefaultPerformance()),
        recentActivity: this.extractResult(activityData, DashboardDataDefaults.getDefaultActivity()),
        statistics: this.extractResult(statsData, DashboardDataDefaults.getDefaultStatistics()),
      };

      logger.debug('Dashboard data aggregation completed successfully');
      return dashboard;
    } catch (error) {
      logger.error('Error aggregating dashboard data:', error);
      return DashboardDataDefaults.getEmptyDashboardData();
    }
  }

  /**
   * Extract result from Promise.allSettled
   */
  private extractResult<T>(settledResult: PromiseSettledResult<T>, defaultValue: T): T {
    if (settledResult.status === 'fulfilled') {
      return settledResult.value;
    } else {
      logger.warn('Promise rejected:', settledResult.reason);
      return defaultValue;
    }
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

// Re-export types and utilities
export type {
  DashboardData,
  WorkerInfo,
  JobActivity,
  DayStats,
  PeriodStats
} from './dashboard-data-types';

export { PerformanceCalculator } from './dashboard-data-formatters';
