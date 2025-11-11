import { getResults } from './results';

export function printSummary(): number {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('  Test Results Summary');
  console.log('════════════════════════════════════════════════════════════════\n');

  const results = getResults();
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${total ? ((passed / total) * 100).toFixed(1) : '0.0'}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   • ${r.name}`);
        if (r.error) {
          console.log(`     ${r.error}`);
        }
      });
  }

  console.log('\n════════════════════════════════════════════════════════════════\n');
  return failed;
}
