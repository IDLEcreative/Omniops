import { describe, it, expect } from '@jest/globals';
import { compareResults } from '@/scripts/tests/compare-mcp-traditional';
import { mcpSuccess, sampleTestCase, traditionalSuccess } from '../helpers/test-data';
import type { ExecutionResult } from '@/scripts/tests/compare-mcp-traditional';

describe('MCP Comparison – recommendations', () => {
  it('recommends production when equivalence is high', () => {
    const result = compareResults(traditionalSuccess, mcpSuccess, sampleTestCase);
    expect(result.recommendations.some((rec) => rec.includes('✅'))).toBe(true);
  });

  it('warns when equivalence is low', () => {
    const mcpFailure: ExecutionResult = { ...mcpSuccess, success: false, products: undefined, error: 'Test error' };
    const result = compareResults(traditionalSuccess, mcpFailure, sampleTestCase);
    expect(result.recommendations.some((rec) => rec.includes('⚠️'))).toBe(true);
  });

  it('flags slower performance', () => {
    const mcpSlower: ExecutionResult = { ...mcpSuccess, executionTime: 1500 };
    const result = compareResults(traditionalSuccess, mcpSlower, sampleTestCase);
    expect(result.recommendations.some((rec) => rec.includes('slower'))).toBe(true);
  });
});
