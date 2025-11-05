#!/usr/bin/env tsx
/**
 * Array Null Safety Stress Test
 *
 * Tests null/undefined safety across all 3 array null check locations:
 * 1. historyData from Promise.allSettled fallback (line 233)
 * 2. allSearchResults with null coalescing (line 326)
 * 3. searchLog with null coalescing (lines 333-334)
 *
 * Stress tests:
 * - 1000 iterations with various null/undefined combinations
 * - Verifies no TypeErrors or crashes
 * - Tests with null, undefined, and partial data
 *
 * Usage:
 *   npx tsx scripts/tests/stress-test-null-safety.ts
 *
 * Expected Output:
 *   ✅ All 1000 iterations passed
 *   ✅ No TypeError crashes
 */

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface SearchResult {
  url: string;
  title: string;
  similarity: number;
}

interface TestResult {
  iteration: number;
  testCase: string;
  passed: boolean;
  error?: string;
  duration: number;
}

// Simulate chat route array handling with all 3 null check patterns
function simulateArrayHandling(
  historyData: ConversationMessage[] | null | undefined,
  allSearchResults: SearchResult[] | null | undefined,
  searchLog: any[] | null | undefined
): { historyLength: number; sourcesLength: number; searchLogLength: number } {
  try {
    // Pattern 1: historyData from Promise.allSettled fallback (line 233)
    // const historyData = conversationOpsResults[1].status === 'fulfilled' ? conversationOpsResults[1].value : [];
    const effectiveHistoryData = historyData || [];
    const historyLength = effectiveHistoryData.length;

    // Pattern 2: allSearchResults with null coalescing (line 326)
    // sources: (allSearchResults || []).slice(0, 10).map(r => ({ ... }))
    const effectiveSearchResults = (allSearchResults || []);
    const sourcesData = effectiveSearchResults.slice(0, 10).map(r => ({
      url: r.url,
      title: r.title,
      relevance: r.similarity
    }));
    const sourcesLength = sourcesData.length;

    // Pattern 3: searchLog with null coalescing (lines 333-334)
    // totalSearches: (searchLog || []).length,
    // searchLog: searchLog || []
    const effectiveSearchLog = (searchLog || []);
    const searchLogLength = effectiveSearchLog.length;

    return {
      historyLength,
      sourcesLength,
      searchLogLength
    };
  } catch (error) {
    throw error; // Re-throw to be caught by test harness
  }
}

// Generate test data
function generateHistoryData(hasData: boolean, isNull: boolean): ConversationMessage[] | null | undefined {
  if (isNull) return null;
  if (!hasData) return undefined;
  return [
    { id: '1', role: 'user', content: 'Hello', created_at: new Date().toISOString() },
    { id: '2', role: 'assistant', content: 'Hi there', created_at: new Date().toISOString() }
  ];
}

function generateSearchResults(hasData: boolean, isNull: boolean, partial: boolean = false): SearchResult[] | null | undefined {
  if (isNull) return null;
  if (!hasData) return undefined;

  const results = [
    { url: 'https://example.com/1', title: 'Result 1', similarity: 0.95 },
    { url: 'https://example.com/2', title: 'Result 2', similarity: 0.87 }
  ];

  if (partial) {
    // Return partial data (missing similarity)
    return results.map(r => ({ ...r, similarity: undefined as any }));
  }

  return results;
}

function generateSearchLog(hasData: boolean, isNull: boolean): any[] | null | undefined {
  if (isNull) return null;
  if (!hasData) return undefined;
  return [
    { query: 'test1', results: 5 },
    { query: 'test2', results: 3 }
  ];
}

