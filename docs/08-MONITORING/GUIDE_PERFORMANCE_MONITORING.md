# Performance Monitoring Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** Monitoring tools, custom scripts
**Estimated Read Time:** 15 minutes

## Purpose

Comprehensive guide to monitoring application performance, tracking key metrics, building dashboards, setting performance budgets, and detecting regressions. Learn how to measure and optimize database, API, AI, and frontend performance.

## Quick Links

- [Performance Optimization Reference](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Existing Monitoring Tools](../../lib/monitoring/)
- [Custom Monitoring Scripts](../../scripts/monitoring/)

## Table of Contents

- [Overview](#overview)
- [Key Metrics to Track](#key-metrics-to-track)
- [Existing Custom Monitoring](#existing-custom-monitoring)
- [Dashboard Setup](#dashboard-setup)
- [Performance Budgets](#performance-budgets)
- [Regression Detection](#regression-detection)
- [Optimization Workflow](#optimization-workflow)

---

## Overview

Performance monitoring tracks application speed and efficiency across:
- **API Response Times**: How fast endpoints respond
- **Database Performance**: Query execution times
- **AI Token Usage**: OpenAI API costs and latency
- **Frontend Performance**: Page load, render times
- **Queue Processing**: Background job throughput

**Why Performance Matters:**
- **User Experience**: Slow apps lose users (53% bounce if >3s load)
- **SEO Rankings**: Google penalizes slow sites
- **Cost**: Inefficient code = higher server/AI costs
- **SLA Compliance**: Must meet <5s response time targets

## Key Metrics to Track

### 1. API Response Times

**Metrics:**
- **p50** (median): 50% of requests faster than this
- **p95**: 95% of requests faster than this (catches slow outliers)
- **p99**: 99% of requests faster than this (worst-case)
- **Error rate**: % of requests returning 4xx/5xx

**Targets:**
- p50: <500ms
- p95: <2s
- p99: <5s
- Error rate: <0.1%

**How to Track:**
- Sentry Performance Monitoring
- Custom middleware in API routes
- Existing: `lib/monitoring/performance-tracker.ts`

### 2. Database Query Performance

**Metrics:**
- Query execution time (ms)
- Query count per request
- Slow queries (>100ms)
- Connection pool usage

**Targets:**
- Simple queries: <10ms
- Complex queries: <100ms
- Embeddings search: <500ms
- No N+1 queries

**How to Track:**
- Supabase Dashboard → Performance
- Custom query logging: `lib/monitoring/sentry.ts` → `trackDatabaseQuery()`
- Enable Postgres slow query log

### 3. AI Token Usage

**Metrics:**
- Tokens per request (input + output)
- Cost per conversation
- API latency
- Error rate

**Targets:**
- Chat response: <10K tokens
- Response time: <3s
- Cost per conversation: <$0.10
- Error rate: <0.5%

**How to Track:**
- OpenAI Dashboard → Usage
- Custom tracking in chat telemetry
- Existing: `lib/chat-telemetry.ts`

### 4. Queue Processing Times

**Metrics:**
- Job waiting time
- Job processing time
- Failed job rate
- Queue backlog size

**Targets:**
- Waiting time: <30s
- Processing time: <5 min
- Failed rate: <1%
- Backlog: <100 jobs

**How to Track:**
- Redis monitoring
- BullMQ dashboard
- Custom: `lib/monitoring/performance-tracker.ts`

### 5. Frontend Performance

**Metrics:**
- First Contentful Paint (FCP): <1.8s
- Largest Contentful Paint (LCP): <2.5s
- Time to Interactive (TTI): <3.5s
- Cumulative Layout Shift (CLS): <0.1

**How to Track:**
- Lighthouse CI
- Sentry Browser Performance
- Chrome DevTools
- WebPageTest.org

## Existing Custom Monitoring

### Built-In Monitoring Tools

**1. Performance Tracker** (`lib/monitoring/performance-tracker.ts`)
- Tracks API response times
- Measures database query performance
- Records Redis operations

**2. Chat Telemetry** (`lib/chat-telemetry.ts`)
- Tracks AI token usage
- Records chat response times
- Monitors conversation metadata

**3. Persistence Monitor** (`lib/monitoring/persistence-monitor.ts`)
- Tracks scraping job performance
- Monitors content storage
- Measures embeddings generation time

**4. Dashboard Data Collector** (`lib/monitoring/dashboard-data.ts`)
- Aggregates performance metrics
- Provides data for admin dashboard
- Formats data for visualization

### Custom Monitoring Scripts

Located in `scripts/monitoring/`:

**Health Checks:**
- `check-embeddings-health.ts` - Verify embeddings integrity
- `check-database-health.ts` - Database connectivity and performance
- `check-redis-health.ts` - Redis connectivity and memory

**Performance Profiling:**
- `profile-api-performance.ts` - API endpoint benchmarking
- `profile-search-performance.ts` - Search query optimization
- `profile-embeddings-generation.ts` - Embeddings creation speed

**Usage:**
```bash
npx tsx scripts/monitoring/check-embeddings-health.ts
npx tsx scripts/monitoring/profile-api-performance.ts
```

## Dashboard Setup

### Option 1: Grafana (Free, Self-Hosted)

**Setup:**
1. Install Grafana: `docker run -d -p 3000:3000 grafana/grafana`
2. Add data sources:
   - Prometheus (for metrics)
   - Postgres (for database queries)
3. Create dashboards:
   - API response times (line chart)
   - Error rates (gauge)
   - Database query times (heatmap)

**Pros:** Free, highly customizable
**Cons:** Requires setup and maintenance

### Option 2: Datadog

**Setup:**
1. Create account at [datadoghq.com](https://www.datadoghq.com/)
2. Install agent: `npm install dd-trace`
3. Initialize in `instrumentation.ts`
4. Auto-discovers metrics and creates dashboards

**Pros:** Fully managed, excellent UI
**Cons:** Expensive ($15/host/month)

### Option 3: Sentry Performance

**Setup:**
1. Already installed (see [Sentry Setup Guide](./GUIDE_SENTRY_SETUP.md))
2. Go to Performance → Create Dashboard
3. Add widgets:
   - Transaction duration (p50, p95, p99)
   - Throughput
   - Error rate
   - Database query times

**Pros:** Integrated with error tracking
**Cons:** Limited custom metrics

### Recommended Dashboard Widgets

**1. API Performance**
- Line chart: Response time trends (p50, p95)
- Table: Slowest endpoints
- Gauge: Error rate

**2. Database**
- Heatmap: Query duration distribution
- Table: Slow queries (>100ms)
- Line chart: Connection pool usage

**3. AI Costs**
- Line chart: Daily token usage
- Number: Monthly cost projection
- Table: Most expensive conversations

**4. User Experience**
- Line chart: Page load times
- Gauge: Apdex score (user satisfaction)
- Number: Bounce rate

## Performance Budgets

### Define Budgets

Set performance targets for each metric:

```typescript
// performance-budget.ts
export const PERFORMANCE_BUDGET = {
  api: {
    p50: 500, // ms
    p95: 2000,
    p99: 5000,
    errorRate: 0.1, // %
  },
  database: {
    simpleQuery: 10, // ms
    complexQuery: 100,
    embeddingsSearch: 500,
  },
  ai: {
    tokensPerRequest: 10000,
    costPerConversation: 0.10, // $
    responseTime: 3000, // ms
  },
  frontend: {
    fcp: 1800, // ms
    lcp: 2500,
    tti: 3500,
    cls: 0.1,
  },
};
```

### Monitor Budget Compliance

**Weekly Review:**
```bash
# Check if metrics exceed budget
npx tsx scripts/monitoring/check-performance-budget.ts
```

**Output:**
```
✅ API p50: 320ms (budget: 500ms) - PASS
⚠️  API p95: 2300ms (budget: 2000ms) - WARN (+15%)
❌ Database slow queries: 150ms (budget: 100ms) - FAIL (+50%)
✅ AI tokens: 7200 (budget: 10000) - PASS
```

### Automated Alerts

Set alerts when budgets exceeded:

```typescript
// In monitoring service
if (metrics.api.p95 > PERFORMANCE_BUDGET.api.p95) {
  sendAlert({
    severity: 'warning',
    message: 'API p95 exceeded budget',
    current: metrics.api.p95,
    budget: PERFORMANCE_BUDGET.api.p95,
    action: 'Optimize slow endpoints',
  });
}
```

## Regression Detection

### Before/After Deployment

**Pre-Deploy Baseline:**
```bash
# Capture current performance
npx tsx scripts/monitoring/capture-performance-baseline.ts > baseline.json
```

**Post-Deploy Comparison:**
```bash
# Compare new performance vs baseline
npx tsx scripts/monitoring/compare-performance.ts baseline.json
```

**Output:**
```
API Performance:
  p50: 320ms → 340ms (+6%) ⚠️
  p95: 1800ms → 1750ms (-3%) ✅

Database:
  avg query: 25ms → 28ms (+12%) ⚠️
  slow queries: 3 → 1 (-67%) ✅

Recommendation: DEPLOY (minor regressions acceptable)
```

### Continuous Monitoring

Set up alerts for sudden changes:

```typescript
// Alert if metrics degrade >20% vs 24h ago
if (current.p95 > previous24h.p95 * 1.2) {
  sendAlert({
    severity: 'high',
    message: 'Performance regression detected',
    metric: 'API p95',
    change: '+35%',
    possibleCause: 'Recent deployment?',
  });
}
```

## Optimization Workflow

### 1. Identify Slow Endpoints

```bash
# Find slowest API routes
SELECT
  url,
  AVG(duration) as avg_duration,
  MAX(duration) as max_duration,
  COUNT(*) as request_count
FROM performance_logs
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY url
ORDER BY avg_duration DESC
LIMIT 10;
```

### 2. Profile Slow Queries

```typescript
// Add timing to suspicious code
const start = Date.now();
const users = await getUsersFromDatabase();
console.log('Query took:', Date.now() - start, 'ms');
```

### 3. Optimize

Common optimizations:
- Add database indexes
- Implement caching (Redis)
- Reduce AI token usage
- Batch database queries
- Use connection pooling

### 4. Verify Improvement

```bash
# Re-run performance tests
npx tsx scripts/monitoring/profile-api-performance.ts
```

### 5. Document

Update performance optimization reference:
- What was slow
- Root cause
- Solution applied
- Performance improvement achieved

## Best Practices

**1. Track Everything**
- Add timing to all API routes
- Log slow queries automatically
- Monitor AI token usage per request

**2. Set Alerts**
- Alert on regressions (>20% slower)
- Alert on budget violations
- Alert on error rate spikes

**3. Review Weekly**
- Check dashboard every Monday
- Review top 10 slowest endpoints
- Update performance budgets quarterly

**4. Optimize Proactively**
- Don't wait for complaints
- Fix slow endpoints before users notice
- Profile new features before deployment

**5. Document Optimizations**
- Keep record of what was tried
- Share learnings with team
- Update runbooks with solutions

## Next Steps

- [Review Performance Optimization Reference](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Configure Alerting](./GUIDE_ALERTING.md)
- [Set Up Sentry](./GUIDE_SENTRY_SETUP.md)
- [Explore Monitoring Scripts](../../scripts/monitoring/)

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Google SRE - Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/)
- [Datadog APM Guide](https://docs.datadoghq.com/tracing/)
- [Sentry Performance](https://docs.sentry.io/product/performance/)
