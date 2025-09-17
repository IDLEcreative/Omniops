#!/usr/bin/env npx tsx
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testDirectWooCommerce() {
  console.log('========================================');
  console.log('Direct WooCommerce Cache Test');
  console.log('========================================\n');
  
  const testQueries = [
    { message: 'show me all pumps from woocommerce', description: 'WooCommerce product search' },
    { message: 'check stock for DC66-10P', description: 'Stock check' },
    { message: 'what categories do you have?', description: 'Category listing' }
  ];
  
  for (const test of testQueries) {
    console.log(`\nTest: ${test.description}`);
    console.log(`Query: "${test.message}"`);
    console.log('─'.repeat(50));
    
    // First call - cold cache
    console.log('\n1st Call (Cold Cache):');
    const start1 = performance.now();
    
    try {
      const response1 = await fetch('http://localhost:3000/api/chat-intelligent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.message,
          conversation_id: crypto.randomUUID(),
          session_id: `direct-test-${Date.now()}`,
          domain: 'thompsonseparts.co.uk',
          config: {
            features: {
              woocommerce: { enabled: true },
              websiteScraping: { enabled: false }
            },
            ai: {
              maxSearchIterations: 2,
              searchTimeout: 60000
            }
          }
        }),
        signal: AbortSignal.timeout(70000)
      });
      
      const text1 = await response1.text();
      const time1 = performance.now() - start1;
      
      if (response1.ok) {
        const data = JSON.parse(text1);
        const wcCalls = data.searchMetadata?.searchLog?.filter(
          (log: any) => log.tool === 'woocommerce_agent'
        ) || [];
        
        console.log(`  Time: ${(time1/1000).toFixed(2)}s`);
        console.log(`  WooCommerce calls: ${wcCalls.length}`);
        if (wcCalls.length > 0) {
          wcCalls.forEach((call: any) => {
            console.log(`    - ${call.query} (${call.resultCount} results)`);
          });
        }
      } else {
        console.log(`  Error: ${response1.status}`);
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Second call - warm cache
      console.log('\n2nd Call (Warm Cache):');
      const start2 = performance.now();
      
      const response2 = await fetch('http://localhost:3000/api/chat-intelligent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: test.message,
          conversation_id: crypto.randomUUID(),
          session_id: `direct-test-${Date.now()}-warm`,
          domain: 'thompsonseparts.co.uk',
          config: {
            features: {
              woocommerce: { enabled: true },
              websiteScraping: { enabled: false }
            },
            ai: {
              maxSearchIterations: 2,
              searchTimeout: 60000
            }
          }
        }),
        signal: AbortSignal.timeout(30000)
      });
      
      const text2 = await response2.text();
      const time2 = performance.now() - start2;
      
      if (response2.ok) {
        const data = JSON.parse(text2);
        const wcCalls = data.searchMetadata?.searchLog?.filter(
          (log: any) => log.tool === 'woocommerce_agent'
        ) || [];
        
        console.log(`  Time: ${(time2/1000).toFixed(2)}s`);
        console.log(`  WooCommerce calls: ${wcCalls.length}`);
        
        const timeSaved = time1 - time2;
        const improvement = (timeSaved / time1 * 100).toFixed(1);
        
        console.log(`\n  🎯 Cache Impact:`);
        console.log(`     Time saved: ${(timeSaved/1000).toFixed(2)}s`);
        console.log(`     Improvement: ${improvement}%`);
        
        if (timeSaved > 10000) {
          console.log(`     ✅ EXCELLENT - Cache eliminated API delay!`);
        } else if (timeSaved > 5000) {
          console.log(`     ⚡ GOOD - Significant improvement`);
        } else {
          console.log(`     ⚠️  MODERATE - Some improvement`);
        }
      } else {
        console.log(`  Error: ${response2.status}`);
      }
      
    } catch (error: any) {
      console.log(`  Error: ${error.message}`);
    }
  }
  
  console.log('\n========================================');
  console.log('Cache Behavior Analysis:');
  console.log('========================================');
  console.log(`
Expected Behavior:
- First call: 20-60s (hits WooCommerce API)
- Second call: <5s (uses cached data)
- Improvement: >80% reduction in response time

If not seeing expected improvement:
1. Check Redis is running
2. Verify cache integration in route
3. Check if AI is making same WC calls
4. Monitor server logs for cache hits
`);
}

// Run the test
testDirectWooCommerce().catch(console.error);