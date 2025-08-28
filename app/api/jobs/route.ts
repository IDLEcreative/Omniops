import { NextRequest, NextResponse } from 'next/server';
import { JobUtils, QueueMonitor, QueueMaintenance } from '@/lib/queue/queue-utils';
import { JobType, JobPriority } from '@/lib/queue/queue-manager';
import { z } from 'zod';

/**
 * Jobs API
 * 
 * GET /api/jobs - Get queue statistics and job listings
 * POST /api/jobs - Create new jobs
 */

// Schema for job creation
const CreateJobSchema = z.object({
  type: z.enum(['single-page', 'full-crawl', 'refresh']),
  url: z.string().url(),
  customerId: z.string().optional(),
  isNewCustomer: z.boolean().optional(),
  config: z.any().optional(),
  priority: z.nativeEnum(JobPriority).optional(),
  delay: z.number().min(0).optional(),
  metadata: z.record(z.any()).optional(),
  // Additional fields for specific job types
  maxPages: z.number().min(1).optional(),
  depth: z.number().min(1).optional(),
  includeSubdomains: z.boolean().optional(),
  lastCrawledAt: z.string().datetime().optional(),
  forceRefresh: z.boolean().optional(),
  fullRefresh: z.boolean().optional(),
});

const CreateBatchJobsSchema = z.object({
  type: z.enum(['single-page', 'full-crawl', 'refresh']),
  urls: z.array(z.string().url()).min(1).max(100), // Limit to 100 URLs per batch
  customerId: z.string().optional(),
  isNewCustomer: z.boolean().optional(),
  config: z.any().optional(),
  priority: z.nativeEnum(JobPriority).optional(),
  staggerDelay: z.number().min(0).optional(),
  metadata: z.record(z.any()).optional(),
});

const CreateRecurringJobSchema = z.object({
  type: z.literal('refresh'),
  url: z.string().url(),
  cronPattern: z.string(),
  customerId: z.string().optional(),
  config: z.any().optional(),
  metadata: z.record(z.any()).optional(),
});

type CreateJobRequest = z.infer<typeof CreateJobSchema>;
type CreateBatchJobsRequest = z.infer<typeof CreateBatchJobsSchema>;
type CreateRecurringJobRequest = z.infer<typeof CreateRecurringJobSchema>;

/**
 * Get queue statistics and job listings
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status') as any;
    const url = searchParams.get('url');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeStats = searchParams.get('includeStats') !== 'false';
    const includeHealth = searchParams.get('includeHealth') === 'true';

    const response: any = {
      timestamp: new Date().toISOString(),
    };

    // Get queue statistics if requested
    if (includeStats) {
      response.stats = await QueueMonitor.getProcessingStats();
    }

    // Get queue health if requested
    if (includeHealth) {
      response.health = await QueueMonitor.getQueueHealth();
    }

    // Get jobs based on filters
    let jobs = [];
    
    if (customerId) {
      jobs = await QueueMonitor.getJobsByCustomer(customerId, status, limit);
    } else if (url) {
      jobs = await QueueMonitor.getJobsByUrl(url, false, limit);
    } else {
      // Get jobs by status or all recent jobs
      const queueManager = JobUtils['queueManager'];
      if (status) {
        jobs = await queueManager.getJobsByStatus(status, limit);
      } else {
        // Get recent jobs from all statuses
        const statuses = ['active', 'waiting', 'completed', 'failed'];
        const allJobs = [];
        
        for (const currentStatus of statuses) {
          const statusJobs = await queueManager.getJobsByStatus(currentStatus as any, Math.ceil(limit / 4));
          allJobs.push(...statusJobs);
        }
        
        jobs = allJobs
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, limit);
      }
    }

    response.jobs = jobs;

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching jobs:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Create new jobs
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    // Determine the type of job creation request
    if (body.urls && Array.isArray(body.urls)) {
      // Batch job creation
      return await handleBatchJobCreation(body);
    } else if (body.cronPattern) {
      // Recurring job creation
      return await handleRecurringJobCreation(body);
    } else {
      // Single job creation
      return await handleSingleJobCreation(body);
    }

  } catch (error) {
    console.error('Error creating job:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid job data',
          details: error.errors
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle single job creation
 */
