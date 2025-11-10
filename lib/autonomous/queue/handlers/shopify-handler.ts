/**
 * Shopify Setup Job Handler
 *
 * Handles execution of Shopify setup operations through autonomous agents.
 *
 * @module lib/autonomous/queue/handlers/shopify-handler
 */

import { Job } from 'bullmq';
import { ShopifySetupJobData, OperationJobData } from '../types';
import { createShopifySetupAgent } from '../../agents/shopify-setup-agent';

export interface JobHandlerResult {
  success: boolean;
  result?: any;
  error?: string;
}

export interface ProgressUpdater {
  (progress: number, message: string): Promise<void>;
}

/**
 * Execute Shopify setup agent
 *
 * @param job - BullMQ job instance
 * @param data - Job data with Shopify configuration
 * @param updateProgress - Function to update job progress
 * @returns Result indicating success or failure with optional data/error
 */
export async function executeShopifySetup(
  job: Job<OperationJobData>,
  data: ShopifySetupJobData,
  updateProgress: ProgressUpdater
): Promise<JobHandlerResult> {
  try {
    await job.updateProgress(40);
    await updateProgress(40, 'Creating Shopify agent');

    const agent = createShopifySetupAgent(data.config.storeUrl);

    await job.updateProgress(50);
    await updateProgress(50, 'Executing Shopify setup');

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
