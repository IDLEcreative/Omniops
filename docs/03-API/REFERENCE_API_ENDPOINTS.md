# API Reference Guide

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Data models for API responses
- [Rate Limiting Architecture](../01-ARCHITECTURE/ARCHITECTURE_RATE_LIMITING.md) - Rate limit implementation
**Estimated Read Time:** 35 minutes

## Purpose
Complete API reference providing authentication methods (API key Bearer tokens), rate limiting specifications (100 req/min, 20 req/sec burst), endpoint documentation for chat, scraping, privacy, WooCommerce, Shopify, analytics, and management features, with request/response examples, error codes, and pagination patterns for all 50+ production endpoints.

## Quick Links
- [Authentication](#authentication) - API key setup
- [Rate Limiting](#rate-limiting) - Request limits and headers
- [Chat Endpoints](#chat-api) - Conversation management
- [Scraping Endpoints](#scraping-api) - Website content indexing
- [WooCommerce Endpoints](#woocommerce-api) - E-commerce integration
- [Privacy Endpoints](#privacy-api) - GDPR/CCPA compliance

## Keywords
API reference, REST API, authentication, rate limiting, endpoints, HTTP methods, request/response, JSON, API keys, Bearer tokens, pagination, error codes, webhooks, async processing, multi-tenant API, domain isolation

## Aliases
- "API key" (also known as: Bearer token, authentication token, access token, API token)
- "rate limiting" (also known as: throttling, request limiting, quota management, API limits)
- "pagination" (also known as: cursor pagination, page navigation, result batching)
- "webhook" (also known as: callback, event notification, HTTP push, API event)

---

## Overview

The Omniops API provides programmatic access to all customer service, analytics, and management features. This guide covers authentication, endpoints, request/response formats, and best practices.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

### API Key Authentication

All API requests require authentication using an API key in the request headers:

```http
Authorization: Bearer YOUR_API_KEY
X-Domain: your-customer-domain.com
```

### Obtaining API Keys

API keys can be generated through the dashboard or via the `/api/auth/generate-key` endpoint.

## Rate Limiting

- **Default Limit**: 100 requests per minute per domain
- **Burst Limit**: 20 requests per second
- **Headers Returned**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

## Common Response Formats

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error context
  },
  "timestamp": "2024-01-20T10:30:00Z"
}
```

## Core Endpoints

### Chat API

#### POST /api/chat
Process a chat message and return AI-generated response.

**Request Body:**
```json
{
  "message": "string",
  "conversationId": "string (optional)",
  "context": {
    "pageUrl": "string (optional)",
    "userId": "string (optional)"
  }
}
```

**Response:**
```json
{
  "response": "AI generated response",
  "conversationId": "uuid",
  "searchResults": [
    {
      "content": "string",
      "source": "string",
      "relevance": 0.95
    }
  ],
  "metadata": {
    "model": "gpt-4o-mini",
    "tokensUsed": 450,
    "searchCount": 3
  }
}
```

**Example:**
```bash
curl -X POST https://api.example.com/api/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are your business hours?",
    "conversationId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### Analytics API

#### GET /api/analytics/intelligence
Retrieve business intelligence metrics and insights.

**Query Parameters:**
- `metric` (string): One of `journey`, `content-gaps`, `peak-usage`, `conversion-funnel`, `all`
- `domain` (string): Filter by specific domain
- `startDate` (ISO 8601): Start of date range
- `endDate` (ISO 8601): End of date range
- `days` (number): Alternative to date range (default: 7)

**Response:**
```json
{
  "timeRange": {
    "start": "2024-01-13T00:00:00Z",
    "end": "2024-01-20T00:00:00Z"
  },
  "customerJourney": {
    "conversionRate": 0.23,
    "avgSessionsBeforeConversion": 3.4,
    "commonPaths": [
      {
        "path": ["landing", "products", "checkout"],
        "count": 145,
        "conversionRate": 0.67
      }
    ]
  },
  "contentGaps": [
    {
      "query": "return policy",
      "frequency": 23,
      "avgConfidence": 0.34
    }
  ],
  "summary": {
    "totalInsights": 5,
    "criticalCount": 1,
    "insights": [
      {
        "type": "warning",
        "metric": "conversion",
        "message": "Low conversion rate (23%). Consider optimizing user flow.",
        "priority": "high"
      }
    ]
  }
}
```

#### GET /api/monitoring/metrics
Retrieve real-time performance metrics.

**Query Parameters:**
- `format` (string): `json` or `prometheus`
- `operations` (string): Comma-separated list of operations to filter

**Prometheus Format Response:**
```
# HELP api_request_duration_ms API request duration in milliseconds
# TYPE api_request_duration_ms summary
api_request_duration_ms{operation="chat",quantile="0.5"} 120
api_request_duration_ms{operation="chat",quantile="0.95"} 450
api_request_duration_ms{operation="chat",quantile="0.99"} 1200
```

### Web Scraping API

#### POST /api/scrape
Initiate web scraping for a domain.

**Request Body:**
```json
{
  "url": "https://example.com",
  "options": {
    "maxPages": 100,
    "followLinks": true,
    "extractProducts": true,
    "extractFAQs": true
  }
}
```

**Response:**
```json
{
  "jobId": "job_123456",
  "status": "queued",
  "estimatedPages": 100,
  "webhookUrl": "https://api.example.com/api/webhooks/scrape/job_123456"
}
```

#### GET /api/scrape/status/{jobId}
Check the status of a scraping job.

**Response:**
```json
{
  "jobId": "job_123456",
  "status": "processing",
  "progress": {
    "pagesScraped": 45,
    "totalPages": 100,
    "percentComplete": 45
  },
  "startedAt": "2024-01-20T10:00:00Z",
  "estimatedCompletion": "2024-01-20T10:15:00Z"
}
```

### Training API

#### POST /api/training
Add custom training data for the AI model.

**Request Body:**
```json
{
  "type": "faq",
  "domain": "example.com",
  "title": "Return Policy",
  "content": "Our return policy allows returns within 30 days...",
  "metadata": {
    "category": "policies",
    "tags": ["returns", "refunds"]
  }
}
```

**Valid Types:**
- `faq`: Frequently asked questions
- `product`: Product information
- `policy`: Business policies
- `guide`: How-to guides
- `custom`: Custom content

### GDPR/Privacy API

#### POST /api/gdpr/export
Request data export for a user.

**Request Body:**
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "includeConversations": true,
  "includeAnalytics": false
}
```

**Response:**
```json
{
  "requestId": "export_456",
  "status": "processing",
  "downloadUrl": null,
  "expiresAt": "2024-01-27T10:00:00Z"
}
```

#### DELETE /api/gdpr/delete
Request data deletion for a user.

**Request Body:**
```json
{
  "userId": "user_123",
  "email": "user@example.com",
  "reason": "user_request"
}
```

### Dashboard API

#### GET /api/dashboard/overview
Retrieve dashboard overview metrics.

**Query Parameters:**
- `period` (string): `today`, `week`, `month`, `year`
- `timezone` (string): IANA timezone (e.g., `America/New_York`)

**Response:**
```json
{
  "metrics": {
    "totalConversations": 1234,
    "activeUsers": 456,
    "avgResponseTime": 1.2,
    "satisfactionScore": 4.5
  },
  "trends": {
    "conversationsGrowth": 0.15,
    "usersGrowth": 0.08
  },
  "topQueries": [
    {
      "query": "shipping cost",
      "count": 89
    }
  ]
}
```

## Webhooks

### Webhook Security

All webhooks include an HMAC-SHA256 signature in the `X-Webhook-Signature` header.

**Verification Example (Node.js):**
```javascript
const crypto = require('crypto');

function verifyWebhook(body, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}
```

### Webhook Events

#### scrape.completed
Fired when a scraping job completes.

```json
{
  "event": "scrape.completed",
  "timestamp": "2024-01-20T10:00:00Z",
  "data": {
    "jobId": "job_123",
    "pagesScraped": 100,
    "duration": 300000,
    "status": "success"
  }
}
```

#### chat.session.ended
Fired when a chat session ends.

```json
{
  "event": "chat.session.ended",
  "timestamp": "2024-01-20T10:00:00Z",
  "data": {
    "sessionId": "session_456",
    "messageCount": 10,
    "duration": 600000,
    "resolved": true
  }
}
```

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `AUTH_INVALID` | Invalid or expired API key | Check API key validity |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait for rate limit reset |
| `INVALID_REQUEST` | Malformed request body | Check request format |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist | Verify resource ID |
| `INTERNAL_ERROR` | Server error | Retry with exponential backoff |
| `DOMAIN_NOT_CONFIGURED` | Domain not set up | Configure domain in dashboard |
| `INSUFFICIENT_CREDITS` | Out of API credits | Purchase additional credits |

## SDKs and Libraries

### Official SDKs

- **Node.js/TypeScript**: `npm install @omniops/sdk`
- **Python**: `pip install omniops-sdk`
- **Go**: `go get github.com/omniops/go-sdk`

### Quick Start (TypeScript)

```typescript
import { OmniopsClient } from '@omniops/sdk';

const client = new OmniopsClient({
  apiKey: process.env.OMNIOPS_API_KEY,
  domain: 'example.com'
});

// Send a chat message
const response = await client.chat.send({
  message: 'What are your business hours?'
});

// Get analytics
const analytics = await client.analytics.getIntelligence({
  metric: 'all',
  days: 7
});

// Start web scraping
const job = await client.scraping.start({
  url: 'https://example.com',
  maxPages: 100
});
```

## Best Practices

### 1. Error Handling

Always implement proper error handling with exponential backoff:

```javascript
async function apiCallWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'RATE_LIMIT_EXCEEDED') {
        await sleep(Math.pow(2, i) * 1000);
      } else if (error.code === 'INTERNAL_ERROR' && i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 500);
      } else {
        throw error;
      }
    }
  }
}
```

### 2. Batch Operations

When possible, batch operations to reduce API calls:

```javascript
// Instead of multiple individual calls
for (const item of items) {
  await client.training.add(item); // ❌
}

// Use batch endpoint
await client.training.addBatch(items); // ✅
```

### 3. Caching

Implement caching for frequently accessed data:

```javascript
const cache = new Map();

async function getCachedAnalytics(metric) {
  const key = `analytics:${metric}:${Date.now() / 60000 | 0}`;

  if (!cache.has(key)) {
    const data = await client.analytics.get({ metric });
    cache.set(key, data);
    setTimeout(() => cache.delete(key), 60000);
  }

  return cache.get(key);
}
```

### 4. Webhook Handling

Process webhooks asynchronously to avoid timeouts:

```javascript
app.post('/webhooks', (req, res) => {
  // Respond immediately
  res.status(200).send('OK');

  // Process asynchronously
  processWebhookAsync(req.body).catch(console.error);
});
```

## Migration Guides

### Migrating from v1 to v2

Key changes in API v2:
- Authentication moved from query params to headers
- Response format standardized
- New analytics endpoints
- Webhook signature verification required

See [MIGRATION_V2.md](./MIGRATION_V2.md) for detailed migration steps.

## Support

- **Documentation**: https://docs.omniops.ai
- **API Status**: https://status.omniops.ai
- **Support Email**: api-support@omniops.ai
- **Discord Community**: https://discord.gg/omniops