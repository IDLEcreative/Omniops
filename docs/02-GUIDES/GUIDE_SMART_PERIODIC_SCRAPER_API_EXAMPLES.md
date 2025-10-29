# Smart Periodic Scraper - API Request/Response Examples

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [Smart Periodic Scraper Deployment](GUIDE_SMART_PERIODIC_SCRAPER_DEPLOYMENT_CHECKLIST.md)
- [Scraper Enhancements](GUIDE_SCRAPER_ENHANCEMENTS.md)
- [API Documentation](../03-API/)
**Estimated Read Time:** 35 minutes

## Purpose
Complete API request/response examples for smart periodic scraper including configuration management, manual scraping control, job monitoring, analytics, schedule management, smart mode features, webhooks, and error handling. Provides production-ready client SDK examples.

## Quick Links
- [Configuration Management APIs](#1-configuration-management-apis)
- [Manual Scraping Control APIs](#2-manual-scraping-control-apis)
- [Job Status and Monitoring APIs](#3-job-status-and-monitoring-apis)
- [Analytics and Reporting APIs](#4-analytics-and-reporting-apis)
- [Schedule Management APIs](#5-schedule-management-apis)
- [Smart Mode APIs](#6-smart-mode-apis)
- [Error Handling Examples](#7-error-handling-examples)
- [Client SDK Examples](#client-sdk-examples)
- [Webhook Integration Examples](#webhook-integration-examples)

## Keywords
smart periodic scraper, scraper API, API examples, configuration management, job monitoring, WebSocket streaming, analytics API, schedule management, smart mode, AI-optimized scraping, webhook integration, rate limiting, error handling, client SDK, REST API

## Aliases
- "smart scraper" (also known as: intelligent scraper, adaptive scraper, AI-optimized crawler)
- "job monitoring" (also known as: progress tracking, scraping status, real-time updates)
- "WebSocket streaming" (also known as: real-time progress, live updates, job streaming)
- "smart mode" (also known as: AI mode, intelligent scheduling, adaptive optimization)
- "schedule management" (also known as: cron configuration, scraping schedule, periodic scraping)

---

## Complete API Implementation Examples

### 1. Configuration Management APIs

#### Create Initial Configuration
```typescript
// POST /api/scraping/config
// Request
const createConfig = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_TOKEN'
  },
  body: JSON.stringify({
    domain: 'https://www.thompsonseparts.co.uk',
    mode: 'scheduled',
    schedule: {
      frequency: 'daily',
      timezone: 'Europe/London',
      time: '03:00'
    },
    advanced: {
      pageTypeSchedules: {
        'product': 'every 6 hours',
        'category': 'every 12 hours',
        'news': 'every 2 hours',
        'static': 'weekly'
      },
      maxConcurrent: 10,
      requestDelay: 500
    }
  })
};

// Response (201 Created)
{
  "success": true,
  "data": {
    "configId": "550e8400-e29b-41d4-a716-446655440000",
    "domain": "https://www.thompsonseparts.co.uk",
    "mode": "scheduled",
    "status": "active",
    "nextRun": "2025-01-28T03:00:00Z",
    "message": "Configuration created successfully. Initial full scrape scheduled."
  }
}
```

#### Get Current Configuration
```typescript
// GET /api/scraping/config?domain=thompsonseparts.co.uk
// Response (200 OK)
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "domain": "https://www.thompsonseparts.co.uk",
    "mode": "scheduled",
    "isActive": true,
    "schedule": {
      "frequency": "daily",
      "timezone": "Europe/London",
      "time": "03:00",
      "nextRun": "2025-01-28T03:00:00Z",
      "lastRun": "2025-01-27T03:00:00Z"
    },
    "statistics": {
      "totalPages": 2418,
      "lastFullScrape": "2025-01-25T15:30:00Z",
      "lastIncrementalCheck": "2025-01-27T03:00:00Z",
      "changesDetectedToday": 47,
      "changesDetectedThisWeek": 312,
      "averageCheckTime": "15 minutes",
      "costSavings": "92.3%"
    },
    "pageBreakdown": {
      "products": 1022,
      "categories": 1336,
      "news": 15,
      "static": 45
    }
  }
}
```

### 2. Manual Scraping Control APIs

#### Start Manual Full Scrape
```typescript
// POST /api/scraping/start
// Request
{
  "configId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "full",
  "options": {
    "turboMode": true,
    "maxPages": 5000,
    "notifyOnCompletion": true
  }
}

// Response (202 Accepted)
{
  "success": true,
  "data": {
    "jobId": "job_1756400000000_xyz123",
    "type": "full",
    "status": "queued",
    "estimatedDuration": 420, // minutes
    "estimatedCompletion": "2025-01-27T10:00:00Z",
    "message": "Full scrape job queued. You will be notified upon completion.",
    "statusUrl": "/api/scraping/status/job_1756400000000_xyz123"
  }
}
```

#### Start Smart Incremental Check
```typescript
// POST /api/scraping/start
// Request
{
  "configId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "smart",
  "options": {
    "priorityPageTypes": ["product", "news"],
    "changeThreshold": 0.1,
    "maxDuration": 30 // minutes
  }
}

// Response (202 Accepted)
{
  "success": true,
  "data": {
    "jobId": "job_1756400100000_abc456",
    "type": "smart",
    "status": "running",
    "strategy": "adaptive",
    "estimatedPages": 350,
    "estimatedDuration": 15,
    "message": "Smart check initiated. Prioritizing frequently changing pages."
  }
}
```

### 3. Job Status and Monitoring APIs

#### Get Job Status with Progress
```typescript
// GET /api/scraping/status/job_1756400000000_xyz123
// Response (200 OK)
{
  "success": true,
  "data": {
    "jobId": "job_1756400000000_xyz123",
    "type": "full",
    "status": "running",
    "progress": {
      "percentage": 67,
      "pagesProcessed": 1620,
      "totalPages": 2418,
      "changesDetected": 234,
      "errorsEncountered": 3
    },
    "timing": {
      "startedAt": "2025-01-27T03:00:00Z",
      "elapsedTime": 280, // minutes
      "estimatedTimeRemaining": 140,
      "estimatedCompletion": "2025-01-27T09:20:00Z"
    },
    "currentActivity": "Processing product pages (batch 17/25)",
    "performance": {
      "averagePageTime": 7.2, // seconds
      "pagesPerMinute": 8.3,
      "bandwidthUsed": "1.2 GB",
      "cpuUsage": "45%"
    }
  }
}
```

#### Stream Real-time Progress (WebSocket)
```javascript
// WebSocket connection for real-time updates
const ws = new WebSocket('wss://api.yourservice.com/scraping/stream');

ws.onopen = () => {
  ws.send(JSON.stringify({
    action: 'subscribe',
    jobId: 'job_1756400000000_xyz123'
  }));
};

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Progress update:', update);
};

// Example messages received
{
  "type": "progress",
  "jobId": "job_1756400000000_xyz123",
  "progress": 72,
  "pagesProcessed": 1741,
  "currentUrl": "https://www.thompsonseparts.co.uk/product/hydraulic-pump-123",
  "changeDetected": true
}

{
  "type": "milestone",
  "message": "Completed scraping all product pages",
  "pagesCompleted": 1022,
  "changesFound": 156
}
```

### 4. Analytics and Reporting APIs

#### Get Change Detection Analytics
```typescript
// GET /api/scraping/analytics?configId=550e8400&period=week
// Response (200 OK)
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-01-21T00:00:00Z",
      "end": "2025-01-28T00:00:00Z"
    },
    "summary": {
      "totalScrapingRuns": 14,
      "totalPagesChecked": 8451,
      "totalChangesDetected": 892,
      "averageChangeRate": 10.5,
      "totalDuration": 210, // minutes
      "costSavings": "$847.20"
    },
    "changePatterns": {
      "byPageType": [
        {
          "type": "product",
          "changesDetected": 567,
          "changeRate": 15.2,
          "peakChangeTimes": ["09:00-11:00", "14:00-16:00"]
        },
        {
          "type": "news",
          "changesDetected": 245,
          "changeRate": 82.3,
          "peakChangeTimes": ["08:00-09:00", "17:00-18:00"]
        },
        {
          "type": "category",
          "changesDetected": 78,
          "changeRate": 3.1,
          "peakChangeTimes": ["02:00-04:00"]
        }
      ],
      "byDayOfWeek": [
        { "day": "Monday", "changes": 189 },
        { "day": "Tuesday", "changes": 156 },
        { "day": "Wednesday", "changes": 134 },
        { "day": "Thursday", "changes": 167 },
        { "day": "Friday", "changes": 198 },
        { "day": "Saturday", "changes": 23 },
        { "day": "Sunday", "changes": 25 }
      ]
    },
    "recommendations": [
      {
        "type": "schedule_optimization",
        "message": "Product pages change most frequently between 9-11 AM. Consider checking them hourly during this period.",
        "estimatedImprovement": "23% faster change detection"
      },
      {
        "type": "resource_optimization",
        "message": "Static pages haven't changed in 30 days. Reduce checking frequency to monthly.",
        "estimatedSavings": "$120/month"
      }
    ]
  }
}
```

#### Get Page-Level Change History
```typescript
// GET /api/scraping/pages/changes?url=https://www.thompsonseparts.co.uk/product/hydraulic-pump-123
// Response (200 OK)
{
  "success": true,
  "data": {
    "url": "https://www.thompsonseparts.co.uk/product/hydraulic-pump-123",
    "pageType": "product",
    "firstSeen": "2025-01-15T10:30:00Z",
    "lastChecked": "2025-01-27T15:00:00Z",
    "totalChecks": 48,
    "totalChanges": 7,
    "averageChangeFrequency": "every 2.3 days",
    "recentChanges": [
      {
        "detectedAt": "2025-01-27T15:00:00Z",
        "changeType": "content",
        "changes": {
          "price": { "old": "£299.99", "new": "£279.99" },
          "stock": { "old": "In Stock (5)", "new": "In Stock (12)" }
        }
      },
      {
        "detectedAt": "2025-01-25T09:15:00Z",
        "changeType": "minor",
        "changes": {
          "description": "Updated product specifications"
        }
      }
    ],
    "metadata": {
      "title": "Heavy Duty Hydraulic Pump - Model HP-123",
      "contentHash": "a7b9c2d4e5f6789012345678",
      "contentLength": 45678,
      "lastModified": "2025-01-27T14:58:00Z"
    }
  }
}
```

### 5. Schedule Management APIs

#### Update Schedule Settings
```typescript
// PUT /api/scraping/schedule/550e8400-e29b-41d4-a716-446655440000
// Request
{
  "frequency": "custom",
  "customCron": "0 */2 * * *", // Every 2 hours
  "timezone": "America/New_York",
  "advancedRules": [
    {
      "pageType": "product",
      "schedule": "0 9,12,15,18 * * *", // 4 times daily
      "condition": "if_changes_detected > 10"
    },
    {
      "pageType": "news",
      "schedule": "*/30 * * * *", // Every 30 minutes
      "condition": "between_hours(8, 18)"
    }
  ]
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "scheduleId": "sched_789xyz",
    "configId": "550e8400-e29b-41d4-a716-446655440000",
    "frequency": "custom",
    "nextRuns": [
      {
        "time": "2025-01-27T18:00:00Z",
        "type": "incremental",
        "estimatedPages": 250
      },
      {
        "time": "2025-01-27T20:00:00Z",
        "type": "incremental",
        "estimatedPages": 250
      }
    ],
    "message": "Schedule updated successfully. Next run in 45 minutes."
  }
}
```

#### Pause/Resume Schedule
```typescript
// POST /api/scraping/schedule/550e8400/pause
// Response (200 OK)
{
  "success": true,
  "data": {
    "configId": "550e8400-e29b-41d4-a716-446655440000",
    "scheduleStatus": "paused",
    "pausedAt": "2025-01-27T16:30:00Z",
    "message": "Schedule paused. No automatic scraping will occur until resumed."
  }
}

// POST /api/scraping/schedule/550e8400/resume
// Response (200 OK)
{
  "success": true,
  "data": {
    "configId": "550e8400-e29b-41d4-a716-446655440000",
    "scheduleStatus": "active",
    "resumedAt": "2025-01-27T17:00:00Z",
    "nextRun": "2025-01-27T18:00:00Z",
    "message": "Schedule resumed. Next run in 1 hour."
  }
}
```

### 6. Smart Mode APIs

#### Enable Smart Mode (AI-Optimized)
```typescript
// POST /api/scraping/smart/enable
// Request
{
  "configId": "550e8400-e29b-41d4-a716-446655440000",
  "learningPeriod": 7, // days
  "optimization": {
    "goals": ["minimize_cost", "maximize_freshness"],
    "constraints": {
      "maxDailyRuns": 24,
      "maxMonthlyBudget": 500
    }
  }
}

// Response (200 OK)
{
  "success": true,
  "data": {
    "smartModeEnabled": true,
    "learningStatus": "analyzing_patterns",
    "currentStrategy": {
      "description": "Learning phase - collecting change pattern data",
      "estimatedLearningCompletion": "2025-02-03T00:00:00Z"
    },
    "projectedOptimization": {
      "costReduction": "65-75%",
      "freshnessImprovement": "40-50%",
      "efficiencyGain": "3.5x"
    }
  }
}
```

#### Get Smart Mode Recommendations
```typescript
// GET /api/scraping/smart/recommendations/550e8400
// Response (200 OK)
{
  "success": true,
  "data": {
    "analysisComplete": true,
    "confidence": 0.92,
    "recommendations": [
      {
        "priority": "high",
        "type": "schedule_adjustment",
        "current": "Every 6 hours for all pages",
        "recommended": "Dynamic per page type",
        "details": {
          "products": "Check at 9 AM and 3 PM daily",
          "news": "Check every 2 hours 8 AM - 6 PM",
          "categories": "Check daily at 3 AM",
          "static": "Check weekly on Sundays"
        },
        "impact": {
          "costSavings": "$312/month",
          "freshnessImprovement": "+45%",
          "resourceReduction": "72%"
        }
      },
      {
        "priority": "medium",
        "type": "crawl_optimization",
        "recommendation": "Use API endpoints for product data",
        "details": "Detected WooCommerce REST API availability",
        "impact": {
          "speedImprovement": "10x faster",
          "accuracyImprovement": "100%"
        }
      }
    ],
    "autoApply": {
      "available": true,
      "requiresConfirmation": true
    }
  }
}
```

### 7. Error Handling Examples

#### Rate Limited Response
```typescript
// Response (429 Too Many Requests)
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": "2025-01-27T17:00:00Z",
      "retryAfter": 1800 // seconds
    }
  },
  "headers": {
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": "1756400400"
  }
}
```

#### Validation Error
```typescript
// Response (400 Bad Request)
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "fields": {
        "frequency": "Invalid value 'every5minutes'. Must be one of: hourly, daily, weekly, monthly, custom",
        "maxConcurrent": "Value 150 exceeds maximum allowed (100)"
      }
    }
  }
}
```

#### Server Error with Recovery Info
```typescript
// Response (503 Service Unavailable)
{
  "success": false,
  "error": {
    "code": "SCRAPER_UNAVAILABLE",
    "message": "Scraping service temporarily unavailable",
    "details": {
      "reason": "High load - scaling up workers",
      "estimatedRecovery": "2025-01-27T17:15:00Z",
      "alternativeAction": "Your job has been queued and will start automatically when resources are available",
      "queuePosition": 14
    }
  }
}
```

## Client SDK Examples

### JavaScript/TypeScript Client
```typescript
import { ScrapingClient } from '@yourservice/scraping-sdk';

const client = new ScrapingClient({
  apiKey: 'YOUR_API_KEY',
  baseUrl: 'https://api.yourservice.com'
});

// Configure scraping
const config = await client.configs.create({
  domain: 'https://example.com',
  mode: 'scheduled',
  schedule: { frequency: 'daily', time: '03:00' }
});

// Start manual scrape
const job = await client.jobs.start({
  configId: config.id,
  type: 'incremental'
});

// Monitor progress
const unsubscribe = client.jobs.subscribe(job.id, (update) => {
  console.log(`Progress: ${update.progress}%`);
  if (update.status === 'completed') {
    console.log('Scraping complete!');
    unsubscribe();
  }
});

// Get analytics
const analytics = await client.analytics.get({
  configId: config.id,
  period: 'month'
});

console.log(`This month's savings: ${analytics.costSavings}`);
```

### Python Client
```python
from yourservice import ScrapingClient

client = ScrapingClient(api_key="YOUR_API_KEY")

# Configure scraping
config = client.configs.create(
    domain="https://example.com",
    mode="smart",
    optimization_goals=["minimize_cost", "maximize_freshness"]
)

# Start scraping job
job = client.jobs.start(
    config_id=config.id,
    type="full"
)

# Wait for completion
result = client.jobs.wait_for_completion(job.id, timeout=3600)
print(f"Scraped {result.pages_processed} pages, found {result.changes_detected} changes")

# Get recommendations
recommendations = client.smart.get_recommendations(config.id)
for rec in recommendations:
    print(f"{rec.type}: {rec.recommendation}")
    if rec.auto_apply_available:
        client.smart.apply_recommendation(rec.id)
```

## Webhook Integration Examples

### Configure Webhooks
```typescript
// POST /api/scraping/webhooks
{
  "configId": "550e8400-e29b-41d4-a716-446655440000",
  "webhooks": [
    {
      "url": "https://your-app.com/webhooks/scraping",
      "events": ["job.completed", "changes.detected", "error.occurred"],
      "secret": "webhook_secret_key"
    }
  ]
}
```

### Webhook Payload Examples
```typescript
// Job Completed Event
{
  "event": "job.completed",
  "timestamp": "2025-01-27T10:00:00Z",
  "data": {
    "jobId": "job_1756400000000_xyz123",
    "configId": "550e8400-e29b-41d4-a716-446655440000",
    "domain": "https://www.thompsonseparts.co.uk",
    "results": {
      "pagesProcessed": 2418,
      "changesDetected": 234,
      "duration": 420,
      "status": "success"
    }
  },
  "signature": "sha256=abcdef123456..." // HMAC signature
}

// Changes Detected Event
{
  "event": "changes.detected",
  "timestamp": "2025-01-27T09:15:00Z",
  "data": {
    "configId": "550e8400-e29b-41d4-a716-446655440000",
    "changes": [
      {
        "url": "https://www.thompsonseparts.co.uk/product/pump-123",
        "type": "product",
        "changeType": "price",
        "details": {
          "old": "£299.99",
          "new": "£279.99"
        }
      }
    ],
    "summary": {
      "total": 15,
      "byType": {
        "price": 8,
        "stock": 5,
        "content": 2
      }
    }
  }
}
```

## Rate Limiting Guidelines

| Endpoint | Rate Limit | Burst | Notes |
|----------|------------|-------|-------|
| Configuration APIs | 100/hour | 10/minute | Per API key |
| Start Scraping Job | 10/hour | 2/minute | Per domain |
| Status Check | 600/hour | 20/minute | Per job |
| Analytics | 100/hour | 10/minute | Per API key |
| WebSocket | 1 connection | - | Per job |

## Best Practices

1. **Always use pagination** for list endpoints
2. **Implement exponential backoff** for retries
3. **Subscribe to webhooks** instead of polling for large jobs
4. **Cache analytics data** as it updates hourly
5. **Use batch operations** when configuring multiple domains
6. **Implement proper error handling** for all failure scenarios
7. **Store job IDs** for tracking and debugging
8. **Use appropriate timeouts** for long-running operations