**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Performance Monitoring Modules

**Purpose:** Modular performance tracking system for API endpoints with Redis-based metrics aggregation.

**Last Updated:** 2025-11-08
**Status:** Active
**Parent Module:** [lib/monitoring/performance.ts](../performance.ts)

## Architecture

Refactored from single 425 LOC file into 5 focused modules, each under 300 LOC.

### Module Structure

```
lib/monitoring/perf/
├── types.ts          (26 LOC)  - Type definitions
├── thresholds.ts     (32 LOC)  - Performance thresholds and severity logic
├── collector.ts      (134 LOC) - Redis metrics collection
├── aggregator.ts     (171 LOC) - Metrics retrieval and percentile calculations
└── tracker.ts        (139 LOC) - Endpoint wrapper with logging
```

**Main File:** `lib/monitoring/performance.ts` (80 LOC) - Public API orchestrator

## Module Responsibilities

### types.ts
- `PerformanceMetrics` - Individual metric data points
- `AggregatedMetrics` - Calculated statistics (p50, p95, p99, cache hit rate)

### thresholds.ts
- Performance thresholds (1s slow, 3s very slow)
- Severity calculation utilities
- TTL configuration (24 hours)

### collector.ts
- `recordMetric()` - Store metrics in Redis sorted sets
- `recordCachedMetric()` - Track cache hits/misses
- `clearMetrics()` - Cleanup for testing/incidents

### aggregator.ts
- `getAggregatedMetrics()` - Calculate percentiles and averages
- `getAllMetrics()` - Retrieve all endpoint stats
- Percentile calculation (p50, p95, p99)
- Cache hit rate computation

### tracker.ts
- `trackEndpoint()` - Wrap handler with performance tracking
- `trackCachedEndpoint()` - Track with cache awareness
- Severity-based logging (debug/warn/error)

## Public API

All exports from main file are preserved:

```typescript
import { PerformanceMonitor } from '@/lib/monitoring/performance';
import type { PerformanceMetrics, AggregatedMetrics } from '@/lib/monitoring/performance';
import { getAggregatedMetrics, getAllMetrics, clearMetrics } from '@/lib/monitoring/performance';

// Track endpoint
PerformanceMonitor.trackEndpoint('conversations.list', async () => {
  return NextResponse.json(data);
});

// Track with cache
PerformanceMonitor.trackCachedEndpoint('search', true, async () => {
  return NextResponse.json(cachedData);
});

// Get metrics
const metrics = await getAggregatedMetrics('conversations.list');
```

## Redis Data Structure

```
perf:{endpoint}:durations:{date}   - Sorted set of duration JSON objects
perf:{endpoint}:count:{date}       - Total request count
perf:{endpoint}:errors:{date}      - Error count
perf:{endpoint}:slow:{date}        - Slow query count
perf:{endpoint}:cache:hits:{date}  - Cache hit count
perf:{endpoint}:cache:misses:{date} - Cache miss count
```

All keys expire after 24 hours (METRICS_TTL).

## Design Decisions

1. **Modular Extraction**: Separated by concern (types, thresholds, collection, aggregation, tracking)
2. **Main File Delegation**: Thin wrapper that re-exports and delegates
3. **Preserved API**: All existing exports maintained for backward compatibility
4. **No Breaking Changes**: Refactoring is transparent to consumers
5. **Fire and Forget**: Metric recording never blocks endpoint responses

## Related

- [Performance Tracker](../performance-tracker.ts) - Alternative tracking implementation
- [Performance Collector](../performance-collector.ts) - Widget performance collection
- [Monitoring Dashboard](../../../components/dashboard/PerformanceMonitoring.tsx)

## Refactoring Metrics

- **Original:** 425 LOC (single file)
- **Refactored:** 582 LOC total (80 LOC main + 502 LOC modules)
- **Largest Module:** aggregator.ts (171 LOC) ✅ Under 300 LOC limit
- **Main File:** 80 LOC ✅ Under 100 LOC target
- **Time to Refactor:** ~15 minutes
