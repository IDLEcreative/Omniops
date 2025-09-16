#!/usr/bin/env tsx
/**
 * Focused Chaos Testing for DC66-10P Search
 * Quick resilience tests specifically for DC66 product search
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat';
const DOMAIN = 'thompsonseparts.co.uk';

interface TestCase {
  name: string;
  query?: string;
  body?: string;
  headers?: Record<string, string>;
  expectedBehavior: 'success' | 'reject' | 'handle';
}

async function makeRequest(testCase: TestCase) {
  const startTime = Date.now();
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...testCase.headers
      },
      body: testCase.body || JSON.stringify({
        message: testCase.query,
        domain: DOMAIN,
        session_id: `chaos-${Date.now()}`
      })
    });

    const elapsed = Date.now() - startTime;
    let data = null;
    
    try {
      data = await response.json();
    } catch (e) {
      // Response might not be JSON
    }

    return {
      status: response.status,
      elapsed,
      data,
      foundDC66: data?.response?.includes('DC66') || false
    };
  } catch (error: any) {
    return {
      status: -1,
      elapsed: Date.now() - startTime,
      error: error.message,
      foundDC66: false
    };
  }
}

async function runChaosTests() {
  console.log('🔥 DC66-10P FOCUSED CHAOS TESTING');
  console.log('='.repeat(50));
  
  const results = {
    passed: 0,
    failed: 0,
    issues: [] as string[]
  };

  // Test 1: Basic DC66 Search
  console.log('\n📍 Test 1: Basic DC66-10P Search');
  const basicResult = await makeRequest({
    name: 'Basic DC66-10P',
    query: 'DC66-10P',
    expectedBehavior: 'success'
  });
  
  if (basicResult.status === 200) {
    if (basicResult.foundDC66) {
      console.log(`  ✅ Found DC66 product (${basicResult.elapsed}ms)`);
      results.passed++;
    } else {
      console.log(`  ❌ No DC66 in response (${basicResult.elapsed}ms)`);
      results.failed++;
      results.issues.push('DC66-10P search returns no product info');
    }
  } else {
    console.log(`  ❌ Request failed: ${basicResult.status}`);
    results.failed++;
  }

  // Test 2: Concurrent Mini-Load (10 requests)
  console.log('\n📍 Test 2: Concurrent Load (10 parallel)');
  const concurrentPromises = Array(10).fill(null).map(() => 
    makeRequest({
      name: 'Concurrent',
      query: 'DC66-10P relay specifications',
      expectedBehavior: 'success'
    })
  );
  
  const startConcurrent = Date.now();
  const concurrentResults = await Promise.all(concurrentPromises);
  const totalTime = Date.now() - startConcurrent;
  
  const successful = concurrentResults.filter(r => r.status === 200).length;
  const foundProduct = concurrentResults.filter(r => r.foundDC66).length;
  
  console.log(`  Successful: ${successful}/10`);
  console.log(`  Found DC66: ${foundProduct}/10`);
  console.log(`  Total time: ${totalTime}ms`);
  console.log(`  Avg per request: ${(totalTime / 10).toFixed(0)}ms`);
  
  if (successful >= 8) {
    console.log('  ✅ Good concurrent handling');
    results.passed++;
  } else {
    console.log('  ❌ Poor concurrent performance');
    results.failed++;
    results.issues.push(`Only ${successful}/10 concurrent requests succeeded`);
  }

  // Test 3: SQL Injection Attempt
  console.log('\n📍 Test 3: SQL Injection Protection');
  const sqlResult = await makeRequest({
    name: 'SQL Injection',
    query: "DC66-10P'; DROP TABLE scraped_pages; --",
    expectedBehavior: 'handle'
  });
  
  if (sqlResult.status === 200 || sqlResult.status === 400) {
    console.log(`  ✅ Handled safely (${sqlResult.status})`);
    results.passed++;
  } else if (sqlResult.status === 500) {
    console.log(`  ❌ Server error - potential vulnerability`);
    results.failed++;
    results.issues.push('SQL injection causes server error');
  }

  // Test 4: Edge Cases
  console.log('\n📍 Test 4: Edge Case Variations');
  const edgeCases = [
    { query: 'dc66-10p', name: 'lowercase' },
    { query: 'DC66', name: 'partial SKU' },
    { query: 'DC66-10P-24-V2', name: 'full model' }
  ];

  let edgeSuccess = 0;
  for (const edge of edgeCases) {
    const result = await makeRequest({
      name: edge.name,
      query: edge.query,
      expectedBehavior: 'success'
    });
    
    if (result.foundDC66) {
      console.log(`  ✅ ${edge.name}: Found DC66`);
      edgeSuccess++;
    } else {
      console.log(`  ❌ ${edge.name}: No match`);
    }
  }
  
  if (edgeSuccess >= 2) {
    console.log('  ✅ Good edge case handling');
    results.passed++;
  } else {
    console.log('  ❌ Poor edge case handling');
    results.failed++;
    results.issues.push('Edge cases not matching DC66 products');
  }

  // Test 5: Malformed JSON
  console.log('\n📍 Test 5: Malformed Request Handling');
  const malformedResult = await makeRequest({
    name: 'Malformed JSON',
    body: '{"message": "DC66-10P", invalid json}',
    expectedBehavior: 'reject'
  });
  
  if (malformedResult.status === 400 || malformedResult.status === -1) {
    console.log(`  ✅ Rejected gracefully`);
    results.passed++;
  } else if (malformedResult.status === 500) {
    console.log(`  ❌ Server error on malformed input`);
    results.failed++;
    results.issues.push('Malformed JSON causes server error');
  }

  // Test 6: Empty/Null Query
  console.log('\n📍 Test 6: Empty Query Handling');
  const emptyResult = await makeRequest({
    name: 'Empty Query',
    query: '',
    expectedBehavior: 'reject'
  });
  
  if (emptyResult.status === 400) {
    console.log(`  ✅ Properly rejected empty query`);
    results.passed++;
  } else if (emptyResult.status === 200) {
    console.log(`  ⚠️ Accepted empty query`);
    results.passed++;
  } else {
    console.log(`  ❌ Unexpected response: ${emptyResult.status}`);
    results.failed++;
  }

  // Test 7: Large Query
  console.log('\n📍 Test 7: Large Query Handling');
  const largeResult = await makeRequest({
    name: 'Large Query',
    query: 'DC66-10P ' + 'relay specifications '.repeat(100),
    expectedBehavior: 'handle'
  });
  
  if (largeResult.status === 200 || largeResult.status === 400) {
    console.log(`  ✅ Handled large query (${largeResult.elapsed}ms)`);
    results.passed++;
  } else {
    console.log(`  ❌ Failed on large query: ${largeResult.status}`);
    results.failed++;
  }

  // Test 8: Special Characters
  console.log('\n📍 Test 8: Special Characters');
  const specialResult = await makeRequest({
    name: 'Special Chars',
    query: 'DC66-10P @#$%^&*()',
    expectedBehavior: 'handle'
  });
  
  if (specialResult.status === 200) {
    console.log(`  ✅ Handled special characters`);
    results.passed++;
  } else {
    console.log(`  ❌ Failed on special characters: ${specialResult.status}`);
    results.failed++;
  }

  // Summary Report
  console.log('\n' + '='.repeat(50));
  console.log('📊 CHAOS TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.issues.length > 0) {
    console.log('\n🔴 CRITICAL ISSUES:');
    results.issues.forEach(issue => {
      console.log(`  • ${issue}`);
    });
  }

  console.log('\n💡 RECOMMENDATIONS:');
  
  const recommendations = [];
  
  if (!basicResult.foundDC66) {
    recommendations.push('Fix DC66-10P product search - not finding products');
  }
  
  if (successful < 8) {
    recommendations.push('Improve concurrent request handling');
  }
  
  if (edgeSuccess < 2) {
    recommendations.push('Implement fuzzy matching for product SKUs');
  }
  
  if (results.issues.some(i => i.includes('server error'))) {
    recommendations.push('Add better error handling to prevent 500 errors');
  }

  recommendations.push('Add caching for frequently searched products like DC66-10P');
  recommendations.push('Implement rate limiting to prevent abuse');
  recommendations.push('Add monitoring for slow queries (>5s response time)');
  
  recommendations.forEach(rec => {
    console.log(`  • ${rec}`);
  });

  console.log('\n🔥 CHAOS TESTING COMPLETE');
  console.log('='.repeat(50));

  // Return exit code based on critical failures
  if (results.failed > results.passed) {
    process.exit(1);
  }
}

// Run the tests
runChaosTests().catch(console.error);