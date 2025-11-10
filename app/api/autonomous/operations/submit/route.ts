/**
 * Autonomous Operations Submit API
 *
 * POST /api/autonomous/operations/submit
 * Submits an autonomous operation to the background job queue
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getOperationQueueManager,
  OperationPriority,
  WooCommerceSetupJobData,
  ShopifySetupJobData,
} from '@/lib/autonomous/queue';
import { createOperation } from '@/lib/autonomous/core/operation-service';
import { verifyConsent } from '@/lib/autonomous/security/consent-manager';
import { createServerClient } from '@/lib/supabase/server';

// Request validation schema
const SubmitOperationSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  service: z.enum(['woocommerce', 'shopify', 'bigcommerce', 'stripe']),
  operation: z.string().min(1),
  config: z.object({
    storeUrl: z.string().url().optional(),
    headless: z.boolean().optional().default(true),
    slowMo: z.number().optional().default(0),
    timeout: z.number().optional(),
  }),
  priority: z.enum(['critical', 'high', 'normal', 'low', 'deferred']).optional().default('normal'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const data = SubmitOperationSchema.parse(body);

    // TODO: Add authentication and verify user permissions

    // Map priority string to enum
    const priorityMap: Record<string, OperationPriority> = {
      critical: OperationPriority.CRITICAL,
      high: OperationPriority.HIGH,
      normal: OperationPriority.NORMAL,
      low: OperationPriority.LOW,
      deferred: OperationPriority.DEFERRED,
    };

    const priority = priorityMap[data.priority];

    // Step 1: Verify user has granted consent
    const hasConsent = await verifyConsent(
      data.organizationId,
      data.service,
      data.operation
    );

    if (!hasConsent) {
      return NextResponse.json(
        {
          error: 'User consent required',
          message: 'Please grant consent for this operation before proceeding',
        },
        { status: 403 }
      );
    }

    // Step 2: Create operation record in database
    const operation = await createOperation({
      organizationId: data.organizationId,
      userId: data.userId,
      service: data.service,
      operation: data.operation,
      status: 'pending',
      metadata: {
        config: data.config,
        priority: data.priority,
      },
    });

    // Step 3: Determine job type based on service
    let jobType: 'woocommerce_setup' | 'shopify_setup';
    if (data.service === 'woocommerce') {
      jobType = 'woocommerce_setup';
    } else if (data.service === 'shopify') {
      jobType = 'shopify_setup';
    } else {
      return NextResponse.json(
        { error: `Service not yet supported: ${data.service}` },
        { status: 400 }
      );
    }

    // Validate storeUrl is provided for e-commerce operations
    if (!data.config.storeUrl) {
      return NextResponse.json(
        { error: 'Store URL is required for e-commerce operations' },
        { status: 400 }
      );
    }

    // Step 4: Create job data
    const jobData: WooCommerceSetupJobData | ShopifySetupJobData = {
      operationId: operation.id,
      organizationId: data.organizationId,
      userId: data.userId,
      service: data.service,
      operation: data.operation,
      jobType,
      priority,
      config: {
        storeUrl: data.config.storeUrl,
        headless: data.config.headless,
        slowMo: data.config.slowMo,
        timeout: data.config.timeout,
      },
      createdAt: new Date().toISOString(),
    };

    // Step 5: Add job to queue
    const queueManager = getOperationQueueManager();
    const jobId = await queueManager.addOperation(jobData);

    // Step 6: Update operation with job ID
    const supabase = await createServerClient();
    await supabase
      .from('autonomous_operations')
      .update({ job_id: jobId })
      .eq('id', operation.id);

    // Return immediately with operation details
    return NextResponse.json({
      success: true,
      operationId: operation.id,
      jobId,
      status: 'queued',
      message: 'Operation queued successfully',
      estimatedDuration: '2-5 minutes',
      statusUrl: `/api/autonomous/operations/${operation.id}/status`,
      queueStatusUrl: `/api/autonomous/operations/queue/status/${jobId}`,
    }, { status: 202 }); // 202 Accepted
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('[API] Submit operation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit operation',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
