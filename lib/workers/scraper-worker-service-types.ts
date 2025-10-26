import { Worker } from 'bullmq';

/**
 * Configuration options for the ScraperWorkerService
 */
export interface WorkerServiceOptions {
  concurrency?: number;
  workerCount?: number;
  queueName?: string;
  enableHealthMonitoring?: boolean;
  memoryThreshold?: number;
  maxJobDuration?: number;
}

/**
 * Memory usage statistics
 */
export interface MemoryUsage {
  used: number;
  total: number;
  percentUsed: number;
}

/**
 * Health status of the worker service
 */
export interface HealthStatus {
  healthy: boolean;
  totalWorkers: number;
  activeWorkers: number;
  memoryUsage: MemoryUsage;
  redisConnected: boolean;
  uptime: number;
}

/**
 * Worker event data types
 */
export interface WorkerEventData {
  workerReady: string;
  workerActive: { workerId: string; jobId: string | undefined };
  workerCompleted: { workerId: string; jobId: string | undefined; result: any };
  workerFailed: { workerId: string; jobId: string | undefined; error: string };
  workerError: { workerId: string; error: string };
  workerStalled: { workerId: string; jobId: string };
  workerClosed: string;
  started: void;
  shuttingDown: string;
  shutdown: void;
  forceShutdown: void;
  highMemoryUsage: MemoryUsage;
  healthUpdate: HealthStatus;
}

/**
 * Redis connection configuration
 */
export interface RedisConnectionConfig {
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

/**
 * Worker registry entry
 */
export interface WorkerRegistryEntry {
  worker: Worker;
  workerId: string;
  createdAt: Date;
}

/**
 * Crawl monitoring state
 */
export interface CrawlMonitoringState {
  lastProgress: number;
  pagesScraped: number;
  intervalId: NodeJS.Timeout;
  timeoutId: NodeJS.Timeout;
}
