# Job Queue System

**Purpose:** Comprehensive background job processing system built on Redis and BullMQ for scalable, reliable task execution with priority management and real-time monitoring.

**Integration Type:** System
**Last Updated:** 2025-10-30
**Status:** Active

This directory contains a comprehensive job queue management system built with Redis and BullMQ for handling background tasks, primarily focused on web scraping operations. The system provides robust job processing, monitoring, and management capabilities.

## Overview

The queue system provides:
- **Job Management**: Create, schedule, monitor, and cancel background jobs
- **Priority Handling**: Intelligent priority assignment based on customer status
- **Reliable Processing**: Retry mechanisms with exponential backoff
- **Real-time Monitoring**: Progress tracking and health monitoring
- **Scalable Architecture**: Horizontal scaling with multiple workers
- **Job Deduplication**: Prevent duplicate jobs within configurable windows

## Architecture

```
queue/
├── index.ts           # Main exports and public API
├── queue-manager.ts   # Core queue management with BullMQ
├── job-processor.ts   # Job processing worker with progress tracking
├── queue-utils.ts     # Utility functions and monitoring helpers
├── scrape-queue.ts    # Specialized scraping queue implementation
└── README.md          # This documentation
```

## Core Components

### Queue Manager (`queue-manager.ts`)

Central queue management system built on BullMQ:

**Key Features:**
- **Multiple Queue Support**: Separate queues for different job types
- **Priority Management**: Automatic priority assignment for new customers
- **Job Scheduling**: Support for delayed and recurring jobs
- **Retry Logic**: Configurable retry strategies with exponential backoff
- **Dead Letter Queue**: Handle permanently failed jobs

**Core API:**
```typescript
import { QueueManager } from '@/lib/queue/queue-manager';

const queueManager = new QueueManager();

// Add job to queue
await queueManager.addJob('scrape-website', {
  url: 'https://example.com',
  customerId: 'customer-123',
  options: { turboMode: true }
}, {
  priority: 'high',
  attempts: 3,
  backoff: 'exponential'
});

// Schedule delayed job
await queueManager.addJob('refresh-content', data, {
  delay: 60 * 60 * 1000 // 1 hour delay
});

// Add recurring job
await queueManager.addRecurringJob('daily-maintenance', '0 2 * * *', {
  timezone: 'America/New_York'
});
```

### Job Processor (`job-processor.ts`)

Worker implementation that processes jobs with comprehensive progress tracking:

**Key Features:**
- **Progress Tracking**: Real-time progress updates with detailed status
- **Error Handling**: Graceful error handling with detailed error information
- **Resource Management**: Efficient memory and connection management
- **Concurrency Control**: Configurable concurrent job processing
- **Health Monitoring**: Worker health checks and performance metrics

**Job Processing:**
```typescript
import { JobProcessor } from '@/lib/queue/job-processor';

const processor = new JobProcessor();

// Register job handler
processor.registerHandler('scrape-website', async (job, updateProgress) => {
  const { url, customerId, options } = job.data;
  
  // Update progress
  await updateProgress(10, 'Starting scrape...');
  
  // Perform scraping
  const pages = await scrapeWebsite(url, options);
  
  await updateProgress(50, 'Processing content...');
  
  // Process content
  const processed = await processContent(pages);
  
  await updateProgress(90, 'Generating embeddings...');
  
  // Generate embeddings
  await generateEmbeddings(processed);
  
  await updateProgress(100, 'Complete');
  
  return { success: true, pagesProcessed: pages.length };
});

// Start processing
await processor.start();
```

### Queue Utils (`queue-utils.ts`)

Utility functions for queue monitoring and management:

**Monitoring Functions:**
```typescript
import { QueueUtils } from '@/lib/queue/queue-utils';

// Get queue statistics
const stats = await QueueUtils.getQueueStats('scrape-queue');
console.log(`Active: ${stats.active}, Waiting: ${stats.waiting}, Failed: ${stats.failed}`);

// Get job details
const job = await QueueUtils.getJobDetails('job-123');
console.log(`Status: ${job.status}, Progress: ${job.progress}%`);

// Monitor queue health
const health = await QueueUtils.getQueueHealth();
if (!health.isHealthy) {
  console.warn('Queue health issues detected:', health.issues);
}

// Cleanup old jobs
await QueueUtils.cleanupCompletedJobs({ olderThan: 24 * 60 * 60 * 1000 }); // 24 hours
```

