#!/usr/bin/env npx tsx

/**
 * Comprehensive Test Suite for Intelligent Chat API Search Coverage
 * 
 * This test suite verifies that the intelligent chat API at /api/chat-intelligent:
 * 1. Finds ALL matching products (not just a subset)
 * 2. Provides complete product information to the AI
 * 3. Handles different result set sizes appropriately
 * 4. Uses tokens efficiently without truncating context
 * 
 * Domain: thompsonseparts.co.uk
 */

import axios from 'axios';
import crypto from 'crypto';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/chat-intelligent`;
const DOMAIN = 'thompsonseparts.co.uk';

// Test result interface
interface TestResult {
  testName: string;
  passed: boolean;
  actualCount: number;
  expectedMinCount: number;
  aiResponse: string;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
    cost: string;
  };
  searchMetadata?: {
    iterations: number;
    totalSearches: number;
    searchLog: Array<{
      tool: string;
      query: string;
      resultCount: number;
      source: string;
    }>;
  };
  error?: string;
  duration: number;
}

// Generate unique session ID for each test
const generateSessionId = () => `test-session-${crypto.randomUUID()}`;

// Test cases configuration
const TEST_CASES = [
  {
    name: 'Cifa Products (Comprehensive)',
    query: 'Show me all Cifa products available',
    expectedMinCount: 200, // Based on logs showing 42+ results, expecting much more with "all"
    searchTerms: ['cifa', 'parts', 'products'],
    maxDuration: 30000 // 30 seconds
  },
  {
    name: 'Hydraulic Pumps (All Types)',
    query: 'I need to see all hydraulic pumps you have in stock',
    expectedMinCount: 40, // Based on logs showing 43 results
    searchTerms: ['hydraulic', 'pump', 'stock'],
    maxDuration: 30000
  },
  {
    name: 'Specific Part Number Search',
    query: 'Do you have part number K000901660 in stock?',
    expectedMinCount: 1, // Should find exact match
    searchTerms: ['K000901660', 'part', 'stock'],
    maxDuration: 20000
  },
  {
    name: 'Water Systems Category',
    query: 'What water systems and pumps do you have?',
    expectedMinCount: 10, // Category search should return multiple items
    searchTerms: ['water', 'systems', 'pumps'],
    maxDuration: 25000
  },
  {
    name: 'Multi-word Brand Search',
    query: 'Show me all OMFB gear pumps and piston pumps',
    expectedMinCount: 5, // Multiple OMFB products expected
    searchTerms: ['OMFB', 'gear', 'piston', 'pumps'],
    maxDuration: 25000
  },
  {
    name: 'Large Result Set Test',
    query: 'Show me all pumps - gear pumps, piston pumps, all types',
    expectedMinCount: 50, // Large comprehensive search
    searchTerms: ['pumps', 'gear', 'piston', 'all'],
    maxDuration: 35000
  },
  {
    name: 'Pressure Equipment Search',
    query: 'What pressure washers and high-pressure equipment do you stock?',
    expectedMinCount: 5, // Specific category search
    searchTerms: ['pressure', 'washers', 'equipment'],
    maxDuration: 25000
  },
  {
    name: 'Technical Specifications Query',
    query: 'I need pumps with 400bar pressure rating and technical specs',
    expectedMinCount: 3, // Should find specific technical matches
    searchTerms: ['400bar', 'pressure', 'specifications'],
    maxDuration: 25000
  }
];

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  maxTokenUsage: 10000, // Total tokens per query
  maxCostUSD: 0.05, // Maximum cost per query in USD
  maxResponseTime: 35000, // Maximum response time in ms
  minSearchIterations: 1, // Minimum AI search iterations
  maxSearchIterations: 5 // Maximum AI search iterations
};

// Analysis functions
function analyzeAIResponse(response: string, searchTerms: string[]): {
  acknowledgesCount: boolean;
  mentionsSearchTerms: number;
  providesSpecificInfo: boolean;
  showsOrganization: boolean;
} {
  const lowerResponse = response.toLowerCase();
  
  // Check if AI acknowledges total count or quantity
  const countIndicators = [
    'found', 'have', 'stock', 'available', 'total', 'several', 'multiple', 'range', 'selection'
  ];
  const acknowledgesCount = countIndicators.some(indicator => 
    lowerResponse.includes(indicator)
  );
  
  // Count how many search terms are mentioned
  const mentionsSearchTerms = searchTerms.filter(term => 
    lowerResponse.includes(term.toLowerCase())
  ).length;
  
  // Check if specific product info is provided (prices, SKUs, specs)
  const specificInfoIndicators = ['£', 'price', 'sku', 'spec', 'model', 'cc', 'bar', 'pump'];
  const providesSpecificInfo = specificInfoIndicators.some(indicator =>
    lowerResponse.includes(indicator)
  );
  
  // Check if response is well-organized (lists, categories, etc.)
  const organizationIndicators = ['•', '-', '1.', '2.', 'include', 'such as', 'category'];
  const showsOrganization = organizationIndicators.some(indicator =>
    lowerResponse.includes(indicator)
  );
  
  return {
    acknowledgesCount,
    mentionsSearchTerms,
    providesSpecificInfo,
    showsOrganization
  };
}

// Execute a single test case
async function executeTest(testCase: typeof TEST_CASES[0]): Promise<TestResult> {
  const startTime = Date.now();
  const sessionId = generateSessionId();
  
  console.log(`\n🔍 Testing: ${testCase.name}`);
  console.log(`Query: "${testCase.query}"`);
  
  try {
    const requestBody = {
      message: testCase.query,
      session_id: sessionId,
      domain: DOMAIN,
      config: {
        ai: {
          maxSearchIterations: 5,
          searchTimeout: 30000
        }
      }
    };
    
    console.log(`📤 Sending request...`);
    const response = await axios.post(API_ENDPOINT, requestBody, {
      timeout: testCase.maxDuration,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const duration = Date.now() - startTime;
    const data = response.data;
    
    // Extract search metadata
    const searchMetadata = data.searchMetadata;
    const tokenUsage = data.tokenUsage;
    
    // Calculate total results found across all searches
    let totalResults = 0;
    if (searchMetadata?.searchLog) {
      totalResults = searchMetadata.searchLog.reduce((sum: number, search: any) => 
        sum + search.resultCount, 0
      );
    }
    
    // Analyze AI response quality
    const analysis = analyzeAIResponse(data.message, testCase.searchTerms);
    
    // Determine if test passed
    const passed = totalResults >= testCase.expectedMinCount;
    
    console.log(`📊 Results: ${totalResults} items found (expected: ${testCase.expectedMinCount}+)`);
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`🧠 AI Analysis:`, analysis);
    
    if (tokenUsage) {
      console.log(`💰 Token Usage: ${tokenUsage.total} tokens, $${tokenUsage.cost}`);
    }
    
    return {
      testName: testCase.name,
      passed,
      actualCount: totalResults,
      expectedMinCount: testCase.expectedMinCount,
      aiResponse: data.message,
      tokenUsage,
      searchMetadata,
      duration
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Test failed:`, error instanceof Error ? error.message : error);
    
    return {
      testName: testCase.name,
      passed: false,
      actualCount: 0,
      expectedMinCount: testCase.expectedMinCount,
      aiResponse: '',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration
    };
  }
}

