import { describe, it, expect } from '@jest/globals';
import { compareResults } from '@/scripts/tests/compare-mcp-traditional';
import { mcpSuccess, sampleTestCase, traditionalSuccess } from '../helpers/test-data';
import { ExecutionResult } from '@/scripts/tests/compare-mcp-traditional';

describe('MCP Comparison – compareResults', () => {
  it('passes when both systems succeed with same products', () => {
    const result = compareResults(traditionalSuccess, mcpSuccess, sampleTestCase);

    expect(result.functionalEquivalence.passed).toBe(true);
    expect(result.functionalEquivalence.score).toBeGreaterThanOrEqual(80);
  });

  it('fails when success status differs', () => {
    const mcpFailure: ExecutionResult = { ...mcpSuccess, success: false, error: 'Test error' };

    const result = compareResults(traditionalSuccess, mcpFailure, sampleTestCase);
    expect(result.functionalEquivalence.passed).toBe(false);
  });

  it('detects product count differences', () => {
    const mcpTwoProducts: ExecutionResult = { ...mcpSuccess, products: [{ title: 'Product A' }] };

    const result = compareResults(traditionalSuccess, mcpTwoProducts, sampleTestCase);
    expect(result.functionalEquivalence.differences.some((d) => d.includes('product counts'))).toBe(true);
  });

  it('calculates token savings', () => {
    const result = compareResults(traditionalSuccess, mcpSuccess, sampleTestCase);
    expect(result.tokenUsage.tokensSaved).toBe(750);
    expect(result.tokenUsage.percentReduction).toBe(50);
  });

  it('calculates speed improvement', () => {
    const result = compareResults(traditionalSuccess, mcpSuccess, sampleTestCase);
    expect(result.performance.speedImprovement).toBe(20);
  });
});
