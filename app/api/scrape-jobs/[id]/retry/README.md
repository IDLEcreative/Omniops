# Job Retry API

The Job Retry API provides endpoints to retry failed scrape jobs. This API handles intelligent retry logic, tracks retry attempts, and manages retry limits to prevent infinite retry loops.

## Endpoints

### POST /api/scrape-jobs/[id]/retry

Retry a failed scrape job with automatic retry count management and failure analysis.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | UUID of the scrape job to retry |

#### Response

**Retry Successful:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "domain": "example.com",
    "job_type": "domain_scrape",
    "status": "pending",
    "priority": 7,
    "retry_count": 2,
    "max_retries": 3,
    "config": {
      "depth": 3,
      "maxPages": 100,
      "timeout": 30000,
      "respectRobots": true
    },
    "metadata": {
      "source": "api",
      "retryReason": "Automatic retry after timeout error",
      "lastError": "Request timeout",
      "retriedAt": "2024-01-01T12:00:00.000Z",
      "retriedBy": "system"
    },
    "error_message": null,
    "created_at": "2024-01-01T10:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
  },
  "message": "Job scheduled for retry (attempt 2/3)"
}
```

**Retry Limit Exceeded:**
```json
{
  "success": false,
  "error": "Job has exceeded maximum retry attempts",
  "details": {
    "jobId": "123e4567-e89b-12d3-a456-426614174000",
    "currentRetries": 3,
    "maxRetries": 3,
    "lastError": "Connection refused",
    "failurePattern": "network_connectivity"
  }
}
```

**Job Not Found:**
```json
{
  "success": false,
  "error": "Job not found"
}
```

**Job Cannot Be Retried:**
```json
{
  "success": false,
  "error": "Job cannot be retried",
  "details": {
    "currentStatus": "completed",
    "reason": "Job is not in a failed state"
  }
}
```

## Retry Logic

### Eligible Job States

Only jobs in specific states can be retried:

| Current Status | Can Retry | Notes |
|----------------|-----------|-------|
| `failed` | ✅ Yes | Primary use case for retry |
| `cancelled` | ❌ No | Cancelled jobs are intentionally stopped |
| `completed` | ❌ No | Successful jobs don't need retry |
| `running` | ❌ No | Jobs currently in progress |
| `pending` | ❌ No | Jobs not yet started |

### Retry Limits

**Default Configuration:**
- `max_retries`: 3 attempts
- Retry limit includes the original attempt
- After max retries reached, job status remains `failed`

**Retry Count Logic:**
```
Original attempt: retry_count = 0
First retry:      retry_count = 1
Second retry:     retry_count = 2
Third retry:      retry_count = 3 (final attempt)
```

### Retry Delay Strategy

The system implements exponential backoff for retries:

```typescript
const retryDelays = {
  1: 60,     // 1 minute
  2: 300,    // 5 minutes
  3: 900     // 15 minutes
};
```

## Error Analysis and Retry Strategy

### Failure Pattern Detection

The system analyzes failure patterns to optimize retry behavior:

#### Network-Related Errors
- **Timeout errors**: Increase timeout on retry
- **Connection refused**: Retry with exponential backoff
- **DNS resolution**: Immediate retry (might be temporary)

#### Rate Limiting Errors
- **429 Too Many Requests**: Longer delay before retry
- **503 Service Unavailable**: Exponential backoff
- **Rate limit headers**: Respect retry-after header

#### Content-Related Errors
- **404 Not Found**: Generally no retry (permanent error)
- **403 Forbidden**: Might retry with different user agent
- **500 Internal Server Error**: Retry with backoff

#### Configuration Adjustments

```json
{
  "retryConfig": {
    "timeout": 45000,
    "userAgent": "AlternateBot/2.0",
    "respectRetryAfter": true,
    "maxConcurrentRequests": 1,
    "delay": 2000
  }
}
```

## Error Handling

### 400 Bad Request

**Invalid Retry State:**
```json
{
  "success": false,
  "error": "Job cannot be retried",
  "details": {
    "currentStatus": "running",
    "reason": "Job is currently in progress"
  }
}
```

### 404 Not Found

**Job Not Found:**
```json
{
  "success": false,
  "error": "Job not found"
}
```

**Job Not Retryable:**
```json
{
  "success": false,
  "error": "Job not found or cannot be retried",
  "details": "Job may have been deleted or is in non-retryable state"
}
```

### 500 Internal Server Error

**Retry System Error:**
```json
{
  "success": false,
  "error": "Failed to retry scrape job",
  "details": "Unable to update job status in database"
}
```

## Usage Examples

### cURL Examples

**Basic retry:**
```bash
curl -X POST "http://localhost:3000/api/scrape-jobs/123e4567-e89b-12d3-a456-426614174000/retry"
```

### TypeScript Integration

```typescript
import { scrapeJobManager } from '@/lib/scrape-job-manager';

