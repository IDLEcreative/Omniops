import type { Alert } from './scrape-monitor';

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
