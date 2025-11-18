# Customer Webhooks API

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Scrape Jobs API](/home/user/Omniops/app/api/scrape-jobs/README.md), [Queue Management](/home/user/Omniops/app/api/queue/README.md), [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
**Estimated Read Time:** 15 minutes

## Purpose

Complete technical reference for the Customer Webhooks API handling incoming webhooks from Supabase database changes and external scraping job notifications. This API processes webhook events, triggers automated job creation, manages database change workflows, and provides signature verification for secure webhook processing.

## Quick Links

- [API Routes Documentation](/home/user/Omniops/app/api/README.md)
- [Scrape Jobs API](/home/user/Omniops/app/api/scrape-jobs/README.md)
- [Queue Management API](/home/user/Omniops/app/api/queue/README.md)
- [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

## Table of Contents

- [Purpose](#purpose)
- [Quick Links](#quick-links)
- [Endpoints](#endpoints)
  - [POST /api/webhooks/customer](#post-apiwebhookscustomer)
  - [GET /api/webhooks/customer](#get-apiwebhookscustomer)
- [Webhook Payload Types](#webhook-payload-types)
  - [1. Scrape Job Notifications](#1-scrape-job-notifications)
  - [2. Database Change Events](#2-database-change-events)
- [Error Handling](#error-handling)
- [Security](#security)
- [Usage Examples](#usage-examples)
- [Monitoring and Observability](#monitoring-and-observability)
- [Best Practices](#best-practices)
- [Related APIs](#related-apis)
- [Keywords](#keywords)

---

The Customer Webhooks API handles incoming webhooks from Supabase database changes and external scraping job notifications. This endpoint processes events and triggers automated job creation and processing workflows.

## Endpoints

### POST /api/webhooks/customer

Process incoming webhooks from Supabase database changes and scraping systems.

#### Request Headers

| Header | Type | Description | Required |
|--------|------|-------------|----------|
| `x-supabase-signature` | string | Webhook signature for verification | Optional* |
| `Content-Type` | string | Must be `application/json` | Yes |

\* Required when `SUPABASE_WEBHOOK_SECRET` is configured

#### Webhook Types

The endpoint handles two types of webhook payloads:

1. **Scrape Job Notifications**
2. **Supabase Database Change Events**

### GET /api/webhooks/customer

Health check endpoint for webhook verification.

#### Response

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "endpoint": "customer-webhook"
}
```

## Webhook Payload Types

### 1. Scrape Job Notifications

Used for external scraping job status updates and notifications.

#### Payload Structure

```json
{
  "event": "scrape_job_created",
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "domain": "example.com",
  "job_type": "domain_scrape",
  "status": "pending",
  "priority": 7,
  "created_at": "2024-01-01T10:00:00.000Z",
  "metadata": {
    "source": "external_scraper",
    "customer_id": "customer-123",
    "estimated_duration": 180
  }
}
```

#### Supported Events

| Event | Description |
|-------|-------------|
| `scrape_job_created` | New scrape job has been created |
| `scrape_job_updated` | Job status or details have changed |
| `scrape_job_completed` | Job finished successfully |
| `scrape_job_failed` | Job failed and needs attention |

#### Processing Flow

1. **Validation**: Verify job exists and is in `pending` status
2. **Queue Integration**: Add job to processing queue
3. **Response**: Return success/failure status with queue ID

#### Response Examples

**Job Successfully Queued:**
```json
{
  "success": true,
  "message": "Job queued for processing",
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "queue_id": "queue_1640995200_abc123def"
}
```

**Job Not Found:**
```json
{
  "error": "Job not found or not pending",
  "job_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 2. Database Change Events

Handles Supabase database triggers for automated workflows.

#### Payload Structure

```json
{
  "type": "INSERT",
  "table": "customer_configs",
  "record": {
    "id": "456e7890-e89b-12d3-a456-426614174000",
    "customer_id": "customer-123",
    "domain": "example.com",
    "settings": {
      "scraping_enabled": true,
      "max_pages": 100
    },
    "metadata": {
      "created_by": "user@example.com"
    },
    "created_at": "2024-01-01T10:00:00.000Z",
    "updated_at": "2024-01-01T10:00:00.000Z"
  },
  "old_record": null,
  "schema": "public"
}
```

#### Supported Tables

| Table | Event Types | Description |
|-------|-------------|-------------|
| `customer_configs` | INSERT, UPDATE | Customer configuration changes |
| `domains` | INSERT, UPDATE | Domain management events |

#### Event Processing

##### Customer Config Changes

**New Configuration (INSERT):**
- Automatically creates initial scrape job for the domain
- Sets up monitoring and tracking
- Triggers welcome workflows

**Configuration Update (UPDATE):**
- Detects domain changes
- Updates existing jobs if needed
- Triggers re-scraping if settings changed significantly

**Example Response:**
```json
{
  "message": "Customer config webhook processed",
  "actions": [
    "Created initial scrape job",
    "Set up domain monitoring"
  ]
}
```

##### Domain Changes

**New Domain (INSERT):**
- Validates domain accessibility
- Creates domain profile
- Schedules initial crawl

**Domain Update (UPDATE):**
- Updates domain metadata
- Adjusts scraping parameters
- Re-validates domain settings

## Error Handling

### 400 Bad Request

**Unknown Webhook Format:**
```json
{
  "error": "Unknown webhook format",
  "details": "Payload does not match expected schemas"
}
```

**Missing Signature:**
```json
{
  "error": "Missing signature",
  "details": "x-supabase-signature header required when webhook secret is configured"
}
```

### 401 Unauthorized

**Invalid Signature:**
```json
{
  "error": "Invalid webhook signature",
  "details": "Signature verification failed"
}
```

### 404 Not Found

**Job Not Found:**
```json
{
  "error": "Job not found or not pending",
  "job_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 500 Internal Server Error

**Processing Error:**
```json
{
  "error": "Internal server error",
  "details": "Failed to process webhook"
}
```

**Queue System Error:**
```json
{
  "error": "Failed to queue job",
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "details": "Queue system temporarily unavailable"
}
```

## Security

### Webhook Signature Verification

When `SUPABASE_WEBHOOK_SECRET` is configured, all webhooks must include a valid signature:

```typescript
const signature = request.headers.get('x-supabase-signature');
const isValid = verifyWebhookSignature(payload, signature, secret);
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_WEBHOOK_SECRET` | Secret for signature verification | Optional |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

## Usage Examples

### cURL Examples

**Health Check:**
```bash
curl "http://localhost:3000/api/webhooks/customer"
```

**Send Scrape Job Webhook:**
```bash
curl -X POST "http://localhost:3000/api/webhooks/customer" \
  -H "Content-Type: application/json" \
  -H "x-supabase-signature: signature_here" \
  -d '{
    "event": "scrape_job_created",
    "job_id": "123e4567-e89b-12d3-a456-426614174000",
    "domain": "example.com",
    "job_type": "domain_scrape",
    "status": "pending",
    "priority": 7
  }'
```

**Send Database Change Webhook:**
```bash
curl -X POST "http://localhost:3000/api/webhooks/customer" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "INSERT",
    "table": "customer_configs",
    "record": {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "customer_id": "customer-123",
      "domain": "example.com",
      "settings": {"scraping_enabled": true}
    },
    "schema": "public"
  }'
```

### Supabase Database Function Setup

Create database functions to trigger webhooks:

```sql
-- Function to send webhook on customer_config changes
CREATE OR REPLACE FUNCTION notify_customer_config_change()
RETURNS trigger AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://your-domain.com/api/webhooks/customer',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := json_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD),
      'schema', TG_TABLE_SCHEMA
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER customer_config_webhook_trigger
  AFTER INSERT OR UPDATE ON customer_configs
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_config_change();

CREATE TRIGGER domain_webhook_trigger
  AFTER INSERT OR UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_config_change();
```

### Webhook Handler Implementation

```typescript
class WebhookProcessor {
  async processWebhook(payload: any) {
    // Determine webhook type
    if (payload.event) {
      return await this.processScrapeJobWebhook(payload);
    } else if (payload.type && payload.table) {
      return await this.processDatabaseWebhook(payload);
    } else {
      throw new Error('Unknown webhook format');
    }
  }

  async processScrapeJobWebhook(payload: ScrapeJobWebhookPayload) {
    const { job_id, domain, job_type, priority } = payload;

    // Verify job exists in database
    const job = await this.verifyJob(job_id);
    if (!job) {
      throw new Error('Job not found or not in pending status');
    }

    // Add to processing queue
    const queueResult = await this.addToQueue(job);
    
    return {
      success: true,
      message: 'Job queued for processing',
      job_id,
      queue_id: queueResult.queue_id
    };
  }

  async processDatabaseWebhook(payload: SupabaseWebhookPayload) {
    const { type, table, record } = payload;

    switch (table) {
      case 'customer_configs':
        return await this.handleCustomerConfigChange(type, record);
      case 'domains':
        return await this.handleDomainChange(type, record);
      default:
        return { message: `Webhook for table ${table} not handled` };
    }
  }

  async handleCustomerConfigChange(type: string, record: any) {
    if (type === 'INSERT' && record.domain) {
      // Create initial scrape job for new configuration
      await this.createInitialScrapeJob(record);
      return { 
        message: 'Customer config webhook processed',
        actions: ['Created initial scrape job']
      };
    }
    
    return { message: 'Customer config webhook processed' };
  }

  async createInitialScrapeJob(config: any) {
    const jobData = {
      domain: config.domain,
      job_type: 'initial_scrape',
      priority: 6, // Higher priority for new customers
      config: {
        depth: 2,
        maxPages: config.settings?.max_pages || 50,
        timeout: 30000
      },
      metadata: {
        source: 'webhook',
        customer_id: config.customer_id,
        trigger: 'new_customer_config'
      }
    };

    // Use scrape job manager to create job
    return await scrapeJobManager.createJob(jobData);
  }
}
```

### Integration Testing

```typescript
describe('Customer Webhook API', () => {
  it('should process scrape job webhooks', async () => {
    const payload = {
      event: 'scrape_job_created',
      job_id: 'test-job-id',
      domain: 'example.com',
      job_type: 'domain_scrape',
      status: 'pending',
      priority: 5
    };

    const response = await fetch('/api/webhooks/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.job_id).toBe('test-job-id');
  });

  it('should handle database change webhooks', async () => {
    const payload = {
      type: 'INSERT',
      table: 'customer_configs',
      record: {
        id: 'test-config-id',
        domain: 'example.com',
        customer_id: 'customer-123'
      },
      schema: 'public'
    };

    const response = await fetch('/api/webhooks/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    expect(data.message).toContain('processed');
  });

  it('should return health status on GET', async () => {
    const response = await fetch('/api/webhooks/customer');
    const data = await response.json();
    
    expect(data.status).toBe('ok');
    expect(data.endpoint).toBe('customer-webhook');
  });
});
```

## Monitoring and Observability

### Webhook Metrics

Track webhook processing metrics:

```json
{
  "webhookMetrics": {
    "totalReceived": 1250,
    "processed": 1200,
    "failed": 50,
    "successRate": 0.96,
    "avgProcessingTime": 245.5,
    "byType": {
      "scrape_job_created": 800,
      "customer_config_insert": 300,
      "domain_insert": 100
    },
    "errors": {
      "signature_verification": 15,
      "job_not_found": 20,
      "queue_system_error": 10,
      "unknown_format": 5
    }
  }
}
```

### Logging

Comprehensive logging for webhook events:

```typescript
logger.info('Webhook received', {
  type: payload.type || payload.event,
  table: payload.table,
  domain: payload.domain || payload.record?.domain,
  timestamp: new Date().toISOString()
});

logger.error('Webhook processing failed', {
  payload,
  error: error.message,
  stack: error.stack
});
```

### Alerting

Set up alerts for:
- High webhook failure rates (>5%)
- Missing webhook signatures
- Queue system errors
- Unusual webhook traffic patterns

## Best Practices

### Idempotency

Handle duplicate webhooks gracefully:
- Check for existing jobs before creating new ones
- Use idempotency keys where possible
- Log duplicate webhook attempts

### Error Handling

- Return appropriate HTTP status codes
- Provide detailed error messages for debugging
- Implement retry logic for temporary failures
- Dead letter queue for failed webhooks

### Security

- Always verify webhook signatures in production
- Use HTTPS for webhook endpoints
- Rate limit webhook endpoints
- Log security events and anomalies

### Performance

- Process webhooks asynchronously when possible
- Use connection pooling for database operations
- Implement webhook queuing for high volume
- Monitor processing times and optimize bottlenecks

## Related APIs

- [Scrape Jobs API](/home/user/Omniops/app/api/scrape-jobs/README.md) - Job creation triggered by webhooks
- [Individual Scrape Job API](/home/user/Omniops/app/api/scrape-jobs/[id]/README.md) - Job status updates
- [Queue API](/home/user/Omniops/app/api/queue/README.md) - Queue management for webhook processing
- [Customer Configuration](/home/user/Omniops/app/api/customer/README.md) - Customer config management

## Keywords

**API Categories:** webhooks, event processing, database triggers, automation, job orchestration

**Core Features:** webhook handling, signature verification, event processing, job creation, database change notifications, automated workflows, health check endpoint

**Technologies:** Supabase webhooks, database triggers, PostgreSQL, HMAC signatures, webhook security, event-driven architecture

**Operations:** process webhooks, verify signatures, queue jobs, handle database changes, trigger workflows, validate payloads, health checks

**Webhook Types:** scrape job notifications, database change events, customer config changes, domain changes

**Events:** scrape_job_created, scrape_job_updated, scrape_job_completed, scrape_job_failed, INSERT, UPDATE

**Tables:** customer_configs, domains, scrape_jobs

**Security:** signature verification, HMAC validation, webhook authentication, HTTPS enforcement, rate limiting

**Integrations:** Supabase database functions, job queue system, scraping jobs, customer configurations

**Aliases:**
- "webhook endpoint" (also known as: webhook handler, event receiver, notification endpoint)
- "signature verification" (also known as: webhook authentication, HMAC validation, webhook security)
- "database triggers" (also known as: database webhooks, change notifications, database events)
- "automated workflows" (also known as: event-driven automation, webhook automation, triggered actions)