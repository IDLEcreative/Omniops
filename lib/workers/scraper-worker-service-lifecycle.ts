import { Worker } from 'bullmq';
import { logger } from '../logger';
import { ScrapeQueueManager } from '../queue/scrape-queue';

/**
 * Handles graceful shutdown of workers
 */
export async function shutdownWorkers(
  workers: Map<string, Worker>,
  gracefulTimeout: number,
  queueManager: ScrapeQueueManager,
  memoryCheckInterval: NodeJS.Timeout | null,
  healthMonitorInterval: NodeJS.Timeout | null,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  const shutdownTimeout = setTimeout(() => {
    logger.warn('Graceful shutdown timeout, forcing shutdown...');
    onError(new Error('Shutdown timeout'));
  }, gracefulTimeout);

  try {
    // Stop accepting new jobs and wait for current jobs to complete
    const workerPromises = Array.from(workers.entries()).map(([workerId, worker]) =>
      worker.close().catch(error => {
        logger.error(`Error closing worker ${workerId}:`, error);
      })
    );

    await Promise.allSettled(workerPromises);

    // Cleanup intervals
    if (memoryCheckInterval) {
      clearInterval(memoryCheckInterval);
    }
    if (healthMonitorInterval) {
      clearInterval(healthMonitorInterval);
    }

    // Shutdown queue manager
    await queueManager.shutdown();

    clearTimeout(shutdownTimeout);
    logger.info('Graceful shutdown completed');
    onComplete();
  } catch (error) {
    clearTimeout(shutdownTimeout);
    logger.error('Error during graceful shutdown:', error);
    onError(error as Error);
  }
}

/**
 * Forces immediate shutdown of all workers
 */
export function forceShutdownWorkers(
  workers: Map<string, Worker>,
  queueManager: ScrapeQueueManager,
  onComplete: () => void
): void {
  logger.warn('Forcing immediate shutdown...');

  // Force close all workers
  workers.forEach((worker, workerId) => {
    worker.close(true).catch(error => {
      logger.error(`Error force closing worker ${workerId}:`, error);
    });
  });

  // Force shutdown queue manager
  queueManager.forceShutdown().catch((error: Error) => {
    logger.error('Error during force shutdown:', error);
  });

  onComplete();
}

/**
 * Restarts a failed worker
 */
export async function restartWorker(
  workerId: string,
  workers: Map<string, Worker>,
  createWorkerFn: (id: string) => Promise<Worker>
): Promise<void> {
  try {
    logger.info(`Restarting worker ${workerId}...`);

    // Close existing worker
    const existingWorker = workers.get(workerId);
    if (existingWorker) {
      await existingWorker.close(true);
      workers.delete(workerId);
    }

    // Create new worker
    await createWorkerFn(workerId);

    logger.info(`Worker ${workerId} restarted successfully`);
  } catch (error) {
    logger.error(`Failed to restart worker ${workerId}:`, error);
    throw error;
  }
}
