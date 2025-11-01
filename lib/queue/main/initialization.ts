/**
 * Queue system initialization
 */

import { QueueManager, createQueueManager } from '../queue-manager';
import { JobProcessor, createJobProcessor } from '../job-processor';
import { QUEUE_CONFIG } from './constants';

/**
 * Initialize the queue system with default configuration
 */
export async function initializeQueueSystem(config?: {
  queueName?: string;
  concurrency?: number;
  autoStartProcessing?: boolean;
}): Promise<{
  queueManager: QueueManager;
  jobProcessor: JobProcessor;
  initialized: boolean;
}> {
  const queueName = config?.queueName || QUEUE_CONFIG.DEFAULT_QUEUE_NAME;
  const concurrency = config?.concurrency || QUEUE_CONFIG.DEFAULT_CONCURRENCY;

  try {
    // Initialize queue manager
    const queueManager = createQueueManager(queueName, {
      maxConcurrency: concurrency,
    });

    // Initialize job processor
    const jobProcessor = createJobProcessor(queueName, {
      maxConcurrency: concurrency,
    });

    return {
      queueManager,
      jobProcessor,
      initialized: true,
    };
  } catch (error) {
    console.error('Failed to initialize queue system:', error);
    throw new Error('Queue system initialization failed');
  }
}
