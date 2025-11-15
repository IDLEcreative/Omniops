import { ValidationResult } from './core';

export function printSummary(results: ValidationResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('🏁 THOMPSON\'S E PARTS SCRAPE VALIDATION SUMMARY');
  console.log('='.repeat(80));

  let passed = 0;
  let partial = 0;
  let failed = 0;

  results.forEach(result => {
    const emoji = result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌';
    console.log(`${emoji} ${result.feature}: ${result.status} - ${result.details}`);

    if (result.status === 'PASS') passed++;
    else if (result.status === 'PARTIAL') partial++;
    else failed++;
  });

  console.log('\n📊 Overall Status:');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ⚠️ Partial: ${partial}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📋 Total Features: ${results.length}`);

  const overallScore = ((passed * 2 + partial) / (results.length * 2)) * 100;
  console.log(`  🎯 Overall Score: ${Math.round(overallScore)}%`);

  if (overallScore >= 80) {
    console.log('\n🎉 Scrape validation: EXCELLENT');
  } else if (overallScore >= 60) {
    console.log('\n👍 Scrape validation: GOOD');
  } else if (overallScore >= 40) {
    console.log('\n⚠️ Scrape validation: NEEDS IMPROVEMENT');
  } else {
    console.log('\n❌ Scrape validation: CRITICAL ISSUES');
  }
}
