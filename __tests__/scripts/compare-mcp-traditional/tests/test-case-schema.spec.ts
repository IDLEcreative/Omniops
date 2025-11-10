import { describe, it, expect } from '@jest/globals';
import { TEST_CASES } from '@/scripts/tests/compare-mcp-traditional';

describe('MCP Comparison – Test Case Schema', () => {
  it('has at least 20 test cases', () => {
    expect(TEST_CASES.length).toBeGreaterThanOrEqual(20);
  });

  it('includes required fields per case', () => {
    TEST_CASES.forEach((testCase) => {
      expect(testCase).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          description: expect.any(String),
          userQuery: expect.any(String),
          expectedBehavior: expect.any(String),
          category: expect.any(String),
        }),
      );
    });
  });

  it('uses unique IDs', () => {
    const ids = TEST_CASES.map((tc) => tc.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers diverse categories', () => {
    const categories = new Set(TEST_CASES.map((tc) => tc.category));
    ['exact_sku', 'semantic_search', 'multi_result', 'edge_case', 'error_handling'].forEach((category) =>
      expect(categories.has(category)).toBe(true),
    );
  });

  it('maintains descriptive metadata', () => {
    TEST_CASES.forEach((testCase) => {
      expect(testCase.userQuery.trim().length).toBeGreaterThan(0);
      expect(testCase.description.length).toBeGreaterThan(10);
    });
  });
});
