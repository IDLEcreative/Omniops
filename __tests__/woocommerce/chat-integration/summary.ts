import { TestResult } from './types';

export function printSuiteHeader(domain: string, apiUrl: string, sessionId: string) {
  console.log('🚀 WooCommerce Chat Integration Test Suite');
  console.log('='.repeat(70));
  console.log(`📍 Domain: ${domain}`);
  console.log(`🔗 API: ${apiUrl}`);
  console.log(`🆔 Session: ${sessionId}\n`);
}

export function printSummary(results: TestResult[], totalDuration: number) {
  console.log('\n\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;
  const passRate = total ? ((passed / total) * 100).toFixed(1) : '0.0';

  console.log(`\n✅ Passed: ${passed}/${total} (${passRate}%)`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`⏱️  Average per Test: ${total ? (totalDuration / total / 1000).toFixed(2) : '0'}s`);

  console.log('\n📊 By Category:');
  const categories = Array.from(new Set(results.map((r) => r.category)));
  categories.forEach((cat) => {
    const catResults = results.filter((r) => r.category === cat);
    const catPassed = catResults.filter((r) => r.status === 'PASS').length;
    console.log(`   ${cat}: ${catPassed}/${catResults.length} passed`);
  });

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r, i) => {
        console.log(`\n   ${i + 1}. ${r.operation}`);
        console.log(`      Query: "${r.query}"`);
        console.log(`      Error: ${r.error}`);
      });
  }

  console.log('\n🔧 Tool Usage:');
  const toolStats = results.reduce((acc, r) => {
    if (r.toolUsed) {
      acc[r.toolUsed] = (acc[r.toolUsed] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  Object.entries(toolStats).forEach(([tool, count]) => {
    console.log(`   ${tool}: ${count} times`);
  });

  console.log('\n' + '='.repeat(70));
  console.log(passed === total ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
  console.log('='.repeat(70));

  process.exit(failed > 0 ? 1 : 0);
}
