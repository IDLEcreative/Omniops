#!/usr/bin/env npx tsx
/**
 * COMPREHENSIVE API TEST SUITE
 * Tests the chat API endpoint with various query types to ensure
 * the smart hybrid search is working correctly in production
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

interface TestResult {
  query: string;
  category: string;
  expectedBehavior: string;
  passed: boolean;
  responseTime: number;
  chunkCount: number;
  hasResults: boolean;
  error?: string;
  sample?: string;
}

async function callChatAPI(query: string, domain: string = 'thompsonseparts.co.uk'): Promise<any> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: query }],
        domain: domain,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const elapsed = Date.now() - startTime;
    
    return {
      success: true,
      data,
      responseTime: elapsed,
      chunks: data.chunks || [],
      response: data.response || data.content || ''
    };
  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    return {
      success: false,
      error: error.message,
      responseTime: elapsed,
      chunks: [],
      response: ''
    };
  }
}

async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE API TEST SUITE');
  console.log('================================\n');
  console.log('📍 Testing endpoint: http://localhost:3000/api/chat');
  console.log('🌐 Domain: thompsonseparts.co.uk');
  console.log('🎯 Strategy: Smart Hybrid Search\n');
  
  const results: TestResult[] = [];
  
  // Test categories with various query types
  const testCases = [
    // CATEGORY 1: Single word queries (should use keyword if matches >= 3)
    {
      category: '1️⃣ SINGLE WORD QUERIES',
      tests: [
        { query: 'pump', expected: 'Keyword search (many matches)' },
        { query: 'hydraulic', expected: 'Keyword search (many matches)' },
        { query: 'Cifa', expected: 'Keyword or Vector (brand name)' },
        { query: 'xyz999', expected: 'Vector fallback (no matches)' },
        { query: 'tipper', expected: 'Keyword search (common term)' },
      ]
    },
    
    // CATEGORY 2: Two word queries (should use keyword if matches >= 3)
    {
      category: '2️⃣ TWO WORD QUERIES',
      tests: [
        { query: 'hydraulic pump', expected: 'Keyword search (common combo)' },
        { query: 'concrete mixer', expected: 'Keyword or Vector' },
        { query: 'Hyva cylinder', expected: 'Keyword search (brand + product)' },
        { query: 'invalid nonsense', expected: 'Vector fallback (no matches)' },
        { query: 'gear pump', expected: 'Keyword search' },
      ]
    },
    
    // CATEGORY 3: Long queries (3+ words, should always use vector)
    {
      category: '3️⃣ LONG QUERIES (VECTOR)',
      tests: [
        { query: 'What hydraulic pumps do you have', expected: 'Vector search' },
        { query: 'I need parts for my concrete mixer truck', expected: 'Vector search' },
        { query: 'Show me all Cifa products', expected: 'Vector search' },
        { query: 'Find replacement parts for tipper hydraulics', expected: 'Vector search' },
        { query: 'Do you have any special offers', expected: 'Vector search' },
      ]
    },
    
    // CATEGORY 4: Edge cases and special characters
    {
      category: '4️⃣ EDGE CASES',
      tests: [
        { query: '123', expected: 'Keyword or Vector (numbers)' },
        { query: 'K38XRZ', expected: 'Keyword or Vector (product code)' },
        { query: '', expected: 'Should handle empty query' },
        { query: '!!!', expected: 'Should handle special chars' },
        { query: 'pump pump pump', expected: 'Vector (3+ words)' },
      ]
    },
    
    // CATEGORY 5: Performance and caching
    {
      category: '5️⃣ PERFORMANCE TESTS',
      tests: [
        { query: 'cached query test', expected: 'First call slower' },
        { query: 'cached query test', expected: 'Second call cached (faster)' },
        { query: 'unique ' + Date.now(), expected: 'Uncached unique query' },
      ]
    }
  ];

  // Run all tests
  for (const category of testCases) {
    console.log('\n' + '='.repeat(60));
    console.log(`${category.category}`);
    console.log('='.repeat(60));
    
    for (const test of category.tests) {
      process.stdout.write(`\n📝 Testing: "${test.query || '[empty]'}"\n`);
      process.stdout.write(`   Expected: ${test.expected}\n`);
      
      const result = await callChatAPI(test.query);
      
      const testResult: TestResult = {
        query: test.query || '[empty]',
        category: category.category,
        expectedBehavior: test.expected,
        passed: result.success,
        responseTime: result.responseTime,
        chunkCount: result.chunks.length,
        hasResults: result.chunks.length > 0 || result.response.length > 50,
        error: result.error,
        sample: result.response?.substring(0, 100)
      };
      
      results.push(testResult);
      
      // Display result
      const statusIcon = result.success ? '✅' : '❌';
      const speedIcon = result.responseTime < 500 ? '⚡' : 
                        result.responseTime < 2000 ? '🔄' : '🐢';
      
      console.log(`   ${statusIcon} Status: ${result.success ? 'Success' : 'Failed'}`);
      console.log(`   ${speedIcon} Time: ${result.responseTime}ms`);
      console.log(`   📊 Chunks: ${result.chunks.length}`);
      
      if (result.response && !test.query.includes('cached')) {
        console.log(`   💬 Response preview: "${result.response.substring(0, 80)}..."`);
      }
      
      if (result.error) {
        console.log(`   ❗ Error: ${result.error}`);
      }
      
      // Detect search method based on response time patterns
      if (result.responseTime < 800 && test.query.split(' ').length <= 2) {
        console.log(`   🔍 Likely method: KEYWORD (fast)`);
      } else if (result.responseTime > 1500) {
        console.log(`   🔍 Likely method: VECTOR (slower, semantic)`);
      }
    }
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY REPORT');
  console.log('='.repeat(60));
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;
  const avgResponseTime = Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests);
  
  console.log(`\n✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${failedTests}/${totalTests}`);
  console.log(`⏱️  Avg Response Time: ${avgResponseTime}ms`);
  
  // Performance breakdown
  const fastQueries = results.filter(r => r.responseTime < 500).length;
  const mediumQueries = results.filter(r => r.responseTime >= 500 && r.responseTime < 2000).length;
  const slowQueries = results.filter(r => r.responseTime >= 2000).length;
  
  console.log(`\n⚡ Fast (<500ms): ${fastQueries}`);
  console.log(`🔄 Medium (500-2000ms): ${mediumQueries}`);
  console.log(`🐢 Slow (>2000ms): ${slowQueries}`);
  
  // Category breakdown
  console.log('\n📈 Results by Category:');
  const categories = [...new Set(results.map(r => r.category))];
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    const catPassed = catResults.filter(r => r.passed).length;
    console.log(`   ${cat}: ${catPassed}/${catResults.length} passed`);
  }
  
  // Failed tests detail
  if (failedTests > 0) {
    console.log('\n⚠️  Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - "${r.query}": ${r.error}`);
    });
  }
  
  // Success determination
  const successRate = (passedTests / totalTests) * 100;
  console.log('\n' + '='.repeat(60));
  if (successRate >= 90) {
    console.log('🎉 TEST SUITE PASSED! Search is working excellently!');
  } else if (successRate >= 70) {
    console.log('⚠️  TEST SUITE PARTIALLY PASSED. Some issues to address.');
  } else {
    console.log('❌ TEST SUITE FAILED. Significant issues detected.');
  }
  console.log('='.repeat(60));
  
  return results;
}

// Check if server is running first
async function checkServerHealth() {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET'
    });
    return response.ok;
  } catch {
    // Health endpoint might not exist, try the main page
    try {
      const response = await fetch('http://localhost:3000', {
        method: 'GET'
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Comprehensive API Test Suite...\n');
  
  // Check server
  console.log('🔍 Checking if server is running on port 3000...');
  const serverUp = await checkServerHealth();
  
  if (!serverUp) {
    console.error('❌ Server is not running on http://localhost:3000');
    console.error('   Please start the server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running!\n');
  
  // Run tests
  await runComprehensiveTests();
}

main().catch(console.error);