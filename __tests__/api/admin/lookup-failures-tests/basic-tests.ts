/**
 * Basic endpoint tests for /api/admin/lookup-failures
 */

import type { TestResult } from '../test-lookup-failures-endpoint';

export async function runBasicTests(baseUrl: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const tests = [
    { name: 'Default (7 days)', url: `${baseUrl}/api/admin/lookup-failures` },
    { name: '1 day filter', url: `${baseUrl}/api/admin/lookup-failures?days=1` },
    { name: '30 day filter', url: `${baseUrl}/api/admin/lookup-failures?days=30` },
    { name: '90 day filter', url: `${baseUrl}/api/admin/lookup-failures?days=90` },
  ];

  console.log('📋 Running Basic Endpoint Tests...\n');

  for (const test of tests) {
    const startTime = Date.now();
    try {
      const response = await fetch(test.url);
      const responseTime = Date.now() - startTime;
      const data = await response.json();

      const validStructure = validateResponseStructure(data);

      results.push({
        name: test.name,
        passed: response.status === 200 && validStructure,
        responseTime,
        details: validStructure ? 'Valid response structure' : 'Invalid response structure'
      });

      console.log(`${results[results.length - 1].passed ? '✅' : '❌'} ${test.name}: ${responseTime}ms`);
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

function validateResponseStructure(data: any): boolean {
  if (!data.stats) return false;
  if (typeof data.stats.totalFailures !== 'number') return false;
  if (typeof data.stats.byErrorType !== 'object') return false;
  if (typeof data.stats.byPlatform !== 'object') return false;
  if (!Array.isArray(data.stats.topFailedQueries)) return false;
  if (!Array.isArray(data.stats.commonPatterns)) return false;
  if (typeof data.period !== 'string') return false;
  if (typeof data.domainId !== 'string') return false;

  return true;
}
