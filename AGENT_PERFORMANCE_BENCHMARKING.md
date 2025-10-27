# Agent Performance Benchmarking Framework

## Overview

Comprehensive performance testing framework for the customer agent system. Measures response times, database query performance, throughput, and identifies bottlenecks without consuming OpenAI API credits.

## Quick Start

```bash
# Basic benchmark (summary only)
npx tsx test-agent-performance-benchmark.ts

# Verbose output (shows individual benchmark details)
npx tsx test-agent-performance-benchmark.ts --verbose

# Detailed output (includes progress updates)
npx tsx test-agent-performance-benchmark.ts --detailed
```

## What It Measures

### 1. Embedding Generation Performance
- **Operations**: 50 embedding generations
- **Measures**: OpenAI API call simulation
- **Baseline Target**: >400 ops/sec
- **Real-world Impact**: Affects every semantic search query

### 2. Vector Search Performance
- **Operations**: 100 vector searches
- **Measures**: Supabase pgvector RPC performance
- **Baseline Target**: >800 ops/sec
- **Real-world Impact**: Core search functionality latency

### 3. Keyword Search Performance
- **Operations**: 100 keyword searches
- **Measures**: PostgreSQL full-text search
- **Baseline Target**: >800 ops/sec
- **Real-world Impact**: Fallback search speed for short queries

### 4. Agent Response Time
- **Operations**: 30 complete agent flows
- **Measures**: Full pipeline (embedding + search + chat)
- **Baseline Target**: >100 ops/sec
- **Real-world Impact**: End-to-end user experience

### 5. Concurrent Request Handling
- **Operations**: 50 requests (10 parallel)
- **Measures**: System throughput under load
- **Baseline Target**: >400 ops/sec
- **Real-world Impact**: Multi-user scalability

### 6. Cache Performance
- **Operations**: 200 operations with 70% hit rate
- **Measures**: Cache effectiveness and speed
- **Baseline Target**: >1000 ops/sec
- **Real-world Impact**: Reduced database load

## Sample Output

### Basic Run
```
🚀 Starting Agent Performance Benchmarks

============================================================
📊 PERFORMANCE SUMMARY
============================================================
Total Duration: 17548.72ms
Total Operations: 530
Average Throughput: 219.77 ops/sec
Average Latency: 75.28ms
Success Rate: 100.0%

Individual Benchmark Results:
────────────────────────────────────────────────────────────
✅ Embedding Generation                    9.89 ops/sec
   Latency: avg=101.13ms p95=102.31ms p99=104.75ms
✅ Vector Search                          90.90 ops/sec
   Latency: avg=11.00ms p95=11.19ms p99=12.90ms
✅ Keyword Search                         90.81 ops/sec
   Latency: avg=11.01ms p95=11.15ms p99=11.30ms
✅ Agent Response Time                     3.19 ops/sec
   Latency: avg=313.08ms p95=313.78ms p99=314.73ms
✅ Concurrent Requests (10 parallel)     885.87 ops/sec
   Latency: avg=11.28ms p95=11.69ms p99=11.69ms
✅ Cache Performance (hit rate simulation)   237.95 ops/sec
   Latency: avg=4.20ms p95=11.08ms p99=11.17ms
```

## Interpreting Results

### Metrics Explained

**Throughput (ops/sec)**
- Higher is better
- Operations per second the system can handle
- Compare against baseline targets

**Latency Percentiles**
- **p50 (median)**: Half of requests are faster
- **p95**: 95% of requests are faster (typical SLA target)
- **p99**: 99% of requests are faster (catches outliers)

**Success Rate**
- Should always be 100%
- Anything less indicates system failures

### Performance Baselines

| Benchmark | Target | Good | Needs Attention |
|-----------|--------|------|-----------------|
| Embedding Generation | >400 ops/sec | >300 ops/sec | <200 ops/sec |
| Vector Search | >800 ops/sec | >600 ops/sec | <400 ops/sec |
| Keyword Search | >800 ops/sec | >600 ops/sec | <400 ops/sec |
| Agent Response | >100 ops/sec | >50 ops/sec | <25 ops/sec |
| Concurrent Requests | >400 ops/sec | >300 ops/sec | <200 ops/sec |
| Cache Performance | >1000 ops/sec | >500 ops/sec | <250 ops/sec |

## Mock vs Real Performance

### Mock Configuration
- **OpenAI Embedding**: 100ms simulated delay
- **OpenAI Chat**: 200ms simulated delay
- **Supabase Query**: 10ms simulated delay

### Real-World Expectations
- **OpenAI Embedding**: 100-300ms (network + API)
- **OpenAI Chat**: 500-2000ms (depends on response length)
- **Supabase Query**: 10-100ms (depends on query complexity and network)

