/**
 * Test Runner for Conversation Competency Tests
 */

import { TestCase, CompetencyReport, BASELINE_SCORES, TARGET_SCORES } from './types';

export async function runTests(testCases: TestCase[]): Promise<CompetencyReport> {
  console.log('🧪 CONVERSATION COMPETENCY TEST SUITE');
  console.log('=' .repeat(80));
  console.log(`Baseline Accuracy: ${BASELINE_SCORES.overallAccuracy}%`);
  console.log(`Target Accuracy: ${TARGET_SCORES.overallAccuracy}%`);
  console.log('=' .repeat(80));
  console.log();

  const results = {
    correction: { passed: 0, total: 0 },
    list_reference: { passed: 0, total: 0 },
    pronoun: { passed: 0, total: 0 }
  };

  let totalPassed = 0;
  let totalFailed = 0;

  for (const testCase of testCases) {
    try {
      await testCase.setup();
      const passed = await testCase.execute();

      results[testCase.category].total++;

      if (passed) {
        results[testCase.category].passed++;
        totalPassed++;
        console.log(`✅ ${testCase.name}`);
      } else {
        totalFailed++;
        console.log(`❌ ${testCase.name}`);
      }
    } catch (error) {
      totalFailed++;
      results[testCase.category].total++;
      console.log(`❌ ${testCase.name} - Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Calculate accuracies
  const correctionAccuracy = results.correction.total > 0
    ? Math.round((results.correction.passed / results.correction.total) * 100)
    : 0;

  const listReferenceAccuracy = results.list_reference.total > 0
    ? Math.round((results.list_reference.passed / results.list_reference.total) * 100)
    : 0;

  const pronounAccuracy = results.pronoun.total > 0
    ? Math.round((results.pronoun.passed / results.pronoun.total) * 100)
    : 0;

  const overallAccuracy = totalPassed + totalFailed > 0
    ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
    : 0;

  return {
    correctionAccuracy,
    listReferenceAccuracy,
    pronounAccuracy,
    overallAccuracy,
    baseline: BASELINE_SCORES,
    target: TARGET_SCORES,
    improvement: {
      correctionAccuracy: correctionAccuracy - BASELINE_SCORES.correctionAccuracy,
      listReferenceAccuracy: listReferenceAccuracy - BASELINE_SCORES.listReferenceAccuracy,
      pronounAccuracy: pronounAccuracy - BASELINE_SCORES.pronounAccuracy,
      overallAccuracy: overallAccuracy - BASELINE_SCORES.overallAccuracy
    },
    details: {
      total: totalPassed + totalFailed,
      passed: totalPassed,
      failed: totalFailed,
      byCategory: {
        correction: results.correction,
        list_reference: results.list_reference,
        pronoun: results.pronoun
      }
    }
  };
}
