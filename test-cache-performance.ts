/**
 * Cache Performance Test
 * Tests the effectiveness of response caching
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testCachePerformance() {
  console.log('🚀 Cache Performance Test');
  console.log('=' .repeat(50));
  
  const testQueries = [
    'Hello',
    'What are your business hours?',
    'Do you sell hydraulic pumps?',
    'Return policy',
    'Shipping cost'
  ];
  
  for (const query of testQueries) {
    console.log(`\n📝 Testing: "${query}"`);
    console.log('─'.repeat(50));
    
    // First call - will be cached
    console.log('\n1️⃣ First Call (uncached):');
    const start1 = Date.now();
    const response1 = await fetch('http://localhost:3000/api/chat-optimized', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: 'cache-test-' + Date.now(),
        domain: 'test.example.com'
      })
    });
    
    const data1 = await response1.json();
    const time1 = Date.now() - start1;
    console.log(`   Time: ${time1}ms ${time1 < 1000 ? '🚀' : time1 < 3000 ? '✅' : '⚠️'}`);
    console.log(`   Cached: ${data1.cached ? 'Yes' : 'No'}`);
    console.log(`   Response: "${(data1.content || '').substring(0, 60)}..."`);
    
    // Small delay
    await new Promise(r => setTimeout(r, 100));
    
    // Second call - should be cached
    console.log('\n2️⃣ Second Call (should be cached):');
    const start2 = Date.now();
    const response2 = await fetch('http://localhost:3000/api/chat-optimized', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: 'cache-test-' + Date.now(),
        domain: 'test.example.com'
      })
    });
    
    const data2 = await response2.json();
    const time2 = Date.now() - start2;
    console.log(`   Time: ${time2}ms ${time2 < 100 ? '⚡ Lightning!' : time2 < 500 ? '🚀' : '✅'}`);
    console.log(`   Cached: ${data2.cached ? 'Yes ✅' : 'No ❌'}`);
    console.log(`   Response: "${(data2.content || '').substring(0, 60)}..."`);
    
    // Calculate improvement
    if (time1 > 0 && time2 > 0) {
      const improvement = ((time1 - time2) / time1 * 100).toFixed(1);
      console.log(`\n   📊 Cache Speed-up: ${improvement}% faster`);
      console.log(`   📊 Absolute Savings: ${time1 - time2}ms saved`);
    }
    
    // Small delay before next test
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Test with slight variations (should not be cached)
  console.log('\n\n🔬 Testing Cache Intelligence');
  console.log('─'.repeat(50));
  
  const variations = [
    { original: 'Hello', variation: 'Hello there' },
    { original: 'Hello', variation: 'HELLO' },  // Should be cached (case insensitive)
    { original: 'Hello', variation: 'Hello!' }, // Should be cached (punctuation removed)
  ];
  
  for (const test of variations) {
    console.log(`\nOriginal: "${test.original}" → Variation: "${test.variation}"`);
    
    const start = Date.now();
    const response = await fetch('http://localhost:3000/api/chat-optimized', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: test.variation,
        session_id: 'cache-test-' + Date.now(),
        domain: 'test.example.com'
      })
    });
    
    const data = await response.json();
    const time = Date.now() - start;
    
    console.log(`   Cached: ${data.cached ? 'Yes ✅' : 'No ❌'}`);
    console.log(`   Time: ${time}ms`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Cache Performance Test Complete');
}

testCachePerformance().catch(console.error);