async function handleSingleJobCreation(body: any): Promise<NextResponse> {
  const validatedData = CreateJobSchema.parse(body);
  
  let result: { jobId: string; deduplicated: boolean };
  
  switch (validatedData.type) {
    case 'single-page':
      result = await JobUtils.createSinglePageJob(validatedData.url, {
        customerId: validatedData.customerId,
        isNewCustomer: validatedData.isNewCustomer,
        config: validatedData.config,
        priority: validatedData.priority,
        delay: validatedData.delay,
        metadata: validatedData.metadata,
      });
      break;
      
    case 'full-crawl':
      result = await JobUtils.createFullCrawlJob(validatedData.url, {
        customerId: validatedData.customerId,
        isNewCustomer: validatedData.isNewCustomer,
        maxPages: validatedData.maxPages,
        depth: validatedData.depth,
        includeSubdomains: validatedData.includeSubdomains,
        config: validatedData.config,
        priority: validatedData.priority,
        delay: validatedData.delay,
        metadata: validatedData.metadata,
      });
      break;
      
    case 'refresh':
      result = await JobUtils.createRefreshJob(validatedData.url, {
        customerId: validatedData.customerId,
        lastCrawledAt: validatedData.lastCrawledAt ? new Date(validatedData.lastCrawledAt) : undefined,
        forceRefresh: validatedData.forceRefresh,
        fullRefresh: validatedData.fullRefresh,
        config: validatedData.config,
        priority: validatedData.priority,
        delay: validatedData.delay,
        metadata: validatedData.metadata,
      });
      break;
      
    default:
      throw new Error(`Unsupported job type: ${(validatedData as any).type}`);
  }
  
  if (result.deduplicated) {
    return NextResponse.json({
      success: true,
      message: 'Job was deduplicated (similar job already exists)',
      deduplicated: true,
      timestamp: new Date().toISOString(),
    });
  }
  
  return NextResponse.json({
    success: true,
    jobId: result.jobId,
    type: validatedData.type,
    url: validatedData.url,
    message: 'Job created successfully',
    timestamp: new Date().toISOString(),
  }, { status: 201 });
}

/**
 * Handle batch job creation
 */
async function handleBatchJobCreation(body: any): Promise<NextResponse> {
  const validatedData = CreateBatchJobsSchema.parse(body);
  
  const results = await JobUtils.createBatchJobs(
    validatedData.urls,
    validatedData.type,
    {
      customerId: validatedData.customerId,
      isNewCustomer: validatedData.isNewCustomer,
      config: validatedData.config,
      priority: validatedData.priority,
      staggerDelay: validatedData.staggerDelay,
      metadata: validatedData.metadata,
    }
  );
  
  const successful = results.filter(r => !r.deduplicated);
  const deduplicated = results.filter(r => r.deduplicated);
  
  return NextResponse.json({
    success: true,
    message: `Created ${successful.length} jobs (${deduplicated.length} deduplicated)`,
    results: {
      total: results.length,
      successful: successful.length,
      deduplicated: deduplicated.length,
      jobs: results,
    },
    timestamp: new Date().toISOString(),
  }, { status: 201 });
}

/**
 * Handle recurring job creation
 */
async function handleRecurringJobCreation(body: any): Promise<NextResponse> {
  const validatedData = CreateRecurringJobSchema.parse(body);
  
  const jobId = await JobUtils.createRecurringRefreshJob(
    validatedData.url,
    validatedData.cronPattern,
    {
      customerId: validatedData.customerId,
      config: validatedData.config,
      metadata: validatedData.metadata,
    }
  );
  
  return NextResponse.json({
    success: true,
    jobId,
    type: 'recurring-refresh',
    url: validatedData.url,
    cronPattern: validatedData.cronPattern,
    message: 'Recurring job created successfully',
    timestamp: new Date().toISOString(),
  }, { status: 201 });
}