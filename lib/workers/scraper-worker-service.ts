#!/usr/bin/env node

import { Worker, Job } from 'bullmq';
import { scrapePage, crawlWebsite } from '../scraper-api';
import { ScrapeJobData, ScrapeJobResult, getQueueManager } from '../queue/scrape-queue';
import { logger } from '../logger';
import { getResilientRedisClient } from '../redis-enhanced';
import { EventEmitter } from 'events';
import * as os from 'os';

/**
 * Standalone worker service for processing scraping jobs
 * Handles memory management, retries, and cleanup
 */
export class ScraperWorkerService extends EventEmitter {
  private workers: Map<string, Worker> = new Map();
  private isShuttingDown = false;
  private gracefulShutdownTimeout = 30000; // 30 seconds
  private workerCount: number;
  private maxMemoryUsage = 0.85; // 85% of available memory
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private queueManager = getQueueManager();
  private redisClient = getResilientRedisClient();

  constructor(
    private workerOptions: {
      concurrency?: number;
      workerCount?: number;
      queueName?: string;
      enableHealthMonitoring?: boolean;
      memoryThreshold?: number;
      maxJobDuration?: number;
    } = {}
  ) {
    super();
    
    this.workerCount = workerOptions.workerCount || Math.max(1, Math.floor(os.cpus().length / 2));
    this.maxMemoryUsage = workerOptions.memoryThreshold || 0.85;
    
    // Bind methods to preserve 'this' context
    this.processJob = this.processJob.bind(this);
    this.handleShutdown = this.handleShutdown.bind(this);
    
    this.setupSignalHandlers();
    this.setupMemoryMonitoring();
  }

  /**
   * Initialize and start the worker service
   */
  async start(): Promise<void> {
    try {
      logger.info(`Starting ScraperWorkerService with ${this.workerCount} workers`);
      
      // Initialize queue manager
      await this.queueManager.initialize();
      
      // Create worker instances
      for (let i = 0; i < this.workerCount; i++) {
        const workerId = `worker-${i + 1}`;
        await this.createWorker(workerId);
      }
      
      // Start health monitoring if enabled
      if (this.workerOptions.enableHealthMonitoring) {
        await this.startHealthMonitoring();
      }
      
      logger.info('ScraperWorkerService started successfully');
      this.emit('started');
    } catch (error) {
      logger.error('Failed to start ScraperWorkerService:', error);
      throw error;
    }
  }

  /**
   * Create a new worker instance
   */
  private async createWorker(workerId: string): Promise<Worker> {
    const connection = this.createRedisConnection();
    
    const worker = new Worker(
      this.workerOptions.queueName || 'scrape-queue',
      this.processJob,
      {
        connection,
        concurrency: this.workerOptions.concurrency || 2,
        maxStalledCount: 1,
        stalledInterval: 30 * 1000,
        removeOnComplete: {
          count: 100,
          age: 24 * 3600 // 24 hours
        },
        removeOnFail: {
          count: 50,
          age: 7 * 24 * 3600 // 7 days  
        },
      }
    );

    // Set up worker event listeners
    this.setupWorkerEventListeners(worker, workerId);
    
    // Wait for worker to be ready
    await worker.waitUntilReady();
    
    this.workers.set(workerId, worker);
    logger.info(`Worker ${workerId} created and ready`);
    
    return worker;
  }

