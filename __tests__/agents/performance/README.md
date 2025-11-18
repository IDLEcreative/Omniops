**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Agent Performance Benchmark Modules

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 2 minutes

**Purpose:** Modular performance benchmarks for the customer agent system, split into focused categories to comply with 300 LOC limit.

**Related:** [Benchmark Helpers](../../utils/benchmark/helpers.ts), [Main Runner](../test-agent-performance-benchmark.ts)

## Structure

This directory contains performance benchmarks organized by category:

### Files

| File | LOC | Purpose |
|------|-----|---------|
| `search-benchmarks.ts` | 204 | Embedding generation, vector search, keyword search |
| `agent-benchmarks.ts` | 86 | Complete agent response flow (embedding + search + chat) |
| `concurrency-benchmarks.ts` | 173 | Concurrent requests and cache performance |

### Shared Utilities

All benchmarks use shared utilities from `__tests__/utils/benchmark/helpers.ts` (196 LOC):
- `BenchmarkResult`, `SystemMetrics` types
- `PerformanceTimer` class for measurement
- `MockOpenAIClient`, `MockSupabaseClient` for testing
- Helper functions for reporting

## Usage

Benchmarks are orchestrated by the main runner:

```bash
# Run all benchmarks
npx tsx __tests__/agents/test-agent-performance-benchmark.ts

# Verbose output
npx tsx __tests__/agents/test-agent-performance-benchmark.ts --verbose

# Detailed progress
npx tsx __tests__/agents/test-agent-performance-benchmark.ts --detailed
```

## Benchmark Categories

### Search Benchmarks
- **Embedding Generation:** Tests OpenAI embedding generation performance (50 ops)
- **Vector Search:** Tests pgvector search performance (100 ops)
- **Keyword Search:** Tests PostgreSQL ILIKE search performance (100 ops)

**Target:** >400-1000 ops/sec depending on operation

### Agent Benchmarks
- **Agent Response Time:** Complete flow simulation (30 ops)
  - Embedding generation
  - Vector search
  - Chat completion

**Target:** >100 ops/sec

### Concurrency Benchmarks
- **Concurrent Requests:** Parallel request handling (50 ops, 10 concurrent)
- **Cache Performance:** Cache hit rate simulation (200 ops, 70% hit rate)

**Target:** >400-2000 ops/sec depending on operation

## Performance Baselines

All benchmarks measure:
- Total duration
- Operations per second (throughput)
- Average latency
- p50, p95, p99 percentiles

**Note:** These are mock-based benchmarks. Real-world performance will vary based on:
- Network latency
- OpenAI API response times
- Supabase database load
- Infrastructure resources

## Architecture

**Original File:** 671 LOC (violated 300 LOC limit)

**Refactored Structure:**
1. **Shared Utilities** (`__tests__/utils/benchmark/helpers.ts`) - 196 LOC
   - Types, mocks, timer class
2. **Search Benchmarks** (`search-benchmarks.ts`) - 204 LOC
   - 3 benchmark functions
3. **Agent Benchmarks** (`agent-benchmarks.ts`) - 86 LOC
   - 1 benchmark function
4. **Concurrency Benchmarks** (`concurrency-benchmarks.ts`) - 173 LOC
   - 2 benchmark functions
5. **Main Runner** (`test-agent-performance-benchmark.ts`) - 142 LOC
   - Orchestrator and reporting

**Result:** All files <300 LOC, total functionality preserved

## Extending Benchmarks

To add a new benchmark:

1. Create benchmark function in appropriate module (or new module if needed)
2. Import in `test-agent-performance-benchmark.ts`
3. Add to `runAllBenchmarks()` method
4. Update performance baselines in `printPerformanceBaselines()`

Example:

```typescript
// In new file: resource-benchmarks.ts
export async function benchmarkMemoryUsage(
  mockClient: MockClient,
  verbose: boolean = false,
  detailed: boolean = false
): Promise<BenchmarkResult> {
  // Implementation
}

// In test-agent-performance-benchmark.ts
import { benchmarkMemoryUsage } from './performance/resource-benchmarks';

// Add to runAllBenchmarks()
benchmarks.push(await benchmarkMemoryUsage(this.mockClient, this.verbose, this.detailed));
```

## Verification

All benchmarks execute successfully:
- ✅ All files <300 LOC
- ✅ TypeScript compiles cleanly
- ✅ Benchmarks run without errors
- ✅ 100% success rate on all operations
- ✅ Performance metrics collected accurately
