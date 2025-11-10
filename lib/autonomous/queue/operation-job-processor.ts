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
import {
  OperationJobData,
  OperationJobResult,
  OperationProgressUpdate,
  OperationQueueConfig,
  WooCommerceSetupJobData,
  ShopifySetupJobData,
} from './types';
import { createWooCommerceSetupAgent } from '../agents/woocommerce-setup-agent';
import { createShopifySetupAgent } from '../agents/shopify-setup-agent';
import { verifyConsent } from '../security/consent-manager';
import { updateOperation } from '../core/operation-service';
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
    this.setupEventListeners();

    console.log('[OperationProcessor] Worker started');
  }

  /**
   * Process a job from the queue
   */
  private async processJob(job: Job<OperationJobData>): Promise<OperationJobResult> {
    const startTime = Date.now();
    const data = job.data;

    console.log(`[OperationProcessor] Processing job: ${job.id} (${data.jobType})`);

    try {
      // Update progress: Starting
      await this.updateProgress(job, {
        operationId: data.operationId,
        status: 'active',
        progress: 0,
        message: 'Starting operation',
        timestamp: new Date().toISOString(),
      });

      // Step 1: Verify consent (10% progress)
      await job.updateProgress(10);
      const hasConsent = await verifyConsent(
        data.organizationId,
        data.service,
        data.operation
      );

      if (!hasConsent) {
        throw new Error('User consent not found or expired');
      }

      await this.updateProgress(job, {
        operationId: data.operationId,
        status: 'active',
        progress: 20,
        message: 'Consent verified',
        timestamp: new Date().toISOString(),
      });

      // Step 2: Execute agent based on job type (20-90% progress)
      await job.updateProgress(30);
      const result = await this.executeAgent(job, data);

      // Step 3: Complete (100%)
      await job.updateProgress(100);

      const duration = Date.now() - startTime;

      // Get audit summary
      const auditSummary = await getOperationAuditSummary(data.operationId);

      // Update operation in database
      await updateOperation(data.operationId, {
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
      await updateOperation(data.operationId, {
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
    data: OperationJobData
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    switch (data.jobType) {
      case 'woocommerce_setup':
        return this.executeWooCommerceSetup(job, data as WooCommerceSetupJobData);

      case 'shopify_setup':
        return this.executeShopifySetup(job, data as ShopifySetupJobData);

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
   * Execute WooCommerce setup agent
   */
  private async executeWooCommerceSetup(
    job: Job<OperationJobData>,
    data: WooCommerceSetupJobData
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      await job.updateProgress(40);
      await this.updateProgress(job, {
        operationId: data.operationId,
        status: 'active',
        progress: 40,
        message: 'Creating WooCommerce agent',
        timestamp: new Date().toISOString(),
      });

      const agent = createWooCommerceSetupAgent(data.config.storeUrl);

      await job.updateProgress(50);
      await this.updateProgress(job, {
        operationId: data.operationId,
        status: 'active',
        progress: 50,
        message: 'Executing WooCommerce setup',
        timestamp: new Date().toISOString(),
      });

      const result = await agent.execute({
        operationId: data.operationId,
        organizationId: data.organizationId,
        service: data.service,
        operation: data.operation,
        headless: data.config.headless !== false,
        slowMo: data.config.slowMo || 0,
      });

      await job.updateProgress(90);

      return {
        success: result.success,
        result: result,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Execute Shopify setup agent
   */
  private async executeShopifySetup(
    job: Job<OperationJobData>,
    data: ShopifySetupJobData
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      await job.updateProgress(40);
      await this.updateProgress(job, {
        operationId: data.operationId,
        status: 'active',
        progress: 40,
        message: 'Creating Shopify agent',
        timestamp: new Date().toISOString(),
      });

      const agent = createShopifySetupAgent(data.config.storeUrl);

      await job.updateProgress(50);
      await this.updateProgress(job, {
        operationId: data.operationId,
        status: 'active',
        progress: 50,
        message: 'Executing Shopify setup',
        timestamp: new Date().toISOString(),
      });

      const result = await agent.execute({
        operationId: data.operationId,
        organizationId: data.organizationId,
        service: data.service,
        operation: data.operation,
        headless: data.config.headless !== false,
        slowMo: data.config.slowMo || 0,
      });

      await job.updateProgress(90);

      return {
        success: result.success,
        result: result,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Update progress in database (for real-time monitoring)
   */
  private async updateProgress(
    job: Job<OperationJobData>,
    update: OperationProgressUpdate
  ): Promise<void> {
    try {
      // Store progress in Redis for real-time access
      const client = await this.worker.client;
      const key = `operation:progress:${update.operationId}`;
      await client.set(key, JSON.stringify(update), 'EX', 3600); // 1 hour expiry
    } catch (error) {
      console.warn('[OperationProcessor] Failed to update progress:', error);
    }
  }

  /**
   * Set up event listeners for worker monitoring
   */
  private setupEventListeners(): void {
    this.worker.on('completed', (job, result) => {
      console.log(`[OperationProcessor] Job completed: ${job.id}`, {
        success: result.success,
        duration: result.duration,
      });
    });

    this.worker.on('failed', (job, error) => {
      console.error(`[OperationProcessor] Job failed: ${job?.id}`, {
        error: error.message,
        attemptsMade: job?.attemptsMade,
      });
    });

    this.worker.on('error', (error) => {
      console.error('[OperationProcessor] Worker error:', error);
    });

    this.worker.on('stalled', (jobId) => {
      console.warn(`[OperationProcessor] Job stalled: ${jobId}`);
    });
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