async function retryFailedJob(jobId: string) {
  try {
    const retriedJob = await scrapeJobManager.retryJob(jobId);
    
    if (retriedJob) {
      console.log(`Job ${jobId} scheduled for retry (attempt ${retriedJob.retry_count}/${retriedJob.max_retries})`);
      return retriedJob;
    }
  } catch (error) {
    if (error.message.includes('exceeded maximum retry')) {
      console.log(`Job ${jobId} has reached maximum retry limit`);
      // Handle permanent failure
      await handlePermanentFailure(jobId);
    } else {
      console.error(`Failed to retry job ${jobId}:`, error.message);
    }
    throw error;
  }
}

async function handlePermanentFailure(jobId: string) {
  // Log for investigation
  console.log(`Job ${jobId} permanently failed after all retries`);
  
  // Notify administrators or customers
  await notifyPermanentFailure(jobId);
  
  // Maybe schedule manual investigation
  await scheduleManualReview(jobId);
}
```

### Automated Retry System

```typescript
class AutomaticRetryManager {
  private retryQueue: string[] = [];
  private isProcessing: boolean = false;

  async scheduleRetry(jobId: string, delayMinutes: number = 0) {
    if (delayMinutes > 0) {
      setTimeout(() => {
        this.retryQueue.push(jobId);
        this.processRetryQueue();
      }, delayMinutes * 60 * 1000);
    } else {
      this.retryQueue.push(jobId);
      this.processRetryQueue();
    }
  }

  async processRetryQueue() {
    if (this.isProcessing || this.retryQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.retryQueue.length > 0) {
      const jobId = this.retryQueue.shift();
      
      try {
        await this.attemptRetry(jobId);
        await this.sleep(5000); // Avoid overwhelming the system
      } catch (error) {
        console.error(`Retry failed for job ${jobId}:`, error.message);
      }
    }

    this.isProcessing = false;
  }

