import type { ComparisonTestCase, ExecutionResult } from '@/scripts/tests/compare-mcp-traditional';

export const sampleTestCase: ComparisonTestCase = {
  id: 'test_1',
  description: 'Baseline test case',
  userQuery: 'test query',
  expectedBehavior: 'test behavior',
  category: 'exact_sku',
};

export const traditionalSuccess: ExecutionResult = {
  system: 'traditional',
  testCaseId: 'test_1',
  success: true,
  response: 'Found products',
  products: [{ title: 'Product A' }, { title: 'Product B' }],
  executionTime: 1000,
  tokensUsed: { prompt: 1000, completion: 500, total: 1500 },
};

export const mcpSuccess: ExecutionResult = {
  system: 'mcp',
  testCaseId: 'test_1',
  success: true,
  response: 'Found products',
  products: [{ title: 'Product A' }, { title: 'Product B' }],
  executionTime: 800,
  tokensUsed: { prompt: 400, completion: 350, total: 750 },
};
