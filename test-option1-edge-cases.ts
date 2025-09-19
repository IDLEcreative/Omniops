#!/usr/bin/env npx tsx

/**
 * FORENSIC EDGE CASE ANALYSIS FOR OPTION 1 IMPLEMENTATION
 * Systematically tests edge cases, security vulnerabilities, and failure modes
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/chat-intelligent';

// Test configuration
const TEST_CONFIG = {
  sessionId: `edge-test-${Date.now()}`,
  domain: 'thompsonseparts.co.uk'
};

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  details: any;
  error?: string;
  vulnerability?: string;
  recommendation?: string;
}

const testResults: TestResult[] = [];

// Helper function to make API request
async function makeRequest(message: string, customConfig?: any) {
  const body = {
    message,
    session_id: TEST_CONFIG.sessionId,
    domain: TEST_CONFIG.domain,
    ...customConfig
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      timeout: 60000
    });

    const data = await response.json();
    return { status: response.status, data, headers: response.headers };
  } catch (error: any) {
    return { error: error.message, status: null, data: null };
  }
}

// Test Categories
async function testEdgeCases() {
  console.log(`${colors.cyan}=== EDGE CASE TESTING ===${colors.reset}\n`);

  // Test 1: Empty Query
  console.log(`${colors.yellow}Test 1: Empty/Whitespace Query${colors.reset}`);
  const emptyTests = [
    { query: '', name: 'Empty string' },
    { query: '   ', name: 'Only spaces' },
    { query: '\t\n', name: 'Only whitespace' },
    { query: '​', name: 'Zero-width space' }
  ];

  for (const test of emptyTests) {
    const result = await makeRequest(test.query);
    testResults.push({
      name: `Empty Query: ${test.name}`,
      category: 'Edge Cases',
      passed: result.status === 200 && !result.error,
      details: result,
      vulnerability: result.status !== 200 ? 'Crashes on empty input' : undefined
    });
  }

  // Test 2: Extremely Long Query
  console.log(`${colors.yellow}Test 2: Long Query (5000+ chars)${colors.reset}`);
  const longQuery = 'show me pumps ' + 'and filters '.repeat(500);
  const longResult = await makeRequest(longQuery);
  testResults.push({
    name: 'Very Long Query',
    category: 'Edge Cases',
    passed: longResult.status === 200 || longResult.status === 400,
    details: { queryLength: longQuery.length, status: longResult.status },
    vulnerability: longResult.status === 500 ? 'DoS via long queries' : undefined
  });

  // Test 3: Special Characters & Injection
  console.log(`${colors.yellow}Test 3: Special Characters & SQL Injection${colors.reset}`);
  const injectionTests = [
    "'; DROP TABLE scraped_pages; --",
    "\" OR 1=1 --",
    "%' OR '1'='1",
    "\\x00\\x01\\x02",
    "${__dirname}",
    "{{7*7}}",
    "<script>alert('xss')</script>",
    "../../etc/passwd",
    "'; SELECT * FROM customer_configs; --",
    "pump%' UNION SELECT password FROM users --"
  ];

  for (const injection of injectionTests) {
    const result = await makeRequest(injection);
    const responseText = JSON.stringify(result.data);
    
    testResults.push({
      name: `Injection: ${injection.substring(0, 30)}...`,
      category: 'Security',
      passed: result.status === 200 && 
              !responseText.includes('error') && 
              !responseText.includes('DROP') &&
              !responseText.includes('password'),
      details: { query: injection, response: result.data?.message?.substring(0, 100) },
      vulnerability: responseText.includes('error') ? 'Potential SQL injection' : undefined
    });
  }

  // Test 4: Zero Results Query
  console.log(`${colors.yellow}Test 4: Queries with Zero Results${colors.reset}`);
  const zeroResultQueries = [
    'xyzabc123nonexistent',
    '这是中文测试产品不存在',
    'product-that-definitely-does-not-exist-123456789',
    '!!!@@@###$$$%%%'
  ];

  for (const query of zeroResultQueries) {
    const result = await makeRequest(query);
    testResults.push({
      name: `Zero Results: ${query.substring(0, 20)}`,
      category: 'Edge Cases',
      passed: result.status === 200 && result.data?.message,
      details: { 
        hasMessage: !!result.data?.message,
        messageLength: result.data?.message?.length,
        sources: result.data?.sources?.length || 0
      }
    });
  }

  // Test 5: Unicode and Emoji
  console.log(`${colors.yellow}Test 5: Unicode & Emoji${colors.reset}`);
  const unicodeTests = [
    '🔧 show me tools 🛠️',
    '测试产品搜索',
    'مضخة اختبار',
    '𝕊𝕙𝕠𝕨 𝕞𝕖 𝕡𝕦𝕞𝕡𝕤',
    '\\u0070\\u0075\\u006D\\u0070\\u0073'
  ];

  for (const query of unicodeTests) {
    const result = await makeRequest(query);
    testResults.push({
      name: `Unicode: ${query.substring(0, 20)}`,
      category: 'Edge Cases',
      passed: result.status === 200,
      details: { query, responded: !!result.data?.message }
    });
  }
}

async function testRaceConditions() {
  console.log(`\n${colors.cyan}=== RACE CONDITION TESTING ===${colors.reset}\n`);

  // Test 6: Concurrent Requests
  console.log(`${colors.yellow}Test 6: 10 Concurrent Requests${colors.reset}`);
  const promises = Array(10).fill(0).map((_, i) => 
    makeRequest(`concurrent test ${i}`)
  );
  
  const startTime = Date.now();
  const results = await Promise.allSettled(promises);
  const duration = Date.now() - startTime;
  
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 200);
  
  testResults.push({
    name: 'Concurrent Requests',
    category: 'Race Conditions',
    passed: successful.length >= 8, // Allow 2 failures for rate limiting
    details: {
      total: results.length,
      successful: successful.length,
      duration: `${duration}ms`,
      avgTime: `${Math.round(duration / results.length)}ms`
    },
    vulnerability: successful.length < 5 ? 'Cannot handle concurrent load' : undefined
  });

  // Test 7: Rapid Sequential Requests
  console.log(`${colors.yellow}Test 7: Rapid Sequential Requests${colors.reset}`);
  let sequentialSuccess = 0;
  for (let i = 0; i < 5; i++) {
    const result = await makeRequest(`rapid test ${i}`);
    if (result.status === 200) sequentialSuccess++;
    // No delay between requests
  }
  
  testResults.push({
    name: 'Rapid Sequential Requests',
    category: 'Race Conditions',
    passed: sequentialSuccess >= 3,
    details: { successful: sequentialSuccess, total: 5 },
    vulnerability: sequentialSuccess === 0 ? 'Rate limiting too aggressive' : undefined
  });
}

async function testFailureModes() {
  console.log(`\n${colors.cyan}=== FAILURE MODE TESTING ===${colors.reset}\n`);

  // Test 8: Invalid Domain
  console.log(`${colors.yellow}Test 8: Non-existent Domain${colors.reset}`);
  const invalidDomain = await makeRequest('show me products', { 
    domain: 'nonexistent-domain-xyz123.com' 
  });
  
  testResults.push({
    name: 'Non-existent Domain',
    category: 'Failure Modes',
    passed: invalidDomain.status === 200 || invalidDomain.status === 404,
    details: { 
      status: invalidDomain.status,
      hasError: !!invalidDomain.data?.error,
      message: invalidDomain.data?.message?.substring(0, 100)
    },
    vulnerability: invalidDomain.status === 500 ? 'Crashes on invalid domain' : undefined
  });

  // Test 9: Invalid Session ID
  console.log(`${colors.yellow}Test 9: Invalid Session ID Formats${colors.reset}`);
  const invalidSessions = [
    null,
    undefined,
    '',
    'a'.repeat(1000),
    '../../etc/passwd',
    '<script>alert(1)</script>'
  ];

  for (const sessionId of invalidSessions) {
    const result = await makeRequest('test query', { session_id: sessionId });
    testResults.push({
      name: `Invalid Session: ${String(sessionId).substring(0, 20)}`,
      category: 'Failure Modes',
      passed: result.status === 200 || result.status === 400,
      details: { sessionId: String(sessionId).substring(0, 50), status: result.status },
      vulnerability: result.status === 500 ? 'Crashes on invalid session' : undefined
    });
  }

  // Test 10: Malformed JSON
  console.log(`${colors.yellow}Test 10: Malformed Request Body${colors.reset}`);
  try {
    const malformedResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"message": "test", invalid json here'
    });
    
    testResults.push({
      name: 'Malformed JSON',
      category: 'Failure Modes',
      passed: malformedResponse.status === 400,
      details: { status: malformedResponse.status },
      vulnerability: malformedResponse.status === 500 ? 'No JSON validation' : undefined
    });
  } catch (error: any) {
    testResults.push({
      name: 'Malformed JSON',
      category: 'Failure Modes',
      passed: false,
      details: { error: error.message },
      vulnerability: 'Crashes on malformed JSON'
    });
  }
}

async function testResourceExhaustion() {
  console.log(`\n${colors.cyan}=== RESOURCE EXHAUSTION TESTING ===${colors.reset}\n`);

  // Test 11: Request Maximum Limit
  console.log(`${colors.yellow}Test 11: Request 500 Products (Max Limit)${colors.reset}`);
  const maxLimitResult = await makeRequest('show me all products', {
    config: {
      ai: {
        maxSearchIterations: 5,
        searchTimeout: 30000
      }
    }
  });

  testResults.push({
    name: 'Maximum Product Request',
    category: 'Resource Exhaustion',
    passed: maxLimitResult.status === 200,
    details: {
      status: maxLimitResult.status,
      searchCount: maxLimitResult.data?.metadata?.searchCount,
      executionTime: maxLimitResult.data?.metadata?.executionTime
    },
    vulnerability: maxLimitResult.data?.metadata?.executionTime > 30000 ? 'Timeout bypass' : undefined
  });

  // Test 12: Memory Exhaustion Attempt
  console.log(`${colors.yellow}Test 12: Memory Exhaustion Pattern${colors.reset}`);
  const memoryPattern = 'A'.repeat(1000) + ' show me ' + 'B'.repeat(1000);
  const memoryResult = await makeRequest(memoryPattern);
  
  testResults.push({
    name: 'Memory Pattern Test',
    category: 'Resource Exhaustion',
    passed: memoryResult.status === 200 || memoryResult.status === 400,
    details: {
      status: memoryResult.status,
      patternLength: memoryPattern.length
    },
    vulnerability: memoryResult.status === 500 ? 'Memory exhaustion possible' : undefined
  });
}

async function testDataConsistency() {
  console.log(`\n${colors.cyan}=== DATA CONSISTENCY TESTING ===${colors.reset}\n`);

  // Test 13: Overview vs Actual Results
  console.log(`${colors.yellow}Test 13: Overview Count vs Actual Results${colors.reset}`);
  const consistencyResult = await makeRequest('pump');
  
  if (consistencyResult.status === 200 && consistencyResult.data) {
    const message = consistencyResult.data.message || '';
    const totalMatch = message.match(/(\d+)\s+total/i);
    const showingMatch = message.match(/showing\s+(\d+)/i);
    
    const claimedTotal = totalMatch ? parseInt(totalMatch[1]) : null;
    const actualShown = consistencyResult.data.sources?.length || 0;
    
    testResults.push({
      name: 'Count Consistency',
      category: 'Data Consistency',
      passed: claimedTotal !== null,
      details: {
        claimedTotal,
        sourcesReturned: actualShown,
        messageHasCount: !!totalMatch
      },
      vulnerability: !totalMatch ? 'Overview data not being used' : undefined
    });
  }

  // Test 14: Repeated Queries
  console.log(`${colors.yellow}Test 14: Repeated Query Consistency${colors.reset}`);
  const query = 'show me filters';
  const results = [];
  
  for (let i = 0; i < 3; i++) {
    const result = await makeRequest(query);
    if (result.data?.metadata?.searchCount) {
      results.push(result.data.metadata.searchCount);
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  }
  
  const allSame = results.length > 0 && results.every(r => r === results[0]);
  
  testResults.push({
    name: 'Query Repeatability',
    category: 'Data Consistency',
    passed: allSame,
    details: {
      results,
      consistent: allSame
    },
    vulnerability: !allSame ? 'Inconsistent results for same query' : undefined
  });
}

async function testCachingVulnerabilities() {
  console.log(`\n${colors.cyan}=== CACHING VULNERABILITY TESTING ===${colors.reset}\n`);

  // Test 15: Cache Poisoning Attempt
  console.log(`${colors.yellow}Test 15: Cache Poisoning${colors.reset}`);
  const poisonQuery = 'pump\x00<script>alert(1)</script>';
  const poisonResult = await makeRequest(poisonQuery);
  
  // Try to retrieve potentially poisoned cache
  const retrieveResult = await makeRequest('pump');
  const hasScript = JSON.stringify(retrieveResult.data).includes('<script>');
  
  testResults.push({
    name: 'Cache Poisoning',
    category: 'Caching',
    passed: !hasScript && poisonResult.status !== 500,
    details: {
      poisonStatus: poisonResult.status,
      retrieveStatus: retrieveResult.status,
      scriptInResponse: hasScript
    },
    vulnerability: hasScript ? 'Cache poisoning vulnerability' : undefined
  });

  // Test 16: Cross-Domain Data Leakage
  console.log(`${colors.yellow}Test 16: Cross-Domain Data Leakage${colors.reset}`);
  const domain1Result = await makeRequest('test products', { domain: 'domain1.com' });
  const domain2Result = await makeRequest('test products', { domain: 'domain2.com' });
  
  const domain1Sources = domain1Result.data?.sources || [];
  const domain2Sources = domain2Result.data?.sources || [];
  
  const crossDomainLeak = domain1Sources.some(s1 => 
    domain2Sources.some(s2 => s1.url === s2.url)
  );
  
  testResults.push({
    name: 'Cross-Domain Isolation',
    category: 'Caching',
    passed: !crossDomainLeak,
    details: {
      domain1Sources: domain1Sources.length,
      domain2Sources: domain2Sources.length,
      hasOverlap: crossDomainLeak
    },
    vulnerability: crossDomainLeak ? 'Cross-domain data leakage' : undefined
  });
}

async function testTimeoutScenarios() {
  console.log(`\n${colors.cyan}=== TIMEOUT SCENARIO TESTING ===${colors.reset}\n`);

  // Test 17: Force Timeout
  console.log(`${colors.yellow}Test 17: Search Timeout Handling${colors.reset}`);
  const timeoutResult = await makeRequest('show me all products in stock with detailed specifications', {
    config: {
      ai: {
        searchTimeout: 100 // 100ms timeout - should trigger
      }
    }
  });
  
  testResults.push({
    name: 'Timeout Handling',
    category: 'Timeouts',
    passed: timeoutResult.status === 200 || timeoutResult.status === 503,
    details: {
      status: timeoutResult.status,
      hasMessage: !!timeoutResult.data?.message,
      executionTime: timeoutResult.data?.metadata?.executionTime
    },
    vulnerability: timeoutResult.status === 500 ? 'Timeout causes crash' : undefined
  });

  // Test 18: Slow Query Handling
  console.log(`${colors.yellow}Test 18: Slow Query Processing${colors.reset}`);
  const complexQuery = Array(20).fill('pump OR filter OR valve OR seal').join(' AND ');
  const slowResult = await makeRequest(complexQuery);
  
  testResults.push({
    name: 'Complex Query Performance',
    category: 'Timeouts',
    passed: slowResult.status === 200 && slowResult.data?.metadata?.executionTime < 30000,
    details: {
      queryComplexity: complexQuery.split(' ').length,
      executionTime: slowResult.data?.metadata?.executionTime,
      timedOut: slowResult.data?.metadata?.executionTime >= 30000
    },
    vulnerability: slowResult.data?.metadata?.executionTime >= 30000 ? 'No query complexity limit' : undefined
  });
}

async function testErrorPropagation() {
  console.log(`\n${colors.cyan}=== ERROR PROPAGATION TESTING ===${colors.reset}\n`);

  // Test 19: Database Connection Failure Simulation
  console.log(`${colors.yellow}Test 19: Invalid Config Handling${colors.reset}`);
  const invalidConfigTests = [
    { config: null, name: 'Null config' },
    { config: { features: { woocommerce: 'not-a-boolean' } }, name: 'Invalid type' },
    { config: { ai: { maxSearchIterations: -1 } }, name: 'Negative iteration' },
    { config: { ai: { searchTimeout: 999999999 } }, name: 'Huge timeout' }
  ];

  for (const test of invalidConfigTests) {
    const result = await makeRequest('test query', { config: test.config });
    testResults.push({
      name: `Config: ${test.name}`,
      category: 'Error Handling',
      passed: result.status === 200 || result.status === 400,
      details: {
        config: test.config,
        status: result.status,
        hasError: !!result.data?.error
      },
      vulnerability: result.status === 500 ? 'Poor config validation' : undefined
    });
  }

  // Test 20: Null/Undefined in Critical Paths
  console.log(`${colors.yellow}Test 20: Null Safety${colors.reset}`);
  const nullTests = [
    { message: null, name: 'Null message' },
    { domain: null, name: 'Null domain' },
    { conversation_id: 'not-a-uuid', name: 'Invalid UUID' }
  ];

  for (const test of nullTests) {
    const result = await makeRequest(test.message || 'test', test);
    testResults.push({
      name: `Null Safety: ${test.name}`,
      category: 'Error Handling',
      passed: result.status === 200 || result.status === 400,
      details: {
        test: test.name,
        status: result.status
      },
      vulnerability: result.status === 500 ? 'Null pointer issues' : undefined
    });
  }
}

// Summary and reporting
function generateReport() {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}=== FORENSIC ANALYSIS COMPLETE ===${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  const categories = [...new Set(testResults.map(r => r.category))];
  
  for (const category of categories) {
    const categoryResults = testResults.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.passed).length;
    const total = categoryResults.length;
    const passRate = ((passed / total) * 100).toFixed(1);
    
    console.log(`${colors.blue}${category}:${colors.reset} ${passed}/${total} passed (${passRate}%)`);
    
    // Show failures and vulnerabilities
    const failures = categoryResults.filter(r => !r.passed || r.vulnerability);
    for (const failure of failures) {
      const icon = failure.vulnerability ? '🔴' : '⚠️ ';
      console.log(`  ${icon} ${failure.name}`);
      if (failure.vulnerability) {
        console.log(`     ${colors.red}Vulnerability: ${failure.vulnerability}${colors.reset}`);
      }
      if (failure.recommendation) {
        console.log(`     ${colors.yellow}Fix: ${failure.recommendation}${colors.reset}`);
      }
    }
  }

  // Critical vulnerabilities summary
  const vulnerabilities = testResults.filter(r => r.vulnerability);
  if (vulnerabilities.length > 0) {
    console.log(`\n${colors.red}=== CRITICAL VULNERABILITIES FOUND ===${colors.reset}`);
    for (const vuln of vulnerabilities) {
      console.log(`${colors.red}• ${vuln.vulnerability}${colors.reset}`);
      console.log(`  Found in: ${vuln.name}`);
    }
  }

  // Statistics
  const totalTests = testResults.length;
  const totalPassed = testResults.filter(r => r.passed).length;
  const totalVulns = vulnerabilities.length;
  
  console.log(`\n${colors.cyan}=== SUMMARY ===${colors.reset}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${colors.green}${totalPassed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${totalTests - totalPassed}${colors.reset}`);
  console.log(`Vulnerabilities: ${colors.red}${totalVulns}${colors.reset}`);
  console.log(`Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

  // Save detailed results
  const reportFile = `edge-case-report-${Date.now()}.json`;
  require('fs').writeFileSync(
    reportFile,
    JSON.stringify(testResults, null, 2)
  );
  console.log(`\nDetailed report saved to: ${colors.green}${reportFile}${colors.reset}`);
}

// Main execution
async function main() {
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.magenta}OPTION 1 IMPLEMENTATION - FORENSIC EDGE CASE ANALYSIS${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}\n`);
  console.log(`Testing against: ${API_URL}`);
  console.log(`Domain: ${TEST_CONFIG.domain}`);
  console.log(`Session: ${TEST_CONFIG.sessionId}\n`);

  try {
    // Verify API is responsive
    console.log('Verifying API availability...');
    const health = await makeRequest('test');
    if (!health.data) {
      console.error(`${colors.red}API is not responding. Please ensure the server is running.${colors.reset}`);
      process.exit(1);
    }
    console.log(`${colors.green}✓ API is responsive${colors.reset}\n`);

    // Run all test suites
    await testEdgeCases();
    await testRaceConditions();
    await testFailureModes();
    await testResourceExhaustion();
    await testDataConsistency();
    await testCachingVulnerabilities();
    await testTimeoutScenarios();
    await testErrorPropagation();

    // Generate report
    generateReport();

  } catch (error) {
    console.error(`${colors.red}Fatal error during testing:${colors.reset}`, error);
    process.exit(1);
  }
}

// Execute tests
main().catch(console.error);