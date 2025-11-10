/**
 * Autonomous Operations Queue Retry API
 *
 * POST /api/autonomous/operations/queue/retry
 * Retries a failed operation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOperationQueueManager } from '@/lib/autonomous/queue';
import { z } from 'zod';

const RetryRequestSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId } = RetryRequestSchema.parse(body);

    // TODO: Add authentication and verify user owns this operation

    // Get queue manager
    const queueManager = getOperationQueueManager();

    // Retry the job
    const retried = await queueManager.retryOperation(jobId);

    if (!retried) {
      return NextResponse.json(
        { error: 'Job not found or cannot be retried' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Operation queued for retry',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[API] Queue retry error:', error);
    return NextResponse.json(
      { error: 'Failed to retry operation', details: (error as Error).message },
      { status: 500 }
    );
  }
}
