/**
 * Autonomous Operations Queue Cancel API
 *
 * POST /api/autonomous/operations/queue/cancel
 * Cancels a pending or active operation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOperationQueueManager } from '@/lib/autonomous/queue';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const CancelRequestSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, reason } = CancelRequestSchema.parse(body);

    // TODO: Add authentication and verify user owns this operation

    // Get queue manager
    const queueManager = getOperationQueueManager();

    // Cancel the job
    const cancelled = await queueManager.cancelOperation(jobId);

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Job not found or already completed' },
        { status: 404 }
      );
    }

    // Update operation in database
    const supabase = await createServerClient();
    await supabase
      .from('autonomous_operations')
      .update({
        status: 'cancelled',
        completed_at: new Date().toISOString(),
        error_message: reason || 'Cancelled by user',
      })
      .eq('id', jobId);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Operation cancelled successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[API] Queue cancel error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel operation', details: (error as Error).message },
      { status: 500 }
    );
  }
}
