import { Worker, Job, WorkerOptions } from 'bullmq';
import { getRedisClient } from '../redis-unified';
import { JobData, JobPriority } from './queue-manager';
import {
  JobResult,
  JobProcessorConfig,
  ProcessingMetrics,
} from './job-processor-types';
import {
  updateMetrics,
  createInitialMetrics,
  getDefaultConfig,
} from './job-processor-utils';
import {
  processSinglePageJob,
  processFullCrawlJob,
  processRefreshJob,
} from './job-processor-handlers';

/**
 * Job Processor for BullMQ Queue System
 *
 * Features:
 * - Processes jobs from queue
 * - Calls scraper-api functions
 * - Updates progress in real-time
 * - Handles failures gracefully with exponential backoff
 * - Provides comprehensive error handling and logging
 * - Tracks processing metrics
 */
export class JobProcessor {
  private worker: Worker;
  private redis: any = getRedisClient(); // Using any for BullMQ compatibility with ResilientRedisClient
  private config: JobProcessorConfig;
  private metrics: ProcessingMetrics;
  private isShuttingDown = false;

  constructor(
    queueName: string = 'scraper-queue',
    config?: Partial<JobProcessorConfig>
  ) {
    this.config = {
      ...getDefaultConfig(),
      ...config,
    };

    this.metrics = createInitialMetrics();

    const workerOptions: WorkerOptions = {
      connection: this.redis,
      concurrency: this.config.maxConcurrency,
      stalledInterval: this.config.stalledInterval,
      maxStalledCount: this.config.maxStalledCount,
    };

    this.worker = new Worker(queueName, this.processJob.bind(this), workerOptions);

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for worker monitoring
   */
  private setupEventListeners(): void {
    this.worker.on('ready', () => {
      console.log('Job processor is ready');
    });

    this.worker.on('active', (job: Job) => {
      console.log(`Processing job ${job.id} of type ${job.data.type}`);
    });

    this.worker.on('completed', (job: Job, result: JobResult) => {
      console.log(`Job ${job.id} completed in ${result.duration}ms`);
      if (this.config.enableMetrics) {
        updateMetrics(this.metrics, job, result, true);
      }
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      console.error(`Job ${job?.id || 'unknown'} failed:`, err.message);
      if (this.config.enableMetrics && job) {
        const failResult: JobResult = {
          success: false,
          error: err.message,
          duration: Date.now() - (job.processedOn || job.timestamp),
        };
        updateMetrics(this.metrics, job, failResult, false);
      }
    });

    this.worker.on('stalled', (jobId: string) => {
      console.warn(`Job ${jobId} stalled`);
    });

    this.worker.on('error', (err: Error) => {
      console.error('Worker error:', err);
    });

    // Graceful shutdown handling
    process.on('SIGINT', () => this.gracefulShutdown());
    process.on('SIGTERM', () => this.gracefulShutdown());
  }

  /**
   * Main job processing function
   */
  private async processJob(job: Job<JobData>): Promise<JobResult> {
    const { data: jobData } = job;

    console.log(`Processing job ${job.id} of type ${jobData.type} for URL: ${(jobData as any).url || 'N/A'}`);

    // Add job metadata
    const startTime = Date.now();
    const metadata = {
      jobId: job.id,
      startTime,
      customerId: jobData.customerId,
      priority: job.opts.priority || JobPriority.NORMAL,
    };

    try {
      let result: JobResult;

      switch (jobData.type) {
        case 'single-page':
          result = await processSinglePageJob(job, jobData);
          break;

        case 'full-crawl':
          result = await processFullCrawlJob(job, jobData, () => this.isShuttingDown);
          break;

        case 'refresh':
          result = await processRefreshJob(job, jobData);
          break;

        default:
          throw new Error(`Unknown job type: ${(jobData as any).type}`);
      }

      // Add metadata to result
      result.metadata = { ...metadata, endTime: Date.now() };

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      console.error(`Job ${job.id} processing failed:`, error);

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
        metadata: { ...metadata, endTime: Date.now() },
      };
    }
  }

  /**
   * Get processing metrics
   */
  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset processing metrics
   */
  resetMetrics(): void {
    this.metrics = createInitialMetrics();
  }

  /**
   * Pause the worker
   */
  async pause(): Promise<void> {
    await this.worker.pause();
    console.log('Job processor paused');
  }

  /**
   * Resume the worker
   */
  async resume(): Promise<void> {
    await this.worker.resume();
    console.log('Job processor resumed');
  }

  /**
   * Get worker status
   */
  isRunning(): boolean {
    return this.worker.isRunning();
  }

  /**
   * Get worker name
   */
  getName(): string {
    return this.worker.name;
  }

  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    console.log('Initiating graceful shutdown of job processor...');

    try {
      // Close the worker gracefully
      await this.worker.close();
      console.log('Job processor shut down gracefully');
    } catch (error) {
      console.error('Error during graceful shutdown:', error);
    }
  }

  /**
   * Close the worker and cleanup resources
   */
  async close(): Promise<void> {
    await this.gracefulShutdown();
  }

  /**
   * Get the underlying BullMQ worker instance
   */
  getWorker(): Worker {
    return this.worker;
  }
}

// Singleton instance
let jobProcessor: JobProcessor | null = null;

/**
 * Get the singleton JobProcessor instance
 */
export function getJobProcessor(): JobProcessor {
  if (!jobProcessor) {
    jobProcessor = new JobProcessor();
  }
  return jobProcessor;
}

/**
 * Create a new JobProcessor instance with custom configuration
 */
export function createJobProcessor(
  queueName?: string,
  config?: Partial<JobProcessorConfig>
): JobProcessor {
  return new JobProcessor(queueName, config);
}

/**
 * Start processing jobs (convenience function)
 */
export function startJobProcessing(
  queueName?: string,
  config?: Partial<JobProcessorConfig>
): JobProcessor {
  const processor = new JobProcessor(queueName, config);
  console.log('Job processor started and ready to process jobs');
  return processor;
}

// Re-export types for convenience
export * from './job-processor-types';
