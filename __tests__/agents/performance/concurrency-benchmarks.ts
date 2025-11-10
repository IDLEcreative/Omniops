/**
 * Concurrency & Cache Performance Benchmarks
 *
 * Tests for parallel request handling and cache performance.
 */

import { performance } from 'perf_hooks';
import {
  BenchmarkResult,
  PerformanceTimer,
  MockSupabaseClient,
  printBenchmarkResult,
  logIfVerbose
} from '../../utils/benchmark/helpers';

export async function benchmarkConcurrentRequests(
  mockSupabase: MockSupabaseClient,
  verbose: boolean = false,
  detailed: boolean = false
): Promise<BenchmarkResult> {
  const name = 'Concurrent Requests (10 parallel)';
  const operations = 50;
  const concurrency = 10;
  const timer = new PerformanceTimer();

  logIfVerbose(`\n📊 ${name}`, verbose);
  logIfVerbose('─'.repeat(60), verbose);

  try {
    const start = performance.now();

    // Process operations in batches
    for (let i = 0; i < operations; i += concurrency) {
      timer.start();

      const batch = Array.from({ length: Math.min(concurrency, operations - i) }, () =>
        mockSupabase.rpc('search_embeddings', {
          query_embedding: new Array(1536).fill(0),
          p_domain_id: 'test-domain',
          match_threshold: 0.15,
          match_count: 10
        })
      );

      await Promise.all(batch);
      timer.record();

      if (detailed && i % 20 === 0) {
        console.log(`  Progress: ${i}/${operations} concurrent batches completed`);
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

export async function benchmarkCachePerformance(
  mockSupabase: MockSupabaseClient,
  verbose: boolean = false,
  detailed: boolean = false
): Promise<BenchmarkResult> {
  const name = 'Cache Performance (hit rate simulation)';
  const operations = 200;
  const timer = new PerformanceTimer();

  logIfVerbose(`\n📊 ${name}`, verbose);
  logIfVerbose('─'.repeat(60), verbose);

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
        await mockSupabase.rpc('search_embeddings', {
          query_embedding: new Array(1536).fill(0),
          p_domain_id: 'test-domain',
          match_threshold: 0.15,
          match_count: 10
        });
        cache.set(key, { data: 'cached result' });
        misses++;
        timer.record();
      }

      if (detailed && i % 40 === 0) {
        console.log(`  Progress: ${i}/${operations} cache operations (${hits} hits, ${misses} misses)`);
      }
    }

    const duration = performance.now() - start;
    const stats = timer.getStats();
    const opsPerSecond = (operations / duration) * 1000;
    const actualHitRate = (hits / operations) * 100;

    logIfVerbose(`  Cache Hit Rate: ${actualHitRate.toFixed(1)}%`, verbose || detailed);

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