### Scrape Queue (`scrape-queue.ts`)

Specialized queue implementation for web scraping operations:

**Features:**
- **Job Type Classification**: Different handling for single page vs full crawl jobs
- **Domain-based Deduplication**: Prevent duplicate scraping of same domains
- **Priority Calculation**: Smart priority assignment based on customer tier
- **Rate Limiting**: Respect robots.txt and implement polite crawling
- **Progress Granularity**: Detailed progress tracking for scraping operations

```typescript
import { ScrapeQueue } from '@/lib/queue/scrape-queue';

const scrapeQueue = new ScrapeQueue();

// Add single page scrape job
await scrapeQueue.addSinglePageJob('https://example.com/page', {
  customerId: 'customer-123',
  priority: 'high'
});

// Add full website crawl
await scrapeQueue.addFullCrawlJob('https://example.com', {
  maxPages: 100,
  respectRobots: true,
  customerId: 'customer-456'
});

// Add refresh job for existing content
await scrapeQueue.addRefreshJob('https://example.com', {
  forceRefresh: true,
  customerId: 'customer-789'
});
```

## Job Types and Priorities

### Job Types
```typescript
enum JobType {
  SINGLE_PAGE = 'single-page',
  FULL_CRAWL = 'full-crawl', 
  REFRESH = 'refresh',
  MAINTENANCE = 'maintenance',
  ANALYTICS = 'analytics'
}
```

### Priority System
```typescript
enum JobPriority {
  CRITICAL = 1,    // System maintenance, urgent fixes
  HIGH = 2,        // New customers, premium features
  NORMAL = 3,      // Regular operations
  LOW = 4,         // Background tasks, analytics
  BULK = 5         // Batch operations, non-urgent tasks
}

function calculatePriority(customerId: string, isNewCustomer: boolean): JobPriority {
  if (isNewCustomer) return JobPriority.HIGH;
  
  const customerTier = getCustomerTier(customerId);
  switch (customerTier) {
    case 'premium': return JobPriority.HIGH;
    case 'standard': return JobPriority.NORMAL;
    default: return JobPriority.LOW;
  }
}
```

## Configuration

### Queue Configuration
```typescript
interface QueueConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions: {
    attempts: number;
    backoff: 'fixed' | 'exponential';
    removeOnComplete: number;
    removeOnFail: number;
  };
  concurrency: {
    scraping: number;
    processing: number;
    maintenance: number;
  };
  timeouts: {
    jobTimeout: number;
    stalledInterval: number;
    maxStalledCount: number;
  };
}

const defaultConfig: QueueConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: 'exponential',
    removeOnComplete: 100,
    removeOnFail: 50
  },
  concurrency: {
    scraping: 5,
    processing: 10,
    maintenance: 1
  },
  timeouts: {
    jobTimeout: 10 * 60 * 1000, // 10 minutes
    stalledInterval: 30 * 1000,  // 30 seconds
    maxStalledCount: 3
  }
};
```

## Monitoring and Observability

### Real-time Job Monitoring
```typescript
import { JobMonitor } from '@/lib/queue/job-processor';

const monitor = new JobMonitor();

// Listen for job events
monitor.on('job:started', (job) => {
  console.log(`Job ${job.id} started: ${job.name}`);
});

monitor.on('job:progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
});

monitor.on('job:completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

monitor.on('job:failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});
```

### Queue Health Monitoring
```typescript
interface QueueHealth {
  isHealthy: boolean;
  queues: {
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    metrics: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    };
  }[];
  workers: {
    id: string;
    status: 'active' | 'idle' | 'paused';
    currentJob?: string;
    processedJobs: number;
  }[];
  issues: string[];
}

async function getQueueHealth(): Promise<QueueHealth> {
  const queues = await Promise.all([
    getQueueMetrics('scrape-queue'),
    getQueueMetrics('process-queue'),
    getQueueMetrics('maintenance-queue')
  ]);
  
  const workers = await getWorkerStatus();
  
  const issues = [];
  if (queues.some(q => q.failed > 10)) {
    issues.push('High failure rate detected');
  }
  if (queues.some(q => q.waiting > 100)) {
    issues.push('Queue backlog detected');
  }
  
  return {
    isHealthy: issues.length === 0,
    queues,
    workers,
    issues
  };
}
```

