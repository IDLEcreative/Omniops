/**
 * Operation Job Processor
 *
 * Processes autonomous operation jobs from the queue by executing
 * the appropriate agent and handling results.
 *
 * @module lib/autonomous/queue/operation-job-processor
 */

import { Worker, Job, WorkerOptions } from 'bullmq';
import { createRedisClient } from '@/lib/redis';
import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  OperationJobData,
  OperationJobResult,
  OperationQueueConfig,
  WooCommerceSetupJobData,
  ShopifySetupJobData,
} from './types';
import { executeWooCommerceSetup, executeShopifySetup } from './handlers';
import { validateConsent, createProgressUpdater, setupWorkerEventListeners } from './utils';
import { updateOperation } from '../core/operation-operations';
import { logAuditStep, getOperationAuditSummary } from '../security/audit-logger';

// ============================================================================
// Operation Job Processor Class
// ============================================================================

export class OperationJobProcessor {
  private worker: Worker;
  private config: OperationQueueConfig;

  constructor(config: OperationQueueConfig = {}) {
    this.config = {
      queueName: config.queueName || 'autonomous-operations',
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      maxConcurrency: config.maxConcurrency || 2,
      ...config,
    };

    // Initialize BullMQ worker
    const connection = createRedisClient();

    const workerOptions: WorkerOptions = {
      connection: connection as any,
      concurrency: this.config.maxConcurrency,
      limiter: {
        max: 10, // Max 10 jobs per...
        duration: 60000, // ...1 minute (rate limiting)
      },
    };

    this.worker = new Worker(
      this.config.queueName!,
      async (job) => this.processJob(job),
      workerOptions
    );

    // Set up event listeners
    setupWorkerEventListeners(this.worker);

    console.log('[OperationProcessor] Worker started');
  }

  /**
   * Process a job from the queue
   */
  private async processJob(job: Job<OperationJobData>): Promise<OperationJobResult> {
    const startTime = Date.now();
    const data = job.data;

    console.log(`[OperationProcessor] Processing job: ${job.id} (${data.jobType})`);

    // Create progress updater
    const updateProgress = createProgressUpdater(job, data.operationId);

    try {
      // Update progress: Starting
      await job.updateProgress(0);
      await updateProgress(0, 'Starting operation');

      // Step 1: Verify consent (10% progress)
      await job.updateProgress(10);
      await validateConsent(data);

      await job.updateProgress(20);
      await updateProgress(20, 'Consent verified');

      // Step 2: Execute agent based on job type (20-90% progress)
      await job.updateProgress(30);
      const result = await this.executeAgent(job, data, updateProgress);

      // Step 3: Complete (100%)
      await job.updateProgress(100);

      const duration = Date.now() - startTime;

      // Get audit summary
      const auditSummary = await getOperationAuditSummary(data.operationId);

      // Update operation in database
      const supabase = await createServiceRoleClient();
      await updateOperation(supabase, data.operationId, {
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        result: result.result,
        error_message: result.error,
      });

      const jobResult: OperationJobResult = {
        success: result.success,
        operationId: data.operationId,
        completedAt: new Date().toISOString(),
        duration,
        result: result.result,
        error: result.error,
        retryCount: job.attemptsMade,
        auditSummary,
      };

      console.log(`[OperationProcessor] Job completed: ${job.id} (${duration}ms)`);

      return jobResult;
    } catch (error) {
      console.error(`[OperationProcessor] Job failed: ${job.id}`, error);

      // Update operation status
      const supabase = await createServiceRoleClient();
      await updateOperation(supabase, data.operationId, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: (error as Error).message,
      });

      // Log failure to audit trail
      await logAuditStep({
        operationId: data.operationId,
        stepNumber: 999,
        intent: 'Job processing failed',
        action: 'error',
        success: false,
        error: (error as Error).message,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * Execute the appropriate agent based on job type
   */
  private async executeAgent(
    job: Job<OperationJobData>,
    data: OperationJobData,
    updateProgress: (progress: number, message: string) => Promise<void>
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    switch (data.jobType) {
      case 'woocommerce_setup':
        return executeWooCommerceSetup(job, data as WooCommerceSetupJobData, updateProgress);

      case 'shopify_setup':
        return executeShopifySetup(job, data as ShopifySetupJobData, updateProgress);

      case 'credential_rotation':
        // TODO: Implement credential rotation
        throw new Error('Credential rotation not yet implemented');

      case 'health_check':
        // TODO: Implement health check
        throw new Error('Health check not yet implemented');

      default:
        throw new Error(`Unknown job type: ${(data as any).jobType}`);
    }
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    await this.worker.close();
    console.log('[OperationProcessor] Worker stopped');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let processorInstance: OperationJobProcessor | null = null;

/**
 * Get singleton processor instance
 *
 * @example
 * const processor = getOperationJobProcessor();
 * // Worker automatically starts processing jobs
 */
export function getOperationJobProcessor(config?: OperationQueueConfig): OperationJobProcessor {
  if (!processorInstance) {
    processorInstance = new OperationJobProcessor(config);
  }
  return processorInstance;
}

/**
 * Create new processor instance (for testing)
 */
export function createOperationJobProcessor(config?: OperationQueueConfig): OperationJobProcessor {
  return new OperationJobProcessor(config);
}

/**
 * Start processing jobs (convenience function)
 *
 * @example
 * // In your server startup code
 * startOperationProcessing();
 */
export function startOperationProcessing(config?: OperationQueueConfig): OperationJobProcessor {
  console.log('[OperationProcessor] Starting operation processing');
  return getOperationJobProcessor(config);
}
