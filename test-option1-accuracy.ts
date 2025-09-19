#!/usr/bin/env npx tsx

/**
 * Comprehensive Test Suite for Option 1 Full Visibility Implementation
 * 
 * This test suite verifies the AI's ability to:
 * - Report accurate total counts for various product queries
 * - Show category/brand breakdowns when available
 * - Handle follow-up filtering without re-searching
 * - Maintain performance under different query types
 * 
 * Expected Database Stats (thompsonseparts.co.uk):
 * - Total pages: 4,491
 * - Cifa products: 209
 * - Pump products: 95
 * - Product pages: 4,448
 */

import { performance } from 'perf_hooks';

// Configuration
const API_ENDPOINT = 'http://localhost:3001/api/chat-intelligent';
const DOMAIN = 'thompsonseparts.co.uk';
const SESSION_ID = `test-accuracy-${Date.now()}`;

// Expected counts from database analysis
const EXPECTED_COUNTS = {
  TOTAL_PAGES: 4491,
  CIFA_PRODUCTS: 209,
  PUMP_PRODUCTS: 95,
  PRODUCT_PAGES: 4448,
  CATEGORIES: {
    'lighting': 26,
    'pumps-ptos-switches': 14,
    'cifa-truck-mixer-parts': 12
  }
};

interface TestResult {
  testName: string;
  query: string;
  passed: boolean;
  responseTime: number;
  expectedCount?: number;
  reportedCount?: number;
  hasCategories?: boolean;
  hasBrands?: boolean;
  aiResponse: string;
  metadata?: any;
  errors?: string[];
}

interface TestMetrics {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageResponseTime: number;
  totalTokensUsed?: number;
  accuracyRate: number;
}

class Option1AccuracyTester {
  private results: TestResult[] = [];
  private conversationId: string | null = null;