### Performance Metrics
```typescript
interface JobMetrics {
  jobId: string;
  type: string;
  duration: number;
  memoryUsage: number;
  cpuTime: number;
  status: 'completed' | 'failed' | 'active';
  errorType?: string;
  retryCount: number;
  priority: number;
}

class MetricsCollector {
  async collectJobMetrics(job: Job): Promise<JobMetrics> {
    const startTime = job.processedOn || job.timestamp;
    const endTime = job.finishedOn || Date.now();
    
    return {
      jobId: job.id,
      type: job.name,
      duration: endTime - startTime,
      memoryUsage: process.memoryUsage().heapUsed,
      cpuTime: process.cpuUsage().user,
      status: job.finishedOn ? 'completed' : 'active',
      retryCount: job.attemptsMade,
      priority: job.opts.priority || 0
    };
  }
}
```

## Error Handling and Recovery

### Retry Strategies
```typescript
interface RetryConfig {
  attempts: number;
  backoff: {
    type: 'fixed' | 'exponential';
    delay: number;
    multiplier?: number;
    maxDelay?: number;
  };
  retryCondition: (error: Error) => boolean;
}

function createRetryConfig(jobType: string): RetryConfig {
  switch (jobType) {
    case 'scrape-website':
      return {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
          multiplier: 2,
          maxDelay: 30000
        },
        retryCondition: (error) => {
          // Retry on network errors, not on authentication errors
          return !error.message.includes('authentication') &&
                 !error.message.includes('authorization');
        }
      };
    default:
      return {
        attempts: 2,
        backoff: { type: 'fixed', delay: 5000 },
        retryCondition: () => true
      };
  }
}
```

### Dead Letter Queue
```typescript
class DeadLetterQueue {
  async addFailedJob(job: Job, error: Error): Promise<void> {
    await this.redis.lpush('dead-letter-queue', JSON.stringify({
      jobId: job.id,
      jobData: job.data,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      attemptsMade: job.attemptsMade
    }));
  }
  
  async reprocessFailedJobs(): Promise<void> {
    const failedJobs = await this.redis.lrange('dead-letter-queue', 0, -1);
    
    for (const jobData of failedJobs) {
      const job = JSON.parse(jobData);
      
      // Re-add to queue with modifications
      await this.queueManager.addJob(job.type, job.jobData, {
        priority: JobPriority.LOW,
        attempts: 1 // Only one retry attempt for dead letter jobs
      });
    }
    
    await this.redis.del('dead-letter-queue');
  }
}
```

## API Integration

### REST API Endpoints
```typescript
// GET /api/queue/jobs - List jobs
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');
  
  const jobs = await QueueUtils.getJobs({ status, limit });
  
  return Response.json({
    jobs: jobs.map(job => ({
      id: job.id,
      name: job.name,
      status: job.finishedOn ? 'completed' : job.failedReason ? 'failed' : 'active',
      progress: job.progress || 0,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null
    }))
  });
}

// POST /api/queue/jobs - Create job
export async function POST(request: Request) {
  const { type, data, options } = await request.json();
  
  const job = await QueueUtils.createJob(type, data, options);
  
  return Response.json({
    jobId: job.id,
    status: 'queued',
    message: 'Job created successfully'
  });
}
```

### WebSocket Real-time Updates
```typescript
import { WebSocket } from 'ws';

class QueueWebSocketServer {
  private clients = new Set<WebSocket>();
  
  constructor() {
    this.setupJobEventListeners();
  }
  
  private setupJobEventListeners() {
    const monitor = new JobMonitor();
    
    monitor.on('job:progress', (job, progress) => {
      this.broadcast({
        type: 'job:progress',
        jobId: job.id,
        progress,
        message: job.data.statusMessage
      });
    });
    
    monitor.on('job:completed', (job, result) => {
      this.broadcast({
        type: 'job:completed',
        jobId: job.id,
        result
      });
    });
  }
  
  private broadcast(message: any) {
    const data = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}
```

## Testing

