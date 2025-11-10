/**
 * Search Performance Benchmarks
 *
 * Tests for embedding generation, vector search, and keyword search performance.
 */

import { performance } from 'perf_hooks';
import {
  BenchmarkResult,
  PerformanceTimer,
  MockOpenAIClient,
  MockSupabaseClient,
  printBenchmarkResult,
  logIfVerbose
} from '../../utils/benchmark/helpers';

export async function benchmarkEmbeddingGeneration(
  mockOpenAI: MockOpenAIClient,
  verbose: boolean = false,
  detailed: boolean = false
): Promise<BenchmarkResult> {
  const name = 'Embedding Generation';
  const operations = 50;
  const timer = new PerformanceTimer();

  logIfVerbose(`\n📊 ${name}`, verbose);
  logIfVerbose('─'.repeat(60), verbose);

  try {
    const start = performance.now();

    for (let i = 0; i < operations; i++) {
      timer.start();
      await mockOpenAI.embeddings();
      timer.record();

      if (detailed && i % 10 === 0) {
        console.log(`  Progress: ${i}/${operations} embeddings generated`);
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

    printBenchmarkResult(result, verbose || detailed);
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

export async function benchmarkVectorSearch(
  mockSupabase: MockSupabaseClient,
  verbose: boolean = false,
  detailed: boolean = false
): Promise<BenchmarkResult> {
  const name = 'Vector Search';
  const operations = 100;
  const timer = new PerformanceTimer();

  logIfVerbose(`\n📊 ${name}`, verbose);
  logIfVerbose('─'.repeat(60), verbose);

  try {
    const start = performance.now();

    for (let i = 0; i < operations; i++) {
      timer.start();
      await mockSupabase.rpc('search_embeddings', {
        query_embedding: new Array(1536).fill(0),
        p_domain_id: 'test-domain',
        match_threshold: 0.15,
        match_count: 10
      });
      timer.record();

      if (detailed && i % 20 === 0) {
        console.log(`  Progress: ${i}/${operations} searches completed`);
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

    printBenchmarkResult(result, verbose || detailed);
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

export async function benchmarkKeywordSearch(
  mockSupabase: MockSupabaseClient,
  verbose: boolean = false,
  detailed: boolean = false
): Promise<BenchmarkResult> {
  const name = 'Keyword Search';
  const operations = 100;
  const timer = new PerformanceTimer();

  logIfVerbose(`\n📊 ${name}`, verbose);
  logIfVerbose('─'.repeat(60), verbose);

  try {
    const start = performance.now();

    for (let i = 0; i < operations; i++) {
      timer.start();
      await mockSupabase.from('scraped_pages')
        .select()
        .eq('domain_id', 'test-domain')
        .ilike('title', '%product%')
        .limit(10);
      timer.record();

      if (detailed && i % 20 === 0) {
        console.log(`  Progress: ${i}/${operations} searches completed`);
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

    printBenchmarkResult(result, verbose || detailed);
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
