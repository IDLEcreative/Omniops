/**
 * MAKER Framework - Demo Script
 *
 * @purpose Demonstrate MAKER framework with simulated examples
 *
 * @flow
 *   1. Display MAKER overview
 *   2. → Run test scenarios
 *   3. → Show reliability analysis
 *   4. → Print key insights
 *
 * @keyFunctions
 *   - demo (line 40): Main demo function
 *
 * @handles
 *   - Simple task demonstration
 *   - Medium task demonstration
 *   - Reliability analysis
 *   - Scalability analysis
 *   - Key insights display
 *
 * @returns Promise<void>
 *
 * @dependencies
 *   - ./voting-v2-complete.ts (runMAKER)
 *   - ./reliability-metrics.ts (compareReliability)
 *
 * @consumers
 *   - Manual execution for demonstration
 *
 * @totalLines 135
 * @estimatedTokens 520 (without header), 620 (with header - 16% savings)
 */

import { runMAKER } from './voting-v2-complete';
import { compareReliability } from './reliability-metrics';

export async function demo() {
  console.log('================================================================================');
  console.log('MAKER FRAMEWORK v2 - COMPLETE IMPLEMENTATION');
  console.log('================================================================================');
  console.log('\nBased on arXiv:2511.09030 "Solving a Million-Step LLM Task with Zero Errors"');
  console.log('\nComponents:');
  console.log('1. Extreme decomposition (atomic microagent tasks)');
  console.log('2. SPRT-based voting (first-to-ahead-by-K)');
  console.log('3. Red-flagging (structural error detection)');
  console.log('\n================================================================================\n');

  // Test 1: Simple task (import cleanup)
  console.log('TEST 1: Simple Task - Remove Unused Import');
  console.log('--------------------------------------------------------------------------------');

  const result1 = await runMAKER(
    'remove-import-line-12',
    'Remove the unused import statement on line 12 of app/api/chat/route.ts',
    'simple'
  );

  // Test 2: Medium task (type extraction)
  console.log('\n\nTEST 2: Medium Task - Extract Type Definition');
  console.log('--------------------------------------------------------------------------------');

  const result2 = await runMAKER(
    'extract-type-ChatMessage',
    'Extract ChatMessage type definition to types/chat.ts',
    'medium'
  );

  // Test 3: Reliability analysis
  console.log('\n\n================================================================================');
  console.log('RELIABILITY ANALYSIS');
  console.log('================================================================================\n');

  console.log('Scenario: Import cleanup across 16 imports (16 microagent tasks)\n');

  const comparison = compareReliability(
    0.95,   // Base Haiku accuracy: 95%
    0.993,  // After 3-attempt voting: 99.3%
    16      // Total microagent tasks
  );

  console.log('WITHOUT MAKER (Single Haiku attempt):');
  console.log(`  Per-step accuracy: ${(comparison.traditional.per_step_accuracy * 100).toFixed(1)}%`);
  console.log(`  Error rate: ${(comparison.traditional.error_rate * 100).toFixed(1)}%`);
  console.log(`  Success over 16 steps: ${(comparison.traditional.predicted_success_rate * 100).toFixed(1)}%`);
  console.log(`  Confidence interval: ${(comparison.traditional.confidence_interval[0] * 100).toFixed(1)}% - ${(comparison.traditional.confidence_interval[1] * 100).toFixed(1)}%`);

  console.log('\nWITH MAKER (3-attempt voting + red-flagging):');
  console.log(`  Per-step accuracy: ${(comparison.maker.per_step_accuracy * 100).toFixed(1)}%`);
  console.log(`  Error rate: ${(comparison.maker.error_rate * 100).toFixed(1)}%`);
  console.log(`  Success over 16 steps: ${(comparison.maker.predicted_success_rate * 100).toFixed(1)}%`);
  console.log(`  Confidence interval: ${(comparison.maker.confidence_interval[0] * 100).toFixed(1)}% - ${(comparison.maker.confidence_interval[1] * 100).toFixed(1)}%`);

  console.log(`\nIMPROVEMENT: ${comparison.improvement_percentage.toFixed(0)}% more reliable\n`);

  // Scale analysis
  console.log('SCALABILITY ANALYSIS:\n');

  const scales = [10, 50, 100, 500, 1000];
  console.log('Steps | Without MAKER | With MAKER | Improvement');
  console.log('------|---------------|------------|------------');

  for (const steps of scales) {
    const comp = compareReliability(0.95, 0.993, steps);
    console.log(
      `${steps.toString().padEnd(5)} | ` +
      `${(comp.traditional.predicted_success_rate * 100).toFixed(1)}%`.padEnd(13) + ' | ' +
      `${(comp.maker.predicted_success_rate * 100).toFixed(1)}%`.padEnd(10) + ' | ' +
      `${comp.improvement_percentage.toFixed(0)}%`
    );
  }

  console.log('\n================================================================================');
  console.log('KEY INSIGHTS FROM PAPER');
  console.log('================================================================================\n');

  console.log('1. ERROR ACCUMULATION PROBLEM:');
  console.log('   - 95% accuracy per step = 0.6% success over 100 steps (catastrophic!)');
  console.log('   - Traditional AI fails after ~100-200 steps due to error compounding\n');

  console.log('2. MAKER SOLUTION:');
  console.log('   - Voting improves accuracy: 95% → 99.3% (14× fewer errors)');
  console.log('   - Red-flagging prevents correlated errors (40% reduction)');
  console.log('   - Combined: 99.9%+ accuracy enables 1M+ step tasks\n');

  console.log('3. MODEL SELECTION INSIGHT:');
  console.log('   - Small models (Haiku, gpt-4o-mini) beat expensive reasoning models');
  console.log('   - For atomic tasks, reasoning ability doesn\'t matter');
  console.log('   - Pattern matching + voting > expensive reasoning\n');

  console.log('4. SCALABILITY:');
  console.log('   - Paper achieved 1,048,575 steps with ZERO errors');
  console.log('   - First demonstration of million-step AI reliability');
  console.log('   - Unlocks long-sequence reasoning previously impossible\n');

  console.log('================================================================================\n');
}

// Run demo
if (require.main === module) {
  demo().catch(console.error);
}