### Unit Tests
```typescript
describe('Queue Manager', () => {
  let queueManager: QueueManager;
  
  beforeEach(async () => {
    queueManager = new QueueManager({ 
      redis: { host: 'localhost', port: 6380 } // Test Redis instance
    });
    await queueManager.initialize();
  });
  
  afterEach(async () => {
    await queueManager.cleanup();
  });
  
  it('should add job to queue', async () => {
    const job = await queueManager.addJob('test-job', { data: 'test' });
    
    expect(job.id).toBeDefined();
    expect(job.name).toBe('test-job');
  });
  
  it('should process job with progress tracking', async () => {
    const progressUpdates: number[] = [];
    
    const processor = new JobProcessor();
    processor.registerHandler('test-job', async (job, updateProgress) => {
      await updateProgress(25, 'Step 1');
      progressUpdates.push(25);
      
      await updateProgress(50, 'Step 2');
      progressUpdates.push(50);
      
      await updateProgress(100, 'Complete');
      progressUpdates.push(100);
      
      return { success: true };
    });
    
    await processor.start();
    
    const job = await queueManager.addJob('test-job', { data: 'test' });
    
    // Wait for job completion
    await job.waitUntilFinished(queueManager.getEventEmitter());
    
    expect(progressUpdates).toEqual([25, 50, 100]);
  });
});
```

### Integration Tests
```typescript
describe('Queue Integration', () => {
  it('should handle scraping workflow end-to-end', async () => {
    const scrapeQueue = new ScrapeQueue();
    
    // Add scraping job
    const job = await scrapeQueue.addSinglePageJob('https://example.com', {
      customerId: 'test-customer'
    });
    
    // Monitor progress
    const progressEvents: any[] = [];
    job.on('progress', (progress) => {
      progressEvents.push(progress);
    });
    
    // Wait for completion
    const result = await job.waitUntilFinished(scrapeQueue.getEventEmitter());
    
    expect(result.success).toBe(true);
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[progressEvents.length - 1]).toBe(100);
  });
});
```

## Performance Optimization

### 1. Concurrency Management
```typescript
// Configure appropriate concurrency levels
const workerConfig = {
  scraping: {
    concurrency: 5, // Limited by rate limiting
    timeout: 10 * 60 * 1000 // 10 minutes
  },
  processing: {
    concurrency: 20, // CPU intensive tasks
    timeout: 5 * 60 * 1000 // 5 minutes
  },
  maintenance: {
    concurrency: 1, // Single threaded
    timeout: 30 * 60 * 1000 // 30 minutes
  }
};
```

### 2. Memory Management
```typescript
class MemoryOptimizedProcessor extends JobProcessor {
  async processJob(job: Job): Promise<any> {
    // Monitor memory usage
    const initialMemory = process.memoryUsage().heapUsed;
    
    try {
      const result = await super.processJob(job);
      
      // Force garbage collection for large jobs
      const memoryGrowth = process.memoryUsage().heapUsed - initialMemory;
      if (memoryGrowth > 100 * 1024 * 1024) { // 100MB
        global.gc && global.gc();
      }
      
      return result;
    } catch (error) {
      // Cleanup on error
      global.gc && global.gc();
      throw error;
    }
  }
}
```

### 3. Redis Optimization
```typescript
// Use Redis pipeline for bulk operations
async function bulkJobStatus(jobIds: string[]): Promise<JobStatus[]> {
  const pipeline = this.redis.pipeline();
  
  jobIds.forEach(id => {
    pipeline.hgetall(`bull:queue:${id}`);
  });
  
  const results = await pipeline.exec();
  return results.map(([error, data]) => parseJobStatus(data));
}
```

## Best Practices

### 1. Job Design
```typescript
// ✅ Good job design - idempotent and atomic
async function processContentJob(job: Job) {
  const { contentId, customerId } = job.data;
  
  // Check if already processed
  const existing = await getProcessedContent(contentId);
  if (existing) {
    return { success: true, cached: true };
  }
  
  // Process content atomically
  const result = await processContent(contentId);
  await saveProcessedContent(contentId, result);
  
  return { success: true, processed: true };
}

// ❌ Avoid non-idempotent operations
async function badJob(job: Job) {
  // This might cause issues on retry
  await incrementCounter(); // Non-idempotent
  await sendEmail(); // Should not be repeated
}
```

### 2. Error Handling
```typescript
// ✅ Proper error categorization
class JobError extends Error {
  constructor(message: string, public isRetryable: boolean = true) {
    super(message);
  }
}

// In job handler
if (authenticationFailed) {
  throw new JobError('Authentication failed', false); // Don't retry
}

if (networkTimeout) {
  throw new JobError('Network timeout', true); // Retry
}
```

