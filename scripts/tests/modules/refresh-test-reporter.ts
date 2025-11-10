/**
 * Test Report Generation for Refresh Workflow
 */

import type { TestResult } from './refresh-test-types';

export async function generateReport(results: TestResult[]): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 COMPREHENSIVE FIX TEST REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  const phaseResults = {
    'Phase 1': results.filter(r => r.phase === 'Phase 1'),
    'Phase 2': results.filter(r => r.phase === 'Phase 2'),
    'Phase 3': results.filter(r => r.phase === 'Phase 3'),
    'Phase 4': results.filter(r => r.phase === 'Phase 4'),
    'Phase 5': results.filter(r => r.phase === 'Phase 5'),
    'Phase 6': results.filter(r => r.phase === 'Phase 6'),
    'Phase 7': results.filter(r => r.phase === 'Phase 7'),
  };

  let allPassed = true;

  for (const [phase, phaseTests] of Object.entries(phaseResults)) {
    const passed = phaseTests.filter(t => t.passed).length;
    const total = phaseTests.length;
    const phasePassed = passed === total;
    allPassed = allPassed && phasePassed;

    console.log(`${phasePassed ? '✅' : '❌'} ${phase}: ${passed}/${total} tests passed`);

    if (!phasePassed) {
      const failed = phaseTests.filter(t => !t.passed);
      failed.forEach(f => {
        console.log(`   ❌ ${f.test}: ${f.message}`);
      });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');

  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED - READY FOR PRODUCTION!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n✅ GREEN LIGHT: All 7 phases validated successfully');
    console.log('\nYou can now deploy the content refresh system:');
    console.log('  1. No duplicate embeddings will be created');
    console.log('  2. Worker is single source of truth');
    console.log('  3. Domain locks prevent concurrent refreshes');
    console.log('  4. Deletion errors are fatal (prevent duplicates)');
    console.log('  5. forceRescrape flag works end-to-end');
    console.log('  6. 404 pages are detected and cleaned up');
    console.log('  7. Atomic transactions available for future use');
    console.log('\n🚀 Next step: Deploy to production and monitor first refresh');
  } else {
    console.log('⚠️  SOME TESTS FAILED - REVIEW BEFORE DEPLOYING');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n❌ RED LIGHT: Fix failing tests before production');
  }

  // Save report
  const fs = await import('fs/promises');
  const reportPath = 'docs/10-ANALYSIS/PHASE_8_E2E_TEST_REPORT.md';

  let reportContent = `# Phase 8: End-to-End Test Report\n\n`;
  reportContent += `**Date**: ${new Date().toISOString()}\n`;
  reportContent += `**Status**: ${allPassed ? '✅ ALL PASSED' : '⚠️ SOME FAILED'}\n\n`;
  reportContent += `---\n\n## Test Results\n\n`;

  for (const [phase, phaseTests] of Object.entries(phaseResults)) {
    const passed = phaseTests.filter(t => t.passed).length;
    const total = phaseTests.length;
    reportContent += `### ${phase}: ${passed}/${total}\n\n`;

    phaseTests.forEach(test => {
      reportContent += `- ${test.passed ? '✅' : '❌'} **${test.test}**: ${test.message}\n`;
    });
    reportContent += `\n`;
  }

  reportContent += `---\n\n## Summary\n\n`;
  reportContent += `**Total Tests**: ${results.length}\n`;
  reportContent += `**Passed**: ${results.filter(r => r.passed).length}\n`;
  reportContent += `**Failed**: ${results.filter(r => !r.passed).length}\n\n`;

  if (allPassed) {
    reportContent += `✅ **GREEN LIGHT**: Ready for production deployment\n`;
  } else {
    reportContent += `❌ **RED LIGHT**: Fix failing tests before deployment\n`;
  }

  await fs.writeFile(reportPath, reportContent);
  console.log(`\n📄 Report saved to: ${reportPath}`);
}
