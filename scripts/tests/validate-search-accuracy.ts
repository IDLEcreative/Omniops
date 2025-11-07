#!/usr/bin/env tsx
/**
 * COMPREHENSIVE SEARCH ACCURACY VALIDATION
 *
 * Simulates real user queries and validates:
 * 1. Result limits are honored (not capped at 5, 10, or 20)
 * 2. Zero-results recovery activates and works
 * 3. Search consistently returns results for common queries
 * 4. Edge cases are handled properly
 */

import { DEFAULT_SEARCH_LIMIT } from '@/lib/embeddings/constants';
import { log, logHeader, printSummary, printDetailedResults, printPerformanceMetrics, type TestResult } from './lib/test-utils';
import { runSearchTest, runRecoveryTest, runConsistencyTest } from './lib/search-test-runner';
import { runVerificationChecklist, printFinalVerdict } from './lib/search-verification';

const TEST_DOMAIN = process.env.TEST_DOMAIN || 'thompsonseparts.co.uk';
const results: TestResult[] = [];

async function main() {
  console.log('\n');
  log('cyan', '╔════════════════════════════════════════════════════════════════════════════╗');
  log('cyan', '║                SEARCH ACCURACY VALIDATION - SIMULATION TESTS                ║');
  log('cyan', '╚════════════════════════════════════════════════════════════════════════════╝');

  log('blue', `\nTest Domain: ${TEST_DOMAIN}`);
  log('blue', `DEFAULT_SEARCH_LIMIT: ${DEFAULT_SEARCH_LIMIT}`);

  // ============================================================================
  // TEST SUITE 1: Result Limit Improvements
  // ============================================================================
  logHeader('TEST SUITE 1: Result Limit Improvements');
  log('yellow', 'Goal: Verify we get >20 results (proving limits are fixed)');

  results.push(await runSearchTest(
    'Generic Product Query',
    'products',
    30,
    TEST_DOMAIN,
    'Should return >30 results if catalog has sufficient content'
  ));

  results.push(await runSearchTest(
    'Single-Word Category',
    'parts',
    20,
    TEST_DOMAIN,
    'Keyword search should return up to 200 results, we expect ≥20'
  ));

  results.push(await runSearchTest(
    'Two-Word Query',
    'hydraulic pump',
    15,
    TEST_DOMAIN,
    'Should use keyword search (short query), expect ≥15 results'
  ));

  results.push(await runSearchTest(
    'Detailed Query (4 words)',
    'hydraulic pump for concrete',
    10,
    TEST_DOMAIN,
    'Should get 100 limit (increased from 50)'
  ));

  results.push(await runSearchTest(
    'Very Detailed Query (7 words)',
    'hydraulic pump for concrete mixer under 2000',
    5,
    TEST_DOMAIN,
    'Should still get 100 limit (previously was 50)'
  ));

  // ============================================================================
  // TEST SUITE 2: Zero-Results Recovery
  // ============================================================================
  logHeader('TEST SUITE 2: Zero-Results Recovery System');
  log('yellow', 'Goal: Verify recovery activates and finds results');

  results.push(await runRecoveryTest(
    'Over-Constrained Query',
    'red leather safety gloves size 10 model XYZ',
    true,
    TEST_DOMAIN
  ));

  results.push(await runRecoveryTest(
    'Potential Typo',
    'hydralic pmup',
    true,
    TEST_DOMAIN
  ));

  results.push(await runRecoveryTest(
    'Nonexistent Product',
    'quantum teleporter flux capacitor',
    false,
    TEST_DOMAIN
  ));

  // ============================================================================
  // TEST SUITE 3: Edge Cases
  // ============================================================================
  logHeader('TEST SUITE 3: Edge Cases & Ambiguous Queries');
  log('yellow', 'Goal: Verify system handles edge cases gracefully');

  results.push(await runSearchTest(
    'Single Character Query',
    'a',
    0,
    TEST_DOMAIN,
    'Too generic, may return few or no results - should not crash'
  ));

  results.push(await runSearchTest(
    'Special Characters',
    'A4VTG-90',
    0,
    TEST_DOMAIN,
    'SKU-like query with special characters - should handle gracefully'
  ));

  results.push(await runSearchTest(
    'Very Short Query',
    'hp',
    0,
    TEST_DOMAIN,
    'Ambiguous abbreviation - may return few results'
  ));

  results.push(await runSearchTest(
    'Query with Common Words',
    'show me all the products for sale',
    5,
    TEST_DOMAIN,
    'Should filter out common words and find products'
  ));

  // ============================================================================
  // TEST SUITE 4: Consistency Check
  // ============================================================================
  logHeader('TEST SUITE 4: Consistency Check');
  log('yellow', 'Goal: Verify same query returns results consistently (3 attempts)');

  results.push(await runConsistencyTest('equipment', TEST_DOMAIN, 3));

  // ============================================================================
  // RESULTS & VERIFICATION
  // ============================================================================
  printSummary(results);
  printDetailedResults(results);
  printPerformanceMetrics(results);

  const checks = runVerificationChecklist(results);
  printFinalVerdict(results, checks);
}

main().catch(error => {
  log('red', `\n❌ FATAL ERROR: ${error}`);
  console.error(error);
  process.exit(1);
});