### 3. Resource Management
```typescript
// ✅ Proper resource cleanup
async function resourceIntensiveJob(job: Job) {
  let browser: Browser | null = null;
  
  try {
    browser = await puppeteer.launch();
    // Job logic
    return result;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
```

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=optional_password
REDIS_DB=0

# Queue Configuration
QUEUE_CONCURRENCY_SCRAPING=5
QUEUE_CONCURRENCY_PROCESSING=10
QUEUE_JOB_TIMEOUT=600000  # 10 minutes
QUEUE_MAX_RETRIES=3

# Worker Configuration
WORKER_POLL_INTERVAL=1000  # 1 second
WORKER_STALLED_INTERVAL=30000  # 30 seconds
```

## Troubleshooting

**Issue: Jobs stuck in "waiting" state**
- **Cause:** No workers processing the queue
- **Solution:** Start worker with `await processor.start()`
- **Check:** Verify Redis connection is healthy

**Issue: Jobs failing repeatedly**
- **Cause:** Job logic throwing errors or timeout
- **Solution:** Check job logs, increase timeout if needed
- **Debug:** Review dead letter queue for failed jobs

**Issue: High memory usage in worker**
- **Cause:** Jobs not cleaning up resources properly
- **Solution:** Implement proper cleanup in finally blocks
- **Monitor:** Use `process.memoryUsage()` to track

**Issue: Queue backlog growing**
- **Cause:** Job processing slower than job creation
- **Solution:** Increase worker concurrency or add more workers
- **Scale:** Deploy additional worker instances horizontally

**Issue: Jobs not retrying after failure**
- **Cause:** Retry configuration not set correctly
- **Solution:** Verify retry config in job options
- **Check:** Review `isRetryable` logic in error handlers

## API Reference

### Queue Manager

```typescript
class QueueManager {
  addJob(name: string, data: any, options?: JobOptions): Promise<Job>
  addRecurringJob(name: string, cron: string, options?: JobOptions): Promise<void>
  getJob(jobId: string): Promise<Job | null>
  removeJob(jobId: string): Promise<void>
}
```

### Job Processor

```typescript
class JobProcessor {
  registerHandler(jobType: string, handler: JobHandler): void
  start(): Promise<void>
  stop(): Promise<void>
}

type JobHandler = (job: Job, updateProgress: ProgressCallback) => Promise<any>
type ProgressCallback = (percentage: number, message?: string) => Promise<void>
```

### Queue Utils

```typescript
QueueUtils.getQueueStats(queueName: string): Promise<QueueStats>
QueueUtils.getJobDetails(jobId: string): Promise<JobDetails>
QueueUtils.getQueueHealth(): Promise<QueueHealth>
QueueUtils.cleanupCompletedJobs(options: CleanupOptions): Promise<number>
```

## Related Documentation

**Internal:**
- [lib/redis.ts](/Users/jamesguy/Omniops/lib/redis.ts) - Redis client configuration
- [lib/scraper-api.ts](/Users/jamesguy/Omniops/lib/scraper-api.ts) - Web scraping functionality
- [lib/embeddings.ts](/Users/jamesguy/Omniops/lib/embeddings.ts) - Content processing and embeddings
- [app/api/queue/](/Users/jamesguy/Omniops/app/api/queue/) - Queue management API endpoints
- [lib/monitoring/](/Users/jamesguy/Omniops/lib/monitoring/) - Queue monitoring and analytics

**External:**
- [BullMQ Documentation](https://docs.bullmq.io/)
- [Redis Documentation](https://redis.io/docs/)
- [BullMQ Best Practices](https://docs.bullmq.io/guide/best-practices)

## Contributing

When working with the queue system:

1. **Design for Reliability**: Make jobs idempotent and fault-tolerant
2. **Monitor Performance**: Track job duration and resource usage
3. **Handle Errors Gracefully**: Implement proper error handling and retry logic
4. **Test Thoroughly**: Include both unit and integration tests
5. **Document Job Types**: Clearly document job data schemas and behavior
6. **Optimize for Scale**: Consider memory usage and processing efficiency

The queue system is critical for background processing and should be designed with reliability, scalability, and observability as primary concerns.