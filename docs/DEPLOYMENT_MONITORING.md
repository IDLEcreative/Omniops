# Deployment Monitoring Guide

**Commerce Provider Multi-Platform Support**
**Version**: 2.0
**Date**: 2025-10-23

---

## Overview

This guide provides monitoring recommendations for the commerce provider registry pattern deployment.

---

## Key Metrics to Monitor

### 1. Provider Resolution Performance

**Metric**: `commerce_provider_resolution_time`
**Location**: `lib/agents/commerce-provider.ts`

```typescript
// Track time to resolve provider
const startTime = Date.now();
const provider = await getCommerceProvider(domain);
const resolutionTime = Date.now() - startTime;
```

**Alerts**:
- Warning: Resolution time > 100ms (cache miss)
- Critical: Resolution time > 500ms (system issue)

**Dashboard Query**:
```sql
SELECT
  AVG(resolution_time_ms) as avg_resolution,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY resolution_time_ms) as p95_resolution,
  COUNT(*) as total_requests
FROM commerce_provider_metrics
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY date_trunc('minute', timestamp)
```

---

### 2. Cache Hit Rate

**Metric**: `provider_cache_hit_rate`
**Target**: > 90%

**Calculation**:
```typescript
const cacheHits = providerCache.has(domain) ? 1 : 0;
const totalRequests = 1;
const hitRate = (cacheHits / totalRequests) * 100;
```

**Alerts**:
- Warning: Hit rate < 80% (cache not effective)
- Critical: Hit rate < 60% (cache configuration issue)

---

### 3. Provider Detection Success Rate

**Metric**: `provider_detection_success_rate`
**Target**: > 95%

**Breakdown by Platform**:
- Shopify detection rate
- WooCommerce detection rate
- Null provider rate (no platform detected)

**Dashboard Query**:
```sql
SELECT
  provider_type,
  COUNT(*) as detections,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM provider_detections
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY provider_type
ORDER BY detections DESC
```

**Alerts**:
- Warning: Null provider rate > 10% (detection issues)
- Critical: Specific platform detection failure > 20%

---

### 4. Search Result Quality

**Metric**: `search_result_relevance`
**Measurement**: User engagement with results

**Tracking**:
```typescript
// Track when users click on search results
const clickedResult = {
  query: userQuery,
  provider: provider?.platform,
  position: clickedPosition,
  timestamp: new Date()
};
```

**Alerts**:
- Warning: Average click position > 5 (poor relevance)
- Critical: Click-through rate < 20% (results not useful)

---

### 5. API Error Rates

**Metric**: `commerce_provider_error_rate`
**Target**: < 1%

**Error Categories**:
- Provider initialization errors
- Product search timeouts
- API authentication failures
- Data parsing errors

**Dashboard Query**:
```sql
SELECT
  error_type,
  COUNT(*) as error_count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM requests WHERE timestamp > NOW() - INTERVAL '1 hour') as error_rate
FROM commerce_errors
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY error_type
ORDER BY error_count DESC
```

**Alerts**:
- Warning: Error rate > 1% for any category
- Critical: Error rate > 5% or total errors > 100/hour

---

## Monitoring Implementation

### Step 1: Add Telemetry Events

**File**: `lib/agents/commerce-provider.ts`

```typescript
export async function getCommerceProvider(domain: string): Promise<CommerceProvider | null> {
  const startTime = Date.now();
  const normalizedDomain = normalizeDomain(domain || '');

  // Check cache
  const cached = providerCache.get(normalizedDomain);
  const cacheHit = cached && cached.expiresAt > Date.now();

  if (cacheHit) {
    // Track cache hit
    trackMetric('commerce.provider.cache.hit', 1, { domain: normalizedDomain });
    return cached.provider;
  }

  // Track cache miss
  trackMetric('commerce.provider.cache.miss', 1, { domain: normalizedDomain });

  // Resolve provider
  const provider = await resolveProvider(normalizedDomain);
  const resolutionTime = Date.now() - startTime;

  // Track resolution metrics
  trackMetric('commerce.provider.resolution.time', resolutionTime, {
    domain: normalizedDomain,
    provider: provider?.platform || 'none',
    cached: false
  });

  trackMetric('commerce.provider.detection', 1, {
    domain: normalizedDomain,
    provider: provider?.platform || 'none',
    success: provider !== null
  });

  // Cache result
  providerCache.set(normalizedDomain, {
    provider,
    expiresAt: Date.now() + PROVIDER_CACHE_TTL_MS,
  });

  return provider;
}
```

### Step 2: Add Performance Tracking

**File**: `app/api/chat/route.ts`

```typescript
// Track commerce search performance
if (provider) {
  const searchStartTime = Date.now();
  const products = await provider.searchProducts(query);
  const searchTime = Date.now() - searchStartTime;

  trackMetric('commerce.search.time', searchTime, {
    provider: provider.platform,
    query_length: query.length,
    results_count: products.length
  });

  trackMetric('commerce.search.results', products.length, {
    provider: provider.platform,
    query_type: query.includes('SKU') ? 'sku' : 'general'
  });
}
```

### Step 3: Add Error Tracking

```typescript
try {
  const provider = await getCommerceProvider(domain);
} catch (error) {
  trackMetric('commerce.provider.error', 1, {
    error_type: error.name,
    error_message: error.message,
    domain: domain
  });

  console.error('[Commerce Provider] Error:', error);
  // Fall back to semantic search
}
```

