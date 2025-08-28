# Job Status API

The Job Status API provides endpoints to manage individual jobs by their ID. This includes retrieving job status, updating job state (pause/resume/cancel), and deleting jobs.

## Endpoints

### GET /api/jobs/[jobId]

Get detailed status and information for a specific job.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `jobId` | string | Unique identifier for the job |

#### Response

```json
{
  "job": {
    "id": "job_abc123",
    "type": "single-page",
    "url": "https://example.com",
    "status": "active",
    "progress": 75,
    "data": {
      "url": "https://example.com",
      "customerId": "customer-123",
      "metadata": {
        "source": "api",
        "priority": "high"
      }
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "startedAt": "2024-01-01T00:01:00.000Z",
    "finishedAt": null,
    "processedOn": "worker-node-1",
    "attemptsMade": 1,
    "failedReason": null
  },
  "queueStats": {
    "waiting": 5,
    "active": 3,
    "completed": 150,
    "failed": 2
  },
  "timestamp": "2024-01-01T00:05:00.000Z"
}
```

#### Job Status Values

| Status | Description |
|--------|-------------|
| `waiting` | Job is queued and waiting to be processed |
| `active` | Job is currently being processed |
| `completed` | Job finished successfully |
| `failed` | Job failed and will not be retried |
| `paused` | Job has been paused |
| `stuck` | Job appears to be stuck and may need intervention |

### PUT /api/jobs/[jobId]

Update a job's state (pause, resume, or cancel).

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `jobId` | string | Unique identifier for the job |

#### Request Body

```json
{
  "action": "pause|resume|cancel"
}
```

#### Actions

| Action | Description | Valid States |
|--------|-------------|--------------|
| `pause` | Pause the job if it's active or waiting | `waiting`, `active` |
| `resume` | Resume a paused job | `paused` |
| `cancel` | Cancel and remove the job | `waiting`, `active`, `paused` |

#### Response

```json
{
  "success": true,
  "message": "Job paused successfully",
  "job": {
    "id": "job_abc123",
    "status": "paused",
    "updatedAt": "2024-01-01T00:05:00.000Z"
  },
  "timestamp": "2024-01-01T00:05:00.000Z"
}
```

### DELETE /api/jobs/[jobId]

Cancel and remove a job from the queue.

#### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `jobId` | string | Unique identifier for the job |

#### Response

```json
{
  "success": true,
  "message": "Job cancelled successfully",
  "jobId": "job_abc123",
  "timestamp": "2024-01-01T00:05:00.000Z"
}
```

## Error Handling

### 400 Bad Request

**Invalid Job ID:**
```json
{
  "error": "Job ID is required"
}
```

**Invalid Action:**
```json
{
  "error": "Invalid action. Must be \"pause\", \"resume\", or \"cancel\""
}
```

**Action Failed:**
```json
{
  "error": "Failed to pause job",
  "details": "Job is already completed"
}
```

### 404 Not Found

**Job Not Found:**
```json
{
  "error": "Job not found"
}
```

**Job Cannot Be Cancelled:**
```json
{
  "error": "Failed to cancel job or job not found"
}
```

### 500 Internal Server Error

**System Error:**
```json
{
  "error": "Failed to fetch job status",
  "details": "Queue system temporarily unavailable"
}
```

## Job Data Structure

### JobResponse Interface

```typescript
interface JobResponse extends JobStatus {
  logs?: string[];        // Optional job logs
  metrics?: any;          // Optional performance metrics
}

interface JobStatus {
  id: string;
  type: JobType;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'paused' | 'stuck';
  progress?: number;      // 0-100 percentage
  data: JobData;          // Original job data
  createdAt: Date;
  startedAt?: Date;
  finishedAt?: Date;
  processedOn?: string;   // Worker identifier
  attemptsMade: number;
  failedReason?: string;
  returnvalue?: any;      // Job result data
}
```

### JobUpdateRequest Interface

```typescript
interface JobUpdateRequest {
  action: 'pause' | 'resume' | 'cancel';
}
```

## Usage Examples

### cURL Examples

**Get job status:**
```bash
curl -X GET "http://localhost:3000/api/jobs/job_abc123"
```

**Pause a job:**
```bash
curl -X PUT "http://localhost:3000/api/jobs/job_abc123" \
  -H "Content-Type: application/json" \
  -d '{"action": "pause"}'
```

**Resume a job:**
```bash
curl -X PUT "http://localhost:3000/api/jobs/job_abc123" \
  -H "Content-Type: application/json" \
  -d '{"action": "resume"}'
```

**Cancel a job:**
```bash
curl -X DELETE "http://localhost:3000/api/jobs/job_abc123"
```

### TypeScript Integration

```typescript
import { getQueueManager } from '@/lib/queue/queue-manager';

const queueManager = getQueueManager();

// Get job status
const jobStatus = await queueManager.getJobStatus('job_abc123');
console.log('Job progress:', jobStatus?.progress);

// Pause a job
const pauseResult = await queueManager.pauseJob('job_abc123');
if (pauseResult) {
  console.log('Job paused successfully');
}

// Resume a job
const resumeResult = await queueManager.resumeJob('job_abc123');
if (resumeResult) {
  console.log('Job resumed successfully');
}

// Cancel a job
const cancelResult = await queueManager.cancelJob('job_abc123');
if (cancelResult) {
  console.log('Job cancelled successfully');
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useJobStatus(jobId: string) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        const data = await response.json();
        setJob(data.job);
      } catch (error) {
        console.error('Error fetching job status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobStatus();
    const interval = setInterval(fetchJobStatus, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [jobId]);

  const pauseJob = async () => {
    await fetch(`/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' })
    });
  };

  const resumeJob = async () => {
    await fetch(`/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resume' })
    });
  };

  const cancelJob = async () => {
    await fetch(`/api/jobs/${jobId}`, {
      method: 'DELETE'
    });
  };

  return { job, loading, pauseJob, resumeJob, cancelJob };
}
```

## Monitoring and Observability

### Job Progress Tracking

Jobs may include progress information (0-100%) for long-running operations:

```json
{
  "job": {
    "id": "job_abc123",
    "progress": 75,
    "status": "active",
    "data": {
      "totalPages": 100,
      "processedPages": 75
    }
  }
}
```

### Job Metrics

Some jobs may include performance metrics:

```json
{
  "job": {
    "id": "job_abc123",
    "metrics": {
      "processingTime": 45000,
      "memoryUsage": "120MB",
      "pagesProcessed": 75,
      "errorsEncountered": 2
    }
  }
}
```

## Security Considerations

- Job IDs should be treated as sensitive data
- Implement proper authentication before allowing job management operations
- Consider rate limiting for job status polling
- Log all job management actions for auditing

## Related APIs

- [Jobs API](/app/api/jobs/README.md) - Job creation and listing
- [Queue API](/app/api/queue/README.md) - Queue management operations