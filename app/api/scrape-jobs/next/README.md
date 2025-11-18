# Job Queue API

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Scrape Jobs API](/home/user/Omniops/app/api/scrape-jobs/README.md), [Individual Scrape Job API](/home/user/Omniops/app/api/scrape-jobs/[id]/README.md)
**Estimated Read Time:** 13 minutes

## Purpose

Complete API reference for workers to retrieve and claim jobs from the scrape job queue. Designed for distributed scraping systems where multiple workers need to process jobs atomically with race condition prevention.

## Quick Links

- [Scrape Jobs API](/home/user/Omniops/app/api/scrape-jobs/README.md)
- [Individual Scrape Job API](/home/user/Omniops/app/api/scrape-jobs/[id]/README.md)
- [Job Retry API](/home/user/Omniops/app/api/scrape-jobs/[id]/retry/README.md)
- [Job Statistics API](/home/user/Omniops/app/api/scrape-jobs/stats/README.md)

## Endpoints

### GET /api/scrape-jobs/next

Get the next pending job from the queue without claiming it. This is useful for checking what jobs are available.

#### Response

**Job Available:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "domain": "example.com",
    "job_type": "domain_scrape",
    "status": "pending",
    "priority": 7,
    "retry_count": 0,
    "max_retries": 3,
    "config": {
      "depth": 3,
      "maxPages": 100,
      "timeout": 30000,
      "respectRobots": true,
      "includeSubdomains": false
    },
    "metadata": {
      "source": "api",
      "tags": ["ecommerce"],
      "estimatedDuration": 180
    },
    "created_at": "2024-01-01T10:00:00.000Z",
    "updated_at": "2024-01-01T10:00:00.000Z"
  }
}
```

**No Jobs Available:**
```json
{
  "success": true,
  "data": null,
  "message": "No pending jobs in queue"
}
```

### POST /api/scrape-jobs/next

Atomically claim the next available job from the queue. This ensures only one worker can process a job at a time.

#### Response

**Job Successfully Claimed:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "domain": "example.com",
    "job_type": "domain_scrape",
    "status": "running",
    "priority": 7,
    "worker_id": "worker-node-1",
    "claimed_at": "2024-01-01T10:30:00.000Z",
    "config": {
      "depth": 3,
      "maxPages": 100,
      "timeout": 30000
    },
    "metadata": {
      "source": "api",
      "claimedBy": "worker-node-1"
    },
    "created_at": "2024-01-01T10:00:00.000Z",
    "updated_at": "2024-01-01T10:30:00.000Z"
  },
  "message": "Job claimed successfully"
}
```

**No Jobs to Claim:**
```json
{
  "success": true,
  "data": null,
  "message": "No pending jobs to claim"
}
```

**Job Already Claimed (Race Condition):**
```json
{
  "success": false,
  "error": "Job was already claimed by another worker",
  "retry": true
}
```

## Job Priority Queue

### Priority Ordering

Jobs are returned in priority order:
1. **Priority Level** (10 = highest, 1 = lowest)
2. **Creation Time** (older jobs first for same priority)
3. **Retry Count** (fewer retries first)

### Queue Selection Algorithm

```sql
SELECT * FROM scrape_jobs 
WHERE status = 'pending'
ORDER BY 
  priority DESC,
  retry_count ASC,
  created_at ASC
LIMIT 1
```

### Job States in Queue

| Status | Description | Available for Claiming |
|--------|-------------|----------------------|
| `pending` | Ready to be processed | ✅ Yes |
| `running` | Currently being processed | ❌ No |
| `completed` | Successfully finished | ❌ No |
| `failed` | Failed (may be retried) | ❌ No |
| `cancelled` | Manually cancelled | ❌ No |

## Atomic Job Claiming

### Race Condition Prevention

The claiming process uses database transactions to prevent race conditions:

1. **Begin Transaction**
2. **Select next job** with `FOR UPDATE SKIP LOCKED`
3. **Update status** to `running`
4. **Set worker metadata**
5. **Commit Transaction**

