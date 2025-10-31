/**
 * Queue Types and Interfaces
 * Defines job types, priorities, and data structures for the queue system
 */

/**
 * Job priority levels
 * Higher priority jobs are processed first
 */
export enum JobPriority {
  CRITICAL = 10,
  HIGH = 5,
  NORMAL = 0,
  LOW = -5,
  DEFERRED = -10,
}

/**
 * Job types supported by the queue system
 */
export type JobType = 'single-page' | 'full-crawl' | 'refresh' | 'batch' | 'scheduled';

/**
 * Job status in the queue lifecycle
 */
export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused' | 'stalled';

/**
 * Base job data structure
 * All job types extend this interface
 */
export interface BaseJobData {
  type: JobType;
  customerId: string;
  priority?: JobPriority;
  metadata?: Record<string, any>;
  createdAt?: string;
  scheduledAt?: string;
}

/**
 * Single page scraping job
 */
export interface SinglePageJobData extends BaseJobData {
  type: 'single-page';
  url: string;
  turboMode?: boolean;
  extractStructuredData?: boolean;
}

/**
 * Full website crawl job
 */
export interface FullCrawlJobData extends BaseJobData {
  type: 'full-crawl';
  url: string;
  maxPages: number;
  depth?: number;
  includePaths?: string[];
  excludePaths?: string[];
  respectRobotsTxt?: boolean;
  delay?: number;
}

/**
 * Refresh existing pages job
 */
export interface RefreshJobData extends BaseJobData {
  type: 'refresh';
  urls: string[];
  forceRefresh?: boolean;
  compareContent?: boolean;
}

/**
 * Union type for all job data types
 */
export type JobData = SinglePageJobData | FullCrawlJobData | RefreshJobData;

/**
 * Queue manager configuration
 */
export interface QueueManagerConfig {
  queueName?: string;
  redisUrl?: string;
  maxConcurrency?: number;
  defaultJobOptions?: {
    attempts?: number;
    backoffDelay?: number;
    timeout?: number;
  };
  enableMetrics?: boolean;
}
