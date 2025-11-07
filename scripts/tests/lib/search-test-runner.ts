/**
 * Test runner utilities for search accuracy validation
 */

import { searchSimilarContent, handleZeroResults } from '@/lib/embeddings';
import { log, type TestResult } from './test-utils';

export async function runSearchTest(
  name: string,
  query: string,
  expectedMin: number,
  domain: string,
  notes?: string
): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log(`  Testing: "${query}"`);
    const searchResults = await searchSimilarContent(query, domain, 100, 0.2);
    const executionTime = Date.now() - start;

    const passed = searchResults.length >= expectedMin;
    const result: TestResult = {
      name,
      query,
      expectedMin,
      actualCount: searchResults.length,
      passed,
      executionTime,
      notes
    };

    if (passed) {
      log('green', `  ✅ PASS: Got ${searchResults.length} results (expected ≥${expectedMin}) [${executionTime}ms]`);
    } else {
      log('red', `  ❌ FAIL: Got ${searchResults.length} results (expected ≥${expectedMin}) [${executionTime}ms]`);
    }

    return result;
  } catch (error) {
    const executionTime = Date.now() - start;
    log('red', `  ❌ ERROR: ${error}`);

    return {
      name,
      query,
      expectedMin,
      actualCount: 0,
      passed: false,
      executionTime,
      notes: `Error: ${error}`
    };
  }
}

export async function runRecoveryTest(
  name: string,
  query: string,
  shouldRecover: boolean,
  domain: string
): Promise<TestResult> {
  const start = Date.now();

  try {
    console.log(`  Testing Recovery: "${query}"`);

    const searchResults = await searchSimilarContent(query, domain, 20, 0.2);

    if (searchResults.length === 0) {
      log('yellow', `  ⚠️  Zero results, activating recovery...`);

      const { results: recoveryResults, strategy, suggestion } = await handleZeroResults(
        query,
        domain,
        20
      );

      const executionTime = Date.now() - start;

      if (recoveryResults.length > 0) {
        log('green', `  ✅ RECOVERY SUCCESS: Found ${recoveryResults.length} results using "${strategy}" [${executionTime}ms]`);
        log('blue', `  💡 Suggestion: ${suggestion}`);

        return {
          name,
          query,
          expectedMin: 0,
          actualCount: recoveryResults.length,
          passed: true,
          executionTime,
          strategy,
          notes: suggestion
        };
      } else {
        const passed = !shouldRecover;

        if (passed) {
          log('green', `  ✅ PASS: No results found (expected for this query) [${executionTime}ms]`);
        } else {
          log('red', `  ❌ FAIL: Recovery exhausted, no results found [${executionTime}ms]`);
        }

        return {
          name,
          query,
          expectedMin: 0,
          actualCount: 0,
          passed,
          executionTime,
          strategy: 'exhausted',
          notes: suggestion
        };
      }
    } else {
      const executionTime = Date.now() - start;
      log('green', `  ✅ PASS: Got ${searchResults.length} results without recovery [${executionTime}ms]`);

      return {
        name,
        query,
        expectedMin: 0,
        actualCount: searchResults.length,
        passed: true,
        executionTime,
        notes: 'No recovery needed'
      };
    }
  } catch (error) {
    const executionTime = Date.now() - start;
    log('red', `  ❌ ERROR: ${error}`);

    return {
      name,
      query,
      expectedMin: 0,
      actualCount: 0,
      passed: false,
      executionTime,
      notes: `Error: ${error}`
    };
  }
}

export async function runConsistencyTest(
  query: string,
  domain: string,
  attempts: number = 3
): Promise<TestResult> {
  const consistencyResults: number[] = [];

  for (let i = 1; i <= attempts; i++) {
    console.log(`  Attempt ${i}/${attempts}: "${query}"`);
    const start = Date.now();
    try {
      const searchResults = await searchSimilarContent(query, domain, 100, 0.2);
      const executionTime = Date.now() - start;
      consistencyResults.push(searchResults.length);
      log('green', `  ✅ Got ${searchResults.length} results [${executionTime}ms]`);
    } catch (error) {
      log('red', `  ❌ ERROR: ${error}`);
      consistencyResults.push(0);
    }
  }

  const allSame = consistencyResults.every(count => count === consistencyResults[0]);
  const allNonZero = consistencyResults.every(count => count > 0);
  const variance = Math.max(...consistencyResults) - Math.min(...consistencyResults);

  const passed = allNonZero && variance <= 5;

  if (allSame && allNonZero) {
    log('green', `  ✅ PASS: All attempts returned ${consistencyResults[0]} results (perfectly consistent)`);
  } else if (passed) {
    log('yellow', `  ⚠️  PASS: Results varied slightly (${variance}), but all non-zero`);
  } else {
    log('red', `  ❌ FAIL: Inconsistent results or zero results detected`);
  }

  return {
    name: 'Consistency Check',
    query,
    expectedMin: 1,
    actualCount: consistencyResults[0],
    passed,
    executionTime: 0,
    notes: `Results: ${consistencyResults.join(', ')} | Variance: ${variance}`
  };
}
