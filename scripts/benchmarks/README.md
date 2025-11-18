# Benchmark Scripts

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Performance Optimization](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md), [Search Architecture](/home/user/Omniops/docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md), [Main Scripts README](/home/user/Omniops/scripts/README.md)
**Estimated Read Time:** 4 minutes

## Purpose

Performance benchmarking and analysis tools for measuring system performance, establishing baselines, tracking improvements, and identifying bottlenecks.

## Quick Links

- [Main Scripts README](/home/user/Omniops/scripts/README.md)
- [Performance Optimization Guide](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Search Architecture](/home/user/Omniops/docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

## Keywords

benchmarking, performance, metrics, vector search, latency, throughput, optimization, profiling, baselines

## Overview

This directory contains scripts for measuring and analyzing system performance. Use these tools to establish baselines, track improvements, and identify bottlenecks.

## Available Tools

### benchmark-vector-graph-analysis.ts
**Purpose:** Comprehensive vector search performance benchmarking with visualization

**Usage:**
```bash
npx tsx scripts/benchmarks/benchmark-vector-graph-analysis.ts
```

**What it benchmarks:**
- Vector similarity search performance
- Impact of index configuration (IVFFlat parameters)
- Query performance at different result limits
- Effect of dimensionality on search speed
- Cache impact on search performance

**Metrics measured:**
- Query latency (p50, p95, p99)
- Throughput (queries per second)
- Index build time
- Memory usage
- Accuracy vs. speed tradeoffs

**Output:**
```
Vector Search Benchmark Report

Configuration:
  Vector dimensions: 1536 (OpenAI embeddings)
  Index type: IVFFlat
  Lists: 100
  Probes: 10

Results:
  Queries: 100
  p50 latency: 45ms
  p95 latency: 180ms
  p99 latency: 320ms
  Throughput: 22.2 qps

  Accuracy: 94.5%
  Recall@10: 0.98

Performance by result limit:
  Limit 5:  35ms avg
  Limit 10: 45ms avg
  Limit 20: 78ms avg
  Limit 50: 145ms avg

Recommendations:
  ✓ Index configuration is optimal
  - Consider increasing probes for better accuracy
  - Cache frequently searched queries
```

**Graph analysis includes:**
- Latency vs. result limit curves
- Accuracy vs. speed tradeoffs
- Index parameter sensitivity
- Historical performance trends

**Use cases:**
- Optimizing vector search configuration
- Capacity planning for search workloads
- Validating pgvector parameter tuning
- Tracking search performance over time
- A/B testing index configurations

## Benchmark Best Practices

### Running Benchmarks

1. **Establish baseline** - Run benchmarks before making changes
   ```bash
   npx tsx scripts/benchmarks/benchmark-vector-graph-analysis.ts > baseline.txt
   ```

2. **Make changes** - Apply optimizations

3. **Re-benchmark** - Measure improvement
   ```bash
   npx tsx scripts/benchmarks/benchmark-vector-graph-analysis.ts > after-optimization.txt
   ```

4. **Compare results** - Calculate % improvement
   ```bash
   diff baseline.txt after-optimization.txt
   ```

### Ensuring Accurate Results

- **Warm up** - Run benchmark once to warm caches, then run again
- **Consistent load** - Run during low-traffic periods
- **Multiple runs** - Average results from 3-5 runs
- **Stable environment** - No other intensive processes running
- **Representative data** - Use production-like data volume

### Interpreting Results

**Latency Percentiles:**
- **p50 (median):** Typical user experience
- **p95:** 95% of users experience this or better
- **p99:** Worst-case for 99% of users

**Throughput:**
- Queries per second (qps) the system can handle
- Lower latency = higher throughput capacity

**Accuracy vs. Speed:**
- Faster searches may sacrifice some accuracy
- Find the sweet spot for your use case

## Performance Targets

### Vector Search

**Good performance:**
- p50 < 50ms
- p95 < 200ms
- p99 < 500ms
- Recall@10 > 0.90

**Excellent performance:**
- p50 < 30ms
- p95 < 100ms
- p99 < 300ms
- Recall@10 > 0.95

### When to Optimize

Optimize if:
- p95 > 300ms consistently
- Recall < 0.85
- Throughput < 10 qps on modern hardware
- Performance degrading over time

## Optimization Workflow

1. **Benchmark current performance**
   ```bash
   npx tsx scripts/benchmarks/benchmark-vector-graph-analysis.ts
   ```

2. **Identify bottleneck** - Check which metric is worst

3. **Apply targeted optimization:**
   - High latency → Adjust index parameters (lists, probes)
   - Low accuracy → Increase probes or rebuild index
   - Low throughput → Add connection pooling, cache queries

4. **Re-benchmark** - Verify improvement

5. **Document results** - Save benchmark reports

## Integration with CI/CD

Add performance regression tests:

```yaml
# .github/workflows/performance.yml
- name: Run benchmarks
  run: npx tsx scripts/benchmarks/benchmark-vector-graph-analysis.ts

- name: Check for regression
  run: |
    # Fail if p95 increased by >10%
    ./scripts/check-performance-regression.sh
```

## Saving Results

Save benchmark results for historical comparison:

```bash
# Create benchmarks directory
mkdir -p benchmarks/results

# Save with timestamp
npx tsx scripts/benchmarks/benchmark-vector-graph-analysis.ts \
  > benchmarks/results/benchmark-$(date +%Y%m%d-%H%M%S).json
```

## Related Scripts

- **Monitoring:** `scripts/monitoring/benchmark-database-improvements.ts` - Continuous performance tracking
- **Monitoring:** `scripts/monitoring/benchmark-actual-performance.ts` - Real-world performance measurement
- **Analysis:** `scripts/analysis/profile-database-performance.js` - Database profiling

## Related Documentation

- [Performance Optimization Guide](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Search Architecture](/home/user/Omniops/docs/01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md)
- [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Main Scripts README](/home/user/Omniops/scripts/README.md)
