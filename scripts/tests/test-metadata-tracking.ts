/**
 * Conversation Competency Test Suite
 *
 * Main test runner for conversation accuracy improvements.
 * Measures improvements in correction tracking, numbered list references, and pronoun resolution.
 *
 * Baseline Accuracy: 71.4%
 * Target Accuracy: 90%+
 *
 * Run: npx tsx scripts/tests/test-metadata-tracking.ts
 */

import { TARGET_SCORES } from './metadata/types';
import { correctionTestCases } from './metadata/test-cases-correction';
import { listReferenceTestCases } from './metadata/test-cases-list';
import { pronounResolutionTestCases } from './metadata/test-cases-pronoun';
import { runTests } from './metadata/test-runner';
import { generateReport } from './metadata/report-generator';

async function main() {
  try {
    // Combine all test cases
    const allTestCases = [
      ...correctionTestCases,
      ...listReferenceTestCases,
      ...pronounResolutionTestCases
    ];

    // Run tests and generate report
    const report = await runTests(allTestCases);
    generateReport(report);

    // Exit with appropriate code
    if (report.overallAccuracy >= TARGET_SCORES.overallAccuracy) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  }
}

main();
