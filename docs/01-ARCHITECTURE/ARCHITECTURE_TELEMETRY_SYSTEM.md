# Telemetry System Documentation

**Type:** Architecture
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [lib/chat-telemetry.ts](../../lib/chat-telemetry.ts)
- [app/api/dashboard/telemetry/route.ts](../../app/api/dashboard/telemetry/route.ts)
- [GUIDE_MONITORING_SETUP.md](../02-GUIDES/GUIDE_MONITORING_SETUP.md)
- [REFERENCE_TELEMETRY_RUNBOOK.md](../07-REFERENCE/REFERENCE_TELEMETRY_RUNBOOK.md)
**Estimated Read Time:** 16 minutes

## Purpose
Comprehensive technical architecture documentation for the telemetry system covering ChatTelemetry class implementation, TelemetryManager singleton pattern, real-time cost tracking ($10-30/M tokens for GPT-4), token usage monitoring (input/output/total), session management, database schema (chat_telemetry table with 13 columns), Dashboard API endpoints, and integration patterns for tracking AI model performance and operational costs.

## Quick Links
- [Architecture](#architecture)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Implementation](#implementation)
- [Database Schema](#database-schema)
- [Monitoring Dashboard Integration](#monitoring-dashboard-integration)
- [Best Practices](#best-practices)

## Keywords
telemetry system, ChatTelemetry class, TelemetryManager singleton, cost tracking, token usage monitoring, GPT-4 pricing, chat_telemetry table, session management, real-time metrics, performance analytics, Dashboard API, cost projections, model analytics, domain analytics, SESSION_CLEANUP_INTERVAL, MODEL_PRICING, search operation tracking

## Aliases
- "ChatTelemetry" (also known as: telemetry session, usage tracker, metrics collector)
- "TelemetryManager" (also known as: telemetry singleton, session manager, global telemetry)
- "cost tracking" (also known as: usage cost calculation, AI spend monitoring, token pricing)
- "chat_telemetry" (also known as: telemetry table, metrics database, usage history)
- "token usage" (also known as: token consumption, API usage, model tokens)
- "projectedMonthlyCost" (also known as: cost forecast, monthly spend estimate, budget projection)

---

## Overview

The telemetry system provides comprehensive monitoring, cost tracking, and performance analytics for the AI-powered chat system. It tracks every interaction, calculates costs in real-time, and provides actionable insights for optimization.

## Architecture

### Components

1. **ChatTelemetry Class** (`lib/chat-telemetry.ts`)
   - Session-based tracking
   - Real-time metrics collection
   - Cost calculation engine
   - Performance monitoring

2. **TelemetryManager Singleton**
   - Global session management
   - Memory-based live tracking
   - Automatic garbage collection
   - Cross-session analytics

3. **Database Persistence**
   - `chat_telemetry` table for historical data
   - Automatic data persistence
   - Query optimization with indexes

4. **Dashboard API** (`app/api/dashboard/telemetry/route.ts`)
   - RESTful endpoint for telemetry data
   - Aggregated metrics and trends
   - Live session monitoring

## Features

### 1. Cost Tracking

#### Real-time Cost Calculation
```typescript
// Automatic cost tracking per AI model
const pricing = {
  'gpt-4-turbo': { input: $10/M tokens, output: $30/M tokens },
  'gpt-3.5-turbo': { input: $0.50/M tokens, output: $1.50/M tokens }
};
```

#### Cost Projections
- **Hourly Rate**: Current spend rate per hour
- **Daily Projection**: Estimated daily costs
- **Monthly Projection**: 30-day cost forecast

### 2. Token Usage Monitoring

Tracks three token metrics:
- **Input Tokens**: Tokens sent to AI model
- **Output Tokens**: Tokens received from AI model
- **Total Tokens**: Combined usage for billing

### 3. Performance Metrics

- **Response Time**: Average duration per request
- **Search Operations**: Number and efficiency of searches
- **Iterations**: AI reasoning cycles per request
- **Success Rate**: Percentage of successful completions

### 4. Model Analytics

Breakdown by AI model showing:
- Request count
- Total cost
- Token usage
- Performance characteristics

### 5. Domain Analytics

Multi-tenant tracking:
- Per-domain usage statistics
- Cost allocation by customer
- Performance comparison across domains

## API Endpoints

### GET /api/dashboard/telemetry

#### Request Parameters
```typescript
{
  days?: number;    // Number of days to analyze (default: 7)
  domain?: string;  // Filter by specific domain
}
```

#### Response Structure
```typescript
{
  overview: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    errorRate: number;
    activeSessions: number;
    timeRange: string;
  },
  cost: {
    total: string;          // "12.5430"
    average: string;        // "0.080404"
    projectedDaily: string; // "1.79"
    projectedMonthly: string; // "53.70"
    perHour: string;        // "0.0745"
    trend: 'increasing' | 'decreasing' | 'stable';
  },
  tokens: {
    totalInput: number;
    totalOutput: number;
    total: number;
    avgPerRequest: number;
  },
  performance: {
    avgResponseTime: number;  // milliseconds
    totalSearches: number;
    avgSearchesPerRequest: string;
    avgIterations: string;
  },
  modelUsage: Array<{
    model: string;
    count: number;
    cost: string;
    tokens: number;
    percentage: number;
  }>,
  domainBreakdown: Array<{
    domain: string;
    requests: number;
    cost: string;
  }>,
  hourlyTrend: Array<{
    hour: string;
    cost: number;
    requests: number;
  }>,
  live: {
    activeSessions: number;
    currentCost: string;
    sessionsData: Array<{
      id: string;
      uptime: number;
      cost: string;
      model: string;
    }>
  }
}
```

## Implementation

### 1. Initialize Telemetry for a Session

```typescript
import { ChatTelemetry, telemetryManager } from '@/lib/chat-telemetry';

// Create a new telemetry session
const telemetry = telemetryManager.createSession(
  sessionId,
  'gpt-4-turbo',
  {
    metricsEnabled: true,
    detailedLogging: true,
    persistToDatabase: true,
    domain: 'example.com'
  }
);
```

### 2. Track Operations

```typescript
// Track a search operation
telemetry.trackSearch({
  tool: 'semantic_search',
  query: 'hydraulic pump',
  resultCount: 15,
  source: 'embeddings',
  startTime: Date.now()
});

// Track token usage
telemetry.trackTokenUsage({
  prompt_tokens: 1500,
  completion_tokens: 450,
  total_tokens: 1950
});

// Track iterations
telemetry.trackIteration(1, 3); // iteration 1, 3 tool calls
```

### 3. Complete Session

```typescript
// Complete with success
await telemetry.complete('Here is your answer...', undefined);

// Complete with error
await telemetry.complete(undefined, 'Error: API rate limit exceeded');
```

## Database Schema

### chat_telemetry Table

```sql
CREATE TABLE chat_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  model VARCHAR(100),
  domain VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  iterations INTEGER DEFAULT 0,
  search_count INTEGER DEFAULT 0,
  total_results INTEGER DEFAULT 0,
  searches JSONB,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost_usd DECIMAL(10, 6),
  tokens_used INTEGER, -- Deprecated, kept for compatibility
  model_config JSONB,
  success BOOLEAN DEFAULT true,
  error TEXT,
  logs JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_chat_telemetry_created_at ON chat_telemetry(created_at DESC);
CREATE INDEX idx_chat_telemetry_domain ON chat_telemetry(domain);
CREATE INDEX idx_chat_telemetry_model ON chat_telemetry(model);
CREATE INDEX idx_chat_telemetry_session ON chat_telemetry(session_id);
```

## Monitoring Dashboard Integration

The telemetry system integrates with the dashboard UI to provide:

1. **Real-time Metrics Widget**
   - Active sessions counter
   - Current spend rate
   - Live request tracking

2. **Cost Analytics Chart**
   - Hourly/daily/weekly trends
   - Model comparison
   - Budget tracking

3. **Performance Dashboard**
   - Response time graphs
   - Success rate indicators
   - Search efficiency metrics

4. **Domain Analytics**
   - Per-customer usage
   - Comparative analysis
   - Top users identification

## Best Practices

### 1. Session Management
- Always create a telemetry session for each chat
- Use unique session IDs (UUIDs recommended)
- Complete sessions properly for accurate metrics

### 2. Cost Optimization
- Monitor projectedMonthlyCost regularly
- Set up alerts for cost thresholds
- Analyze model usage for optimization opportunities

### 3. Performance Monitoring
- Track avgResponseTime trends
- Investigate high iteration counts
- Optimize search operations

### 4. Data Retention
- Implement regular cleanup of old telemetry data
- Archive important metrics before deletion
- Keep summary statistics for long-term trends

## Troubleshooting

### Common Issues

1. **Missing Cost Data**
   - Ensure model pricing is configured in MODEL_PRICING
   - Verify token usage is being tracked
   - Check database persistence is enabled

2. **Inaccurate Projections**
   - Projections need at least 1 hour of data
   - More data points improve accuracy
   - Check for data gaps in tracking

3. **High Memory Usage**
   - TelemetryManager auto-cleans sessions > 5 minutes old
   - Manually call clearOldSessions() if needed
   - Reduce detailedLogging in production

## Future Enhancements

1. **Advanced Analytics**
   - Machine learning for cost prediction
   - Anomaly detection for unusual patterns
   - Automated optimization recommendations

2. **Integration Expansion**
   - Export to external monitoring tools
   - Webhook notifications for thresholds
   - GraphQL API for flexible queries

3. **Enhanced Tracking**
   - User satisfaction correlation
   - Conversion impact metrics
   - A/B testing support

## Related Documentation

- [Dashboard API Documentation](./DASHBOARD_API.md)
- [Chat System Architecture](./CHAT_ARCHITECTURE.md)
- [Performance Optimization Guide](./PERFORMANCE.md)