### Claim Timeout

Jobs have a maximum claim duration. If a worker doesn't update the job within the timeout period, the job is automatically released back to the queue.

**Default Timeout:** 10 minutes

### Worker Identification

Workers should provide identification for monitoring and debugging:

```json
{
  "worker_id": "worker-node-1",
  "worker_version": "1.2.0",
  "capabilities": ["javascript", "images", "pdfs"]
}
```

## Error Handling

### 409 Conflict

**Race Condition:**
```json
{
  "success": false,
  "error": "Job was already claimed by another worker",
  "retry": true,
  "details": "Try claiming again immediately"
}
```

### 500 Internal Server Error

**Database Error:**
```json
{
  "success": false,
  "error": "Failed to claim next job",
  "details": "Database transaction failed"
}
```

**Queue System Error:**
```json
{
  "success": false,
  "error": "Failed to get next job",
  "details": "Queue system temporarily unavailable"
}
```

## Usage Examples

### cURL Examples

**Check next job without claiming:**
```bash
curl "http://localhost:3000/api/scrape-jobs/next"
```

**Claim next job:**
```bash
curl -X POST "http://localhost:3000/api/scrape-jobs/next" \
  -H "Content-Type: application/json"
```

### Worker Implementation

```typescript
import { scrapeJobManager } from '@/lib/scrape-job-manager';

class ScrapeWorker {
  private workerId: string;
  private isRunning: boolean = false;

  constructor(workerId: string) {
    this.workerId = workerId;
  }

  async start() {
    this.isRunning = true;
    console.log(`Worker ${this.workerId} starting...`);

    while (this.isRunning) {
      try {
        // Claim next job
        const job = await this.claimNextJob();
        
        if (job) {
          console.log(`Processing job ${job.id} for domain ${job.domain}`);
          await this.processJob(job);
        } else {
          // No jobs available, wait before checking again
          await this.sleep(5000);
        }
      } catch (error) {
        console.error('Worker error:', error);
        await this.sleep(10000);
      }
    }
  }

  async claimNextJob() {
    try {
      const response = await fetch('/api/scrape-jobs/next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Worker-ID': this.workerId
        }
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }
      
      if (data.retry) {
        // Race condition, try again immediately
        return await this.claimNextJob();
      }
      
      return null;
    } catch (error) {
      console.error('Failed to claim job:', error);
      return null;
    }
  }

  async processJob(job: any) {
    try {
      // Update job status to running
      await scrapeJobManager.updateJob(job.id, {
        status: 'running',
        started_at: new Date().toISOString(),
        metadata: {
          ...job.metadata,
          workerId: this.workerId,
          workerStartTime: new Date().toISOString()
        }
      });

      // Perform the actual scraping work
      const result = await this.performScraping(job);

      // Mark job as completed
      await scrapeJobManager.updateJob(job.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        stats: result.stats
      });

      console.log(`Job ${job.id} completed successfully`);

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      // Mark job as failed
      await scrapeJobManager.updateJob(job.id, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      });

      // Job may be retried automatically based on retry_count and max_retries
    }
  }

  async performScraping(job: any) {
    // Implement your scraping logic here
    const stats = {
      pagesProcessed: 0,
      successfulRequests: 0,
      failedRequests: 0,
      dataExtracted: {}
    };

    // Simulate scraping work
    for (let i = 0; i < job.config.maxPages; i++) {
      // Update progress periodically
      if (i % 10 === 0) {
        await scrapeJobManager.updateJob(job.id, {
          stats: {
            ...stats,
            pagesProcessed: i,
            progress: Math.round((i / job.config.maxPages) * 100)
          }
        });
      }

      // Perform actual scraping work here
      await this.scrapePage(job, i);
      stats.pagesProcessed++;
      stats.successfulRequests++;
    }

    return { stats };
  }

  async scrapePage(job: any, pageIndex: number) {
    // Implement page scraping logic
    await this.sleep(1000); // Simulate work
  }

  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    this.isRunning = false;
    console.log(`Worker ${this.workerId} stopping...`);
  }
}

// Usage
const worker = new ScrapeWorker('worker-node-1');
worker.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  worker.stop();
});
```

