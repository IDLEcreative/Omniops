/**
 * Type definitions for scrape queue system
 */

/**
 * Job data structure for scraping operations
 */
export interface ScrapeJobData {
  url: string;
  organizationId: string;
  domainId?: string;
  maxPages?: number;
  includePaths?: string[];
  excludePaths?: string[];
  turboMode?: boolean;
  ownSite?: boolean;
  useNewConfig?: boolean;
  newConfigPreset?: string;
  aiOptimization?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

/**
 * Job result structure
 */
export interface ScrapeJobResult {
  jobId: string;
  status: 'completed' | 'failed' | 'partial';
  pagesScraped: number;
  totalPages: number;
  errors: string[];
  startedAt: string;
  completedAt: string;
  duration: number;
  data?: any[];
  metadata?: Record<string, any>;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  totalJobs: number;
}

/**
 * Options for adding jobs to the queue
 */
export interface AddJobOptions {
  priority?: number;
  delay?: number;
  jobId?: string;
  deduplicate?: boolean;
}

/**
 * Options for cleaning up old jobs
 */
export interface CleanupOptions {
  grace?: number;
  status?: 'completed' | 'failed';
  limit?: number;
}

/**
 * Deduplication statistics
 */
export interface DeduplicationStats {
  totalKeys: number;
  memoryUsage: string;
}

/**
 * Queue metrics for monitoring
 */
export interface QueueMetrics {
  queue: QueueStats;
  deduplication: DeduplicationStats;
  redis: {
    connected: boolean;
    memory: string;
  };
}

/**
 * Redis configuration for BullMQ
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryStrategy: (times: number) => number;
  enableReadyCheck: boolean;
  maxRetriesPerRequest: number;
  connectTimeout: number;
  lazyConnect: boolean;
}
