# Queue Management API

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Queue System](/home/user/Omniops/lib/queue/README.md), [Jobs API](/home/user/Omniops/app/api/jobs/README.md), [Redis Configuration](/home/user/Omniops/lib/redis.ts)
**Estimated Read Time:** 14 minutes

## Purpose

Complete technical reference for the Queue Management API, providing comprehensive queue health monitoring, maintenance operations, administrative controls, and performance metrics for the Redis-backed BullMQ job processing system.

## Quick Links

- [API Routes Documentation](/home/user/Omniops/app/api/README.md)
- [Jobs API](/home/user/Omniops/app/api/jobs/README.md)
- [Job Status API](/home/user/Omniops/app/api/jobs/[jobId]/README.md)
- [Queue System Library](/home/user/Omniops/lib/queue/README.md)
- [Scraping API](/home/user/Omniops/app/api/scrape/README.md)

## Table of Contents

- [Purpose](#purpose)
- [Quick Links](#quick-links)
- [Endpoints](#endpoints)
  - [GET /api/queue](#get-apiqueue)
  - [POST /api/queue](#post-apiqueue)
  - [DELETE /api/queue](#delete-apiqueue)
- [Queue Health Indicators](#queue-health-indicators)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)
- [Maintenance Scheduling](#maintenance-scheduling)
- [Security and Performance](#security-and-performance)
- [Related APIs](#related-apis)
- [Keywords](#keywords)

---

The Queue Management API provides comprehensive queue health monitoring, maintenance operations, and administrative controls for the job processing system.

## Endpoints

### GET /api/queue

Get comprehensive queue health and statistics information.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `detailed` | boolean | Include detailed processor and deduplication statistics | false |

#### Response

```json
{
  "health": {
    "queue": {
      "isHealthy": true,
      "activeWorkers": 3,
      "queueSize": 25,
      "processingRate": 5.2,
      "errorRate": 0.02
    },
    "redis": {
      "connected": true,
      "latency": 2.5,
      "memoryUsage": "45MB"
    },
    "workers": [
      {
        "id": "worker-1",
        "status": "active",
        "currentJob": "job_abc123",
        "processedJobs": 150
      }
    ]
  },
  "stats": {
    "waiting": 10,
    "active": 3,
    "completed": 1250,
    "failed": 15,
    "paused": 2
  },
  "processing": {
    "throughput": {
      "jobsPerMinute": 12.5,
      "avgProcessingTime": 4500
    },
    "errors": {
      "count": 15,
      "rate": 0.012
    }
  },
  "performance": {
    "memoryUsage": "120MB",
    "cpuUsage": 45.2,
    "uptime": 86400
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Detailed Response (with `detailed=true`)

```json
{
  "health": { /* ... standard health data ... */ },
  "stats": { /* ... standard stats ... */ },
  "detailed": {
    "deduplication": {
      "cacheSize": 1500,
      "hitRate": 0.15,
      "duplicatesBlocked": 250
    },
    "processor": {
      "isRunning": true,
      "name": "primary-processor",
      "concurrency": 5,
      "activeJobs": 3
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/queue

Perform queue management operations including maintenance, pause/resume, and cleanup.

#### Request Body

```json
{
  "operation": "maintenance|pause|resume|cleanup|retry-failed",
  "options": {
    // Operation-specific options
  }
}
```

#### Operations

##### Maintenance Operation

```json
{
  "operation": "maintenance",
  "options": {
    "cleanupOldJobs": true,
    "maxAgeHours": 48,
    "clearDeduplication": false,
    "retryFailedJobs": true,
    "maxRetries": 5
  }
}
```

**Options:**
- `cleanupOldJobs` (boolean): Remove old completed/failed jobs
- `maxAgeHours` (number): Age threshold for cleanup (default: 24)
- `clearDeduplication` (boolean): Clear deduplication cache
- `retryFailedJobs` (boolean): Retry failed jobs
- `maxRetries` (number): Maximum retries for failed jobs (default: 10)

##### Pause Operation

```json
{
  "operation": "pause"
}
```

Pauses all job processing. Active jobs will complete, but no new jobs will be started.

##### Resume Operation

```json
{
  "operation": "resume"
}
```

Resumes job processing after a pause.

##### Cleanup Operation

```json
{
  "operation": "cleanup",
  "options": {
    "maxAgeHours": 72,
    "clearDeduplication": true,
    "customerId": "customer-123"
  }
}
```

##### Retry Failed Jobs Operation

```json
{
  "operation": "retry-failed",
  "options": {
    "jobIds": ["job_123", "job_456"],
    "customerId": "customer-123",
    "maxRetries": 3
  }
}
```

#### Response

```json
{
  "success": true,
  "operation": "maintenance",
  "result": {
    "summary": "Maintenance completed successfully",
    "details": {
      "oldJobsRemoved": 45,
      "failedJobsRetried": 8,
      "deduplicationCacheCleared": false
    },
    "duration": 2500
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### DELETE /api/queue

Perform cleanup operations using query parameters.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `operation` | string | Cleanup type: `old-jobs`, `deduplication`, `all` | - |
| `maxAgeHours` | number | Age threshold for job cleanup | 24 |
| `customerId` | string | Limit cleanup to specific customer | - |

#### Operations

##### Clean Old Jobs
```bash
DELETE /api/queue?operation=old-jobs&maxAgeHours=48
```

##### Clear Deduplication Cache
```bash
DELETE /api/queue?operation=deduplication
```

##### Complete Cleanup
```bash
DELETE /api/queue?operation=all&maxAgeHours=72
```

#### Response

```json
{
  "success": true,
  "operation": "old-jobs",
  "result": {
    "summary": "Removed 125 jobs older than 48 hours",
    "details": {
      "removedJobs": 125,
      "freedSpace": "2.5MB",
      "oldestJobRemoved": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Queue Health Indicators

### Health Status Values

| Status | Description | Threshold |
|--------|-------------|-----------|
| `healthy` | Queue operating normally | Error rate < 5%, Processing rate > 1 job/min |
| `degraded` | Some issues detected | Error rate 5-15%, Slow processing |
| `unhealthy` | Critical issues | Error rate > 15%, No processing activity |

### Key Metrics

#### Processing Metrics
- **Throughput**: Jobs processed per minute
- **Latency**: Average job processing time
- **Error Rate**: Percentage of failed jobs
- **Queue Depth**: Number of waiting jobs

#### System Metrics
- **Memory Usage**: RAM consumption by queue workers
- **CPU Usage**: Processing load
- **Redis Latency**: Database response time
- **Worker Health**: Status of individual processors

## Error Handling

### 400 Bad Request

**Missing Operation:**
```json
{
  "error": "Operation is required"
}
```

**Invalid Operation:**
```json
{
  "error": "Unknown operation: invalid_op"
}
```

**Invalid Cleanup Operation:**
```json
{
  "error": "Invalid cleanup operation. Use: old-jobs, deduplication, or all"
}
```

### 500 Internal Server Error

**Queue System Error:**
```json
{
  "error": "Failed to fetch queue status",
  "details": "Redis connection failed"
}
```

**Maintenance Failed:**
```json
{
  "error": "Failed to perform queue operation",
  "details": "Insufficient permissions to clear cache"
}
```

## Usage Examples

### cURL Examples

**Get basic queue status:**
```bash
curl "http://localhost:3000/api/queue"
```

**Get detailed queue information:**
```bash
curl "http://localhost:3000/api/queue?detailed=true"
```

**Perform maintenance:**
```bash
curl -X POST "http://localhost:3000/api/queue" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "maintenance",
    "options": {
      "cleanupOldJobs": true,
      "maxAgeHours": 48,
      "retryFailedJobs": true
    }
  }'
```

**Pause queue processing:**
```bash
curl -X POST "http://localhost:3000/api/queue" \
  -H "Content-Type: application/json" \
  -d '{"operation": "pause"}'
```

**Resume queue processing:**
```bash
curl -X POST "http://localhost:3000/api/queue" \
  -H "Content-Type: application/json" \
  -d '{"operation": "resume"}'
```

**Clean old jobs:**
```bash
curl -X DELETE "http://localhost:3000/api/queue?operation=old-jobs&maxAgeHours=72"
```

### TypeScript Integration

```typescript
import { QueueMonitor, QueueMaintenance } from '@/lib/queue/queue-utils';

// Get queue health
const health = await QueueMonitor.getQueueHealth();
console.log('Queue is healthy:', health.queue.isHealthy);

// Get processing statistics
const stats = await QueueMonitor.getProcessingStats();
console.log('Jobs per minute:', stats.processing.throughput.jobsPerMinute);

// Perform maintenance
const maintenanceResult = await QueueMaintenance.performMaintenance({
  cleanupOldJobs: true,
  maxAgeHours: 48,
  retryFailedJobs: true
});
console.log('Maintenance summary:', maintenanceResult.summary);

// Clean up old jobs
const cleanupResult = await QueueMaintenance.cleanupOldJobs(72);
console.log('Removed jobs:', cleanupResult.removedCount);
```

### React Dashboard Component

```typescript
import React, { useState, useEffect } from 'react';

interface QueueHealth {
  queue: {
    isHealthy: boolean;
    activeWorkers: number;
    queueSize: number;
  };
  stats: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

export function QueueDashboard() {
  const [health, setHealth] = useState<QueueHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/queue?detailed=true');
        const data = await response.json();
        setHealth(data);
      } catch (error) {
        console.error('Failed to fetch queue health:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const performMaintenance = async () => {
    try {
      await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'maintenance',
          options: { cleanupOldJobs: true, retryFailedJobs: true }
        })
      });
      // Refresh health data
      const response = await fetch('/api/queue?detailed=true');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Maintenance failed:', error);
    }
  };

  if (loading) return <div>Loading queue status...</div>;
  if (!health) return <div>Failed to load queue status</div>;

  return (
    <div className="queue-dashboard">
      <div className={`status ${health.queue.isHealthy ? 'healthy' : 'unhealthy'}`}>
        Queue Status: {health.queue.isHealthy ? 'Healthy' : 'Unhealthy'}
      </div>
      
      <div className="metrics">
        <div>Active Workers: {health.queue.activeWorkers}</div>
        <div>Queue Size: {health.queue.queueSize}</div>
        <div>Waiting: {health.stats.waiting}</div>
        <div>Active: {health.stats.active}</div>
        <div>Completed: {health.stats.completed}</div>
        <div>Failed: {health.stats.failed}</div>
      </div>
      
      <button onClick={performMaintenance}>
        Run Maintenance
      </button>
    </div>
  );
}
```

## Maintenance Scheduling

### Recommended Maintenance Tasks

**Daily Maintenance (Automated):**
```json
{
  "operation": "maintenance",
  "options": {
    "cleanupOldJobs": true,
    "maxAgeHours": 48,
    "retryFailedJobs": false
  }
}
```

**Weekly Deep Maintenance:**
```json
{
  "operation": "maintenance",
  "options": {
    "cleanupOldJobs": true,
    "maxAgeHours": 168,
    "clearDeduplication": true,
    "retryFailedJobs": true,
    "maxRetries": 3
  }
}
```

### Monitoring Alerts

Set up alerts for:
- Queue depth > 100 jobs
- Error rate > 10%
- No job processing for > 15 minutes
- Memory usage > 500MB
- Worker failures

## Security and Performance

### Rate Limiting

- Queue status polling: 60 requests/minute
- Maintenance operations: 5 requests/hour
- Administrative actions require authentication

### Performance Considerations

- Health checks are cached for 30 seconds
- Detailed statistics have higher overhead
- Maintenance operations may temporarily slow processing
- Consider off-peak hours for major cleanups

## Related APIs

- [Jobs API](/home/user/Omniops/app/api/jobs/README.md) - Job creation and management
- [Job Status API](/home/user/Omniops/app/api/jobs/[jobId]/README.md) - Individual job operations
- [Scrape Jobs API](/home/user/Omniops/app/api/scrape-jobs/README.md) - Scraping job management
- [Queue System Library](/home/user/Omniops/lib/queue/README.md) - Queue utilities and classes

## Keywords

**API Categories:** queue management, job queue, system administration, health monitoring, maintenance operations

**Core Features:** queue health monitoring, worker status, job statistics, maintenance operations, pause/resume, cleanup operations, retry failed jobs, deduplication cache, performance metrics

**Technologies:** BullMQ, Redis, job queue, background processing, worker management, task scheduling

**Operations:** health checks, queue statistics, maintenance, pause queue, resume queue, cleanup old jobs, retry failed jobs, clear deduplication cache, worker monitoring

**Metrics:** throughput, processing rate, error rate, queue depth, latency, memory usage, CPU usage, worker health, Redis performance

**Administration:** queue maintenance, job cleanup, worker management, performance monitoring, error tracking, system health

**Security:** rate limiting, authentication, administrative controls, access control

**Aliases:**
- "queue health" (also known as: queue status, worker status, system health)
- "maintenance operations" (also known as: queue maintenance, cleanup operations, administrative tasks)
- "deduplication cache" (also known as: job deduplication, duplicate prevention, cache management)
- "job statistics" (also known as: queue stats, processing metrics, performance data)