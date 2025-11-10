import { describe, it, expect } from '@jest/globals';
import { compareResults } from '@/scripts/tests/compare-mcp-traditional';
import type { ComparisonTestCase, ExecutionResult } from '@/scripts/tests/compare-mcp-traditional';

const baseTestCase: ComparisonTestCase = {
  id: 'error_test',
  description: 'Error handling test',
  userQuery: 'test',
  expectedBehavior: 'test',
  category: 'error_handling',
};

describe('MCP Comparison – error handling', () => {
  it('handles execution errors gracefully', () => {
    const errorResult: ExecutionResult = {
      system: 'traditional',
      testCaseId: 'error_test',
      success: false,
      response: '',
      executionTime: 0,
      tokensUsed: { prompt: 0, completion: 0, total: 0 },
      error: 'Network error',
    };

    const result = compareResults(errorResult, { ...errorResult, system: 'mcp' }, baseTestCase);
    expect(result.functionalEquivalence.differences.some((d) => d.includes('Both systems encountered errors'))).toBe(true);
  });

  it('handles missing response data', () => {
    const traditional: ExecutionResult = {
      system: 'traditional',
      testCaseId: 'error_test',
      success: true,
      response: '',
      executionTime: 1000,
      tokensUsed: { prompt: 100, completion: 50, total: 150 },
    };
    const mcp: ExecutionResult = {
      system: 'mcp',
      testCaseId: 'error_test',
      success: true,
      response: '',
      executionTime: 800,
      tokensUsed: { prompt: 50, completion: 40, total: 90 },
    };

    const result = compareResults(traditional, mcp, baseTestCase);
    expect(result.functionalEquivalence).toBeDefined();
  });
});