  /**
   * Process a scraping job
   */
  private async processJob(job: Job<ScrapeJobData, ScrapeJobResult>): Promise<ScrapeJobResult> {
    const startTime = Date.now();
    const { url, maxPages, organizationId } = job.data;
    
    try {
      logger.info(`Processing job ${job.id}: ${url}`);
      
      // Update job progress
      await job.updateProgress(10);
      
      let result: any;
      let pagesScraped = 0;
      
      // Check if this is a single page or multi-page job
      if (!maxPages || maxPages === 1) {
        // Single page scraping
        logger.info(`Single page scrape: ${url}`);
        result = await scrapePage(url, {
          turboMode: job.data.turboMode,
          ecommerceMode: true,
          useNewConfig: job.data.useNewConfig,
          configPreset: job.data.newConfigPreset as any,
          aiOptimization: typeof job.data.aiOptimization === 'boolean' 
            ? (job.data.aiOptimization ? {
                enabled: true,
                level: 'standard' as const,
                tokenTarget: 4000,
                preserveContent: [],
                cacheEnabled: true,
                precomputeMetadata: true,
                deduplicationEnabled: true
              } : undefined)
            : job.data.aiOptimization,
        });
        
        pagesScraped = 1;
        await job.updateProgress(80);
      } else {
        // Multi-page crawling
        logger.info(`Multi-page crawl: ${url} (max: ${maxPages} pages)`);
        const crawlJobId = await crawlWebsite(url, {
          maxPages,
          includePaths: job.data.includePaths,
          excludePaths: job.data.excludePaths,
          turboMode: job.data.turboMode,
          ownSite: job.data.ownSite,
          organizationId,
          useNewConfig: job.data.useNewConfig,
          newConfigPreset: job.data.newConfigPreset as any,
          aiOptimization: typeof job.data.aiOptimization === 'boolean' 
            ? (job.data.aiOptimization ? {
                enabled: true,
                level: 'standard' as const,
                tokenTarget: 4000,
                preserveContent: [],
                cacheEnabled: true,
                precomputeMetadata: true,
                deduplicationEnabled: true
              } : undefined)
            : job.data.aiOptimization,
        });
        
        // Monitor crawl progress
        pagesScraped = await this.monitorCrawlProgress(job, crawlJobId);
        result = { crawlJobId, pagesScraped };
      }
      
      await job.updateProgress(90);
      
      const duration = Date.now() - startTime;
      const jobResult: ScrapeJobResult = {
        jobId: job.id!,
        status: 'completed',
        pagesScraped,
        totalPages: maxPages || 1,
        errors: [],
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        duration,
        data: Array.isArray(result) ? result : [result],
        metadata: {
          ...job.data.metadata,
          memoryUsage: this.getMemoryUsage(),
          processingTime: duration,
        },
      };
      
      await job.updateProgress(100);
      logger.info(`Job ${job.id} completed in ${duration}ms`);
      
      return jobResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      logger.error(`Job ${job.id} failed after ${duration}ms:`, error);
      
      const jobResult: ScrapeJobResult = {
        jobId: job.id!,
        status: 'failed',
        pagesScraped: 0,
        totalPages: maxPages || 1,
        errors: [errorMessage],
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        duration,
        metadata: {
          ...job.data.metadata,
          error: errorMessage,
          memoryUsage: this.getMemoryUsage(),
        },
      };
      
      throw error; // Let BullMQ handle the failure
    }
  }

  /**
   * Monitor crawl progress for multi-page jobs
   */
  private async monitorCrawlProgress(job: Job, crawlJobId: string): Promise<number> {
    let lastProgress = 10;
    let pagesScraped = 0;
    
    const checkInterval = setInterval(async () => {
      try {
        // Import dynamically to avoid circular dependency
        const { checkCrawlStatus } = await import('../scraper-api');
        const status = await checkCrawlStatus(crawlJobId);
        
        if (status) {
          pagesScraped = status.completed || 0;
          const progress = Math.min(90, 10 + (pagesScraped / (status.total || 1)) * 70);
          
          if (progress > lastProgress) {
            await job.updateProgress(progress);
            lastProgress = progress;
          }
          
          // If crawl is completed or failed, stop monitoring
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(checkInterval);
          }
        }
      } catch (error) {
        logger.error(`Error monitoring crawl progress for job ${job.id}:`, error);
      }
    }, 5000); // Check every 5 seconds
    
    // Set a maximum monitoring time
    setTimeout(() => {
      clearInterval(checkInterval);
    }, this.workerOptions.maxJobDuration || 600000); // 10 minutes default
    
