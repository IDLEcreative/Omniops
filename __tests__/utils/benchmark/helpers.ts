/**
 * Shared Benchmark Utilities
 *
 * Common types, classes, and helpers used across all performance benchmarks.
 */

import { performance } from 'perf_hooks';

// ============================================================================
// Types
// ============================================================================

export interface BenchmarkResult {
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

export interface SystemMetrics {
  totalDuration: number;
  benchmarks: BenchmarkResult[];
  summary: {
    totalOps: number;
    avgOpsPerSecond: number;
    avgLatency: number;
    successRate: number;
  };
}

// ============================================================================
// Performance Timer
// ============================================================================

export class PerformanceTimer {
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

// ============================================================================
// Mock Clients
// ============================================================================

export class MockOpenAIClient {
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

export class MockSupabaseClient {
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

// ============================================================================
// Utilities
// ============================================================================

export function calculateSummaryMetrics(benchmarks: BenchmarkResult[]) {
  const totalOps = benchmarks.reduce((sum, b) => sum + b.operations, 0);
  const avgOpsPerSecond = benchmarks.reduce((sum, b) => sum + b.opsPerSecond, 0) / benchmarks.length;
  const avgLatency = benchmarks.reduce((sum, b) => sum + b.avgLatency, 0) / benchmarks.length;
  const successCount = benchmarks.filter(b => b.success).length;
  const successRate = (successCount / benchmarks.length) * 100;

  return {
    totalOps,
    avgOpsPerSecond,
    avgLatency,
    successRate
  };
}

export function printBenchmarkResult(result: BenchmarkResult, verbose: boolean = false): void {
  if (!verbose) return;

  console.log(`  ✅ Operations: ${result.operations}`);
  console.log(`  ⏱️  Duration: ${result.duration.toFixed(2)}ms`);
  console.log(`  🚀 Throughput: ${result.opsPerSecond.toFixed(2)} ops/sec`);
  console.log(`  📈 Avg Latency: ${result.avgLatency.toFixed(2)}ms`);
  console.log(`  📊 p50: ${result.p50.toFixed(2)}ms | p95: ${result.p95.toFixed(2)}ms | p99: ${result.p99.toFixed(2)}ms`);
}

export function logIfVerbose(message: string, verbose: boolean): void {
  if (verbose) {
    console.log(message);
  }
}
