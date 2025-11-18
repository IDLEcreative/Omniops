**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Jobs API

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Queue System](/home/user/Omniops/lib/queue/README.md), [Scraping API](/home/user/Omniops/app/api/scrape/README.md)
**Estimated Read Time:** 12 minutes

## Purpose

This document provides comprehensive technical reference for the job queue management system powering web scraping operations, including job creation (single page, full crawl, refresh), job status tracking, queue statistics, and health monitoring with BullMQ integration.

## Quick Links

- [Scraping API](/home/user/Omniops/app/api/scrape/README.md)
- [Queue Implementation](/home/user/Omniops/lib/queue/README.md)
- [API Routes Documentation](/home/user/Omniops/app/api/README.md)
- [Monitoring Analytics](/home/user/Omniops/app/api/monitoring/README.md)

## Keywords

**Primary**: job queue, BullMQ, job management, queue statistics, job status, scraping jobs
**Aliases**: jobs API, queue API, job endpoints, task queue
**Related**: web scraping, Redis queue, job scheduling, worker management, job monitoring

## Table of Contents

- [Endpoints](#endpoints)
  - [GET /api/jobs](#get-apijobs)
  - [POST /api/jobs](#post-apijobs)
  - [GET /api/jobs/[jobId]](#get-apijobsjobid)
- [Job Types](#job-types)
- [Queue Statistics](#queue-statistics)
- [Job Status](#job-status)
- [Performance](#performance)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Integration](#integration)
- [Monitoring](#monitoring)
- [Best Practices](#best-practices)

---

The Jobs API manages the job queue system for web scraping operations. It provides endpoints for creating various types of jobs (single page, full crawl, refresh) and retrieving job statistics.

## Endpoints

### GET /api/jobs

Get queue statistics and job listings with optional filtering.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `customerId` | string | Filter jobs by customer ID | - |
| `status` | string | Filter by job status (`active`, `waiting`, `completed`, `failed`) | - |
| `url` | string | Filter jobs by URL | - |
| `limit` | number | Maximum number of jobs to return | 10 |
| `includeStats` | boolean | Include queue statistics | true |
| `includeHealth` | boolean | Include queue health information | false |

#### Response

```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "stats": {
    "active": 2,
    "waiting": 5,
    "completed": 150,
    "failed": 3
  },
  "health": {
    "queue": {
      "isHealthy": true,
      "activeWorkers": 3,
      "queueSize": 7
    }
  },
  "jobs": [
    {
      "id": "job_123",
      "type": "single-page",
      "url": "https://example.com",
      "status": "active",
      "progress": 50,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/jobs

Create new jobs. Supports three types of job creation:
- Single job creation
- Batch job creation
- Recurring job creation

#### Single Job Creation

```json
{
  "type": "single-page",
  "url": "https://example.com",
  "customerId": "customer-123",
  "isNewCustomer": false,
  "priority": "normal",
  "delay": 0,
  "metadata": {
    "source": "api",
    "tags": ["ecommerce"]
  }
}
```

#### Full Crawl Job

```json
{
  "type": "full-crawl",
  "url": "https://example.com",
  "maxPages": 100,
  "depth": 3,
  "includeSubdomains": false,
  "customerId": "customer-123"
}
```

#### Refresh Job

```json
{
  "type": "refresh",
  "url": "https://example.com",
  "lastCrawledAt": "2024-01-01T00:00:00.000Z",
  "forceRefresh": false,
  "fullRefresh": true,
  "customerId": "customer-123"
}
```

#### Batch Job Creation

```json
{
  "type": "single-page",
  "urls": [
    "https://example.com/page1",
    "https://example.com/page2",
    "https://example.com/page3"
  ],
  "customerId": "customer-123",
  "staggerDelay": 1000
}
```

#### Recurring Job Creation

```json
{
  "type": "refresh",
  "url": "https://example.com",
  "cronPattern": "0 0 * * *",
  "customerId": "customer-123"
}
```

#### Response Examples

**Single Job Created:**
```json
{
  "success": true,
  "jobId": "job_abc123",
  "type": "single-page",
  "url": "https://example.com",
  "message": "Job created successfully",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Job Deduplicated:**
```json
{
  "success": true,
  "message": "Job was deduplicated (similar job already exists)",
  "deduplicated": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Batch Jobs Created:**
```json
{
  "success": true,
  "message": "Created 3 jobs (1 deduplicated)",
  "results": {
    "total": 4,
    "successful": 3,
    "deduplicated": 1,
    "jobs": [
      {
        "jobId": "job_123",
        "url": "https://example.com/page1",
        "deduplicated": false
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Job Types

### single-page
Scrapes a single web page.

**Parameters:**
- `url` (required): The URL to scrape
- `customerId` (optional): Customer identifier
- `isNewCustomer` (optional): Boolean flag for new customer priority
- `config` (optional): Job-specific configuration
- `priority` (optional): Job priority level
- `delay` (optional): Delay in milliseconds before processing
- `metadata` (optional): Additional metadata

### full-crawl
Performs a comprehensive crawl of a website.

**Parameters:**
- `url` (required): Starting URL for the crawl
- `maxPages` (optional): Maximum number of pages to crawl
- `depth` (optional): Maximum depth to crawl
- `includeSubdomains` (optional): Whether to include subdomains
- `customerId` (optional): Customer identifier
- `config` (optional): Crawl-specific configuration

### refresh
Refreshes previously scraped content.

**Parameters:**
- `url` (required): The URL to refresh
- `lastCrawledAt` (optional): Timestamp of last crawl
- `forceRefresh` (optional): Force refresh even if recently crawled
- `fullRefresh` (optional): Perform full refresh vs incremental
- `customerId` (optional): Customer identifier

## Priority Levels

Jobs can be assigned different priority levels:

- `low` (1): Background processing
- `normal` (3): Default priority
- `high` (5): Expedited processing
- `urgent` (7): Highest priority
- `critical` (9): Emergency processing

## Error Handling

### 400 Bad Request
- Invalid job data
- Missing required fields
- Invalid priority values

```json
{
  "error": "Invalid job data",
  "details": [
    {
      "field": "url",
      "message": "Invalid URL format"
    }
  ]
}
```

### 500 Internal Server Error
- Job creation failed
- Queue system unavailable

```json
{
  "error": "Failed to create job",
  "details": "Queue system temporarily unavailable"
}
```

## Rate Limiting

- Maximum 100 URLs per batch job
- Recommended stagger delay of 1000ms for batch jobs
- Queue respects configured concurrency limits

## Integration Examples

### cURL Examples

**Create a single page job:**
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "type": "single-page",
    "url": "https://example.com",
    "customerId": "customer-123",
    "priority": "high"
  }'
```

**Get job statistics:**
```bash
curl "http://localhost:3000/api/jobs?includeStats=true&includeHealth=true&limit=20"
```

**Filter jobs by customer:**
```bash
curl "http://localhost:3000/api/jobs?customerId=customer-123&status=active"
```

### TypeScript Integration

```typescript
import { JobUtils, JobPriority } from '@/lib/queue';

// Create a high-priority job for a new customer
const result = await JobUtils.createSinglePageJob('https://example.com', {
  customerId: 'customer-123',
  isNewCustomer: true,
  priority: JobPriority.HIGH,
  metadata: { source: 'dashboard' }
});

// Create batch jobs
const batchResult = await JobUtils.createBatchJobs(
  ['https://example.com/1', 'https://example.com/2'],
  'single-page',
  {
    customerId: 'customer-123',
    staggerDelay: 2000
  }
);
```

## Monitoring and Analytics

The Jobs API integrates with the queue monitoring system to provide:
- Real-time job statistics
- Queue health metrics
- Processing performance data
- Deduplication statistics

Access detailed monitoring via:
- `GET /api/jobs?includeStats=true&includeHealth=true`
- `GET /api/queue` for comprehensive queue statistics

## Related APIs

- [Queue API](/app/api/queue/README.md) - Queue management operations
- [Job Status API](/app/api/jobs/[jobId]/README.md) - Individual job management