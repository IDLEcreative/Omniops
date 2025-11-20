# Performance Test Utilities

**Type:** Test Infrastructure
**Status:** Active
**Last Updated:** 2025-11-19
**Purpose:** Core utilities for performance testing including load generation, metrics collection, and assertions.

## Overview

This directory contains the foundational utilities used by all performance tests in the suite.

## Utilities

### load-generator.ts

Generates HTTP load with various patterns:
- **Fixed concurrency**: Generate N requests with M concurrent workers
- **Sustained load**: Generate requests for a specific duration
- **Ramp-up load**: Gradually increase concurrency

**Usage:**
```typescript
import { generateLoad, generateSustainedLoad } from './load-generator';

// Fixed concurrency
const results = await generateLoad(
  {
    url: 'http://localhost:3000/api/chat',
    method: 'POST',
    body: { message: 'test' }
  },
  10,  // concurrency
  100  // total requests
);

// Sustained load
const results = await generateSustainedLoad(
  { url: 'http://localhost:3000/api/search' },
  5,      // concurrency
  60000   // duration in ms
);
```

### metrics-collector.ts

Collects and analyzes performance metrics:
- Response time percentiles (p50, p90, p95, p99)
- Throughput (requests/second)
- Success/error rates
- Memory usage tracking

**Usage:**
```typescript
import { collectMetrics, printMetrics } from './metrics-collector';

const metrics = collectMetrics(loadTestResults);
printMetrics(metrics, 'My Test');

// Memory tracking
const before = collectMemoryMetrics();
// ... run tests ...
const after = collectMemoryMetrics();
const delta = calculateMemoryDelta(before, after);
```

### assertion-helpers.ts

Custom assertions for performance testing:
- Response time thresholds
- Throughput requirements
- Error rate limits
- Memory leak detection

**Usage:**
```typescript
import { assertResponseTime, assertThroughput, assertNoMemoryLeak } from './assertion-helpers';

// Assert performance budgets
assertResponseTime(metrics, { p95: 2000 });
assertThroughput(metrics, 50); // 50 req/s minimum
assertErrorRate(metrics, 5);   // 5% max error rate

// Assert no memory leaks
assertNoMemoryLeak(beforeMemory, afterMemory, 50); // 50MB max growth
```

## Performance Budgets

Default performance budgets used across tests:

| Metric | Budget | Rationale |
|--------|--------|-----------|
| Chat p95 | < 2000ms | User experience threshold |
| Search p95 | < 500ms | Interactive response time |
| API throughput | > 50 req/s | Scale requirement |
| Error rate | < 5% | Acceptable failure rate |
| Memory growth | < 50MB | Memory leak threshold |

## Related Documentation

- [Performance Optimization Guide](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Main Performance Tests README](/home/user/Omniops/__tests__/performance/README.md)
