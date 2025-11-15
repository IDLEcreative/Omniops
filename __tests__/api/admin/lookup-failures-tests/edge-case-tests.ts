/**
 * Edge case tests for /api/admin/lookup-failures
 */

import type { TestResult } from '../test-lookup-failures-endpoint';

export async function runEdgeCaseTests(baseUrl: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const tests = [
    {
      name: 'Invalid days parameter',
      url: `${baseUrl}/api/admin/lookup-failures?days=abc`,
      description: 'Should handle non-numeric days gracefully'
    },
    {
      name: 'Negative days',
      url: `${baseUrl}/api/admin/lookup-failures?days=-1`,
      description: 'Should handle negative values gracefully'
    },
    {
      name: 'Very large days',
      url: `${baseUrl}/api/admin/lookup-failures?days=99999`,
      description: 'Should handle extreme values'
    },
    {
      name: 'Empty domainId',
      url: `${baseUrl}/api/admin/lookup-failures?domainId=`,
      description: 'Should default to all domains'
    },
    {
      name: 'Non-existent domainId',
      url: `${baseUrl}/api/admin/lookup-failures?domainId=00000000-0000-0000-0000-000000000000`,
      description: 'Should return empty or zero results'
    },
  ];

  console.log('🧪 Running Edge Case Tests...\n');

  for (const test of tests) {
    const startTime = Date.now();
    try {
      const response = await fetch(test.url);
      const responseTime = Date.now() - startTime;

      results.push({
        name: test.name,
        passed: response.ok,
        responseTime,
        details: test.description
      });

      console.log(`${results[results.length - 1].passed ? '✅' : '❌'} ${test.name}: ${responseTime}ms`);
      console.log(`   ${test.description}`);
    } catch (error) {
      results.push({
        name: test.name,
        passed: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${test.name}: ${results[results.length - 1].error}`);
    }
  }

  console.log('');
  return results;
}
