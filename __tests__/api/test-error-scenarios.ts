/**
 * Comprehensive Error Scenario & Edge Case Testing Suite
 *
 * Purpose: Test all error scenarios, edge cases, and resilience patterns
 * across API endpoints, frontend components, and state management.
 *
 * Coverage Areas:
 * 1. API Error Scenarios (authentication, authorization, not found)
 * 2. Frontend Edge Cases (empty domains, special characters, long names)
 * 3. State Management (race conditions, memory leaks, stale closures)
 * 4. Error Message Quality (clarity, brand-agnosticism, actionability)
 * 5. Resilience (retry logic, timeout handling, graceful degradation)
 *
 * Refactored: 2025-11-08
 * Split into focused test modules in ./error-scenarios/
 */

import { APIErrorTester } from './error-scenarios/api-errors.test';
import { AuthenticationErrorTester } from './error-scenarios/authentication.test';
import { ConfigurationErrorTester } from './error-scenarios/configuration.test';
import { InputValidationTester } from './error-scenarios/input-validation.test';
import { NetworkScenarioTester } from './error-scenarios/network.test';
import { ErrorMessageQualityTester } from './error-scenarios/error-message-quality.test';
import { RaceConditionTester } from './error-scenarios/race-conditions.test';
import { MemoryLeakTester } from './error-scenarios/memory-leaks.test';
import type { TestReport } from '../utils/error-scenario-helpers';

function printFinalReport(reports: TestReport[]): void {
  console.log('\n\n========== FINAL REPORT ==========\n');

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalPartial = 0;

  for (const report of reports) {
    console.log(`\n${report.category}`);
    console.log('─'.repeat(50));

    totalTests += report.summary.total;
    totalPassed += report.summary.passed;
    totalFailed += report.summary.failed;
    totalPartial += report.summary.partial;

    console.log(`Total: ${report.summary.total} | ✅ ${report.summary.passed} | ❌ ${report.summary.failed} | ⚠️  ${report.summary.partial}`);

    const failures = report.results.filter(r => r.status === 'fail');
    if (failures.length > 0) {
      console.log('\nFailures:');
      failures.forEach(f => {
        console.log(`  - ${f.name}`);
        console.log(`    ${f.details}`);
      });
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`OVERALL: ${totalTests} tests | ✅ ${totalPassed} passed | ❌ ${totalFailed} failed | ⚠️  ${totalPartial} partial`);

  const passPercentage = ((totalPassed / totalTests) * 100).toFixed(1);
  console.log(`Pass Rate: ${passPercentage}%`);

  if (totalFailed === 0 && totalPartial <= 3) {
    console.log('\n🎉 ERROR HANDLING IS ROBUST!');
  } else if (totalFailed > 0) {
    console.log('\n⚠️  CRITICAL: Some error scenarios not handled properly');
  }

  console.log('='.repeat(50) + '\n');
}

// Run all tests
async function main() {
  console.log('\n========== ERROR SCENARIO & EDGE CASE TESTING SUITE ==========\n');

  const reports: TestReport[] = [];

  // Run all test suites
  const testers = [
    new APIErrorTester(),
    new AuthenticationErrorTester(),
    new ConfigurationErrorTester(),
    new InputValidationTester(),
    new NetworkScenarioTester(),
    new ErrorMessageQualityTester(),
    new RaceConditionTester(),
    new MemoryLeakTester(),
  ];

  for (const tester of testers) {
    const report = await tester.run();
    reports.push(report);
  }

  printFinalReport(reports);
}

main().catch(console.error);
