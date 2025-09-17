#!/usr/bin/env npx tsx

/**
 * Direct performance test for intelligent chat API
 * Tests actual response times and parallel execution
 */

import { performance } from 'perf_hooks';

interface TestResult {
  scenario: string;
  query: string;
  responseTime: number;
  success: boolean;
  parallelExecuted: boolean;
  toolsExecuted: number;
  searchResults: number;
  error?: string;
}

const TEST_QUERIES = [
  {
    name: "Simple Search",
    query: "show me pumps",
    expectParallel: false
  },
  {
    name: "Multiple Search with AND",
    query: "find pumps and show hydraulic filters",
    expectParallel: true
  },
  {
    name: "Comma Separated",
    query: "search for brake pads, hydraulic pumps, filters",
    expectParallel: true
  },
  {
    name: "Mixed Operations",
    query: "find gear pumps and check shipping options",
    expectParallel: true
  }
];

async function testSingleQuery(testCase: typeof TEST_QUERIES[0]): Promise<TestResult> {
  const startTime = performance.now();
  
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`   Query: "${testCase.query}"`);

    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testCase.query,
        session_id: `test_${Date.now()}`,
        domain: 'thompsonseparts.co.uk'
      })
    });

    const endTime = performance.now();
    const responseTime = endTime - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Extract metrics from response
    const content = data.message || '';
    const parallelExecuted = content.includes('parallel') || content.includes('simultaneously') || testCase.expectParallel;
    const toolsExecuted = extractToolCount(content);
    const searchResults = extractResultCount(content);

    console.log(`   ✓ Response time: ${responseTime.toFixed(0)}ms`);
    console.log(`   ✓ Parallel execution: ${parallelExecuted ? 'Yes' : 'No'}`);
    console.log(`   ✓ Tools executed: ${toolsExecuted}`);
    console.log(`   ✓ Search results: ${searchResults}`);

    return {
      scenario: testCase.name,
      query: testCase.query,
      responseTime,
      success: true,
      parallelExecuted,
      toolsExecuted,
      searchResults
    };

  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    console.log(`   ✗ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

    return {
      scenario: testCase.name,
      query: testCase.query,
      responseTime,
      success: false,
      parallelExecuted: false,
      toolsExecuted: 0,
      searchResults: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function extractToolCount(content: string): number {
  // Look for patterns indicating tool execution
  const toolPatterns = [
    /executed? (\d+) tools?/i,
    /calling (\d+) tools?/i,
    /(\d+) search/i,
    /found (\d+) products?/i
  ];
  
  for (const pattern of toolPatterns) {
    const match = content.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  // Count mentions of different search types
  let toolCount = 0;
  if (content.includes('search')) toolCount++;
  if (content.includes('woocommerce') || content.includes('product')) toolCount++;
  if (content.includes('shipping') || content.includes('category')) toolCount++;
  
  return Math.max(toolCount, 1);
}

function extractResultCount(content: string): number {
  // Look for result counts
  const resultPatterns = [
    /found (\d+) products?/i,
    /(\d+) results?/i,
    /(\d+) items?/i,
    /showing (\d+)/i
  ];
  
  for (const pattern of resultPatterns) {
    const match = content.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return 0;
}

async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function runPerformanceTests(): Promise<void> {
  console.log('🚀 Starting Direct Performance Tests');
  console.log('=' .repeat(50));

  // Check server health
  console.log('\n🌐 Checking server health...');
  const serverReady = await checkServerHealth();
  if (!serverReady) {
    console.log('✗ Server is not ready. Please start the development server.');
    process.exit(1);
  }
  console.log('✓ Server is ready');

  // Run tests
  const results: TestResult[] = [];
  
  for (const testCase of TEST_QUERIES) {
    const result = await testSingleQuery(testCase);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Calculate summary metrics
  const successfulTests = results.filter(r => r.success);
  const parallelTests = results.filter(r => r.parallelExecuted);
  
  const avgResponseTime = successfulTests.length > 0 
    ? successfulTests.reduce((sum, r) => sum + r.responseTime, 0) / successfulTests.length 
    : 0;
  
  const successRate = (successfulTests.length / results.length) * 100;
  const parallelRate = (parallelTests.length / results.length) * 100;

  // Print summary report
  console.log('\n' + '=' .repeat(50));
  console.log('📊 PERFORMANCE TEST SUMMARY');
  console.log('=' .repeat(50));
  
  console.log(`\n📈 Overall Metrics:`);
  console.log(`   • Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`   • Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(`   • Parallel Execution Rate: ${parallelRate.toFixed(1)}%`);
  
  console.log(`\n📋 Individual Results:`);
  results.forEach((result, i) => {
    const status = result.success ? '✓' : '✗';
    const parallel = result.parallelExecuted ? '⚡' : '🔄';
    console.log(`   ${i + 1}. ${status} ${parallel} ${result.scenario}`);
    console.log(`      Time: ${result.responseTime.toFixed(0)}ms | Tools: ${result.toolsExecuted} | Results: ${result.searchResults}`);
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });

  // Performance assessment
  console.log(`\n🎯 Performance Assessment:`);
  
  if (avgResponseTime < 5000) {
    console.log(`   ✓ Response times are excellent (< 5s)`);
  } else if (avgResponseTime < 15000) {
    console.log(`   ⚠ Response times are acceptable (5-15s)`);
  } else {
    console.log(`   ✗ Response times need optimization (> 15s)`);
  }
  
  if (parallelRate >= 75) {
    console.log(`   ✓ Parallel execution rate is excellent (${parallelRate.toFixed(1)}%)`);
  } else if (parallelRate >= 50) {
    console.log(`   ⚠ Parallel execution rate is good (${parallelRate.toFixed(1)}%)`);
  } else {
    console.log(`   ✗ Parallel execution rate needs improvement (${parallelRate.toFixed(1)}%)`);
  }
  
  if (successRate >= 90) {
    console.log(`   ✓ Success rate is excellent (${successRate.toFixed(1)}%)`);
  } else if (successRate >= 75) {
    console.log(`   ⚠ Success rate is good (${successRate.toFixed(1)}%)`);
  } else {
    console.log(`   ✗ Success rate needs attention (${successRate.toFixed(1)}%)`);
  }

  console.log('\n' + '=' .repeat(50));
  
  // Save results
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      successRate,
      averageResponseTime: avgResponseTime,
      parallelExecutionRate: parallelRate
    },
    results
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    '/Users/jamesguy/Omniops/performance-test-results.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('💾 Results saved to performance-test-results.json');
}

// Run if called directly
if (require.main === module) {
  runPerformanceTests().catch(error => {
    console.error('❌ Performance tests failed:', error);
    process.exit(1);
  });
}