### Why Mock?
1. **Cost**: No OpenAI API credits consumed
2. **Speed**: Benchmarks complete in <30 seconds
3. **Consistency**: Removes network variability
4. **Isolation**: Tests system architecture, not external APIs

## Using Results to Optimize

### If Embedding Generation is Slow
- ✅ Implement embedding caching (already in place)
- ✅ Batch embedding requests
- ⚠️ Consider alternative embedding models

### If Vector Search is Slow
- ✅ Verify database indexes on `page_embeddings`
- ✅ Check `search_embeddings` RPC function optimization
- ✅ Reduce similarity threshold for faster but less accurate results
- ⚠️ Consider query result caching

### If Keyword Search is Slow
- ✅ Add indexes on frequently searched columns
- ✅ Use PostgreSQL full-text search indexes (GIN)
- ✅ Limit search scope with domain filtering

### If Agent Response is Slow
- ✅ Profile full request flow to identify bottleneck
- ✅ Implement streaming responses for better UX
- ✅ Cache common queries
- ⚠️ Consider parallel search strategies

### If Concurrent Performance Degrades
- ✅ Check database connection pooling
- ✅ Verify Redis connection limits
- ✅ Monitor system resource utilization
- ⚠️ Consider horizontal scaling

### If Cache Performance is Poor
- ✅ Verify cache hit rate (target >60%)
- ✅ Increase cache TTL for stable content
- ✅ Implement cache warming for common queries
- ⚠️ Consider distributed caching

## Advanced Usage

### Custom Mock Delays

Edit `/Users/jamesguy/Omniops/test-agent-performance-benchmark.ts`:

```typescript
// Adjust these values to match your real-world observations
this.mockOpenAI = new MockOpenAIClient(150); // 150ms delay
this.mockSupabase = new MockSupabaseClient(25); // 25ms delay
```

### Adding Custom Benchmarks

```typescript
private async benchmarkCustomOperation(): Promise<BenchmarkResult> {
  const name = 'Custom Operation';
  const operations = 100;
  const timer = new PerformanceTimer();

  try {
    const start = performance.now();

    for (let i = 0; i < operations; i++) {
      timer.start();
      // Your operation here
      await yourCustomOperation();
      timer.record();
    }

    const duration = performance.now() - start;
    const stats = timer.getStats();
    const opsPerSecond = (operations / duration) * 1000;

    return {
      name,
      duration,
      operations,
      opsPerSecond,
      avgLatency: stats.avg,
      p50: stats.p50,
      p95: stats.p95,
      p99: stats.p99,
      success: true
    };
  } catch (error: any) {
    // Return error result
  }
}
```

## Integration with CI/CD

### Performance Regression Testing

Add to your CI pipeline:

```yaml
- name: Run Performance Benchmarks
  run: npx tsx test-agent-performance-benchmark.ts

- name: Check Performance Regression
  run: |
    # Parse output and compare against baselines
    # Fail if performance drops below thresholds
```

### Tracking Performance Over Time

```bash
# Save results with timestamp
npx tsx test-agent-performance-benchmark.ts > "benchmark-$(date +%Y%m%d-%H%M%S).log"

# Compare with previous run
diff benchmark-latest.log benchmark-previous.log
```

## Troubleshooting

### Benchmark Fails to Start
```bash
# Ensure TypeScript runtime is available
npm install -g tsx

# Verify script exists
ls -la test-agent-performance-benchmark.ts
```

### Inconsistent Results
- Run multiple times and average results
- Close other applications to reduce system noise
- Ensure system is not under heavy load

### Performance Much Worse Than Expected
1. Check system resources (CPU, memory)
2. Verify no other processes consuming resources
3. Run with `--detailed` to see progress
4. Compare against previous baseline runs

## Related Documentation

- **Search Architecture**: `/Users/jamesguy/Omniops/docs/01-ARCHITECTURE/search-architecture.md`
- **Performance Optimization**: `/Users/jamesguy/Omniops/docs/01-ARCHITECTURE/performance-optimization.md`
- **Database Schema**: `/Users/jamesguy/Omniops/docs/01-ARCHITECTURE/database-schema.md`

## Continuous Improvement

### Quarterly Review
1. Run benchmarks and record results
2. Compare against previous quarter
3. Identify degradation trends
4. Plan optimization sprints

### Before Major Releases
1. Run full benchmark suite
2. Compare against previous release
3. Document any performance changes
4. Update baselines if improvements made

### After Infrastructure Changes
1. Run benchmarks immediately
2. Compare against pre-change baseline
3. Verify no unexpected degradation
4. Document new performance characteristics

---

**Last Updated**: 2025-10-27
**Script Location**: `/Users/jamesguy/Omniops/test-agent-performance-benchmark.ts`
**Maintainer**: Performance Engineering Team
