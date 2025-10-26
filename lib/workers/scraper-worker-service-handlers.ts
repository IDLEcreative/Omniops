import { Worker } from 'bullmq';
import { EventEmitter } from 'events';
import { logger } from '../logger';
import { WorkerEventData } from './scraper-worker-service-types';

/**
 * Sets up all event listeners for a worker instance
 */
export function setupWorkerEventListeners(
  worker: Worker,
  workerId: string,
  emitter: EventEmitter,
  onWorkerError: (workerId: string) => Promise<void>,
  isShuttingDown: () => boolean
): void {
  worker.on('ready', () => {
    logger.info(`Worker ${workerId} is ready`);
    emitter.emit('workerReady', workerId);
  });

  worker.on('active', (job) => {
    logger.info(`Worker ${workerId} started job ${job.id}`);
    emitter.emit('workerActive', { workerId, jobId: job.id });
  });

  worker.on('completed', (job, result) => {
    logger.info(`Worker ${workerId} completed job ${job.id}`);
    emitter.emit('workerCompleted', { workerId, jobId: job.id, result });
  });

  worker.on('failed', (job, error) => {
    logger.error(`Worker ${workerId} failed job ${job?.id}: ${error.message}`);
    emitter.emit('workerFailed', { workerId, jobId: job?.id, error: error.message });
  });

  worker.on('error', (error) => {
    logger.error(`Worker ${workerId} error: ${error.message}`);
    emitter.emit('workerError', { workerId, error: error.message });

    // Attempt to restart worker if not shutting down
    if (!isShuttingDown()) {
      onWorkerError(workerId).catch(restartError => {
        logger.error(`Failed to restart worker ${workerId}:`, restartError);
      });
    }
  });

  worker.on('stalled', (jobId) => {
    logger.warn(`Worker ${workerId} job ${jobId} stalled`);
    emitter.emit('workerStalled', { workerId, jobId });
  });

  worker.on('closed', () => {
    logger.info(`Worker ${workerId} closed`);
    emitter.emit('workerClosed', workerId);
  });
}

/**
 * Sets up signal handlers for graceful shutdown
 */
export function setupSignalHandlers(
  onShutdown: (signal: string) => Promise<void>,
  onForceShutdown: () => void
): void {
  process.on('SIGINT', onShutdown);
  process.on('SIGTERM', onShutdown);
  process.on('SIGUSR2', onShutdown); // Nodemon uses this

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    onForceShutdown();
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection:', { promise, reason });
    onForceShutdown();
  });
}

/**
 * Sets up memory monitoring with periodic checks
 */
export function setupMemoryMonitoring(
  getMemoryUsage: () => { used: number; total: number; percentUsed: number },
  maxMemoryUsage: number,
  emitter: EventEmitter
): NodeJS.Timeout {
  return setInterval(() => {
    const memoryUsage = getMemoryUsage();

    if (memoryUsage.percentUsed > maxMemoryUsage) {
      logger.warn(`High memory usage detected: ${(memoryUsage.percentUsed * 100).toFixed(1)}%`);
      emitter.emit('highMemoryUsage', memoryUsage);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.info('Garbage collection triggered');
      }
    }
  }, 10000); // Check every 10 seconds
}

/**
 * Starts health monitoring with periodic health checks
 */
export function startHealthMonitoring(
  getHealthStatus: () => Promise<any>,
  emitter: EventEmitter
): NodeJS.Timeout {
  return setInterval(async () => {
    try {
      const health = await getHealthStatus();
      emitter.emit('healthUpdate', health);

      // Log health status periodically
      if (Math.random() < 0.1) { // Log 10% of the time to avoid spam
        logger.info(`Health check: ${health.activeWorkers}/${health.totalWorkers} workers active`);
      }
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }, 30000); // Check every 30 seconds
}
