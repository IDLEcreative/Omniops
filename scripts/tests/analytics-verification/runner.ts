import { testDatabaseTables } from './tests-database';
import { testComponentFiles } from './tests-components';
import { testApiEndpoints } from './tests-api';
import { testLibraryFiles } from './tests-libraries';
import { testMigrations } from './tests-migrations';
import { testDependencies } from './tests-dependencies';
import type { TestResult } from './types';

export async function runAnalyticsVerification() {
  console.log('🎯 Analytics 10/10 - Feature Verification\n');
  console.log('='.repeat(70));

  const results: TestResult[] = [];

  results.push(...(await testDatabaseTables()));
  results.push(testComponentFiles());
  results.push(testApiEndpoints());
  results.push(testLibraryFiles());
  results.push(testMigrations());
  results.push(testDependencies());

  printSummary(results);
}

function printSummary(results: TestResult[]) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter(r => r.status === '✅').length;
  const warnings = results.filter(r => r.status === '⚠️').length;
  const failed = results.filter(r => r.status === '❌').length;

  console.log(`\n✅ Passed: ${passed}`);
  if (warnings > 0) console.log(`⚠️  Warnings: ${warnings}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);

  const issues = results.filter(r => r.issues && r.issues.length > 0);
  if (issues.length > 0) {
    console.log('\n⚠️  ISSUES FOUND:');
    for (const issue of issues) {
      console.log(`\n${issue.feature}:`);
      issue.issues!.forEach(entry => console.log(`  - ${entry}`));
    }
  }

  console.log('\n' + '='.repeat(70));

  const successRate = ((passed / results.length) * 100).toFixed(1);
  console.log(`\nOverall Success Rate: ${successRate}%`);

  if (failed === 0 && warnings === 0) {
    console.log('\n🎉 ALL FEATURES VERIFIED SUCCESSFULLY!');
    process.exitCode = 0;
  } else if (failed === 0) {
    console.log('\n✅ VERIFICATION PASSED (with warnings)');
    process.exitCode = 0;
  } else {
    console.log('\n❌ VERIFICATION FAILED - Issues need attention');
    process.exitCode = 1;
  }
}
