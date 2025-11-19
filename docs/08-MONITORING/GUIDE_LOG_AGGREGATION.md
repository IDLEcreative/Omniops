# Log Aggregation Setup Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Structured logging utility
**Estimated Read Time:** 12 minutes

## Purpose

Complete guide to aggregating, searching, and analyzing logs from production applications using centralized logging services. Learn logging best practices, service comparisons, and how to set up log-based alerting.

## Quick Links

- [Structured Logger](../../lib/monitoring/logger.ts)
- [Logtail](https://betterstack.com/logtail)
- [Datadog Logs](https://www.datadoghq.com/product/log-management/)
- [Axiom](https://axiom.co/)

## Table of Contents

- [Overview](#overview)
- [Recommended Services](#recommended-services)
- [Logging Best Practices](#logging-best-practices)
- [Setup Instructions](#setup-instructions)
- [Search and Filtering](#search-and-filtering)
- [Log-Based Alerts](#log-based-alerts)
- [Retention Policies](#retention-policies)
- [Troubleshooting](#troubleshooting)

---

## Overview

Log aggregation centralizes logs from all servers/containers into one searchable interface:
- **Search across all logs**: Find specific requests by correlation ID
- **Filter by metadata**: Environment, service, user, error level
- **Create dashboards**: Visualize error rates, API performance
- **Set alerts**: Notify when errors spike or patterns appear
- **Retain history**: Keep logs for compliance (30-90 days)

**Why Not Just Console.log?**
- ❌ Logs disappear when container restarts
- ❌ Can't search across multiple servers
- ❌ No correlation between related logs
- ❌ Can't set alerts on log patterns

## Recommended Services

### 1. Logtail (Better Stack) - Recommended

**Pros:**
- Simple pricing: $0.25/GB ingested
- Unlimited retention (!)
- Excellent search and filtering
- Live tail (watch logs in real-time)
- SQL-based queries
- Generous free tier: 1GB/month

**Pricing:**
- **Free**: 1GB/month, 1-month retention
- **Pro**: $0.25/GB, unlimited retention, 5-second refresh
- **Enterprise**: Custom pricing

**Best For:** Startups, SaaS products, cost-conscious teams

### 2. Axiom

**Pros:**
- Unlimited users
- Generous free tier (500GB/month)
- Fast search (built on ClickHouse)
- No sampling (all logs captured)
- Great for high-volume apps

**Pricing:**
- **Free**: 500GB/month, 30-day retention
- **Team**: $25/month + $0.25/GB over 500GB
- **Pro**: Custom pricing

**Best For:** High-traffic applications, data-heavy workloads

### 3. Datadog Logs

**Pros:**
- Unified platform (logs + metrics + traces)
- Advanced analytics and ML
- Excellent APM integration
- Enterprise-grade

**Pricing:**
- **Pro**: $0.10/GB ingested (15-day retention)
- **Enterprise**: Custom pricing

**Best For:** Enterprise customers, existing Datadog users

### 4. Papertrail

**Pros:**
- Simple setup
- Free tier (50MB/month, 2-day retention)
- Good for small projects
- Easy search

**Pricing:**
- **Free**: 50MB/month, 2-day retention
- **Basic**: $7/month - 1GB/month, 7-day retention
- **Pro**: $47/month - 10GB/month, 1-year retention

**Best For:** Side projects, early-stage startups

## Logging Best Practices

### 1. Use Structured Logging

```typescript
// ❌ BAD: Unstructured string
console.log('User logged in: user@example.com');

// ✅ GOOD: Structured JSON
structuredLogger.info('User logged in', {
  userId: '123',
  email: 'user@example.com',
  domain: 'example.com',
  ip: '192.168.1.1',
});
```

### 2. Add Correlation IDs

```typescript
import { createRequestLogger } from '@/lib/monitoring/logger';

// Create logger with correlation ID for request
const { correlationId, logger } = withCorrelationId(request.headers);

logger.info('Processing checkout', { orderId: '456' });
logger.info('Payment successful', { amount: 99.99 });
// Both logs have same correlationId - can trace entire request
```

### 3. Log Levels

```typescript
// DEBUG: Detailed info for debugging (dev only)
logger.debug('Fetching user from database', { userId: '123' });

// INFO: Normal operations (production)
logger.info('Order placed', { orderId: '456', total: 99.99 });

// WARN: Something unusual but not broken
logger.warn('Rate limit approaching', { current: 950, limit: 1000 });

// ERROR: Something broke
logger.error('Payment failed', { orderId: '456' }, error);
```

### 4. Include Context

Always include:
- User ID
- Correlation ID
- Environment
- Service name
- Timestamp (automatic)
- Stack trace (for errors)

### 5. Don't Log Sensitive Data

```typescript
// ❌ NEVER log these:
logger.info('User login', {
  password: 'secret123',  // NO!
  creditCard: '4111...',  // NO!
  apiKey: 'sk_live_...',  // NO!
});

// ✅ Safe to log:
logger.info('User login', {
  userId: '123',
  email: 'user@example.com',
  success: true,
});
```

## Setup Instructions

### Logtail Setup

1. **Create Account**
   - Go to [betterstack.com/logtail](https://betterstack.com/logtail)
   - Sign up (free tier)

2. **Create Source**
   - Click "Add source"
   - Type: "HTTP"
   - Name: "Omniops Production"
   - Copy source token

3. **Install SDK**
   ```bash
   npm install @logtail/node
   ```

4. **Configure Logging**
   ```typescript
   // lib/monitoring/logtail.ts
   import { Logtail } from '@logtail/node';

   const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN!);

   export function sendToLogtail(level: string, message: string, context?: any) {
     logtail.log(message, level, context);
   }
   ```

5. **Add to Logger**
   ```typescript
   // In lib/monitoring/logger.ts
   import { sendToLogtail } from './logtail';

   console.info(formatLogEntry(entry));

   // Also send to Logtail in production
   if (process.env.NODE_ENV === 'production') {
     sendToLogtail(entry.level, entry.message, entry.context);
   }
   ```

6. **Set Environment Variable**
   ```bash
   # In .env.local
   LOGTAIL_SOURCE_TOKEN=your_source_token_here
   ```

### Axiom Setup

1. **Create Account**
   - Go to [axiom.co](https://axiom.co/)
   - Sign up (500GB/month free)

2. **Create Dataset**
   - Click "Datasets" → "New Dataset"
   - Name: `omniops-logs`
   - Click "Create"

3. **Get API Token**
   - Settings → API Tokens → "Create Token"
   - Name: `omniops-ingest`
   - Permission: Ingest
   - Copy token

4. **Install SDK**
   ```bash
   npm install @axiomhq/js
   ```

5. **Configure**
   ```typescript
   // lib/monitoring/axiom.ts
   import { Axiom } from '@axiomhq/js';

   const axiom = new Axiom({
     token: process.env.AXIOM_TOKEN!,
     orgId: process.env.AXIOM_ORG_ID,
   });

   export async function sendToAxiom(logs: any[]) {
     await axiom.ingest('omniops-logs', logs);
   }
   ```

## Search and Filtering

### Basic Search

```
# Find all errors
level:error

# Find specific user's activity
userId:123

# Find by correlation ID
correlationId:"2025-11-18-abc123"

# Find payment errors
message:"payment failed" AND level:error
```

### Advanced Queries

```
# Errors in last hour
level:error AND timestamp:>now-1h

# Slow API calls
duration:>5000 AND service:api

# Specific environment
environment:production AND level:error

# Combine filters
service:checkout AND level:error AND timestamp:>now-24h
```

### SQL Queries (Logtail)

```sql
-- Error rate by hour
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as error_count
FROM logs
WHERE level = 'error'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- Top error messages
SELECT
  message,
  COUNT(*) as count
FROM logs
WHERE level = 'error'
  AND timestamp > NOW() - INTERVAL '7 days'
GROUP BY message
ORDER BY count DESC
LIMIT 10;
```

## Log-Based Alerts

### Set Up Alerts

**Example: High Error Rate**
```
Query: level:error
Condition: Count > 100 in 5 minutes
Action: Send Slack notification to #alerts
```

**Example: Slow API**
```
Query: service:api AND duration:>5000
Condition: Count > 10 in 1 minute
Action: Page on-call engineer
```

**Example: Database Connection Errors**
```
Query: message:"database connection failed"
Condition: Any occurrence
Action: Send critical alert immediately
```

## Retention Policies

### Recommended Retention

- **Production**: 90 days (compliance)
- **Staging**: 30 days
- **Development**: 7 days

### Cost Optimization

**Archive Old Logs:**
1. Export logs to S3/GCS monthly
2. Compress with gzip (80-90% compression)
3. Delete from log service
4. Keep archive for 1 year (compliance)

**Sample High-Volume Logs:**
```typescript
// Don't log EVERY successful request
if (Math.random() < 0.1) { // 10% sampling
  logger.info('Request processed', context);
}

// But ALWAYS log errors
if (error) {
  logger.error('Request failed', context, error);
}
```

## Troubleshooting

### Logs Not Appearing

1. **Check source token**: Verify `LOGTAIL_SOURCE_TOKEN` is set
2. **Check network**: Logs sent to external service (not blocked by firewall)
3. **Check production check**: Logger might only send in production
4. **Check rate limits**: Free tier might have daily limits

### High Costs

1. **Reduce log volume**: Sample high-frequency logs
2. **Shorten retention**: 30 days instead of 90
3. **Filter noise**: Don't log successful health checks
4. **Compress before sending**: Use gzip compression

### Can't Find Logs

1. **Check time range**: Logs might be outside selected range
2. **Check filters**: Remove restrictive filters
3. **Check correlation ID**: Make sure format matches exactly
4. **Check service name**: Verify correct service/environment

## Next Steps

- [Configure Performance Monitoring](./GUIDE_PERFORMANCE_MONITORING.md)
- [Review Alerting Guide](./GUIDE_ALERTING.md)
- [See Structured Logger](../../lib/monitoring/logger.ts)

## Resources

- [Logtail Documentation](https://betterstack.com/docs/logs/)
- [Axiom Documentation](https://axiom.co/docs)
- [Structured Logging Guide](https://www.datadoghq.com/blog/structured-logging/)
- [Log Retention Best Practices](https://www.loggly.com/ultimate-guide/log-retention/)
