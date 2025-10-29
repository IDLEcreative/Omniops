# Token Cost Tracking System

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 11 minutes

## Purpose
Comprehensive token usage logging and cost tracking system for the intelligent chat API, providing real-time cost monitoring, analytics, and budget management capabilities.

## Quick Links
- [Overview](#overview)
- [Features](#features)
- [Implementation Details](#implementation-details)
- [Usage Examples](#usage-examples)
- [Cost Optimization Strategies](#cost-optimization-strategies)

## Keywords
cost, details, documentation, enhancements, examples, features, future, history, implementation, migration

---


## Overview
Comprehensive token usage logging and cost tracking system for the intelligent chat API, providing real-time cost monitoring, analytics, and budget management capabilities.

## Features

### 1. Token Usage Tracking
- **Automatic Capture**: Every OpenAI API call's token usage is automatically tracked
- **Accumulation**: Multiple API calls within a session are accumulated for total usage
- **Real-time Calculation**: Costs calculated instantly using model-specific pricing

### 2. Cost Calculation
**GPT-5-mini Pricing** (Current Model):
- Input: $0.25 per 1M tokens
- Output: $2.00 per 1M tokens
- Average cost per query: ~$0.003-0.005

**Example Calculation**:
```
Query with 4,153 input tokens + 632 output tokens:
- Input cost: (4,153 × $0.25) / 1,000,000 = $0.001038
- Output cost: (632 × $2.00) / 1,000,000 = $0.001264
- Total: $0.002302
```

### 3. Database Schema

#### chat_telemetry Table
```sql
-- Core token tracking columns
input_tokens INTEGER       -- Number of input tokens
output_tokens INTEGER      -- Number of output tokens  
total_tokens INTEGER       -- Generated column (sum)
cost_usd DECIMAL(10,6)     -- Calculated cost in USD

-- Automatic cost calculation trigger
-- Uses model-specific pricing to calculate cost_usd
```

#### Analytics Views
- **chat_telemetry_cost_analytics**: Daily cost breakdown by model and domain
- **chat_telemetry_hourly_costs**: Real-time hourly monitoring
- **chat_telemetry_domain_costs**: Customer billing breakdown

### 4. Monitoring API Endpoints

#### GET /api/monitoring/chat
Returns comprehensive metrics including:
```json
{
  "tokenMetrics": {
    "totalInputTokens": 50000,
    "totalOutputTokens": 15000,
    "avgTokensPerRequest": 2500
  },
  "costAnalytics": {
    "totalCost": 0.0425,
    "avgCost": 0.0035,
    "minCost": 0.001,
    "maxCost": 0.008,
    "projectedDailyCost": 1.28,
    "projectedMonthlyCost": 38.40
  }
}
```

#### POST /api/monitoring/chat
Actions:
- Set cost alerts
- Get cost summaries
- Clean up old telemetry data

### 5. Cost Alert System

Set alerts for different thresholds:
```bash
# Set daily alert at $10
curl -X POST http://localhost:3000/api/monitoring/chat \
  -d '{"action": "set-alert", "domain": "example.com", "alert_type": "daily", "threshold_usd": 10.00}'
```

## Implementation Details

### ChatTelemetry Class
Located in `/lib/chat-telemetry.ts`

Key methods:
- `trackTokenUsage()`: Accumulates token usage from OpenAI responses
- `calculateCost()`: Applies model-specific pricing
- `complete()`: Finalizes session and persists to database
- `getCostAnalytics()`: Returns real-time cost metrics

### Integration Points

1. **Intelligent Chat Route** (`/app/api/chat-intelligent/route.ts`):
   - Initializes telemetry with model configuration
   - Tracks tokens after each OpenAI call
   - Returns token usage in API response

2. **Database Persistence**:
   - Automatic via trigger on insert/update
   - Stores detailed session data for analytics
   - Maintains history for billing and optimization

### Error Handling
- Silent fallback if telemetry fails (doesn't block chat)
- Logs persistence errors for monitoring
- Validates environment variables on initialization

## Usage Examples

### Testing Token Logging
```bash
# Run comprehensive test
npx tsx test-token-cost-logging.ts

# Debug persistence
npx tsx test-telemetry-persistence.ts
```

### Monitoring Costs
```bash
# Get hourly costs
curl http://localhost:3000/api/monitoring/chat?period=hour

# Get domain-specific costs
curl http://localhost:3000/api/monitoring/chat?domain=example.com

# Get 7-day summary
curl -X POST http://localhost:3000/api/monitoring/chat \
  -d '{"action": "get-summary", "days": 7}'
```

### Database Queries
```sql
-- Get today's costs by domain
SELECT domain, SUM(cost_usd) as daily_cost
FROM chat_telemetry
WHERE created_at >= CURRENT_DATE
GROUP BY domain
ORDER BY daily_cost DESC;

-- Check cost trends
SELECT 
  DATE(created_at) as day,
  COUNT(*) as requests,
  SUM(input_tokens) as input,
  SUM(output_tokens) as output,
  SUM(cost_usd) as cost
FROM chat_telemetry
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY day DESC;
```

## Cost Optimization Strategies

### Current Performance
- Average cost per query: $0.003-0.005
- 58% cost reduction achieved through:
  - Caching search results
  - Limiting iterations
  - Optimizing token usage

### Recommendations
1. **Cache Aggressively**: Reuse search results within sessions
2. **Limit Iterations**: Set max_iterations based on query complexity
3. **Optimize Prompts**: Shorter, more precise prompts reduce input tokens
4. **Batch Searches**: Parallel execution reduces redundant context

## Troubleshooting

### Common Issues

1. **Telemetry not persisting**:
   - Check SUPABASE_SERVICE_ROLE_KEY is set
   - Verify chat_telemetry table schema is current
   - Check for persistence errors in logs

2. **Cost calculations incorrect**:
   - Verify model name matches pricing configuration
   - Check token counts in OpenAI response
   - Validate pricing constants in ChatTelemetry class

3. **Missing token data in response**:
   - Ensure USE_GPT5_MINI=true in .env.local
   - Check OpenAI API response structure
   - Verify telemetry initialization

## Future Enhancements

1. **Budget Management**:
   - Per-customer spending limits
   - Automatic throttling when approaching limits
   - Cost allocation by feature/endpoint

2. **Advanced Analytics**:
   - Cost per conversation
   - Token efficiency metrics
   - ROI analysis by query type

3. **Optimization Engine**:
   - Automatic prompt optimization
   - Dynamic model selection based on cost/quality
   - Predictive cost modeling

## Migration History

### 2025-01-18: Initial Token Tracking
- Added token and cost columns to chat_telemetry
- Created analytics views for cost monitoring
- Implemented automatic cost calculation trigger
- Added cost alert system

## Related Documentation
- [Intelligent Chat System](./INTELLIGENT_CHAT_IMPLEMENTATION.md)
- [Search Methods Analysis](../SEARCH_METHODS_ANALYSIS.md)
- [Cost Analysis](../COST_ANALYSIS_INTELLIGENT_CHAT.md)
