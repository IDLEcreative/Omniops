/**
 * Comprehensive Integration Test for All 25 WooCommerce Operations
 *
 * Purpose: Verify that all WooCommerce operations are properly connected
 * end-to-end through the chat system and function correctly.
 *
 * Test Categories:
 * - 10 Product Operations
 * - 6 Order Operations
 * - 5 Cart Operations
 * - 3 Store Configuration Operations
 * - 1 Analytics Operation
 *
 * Usage: npx tsx test-all-woocommerce-operations.ts
 */

import { runProductOperations } from './tests/product-operations.test';
import { runOrderOperations } from './tests/order-operations.test';
import { runCartOperations } from './tests/cart-operations.test';
import { runStoreOperations, runAnalyticsOperations } from './tests/store-operations.test';
import { printSummary } from './tests/summary';
import type { TestResult } from './tests/types';

const DOMAIN = 'thompsonseparts.co.uk';

/**
 * Main test orchestrator
 */
async function runAllTests() {
  console.log('='.repeat(80));
  console.log('COMPREHENSIVE WOOCOMMERCE INTEGRATION TEST');
  console.log('Testing all 25 operations end-to-end');
  console.log('='.repeat(80));

  const results: TestResult[] = [];
  const startTime = Date.now();

  // Run all test categories
  results.push(...await runProductOperations(DOMAIN));
  results.push(...await runOrderOperations(DOMAIN));
  results.push(...await runCartOperations(DOMAIN));
  results.push(...await runStoreOperations(DOMAIN));
  results.push(...await runAnalyticsOperations(DOMAIN));

  // Print summary
  const totalTime = Date.now() - startTime;
  printSummary(results, totalTime);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});
