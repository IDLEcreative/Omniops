import { NextRequest, NextResponse } from 'next/server';
import { getQueueManager, JobStatus } from '@/lib/queue/queue-manager';
import { getJobProcessor } from '@/lib/queue/job-processor';

/**
 * Job Status API
 * 
 * GET /api/jobs/[jobId] - Get job status and details
 * DELETE /api/jobs/[jobId] - Cancel a job
 * PUT /api/jobs/[jobId] - Update job (pause/resume)
 */

interface JobResponse {
  id: string;
  name: string;
  data: any;
  opts: any;
  progress: any;
  returnvalue?: any;
  failedReason?: string;
  stacktrace?: string[];
  timestamp: number;
  attemptsMade: number;
  processedOn?: number;
  finishedOn?: number;
}

interface JobUpdateRequest {
  action: 'pause' | 'resume' | 'cancel';
}

/**
 * Get job status and details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const queueManager = getQueueManager();
    const job = await queueManager.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Get job details
    const response: JobResponse = {
      id: job.id || '',
      name: job.name,
      data: job.data,
      opts: job.opts,
      progress: job.progress,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      timestamp: job.timestamp,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
    };

    // Add queue stats for context
    const queueStats = await queueManager.getQueueStats();
    
    return NextResponse.json({
      job: response,
      queueStats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching job status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Update job (pause/resume/cancel)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const body: JobUpdateRequest = await request.json();
    
    if (!body.action || !['pause', 'resume', 'cancel'].includes(body.action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "pause", "resume", or "cancel"' },
        { status: 400 }
      );
    }

    const queueManager = getQueueManager();
    let result: boolean = false;
    let message: string = '';

    switch (body.action) {
      case 'pause':
        // Pause the entire queue (job-level pause not available)
        await queueManager.pause();
        result = true;
        message = 'Queue paused (job-level pause not available)';
        break;
        
      case 'resume':
        // Resume the entire queue (job-level resume not available)
        await queueManager.resume();
        result = true;
        message = 'Queue resumed (job-level resume not available)';
        break;
        
      case 'cancel':
        await queueManager.cancelJob(jobId);
        result = true;
        message = 'Job cancelled successfully';
        break;
    }

    if (!result) {
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }

    // Get updated job
    const updatedJob = await queueManager.getJob(jobId);

    return NextResponse.json({
      success: true,
      message,
      job: updatedJob ? {
        id: updatedJob.id,
        name: updatedJob.name,
        data: updatedJob.data,
        progress: updatedJob.progress,
      } : null,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error updating job:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Cancel/delete a job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  try {
    const { jobId } = await params;
    
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const queueManager = getQueueManager();
    await queueManager.cancelJob(jobId);
    // cancelJob returns void, so we assume success if no error thrown

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
      jobId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error cancelling job:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to cancel job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}