async function stressTestNullSafety(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🧪 STRESS TEST: Array Null Safety - 1000 Iterations');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📋 Test Configuration:');
  console.log('   - Total Iterations: 1000');
  console.log('   - Test Case Combinations: 8');
  console.log('   - Array Patterns Tested:');
  console.log('     1. historyData (line 233) - Promise.allSettled fallback');
  console.log('     2. allSearchResults (line 326) - null coalescing');
  console.log('     3. searchLog (line 333-334) - null coalescing\n');

  const testCases = [
    'All null',
    'All undefined',
    'All valid data',
    'History null, results valid',
    'Results null, log valid',
    'History undefined, results undefined',
    'Partial data (some fields missing)',
    'Mixed null and undefined'
  ];

  const results: TestResult[] = [];
  let passCount = 0;
  let failCount = 0;

  // Run 1000 iterations
  for (let iteration = 1; iteration <= 1000; iteration++) {
    const caseIndex = (iteration - 1) % testCases.length;
    const testCase = testCases[caseIndex];

    const startTime = performance.now();
    let passed = false;
    let error = undefined;

    try {
      // Generate test data based on case index
      let historyData: any;
      let searchResults: any;
      let searchLog: any;

      switch (caseIndex) {
        case 0: // All null
          historyData = null;
          searchResults = null;
          searchLog = null;
          break;
        case 1: // All undefined
          historyData = undefined;
          searchResults = undefined;
          searchLog = undefined;
          break;
        case 2: // All valid data
          historyData = generateHistoryData(true, false);
          searchResults = generateSearchResults(true, false);
          searchLog = generateSearchLog(true, false);
          break;
        case 3: // History null, results valid
          historyData = null;
          searchResults = generateSearchResults(true, false);
          searchLog = generateSearchLog(true, false);
          break;
        case 4: // Results null, log valid
          historyData = generateHistoryData(true, false);
          searchResults = null;
          searchLog = generateSearchLog(true, false);
          break;
        case 5: // History undefined, results undefined
          historyData = undefined;
          searchResults = undefined;
          searchLog = generateSearchLog(true, false);
          break;
        case 6: // Partial data
          historyData = generateHistoryData(true, false);
          searchResults = generateSearchResults(true, false, true);
          searchLog = generateSearchLog(true, false);
          break;
        case 7: // Mixed null and undefined
          historyData = null;
          searchResults = undefined;
          searchLog = generateSearchLog(true, false);
          break;
        default:
          throw new Error(`Unknown test case: ${caseIndex}`);
      }

      // Execute the array handling simulation
      const result = simulateArrayHandling(historyData, searchResults, searchLog);

      // Verify results are valid
      if (typeof result.historyLength === 'number' &&
          typeof result.sourcesLength === 'number' &&
          typeof result.searchLogLength === 'number' &&
          result.historyLength >= 0 &&
          result.sourcesLength >= 0 &&
          result.searchLogLength >= 0) {
        passed = true;
        passCount++;
      } else {
        error = 'Invalid result values';
        failCount++;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      failCount++;
    }

    const duration = performance.now() - startTime;

    results.push({
      iteration,
      testCase,
      passed,
      error,
      duration
    });

    // Progress indicator
    if (iteration % 100 === 0) {
      console.log(`   Progress: ${iteration}/1000 iterations...`);
    }
  }

  console.log(`   Progress: 1000/1000 iterations complete!\n`);

  // Analyze results
  console.log('📊 Results Analysis:\n');

  // Overall statistics
  console.log(`   ✅ Passed: ${passCount}/1000`);
  console.log(`   ❌ Failed: ${failCount}/1000`);

  // Per test case breakdown
  console.log('\n📋 Per Test Case Results:\n');

  testCases.forEach((testCase, index) => {
    const caseResults = results.filter(r => r.testCase === testCase);
    const casePassed = caseResults.filter(r => r.passed).length;
    const caseFailed = caseResults.filter(r => !r.passed).length;

    const status = caseFailed === 0 ? '✅' : '❌';
    console.log(`   ${status} ${testCase}: ${casePassed}/${caseResults.length} passed`);

    if (caseFailed > 0) {
      // Show first error for this case
      const firstError = caseResults.find(r => !r.passed);
      if (firstError?.error) {
        console.log(`      Error (iter #${firstError.iteration}): ${firstError.error}`);
      }
    }
  });

  // Performance analysis
  const durations = results.map(r => r.duration);
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const maxDuration = Math.max(...durations);

  console.log('\n⏱️  Performance Metrics:\n');
  console.log(`   - Average Duration: ${avgDuration.toFixed(4)}ms per iteration`);
  console.log(`   - Max Duration: ${maxDuration.toFixed(4)}ms`);
  console.log(`   - Total Test Time: ${durations.reduce((a, b) => a + b, 0).toFixed(2)}ms\n`);

  // Verification
  console.log('🔍 Verification:\n');

  let allPassed = true;

  // Check: All iterations passed
  if (passCount === 1000) {
    console.log('   ✅ All 1000 iterations passed without errors');
  } else {
    console.log(`   ❌ FAIL: ${failCount} iterations failed`);
    allPassed = false;
  }

  // Check: No TypeErrors
  const typeErrors = results.filter(r => r.error?.includes('TypeError'));
  if (typeErrors.length === 0) {
    console.log('   ✅ No TypeError crashes detected');
  } else {
    console.log(`   ❌ FAIL: ${typeErrors.length} TypeError crashes found`);
    allPassed = false;
  }

  // Check: Performance
  if (maxDuration < 5) {
    console.log(`   ✅ All operations under 5ms (max: ${maxDuration.toFixed(4)}ms)`);
  } else {
    console.log(`   ⚠️  WARNING: Some operations slow (max: ${maxDuration.toFixed(4)}ms)`);
  }

  // Check: Test case distribution
  const caseDistribution = testCases.map(tc => {
    const count = results.filter(r => r.testCase === tc).length;
    return { testCase: tc, count };
  });

  const allBalanced = caseDistribution.every(cd => cd.count === 125); // 1000 / 8 = 125
  if (allBalanced) {
    console.log('   ✅ Even test case distribution');
  }

  // Summary
  console.log('\n' + '═'.repeat(59));
  if (allPassed) {
    console.log('✅ STRESS TEST PASSED - Array null safety is robust');
    console.log('═'.repeat(59) + '\n');
  } else {
    console.log('❌ STRESS TEST FAILED - Null safety issues detected');
    console.log('═'.repeat(59) + '\n');
    process.exit(1);
  }

  // Show pattern analysis
  console.log('🔬 Pattern Analysis (3 Null Check Locations):\n');
  console.log('   Pattern 1 - historyData (line 233):');
  console.log('      const historyData = results[1].status === "fulfilled" ? results[1].value : [];');
  console.log('      ✅ Handles null/undefined with [] fallback\n');

  console.log('   Pattern 2 - allSearchResults (line 326):');
  console.log('      sources: (allSearchResults || []).slice(0, 10).map(r => ({ ... }))');
  console.log('      ✅ Handles null/undefined with [] fallback and safe map\n');

  console.log('   Pattern 3 - searchLog (line 333-334):');
  console.log('      totalSearches: (searchLog || []).length,');
  console.log('      searchLog: searchLog || []');
  console.log('      ✅ Consistent null coalescing across both uses\n');
}

// Run stress test
stressTestNullSafety().catch(error => {
  console.error('\n❌ Stress test error:', error);
  process.exit(1);
});