  async attemptRetry(jobId: string) {
    try {
      const response = await fetch(`/api/scrape-jobs/${jobId}/retry`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        console.log(`Successfully retried job ${jobId}`);
        // Optionally track retry success metrics
        this.trackRetrySuccess(jobId, data.data.retry_count);
      } else {
        if (data.error.includes('exceeded maximum retry')) {
          console.log(`Job ${jobId} permanently failed`);
          await this.handlePermanentFailure(jobId);
        } else {
          console.error(`Retry failed for job ${jobId}: ${data.error}`);
        }
      }
    } catch (error) {
      console.error(`Network error retrying job ${jobId}:`, error);
      // Maybe schedule another retry later
      setTimeout(() => this.scheduleRetry(jobId), 300000); // 5 minutes
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private trackRetrySuccess(jobId: string, retryCount: number) {
    // Implementation for tracking retry metrics
  }

  private async handlePermanentFailure(jobId: string) {
    // Implementation for handling permanent failures
  }
}
```

### Bulk Retry Operations

```typescript
class BulkRetryManager {
  async retryFailedJobsByDomain(domain: string, maxRetries: number = 10) {
    const failedJobs = await this.getFailedJobsByDomain(domain);
    const results = [];

    for (const job of failedJobs.slice(0, maxRetries)) {
      try {
        const response = await fetch(`/api/scrape-jobs/${job.id}/retry`, {
          method: 'POST'
        });
        
        const data = await response.json();
        results.push({
          jobId: job.id,
          success: data.success,
          message: data.message || data.error
        });

        // Delay between retries to avoid overwhelming
        await this.sleep(2000);
      } catch (error) {
        results.push({
          jobId: job.id,
          success: false,
          message: error.message
        });
      }
    }

    return results;
  }

  async retryJobsByErrorPattern(errorPattern: string) {
    // Get jobs that failed with specific error pattern
    const jobs = await this.getJobsByErrorPattern(errorPattern);
    
    const retryPromises = jobs.map(async (job) => {
      try {
        const response = await fetch(`/api/scrape-jobs/${job.id}/retry`, {
          method: 'POST'
        });
        return await response.json();
      } catch (error) {
        return { success: false, error: error.message, jobId: job.id };
      }
    });

    return await Promise.all(retryPromises);
  }

  private async getFailedJobsByDomain(domain: string) {
    const response = await fetch(`/api/scrape-jobs?domain=${domain}&status=failed`);
    const data = await response.json();
    return data.success ? data.data : [];
  }

  private async getJobsByErrorPattern(errorPattern: string) {
    // Implementation to query jobs by error message pattern
    // This would require additional API endpoint or database query
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### React Retry Interface

```typescript
import React, { useState } from 'react';

interface RetryJobButtonProps {
  jobId: string;
  currentRetryCount: number;
  maxRetries: number;
  onRetrySuccess?: (job: any) => void;
  onRetryFailed?: (error: string) => void;
}

export function RetryJobButton({ 
  jobId, 
  currentRetryCount, 
  maxRetries, 
  onRetrySuccess, 
  onRetryFailed 
}: RetryJobButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState(null);

  const canRetry = currentRetryCount < maxRetries;

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryError(null);

    try {
      const response = await fetch(`/api/scrape-jobs/${jobId}/retry`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        onRetrySuccess?.(data.data);
      } else {
        setRetryError(data.error);
        onRetryFailed?.(data.error);
      }
    } catch (error) {
      setRetryError('Network error occurred');
      onRetryFailed?.('Network error occurred');
    } finally {
      setIsRetrying(false);
    }
  };

  if (!canRetry) {
    return (
      <div className="retry-exhausted">
        <span>Max retries reached ({currentRetryCount}/{maxRetries})</span>
        <span className="permanent-failure">Permanent failure</span>
      </div>
    );
  }

  return (
    <div className="retry-controls">
      <button 
        onClick={handleRetry} 
        disabled={isRetrying}
        className="retry-button"
      >
        {isRetrying ? 'Retrying...' : `Retry (${currentRetryCount}/${maxRetries})`}
      </button>
      
      {retryError && (
        <div className="retry-error">
          Failed to retry: {retryError}
        </div>
      )}
      
      <div className="retry-info">
        Next attempt will be attempt {currentRetryCount + 1} of {maxRetries}
      </div>
    </div>
  );
}
```

## Monitoring and Analytics

### Retry Metrics

Track important retry statistics:

```json
{
  "retryMetrics": {
    "totalRetries": 450,
    "retrySuccessRate": 0.67,
    "avgRetriesPerJob": 1.8,
    "retrysByErrorType": {
      "timeout": 180,
      "connection_refused": 120,
      "rate_limited": 90,
      "server_error": 60
    },
    "retryEffectiveness": {
      "firstRetrySuccess": 0.45,
      "secondRetrySuccess": 0.25,
      "thirdRetrySuccess": 0.15
    }
  }
}
```

### Failure Pattern Analysis

```typescript
class RetryAnalytics {
  async analyzeRetryPatterns() {
    const retryData = await this.getRetryData();
    
    return {
      mostRetriedDomains: this.getMostRetriedDomains(retryData),
      commonFailurePatterns: this.getFailurePatterns(retryData),
      retryEffectiveness: this.calculateRetryEffectiveness(retryData),
      recommendations: this.generateRecommendations(retryData)
    };
  }

  generateRecommendations(retryData: any) {
    const recommendations = [];

    // High timeout error rate
    if (retryData.timeoutErrors > retryData.totalErrors * 0.3) {
      recommendations.push({
        type: 'configuration',
        message: 'Consider increasing default timeout values',
        impact: 'high'
      });
    }

    // Low retry success rate
    if (retryData.retrySuccessRate < 0.5) {
      recommendations.push({
        type: 'strategy',
        message: 'Review retry strategy - success rate is low',
        impact: 'medium'
      });
    }

    return recommendations;
  }
}
```

## Best Practices

### When to Retry

**Good candidates for retry:**
- Network timeouts
- Temporary server errors (5xx)
- Rate limiting (with appropriate delays)
- DNS resolution failures
- Connection refused (might be temporary)

**Poor candidates for retry:**
- 404 Not Found (permanent)
- 401 Unauthorized (permission issue)
- 403 Forbidden (access denied)
- Malformed URLs or requests
- Site structure changes

### Retry Configuration

```json
{
  "retryStrategy": {
    "maxRetries": 3,
    "exponentialBackoff": true,
    "baseDelay": 60,
    "maxDelay": 900,
    "jitter": true,
    "respectRetryAfter": true
  }
}
```

### Monitoring

- Set up alerts for high retry rates
- Monitor permanent failure patterns
- Track retry success rates by error type
- Identify domains that frequently need retries

## Related APIs

- [Individual Scrape Job API](/app/api/scrape-jobs/[id]/README.md) - Job status and updates
- [Scrape Jobs API](/app/api/scrape-jobs/README.md) - Job listing and creation
- [Job Statistics API](/app/api/scrape-jobs/stats/README.md) - Analytics including retry metrics
- [Job Queue API](/app/api/scrape-jobs/next/README.md) - Worker job processing