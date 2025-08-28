# Queue Management System

A comprehensive queue management system built with BullMQ and Redis for handling scraping jobs with advanced features like priorities, deduplication, scheduling, and real-time progress tracking.

## Features

- **Job Enqueuing**: Support for single page, full crawl, and refresh job types
- **Priority Handling**: Automatic priority assignment (new customers get high priority)  
- **Scheduled Jobs**: Delay jobs or schedule them for specific times
- **Recurring Jobs**: Set up periodic jobs using cron patterns
- **Job Deduplication**: Prevent duplicate jobs within a configurable time window
- **Real-time Progress**: Track job progress with detailed updates
- **Exponential Backoff**: Intelligent retry mechanism for failed jobs
- **Job Cancellation**: Cancel jobs before or during processing
- **Queue Monitoring**: Comprehensive health checks and statistics

## Quick Start

```typescript
import { JobUtils, QueueMonitor, JobPriority } from '@/lib/queue';

// Create a single page scraping job
const result = await JobUtils.createSinglePageJob('https://example.com', {
  customerId: 'customer-123',
  isNewCustomer: true, // Gets high priority
  config: { turboMode: true }
});

// Monitor queue health
const health = await QueueMonitor.getQueueHealth();
console.log('Queue is healthy:', health.queue.isHealthy);
```

## API Endpoints

### Job Management
- `POST /api/jobs` - Create jobs (single, batch, recurring)
- `GET /api/jobs` - List jobs and statistics  
- `GET /api/jobs/[jobId]` - Get job status
- `PUT /api/jobs/[jobId]` - Update job (pause/resume/cancel)
- `DELETE /api/jobs/[jobId]` - Cancel job

### Queue Management
- `GET /api/queue` - Queue health and statistics
- `POST /api/queue` - Queue operations (maintenance, pause, resume)
- `DELETE /api/queue` - Cleanup operations

## Job Types

### Single Page Job
```typescript
{
  type: 'single-page',
  url: 'https://example.com/page',
  customerId: 'customer-123'
}
```

### Full Crawl Job  
```typescript
{
  type: 'full-crawl',
  url: 'https://example.com',
  maxPages: 100,
  depth: 3,
  includeSubdomains: false
}
```

### Refresh Job
```typescript
{
  type: 'refresh', 
  url: 'https://example.com/page',
  forceRefresh: true
}
```

## Testing

Run the test suite:
```bash
node test-queue-system.js
```

## Components

- **queue-manager.ts** - Core queue management with BullMQ
- **job-processor.ts** - Job processing worker with progress tracking
- **queue-utils.ts** - Utility functions and monitoring
- **index.ts** - Main export file with all components

See individual component files for detailed documentation and usage examples.