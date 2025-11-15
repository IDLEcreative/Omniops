/**
 * Verification Report Generation
 */

import type { CheckResult } from './checks.js';

export function printSummary(results: CheckResult[]): void {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  Verification Summary');
  console.log('════════════════════════════════════════════════════════════════\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total Checks: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Checks:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   • ${r.name}`);
        console.log(`     ${r.details}`);
      });

    console.log('\n⚠️  Migration may not have been applied or completed successfully.');
    console.log('   Please review the migration file and re-apply if necessary.');
  } else {
    console.log('\n✅ All checks passed! Security migration was successful.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Run security advisors check in Supabase Dashboard');
    console.log('   2. Run RLS policy tests: npx tsx test-rls-policies.ts');
    console.log('   3. Review security documentation: docs/SECURITY_MODEL.md');
  }

  console.log('\n════════════════════════════════════════════════════════════════\n');
}

export function getExitCode(results: CheckResult[]): number {
  const failed = results.filter((r) => !r.passed).length;
  return failed > 0 ? 1 : 0;
}