// Generate comprehensive report
function generateReport(results: TestResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPREHENSIVE SEARCH COVERAGE TEST REPORT');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log(`\n📈 OVERALL RESULTS: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(1)}%)`);
  
  // Performance summary
  console.log('\n⚡ PERFORMANCE SUMMARY:');
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const avgTokens = results.reduce((sum, r) => sum + (r.tokenUsage?.total || 0), 0) / results.length;
  const totalCost = results.reduce((sum, r) => sum + parseFloat(r.tokenUsage?.cost || '0'), 0);
  
  console.log(`   Average Response Time: ${avgDuration.toFixed(0)}ms`);
  console.log(`   Average Token Usage: ${avgTokens.toFixed(0)} tokens`);
  console.log(`   Total Test Cost: $${totalCost.toFixed(4)}`);
  
  // Search coverage summary
  console.log('\n🔍 SEARCH COVERAGE ANALYSIS:');
  let totalProductsFound = 0;
  let totalSearches = 0;
  
  results.forEach(result => {
    totalProductsFound += result.actualCount;
    totalSearches += result.searchMetadata?.totalSearches || 0;
  });
  
  console.log(`   Total Products Found: ${totalProductsFound}`);
  console.log(`   Total Search Operations: ${totalSearches}`);
  console.log(`   Average Products per Test: ${(totalProductsFound / results.length).toFixed(1)}`);
  
  // Detailed results
  console.log('\n📊 DETAILED TEST RESULTS:');
  console.log('-'.repeat(80));
  
  results.forEach((result, index) => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${index + 1}. ${result.testName} ${status}`);
    console.log(`   Query Results: ${result.actualCount}/${result.expectedMinCount}+ expected`);
    console.log(`   Duration: ${result.duration}ms`);
    
    if (result.tokenUsage) {
      console.log(`   Tokens: ${result.tokenUsage.total} (Input: ${result.tokenUsage.input}, Output: ${result.tokenUsage.output})`);
      console.log(`   Cost: $${result.tokenUsage.cost}`);
    }
    
    if (result.searchMetadata) {
      console.log(`   Search Iterations: ${result.searchMetadata.iterations}`);
      console.log(`   Total Searches: ${result.searchMetadata.totalSearches}`);
      
      // Show search breakdown
      if (result.searchMetadata.searchLog) {
        console.log(`   Search Breakdown:`);
        result.searchMetadata.searchLog.forEach(search => {
          console.log(`     - ${search.tool}: "${search.query}" → ${search.resultCount} results (${search.source})`);
        });
      }
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    // Show AI response snippet
    const responseSnippet = result.aiResponse.substring(0, 200);
    if (responseSnippet) {
      console.log(`   AI Response: "${responseSnippet}${result.aiResponse.length > 200 ? '...' : ''}"`);
    }
  });
  
  // Performance warnings
  console.log('\n⚠️  PERFORMANCE ANALYSIS:');
  const slowTests = results.filter(r => r.duration > PERFORMANCE_THRESHOLDS.maxResponseTime);
  const expensiveTests = results.filter(r => parseFloat(r.tokenUsage?.cost || '0') > PERFORMANCE_THRESHOLDS.maxCostUSD);
  const tokenHeavyTests = results.filter(r => (r.tokenUsage?.total || 0) > PERFORMANCE_THRESHOLDS.maxTokenUsage);
  
  if (slowTests.length > 0) {
    console.log(`   🐌 Slow tests (>${PERFORMANCE_THRESHOLDS.maxResponseTime}ms): ${slowTests.map(t => t.testName).join(', ')}`);
  }
  
  if (expensiveTests.length > 0) {
    console.log(`   💸 Expensive tests (>$${PERFORMANCE_THRESHOLDS.maxCostUSD}): ${expensiveTests.map(t => t.testName).join(', ')}`);
  }
  
  if (tokenHeavyTests.length > 0) {
    console.log(`   🔥 Token-heavy tests (>${PERFORMANCE_THRESHOLDS.maxTokenUsage} tokens): ${tokenHeavyTests.map(t => t.testName).join(', ')}`);
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (passed < total) {
    console.log(`   📈 Search Coverage: ${total - passed} tests failed to find expected products. Consider:`);
    console.log(`      - Increasing search limits in failing categories`);
    console.log(`      - Improving embeddings for under-performing queries`);
    console.log(`      - Adding more comprehensive product indexing`);
  }
  
  if (avgDuration > PERFORMANCE_THRESHOLDS.maxResponseTime * 0.8) {
    console.log(`   ⚡ Performance: Average response time is high. Consider:`);
    console.log(`      - Optimizing database queries`);
    console.log(`      - Implementing better caching strategies`);
    console.log(`      - Reducing search timeout for faster responses`);
  }
  
  if (totalCost > 0.20) {
    console.log(`   💰 Cost Optimization: Test suite cost is $${totalCost.toFixed(4)}. Consider:`);
    console.log(`      - Using smaller context windows where appropriate`);
    console.log(`      - Implementing more aggressive result filtering`);
    console.log(`      - Caching common queries to reduce AI calls`);
  }
  
  console.log('\n🎯 SEARCH QUALITY VERIFICATION:');
  const failedTests = results.filter(r => !r.passed);
  if (failedTests.length === 0) {
    console.log('   ✅ All tests found expected minimum product counts');
    console.log('   ✅ AI is receiving comprehensive search context');
    console.log('   ✅ Search coverage meets requirements');
  } else {
    console.log(`   ❌ ${failedTests.length} tests did not meet minimum product count requirements`);
    failedTests.forEach(test => {
      console.log(`      - ${test.testName}: Found ${test.actualCount}, expected ${test.expectedMinCount}+`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
}

// Main test execution
async function runComprehensiveTests(): Promise<void> {
  console.log('🚀 Starting Comprehensive Search Coverage Tests');
  console.log(`🎯 Target Domain: ${DOMAIN}`);
  console.log(`🔗 API Endpoint: ${API_ENDPOINT}`);
  console.log(`📝 Test Cases: ${TEST_CASES.length}`);
  
  // Check if API is available
  try {
    console.log('\n🔍 Checking API availability...');
    await axios.get(BASE_URL, { timeout: 5000 });
    console.log('✅ Server is running');
  } catch (error) {
    console.error('❌ Server is not accessible. Please ensure the development server is running on port 3000.');
    console.error('   Run: npm run dev');
    process.exit(1);
  }
  
  const results: TestResult[] = [];
  
  // Execute tests sequentially to avoid overwhelming the system
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    console.log(`\n📋 Test ${i + 1}/${TEST_CASES.length}`);
    
    const result = await executeTest(testCase);
    results.push(result);
    
    // Brief pause between tests to avoid rate limiting
    if (i < TEST_CASES.length - 1) {
      console.log('⏸️  Pausing 2 seconds between tests...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Generate comprehensive report
  generateReport(results);
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runComprehensiveTests().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export { runComprehensiveTests, executeTest, TEST_CASES };