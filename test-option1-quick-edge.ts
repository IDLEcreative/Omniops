#!/usr/bin/env npx tsx

/**
 * Quick Edge Case Analysis - Focused on critical issues
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/chat-intelligent';

// Helper function
async function testQuery(query: string, customConfig?: any) {
  const body = {
    message: query,
    session_id: `quick-test-${Date.now()}`,
    domain: 'thompsonseparts.co.uk',
    ...customConfig
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout per request
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { status: 'timeout', error: 'Request timeout' };
    }
    return { status: 'error', error: error.message };
  }
}

async function main() {
  console.log('=== CRITICAL EDGE CASE TESTING ===\n');

  // Test 1: Empty Query
  console.log('Test 1: Empty Query');
  const emptyResult = await testQuery('');
  console.log(`  Status: ${emptyResult.status}`);
  console.log(`  Has message: ${!!emptyResult.data?.message}`);
  console.log(`  Error: ${emptyResult.data?.error || 'none'}\n`);

  // Test 2: Whitespace Only
  console.log('Test 2: Whitespace Query');
  const whitespaceResult = await testQuery('   ');
  console.log(`  Status: ${whitespaceResult.status}`);
  console.log(`  Has message: ${!!whitespaceResult.data?.message}\n`);

  // Test 3: SQL Injection Attempt
  console.log('Test 3: SQL Injection Test');
  const injectionResult = await testQuery("'; DROP TABLE scraped_pages; --");
  console.log(`  Status: ${injectionResult.status}`);
  console.log(`  Response includes DROP: ${JSON.stringify(injectionResult.data).includes('DROP')}`);
  console.log(`  Has error: ${!!injectionResult.data?.error}\n`);

  // Test 4: Special Characters
  console.log('Test 4: Special Characters');
  const specialResult = await testQuery('%\' OR \'1\'=\'1');
  console.log(`  Status: ${specialResult.status}`);
  console.log(`  Has SQL error: ${JSON.stringify(specialResult.data).includes('syntax')}\n`);

  // Test 5: Zero Results Query
  console.log('Test 5: Zero Results Query');
  const zeroResult = await testQuery('xyzabc123nonexistentproduct');
  console.log(`  Status: ${zeroResult.status}`);
  console.log(`  Has message: ${!!zeroResult.data?.message}`);
  console.log(`  Sources count: ${zeroResult.data?.sources?.length || 0}\n`);

  // Test 6: Unicode/Emoji
  console.log('Test 6: Unicode & Emoji');
  const emojiResult = await testQuery('🔧 show me tools 🛠️');
  console.log(`  Status: ${emojiResult.status}`);
  console.log(`  Handled correctly: ${emojiResult.status === 200}\n`);

  // Test 7: Very Long Query
  console.log('Test 7: Very Long Query (5000 chars)');
  const longQuery = 'show me ' + 'pumps and filters '.repeat(300);
  const longResult = await testQuery(longQuery.substring(0, 5000));
  console.log(`  Query length: ${longQuery.substring(0, 5000).length}`);
  console.log(`  Status: ${longResult.status}`);
  console.log(`  Accepted: ${longResult.status === 200 || longResult.status === 400}\n`);

  // Test 8: Invalid Session ID
  console.log('Test 8: Invalid Session ID');
  const invalidSessionResult = await testQuery('test', { session_id: null });
  console.log(`  Status: ${invalidSessionResult.status}`);
  console.log(`  Handled: ${invalidSessionResult.status !== 500}\n`);

  // Test 9: Non-existent Domain
  console.log('Test 9: Non-existent Domain');
  const badDomainResult = await testQuery('show products', { 
    domain: 'nonexistent-xyz123.com' 
  });
  console.log(`  Status: ${badDomainResult.status}`);
  console.log(`  Has message: ${!!badDomainResult.data?.message}`);
  console.log(`  Execution time: ${badDomainResult.data?.metadata?.executionTime}ms\n`);

  // Test 10: Concurrent Requests
  console.log('Test 10: 3 Concurrent Requests');
  const startTime = Date.now();
  const promises = [
    testQuery('concurrent test 1'),
    testQuery('concurrent test 2'),
    testQuery('concurrent test 3')
  ];
  const results = await Promise.allSettled(promises);
  const duration = Date.now() - startTime;
  const successful = results.filter(r => 
    r.status === 'fulfilled' && r.value.status === 200
  ).length;
  console.log(`  Successful: ${successful}/3`);
  console.log(`  Total duration: ${duration}ms`);
  console.log(`  Average: ${Math.round(duration / 3)}ms\n`);

  // Test 11: Check getProductOverview Integration
  console.log('Test 11: Product Overview Integration');
  const overviewResult = await testQuery('pump');
  if (overviewResult.data?.message) {
    const hasTotal = overviewResult.data.message.includes('total');
    const hasCategories = overviewResult.data.message.includes('Categories:') || 
                          overviewResult.data.message.includes('Brand');
    console.log(`  Has total count: ${hasTotal}`);
    console.log(`  Has categories/brands: ${hasCategories}`);
    console.log(`  Sources returned: ${overviewResult.data?.sources?.length || 0}\n`);
  }

  // Test 12: Null/Undefined in getProductOverview
  console.log('Test 12: Edge Cases in Overview Function');
  const edgeQueries = [
    { query: '', name: 'Empty string' },
    { query: '   ', name: 'Spaces only' },
    { query: '\x00', name: 'Null byte' },
    { query: '../../etc/passwd', name: 'Path traversal' }
  ];

  for (const test of edgeQueries) {
    const result = await testQuery(test.query);
    console.log(`  ${test.name}: Status ${result.status}, Error: ${result.status === 500}`);
  }

  console.log('\n=== SUMMARY ===');
  console.log('Tests completed. Check for any status 500 errors or unexpected behaviors above.');
}

main().catch(console.error);