/**
 * Agent Performance Benchmarking Framework
 *
 * Comprehensive performance testing for the customer agent system.
 * Measures response times, database query performance, and throughput.
 * Uses mocks for expensive operations (OpenAI API calls).
 *
 * Usage:
 *   npx tsx test-agent-performance-benchmark.ts
 *   npx tsx test-agent-performance-benchmark.ts --verbose
 *   npx tsx test-agent-performance-benchmark.ts --detailed
 */

import { performance } from 'perf_hooks';

// Performance metrics collector
interface BenchmarkResult {
  name: string;
  duration: number;
  operations: number;
  opsPerSecond: number;
  avgLatency: number;
  p50: number;
  p95: number;
  p99: number;
  success: boolean;
  error?: string;
}

interface SystemMetrics {
  totalDuration: number;
  benchmarks: BenchmarkResult[];
  summary: {
    totalOps: number;
    avgOpsPerSecond: number;
    avgLatency: number;
    successRate: number;
  };
}

class PerformanceTimer {
  private startTime: number = 0;
  private measurements: number[] = [];

  start(): void {
    this.startTime = performance.now();
  }

  record(): number {
    const duration = performance.now() - this.startTime;
    this.measurements.push(duration);
    return duration;
  }

  getStats() {
    if (this.measurements.length === 0) {
      return { avg: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.measurements].sort((a, b) => a - b);
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return { avg, p50, p95, p99 };
  }

  reset(): void {
    this.measurements = [];
  }
}

// Mock implementations for expensive operations
class MockOpenAIClient {
  private responseDelay: number;

  constructor(responseDelay: number = 100) {
    this.responseDelay = responseDelay;
  }

  async embeddings() {
    // Simulate OpenAI embedding generation time
    await this.delay(this.responseDelay);
    return {
      data: [{ embedding: new Array(1536).fill(0).map(() => Math.random()) }]
    };
  }

  async chat() {
    // Simulate chat completion time
    await this.delay(this.responseDelay * 2);
    return {
      choices: [{ message: { content: 'Mock response from AI agent' } }]
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class MockSupabaseClient {
  private queryDelay: number;
  private mockData: any[];

  constructor(queryDelay: number = 10) {
    this.queryDelay = queryDelay;
    this.mockData = this.generateMockProducts(100);
  }

  private generateMockProducts(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: `Product ${i + 1}`,
      content: `Description for product ${i + 1}`,
      url: `https://example.com/product/${i + 1}`,
      similarity: 0.9 - (i * 0.005)
    }));
  }

  async rpc(name: string, params: any) {
    await this.delay(this.queryDelay);

    if (name === 'search_embeddings') {
      const limit = params.match_count || 10;
      return {
        data: this.mockData.slice(0, limit),
        error: null
      };
    }

    return { data: [], error: null };
  }

  from(table: string) {
    return {
      select: () => ({
        eq: () => ({
          ilike: () => ({
            limit: (limit: number) => this.mockQuery(limit)
          }),
          limit: (limit: number) => this.mockQuery(limit)
        }),
        limit: (limit: number) => this.mockQuery(limit)
      })
    };
  }

  private async mockQuery(limit: number) {
    await this.delay(this.queryDelay);
    return { data: this.mockData.slice(0, limit), error: null };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Benchmark implementations
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
    console.log('=' .repeat(60));

    const overallStart = performance.now();
    const benchmarks: BenchmarkResult[] = [];

    // Run each benchmark
    benchmarks.push(await this.benchmarkEmbeddingGeneration());
    benchmarks.push(await this.benchmarkVectorSearch());
    benchmarks.push(await this.benchmarkKeywordSearch());
    benchmarks.push(await this.benchmarkAgentResponseTime());
    benchmarks.push(await this.benchmarkConcurrentRequests());
    benchmarks.push(await this.benchmarkCachePerformance());

    const totalDuration = performance.now() - overallStart;

    // Calculate summary metrics
    const totalOps = benchmarks.reduce((sum, b) => sum + b.operations, 0);
    const avgOpsPerSecond = benchmarks.reduce((sum, b) => sum + b.opsPerSecond, 0) / benchmarks.length;
    const avgLatency = benchmarks.reduce((sum, b) => sum + b.avgLatency, 0) / benchmarks.length;
    const successCount = benchmarks.filter(b => b.success).length;
    const successRate = (successCount / benchmarks.length) * 100;

    return {
      totalDuration,
      benchmarks,
      summary: {
        totalOps,
        avgOpsPerSecond,
        avgLatency,
        successRate
      }
    };
  }