### Multi-Worker Coordinator

```typescript
class WorkerCoordinator {
  private workers: ScrapeWorker[] = [];
  private maxWorkers: number;

  constructor(maxWorkers: number = 3) {
    this.maxWorkers = maxWorkers;
  }

  async start() {
    console.log(`Starting ${this.maxWorkers} workers...`);

    for (let i = 0; i < this.maxWorkers; i++) {
      const worker = new ScrapeWorker(`worker-${i + 1}`);
      this.workers.push(worker);
      
      // Start worker without awaiting (parallel execution)
      worker.start().catch(error => {
        console.error(`Worker ${i + 1} failed:`, error);
      });
    }
  }

  async stop() {
    console.log('Stopping all workers...');
    this.workers.forEach(worker => worker.stop());
  }

  async getStatus() {
    // Get status of all workers
    const status = await Promise.all(
      this.workers.map(async (worker, index) => ({
        workerId: `worker-${index + 1}`,
        isRunning: worker.isRunning,
        currentJob: worker.currentJobId || null
      }))
    );

    return {
      totalWorkers: this.workers.length,
      activeWorkers: status.filter(w => w.isRunning).length,
      workers: status
    };
  }
}

// Usage
const coordinator = new WorkerCoordinator(5);
await coordinator.start();

// Health check endpoint
app.get('/workers/status', async (req, res) => {
  const status = await coordinator.getStatus();
  res.json(status);
});
```

### Load Balancing Strategies

#### Round Robin with Priority

```typescript
class LoadBalancedQueue {
  async getNextJobForWorker(workerCapabilities: string[]) {
    // Get jobs that match worker capabilities
    const response = await fetch('/api/scrape-jobs/next');
    const data = await response.json();

    if (data.success && data.data) {
      const job = data.data;
      
      // Check if worker can handle this job type
      if (this.canWorkerHandleJob(job, workerCapabilities)) {
        return await this.claimJob(job.id);
      }
    }

    return null;
  }

  canWorkerHandleJob(job: any, capabilities: string[]): boolean {
    // Check if worker has required capabilities
    const requiredCapabilities = job.config.requiredCapabilities || [];
    return requiredCapabilities.every(cap => capabilities.includes(cap));
  }
}
```

## Monitoring and Metrics

### Queue Metrics

Track these metrics for queue health:

```json
{
  "queueMetrics": {
    "totalJobs": 1250,
    "pendingJobs": 15,
    "runningJobs": 5,
    "completedJobs": 1200,
    "failedJobs": 30,
    "avgWaitTime": 45.5,
    "avgProcessingTime": 180.2,
    "throughput": 12.5
  },
  "workerMetrics": {
    "activeWorkers": 5,
    "totalWorkers": 8,
    "avgJobsPerWorker": 250,
    "workerEfficiency": 0.85
  }
}
```

### Performance Optimization

1. **Connection Pooling**: Use database connection pooling for high concurrency
2. **Index Optimization**: Ensure proper indexes on status, priority, and created_at
3. **Batch Processing**: Consider batching small jobs together
4. **Worker Scaling**: Auto-scale workers based on queue depth

## Security Considerations

- **Worker Authentication**: Implement worker authentication/authorization
- **Rate Limiting**: Prevent workers from overwhelming the system
- **Resource Limits**: Set memory and CPU limits for workers
- **Job Isolation**: Ensure jobs can't affect other jobs or system resources
- **Audit Logging**: Log all job claims and completions for monitoring

## Related APIs

- [Scrape Jobs API](/app/api/scrape-jobs/README.md) - Job creation and management
- [Individual Scrape Job API](/app/api/scrape-jobs/[id]/README.md) - Job status updates
- [Job Retry API](/app/api/scrape-jobs/[id]/retry/README.md) - Retry failed jobs
- [Job Statistics API](/app/api/scrape-jobs/stats/README.md) - Queue analytics