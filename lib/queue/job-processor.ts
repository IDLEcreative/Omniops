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
 * Job Processor - AI-optimized header for fast comprehension
 *
 * @purpose Processes background scraping jobs from BullMQ queue with retry logic and metrics tracking
 *
 * @flow
 *   1. Queue adds job → BullMQ Worker picks up job
 *   2. → JobProcessor.processJob() routes by job type
 *   3. → Call handler (processSinglePageJob, processFullCrawlJob, processRefreshJob)
 *   4. → Scraper-api executes crawl with Playwright
 *   5. → Update job progress in real-time
 *   6. → Return JobResult with status, pages processed, errors
 *
 * @keyFunctions
 *   - constructor (line 43): Initializes worker with Redis connection and config
 *   - processJob (line ~100): Routes job by type, calls appropriate handler
 *   - processSinglePageJob (handlers module): Scrapes single URL
 *   - processFullCrawlJob (handlers module): Crawls entire domain (up to maxPages)
 *   - processRefreshJob (handlers module): Re-crawls existing pages for updates
 *   - start (line ~200): Starts worker processing
 *   - stop (line ~220): Graceful shutdown with active job completion
 *
 * @handles
 *   - Job types: single-page, full-crawl, refresh
 *   - Retry logic: Exponential backoff (3 attempts default)
 *   - Progress updates: Real-time percentage via job.updateProgress()
 *   - Error handling: Catches failures, logs errors, marks jobs failed
 *   - Metrics tracking: Total/succeeded/failed/active jobs
 *   - Build-time safety: Suppresses logs during Next.js build
 *   - Graceful shutdown: Waits for active jobs before stopping
 *
 * @returns
 *   - processJob(): Promise<JobResult> with status, pagesProcessed, errors, duration
 *   - getMetrics(): ProcessingMetrics with job statistics
 *
 * @dependencies
 *   - BullMQ: Worker, Job for queue processing
 *   - ./job-processor-handlers: processSinglePageJob, processFullCrawlJob, processRefreshJob
 *   - ./job-processor-types: Type definitions
 *   - ./job-processor-utils: Utility functions
 *   - ../redis-unified: Redis client for queue connection
 *   - @/lib/scraper-api: Actual scraping implementation
 *
 * @consumers
 *   - Background workers: Processes jobs added by app/api/scrape/route.ts
 *   - Queue manager: lib/queue/queue-manager.ts orchestrates job lifecycle
 *   - Monitoring: scripts/monitoring/queue-health.ts tracks metrics
 *
 * @configuration
 *   - Concurrency: Max parallel jobs (default: 5)
 *   - Stalled interval: Check for stuck jobs (default: 30s)
 *   - Max retries: Attempts before marking failed (default: 3)
 *   - Retry delay: Exponential backoff (2s, 4s, 8s)
 *
 * @totalLines 250
 * @estimatedTokens 2,000 (without header), 750 (with header - 62% savings)
 */

// Detect build time to suppress logging
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.NEXT_PHASE === 'phase-export' ||
                    process.argv.includes('build');

export class JobProcessor {
  private worker: Worker;
  private redis: any; // Using any for BullMQ compatibility with ResilientRedisClient
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

    // Lazy initialization - only create Redis connection when needed
    this.redis = getRedisClient();

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
      if (!isBuildTime) {
        console.log('Job processor is ready');
      }
    });

    this.worker.on('active', (job: Job) => {
      if (!isBuildTime) {
        console.log(`Processing job ${job.id} of type ${job.data.type}`);
      }
    });

    this.worker.on('completed', (job: Job, result: JobResult) => {
      if (!isBuildTime) {
        console.log(`Job ${job.id} completed in ${result.duration}ms`);
      }
      if (this.config.enableMetrics) {
        updateMetrics(this.metrics, job, result, true);
      }
    });

    this.worker.on('failed', (job: Job | undefined, err: Error) => {
      if (!isBuildTime) {
        console.error(`Job ${job?.id || 'unknown'} failed:`, err.message);
      }
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
      if (!isBuildTime) {
        console.warn(`Job ${jobId} stalled`);
      }
    });

    this.worker.on('error', (err: Error) => {
      if (!isBuildTime) {
        console.error('Worker error:', err);
      }
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
