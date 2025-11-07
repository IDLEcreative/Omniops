#!/usr/bin/env tsx
/**
 * CHAT PROMPT DECISION TREE VALIDATION
 *
 * Tests that the updated chat prompts correctly trigger searches
 * for various query types, including edge cases
 */

import { log, logHeader } from './lib/test-utils';
import { testCases } from './lib/prompt-test-cases';
import { analyzePromptFile, runPromptTests, printCategoryBreakdown } from './lib/prompt-test-runner';

async function main() {
  console.log('\n');
  log('cyan', '╔════════════════════════════════════════════════════════════════════════════╗');
  log('cyan', '║              CHAT PROMPT IMPROVEMENTS - VALIDATION TESTS                     ║');
  log('cyan', '╚════════════════════════════════════════════════════════════════════════════╝');

  // ============================================================================
  // PROMPT ANALYSIS
  // ============================================================================
  logHeader('PROMPT ANALYSIS');

  const analysis = analyzePromptFile();

  console.log('Checking for required prompt improvements:');
  log(analysis.hasDecisionTree ? 'green' : 'red', `${analysis.hasDecisionTree ? '✅' : '❌'} Decision Tree present`);
  log(analysis.hasCriticalRule ? 'green' : 'red', `${analysis.hasCriticalRule ? '✅' : '❌'} "DEFAULT TO SEARCHING" rule present`);
  log(analysis.hasReformulation ? 'green' : 'red', `${analysis.hasReformulation ? '✅' : '❌'} Query reformulation guidance present`);
  log(analysis.hasAntiHallucination ? 'green' : 'red', `${analysis.hasAntiHallucination ? '✅' : '❌'} Anti-hallucination connected to search`);

  console.log('\nSearch Triggers Documented:');
  analysis.searchTriggers.forEach(trigger => {
    log('blue', `  • ${trigger}`);
  });

  // ============================================================================
  // QUERY CLASSIFICATION TESTS
  // ============================================================================
  logHeader('QUERY CLASSIFICATION TESTS');

  log('yellow', 'Testing if queries would trigger search based on decision tree...');

  const results = runPromptTests(testCases);

  // ============================================================================
  // CATEGORY BREAKDOWN
  // ============================================================================
  logHeader('CATEGORY BREAKDOWN');

  printCategoryBreakdown(testCases, results);

  // ============================================================================
  // RESULTS SUMMARY
  // ============================================================================
  logHeader('TEST RESULTS SUMMARY');

  const totalTests = testCases.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`Total Test Cases: ${totalTests}`);
  log('green', `Passed: ${passedTests}`);
  if (failedTests > 0) {
    log('red', `Failed: ${failedTests}`);
  } else {
    log('green', `Failed: ${failedTests}`);
  }
  log('cyan', `Pass Rate: ${passRate}%`);

  // ============================================================================
  // FINAL VERDICT
  // ============================================================================
  logHeader('FINAL VERDICT');

  const allPromptFeatures = analysis.hasDecisionTree && analysis.hasCriticalRule &&
                            analysis.hasReformulation && analysis.hasAntiHallucination;
  const highPassRate = passedTests / totalTests >= 0.85;

  if (allPromptFeatures && highPassRate) {
    log('green', '✅ PROMPT VALIDATION SUCCESSFUL');
    log('green', 'Chat prompt improvements are comprehensive and cover all test cases.');
    process.exit(0);
  } else if (highPassRate) {
    log('yellow', '⚠️  PROMPT VALIDATION PARTIAL');
    log('yellow', 'Most test cases pass, but some prompt features may be missing.');
    process.exit(1);
  } else {
    log('red', '❌ PROMPT VALIDATION FAILED');
    log('red', 'Prompt improvements need attention. Several test cases failed.');
    process.exit(1);
  }
}

main().catch(error => {
  log('red', `\n❌ FATAL ERROR: ${error}`);
  console.error(error);
  process.exit(1);
});