  async runTest(testName: string, query: string, validator: (response: any) => TestResult): Promise<TestResult> {
    console.log(`\n🧪 Running Test: ${testName}`);
    console.log(`   Query: "${query}"`);
    
    const startTime = performance.now();
    
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          conversation_id: this.conversationId,
          session_id: SESSION_ID,
          domain: DOMAIN,
          config: {
            ai: {
              maxSearchIterations: 2,
              searchTimeout: 10000
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // Store conversation ID for follow-up tests
      if (!this.conversationId && data.conversation_id) {
        this.conversationId = data.conversation_id;
      }

      // Run the validator
      const result = validator({
        ...data,
        responseTime,
        testName,
        query
      });

      console.log(`   ✅ Response Time: ${responseTime.toFixed(0)}ms`);
      console.log(`   📊 Result: ${result.passed ? 'PASS' : 'FAIL'}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log(`   ❌ Errors: ${result.errors.join(', ')}`);
      }

      this.results.push(result);
      return result;

    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      const result: TestResult = {
        testName,
        query,
        passed: false,
        responseTime,
        aiResponse: '',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };

      console.log(`   ❌ Test Failed: ${result.errors?.[0]}`);
      this.results.push(result);
      return result;
    }
  }

  // Test 1: Total product count accuracy
  async testTotalProductCount(): Promise<TestResult> {
    return this.runTest(
      'Total Product Count',
      'How many total products do you have?',
      (response) => {
        const errors: string[] = [];
        let reportedCount: number | undefined;
        
        // Look for numbers in the response that might indicate total count
        const numbers = response.message.match(/\b\d{1,4}(?:,\d{3})*\b/g);
        const potentialCounts = numbers?.map(n => parseInt(n.replace(/,/g, ''))) || [];
        
        // Check if any number is close to our expected total (within 10%)
        const expectedRange = {
          min: EXPECTED_COUNTS.TOTAL_PAGES * 0.9,
          max: EXPECTED_COUNTS.TOTAL_PAGES * 1.1
        };
        
        reportedCount = potentialCounts.find(count => 
          count >= expectedRange.min && count <= expectedRange.max
        );
        
        if (!reportedCount) {
          errors.push(`No accurate total count found. Expected ~${EXPECTED_COUNTS.TOTAL_PAGES}, found: ${potentialCounts.join(', ')}`);
        }
        
        // Check if response indicates comprehensive search
        const hasComprehensiveIndicators = [
          'total', 'all', 'entire', 'complete', 'comprehensive'
        ].some(word => response.message.toLowerCase().includes(word));
        
        if (!hasComprehensiveIndicators) {
          errors.push('Response does not indicate comprehensive product visibility');
        }

        return {
          testName: 'Total Product Count',
          query: 'How many total products do you have?',
          passed: errors.length === 0,
          responseTime: response.responseTime,
          expectedCount: EXPECTED_COUNTS.TOTAL_PAGES,
          reportedCount,
          aiResponse: response.message,
          metadata: response.metadata,
          errors: errors.length > 0 ? errors : undefined
        };
      }
    );
  }

  // Test 2: Specific brand count (Cifa products)
  async testCifaProductCount(): Promise<TestResult> {
    return this.runTest(
      'Cifa Product Count',
      'Show me all Cifa products',
      (response) => {
        const errors: string[] = [];
        let reportedCount: number | undefined;
        
        // Look for specific count mentions
        const numbers = response.message.match(/\b\d{1,3}\b/g);
        const potentialCounts = numbers?.map(n => parseInt(n)) || [];
        
        // Expected count is 209, allow 10% variance
        const expectedRange = {
          min: EXPECTED_COUNTS.CIFA_PRODUCTS * 0.9,
          max: EXPECTED_COUNTS.CIFA_PRODUCTS * 1.1
        };
        
        reportedCount = potentialCounts.find(count => 
          count >= expectedRange.min && count <= expectedRange.max
        );
        
        if (!reportedCount) {
          errors.push(`Cifa count inaccurate. Expected ~${EXPECTED_COUNTS.CIFA_PRODUCTS}, found: ${potentialCounts.join(', ')}`);
        }
        
        // Check if response mentions specific Cifa products
        const mentionsCifaProducts = response.message.toLowerCase().includes('cifa');
        if (!mentionsCifaProducts) {
          errors.push('Response does not mention Cifa products specifically');
        }

        return {
          testName: 'Cifa Product Count',
          query: 'Show me all Cifa products',
          passed: errors.length === 0,
          responseTime: response.responseTime,
          expectedCount: EXPECTED_COUNTS.CIFA_PRODUCTS,
          reportedCount,
          aiResponse: response.message,
          metadata: response.metadata,
          errors: errors.length > 0 ? errors : undefined
        };
      }
    );
  }

  // Test 3: Category breakdown visibility
  async testCategoryBreakdown(): Promise<TestResult> {
    return this.runTest(
      'Category Breakdown',
      'What categories of products exist?',
      (response) => {
        const errors: string[] = [];
        
        // Check for category mentions
        const knownCategories = ['lighting', 'pumps', 'electrical', 'hydraulic', 'cifa'];
        const foundCategories = knownCategories.filter(cat => 
          response.message.toLowerCase().includes(cat)
        );
        
        if (foundCategories.length < 3) {
          errors.push(`Insufficient category breakdown. Found: ${foundCategories.join(', ')}`);
        }
        
        // Check for count indicators with categories
        const hasCategoryCounts = /\w+.*?\(\d+\)|\w+.*?:\s*\d+/.test(response.message);
        
        return {
          testName: 'Category Breakdown',
          query: 'What categories of products exist?',
          passed: errors.length === 0,
          responseTime: response.responseTime,
          hasCategories: foundCategories.length >= 3,
          aiResponse: response.message,
          metadata: response.metadata,
          errors: errors.length > 0 ? errors : undefined
        };
      }
    );
  }

  // Test 4: Follow-up filtering (should not re-search)
  async testFollowupFiltering(): Promise<TestResult> {
    // First, do an initial search
    await this.runTest(
      'Initial Search for Filtering Test',
      'List all pumps',
      () => ({ testName: '', query: '', passed: true, responseTime: 0, aiResponse: '' })
    );

    // Then ask for filtering
    return this.runTest(
      'Follow-up Filtering',
      'Which ones are over £500?',
      (response) => {
        const errors: string[] = [];
        
        // Check if response indicates filtering from existing results
        const filteringIndicators = [
          'from the', 'from those', 'of these', 'among the', 'filtering'
        ];
        
        const hasFilteringLanguage = filteringIndicators.some(indicator => 
          response.message.toLowerCase().includes(indicator)
        );
        
        // Check response time - should be faster if not re-searching
        if (response.responseTime > 5000) {
          errors.push('Response too slow for filtering (suggests re-search)');
        }
        
        // Check if mentions price filtering
        const mentionsPrice = /£|price|cost|over.*\d+/.test(response.message.toLowerCase());
        if (!mentionsPrice) {
          errors.push('Response does not address price filtering');
        }

        return {
          testName: 'Follow-up Filtering',
          query: 'Which ones are over £500?',
          passed: errors.length === 0,
          responseTime: response.responseTime,
          aiResponse: response.message,
          metadata: response.metadata,
          errors: errors.length > 0 ? errors : undefined
        };
      }
    );
  }

  // Test 5: Performance with large result set
  async testLargeResultPerformance(): Promise<TestResult> {
    return this.runTest(
      'Large Result Performance',
      'Show me all available products',
      (response) => {
        const errors: string[] = [];
        
        // Should complete within reasonable time
        if (response.responseTime > 15000) {
          errors.push(`Too slow for large dataset: ${response.responseTime.toFixed(0)}ms`);
        }
        
        // Should indicate large number of results
        const numbers = response.message.match(/\b\d{1,4}(?:,\d{3})*\b/g);
        const hasLargeNumber = numbers?.some(n => parseInt(n.replace(/,/g, '')) > 1000);
        
        if (!hasLargeNumber) {
          errors.push('Does not indicate large result set');
        }

        return {
          testName: 'Large Result Performance',
          query: 'Show me all available products',
          passed: errors.length === 0,
          responseTime: response.responseTime,
          aiResponse: response.message,
          metadata: response.metadata,
          errors: errors.length > 0 ? errors : undefined
        };
      }
    );
  }

  // Test 6: Empty result handling
  async testEmptyResults(): Promise<TestResult> {
    return this.runTest(
      'Empty Result Handling',
      'Do you have any zxyzkhjweruht products?',
      (response) => {
        const errors: string[] = [];
        
        // Should clearly indicate no results
        const noResultsIndicators = [
          'no', 'not', 'none', 'don\'t have', 'unavailable', 'not found'
        ];
        
        const indicatesNoResults = noResultsIndicators.some(indicator => 
          response.message.toLowerCase().includes(indicator)
        );
        
        if (!indicatesNoResults) {
          errors.push('Does not clearly indicate empty results');
        }
        
        // Should be fast
        if (response.responseTime > 8000) {
          errors.push('Too slow for empty result');
        }

        return {
          testName: 'Empty Result Handling',
          query: 'Do you have any zxyzkhjweruht products?',
          passed: errors.length === 0,
          responseTime: response.responseTime,
          aiResponse: response.message,
          metadata: response.metadata,
          errors: errors.length > 0 ? errors : undefined
        };
      }
    );
  }

  // Test 7: Single result precision
  async testSingleResult(): Promise<TestResult> {
    return this.runTest(
      'Single Result Precision',
      'Tell me about the CIFA Mixer Filter Housing Assembly',
      (response) => {
        const errors: string[] = [];
        
        // Should mention the specific product
        if (!response.message.toLowerCase().includes('filter housing')) {
          errors.push('Does not mention specific product');
        }
        
        // Should provide detailed information
        if (response.message.length < 100) {
          errors.push('Response too brief for single product');
        }

        return {
          testName: 'Single Result Precision',
          query: 'Tell me about the CIFA Mixer Filter Housing Assembly',
          passed: errors.length === 0,
          responseTime: response.responseTime,
          aiResponse: response.message,
          metadata: response.metadata,
          errors: errors.length > 0 ? errors : undefined
        };
      }
    );
  }

  async runAllTests(): Promise<TestMetrics> {
    console.log('🚀 Starting Option 1 Full Visibility Accuracy Tests');
    console.log(`📍 Testing against: ${API_ENDPOINT}`);
    console.log(`🏢 Domain: ${DOMAIN}`);
    console.log(`📊 Expected DB Stats: ${JSON.stringify(EXPECTED_COUNTS, null, 2)}`);
    console.log('=' * 80);

    // Run all tests
    await this.testTotalProductCount();
    await this.testCifaProductCount();
    await this.testCategoryBreakdown();
    await this.testFollowupFiltering();
    await this.testLargeResultPerformance();
    await this.testEmptyResults();
    await this.testSingleResult();

    // Calculate metrics
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    const averageResponseTime = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;
    const accuracyRate = (passedTests / totalTests) * 100;

    const metrics: TestMetrics = {
      totalTests,
      passedTests,
      failedTests,
      averageResponseTime,
      accuracyRate
    };

    return metrics;
  }

  generateReport(metrics: TestMetrics): string {
    let report = '\n\n';
    report += '🎯 OPTION 1 FULL VISIBILITY ACCURACY TEST REPORT\n';
    report += '=' * 60 + '\n\n';

    // Summary
    report += '📊 TEST SUMMARY:\n';
    report += `   Total Tests: ${metrics.totalTests}\n`;
    report += `   Passed: ${metrics.passedTests} ✅\n`;
    report += `   Failed: ${metrics.failedTests} ❌\n`;
    report += `   Accuracy Rate: ${metrics.accuracyRate.toFixed(1)}%\n`;
    report += `   Average Response Time: ${metrics.averageResponseTime.toFixed(0)}ms\n\n`;

    // Detailed results
    report += '📋 DETAILED RESULTS:\n';
    report += '-' * 40 + '\n';

    this.results.forEach((result, index) => {
      report += `\n${index + 1}. ${result.testName}\n`;
      report += `   Query: "${result.query}"\n`;
      report += `   Status: ${result.passed ? '✅ PASS' : '❌ FAIL'}\n`;
      report += `   Response Time: ${result.responseTime.toFixed(0)}ms\n`;
      
      if (result.expectedCount && result.reportedCount) {
        report += `   Expected Count: ${result.expectedCount}\n`;
        report += `   Reported Count: ${result.reportedCount}\n`;
        const accuracy = ((1 - Math.abs(result.expectedCount - result.reportedCount) / result.expectedCount) * 100);
        report += `   Count Accuracy: ${accuracy.toFixed(1)}%\n`;
      }
      
      if (result.hasCategories !== undefined) {
        report += `   Has Categories: ${result.hasCategories ? 'Yes' : 'No'}\n`;
      }
      
      if (result.errors) {
        report += `   Errors: ${result.errors.join('; ')}\n`;
      }
      
      report += `   AI Response: "${result.aiResponse.substring(0, 150)}${result.aiResponse.length > 150 ? '...' : ''}"\n`;
    });

    // Performance analysis
    report += '\n\n🚀 PERFORMANCE ANALYSIS:\n';
    report += '-' * 30 + '\n';
    
    const fastTests = this.results.filter(r => r.responseTime < 5000).length;
    const mediumTests = this.results.filter(r => r.responseTime >= 5000 && r.responseTime < 10000).length;
    const slowTests = this.results.filter(r => r.responseTime >= 10000).length;
    
    report += `   Fast (< 5s): ${fastTests} tests\n`;
    report += `   Medium (5-10s): ${mediumTests} tests\n`;
    report += `   Slow (> 10s): ${slowTests} tests\n`;

    // Key findings
    report += '\n\n🔍 KEY FINDINGS:\n';
    report += '-' * 20 + '\n';

    if (metrics.accuracyRate >= 85) {
      report += '   ✅ Option 1 implementation shows high accuracy\n';
    } else {
      report += '   ⚠️  Option 1 implementation needs improvement\n';
    }

    if (metrics.averageResponseTime < 8000) {
      report += '   ✅ Response times are acceptable\n';
    } else {
      report += '   ⚠️  Response times may be too slow\n';
    }

    const countTests = this.results.filter(r => r.expectedCount && r.reportedCount);
    if (countTests.length > 0) {
      const avgCountAccuracy = countTests.reduce((sum, r) => {
        const accuracy = 1 - Math.abs(r.expectedCount! - r.reportedCount!) / r.expectedCount!;
        return sum + accuracy;
      }, 0) / countTests.length * 100;
      
      if (avgCountAccuracy >= 90) {
        report += '   ✅ Count accuracy is excellent\n';
      } else {
        report += '   ⚠️  Count accuracy needs improvement\n';
      }
    }

    // Recommendations
    report += '\n\n💡 RECOMMENDATIONS:\n';
    report += '-' * 20 + '\n';

    if (metrics.accuracyRate < 80) {
      report += '   • Review search overview implementation\n';
      report += '   • Improve total count reporting\n';
    }

    if (metrics.averageResponseTime > 10000) {
      report += '   • Optimize search performance\n';
      report += '   • Consider caching strategies\n';
    }

    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      report += '   • Address specific test failures:\n';
      failedTests.forEach(test => {
        report += `     - ${test.testName}: ${test.errors?.[0] || 'Unknown error'}\n`;
      });
    }

    report += '\n' + '=' * 60 + '\n';

    return report;
  }
}

// Main execution
async function main() {
  const tester = new Option1AccuracyTester();
  
  try {
    const metrics = await tester.runAllTests();
    const report = tester.generateReport(metrics);
    
    console.log(report);
    
    // Write report to file
    const fs = await import('fs');
    const reportPath = '/Users/jamesguy/Omniops/test-results-option1-accuracy.txt';
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(metrics.accuracyRate >= 80 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { Option1AccuracyTester, TestResult, TestMetrics };