/**
 * WooCommerce Setup Job Handler
 *
 * Handles execution of WooCommerce setup operations through autonomous agents.
 *
 * @module lib/autonomous/queue/handlers/woocommerce-handler
 */

import { Job } from 'bullmq';
import { WooCommerceSetupJobData, OperationJobData } from '../types';
import { createWooCommerceSetupAgent } from '../../agents/woocommerce-setup-agent';

export interface JobHandlerResult {
  success: boolean;
  result?: any;
  error?: string;
}

export interface ProgressUpdater {
  (progress: number, message: string): Promise<void>;
}

/**
 * Execute WooCommerce setup agent
 *
 * @param job - BullMQ job instance
 * @param data - Job data with WooCommerce configuration
 * @param updateProgress - Function to update job progress
 * @returns Result indicating success or failure with optional data/error
 */
export async function executeWooCommerceSetup(
  job: Job<OperationJobData>,
  data: WooCommerceSetupJobData,
  updateProgress: ProgressUpdater
): Promise<JobHandlerResult> {
  try {
    await job.updateProgress(40);
    await updateProgress(40, 'Creating WooCommerce agent');

    const agent = createWooCommerceSetupAgent(data.config.storeUrl);

    await job.updateProgress(50);
    await updateProgress(50, 'Executing WooCommerce setup');

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
