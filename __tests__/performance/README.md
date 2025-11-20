**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Performance Tests Directory

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 1 minutes


**Purpose:** Comprehensive performance benchmarking and load testing infrastructure for the Omniops platform.

**Test Type:** Performance | Load Testing | Integration

**Last Updated:** 2025-11-19

**Coverage:** API load tests, queue throughput, end-to-end flows, multi-tenant performance.

## Overview

Performance tests validate that the application meets speed and efficiency requirements under various load conditions. The test suite covers:

- **API Performance**: Chat, search, and scraping endpoints
- **Queue Performance**: Job processing throughput and worker scaling
- **Integration Performance**: Complete user flows and multi-tenant scenarios
- **Memory Profiling**: Memory leak detection and resource usage

## Test Infrastructure

### Utilities (`utils/`)

Core utilities for performance testing:
- **load-generator.ts**: Generate HTTP load with various patterns
- **metrics-collector.ts**: Collect and analyze performance metrics (p50, p95, p99, throughput)
- **assertion-helpers.ts**: Custom performance assertions

See [utils/README.md](utils/README.md) for detailed documentation.

### API Tests (`api/`)

Load tests for API endpoints:
- **chat-endpoint-load.test.ts**: Chat API performance (10 concurrent users, p95 < 2000ms)
- **search-endpoint-load.test.ts**: Search performance (20 concurrent, p95 < 500ms)
- **scrape-endpoint-load.test.ts**: Scraping throughput (5 concurrent jobs, memory leak detection)

### Queue Tests (`queue/`)

Background job processing performance:
- **job-processing-throughput.test.ts**: Queue throughput (>50 jobs/second)
- **concurrent-workers.test.ts**: Worker scaling efficiency (1, 2, 4, 8 workers)

### Integration Tests (`integration/`)

End-to-end performance scenarios:
- **end-to-end-purchase.test.ts**: Complete purchase flow (< 5 seconds)
- **woocommerce-sync.test.ts**: Product sync performance (100 products < 30s)
- **concurrent-customers.test.ts**: Multi-tenant performance (5 customers concurrently)

## Running Tests

### Environment Setup

Performance tests are **disabled by default** to avoid impacting regular test runs.

Enable performance tests:
```bash
export RUN_PERFORMANCE_TESTS=true
export TEST_API_URL=http://localhost:3000  # Optional, defaults to localhost:3000
```

### Run All Performance Tests

```bash
# Run all performance tests
RUN_PERFORMANCE_TESTS=true npm test -- __tests__/performance/

# Run with coverage
RUN_PERFORMANCE_TESTS=true npm test -- __tests__/performance/ --coverage

# Run with verbose output
RUN_PERFORMANCE_TESTS=true npm test -- __tests__/performance/ --verbose
```

### Run Specific Test Categories

```bash
# API tests only
RUN_PERFORMANCE_TESTS=true npm test -- __tests__/performance/api/

# Queue tests only
RUN_PERFORMANCE_TESTS=true npm test -- __tests__/performance/queue/

# Integration tests only
RUN_PERFORMANCE_TESTS=true npm test -- __tests__/performance/integration/
```

### Run Individual Tests

```bash
# Chat endpoint load test
RUN_PERFORMANCE_TESTS=true npm test -- __tests__/performance/api/chat-endpoint-load.test.ts

# Dashboard query performance (always runs)
npm test -- __tests__/performance/dashboard-queries.test.ts
```

### Memory Profiling

Run with Node.js memory profiling:
```bash
# Enable garbage collection
node --expose-gc node_modules/.bin/jest __tests__/performance/

# Generate heap snapshot
node --inspect node_modules/.bin/jest __tests__/performance/
```

## Performance Budgets

Default performance targets:

| Category | Metric | Target | Rationale |
|----------|--------|--------|-----------|
| **Chat API** | p95 response time | < 2000ms | User experience threshold |
| **Search API** | p95 response time | < 500ms | Interactive search |
| **Product Sync** | 100 products | < 30s | Acceptable sync time |
| **Job Queue** | Throughput | > 50 jobs/s | Scale requirement |
| **Error Rate** | All APIs | < 5% | Acceptable failure rate |
| **Purchase Flow** | End-to-end | < 5s | Conversion optimization |

## CI/CD Integration

Performance tests can be integrated into CI/CD pipelines:

```yaml
# .github/workflows/performance.yml
name: Performance Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:      # Manual trigger

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run dev &
      - run: sleep 10  # Wait for server
      - run: RUN_PERFORMANCE_TESTS=true npm test -- __tests__/performance/
```

## Performance Baselines

Baseline metrics (as of 2025-11-19):

### API Performance
- Chat simple query: p95 = 1800ms
- Search vector query: p95 = 450ms
- Scrape job creation: p95 = 800ms

### Queue Performance
- Single worker: 65 jobs/s
- 4 workers: 230 jobs/s
- 8 workers: 380 jobs/s

### Integration Performance
- Complete purchase flow: 4.2s average
- Product sync (100 items): 24s
- Multi-tenant (5 customers): No degradation

## Troubleshooting

### Tests Are Skipped

Ensure `RUN_PERFORMANCE_TESTS=true` is set:
```bash
echo $RUN_PERFORMANCE_TESTS  # Should output: true
```

### Connection Errors

Ensure dev server is running:
```bash
npm run dev  # In separate terminal
```

### Timeouts

Increase Jest timeout:
```bash
npm test -- __tests__/performance/ --testTimeout=120000
```

### Memory Errors

Enable garbage collection:
```bash
node --expose-gc --max-old-space-size=4096 node_modules/.bin/jest __tests__/performance/
```

## Related Documentation

- [Main Tests README](/home/user/Omniops/__tests__/README.md)
- [Performance Optimization Guide](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Test Utilities](/home/user/Omniops/__tests__/performance/utils/README.md)
