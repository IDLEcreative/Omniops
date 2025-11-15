/**
 * Performance tests for /api/admin/lookup-failures
 */

import type { TestResult } from '../test-lookup-failures-endpoint';

export async function runPerformanceTests(baseUrl: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('⚡ Running Performance Tests (100 sequential requests)...\n');

  const url = `${baseUrl}/api/admin/lookup-failures`;
  const times: number[] = [];

  for (let i = 0; i < 100; i++) {
    const startTime = Date.now();
    try {
      await fetch(url);
      times.push(Date.now() - startTime);
    } catch (error) {
      console.log(`Request ${i + 1} failed`);
    }

    if ((i + 1) % 20 === 0) {
      console.log(`Progress: ${i + 1}/100 requests completed`);
    }
  }

  times.sort((a, b) => a - b);

  const min = times[0];
  const max = times[times.length - 1];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];

  console.log(`\n📊 Performance Results:`);
  console.log(`   Min: ${min}ms`);
  console.log(`   Max: ${max}ms`);
  console.log(`   Avg: ${avg.toFixed(2)}ms`);
  console.log(`   p50: ${p50}ms`);
  console.log(`   p95: ${p95}ms`);
  console.log(`   p99: ${p99}ms`);
  console.log(`   Target (<200ms p95): ${p95 < 200 ? '✅ MET' : '⚠️ MISSED'}\n`);

  results.push({
    name: 'Performance Test (100 requests)',
    passed: p95 < 200,
    responseTime: avg,
    details: `p95: ${p95}ms, p99: ${p99}ms`
  });

  return results;
}

export async function runConcurrentTests(baseUrl: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log('🔄 Running Concurrent Request Tests (20 concurrent)...\n');

  const url = `${baseUrl}/api/admin/lookup-failures`;
  const promises: Promise<Response>[] = [];

  const startTime = Date.now();
  for (let i = 0; i < 20; i++) {
    promises.push(fetch(url));
  }

  try {
    const responses = await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / 20;

    const successCount = responses.filter(r => r.ok).length;
    const failCount = 20 - successCount;

    console.log(`✅ All requests completed in ${totalTime}ms`);
    console.log(`   Successful: ${successCount}/20`);
    console.log(`   Failed: ${failCount}/20`);
    console.log(`   Average response time: ${avgTime.toFixed(2)}ms\n`);

    results.push({
      name: 'Concurrent Requests (20)',
      passed: successCount === 20,
      responseTime: avgTime,
      details: `${successCount}/20 successful`
    });
  } catch (error) {
    console.log(`❌ Concurrent test failed: ${error}\n`);
    results.push({
      name: 'Concurrent Requests (20)',
      passed: false,
      responseTime: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}
