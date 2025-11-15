#!/usr/bin/env tsx
/**
 * Real-World Conversation Metadata Validation - ORCHESTRATOR
 *
 * This orchestrator runs all metadata validation tests against real database products.
 * Individual tests are in metadata-validation/ directory.
 */

import { queryRealProducts } from './metadata-validation/helpers';
import { testCorrectionTrackingWithRealProducts } from './metadata-validation/correction-tracking.test';
import { testListNavigationWithRealProducts } from './metadata-validation/list-navigation.test';
import { testPronounResolutionWithRealData } from './metadata-validation/pronoun-resolution.test';
import { testMultipleCorrectionsWithRealProducts } from './metadata-validation/multiple-corrections.test';
import { testProductUrlExtractionAccuracy } from './metadata-validation/url-extraction.test';
import { TestResult } from './metadata-validation/types';

const results: TestResult[] = [];

/**
 * Print final report
 */
function printFinalReport(): void {
  console.log('\n');
  console.log('═'.repeat(70));
  console.log('📊 REAL-WORLD VALIDATION REPORT');
  console.log('═'.repeat(70));

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const accuracy = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : '0.0';

  console.log(`\n📈 Overall Results:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} ✅`);
  console.log(`   Failed: ${failedTests} ❌`);
  console.log(`   Accuracy: ${accuracy}%`);

  console.log(`\n📋 Test Details:\n`);

  results.forEach((result, idx) => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${idx + 1}. ${result.testName}: ${status}`);
    console.log(`   Details: ${result.details}`);
    console.log(`   Products Used: ${result.productsUsed.join(', ')}`);
    console.log('');
  });

  console.log('═'.repeat(70));

  if (failedTests > 0) {
    console.log('\n⚠️  RECOMMENDATION: Fix failures before claiming 100% accuracy');
  } else {
    console.log('\n✅ All tests passed with real database products!');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Real-World Metadata Validation');
  console.log('=' .repeat(60));

  // Query real products
  const products = await queryRealProducts('thompsonseparts.co.uk', 10);

  if (products.length === 0) {
    console.error('\n❌ FATAL: No products found. Cannot proceed with tests.');
    console.error('   Ensure database has scraped products for thompsonseparts.co.uk');
    process.exit(1);
  }

  // Run all tests
  results.push(await testCorrectionTrackingWithRealProducts(products));
  results.push(await testListNavigationWithRealProducts(products));
  results.push(await testPronounResolutionWithRealData(products));
  results.push(await testMultipleCorrectionsWithRealProducts(products));
  results.push(await testProductUrlExtractionAccuracy(products));

  // Print final report
  printFinalReport();

  process.exit(0);
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
