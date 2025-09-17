#!/usr/bin/env npx tsx
import { performance } from 'perf_hooks';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testAPIPerformance() {
  console.log('========================================');
  console.log('Simple API Performance Test');
  console.log('========================================\n');
  
  const queries = [
    'pumps',
    'hydraulic',
    'DC66-10P',
    'what products do you have'
  ];
  
  for (const query of queries) {
    console.log(`Testing: "${query}"`);
    const start = performance.now();
    
    try {
      const response = await fetch('http://localhost:3000/api/chat-intelligent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: query,
          conversation_id: crypto.randomUUID(),
          session_id: `test-${Date.now()}`,
          domain: 'thompsonseparts.co.uk',
          config: {
            features: {
              woocommerce: { enabled: false },
              websiteScraping: { enabled: true }
            }
          }
        }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });
      
      if (!response.ok) {
        console.log(`  ❌ Error: HTTP ${response.status}`);
        continue;
      }
      
      // Just read the first chunk to measure initial response time
      const reader = response.body?.getReader();
      if (reader) {
        const { done, value } = await reader.read();
        const responseTime = performance.now() - start;
        console.log(`  ✅ First response: ${responseTime.toFixed(2)}ms`);
        
        // Cancel the rest
        await reader.cancel();
      }
    } catch (error: any) {
      const responseTime = performance.now() - start;
      if (error.name === 'AbortError') {
        console.log(`  ⏱️ Timeout after ${responseTime.toFixed(2)}ms`);
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Test cache performance
async function testCachePerformance() {
  console.log('\n========================================');
  console.log('Cache Performance Test');
  console.log('========================================\n');
  
  const testQuery = 'hydraulic pumps';
  const times = [];
  
  for (let i = 0; i < 3; i++) {
    const start = performance.now();
    
    try {
      const response = await fetch('http://localhost:3000/api/chat-intelligent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: testQuery,
          conversation_id: crypto.randomUUID(),
          session_id: `cache-test-${i}`,
          domain: 'thompsonseparts.co.uk',
          config: {
            features: {
              woocommerce: { enabled: false },
              websiteScraping: { enabled: true }
            }
          }
        }),
        signal: AbortSignal.timeout(15000)
      });
      
      if (response.ok) {
        const reader = response.body?.getReader();
        if (reader) {
          await reader.read();
          const responseTime = performance.now() - start;
          times.push(responseTime);
          console.log(`  Run ${i + 1}: ${responseTime.toFixed(2)}ms ${i > 0 ? '(should be cached)' : '(cold)'}`);
          await reader.cancel();
        }
      }
    } catch (error) {
      console.log(`  Run ${i + 1}: Failed`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  if (times.length >= 2) {
    const cacheImprovement = ((times[0] - times[times.length - 1]) / times[0] * 100).toFixed(1);
    console.log(`\n  Cache improvement: ${cacheImprovement}%`);
  }
}

// Run tests
async function runAllTests() {
  await testAPIPerformance();
  await testCachePerformance();
  
  console.log('\n========================================');
  console.log('Test Complete');
  console.log('========================================');
}

runAllTests().catch(console.error);