    return pagesScraped;
  }

  /**
   * Set up worker event listeners
   */
  private setupWorkerEventListeners(worker: Worker, workerId: string): void {
    worker.on('ready', () => {
      logger.info(`Worker ${workerId} is ready`);
      this.emit('workerReady', workerId);
    });

    worker.on('active', (job) => {
      logger.info(`Worker ${workerId} started job ${job.id}`);
      this.emit('workerActive', { workerId, jobId: job.id });
    });

    worker.on('completed', (job, result) => {
      logger.info(`Worker ${workerId} completed job ${job.id}`);
      this.emit('workerCompleted', { workerId, jobId: job.id, result });
    });

    worker.on('failed', (job, error) => {
      logger.error(`Worker ${workerId} failed job ${job?.id}: ${error.message}`);
      this.emit('workerFailed', { workerId, jobId: job?.id, error: error.message });
    });

    worker.on('error', (error) => {
      logger.error(`Worker ${workerId} error: ${error.message}`);
      this.emit('workerError', { workerId, error: error.message });
      
      // Attempt to restart worker if not shutting down
      if (!this.isShuttingDown) {
        this.restartWorker(workerId).catch(restartError => {
          logger.error(`Failed to restart worker ${workerId}:`, restartError);
        });
      }
    });

    worker.on('stalled', (jobId) => {
      logger.warn(`Worker ${workerId} job ${jobId} stalled`);
      this.emit('workerStalled', { workerId, jobId });
    });

    worker.on('closed', () => {
      logger.info(`Worker ${workerId} closed`);
      this.emit('workerClosed', workerId);
    });
  }

  /**
   * Restart a failed worker
   */
  private async restartWorker(workerId: string): Promise<void> {
    try {
      logger.info(`Restarting worker ${workerId}...`);
      
      // Close existing worker
      const existingWorker = this.workers.get(workerId);
      if (existingWorker) {
        await existingWorker.close(true);
        this.workers.delete(workerId);
      }
      
      // Create new worker
      await this.createWorker(workerId);
      
      logger.info(`Worker ${workerId} restarted successfully`);
    } catch (error) {
      logger.error(`Failed to restart worker ${workerId}:`, error);
      throw error;
    }
  }

  /**
   * Setup memory monitoring
   */
  private setupMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      
      if (memoryUsage.percentUsed > this.maxMemoryUsage) {
        logger.warn(`High memory usage detected: ${(memoryUsage.percentUsed * 100).toFixed(1)}%`);
        this.emit('highMemoryUsage', memoryUsage);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
          logger.info('Garbage collection triggered');
        }
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): { used: number; total: number; percentUsed: number } {
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    
    return {
      used: memoryUsage.heapUsed,
      total: totalMemory,
      percentUsed: memoryUsage.heapUsed / totalMemory,
    };
  }

  /**
   * Start health monitoring
   */
  private async startHealthMonitoring(): Promise<void> {
    const healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getHealthStatus();
        this.emit('healthUpdate', health);
        
        // Log health status periodically
        if (Math.random() < 0.1) { // Log 10% of the time to avoid spam
          logger.info(`Health check: ${health.activeWorkers}/${health.totalWorkers} workers active`);
        }
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    }, 30000); // Check every 30 seconds

    // Store interval for cleanup
    this.memoryCheckInterval = healthCheckInterval;
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    healthy: boolean;
    totalWorkers: number;
    activeWorkers: number;
    memoryUsage: { used: number; total: number; percentUsed: number };
    redisConnected: boolean;
    uptime: number;
  }> {
    const memoryUsage = this.getMemoryUsage();
    const redisConnected = await this.redisClient.ping();
    
    return {
      healthy: !this.isShuttingDown && this.workers.size > 0 && redisConnected,
      totalWorkers: this.workers.size,
      activeWorkers: this.workers.size, // Simplified - in production, check actual activity
      memoryUsage,
      redisConnected,
      uptime: process.uptime(),
    };
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  private setupSignalHandlers(): void {
    process.on('SIGINT', this.handleShutdown);
    process.on('SIGTERM', this.handleShutdown);
    process.on('SIGUSR2', this.handleShutdown); // Nodemon uses this
    
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception:', error);
      this.forceShutdown();
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection:', { promise, reason });
      this.forceShutdown();
    });
  }

  /**
   * Handle graceful shutdown
   */
  private async handleShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    
    logger.info(`Received ${signal}, starting graceful shutdown...`);
    this.isShuttingDown = true;
    this.emit('shuttingDown', signal);
    
    const shutdownTimeout = setTimeout(() => {
      logger.warn('Graceful shutdown timeout, forcing shutdown...');
      this.forceShutdown();
    }, this.gracefulShutdownTimeout);
    
    try {
      // Stop accepting new jobs and wait for current jobs to complete
      const workerPromises = Array.from(this.workers.entries()).map(([workerId, worker]) =>
        worker.close().catch(error => {
          logger.error(`Error closing worker ${workerId}:`, error);
        })
      );
      
      await Promise.allSettled(workerPromises);
      
      // Cleanup intervals
      if (this.memoryCheckInterval) {
        clearInterval(this.memoryCheckInterval);
      }
      
      // Shutdown queue manager
      await this.queueManager.shutdown();
      
      clearTimeout(shutdownTimeout);
      logger.info('Graceful shutdown completed');
      this.emit('shutdown');
      
      process.exit(0);
    } catch (error) {
      clearTimeout(shutdownTimeout);
      logger.error('Error during graceful shutdown:', error);
      this.forceShutdown();
    }
  }

  /**
   * Force shutdown (immediate)
   */
  private forceShutdown(): void {
    logger.warn('Forcing immediate shutdown...');
    
    // Force close all workers
    this.workers.forEach((worker, workerId) => {
      worker.close(true).catch(error => {
        logger.error(`Error force closing worker ${workerId}:`, error);
      });
    });
    
    // Force shutdown queue manager
    this.queueManager.forceShutdown().catch(error => {
      logger.error('Error during force shutdown:', error);
    });
    
    this.emit('forceShutdown');
    process.exit(1);
  }

  /**
   * Create Redis connection configuration
   */
  private createRedisConnection() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const url = new URL(redisUrl);
    
    return {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      password: url.password || undefined,
      db: 0,
      retryStrategy: (times: number) => Math.min(times * 100, 10000),
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      connectTimeout: 10000,
      lazyConnect: true,
    };
  }

  /**
   * Stop the worker service
   */
  async stop(): Promise<void> {
    await this.handleShutdown('MANUAL_STOP');
  }
}

