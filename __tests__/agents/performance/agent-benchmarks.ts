/**
 * Agent Response Performance Benchmarks
 *
 * Tests for complete agent response flow including embedding, search, and chat completion.
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

export async function benchmarkAgentResponseTime(
  mockOpenAI: MockOpenAIClient,
  mockSupabase: MockSupabaseClient,
  verbose: boolean = false,
  detailed: boolean = false
): Promise<BenchmarkResult> {
  const name = 'Agent Response Time';
  const operations = 30;
  const timer = new PerformanceTimer();

  logIfVerbose(`\n📊 ${name}`, verbose);
  logIfVerbose('─'.repeat(60), verbose);

  try {
    const start = performance.now();

    for (let i = 0; i < operations; i++) {
      timer.start();

      // Simulate full agent flow: embedding + search + chat completion
      await mockOpenAI.embeddings();
      await mockSupabase.rpc('search_embeddings', {
        query_embedding: new Array(1536).fill(0),
        p_domain_id: 'test-domain',
        match_threshold: 0.15,
        match_count: 10
      });
      await mockOpenAI.chat();

      timer.record();

      if (detailed && i % 10 === 0) {
        console.log(`  Progress: ${i}/${operations} agent responses completed`);
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
