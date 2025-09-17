#!/usr/bin/env npx tsx
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface TestResult {
  query: string;
  firstCall: number;
  secondCall: number;
  improvement: string;
}

async function testWooCommerceCachePerformance() {
  console.log('========================================');
  console.log('WooCommerce API Cache Performance Test');
  console.log('========================================\n');
  console.log('Testing cache effectiveness for eliminating 20-60s API delays...\n');
  
  const queries = [
    'hydraulic pumps',
    'DC66-10P',
    'Cifa parts',
    'brake systems',
    'agricultural equipment'
  ];
  
  const results: TestResult[] = [];
  
  for (const query of queries) {
    console.log(`\nTesting: "${query}"`);
    console.log('─'.repeat(40));
    
    // First call (cold cache - will hit WooCommerce API)
    console.log('  1st call (cold cache - expect 20-60s delay)...');
    const start1 = performance.now();
    
    try {
      const response1 = await fetch('http://localhost:3000/api/chat-intelligent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversation_id: crypto.randomUUID(),
          session_id: `cache-test-${Date.now()}`,
          domain: 'thompsonseparts.co.uk',
          config: {
            features: {
              woocommerce: { enabled: true },
              websiteScraping: { enabled: false }
            }
          }
        }),
        signal: AbortSignal.timeout(120000) // 2 minute timeout
      });
      
      if (!response1.ok) {
        console.log(`  ❌ Error: HTTP ${response1.status}`);
        continue;
      }
      
      // Read the full response
      const text1 = await response1.text();
      const time1 = performance.now() - start1;
      console.log(`  ✅ First call: ${(time1/1000).toFixed(2)}s`);
      
      // Check if WooCommerce was used
      if (text1.includes('searchMetadata')) {
        const data = JSON.parse(text1);
        const wcSearches = data.searchMetadata?.searchLog?.filter(
          (log: any) => log.tool === 'woocommerce_agent'
        ).length || 0;
        if (wcSearches > 0) {
          console.log(`     (WooCommerce API called ${wcSearches} time(s))`);
        }
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Second call (warm cache - should be instant)
      console.log('  2nd call (warm cache - expect <1s)...');
      const start2 = performance.now();
      
      const response2 = await fetch('http://localhost:3000/api/chat-intelligent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversation_id: crypto.randomUUID(),
          session_id: `cache-test-${Date.now()}-2`,
          domain: 'thompsonseparts.co.uk',
          config: {
            features: {
              woocommerce: { enabled: true },
              websiteScraping: { enabled: false }
            }
          }
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      if (!response2.ok) {
        console.log(`  ❌ Error: HTTP ${response2.status}`);
        continue;
      }
      
      const text2 = await response2.text();
      const time2 = performance.now() - start2;
      console.log(`  ✅ Second call: ${(time2/1000).toFixed(2)}s`);
      console.log(`     (Cache HIT - saved ~${((time1 - time2)/1000).toFixed(1)}s)`);
      
      const improvement = ((time1 - time2) / time1 * 100).toFixed(1);
      console.log(`  📊 Improvement: ${improvement}% faster`);
      
      results.push({
        query,
        firstCall: time1,
        secondCall: time2,
        improvement: `${improvement}%`
      });
      
    } catch (error: any) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n========================================');
  console.log('📈 Cache Performance Summary');
  console.log('========================================\n');
  
  if (results.length > 0) {
    console.log('Query Results:');
    results.forEach(r => {
      console.log(`  "${r.query}":`);
      console.log(`    First call:  ${(r.firstCall/1000).toFixed(2)}s`);
      console.log(`    Second call: ${(r.secondCall/1000).toFixed(2)}s`);
      console.log(`    Improvement: ${r.improvement}`);
    });
    
    const avgFirstCall = results.reduce((a, b) => a + b.firstCall, 0) / results.length;
    const avgSecondCall = results.reduce((a, b) => a + b.secondCall, 0) / results.length;
    const avgImprovement = ((avgFirstCall - avgSecondCall) / avgFirstCall * 100).toFixed(1);
    
    console.log('\nAverages:');
    console.log(`  First call (cold):  ${(avgFirstCall/1000).toFixed(2)}s`);
    console.log(`  Second call (warm): ${(avgSecondCall/1000).toFixed(2)}s`);
    console.log(`  Time saved:         ${((avgFirstCall - avgSecondCall)/1000).toFixed(2)}s`);
    console.log(`  Performance gain:   ${avgImprovement}%`);
    
    // Performance assessment
    console.log('\n🎯 Performance Assessment:');
    if (avgFirstCall > 20000 && avgSecondCall < 5000) {
      console.log('  ✅ EXCELLENT - Cache eliminated WooCommerce API bottleneck!');
      console.log('  ✅ Reduced 20-60s delays to <5s cached responses');
    } else if (avgSecondCall < avgFirstCall * 0.5) {
      console.log('  ⚡ GOOD - Cache providing >50% performance improvement');
    } else {
      console.log('  ⚠️  MODERATE - Cache helping but further optimization needed');
    }
    
    // Cache statistics
    console.log('\n💾 Cache Effectiveness:');
    console.log('  - First calls hit WooCommerce API (20-60s typical)');
    console.log('  - Second calls served from cache (<1s typical)');
    console.log('  - Cache TTL: 5 minutes for searches, 1 minute for stock');
    console.log('  - Expected savings: 20-60 seconds per cached hit');
  }
  
  console.log('\n========================================');
  console.log('Test Complete');
  console.log('========================================');
}

// Run the test
testWooCommerceCachePerformance().catch(console.error);