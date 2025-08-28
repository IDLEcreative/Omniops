# Scrape Jobs API

The Scrape Jobs API manages the database-backed scraping job system. This API handles job creation, listing, and management for web scraping operations with persistent storage in Supabase.

## Endpoints

### GET /api/scrape-jobs

Get scrape jobs with filtering, pagination, and sorting options.

#### Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `domain` | string | Filter jobs by domain | - |
| `status` | string | Comma-separated list of statuses to filter by | - |
| `job_type` | string | Filter by job type | - |
| `limit` | number | Maximum number of jobs to return | 50 |
| `offset` | number | Number of jobs to skip for pagination | 0 |
| `order_by` | string | Field to sort by (`created_at`, `updated_at`, `status`, `priority`) | `created_at` |
| `order_direction` | string | Sort direction (`asc`, `desc`) | `desc` |

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "domain_id": "456e7890-e89b-12d3-a456-426614174000",
      "customer_config_id": "789e0123-e89b-12d3-a456-426614174000",
      "domain": "example.com",
      "job_type": "domain_scrape",
      "status": "pending",
      "priority": 5,
      "retry_count": 0,
      "max_retries": 3,
      "config": {
        "depth": 3,
        "timeout": 30000,
        "userAgent": "CustomBot/1.0"
      },
      "metadata": {
        "source": "api",
        "tags": ["ecommerce", "products"]
      },
      "started_at": null,
      "completed_at": null,
      "error_message": null,
      "stats": {},
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 125,
    "has_more": true
  }
}
```

### POST /api/scrape-jobs

Create a new scrape job with domain validation and duplicate prevention.

#### Request Body

```json
{
  "domain": "example.com",
  "job_type": "domain_scrape",
  "priority": 5,
  "config": {
    "depth": 3,
    "maxPages": 100,
    "timeout": 30000,
    "respectRobots": true,
    "userAgent": "CustomBot/1.0",
    "includeSubdomains": false
  },
  "metadata": {
    "source": "dashboard",
    "tags": ["ecommerce"],
    "requestedBy": "user@example.com"
  }
}
```

#### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `domain` | string | Yes | Domain to scrape (without protocol) |
| `job_type` | string | No | Type of scraping job | Default: `domain_scrape` |
| `priority` | number | No | Priority level (1-10, higher = more priority) | Default: 5 |
| `config` | object | No | Job-specific configuration options | Default: `{}` |
| `metadata` | object | No | Additional metadata and tags | Default: `{}` |

#### Configuration Options

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `depth` | number | Maximum crawl depth | 3 |
| `maxPages` | number | Maximum pages to scrape | 100 |
| `timeout` | number | Request timeout in milliseconds | 30000 |
| `respectRobots` | boolean | Respect robots.txt rules | true |
| `userAgent` | string | User agent string | System default |
| `includeSubdomains` | boolean | Include subdomains in crawl | false |
| `delay` | number | Delay between requests (ms) | 1000 |
| `retryOnFailure` | boolean | Retry failed requests | true |

#### Response

**Success (201):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "domain": "example.com",
    "job_type": "domain_scrape",
    "status": "pending",
    "priority": 5,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "message": "Scrape job created successfully"
}
```

## Job Status Values

| Status | Description |
|--------|-------------|
| `pending` | Job created and waiting to be processed |
| `running` | Job is currently being executed |
| `completed` | Job finished successfully |
| `failed` | Job failed and will not be automatically retried |
| `cancelled` | Job was cancelled by user or system |

## Job Types

| Type | Description |
|------|-------------|
| `domain_scrape` | Full domain scraping (default) |
| `single_page` | Single page scrape |
| `sitemap_crawl` | Crawl based on sitemap |
| `product_catalog` | E-commerce product scraping |
| `content_update` | Update existing scraped content |

## Priority Levels

| Priority | Level | Use Case |
|----------|-------|----------|
| 1-2 | Low | Background maintenance tasks |
| 3-4 | Below Normal | Regular content updates |
| 5 | Normal | Standard scraping jobs (default) |
| 6-7 | Above Normal | Important customer requests |
| 8-9 | High | Urgent or premium customers |
| 10 | Critical | Emergency or time-sensitive jobs |

## Error Handling

### 400 Bad Request

**Missing Domain:**
```json
{
  "success": false,
  "error": "Domain is required"
}
```

**Invalid Priority:**
```json
{
  "success": false,
  "error": "Priority must be between 1 and 10"
}
```

**Invalid Configuration:**
```json
{
  "success": false,
  "error": "maxPages must be a positive number"
}
```

### 409 Conflict

**Duplicate Job:**
```json
{
  "success": false,
  "error": "A pending job already exists for domain: example.com"
}
```

### 500 Internal Server Error

**Database Error:**
```json
{
  "success": false,
  "error": "Failed to create scrape job",
  "details": "Database connection failed"
}
```

## ScrapeJob Interface