/**
 * Start the worker service as a standalone process
 */
async function startWorkerService(): Promise<void> {
  const workerService = new ScraperWorkerService({
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
    workerCount: parseInt(process.env.WORKER_COUNT || String(Math.max(1, Math.floor(os.cpus().length / 2)))),
    queueName: process.env.QUEUE_NAME || 'scrape-queue',
    enableHealthMonitoring: process.env.ENABLE_HEALTH_MONITORING !== 'false',
    memoryThreshold: parseFloat(process.env.MEMORY_THRESHOLD || '0.85'),
    maxJobDuration: parseInt(process.env.MAX_JOB_DURATION || '600000'), // 10 minutes
  });

  // Set up event listeners for logging
  workerService.on('started', () => {
    logger.info('ScraperWorkerService started successfully');
  });

  workerService.on('workerCompleted', ({ workerId, jobId }) => {
    logger.info(`Worker ${workerId} completed job ${jobId}`);
  });

  workerService.on('workerFailed', ({ workerId, jobId, error }) => {
    logger.error(`Worker ${workerId} failed job ${jobId}: ${error}`);
  });

  workerService.on('highMemoryUsage', (memoryUsage) => {
    logger.warn(`High memory usage: ${(memoryUsage.percentUsed * 100).toFixed(1)}%`);
  });

  workerService.on('healthUpdate', (health) => {
    // Log health updates less frequently to avoid spam
    if (Math.random() < 0.05) { // 5% chance
      logger.info(`Health: ${health.activeWorkers}/${health.totalWorkers} workers, memory: ${(health.memoryUsage.percentUsed * 100).toFixed(1)}%`);
    }
  });

  try {
    await workerService.start();
    logger.info('Worker service is running. Press Ctrl+C to stop.');
  } catch (error) {
    logger.error('Failed to start worker service:', error);
    process.exit(1);
  }
}

// If this script is run directly, start the worker service
if (require.main === module) {
  startWorkerService().catch(error => {
    logger.error('Fatal error starting worker service:', error);
    process.exit(1);
  });
}

export { startWorkerService };
export default ScraperWorkerService;