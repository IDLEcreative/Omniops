import { createTestDOM } from './dom-factory';
import { instrumentQuerySelectorAll } from './instrumentation';
import { removeUnwantedElementsOptimized } from './optimized-removal';
import { removeUnwantedElementsUnoptimized } from './unoptimized-removal';
import type { QueryStats } from './types';

export function runVerification() {
  console.log('='.repeat(80));
  console.log('AI CONTENT EXTRACTOR DOM QUERY REDUCTION VERIFICATION TEST');
  console.log('='.repeat(80));
  console.log();

  console.log('TEST 1: OPTIMIZED VERSION (Current Implementation)');
  console.log('-'.repeat(80));

  const domOptimized = createTestDOM();
  const statsOptimized = instrumentQuerySelectorAll(domOptimized);
  const startOptimized = Date.now();
  const removedOptimized = removeUnwantedElementsOptimized(domOptimized.window.document);
  const durationOptimized = Date.now() - startOptimized;

  printRunSummary(removedOptimized, statsOptimized.totalCalls, durationOptimized);
  printOptimizedQueryBreakdown(statsOptimized);

  console.log('TEST 2: UNOPTIMIZED VERSION (Without Optimization)');
  console.log('-'.repeat(80));

  const domUnoptimized = createTestDOM();
  const statsUnoptimized = instrumentQuerySelectorAll(domUnoptimized);
  const startUnoptimized = Date.now();
  const removedUnoptimized = removeUnwantedElementsUnoptimized(domUnoptimized.window.document);
  const durationUnoptimized = Date.now() - startUnoptimized;

  printRunSummary(removedUnoptimized, statsUnoptimized.totalCalls, durationUnoptimized);
  printComparison(statsOptimized, statsUnoptimized, durationOptimized, durationUnoptimized, removedOptimized, removedUnoptimized);
  printVerificationCriteria(statsOptimized, statsUnoptimized, durationOptimized, durationUnoptimized, removedOptimized, removedUnoptimized);
  printQueryLog(statsOptimized);
}

function printRunSummary(removed: number, totalCalls: number, duration: number) {
  console.log(`Removed elements: ${removed}`);
  console.log(`Total querySelectorAll calls: ${totalCalls}`);
  console.log(`Processing time: ${duration}ms`);
  console.log();
}

function printOptimizedQueryBreakdown(stats: QueryStats) {
  console.log('Query breakdown:');
  console.log(`  - Unwanted selectors: ${stats.queries.filter(q =>
    !q.selector.includes('div, section') && q.selector !== 'a'
  ).length} calls`);
  console.log(`  - All elements query: ${stats.queries.filter(q =>
    q.selector.includes('div, section')
  ).length} call(s)`);
  console.log(`  - All links query: ${stats.queries.filter(q => q.selector === 'a').length} call(s)`);
  console.log();
}

function printComparison(
  statsOptimized: QueryStats,
  statsUnoptimized: QueryStats,
  durationOptimized: number,
  durationUnoptimized: number,
  removedOptimized: number,
  removedUnoptimized: number
) {
  console.log('='.repeat(80));
  console.log('RESULTS COMPARISON');
  console.log('='.repeat(80));

  const querySavings = statsUnoptimized.totalCalls - statsOptimized.totalCalls;
  const querySavingsPercent = ((querySavings / statsUnoptimized.totalCalls) * 100).toFixed(1);
  const speedup = (durationUnoptimized / durationOptimized).toFixed(2);

  console.log(`Query reduction: ${statsUnoptimized.totalCalls} → ${statsOptimized.totalCalls} (saved ${querySavings} calls, ${querySavingsPercent}% reduction)`);
  console.log(`Performance improvement: ${speedup}x faster`);
  console.log(`Elements removed (both): ${removedOptimized} (optimized) vs ${removedUnoptimized} (unoptimized)`);
  console.log();
}

function printVerificationCriteria(
  statsOptimized: QueryStats,
  statsUnoptimized: QueryStats,
  durationOptimized: number,
  durationUnoptimized: number,
  removedOptimized: number,
  removedUnoptimized: number
) {
  console.log('='.repeat(80));
  console.log('VERIFICATION CRITERIA');
  console.log('='.repeat(80));

  const querySavings = statsUnoptimized.totalCalls - statsOptimized.totalCalls;
  const tests = [
    {
      name: 'Optimized version uses minimal queries',
      pass: statsOptimized.totalCalls < 100,
      actual: `${statsOptimized.totalCalls} queries`,
      expected: '< 100 queries'
    },
    {
      name: 'Unoptimized version uses many queries',
      pass: statsUnoptimized.totalCalls > 500,
      actual: `${statsUnoptimized.totalCalls} queries`,
      expected: '> 500 queries'
    },
    {
      name: 'Optimization reduces queries significantly',
      pass: querySavings > 400,
      actual: `${querySavings} queries saved`,
      expected: '> 400 queries saved'
    },
    {
      name: 'Both versions remove same elements',
      pass: removedOptimized === removedUnoptimized,
      actual: `${removedOptimized} vs ${removedUnoptimized}`,
      expected: 'Equal counts'
    },
    {
      name: 'Optimized version is faster',
      pass: durationOptimized < durationUnoptimized,
      actual: `${durationOptimized}ms vs ${durationUnoptimized}ms`,
      expected: 'Optimized < Unoptimized'
    }
  ];

  let passCount = 0;
  tests.forEach((test, index) => {
    const status = test.pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${index + 1}. ${status}: ${test.name}`);
    console.log(`   Expected: ${test.expected}`);
    console.log(`   Actual: ${test.actual}`);
    if (test.pass) passCount++;
  });

  console.log();
  console.log('='.repeat(80));
  console.log(`OVERALL RESULT: ${passCount}/${tests.length} tests passed`);
  console.log('='.repeat(80));

  if (passCount === tests.length) {
    console.log('✅ VERIFICATION SUCCESSFUL');
    console.log('The optimization successfully reduces DOM queries from thousands to under 100!');
  } else {
    console.log('❌ VERIFICATION FAILED');
    console.log('Some tests did not meet expected criteria.');
  }
  console.log();
}

function printQueryLog(stats: QueryStats) {
  console.log('='.repeat(80));
  console.log('DETAILED QUERY LOG (Optimized - First 20 queries)');
  console.log('='.repeat(80));
  stats.queries.slice(0, 20).forEach((query, index) => {
    console.log(`${index + 1}. "${query.selector}" → ${query.resultCount} elements`);
  });

  if (stats.queries.length > 20) {
    console.log(`... and ${stats.queries.length - 20} more queries`);
  }

  console.log();
}
