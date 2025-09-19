#!/usr/bin/env npx tsx
// Quick performance test to measure optimization improvements

import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const API_URL = 'http://localhost:3000/api/chat-intelligent';
const TEST_QUERIES = [
  "How many Cifa products?",
  "List all pumps",
  "Show hydraulic components",
  "What products do you have?"
];

async function measurePerformance(query: string, iteration: number): Promise<number> {
  const start = Date.now();
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: query,
      session_id: `perf-test-${Date.now()}-${iteration}`,
      domain: 'thompsonseparts.co.uk'
    })
  });
  
  await response.json();
  return Date.now() - start;
}

async function runPerformanceTest() {
  console.log('🚀 Performance Test - Optimized Option 1 Implementation');
  console.log('========================================================\n');
  
  const results: { [key: string]: number[] } = {};
  
  // Run each query 3 times
  for (const query of TEST_QUERIES) {
    console.log(`Testing: "${query}"`);
    results[query] = [];
    
    for (let i = 1; i <= 3; i++) {
      const time = await measurePerformance(query, i);
      results[query].push(time);
      
      const cacheStatus = i === 1 ? '❄️  Cold' : '🔥 Warm';
      console.log(`  Run ${i}: ${time}ms ${cacheStatus}`);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('');
  }
  
  // Calculate averages and improvements
  console.log('📊 Summary Results');
  console.log('==========================================');
  console.log('Query                          | Avg Time | Cache Benefit');
  console.log('-------------------------------------------|-----------');
  
  for (const [query, times] of Object.entries(results)) {
    const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
    const coldTime = times[0];
    const warmAvg = Math.round((times[1] + times[2]) / 2);
    const improvement = Math.round((1 - warmAvg / coldTime) * 100);
    
    const shortQuery = query.length > 30 ? query.substring(0, 27) + '...' : query;
    console.log(
      `${shortQuery.padEnd(30)} | ${avg.toString().padStart(7)}ms | ${improvement > 0 ? '+' + improvement + '%' : 'N/A'}`
    );
  }
  
  console.log('\n🎯 Performance Metrics:');
  
  // Overall average
  const allTimes = Object.values(results).flat();
  const overallAvg = Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length);
  
  // Cold vs warm comparison
  const coldTimes = Object.values(results).map(times => times[0]);
  const warmTimes = Object.values(results).map(times => times.slice(1)).flat();
  const coldAvg = Math.round(coldTimes.reduce((a, b) => a + b, 0) / coldTimes.length);
  const warmAvg = Math.round(warmTimes.reduce((a, b) => a + b, 0) / warmTimes.length);
  
  console.log(`  • Overall Average: ${overallAvg}ms`);
  console.log(`  • Cold Cache Avg: ${coldAvg}ms`);
  console.log(`  • Warm Cache Avg: ${warmAvg}ms`);
  console.log(`  • Cache Improvement: ${Math.round((1 - warmAvg / coldAvg) * 100)}%`);
  
  // Success criteria
  console.log('\n✅ Optimization Goals:');
  console.log(`  • Target: <3000ms average ➔ ${overallAvg < 3000 ? '✅ ACHIEVED' : '❌ Not Met'} (${overallAvg}ms)`);
  console.log(`  • Cache Benefit: >30% ➔ ${(1 - warmAvg / coldAvg) > 0.3 ? '✅ ACHIEVED' : '❌ Not Met'} (${Math.round((1 - warmAvg / coldAvg) * 100)}%)`);
  
  if (overallAvg < 3000 && warmAvg < coldAvg * 0.7) {
    console.log('\n🎉 SUCCESS! Performance optimizations are working effectively.');
    console.log('   The system now provides full visibility with acceptable performance.');
  } else {
    console.log('\n⚠️  Performance needs further optimization.');
    console.log('   Consider additional caching strategies or query optimizations.');
  }
}

runPerformanceTest().catch(console.error);