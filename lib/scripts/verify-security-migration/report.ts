/**
 * Verification Report Generation
 */

import type { CheckResult } from './checks.js';

export function printSummary(results: CheckResult[]): void {

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
      });

  } else {
  }

}

export function getExitCode(results: CheckResult[]): number {
  const failed = results.filter((r) => !r.passed).length;
  return failed > 0 ? 1 : 0;
}