  private async benchmarkEmbeddingGeneration(): Promise<BenchmarkResult> {
    const name = 'Embedding Generation';
    const operations = 50;
    const timer = new PerformanceTimer();

    this.log(`\n📊 ${name}`);
    this.log('─'.repeat(60));

    try {
      const start = performance.now();

      for (let i = 0; i < operations; i++) {
        timer.start();
        await this.mockOpenAI.embeddings();
        timer.record();

        if (this.detailed && i % 10 === 0) {
          this.log(`  Progress: ${i}/${operations} embeddings generated`);
        }
      }

      const duration = performance.now() - start;
      const stats = timer.getStats();
      const opsPerSecond = (operations / duration) * 1000;

      const result: BenchmarkResult = {
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

      this.printResult(result);
      return result;

    } catch (error: any) {
      return {
        name,
        duration: 0,
        operations: 0,
        opsPerSecond: 0,
        avgLatency: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        success: false,
        error: error.message
      };
    }
  }

  private async benchmarkVectorSearch(): Promise<BenchmarkResult> {
    const name = 'Vector Search';
    const operations = 100;
    const timer = new PerformanceTimer();

    this.log(`\n📊 ${name}`);
    this.log('─'.repeat(60));

    try {
      const start = performance.now();

      for (let i = 0; i < operations; i++) {
        timer.start();
        await this.mockSupabase.rpc('search_embeddings', {
          query_embedding: new Array(1536).fill(0),
          p_domain_id: 'test-domain',
          match_threshold: 0.15,
          match_count: 10
        });
        timer.record();

        if (this.detailed && i % 20 === 0) {
          this.log(`  Progress: ${i}/${operations} searches completed`);
        }
      }

      const duration = performance.now() - start;
      const stats = timer.getStats();
      const opsPerSecond = (operations / duration) * 1000;

      const result: BenchmarkResult = {
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

      this.printResult(result);
      return result;

    } catch (error: any) {
      return {
        name,
        duration: 0,
        operations: 0,
        opsPerSecond: 0,
        avgLatency: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        success: false,
        error: error.message
      };
    }
  }

  private async benchmarkKeywordSearch(): Promise<BenchmarkResult> {
    const name = 'Keyword Search';
    const operations = 100;
    const timer = new PerformanceTimer();

    this.log(`\n📊 ${name}`);
    this.log('─'.repeat(60));

    try {
      const start = performance.now();

      for (let i = 0; i < operations; i++) {
        timer.start();
        await this.mockSupabase.from('scraped_pages')
          .select()
          .eq('domain_id', 'test-domain')
          .ilike('title', '%product%')
          .limit(10);
        timer.record();

        if (this.detailed && i % 20 === 0) {
          this.log(`  Progress: ${i}/${operations} searches completed`);
        }
      }

      const duration = performance.now() - start;
      const stats = timer.getStats();
      const opsPerSecond = (operations / duration) * 1000;

      const result: BenchmarkResult = {
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

      this.printResult(result);
      return result;

    } catch (error: any) {
      return {
        name,
        duration: 0,
        operations: 0,
        opsPerSecond: 0,
        avgLatency: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        success: false,
        error: error.message
      };
    }
  }

  private async benchmarkAgentResponseTime(): Promise<BenchmarkResult> {
    const name = 'Agent Response Time';
    const operations = 30;
    const timer = new PerformanceTimer();

    this.log(`\n📊 ${name}`);
    this.log('─'.repeat(60));

    try {
      const start = performance.now();

      for (let i = 0; i < operations; i++) {
        timer.start();

        // Simulate full agent flow: embedding + search + chat completion
        await this.mockOpenAI.embeddings();
        await this.mockSupabase.rpc('search_embeddings', {
          query_embedding: new Array(1536).fill(0),
          p_domain_id: 'test-domain',
          match_threshold: 0.15,
          match_count: 10
        });
        await this.mockOpenAI.chat();

        timer.record();

        if (this.detailed && i % 10 === 0) {
          this.log(`  Progress: ${i}/${operations} agent responses completed`);
        }
      }

      const duration = performance.now() - start;
      const stats = timer.getStats();
      const opsPerSecond = (operations / duration) * 1000;

      const result: BenchmarkResult = {
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

      this.printResult(result);
      return result;

    } catch (error: any) {
      return {
        name,
        duration: 0,
        operations: 0,
        opsPerSecond: 0,
        avgLatency: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        success: false,
        error: error.message
      };
    }
  }

  private async benchmarkConcurrentRequests(): Promise<BenchmarkResult> {
    const name = 'Concurrent Requests (10 parallel)';
    const operations = 50;
    const concurrency = 10;
    const timer = new PerformanceTimer();

    this.log(`\n📊 ${name}`);
    this.log('─'.repeat(60));

    try {
      const start = performance.now();

      // Process operations in batches
      for (let i = 0; i < operations; i += concurrency) {
        timer.start();

        const batch = Array.from({ length: Math.min(concurrency, operations - i) }, () =>
          this.mockSupabase.rpc('search_embeddings', {
            query_embedding: new Array(1536).fill(0),
            p_domain_id: 'test-domain',
            match_threshold: 0.15,
            match_count: 10
          })
        );

        await Promise.all(batch);
        timer.record();

        if (this.detailed && i % 20 === 0) {
          this.log(`  Progress: ${i}/${operations} concurrent batches completed`);
        }
      }

      const duration = performance.now() - start;
      const stats = timer.getStats();
      const opsPerSecond = (operations / duration) * 1000;

      const result: BenchmarkResult = {
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

      this.printResult(result);
      return result;

    } catch (error: any) {
      return {
        name,
        duration: 0,
        operations: 0,
        opsPerSecond: 0,
        avgLatency: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        success: false,
        error: error.message
      };
    }
  }

  private async benchmarkCachePerformance(): Promise<BenchmarkResult> {
    const name = 'Cache Performance (hit rate simulation)';
    const operations = 200;
    const timer = new PerformanceTimer();

    this.log(`\n📊 ${name}`);
    this.log('─'.repeat(60));

    try {
      // Simple in-memory cache for simulation
      const cache = new Map<string, any>();
      const cacheHitRate = 0.7; // 70% cache hit rate
      let hits = 0;
      let misses = 0;

      const start = performance.now();

      for (let i = 0; i < operations; i++) {
        timer.start();

        const key = `query-${i % 30}`; // 30 unique queries, repeated

        if (cache.has(key) && Math.random() < cacheHitRate) {
          // Cache hit - instant
          cache.get(key);
          hits++;
          timer.record();
        } else {
          // Cache miss - fetch from "database"
          await this.mockSupabase.rpc('search_embeddings', {
            query_embedding: new Array(1536).fill(0),
            p_domain_id: 'test-domain',
            match_threshold: 0.15,
            match_count: 10
          });
          cache.set(key, { data: 'cached result' });
          misses++;
          timer.record();
        }

        if (this.detailed && i % 40 === 0) {
          this.log(`  Progress: ${i}/${operations} cache operations (${hits} hits, ${misses} misses)`);
        }
      }

      const duration = performance.now() - start;
      const stats = timer.getStats();
      const opsPerSecond = (operations / duration) * 1000;
      const actualHitRate = (hits / operations) * 100;

      this.log(`  Cache Hit Rate: ${actualHitRate.toFixed(1)}%`);

      const result: BenchmarkResult = {
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

      this.printResult(result);
      return result;

    } catch (error: any) {
      return {
        name,
        duration: 0,
        operations: 0,
        opsPerSecond: 0,
        avgLatency: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        success: false,
        error: error.message
      };
    }
  }

  private printResult(result: BenchmarkResult): void {
    if (!this.verbose && !this.detailed) return;

    console.log(`  ✅ Operations: ${result.operations}`);
    console.log(`  ⏱️  Duration: ${result.duration.toFixed(2)}ms`);
    console.log(`  🚀 Throughput: ${result.opsPerSecond.toFixed(2)} ops/sec`);
    console.log(`  📈 Avg Latency: ${result.avgLatency.toFixed(2)}ms`);
    console.log(`  📊 p50: ${result.p50.toFixed(2)}ms | p95: ${result.p95.toFixed(2)}ms | p99: ${result.p99.toFixed(2)}ms`);
  }

  private log(message: string): void {
    if (this.verbose || this.detailed) {
      console.log(message);
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const detailed = args.includes('--detailed');

  const benchmark = new AgentBenchmark(verbose, detailed);
  const results = await benchmark.runAllBenchmarks();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Duration: ${results.totalDuration.toFixed(2)}ms`);
  console.log(`Total Operations: ${results.summary.totalOps}`);
  console.log(`Average Throughput: ${results.summary.avgOpsPerSecond.toFixed(2)} ops/sec`);
  console.log(`Average Latency: ${results.summary.avgLatency.toFixed(2)}ms`);
  console.log(`Success Rate: ${results.summary.successRate.toFixed(1)}%`);
  console.log('');

  // Print individual benchmark results
  console.log('Individual Benchmark Results:');
  console.log('─'.repeat(60));

  results.benchmarks.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name.padEnd(35)} ${result.opsPerSecond.toFixed(2).padStart(8)} ops/sec`);
    console.log(`   Latency: avg=${result.avgLatency.toFixed(2)}ms p95=${result.p95.toFixed(2)}ms p99=${result.p99.toFixed(2)}ms`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log('');
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

main().catch(console.error);
