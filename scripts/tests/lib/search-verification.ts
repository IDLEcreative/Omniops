/**
 * Verification utilities for search accuracy validation
 */

import { DEFAULT_SEARCH_LIMIT } from '@/lib/embeddings/constants';
import { log, logHeader, type TestResult } from './test-utils';

interface VerificationCheck {
  name: string;
  passed: boolean;
  value: string | number;
}

export function runVerificationChecklist(results: TestResult[]): VerificationCheck[] {
  logHeader('VERIFICATION CHECKLIST');

  const checks: VerificationCheck[] = [
    {
      name: 'DEFAULT_SEARCH_LIMIT is 100',
      passed: DEFAULT_SEARCH_LIMIT === 100,
      value: DEFAULT_SEARCH_LIMIT
    },
    {
      name: 'At least one query returned >20 results',
      passed: results.some(r => r.actualCount > 20),
      value: `Max: ${Math.max(...results.map(r => r.actualCount))}`
    },
    {
      name: 'Zero-results recovery activated successfully',
      passed: results.some(r => r.strategy && r.strategy !== 'exhausted'),
      value: results.filter(r => r.strategy).map(r => r.strategy).join(', ') || 'none'
    },
    {
      name: 'No crashes or exceptions',
      passed: !results.some(r => r.notes?.includes('Error:')),
      value: results.filter(r => r.notes?.includes('Error:')).length + ' errors'
    },
    {
      name: 'Pass rate ≥70%',
      passed: results.filter(r => r.passed).length / results.length >= 0.70,
      value: `${((results.filter(r => r.passed).length / results.length) * 100).toFixed(1)}%`
    }
  ];

  checks.forEach(check => {
    const status = check.passed ? '✅' : '❌';
    const color = check.passed ? 'green' : 'red';
    log(color, `${status} ${check.name}: ${check.value}`);
  });

  return checks;
}

export function printFinalVerdict(results: TestResult[], checks: VerificationCheck[]): void {
  logHeader('FINAL VERDICT');

  const allChecksPassed = checks.every(c => c.passed);
  const passedTests = results.filter(r => r.passed).length;
  const highPassRate = passedTests / results.length >= 0.80;

  if (allChecksPassed && highPassRate) {
    log('green', '✅ VALIDATION SUCCESSFUL');
    log('green', 'All critical checks passed. Search accuracy improvements are working as expected.');
    process.exit(0);
  } else if (highPassRate) {
    log('yellow', '⚠️  VALIDATION PARTIAL');
    log('yellow', 'Most tests passed, but some checks failed. Review failures above.');
    process.exit(1);
  } else {
    log('red', '❌ VALIDATION FAILED');
    log('red', 'Critical issues detected. Search accuracy improvements need attention.');
    process.exit(1);
  }
}
