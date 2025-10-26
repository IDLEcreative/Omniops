#!/usr/bin/env node

import { Worker, Job } from 'bullmq';
import { ScrapeJobData, ScrapeJobResult, getQueueManager } from '../queue/scrape-queue';
import { logger } from '../logger';
import { getResilientRedisClient } from '../redis-enhanced';
import { EventEmitter } from 'events';
import * as os from 'os';
import { WorkerServiceOptions, HealthStatus } from './scraper-worker-service-types';
import {
  setupWorkerEventListeners,
  setupSignalHandlers,
  setupMemoryMonitoring,
  startHealthMonitoring,
} from './scraper-worker-service-handlers';
import { processJob } from './scraper-worker-service-executor';
import {
  getMemoryUsage,
  createRedisConnection,
  parseEnvInt,
  parseEnvFloat,
  calculateDefaultWorkerCount,
} from './scraper-worker-service-utils';
import {
  shutdownWorkers,
  forceShutdownWorkers,
  restartWorker,
} from './scraper-worker-service-lifecycle';

/**
 * Standalone worker service for processing scraping jobs
 * Handles memory management, retries, and cleanup
 */
export class ScraperWorkerService extends EventEmitter {
  private workers: Map<string, Worker> = new Map();
  private isShuttingDown = false;
  private gracefulShutdownTimeout = 30000; // 30 seconds
  private workerCount: number;
  private maxMemoryUsage: number;
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private healthMonitorInterval: NodeJS.Timeout | null = null;
  private queueManager = getQueueManager();
  private redisClient = getResilientRedisClient();
  private maxJobDuration: number;

  constructor(private workerOptions: WorkerServiceOptions = {}) {
    super();

    this.workerCount = workerOptions.workerCount || calculateDefaultWorkerCount();
    this.maxMemoryUsage = workerOptions.memoryThreshold || 0.85;
    this.maxJobDuration = workerOptions.maxJobDuration || 600000;

    this.processJobWrapper = this.processJobWrapper.bind(this);
    this.handleShutdown = this.handleShutdown.bind(this);
    this.forceShutdown = this.forceShutdown.bind(this);

    this.setupHandlers();
  }

  private setupHandlers(): void {
    setupSignalHandlers(this.handleShutdown, this.forceShutdown);
    this.memoryCheckInterval = setupMemoryMonitoring(
      getMemoryUsage,
      this.maxMemoryUsage,
      this
    );
  }

  async start(): Promise<void> {
    try {
      logger.info(`Starting ScraperWorkerService with ${this.workerCount} workers`);

      await this.queueManager.initialize();

      for (let i = 0; i < this.workerCount; i++) {
        await this.createWorker(`worker-${i + 1}`);
      }

      if (this.workerOptions.enableHealthMonitoring) {
        this.healthMonitorInterval = startHealthMonitoring(
          this.getHealthStatus.bind(this),
          this
        );
      }

      logger.info('ScraperWorkerService started successfully');
      this.emit('started');
    } catch (error) {
      logger.error('Failed to start ScraperWorkerService:', error);
      throw error;
    }
  }

  private async createWorker(workerId: string): Promise<Worker> {
    const worker = new Worker(
      this.workerOptions.queueName || 'scrape-queue',
      this.processJobWrapper,
      {
        connection: createRedisConnection(),
        concurrency: this.workerOptions.concurrency || 2,
        maxStalledCount: 1,
        stalledInterval: 30 * 1000,
        removeOnComplete: { count: 100, age: 24 * 3600 },
        removeOnFail: { count: 50, age: 7 * 24 * 3600 },
      }
    );

    setupWorkerEventListeners(
      worker,
      workerId,
      this,
      (id) => restartWorker(id, this.workers, this.createWorker.bind(this)),
      () => this.isShuttingDown
    );

    await worker.waitUntilReady();
    this.workers.set(workerId, worker);
    logger.info(`Worker ${workerId} created and ready`);

    return worker;
  }

  private async processJobWrapper(
    job: Job<ScrapeJobData, ScrapeJobResult>
  ): Promise<ScrapeJobResult> {
    return processJob(job, getMemoryUsage, this.maxJobDuration);
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const memoryUsage = getMemoryUsage();
    const redisConnected = await this.redisClient.ping();

    return {
      healthy: !this.isShuttingDown && this.workers.size > 0 && redisConnected,
      totalWorkers: this.workers.size,
      activeWorkers: this.workers.size,
      memoryUsage,
      redisConnected,
      uptime: process.uptime(),
    };
  }

  private async handleShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;

    logger.info(`Received ${signal}, starting graceful shutdown...`);
    this.isShuttingDown = true;
    this.emit('shuttingDown', signal);

    await shutdownWorkers(
      this.workers,
      this.gracefulShutdownTimeout,
      this.queueManager,
      this.memoryCheckInterval,
      this.healthMonitorInterval,
      () => {
        this.emit('shutdown');
        process.exit(0);
      },
      () => this.forceShutdown()
    );
  }

  private forceShutdown(): void {
    forceShutdownWorkers(
      this.workers,
      this.queueManager,
      () => {
        this.emit('forceShutdown');
        process.exit(1);
      }
    );
  }

  async stop(): Promise<void> {
    await this.handleShutdown('MANUAL_STOP');
  }
}

/**
 * Start the worker service as a standalone process
 */
export async function startWorkerService(): Promise<void> {
  const workerService = new ScraperWorkerService({
    concurrency: parseEnvInt('WORKER_CONCURRENCY', 2),
    workerCount: parseEnvInt('WORKER_COUNT', calculateDefaultWorkerCount()),
    queueName: process.env.QUEUE_NAME || 'scrape-queue',
    enableHealthMonitoring: process.env.ENABLE_HEALTH_MONITORING !== 'false',
    memoryThreshold: parseEnvFloat('MEMORY_THRESHOLD', 0.85),
    maxJobDuration: parseEnvInt('MAX_JOB_DURATION', 600000),
  });

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
    if (Math.random() < 0.05) {
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

export default ScraperWorkerService;
