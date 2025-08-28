import { NextRequest, NextResponse } from 'next/server';
import { QueueMaintenance, QueueMonitor } from '@/lib/queue/queue-utils';
import { getQueueManager } from '@/lib/queue/queue-manager';
import { getJobProcessor } from '@/lib/queue/job-processor';

/**
 * Queue Management API
 * 
 * GET /api/queue - Get queue health and statistics
 * POST /api/queue - Perform queue operations (maintenance, pause, resume)
 * DELETE /api/queue - Clean up operations
 */

interface QueueOperationRequest {
  operation: 'maintenance' | 'pause' | 'resume' | 'cleanup' | 'retry-failed';
  options?: {
    // Maintenance options
    cleanupOldJobs?: boolean;
    maxAgeHours?: number;
    clearDeduplication?: boolean;
    retryFailedJobs?: boolean;
    maxRetries?: number;
    
    // Cleanup options
    customerId?: string;
    
    // Retry options
    jobIds?: string[];
  };
}

/**
 * Get queue health and comprehensive statistics
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    
    const health = await QueueMonitor.getQueueHealth();
    const stats = await QueueMonitor.getProcessingStats();
    
    const response: any = {
      health,
      stats: stats.queue,
      processing: stats.processing,
      performance: stats.performance,
      timestamp: new Date().toISOString(),
    };
    
    if (detailed) {
      const queueManager = getQueueManager();
      const jobProcessor = getJobProcessor();
      
      response.detailed = {
        deduplication: await queueManager.getDeduplicationStats(),
        processor: {
          isRunning: jobProcessor.isRunning(),
          name: jobProcessor.getName(),
        },
      };
    }
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching queue status:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch queue status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Perform queue operations
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: QueueOperationRequest = await request.json();
    
    if (!body.operation) {
      return NextResponse.json(
        { error: 'Operation is required' },
        { status: 400 }
      );
    }
    
    let result: any;
    
    switch (body.operation) {
      case 'maintenance':
        result = await performMaintenance(body.options);
        break;
        
      case 'pause':
        result = await pauseQueue();
        break;
        
      case 'resume':
        result = await resumeQueue();
        break;
        
      case 'cleanup':
        result = await performCleanup(body.options);
        break;
        
      case 'retry-failed':
        result = await retryFailedJobs(body.options);
        break;
        
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${body.operation}` },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      operation: body.operation,
      result,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error performing queue operation:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform queue operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Clean up operations
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const maxAgeHours = parseInt(searchParams.get('maxAgeHours') || '24');
    const customerId = searchParams.get('customerId');
    
    let result: any;
    
    switch (operation) {
      case 'old-jobs':
        result = await QueueMaintenance.cleanupOldJobs(maxAgeHours);
        break;
        
      case 'deduplication':
        result = await QueueMaintenance.clearDeduplicationCache();
        break;
        
      case 'all':
        const cleanup = await QueueMaintenance.cleanupOldJobs(maxAgeHours);
        const dedup = await QueueMaintenance.clearDeduplicationCache();
        result = {
          cleanup,
          deduplication: dedup,
          summary: `${cleanup.summary}; ${dedup.summary}`,
        };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid cleanup operation. Use: old-jobs, deduplication, or all' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      operation: operation || 'cleanup',
      result,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Error performing cleanup operation:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to perform cleanup operation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper functions
 */

async function performMaintenance(options: any = {}): Promise<any> {
  return await QueueMaintenance.performMaintenance({
    cleanupOldJobs: options.cleanupOldJobs !== false,
    maxAgeHours: options.maxAgeHours || 24,
    clearDeduplication: options.clearDeduplication || false,
    retryFailedJobs: options.retryFailedJobs || false,
    maxRetries: options.maxRetries || 10,
  });
}

async function pauseQueue(): Promise<any> {
  const jobProcessor = getJobProcessor();
  await jobProcessor.pause();
  
  return {
    message: 'Queue processing paused',
    status: 'paused',
  };
}

async function resumeQueue(): Promise<any> {
  const jobProcessor = getJobProcessor();
  await jobProcessor.resume();
  
  return {
    message: 'Queue processing resumed',
    status: 'running',
  };
}

async function performCleanup(options: any = {}): Promise<any> {
  const results: any = {};
  
  // Clean up old jobs
  results.oldJobs = await QueueMaintenance.cleanupOldJobs(
    options.maxAgeHours || 24
  );
  
  // Optionally clear deduplication cache
  if (options.clearDeduplication) {
    results.deduplication = await QueueMaintenance.clearDeduplicationCache();
  }
  
  const actions = [results.oldJobs.summary];
  if (results.deduplication) {
    actions.push(results.deduplication.summary);
  }
  
  return {
    ...results,
    summary: `Cleanup completed: ${actions.join('; ')}`,
  };
}

async function retryFailedJobs(options: any = {}): Promise<any> {
  if (options.jobIds && Array.isArray(options.jobIds)) {
    // Retry specific job IDs
    const queueManager = getQueueManager();
    let retried = 0;
    
    for (const jobId of options.jobIds) {
      const job = await queueManager.getJob(jobId);
      if (job && (await job.isFailed())) {
        await queueManager.retryJob(jobId);
        retried++;
      }
    }
    
    return {
      retried,
      summary: `Retried ${retried} specific jobs`,
    };
  } else {
    // Retry all failed jobs for a customer or all customers
    return await QueueMaintenance.retryFailedJobs(
      options.customerId,
      options.maxRetries || 10
    );
  }
}