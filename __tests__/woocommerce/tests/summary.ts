/**
 * Test results summary and reporting
 */

import type { TestResult } from './types';

export function printSummary(results: TestResult[], totalTime: number): void {
  console.log('\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(80));

  const passCount = results.filter(r => r.status === 'PASS').length;
  const validationCount = results.filter(r => r.status === 'VALIDATION').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;

  console.log(`\nTotal Operations Tested: ${results.length}/25`);
  console.log(`✅ PASS: ${passCount}`);
  console.log(`⚠️  VALIDATION: ${validationCount} (expected - validation working correctly)`);
  console.log(`❌ FAIL: ${failCount}`);
  console.log(`\nTotal Test Duration: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
  console.log(`Average Duration: ${Math.round(totalTime / results.length)}ms per operation`);

  printCategoryBreakdown(results);
  printFailedOperations(results, failCount);
  printValidationOperations(results, validationCount);
  printSuccessCriteria(results, passCount, validationCount);
}

function printCategoryBreakdown(results: TestResult[]): void {
  console.log('\n' + '-'.repeat(80));
  console.log('RESULTS BY CATEGORY');
  console.log('-'.repeat(80));

  const categories = ['Product', 'Order', 'Cart', 'Store', 'Analytics'];
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const catPass = categoryResults.filter(r => r.status === 'PASS').length;
    const catValidation = categoryResults.filter(r => r.status === 'VALIDATION').length;
    const catFail = categoryResults.filter(r => r.status === 'FAIL').length;

    console.log(`\n${category} Operations: ${categoryResults.length}`);
    console.log(`  ✅ Pass: ${catPass}`);
    console.log(`  ⚠️  Validation: ${catValidation}`);
    console.log(`  ❌ Fail: ${catFail}`);
  }
}

function printFailedOperations(results: TestResult[], failCount: number): void {
  if (failCount === 0) return;

  console.log('\n' + '-'.repeat(80));
  console.log('FAILED OPERATIONS DETAIL');
  console.log('-'.repeat(80));

  results.filter(r => r.status === 'FAIL').forEach(result => {
    console.log(`\n❌ ${result.operation} (${result.category})`);
    console.log(`   Error: ${result.error}`);
    console.log(`   Duration: ${result.duration}ms`);
  });
}

function printValidationOperations(results: TestResult[], validationCount: number): void {
  if (validationCount === 0) return;

  console.log('\n' + '-'.repeat(80));
  console.log('VALIDATION OPERATIONS DETAIL (Expected Behavior)');
  console.log('-'.repeat(80));

  results.filter(r => r.status === 'VALIDATION').forEach(result => {
    console.log(`\n⚠️  ${result.operation} (${result.category})`);
    console.log(`   Message: ${result.message}`);
    console.log(`   Duration: ${result.duration}ms`);
  });
}

function printSuccessCriteria(
  results: TestResult[],
  passCount: number,
  validationCount: number
): void {
  console.log('\n' + '='.repeat(80));
  console.log('SUCCESS CRITERIA EVALUATION');
  console.log('='.repeat(80));

  const totalWorking = passCount + validationCount;
  const successRate = (totalWorking / results.length) * 100;

  console.log(`\n✅ Operations Working Correctly: ${totalWorking}/${results.length} (${successRate.toFixed(1)}%)`);
  console.log(`   (Pass + Validation = Working Correctly)`);

  if (successRate >= 90) {
    console.log('\n🎉 SUCCESS: >=90% of operations working correctly!');
  } else if (successRate >= 70) {
    console.log('\n⚠️  PARTIAL SUCCESS: 70-90% working, needs attention');
  } else {
    console.log('\n❌ FAILURE: <70% working, critical issues detected');
  }

  console.log('\n' + '='.repeat(80));
}