---

## Dashboard Recommendations

### Grafana Dashboard Panels

**Panel 1: Provider Resolution Overview**
- Average resolution time (line chart)
- Cache hit rate (gauge)
- Provider type distribution (pie chart)

**Panel 2: Performance Metrics**
- Search response times by provider (line chart)
- Results count distribution (histogram)
- Error rate trends (area chart)

**Panel 3: Detection Success**
- Shopify detection rate (gauge)
- WooCommerce detection rate (gauge)
- Null provider rate (gauge)

**Panel 4: Recent Errors**
- Table showing latest errors with details
- Error type breakdown (bar chart)

### Example Grafana Query (PromQL)

```promql
# Average resolution time
rate(commerce_provider_resolution_time_sum[5m]) /
rate(commerce_provider_resolution_time_count[5m])

# Cache hit rate
sum(rate(commerce_provider_cache_hit[5m])) /
(sum(rate(commerce_provider_cache_hit[5m])) +
 sum(rate(commerce_provider_cache_miss[5m])))

# Error rate
sum(rate(commerce_provider_error[5m])) by (error_type)
```

---

## Alert Configuration

### PagerDuty / Slack Alerts

**High Priority (Immediate Response)**

1. **Commerce Provider Down**
   - Condition: Error rate > 50% for 5 minutes
   - Action: Page on-call engineer

2. **Critical Performance Degradation**
   - Condition: P95 resolution time > 1000ms for 10 minutes
   - Action: Page on-call engineer

**Medium Priority (Investigate)**

3. **High Error Rate**
   - Condition: Error rate > 5% for 15 minutes
   - Action: Slack notification to #engineering

4. **Low Cache Hit Rate**
   - Condition: Hit rate < 70% for 30 minutes
   - Action: Slack notification to #engineering

**Low Priority (Monitor)**

5. **Provider Detection Issues**
   - Condition: Null provider rate > 15% for 1 hour
   - Action: Slack notification to #product

6. **Slow Searches**
   - Condition: Average search time > 200ms for 30 minutes
   - Action: Slack notification to #engineering

---

## Health Check Endpoint

**File**: `app/api/health/commerce-providers/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { getCommerceProvider } from '@/lib/agents/commerce-provider';

export async function GET() {
  const healthChecks = [];

  // Test Shopify provider resolution
  try {
    const shopifyDomain = 'test-shopify-store.myshopify.com';
    const shopifyProvider = await getCommerceProvider(shopifyDomain);
    healthChecks.push({
      provider: 'shopify',
      status: shopifyProvider?.platform === 'shopify' ? 'healthy' : 'degraded',
      detected: shopifyProvider !== null
    });
  } catch (error) {
    healthChecks.push({
      provider: 'shopify',
      status: 'unhealthy',
      error: error.message
    });
  }

  // Test WooCommerce provider resolution
  try {
    const wcDomain = 'test-woocommerce-store.com';
    const wcProvider = await getCommerceProvider(wcDomain);
    healthChecks.push({
      provider: 'woocommerce',
      status: wcProvider?.platform === 'woocommerce' ? 'healthy' : 'degraded',
      detected: wcProvider !== null
    });
  } catch (error) {
    healthChecks.push({
      provider: 'woocommerce',
      status: 'unhealthy',
      error: error.message
    });
  }

  const allHealthy = healthChecks.every(check => check.status === 'healthy');

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    providers: healthChecks,
    timestamp: new Date().toISOString()
  }, {
    status: allHealthy ? 200 : 503
  });
}
```

**Usage**:
```bash
# Check provider health
curl https://your-app.com/api/health/commerce-providers

# Automated monitoring (every 60s)
curl -f https://your-app.com/api/health/commerce-providers || alert_team
```

---

## Post-Deployment Checklist

### Day 1 (0-24 hours)

- [ ] Verify provider cache hit rate > 85%
- [ ] Confirm error rate < 1%
- [ ] Check average resolution time < 50ms
- [ ] Monitor Slack/PagerDuty for alerts
- [ ] Review error logs for any new patterns

### Week 1 (1-7 days)

- [ ] Analyze provider detection success rates
- [ ] Review search result quality metrics
- [ ] Identify any performance bottlenecks
- [ ] Collect user feedback on new platform support
- [ ] Document any configuration changes needed

### Month 1 (1-30 days)

- [ ] Evaluate cache TTL effectiveness
- [ ] Review provider registry for new platform candidates
- [ ] Analyze search performance improvements
- [ ] Plan optimizations based on metrics
- [ ] Update documentation with learnings

---

## Rollback Triggers

Initiate rollback if:

1. **Error rate > 10%** for 30 minutes
2. **P95 resolution time > 2000ms** for 1 hour
3. **Cache hit rate < 50%** for 2 hours
4. **Critical customer complaints** > 5 in 1 hour
5. **Data corruption** detected in provider cache

**Rollback Procedure**: See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

## Support Resources

- **On-Call Runbook**: [Confluence Link]
- **Incident Response**: [PagerDuty Playbook]
- **Team Slack**: #commerce-platform-support
- **Escalation**: engineering@yourcompany.com

---

**Last Updated**: 2025-10-23
**Next Review**: 2025-11-23
