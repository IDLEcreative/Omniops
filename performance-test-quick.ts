#!/usr/bin/env npx tsx
import { performance } from 'perf_hooks';

interface QuickTestResult {
  testName: string;
  requests: number;
  successful: number;
  failed: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
}

async function makeRequest(message: string): Promise<{ time: number; success: boolean; status: number }> {
  const start = performance.now();
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        domain: 'localhost',
        session_id: `quick-test-${Date.now()}-${Math.random()}`,
      }),
    });
    
    const time = performance.now() - start;
    // Consume response body to ensure connection is complete
    await response.text();
    
    return { time, success: response.ok, status: response.status };
  } catch (error) {
    return { time: performance.now() - start, success: false, status: 0 };
  }
}

function calculatePercentile(times: number[], percentile: number): number {
  const sorted = [...times].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

async function runQuickTest(): Promise<void> {
  console.log('🚀 QUICK PERFORMANCE TEST');
  console.log('=' .repeat(60));
  
  const results: QuickTestResult[] = [];
  
  // Test 1: Sequential Requests (reduced count)
  console.log('\n📊 Test 1: Sequential Requests (10 requests)');
  const seqTimes: number[] = [];
  let seqSuccess = 0;
  const seqStart = performance.now();
  
  for (let i = 0; i < 10; i++) {
    const result = await makeRequest('Quick test: What are your store hours?');
    if (result.success) {
      seqSuccess++;
      seqTimes.push(result.time);
      console.log(`  Request ${i + 1}: ${result.time.toFixed(0)}ms ✓`);
    } else {
      console.log(`  Request ${i + 1}: Failed (${result.status})`);
    }
  }
  
  const seqDuration = performance.now() - seqStart;
  
  if (seqTimes.length > 0) {
    results.push({
      testName: 'Sequential (10 req)',
      requests: 10,
      successful: seqSuccess,
      failed: 10 - seqSuccess,
      avgResponseTime: seqTimes.reduce((a, b) => a + b, 0) / seqTimes.length,
      minResponseTime: Math.min(...seqTimes),
      maxResponseTime: Math.max(...seqTimes),
      p50: calculatePercentile(seqTimes, 50),
      p95: calculatePercentile(seqTimes, 95),
      p99: calculatePercentile(seqTimes, 99),
      throughput: seqSuccess / (seqDuration / 1000),
    });
  }
  
  // Cool down
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Concurrent Requests
  console.log('\n📊 Test 2: Concurrent Requests (5 parallel)');
  const concStart = performance.now();
  
  const concPromises = Array.from({ length: 5 }, (_, i) => 
    makeRequest(`Concurrent test ${i + 1}: Show products`)
  );
  
  const concResults = await Promise.all(concPromises);
  const concDuration = performance.now() - concStart;
  const concTimes = concResults.filter(r => r.success).map(r => r.time);
  const concSuccess = concResults.filter(r => r.success).length;
  
  concResults.forEach((result, i) => {
    if (result.success) {
      console.log(`  Request ${i + 1}: ${result.time.toFixed(0)}ms ✓`);
    } else {
      console.log(`  Request ${i + 1}: Failed (${result.status})`);
    }
  });
  
  if (concTimes.length > 0) {
    results.push({
      testName: 'Concurrent (5 req)',
      requests: 5,
      successful: concSuccess,
      failed: 5 - concSuccess,
      avgResponseTime: concTimes.reduce((a, b) => a + b, 0) / concTimes.length,
      minResponseTime: Math.min(...concTimes),
      maxResponseTime: Math.max(...concTimes),
      p50: calculatePercentile(concTimes, 50),
      p95: calculatePercentile(concTimes, 95),
      p99: calculatePercentile(concTimes, 99),
      throughput: concSuccess / (concDuration / 1000),
    });
  }
  
  // Cool down
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Cache Test
  console.log('\n📊 Test 3: Cache Effectiveness (5 identical requests)');
  const cacheMessage = 'Cache test: What is your return policy?';
  const cacheTimes: number[] = [];
  let cacheSuccess = 0;
  const cacheStart = performance.now();
  
  for (let i = 0; i < 5; i++) {
    const result = await makeRequest(cacheMessage);
    if (result.success) {
      cacheSuccess++;
      cacheTimes.push(result.time);
      console.log(`  Request ${i + 1}: ${result.time.toFixed(0)}ms ${i > 0 ? '(potential cache)' : '(initial)'} ✓`);
    } else {
      console.log(`  Request ${i + 1}: Failed (${result.status})`);
    }
  }
  
  const cacheDuration = performance.now() - cacheStart;
  
  if (cacheTimes.length > 1) {
    const firstTime = cacheTimes[0];
    const lastTime = cacheTimes[cacheTimes.length - 1];
    if (firstTime !== undefined && lastTime !== undefined && firstTime !== 0) {
      const cacheImprovement = ((firstTime - lastTime) / firstTime) * 100;
      console.log(`  Cache improvement: ${cacheImprovement.toFixed(1)}%`);
    }
    
    results.push({
      testName: 'Cache Test (5 req)',
      requests: 5,
      successful: cacheSuccess,
      failed: 5 - cacheSuccess,
      avgResponseTime: cacheTimes.reduce((a, b) => a + b, 0) / cacheTimes.length,
      minResponseTime: Math.min(...cacheTimes),
      maxResponseTime: Math.max(...cacheTimes),
      p50: calculatePercentile(cacheTimes, 50),
      p95: calculatePercentile(cacheTimes, 95),
      p99: calculatePercentile(cacheTimes, 99),
      throughput: cacheSuccess / (cacheDuration / 1000),
    });
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📈 PERFORMANCE SUMMARY');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    console.log(`\n${result.testName}:`);
    console.log(`  Success Rate: ${((result.successful / result.requests) * 100).toFixed(1)}%`);
    console.log(`  Avg Response: ${result.avgResponseTime.toFixed(0)}ms`);
    console.log(`  Min/Max: ${result.minResponseTime.toFixed(0)}ms / ${result.maxResponseTime.toFixed(0)}ms`);
    console.log(`  P50/P95/P99: ${result.p50.toFixed(0)}ms / ${result.p95.toFixed(0)}ms / ${result.p99.toFixed(0)}ms`);
    console.log(`  Throughput: ${result.throughput.toFixed(2)} req/s`);
  });
  
  // Performance Analysis
  console.log('\n' + '=' .repeat(60));
  console.log('🔍 PERFORMANCE ANALYSIS');
  console.log('=' .repeat(60));
  
  const avgResponseTime = results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length;
  
  console.log('\n🚨 CRITICAL PERFORMANCE ISSUES DETECTED:');
  console.log(`  • Average response time: ${avgResponseTime.toFixed(0)}ms (Target: <500ms)`);
  console.log(`  • Performance degradation: ${(avgResponseTime / 500 * 100).toFixed(0)}% slower than target`);
  
  if (avgResponseTime > 10000) {
    console.log('\n❌ SEVERE BOTTLENECKS - Response times exceed 10 seconds!');
    console.log('\nPotential causes:');
    console.log('  1. OpenAI API calls are synchronous and blocking');
    console.log('  2. No response streaming implemented');
    console.log('  3. Database queries may be unoptimized');
    console.log('  4. Embedding search might be doing full table scans');
    console.log('  5. No caching layer for repeated queries');
  }
  
  console.log('\n💡 URGENT OPTIMIZATIONS NEEDED:');
  console.log('  1. Implement response streaming for real-time feedback');
  console.log('  2. Add Redis caching for embeddings and responses');
  console.log('  3. Use connection pooling for database');
  console.log('  4. Implement request queuing and batching');
  console.log('  5. Add CDN for static content');
  console.log('  6. Consider edge functions for reduced latency');
  console.log('  7. Profile and optimize database queries');
  console.log('  8. Implement progressive response loading');
}

// Run the test
runQuickTest().catch(console.error);