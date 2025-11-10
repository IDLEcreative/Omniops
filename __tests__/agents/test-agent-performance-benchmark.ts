/**
 * Agent Performance Benchmarking Framework
 *
 * Comprehensive performance testing for the customer agent system.
 * Measures response times, database query performance, and throughput.
 * Uses mocks for expensive operations (OpenAI API calls).
 *
 * Usage:
 *   npx tsx __tests__/agents/test-agent-performance-benchmark.ts
 *   npx tsx __tests__/agents/test-agent-performance-benchmark.ts --verbose
 *   npx tsx __tests__/agents/test-agent-performance-benchmark.ts --detailed
 */

import { performance } from 'perf_hooks';
import {
  SystemMetrics,
  BenchmarkResult,
  MockOpenAIClient,
  MockSupabaseClient,
  calculateSummaryMetrics
} from '../utils/benchmark/helpers';
import {
  benchmarkEmbeddingGeneration,
  benchmarkVectorSearch,
  benchmarkKeywordSearch
} from './performance/search-benchmarks';
import { benchmarkAgentResponseTime } from './performance/agent-benchmarks';
import {
  benchmarkConcurrentRequests,
  benchmarkCachePerformance
} from './performance/concurrency-benchmarks';

// ============================================================================
// Benchmark Orchestrator
// ============================================================================

class AgentBenchmark {
  private verbose: boolean;
  private detailed: boolean;
  private mockOpenAI: MockOpenAIClient;
  private mockSupabase: MockSupabaseClient;

  constructor(verbose: boolean = false, detailed: boolean = false) {
    this.verbose = verbose;
    this.detailed = detailed;
    this.mockOpenAI = new MockOpenAIClient(100); // 100ms mock delay
    this.mockSupabase = new MockSupabaseClient(10); // 10ms mock delay
  }

  async runAllBenchmarks(): Promise<SystemMetrics> {
    console.log('🚀 Starting Agent Performance Benchmarks\n');
    console.log('='.repeat(60));

    const overallStart = performance.now();
    const benchmarks: BenchmarkResult[] = [];

    // Run each benchmark category
    benchmarks.push(await benchmarkEmbeddingGeneration(this.mockOpenAI, this.verbose, this.detailed));
    benchmarks.push(await benchmarkVectorSearch(this.mockSupabase, this.verbose, this.detailed));
    benchmarks.push(await benchmarkKeywordSearch(this.mockSupabase, this.verbose, this.detailed));
    benchmarks.push(await benchmarkAgentResponseTime(this.mockOpenAI, this.mockSupabase, this.verbose, this.detailed));
    benchmarks.push(await benchmarkConcurrentRequests(this.mockSupabase, this.verbose, this.detailed));
    benchmarks.push(await benchmarkCachePerformance(this.mockSupabase, this.verbose, this.detailed));

    const totalDuration = performance.now() - overallStart;
    const summary = calculateSummaryMetrics(benchmarks);

    return {
      totalDuration,
      benchmarks,
      summary
    };
  }
}

// ============================================================================
// Results Reporting
// ============================================================================

function printSummary(results: SystemMetrics): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Duration: ${results.totalDuration.toFixed(2)}ms`);
  console.log(`Total Operations: ${results.summary.totalOps}`);
  console.log(`Average Throughput: ${results.summary.avgOpsPerSecond.toFixed(2)} ops/sec`);
  console.log(`Average Latency: ${results.summary.avgLatency.toFixed(2)}ms`);
  console.log(`Success Rate: ${results.summary.successRate.toFixed(1)}%`);
  console.log('');
}

function printBenchmarkResults(benchmarks: BenchmarkResult[]): void {
  console.log('Individual Benchmark Results:');
  console.log('─'.repeat(60));

  benchmarks.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name.padEnd(35)} ${result.opsPerSecond.toFixed(2).padStart(8)} ops/sec`);
    console.log(`   Latency: avg=${result.avgLatency.toFixed(2)}ms p95=${result.p95.toFixed(2)}ms p99=${result.p99.toFixed(2)}ms`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('');
}

function printPerformanceBaselines(): void {
  console.log('='.repeat(60));
  console.log('🎯 PERFORMANCE BASELINES');
  console.log('='.repeat(60));
  console.log('Embedding Generation:    >400 ops/sec (target: 500 ops/sec)');
  console.log('Vector Search:          >800 ops/sec (target: 1000 ops/sec)');
  console.log('Keyword Search:         >800 ops/sec (target: 1000 ops/sec)');
  console.log('Agent Response:         >100 ops/sec (target: 150 ops/sec)');
  console.log('Concurrent Requests:    >400 ops/sec (target: 500 ops/sec)');
  console.log('Cache Performance:     >1000 ops/sec (target: 2000 ops/sec)');
  console.log('');
  console.log('Note: These are mock-based benchmarks. Real-world performance');
  console.log('      will vary based on network latency, OpenAI API response times,');
  console.log('      and Supabase database load.');
  console.log('='.repeat(60));
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const detailed = args.includes('--detailed');

  const benchmark = new AgentBenchmark(verbose, detailed);
  const results = await benchmark.runAllBenchmarks();

  printSummary(results);
  printBenchmarkResults(results.benchmarks);
  printPerformanceBaselines();
}

main().catch(console.error);
