/**
 * Autonomous Operations Queue Status API
 *
 * GET /api/autonomous/operations/queue/status/:jobId
 * Returns status and progress of a queued operation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOperationQueueManager } from '@/lib/autonomous/queue';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get queue manager
    const queueManager = getOperationQueueManager();

    // Get job status
    const jobStatus = await queueManager.getJobStatus(jobId);

    if (!jobStatus) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get progress from Redis if available
    const client = await queueManager['queue'].client;
    const progressKey = `operation:progress:${jobId}`;
    const progressData = await client.get(progressKey);

    let progress = null;
    if (progressData) {
      progress = JSON.parse(progressData);
    }

    return NextResponse.json({
      jobId,
      status: jobStatus.status,
      progress: progress || { progress: jobStatus.progress || 0 },
      data: jobStatus.data,
      result: jobStatus.returnvalue,
      failedReason: jobStatus.failedReason,
      processedOn: jobStatus.processedOn,
      finishedOn: jobStatus.finishedOn,
      attemptsMade: jobStatus.attemptsMade,
    });
  } catch (error) {
    console.error('[API] Queue status error:', error);
    return NextResponse.json(
      { error: 'Failed to get job status', details: (error as Error).message },
      { status: 500 }
    );
  }
}
