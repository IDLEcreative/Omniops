import { Worker, Job, WorkerOptions } from 'bullmq';
import { getRedisClient } from '../redis-unified';
import { JobData, JobType, JobPriority } from './queue-manager';
import { scrapePage, crawlWebsite, checkCrawlStatus } from '../scraper-api';
import { ScrapedPage } from '../scraper-api';

/**
 * Job processing result
 */
export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  pagesProcessed?: number;
  totalPages?: number;
  metadata?: Record<string, any>;
}

/**
 * Progress update structure
 */
export interface ProgressUpdate {
  percentage: number;
  message: string;
  pagesProcessed?: number;
  totalPages?: number;
  currentUrl?: string;
  errors?: number;
  metadata?: Record<string, any>;
}

/**
 * Job processor configuration
 */
export interface JobProcessorConfig {
  maxConcurrency: number;
  stalledInterval: number;
  maxStalledCount: number;
  retryProcessDelay: number;
  enableMetrics: boolean;
}

/**
 * Processing metrics
 */
export interface ProcessingMetrics {
  jobsProcessed: number;
  jobsFailed: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  lastProcessedAt?: Date;
  errorsByType: Record<string, number>;
}

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
      maxConcurrency: 5,
      stalledInterval: 30000, // 30 seconds
      maxStalledCount: 1,
      retryProcessDelay: 5000, // 5 seconds
      enableMetrics: true,
      ...config,
    };

    this.metrics = {
      jobsProcessed: 0,
      jobsFailed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      errorsByType: {},
    };

    const workerOptions: WorkerOptions = {
      connection: this.redis,
      concurrency: this.config.maxConcurrency,
      stalledInterval: this.config.stalledInterval,
      maxStalledCount: this.config.maxStalledCount,
      // retryProcessDelay is not available in WorkerOptions
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
        this.updateMetrics(job, result, true);
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
        this.updateMetrics(job, failResult, false);
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
   * Update processing metrics
   */
  private updateMetrics(job: Job, result: JobResult, success: boolean): void {
    if (success) {
      this.metrics.jobsProcessed++;
    } else {
      this.metrics.jobsFailed++;
      
      // Track errors by type
      const errorType = job.data.type || 'unknown';
      this.metrics.errorsByType[errorType] = 
        (this.metrics.errorsByType[errorType] || 0) + 1;
    }

    this.metrics.totalProcessingTime += result.duration;
    this.metrics.averageProcessingTime = 
      this.metrics.totalProcessingTime / 
      (this.metrics.jobsProcessed + this.metrics.jobsFailed);
    
    this.metrics.lastProcessedAt = new Date();
  }

  /**
   * Update job progress
   */
  private async updateProgress(
    job: Job,
    progressUpdate: ProgressUpdate
  ): Promise<void> {
    await job.updateProgress(progressUpdate);
    console.log(`Job ${job.id} progress: ${progressUpdate.percentage}% - ${progressUpdate.message}`);
  }

  /**
   * Process a single page scraping job
   */
  private async processSinglePageJob(
    job: Job<JobData>,
    jobData: JobData
  ): Promise<JobResult> {
    const startTime = Date.now();

    try {
      const singlePageData = jobData as any; // Type assertion
      await this.updateProgress(job, {
        percentage: 10,
        message: `Starting to scrape ${singlePageData.url}`,
        currentUrl: singlePageData.url,
      });

      // Scrape the page using the existing scraper-api
      const result = await scrapePage(singlePageData.url, singlePageData.config);

      await this.updateProgress(job, {
        percentage: 90,
        message: 'Processing scraped content',
        pagesProcessed: 1,
        totalPages: 1,
      });

      await this.updateProgress(job, {
        percentage: 100,
        message: 'Scraping completed successfully',
        pagesProcessed: 1,
        totalPages: 1,
      });

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
        pagesProcessed: 1,
        totalPages: 1,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.updateProgress(job, {
        percentage: 0,
        message: `Failed to scrape: ${errorMessage}`,
        errors: 1,
      });

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
        pagesProcessed: 0,
        totalPages: 1,
      };
    }
  }

  /**
   * Process a full crawl job
   */
  private async processFullCrawlJob(
    job: Job<JobData>,
    jobData: JobData
  ): Promise<JobResult> {
    const startTime = Date.now();

    try {
      await this.updateProgress(job, {
        percentage: 5,
        message: `Starting full crawl of ${jobData.url}`,
        currentUrl: jobData.url,
      });

      // Start the crawl using the existing scraper-api
      const crawlResult = await crawlWebsite(jobData.url, {
        ...jobData.config,
        onProgress: async (progress: any) => {
          // Update progress based on crawl progress
          const percentage = Math.min(95, Math.max(10, progress.percentage || 0));
          
          await this.updateProgress(job, {
            percentage,
            message: `Crawling: ${progress.completed}/${progress.total} pages`,
            pagesProcessed: progress.completed,
            totalPages: progress.total,
            currentUrl: progress.currentUrl,
            errors: progress.failed || 0,
          });
        },
      });

      // Monitor crawl status if needed
      if ((crawlResult as any).jobId) {
        let crawlStatus: any;
        do {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
          crawlStatus = await checkCrawlStatus((crawlResult as any).jobId);
          
          if (crawlStatus) {
            const percentage = Math.min(95, Math.max(10, crawlStatus.progress || 0));
            
            await this.updateProgress(job, {
              percentage,
              message: `Crawling: ${crawlStatus.completed}/${crawlStatus.total} pages`,
              pagesProcessed: crawlStatus.completed,
              totalPages: crawlStatus.total,
              errors: crawlStatus.failed || 0,
            });
          }
        } while (
          crawlStatus && 
          crawlStatus.status === 'processing' && 
          !this.isShuttingDown
        );
      }

      await this.updateProgress(job, {
        percentage: 100,
        message: 'Full crawl completed successfully',
        pagesProcessed: crawlResult.completed || 0,
        totalPages: crawlResult.total || 0,
      });

      return {
        success: true,
        data: crawlResult,
        duration: Date.now() - startTime,
        pagesProcessed: crawlResult.completed || 0,
        totalPages: crawlResult.total || 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.updateProgress(job, {
        percentage: 0,
        message: `Failed to crawl: ${errorMessage}`,
        errors: 1,
      });

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Process a refresh job
   */
  private async processRefreshJob(
    job: Job<JobData>,
    jobData: JobData
  ): Promise<JobResult> {
    const startTime = Date.now();

    const refreshData = jobData as any; // Type assertion
    try {
      await this.updateProgress(job, {
        percentage: 10,
        message: `Refreshing content for ${refreshData.urls?.[0] || 'urls'}`,
        currentUrl: refreshData.urls?.[0],
      });

      // For refresh jobs, we can use either single page or crawl depending on the config
      const config = {
        ...refreshData.config,
        forceRefresh: true, // Bypass cache
      };

      let result;
      if (refreshData.config?.fullRefresh && refreshData.urls?.[0]) {
        // Full refresh - crawl the website
        result = await crawlWebsite(refreshData.urls[0], config);
      } else if (refreshData.urls?.[0]) {
        // Single page refresh
        result = await scrapePage(refreshData.urls[0], config);
      }

      await this.updateProgress(job, {
        percentage: 100,
        message: 'Refresh completed successfully',
        pagesProcessed: 1,
        totalPages: 1,
      });

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
        pagesProcessed: 1,
        totalPages: 1,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.updateProgress(job, {
        percentage: 0,
        message: `Failed to refresh: ${errorMessage}`,
        errors: 1,
      });

      return {
        success: false,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Main job processing function
   */
  private async processJob(job: Job<JobData>): Promise<JobResult> {
    const { data: jobData } = job;
    
    console.log(`Processing job ${job.id} of type ${jobData.type} for URL: ${jobData.url}`);

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
          result = await this.processSinglePageJob(job, jobData);
          break;
          
        case 'full-crawl':
          result = await this.processFullCrawlJob(job, jobData);
          break;
          
        case 'refresh':
          result = await this.processRefreshJob(job, jobData);
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
    this.metrics = {
      jobsProcessed: 0,
      jobsFailed: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      errorsByType: {},
    };
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