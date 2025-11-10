# Benchmark Utilities

**Purpose:** Shared utilities for performance benchmarking across the test suite.

**Last Updated:** 2025-11-08
**Related:** [Agent Performance Benchmarks](../../agents/performance/)

## Overview

This directory contains reusable benchmark infrastructure used by all performance tests. By extracting shared code, we:
- Eliminate duplication across benchmark files
- Ensure consistent measurement methodology
- Keep individual benchmark files under 300 LOC

## Files

### helpers.ts (196 LOC)

Comprehensive benchmark utilities including:

#### Types
- `BenchmarkResult` - Standardized benchmark results format
- `SystemMetrics` - Overall system performance metrics

#### Classes
- `PerformanceTimer` - High-precision timing and statistics
- `MockOpenAIClient` - Simulated OpenAI API for testing
- `MockSupabaseClient` - Simulated Supabase database for testing

#### Helper Functions
- `calculateSummaryMetrics()` - Aggregate benchmark statistics
- `printBenchmarkResult()` - Format benchmark output
- `logIfVerbose()` - Conditional logging

## Usage

### Basic Benchmark

```typescript
import {
  BenchmarkResult,
  PerformanceTimer,
  MockOpenAIClient,
  printBenchmarkResult
} from '../../utils/benchmark/helpers';

export async function benchmarkSomething(
  mockClient: MockOpenAIClient,
  verbose: boolean = false
): Promise<BenchmarkResult> {
  const timer = new PerformanceTimer();
  const operations = 100;

  for (let i = 0; i < operations; i++) {
    timer.start();
    await mockClient.embeddings();
    timer.record();
  }

  const stats = timer.getStats();
  const result: BenchmarkResult = {
    name: 'My Benchmark',
    duration: stats.avg * operations,
    operations,
    opsPerSecond: (operations / (stats.avg * operations)) * 1000,
    avgLatency: stats.avg,
    p50: stats.p50,
    p95: stats.p95,
    p99: stats.p99,
    success: true
  };

  printBenchmarkResult(result, verbose);
  return result;
}
```

### Performance Timer

```typescript
import { PerformanceTimer } from '../../utils/benchmark/helpers';

const timer = new PerformanceTimer();

// Measure operation
timer.start();
await someOperation();
const duration = timer.record();

// Get statistics after multiple measurements
timer.start();
await anotherOperation();
timer.record();

const stats = timer.getStats(); // { avg, p50, p95, p99 }
```

### Mock Clients

```typescript
import { MockOpenAIClient, MockSupabaseClient } from '../../utils/benchmark/helpers';

// OpenAI mock with 100ms delay
const mockAI = new MockOpenAIClient(100);
await mockAI.embeddings(); // Returns mock embedding
await mockAI.chat(); // Returns mock chat response

// Supabase mock with 10ms delay
const mockDB = new MockSupabaseClient(10);
await mockDB.rpc('search_embeddings', params); // Returns mock results
await mockDB.from('table').select().eq('id', '1'); // Mock query
```

## Mock Implementations

### MockOpenAIClient

Simulates OpenAI API calls with configurable delays:

**Methods:**
- `embeddings()` - Returns 1536-dimensional random vector
- `chat()` - Returns mock chat completion

**Configuration:**
- Constructor accepts delay in milliseconds (default: 100ms)
- Chat delay is 2x embedding delay

### MockSupabaseClient

Simulates Supabase database operations:

**Methods:**
- `rpc(name, params)` - Mock RPC calls (e.g., `search_embeddings`)
- `from(table)` - Mock query builder

**Features:**
- Generates 100 mock product records
- Supports chained query methods: `select()`, `eq()`, `ilike()`, `limit()`
- Configurable query delay (default: 10ms)

## Statistics

### PerformanceTimer Statistics

The timer calculates:
- **avg** - Mean of all measurements
- **p50** - Median (50th percentile)
- **p95** - 95th percentile (worst 5% excluded)
- **p99** - 99th percentile (worst 1% excluded)

Percentiles help identify outliers and worst-case performance.

### BenchmarkResult Format

```typescript
{
  name: string;           // Benchmark name
  duration: number;       // Total duration (ms)
  operations: number;     // Number of operations
  opsPerSecond: number;   // Throughput
  avgLatency: number;     // Average latency (ms)
  p50: number;           // Median latency (ms)
  p95: number;           // 95th percentile (ms)
  p99: number;           // 99th percentile (ms)
  success: boolean;      // Whether benchmark succeeded
  error?: string;        // Error message if failed
}
```

## Best Practices

1. **Use PerformanceTimer for all measurements**
   - Ensures consistent timing methodology
   - Automatically collects percentile statistics

2. **Always catch errors**
   - Return `success: false` with error message
   - Don't let exceptions break benchmark suite

3. **Configure realistic mock delays**
   - OpenAI embeddings: ~100ms
   - OpenAI chat: ~200ms
   - Database queries: ~10ms
   - Adjust based on real-world observations

4. **Report detailed progress when requested**
   - Use `detailed` flag for progress updates
   - Use `verbose` flag for result printing

5. **Keep benchmarks focused**
   - One benchmark = one operation type
   - Split complex benchmarks into modules

## Extending

To add new mock clients:

```typescript
export class MockNewService {
  private delay: number;

  constructor(delay: number = 50) {
    this.delay = delay;
  }

  async someOperation() {
    await this.delayMs(this.delay);
    return { /* mock data */ };
  }

  private delayMs(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Performance Targets

Use these helpers to measure against established baselines:

| Operation | Target Throughput | Typical Latency |
|-----------|------------------|-----------------|
| Embedding Generation | >400 ops/sec | ~100ms |
| Vector Search | >800 ops/sec | ~10ms |
| Keyword Search | >800 ops/sec | ~10ms |
| Agent Response | >100 ops/sec | ~300ms |
| Cache Hit | >2000 ops/sec | <1ms |

**Note:** Targets are based on mock performance. Real-world performance depends on infrastructure.