```typescript
interface ScrapeJob {
  id: string;                    // UUID
  domain_id?: string;            // Foreign key to domains table
  customer_config_id?: string;   // Foreign key to customer_configs table
  domain: string;                // Domain to scrape
  job_type: string;              // Type of scraping job
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: number;              // 1-10 priority level
  retry_count: number;           // Current retry attempt
  max_retries: number;           // Maximum retry attempts
  config: Record<string, any>;   // Job configuration
  metadata: Record<string, any>; // Additional metadata
  started_at?: string;           // ISO timestamp when job started
  completed_at?: string;         // ISO timestamp when job completed
  error_message?: string;        // Error details if failed
  stats: Record<string, any>;    // Performance and processing stats
  created_at: string;            // ISO timestamp of creation
  updated_at: string;            // ISO timestamp of last update
}

interface CreateScrapeJobOptions {
  domain: string;
  job_type?: string;
  priority?: number;
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}
```

## Usage Examples

### cURL Examples

**List all scrape jobs:**
```bash
curl "http://localhost:3000/api/scrape-jobs"
```

**Filter jobs by domain and status:**
```bash
curl "http://localhost:3000/api/scrape-jobs?domain=example.com&status=pending,running"
```

**Get jobs with pagination:**
```bash
curl "http://localhost:3000/api/scrape-jobs?limit=20&offset=40&order_by=priority&order_direction=desc"
```

**Create a new scrape job:**
```bash
curl -X POST "http://localhost:3000/api/scrape-jobs" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "job_type": "domain_scrape",
    "priority": 7,
    "config": {
      "depth": 5,
      "maxPages": 200,
      "respectRobots": true,
      "includeSubdomains": false
    },
    "metadata": {
      "source": "api",
      "tags": ["high-priority", "customer-123"]
    }
  }'
```

### TypeScript Integration

```typescript
import { scrapeJobManager } from '@/lib/scrape-job-manager';

// Create a scrape job
const job = await scrapeJobManager.createJob({
  domain: 'example.com',
  job_type: 'domain_scrape',
  priority: 7,
  config: {
    depth: 3,
    maxPages: 150,
    timeout: 45000,
    respectRobots: true
  },
  metadata: {
    source: 'dashboard',
    requestedBy: 'user@example.com'
  }
});

// Get jobs with filters
const result = await scrapeJobManager.getJobs({
  domain: 'example.com',
  status: ['pending', 'running'],
  limit: 20,
  order_by: 'priority',
  order_direction: 'desc'
});

console.log(`Found ${result.count} jobs`);
result.jobs.forEach(job => {
  console.log(`Job ${job.id}: ${job.domain} (${job.status})`);
});
```

### React Component Example

```typescript
import React, { useState, useEffect } from 'react';

interface ScrapeJobsListProps {
  domain?: string;
  status?: string[];
}

export function ScrapeJobsList({ domain, status }: ScrapeJobsListProps) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    offset: 0,
    limit: 20,
    total: 0,
    has_more: false
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      });

      if (domain) params.append('domain', domain);
      if (status) params.append('status', status.join(','));

      const response = await fetch(`/api/scrape-jobs?${params}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData: CreateScrapeJobOptions) => {
    try {
      const response = await fetch('/api/scrape-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      });

      const result = await response.json();
      if (result.success) {
        fetchJobs(); // Refresh the list
      }
      return result;
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [domain, status, pagination.offset]);

  if (loading) return <div>Loading scrape jobs...</div>;

  return (
    <div className="scrape-jobs-list">
      <div className="jobs-grid">
        {jobs.map(job => (
          <div key={job.id} className={`job-card status-${job.status}`}>
            <h3>{job.domain}</h3>
            <p>Status: {job.status}</p>
            <p>Priority: {job.priority}</p>
            <p>Type: {job.job_type}</p>
            {job.error_message && (
              <p className="error">Error: {job.error_message}</p>
            )}
          </div>
        ))}
      </div>
      
      <div className="pagination">
        <span>
          Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} 
          of {pagination.total}
        </span>
        {pagination.has_more && (
          <button onClick={() => setPagination(p => ({ ...p, offset: p.offset + p.limit }))}>
            Load More
          </button>
        )}
      </div>
    </div>
  );
}
```

## Database Integration

### Supabase Tables

**scrape_jobs table:**
- Links to `domains` and `customer_configs` tables
- Automatic timestamping with triggers
- Row-level security policies
- Indexed on domain, status, and created_at

**Related tables:**
- `domains`: Domain configuration and metadata
- `customer_configs`: Customer-specific settings
- `scrape_results`: Scraped content and data

### Database Triggers

The system uses database triggers to:
- Automatically create jobs when new domains are added
- Update timestamps on job status changes
- Send webhooks for job state changes
- Maintain job statistics

## Performance Considerations

- Jobs are indexed by domain and status for fast filtering
- Use pagination for large result sets
- Consider caching for frequently accessed job lists
- Monitor job creation rate to prevent queue overflow

## Security

- Domain validation prevents invalid URLs
- Priority limits prevent resource abuse
- Job metadata can be sanitized before storage
- Consider rate limiting for job creation

## Related APIs

- [Individual Scrape Job API](/app/api/scrape-jobs/[id]/README.md) - Single job management
- [Job Queue API](/app/api/scrape-jobs/next/README.md) - Worker job retrieval
- [Job Statistics API](/app/api/scrape-jobs/stats/README.md) - Analytics and reporting
- [Job Retry API](/app/api/scrape-jobs/[id]/retry/README.md) - Failure recovery
- [Webhooks API](/app/api/webhooks/customer/README.md) - Event notifications