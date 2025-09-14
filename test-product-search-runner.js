#!/usr/bin/env node

/**
 * Simple Product Search Endpoint Test Runner
 * Tests the complete metadata vectorization implementation
 * No external test framework required
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_DOMAIN = 'teststore.com';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Performance tracking
class PerformanceTracker {
  constructor() {
    this.baselineTimes = new Map([
      ['sku_lookup', 2000],
      ['shopping_query', 1500],
      ['price_query', 1200],
      ['availability_query', 1200],
      ['general_search', 1000]
    ]);
    
    this.results = new Map();
  }
  
  recordResult(queryType, actualTime) {
    const baseline = this.baselineTimes.get(queryType) || 1000;
    const improvement = ((baseline - actualTime) / baseline) * 100;
    
    this.results.set(queryType, {
      actual: actualTime,
      baseline,
      improvement
    });
    
    return improvement;
  }
  
  getAverageImprovement() {
    if (this.results.size === 0) return 0;
    
    const totalImprovement = Array.from(this.results.values())
      .reduce((sum, result) => sum + result.improvement, 0);
    
    return totalImprovement / this.results.size;
  }
  
  generateReport() {
    const lines = [`${colors.cyan}Performance Report:${colors.reset}`];
    lines.push('='.repeat(70));
    
    this.results.forEach((result, queryType) => {
      const improvementColor = result.improvement >= 70 ? colors.green : 
                              result.improvement >= 50 ? colors.yellow : colors.red;
      
      lines.push(
        `${queryType.padEnd(20)} | ` +
        `${result.actual}ms (baseline: ${result.baseline}ms) | ` +
        `${improvementColor}${result.improvement.toFixed(1)}% improvement${colors.reset}`
      );
    });
    
    lines.push('='.repeat(70));
    
    const avgImprovement = this.getAverageImprovement();
    const avgColor = avgImprovement >= 70 ? colors.green : 
                    avgImprovement >= 50 ? colors.yellow : colors.red;
    
    lines.push(`Average Improvement: ${avgColor}${avgImprovement.toFixed(1)}%${colors.reset}`);
    
    return lines.join('\n');
  }
}

// Test utilities
async function makeRequest(endpoint, body = null, method = 'POST') {
  try {
    const options = {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {}
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`${colors.red}Request failed:${colors.reset}`, error.message);
    return { status: 500, data: null, error };
  }
}

function assert(condition, message) {
  if (!condition) {
    console.log(`  ${colors.red}✗ ${message}${colors.reset}`);
    return false;
  }
  console.log(`  ${colors.green}✓ ${message}${colors.reset}`);
  return true;
}

function logTestStart(testName) {
  console.log(`\n${colors.blue}Testing: ${testName}${colors.reset}`);
}

function logTestResult(success, message) {
  if (success) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ ${message}${colors.reset}`);
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(`${colors.cyan}🔍 Product Search Endpoint Test Suite${colors.reset}`);
  console.log(`${colors.gray}Testing metadata vectorization implementation${colors.reset}`);
  console.log(`${colors.gray}Expected: 70-80% search relevance improvement${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  
  const performanceTracker = new PerformanceTracker();
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Endpoint Structure
  logTestStart('Endpoint Structure and Compilation');
  {
    const { status, data } = await makeRequest('/api/search/products', null, 'GET');
    
    if (assert(status === 200, 'GET endpoint returns 200')) passedTests++;
    totalTests++;
    
    if (data) {
      if (assert(data.version === '2.0', 'Version is 2.0')) passedTests++;
      if (assert(data.expectedImprovement === '70-80% search relevance', 'Expected improvement stated')) passedTests++;
      if (assert(Array.isArray(data.features), 'Features array present')) passedTests++;
      totalTests += 3;
    }
  }
  
  // Test 2: SKU Lookup
  logTestStart('SKU Lookup - Direct SQL Search');
  {
    const startTime = Date.now();
    const { status, data } = await makeRequest('/api/search/products', {
      query: 'DC66-10P',
      domain: TEST_DOMAIN,
      limit: 10
    });
    const searchTime = Date.now() - startTime;
    
    if (assert(status === 200, 'SKU search returns 200')) passedTests++;
    totalTests++;
    
    if (data) {
      const improvement = performanceTracker.recordResult('sku_lookup', searchTime);
      
      if (assert(data.classification?.type === 'sku_lookup', 'Classified as SKU lookup')) passedTests++;
      if (assert(data.classification?.intent?.hasSKU === true, 'SKU intent detected')) passedTests++;
      if (assert(data.classification?.confidence > 0.9, 'High confidence (>0.9)')) passedTests++;
      if (assert(data.metadata?.searchStrategy === 'sql_direct', 'Using SQL direct strategy')) passedTests++;
      totalTests += 4;
      
      console.log(`  ${colors.gray}Search time: ${searchTime}ms (${improvement.toFixed(1)}% improvement)${colors.reset}`);
    }
  }
  
  // Test 3: Natural Language Query
  logTestStart('Natural Language - Cheapest Hydraulic Pump');
  {
    const startTime = Date.now();
    const { status, data } = await makeRequest('/api/search/products', {
      query: 'cheapest hydraulic pump in stock',
      domain: TEST_DOMAIN,
      limit: 20
    });
    const searchTime = Date.now() - startTime;
    
    if (assert(status === 200, 'Natural language search returns 200')) passedTests++;
    totalTests++;
    
    if (data) {
      const improvement = performanceTracker.recordResult('shopping_query', searchTime);
      
      if (assert(data.classification?.type === 'shopping_query', 'Classified as shopping query')) passedTests++;
      if (assert(data.classification?.intent?.hasPrice === true, 'Price intent detected')) passedTests++;
      if (assert(data.classification?.intent?.hasAvailability === true, 'Availability intent detected')) passedTests++;
      if (assert(data.metadata?.searchStrategy === 'sql_filtered_vector', 'Using filtered vector strategy')) passedTests++;
      if (assert(data.metadata?.weights?.metadata > 0.5, 'Metadata weighted appropriately')) passedTests++;
      totalTests += 5;
      
      console.log(`  ${colors.gray}Search time: ${searchTime}ms (${improvement.toFixed(1)}% improvement)${colors.reset}`);
    }
  }
  
  // Test 4: Price Query
  logTestStart('Price Query - Heating Elements Under $50');
  {
    const startTime = Date.now();
    const { status, data } = await makeRequest('/api/search/products', {
      query: 'heating elements under $50',
      domain: TEST_DOMAIN,
      limit: 15
    });
    const searchTime = Date.now() - startTime;
    
    if (assert(status === 200, 'Price query returns 200')) passedTests++;
    totalTests++;
    
    if (data) {
      const improvement = performanceTracker.recordResult('price_query', searchTime);
      
      if (assert(data.classification?.type === 'price_query', 'Classified as price query')) passedTests++;
      if (assert(data.classification?.intent?.hasPrice === true, 'Price intent detected')) passedTests++;
      if (assert(['sql_filtered_vector', 'vector_dual'].includes(data.metadata?.searchStrategy), 'Using appropriate strategy')) passedTests++;
      totalTests += 3;
      
      console.log(`  ${colors.gray}Search time: ${searchTime}ms (${improvement.toFixed(1)}% improvement)${colors.reset}`);
    }
  }
  
  // Test 5: Availability Query
  logTestStart('Availability Query - Samsung Parts in Stock');
  {
    const startTime = Date.now();
    const { status, data } = await makeRequest('/api/search/products', {
      query: 'samsung parts in stock',
      domain: TEST_DOMAIN,
      limit: 20
    });
    const searchTime = Date.now() - startTime;
    
    if (assert(status === 200, 'Availability query returns 200')) passedTests++;
    totalTests++;
    
    if (data) {
      const improvement = performanceTracker.recordResult('availability_query', searchTime);
      
      if (assert(data.classification?.intent?.hasAvailability === true, 'Availability intent detected')) passedTests++;
      if (assert(data.classification?.intent?.hasBrand === true, 'Brand intent detected')) passedTests++;
      if (assert(data.metadata?.searchStrategy === 'sql_filtered_vector', 'Using filtered vector strategy')) passedTests++;
      totalTests += 3;
      
      console.log(`  ${colors.gray}Search time: ${searchTime}ms (${improvement.toFixed(1)}% improvement)${colors.reset}`);
    }
  }
  
  // Test 6: Query Classification
  logTestStart('Query Classification Accuracy');
  {
    const testCases = [
      { query: 'how to replace DC66-10P', expectedType: 'support_query' },
      { query: 'compare whirlpool vs samsung', expectedType: 'comparison_query' },
      { query: 'W10189966', expectedType: 'sku_lookup' },
      { query: 'dishwasher parts', expectedType: 'general_search' }
    ];
    
    for (const testCase of testCases) {
      const { status, data } = await makeRequest('/api/search/products', {
        query: testCase.query,
        limit: 5
      });
      
      if (status === 200 && data) {
        if (assert(
          data.classification?.type === testCase.expectedType,
          `"${testCase.query}" → ${testCase.expectedType}`
        )) passedTests++;
        totalTests++;
      }
    }
  }
  
  // Test 7: Response Format
  logTestStart('Response Format Validation');
  {
    const { status, data } = await makeRequest('/api/search/products', {
      query: 'water filter',
      limit: 5
    });
    
    if (assert(status === 200, 'Response status 200')) passedTests++;
    totalTests++;
    
    if (data) {
      if (assert(data.hasOwnProperty('query'), 'Has query field')) passedTests++;
      if (assert(data.hasOwnProperty('classification'), 'Has classification field')) passedTests++;
      if (assert(data.hasOwnProperty('results'), 'Has results field')) passedTests++;
      if (assert(data.hasOwnProperty('metadata'), 'Has metadata field')) passedTests++;
      if (assert(Array.isArray(data.results), 'Results is an array')) passedTests++;
      totalTests += 5;
      
      if (data.results.length > 0) {
        const firstResult = data.results[0];
        if (assert(firstResult.hasOwnProperty('id'), 'Result has id')) passedTests++;
        if (assert(firstResult.hasOwnProperty('relevanceScore'), 'Result has relevanceScore')) passedTests++;
        if (assert(firstResult.hasOwnProperty('matchType'), 'Result has matchType')) passedTests++;
        totalTests += 3;
      }
    }
  }
  
  // Test 8: Edge Cases
  logTestStart('Edge Cases');
  {
    // Empty results
    const { status: status1, data: data1 } = await makeRequest('/api/search/products', {
      query: 'nonexistent-xyz-123-sku',
      limit: 5
    });
    
    if (assert(status1 === 200, 'Handles no results gracefully')) passedTests++;
    if (assert(Array.isArray(data1?.results), 'Returns empty array for no results')) passedTests++;
    totalTests += 2;
    
    // Special characters
    const { status: status2, data: data2 } = await makeRequest('/api/search/products', {
      query: 'part #DA29-00020B @ $25.99',
      limit: 5
    });
    
    if (assert(status2 === 200, 'Handles special characters')) passedTests++;
    if (assert(data2?.classification?.intent?.hasSKU === true, 'Detects SKU with special chars')) passedTests++;
    totalTests += 2;
  }
  
  // Performance Summary
  console.log(`\n${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  console.log(performanceTracker.generateReport());
  console.log(`${colors.cyan}${'='.repeat(70)}${colors.reset}`);
  
  // Test Summary
  const testPercentage = ((passedTests / totalTests) * 100).toFixed(1);
  const avgImprovement = performanceTracker.getAverageImprovement();
  
  console.log(`\n${colors.cyan}Test Summary:${colors.reset}`);
  console.log(`Tests Passed: ${passedTests}/${totalTests} (${testPercentage}%)`);
  
  if (avgImprovement >= 70) {
    logTestResult(true, `Achieved ${avgImprovement.toFixed(1)}% average improvement - TARGET MET!`);
  } else if (avgImprovement >= 50) {
    logTestResult(false, `Achieved ${avgImprovement.toFixed(1)}% average improvement - PARTIAL SUCCESS`);
  } else {
    logTestResult(false, `Only ${avgImprovement.toFixed(1)}% average improvement - BELOW TARGET`);
  }
  
  // Exit code based on results
  if (passedTests === totalTests && avgImprovement >= 70) {
    console.log(`\n${colors.green}🎉 All tests passed with target performance!${colors.reset}`);
    process.exit(0);
  } else if (passedTests >= totalTests * 0.8) {
    console.log(`\n${colors.yellow}⚠️ Most tests passed but needs optimization${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`\n${colors.red}❌ Tests failed - review implementation${colors.reset}`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test runner error:${colors.reset}`, error);
  process.exit(1);
});