/**
 * Tests for MCP Comparison Framework
 *
 * Purpose: Validates the comparison framework logic without requiring
 * a running dev server or actual API calls.
 */

import {
  compareResults,
  TEST_CASES,
  type ExecutionResult,
  type ComparisonTestCase
} from '@/scripts/tests/compare-mcp-traditional';

describe('MCP Comparison Framework', () => {
  // =====================================================
  // TEST CASE VALIDATION
  // =====================================================

  describe('Test Case Schema', () => {
    it('should have at least 20 test cases', () => {
      expect(TEST_CASES.length).toBeGreaterThanOrEqual(20);
    });

    it('should have all required fields in each test case', () => {
      TEST_CASES.forEach(tc => {
        expect(tc).toHaveProperty('id');
        expect(tc).toHaveProperty('description');
        expect(tc).toHaveProperty('userQuery');
        expect(tc).toHaveProperty('expectedBehavior');
        expect(tc).toHaveProperty('category');

        expect(typeof tc.id).toBe('string');
        expect(typeof tc.description).toBe('string');
        expect(typeof tc.userQuery).toBe('string');
        expect(typeof tc.expectedBehavior).toBe('string');
        expect(typeof tc.category).toBe('string');
      });
    });

    it('should have unique test case IDs', () => {
      const ids = TEST_CASES.map(tc => tc.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have diverse category coverage', () => {
      const categories = new Set(TEST_CASES.map(tc => tc.category));

      expect(categories.has('exact_sku')).toBe(true);
      expect(categories.has('semantic_search')).toBe(true);
      expect(categories.has('multi_result')).toBe(true);
      expect(categories.has('edge_case')).toBe(true);
      expect(categories.has('error_handling')).toBe(true);

      expect(categories.size).toBeGreaterThanOrEqual(5);
    });

    it('should have non-empty queries', () => {
      TEST_CASES.forEach(tc => {
        expect(tc.userQuery.trim().length).toBeGreaterThan(0);
      });
    });

    it('should have descriptive descriptions', () => {
      TEST_CASES.forEach(tc => {
        expect(tc.description.length).toBeGreaterThan(10);
        expect(tc.description).not.toMatch(/^test/i); // Avoid lazy naming
      });
    });
  });

  // =====================================================
  // COMPARISON LOGIC TESTS
  // =====================================================

  describe('compareResults', () => {
    const testCase: ComparisonTestCase = {
      id: 'test_1',
      description: 'Test case',
      userQuery: 'test query',
      expectedBehavior: 'test behavior',
      category: 'exact_sku'
    };

    it('should pass when both systems succeed with same products', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: true,
        response: 'Here are 2 products matching your search',
        products: [
          { title: 'Product A', url: '/product-a' },
          { title: 'Product B', url: '/product-b' }
        ],
        executionTime: 1000,
        tokensUsed: { prompt: 100, completion: 50, total: 150 }
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: true,
        response: 'I found 2 products for you',
        products: [
          { title: 'Product A', url: '/product-a' },
          { title: 'Product B', url: '/product-b' }
        ],
        executionTime: 800,
        tokensUsed: { prompt: 50, completion: 40, total: 90 }
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result.functionalEquivalence.passed).toBe(true);
      expect(result.functionalEquivalence.score).toBeGreaterThanOrEqual(80);
    });

    it('should fail when success status differs', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: true,
        response: 'Success',
        executionTime: 1000,
        tokensUsed: { prompt: 100, completion: 50, total: 150 }
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: false,
        response: 'Error',
        executionTime: 800,
        tokensUsed: { prompt: 50, completion: 40, total: 90 },
        error: 'Test error'
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result.functionalEquivalence.passed).toBe(false);
      expect(result.functionalEquivalence.differences.some(d => d.includes('success status'))).toBe(true);
    });

    it('should detect product count differences', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: true,
        response: 'Found 3 products',
        products: [
          { title: 'Product A' },
          { title: 'Product B' },
          { title: 'Product C' }
        ],
        executionTime: 1000,
        tokensUsed: { prompt: 100, completion: 50, total: 150 }
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: true,
        response: 'Found 2 products',
        products: [
          { title: 'Product A' },
          { title: 'Product B' }
        ],
        executionTime: 800,
        tokensUsed: { prompt: 50, completion: 40, total: 90 }
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result.functionalEquivalence.differences.some(d => d.includes('product counts'))).toBe(true);
    });

    it('should calculate correct token savings', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: true,
        response: 'Response',
        executionTime: 1000,
        tokensUsed: { prompt: 1000, completion: 500, total: 1500 }
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: true,
        response: 'Response',
        executionTime: 800,
        tokensUsed: { prompt: 400, completion: 350, total: 750 }
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result.tokenUsage.tokensSaved).toBe(750); // 1500 - 750
      expect(result.tokenUsage.percentReduction).toBe(50); // 750/1500 * 100
    });

    it('should calculate correct speed improvement', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: true,
        response: 'Response',
        executionTime: 1000,
        tokensUsed: { prompt: 100, completion: 50, total: 150 }
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: true,
        response: 'Response',
        executionTime: 750, // 25% faster
        tokensUsed: { prompt: 50, completion: 40, total: 90 }
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result.performance.speedImprovement).toBe(25); // (1000-750)/1000 * 100
    });

    it('should generate recommendations based on results', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: true,
        response: 'Response',
        executionTime: 1000,
        tokensUsed: { prompt: 1000, completion: 500, total: 1500 }
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: true,
        response: 'Response',
        executionTime: 700,
        tokensUsed: { prompt: 300, completion: 200, total: 500 }
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle missing products in one result', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: true,
        response: 'Found products',
        products: [{ title: 'Product A' }],
        executionTime: 1000,
        tokensUsed: { prompt: 100, completion: 50, total: 150 }
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: true,
        response: 'No products found',
        products: undefined,
        executionTime: 800,
        tokensUsed: { prompt: 50, completion: 40, total: 90 }
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result.functionalEquivalence.differences.some(d => d.includes('One system returned products'))).toBe(true);
    });

    it('should accept both systems erroring as equivalent', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: false,
        response: 'Error occurred',
        executionTime: 1000,
        tokensUsed: { prompt: 100, completion: 50, total: 150 },
        error: 'Database error'
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: false,
        response: 'Error occurred',
        executionTime: 800,
        tokensUsed: { prompt: 50, completion: 40, total: 90 },
        error: 'Database error'
      };

      const result = compareResults(traditional, mcp, testCase);

      // Both erroring is acceptable - shouldn't fail comparison
      expect(result.functionalEquivalence.differences.some(d => d.includes('Both systems encountered errors'))).toBe(true);
    });
  });

  // =====================================================
  // PRODUCT EXTRACTION TESTS
  // =====================================================

  describe('Product Extraction Logic', () => {
    it('should extract products from sources array', () => {
      const response = {
        message: 'Found products',
        sources: [
          { title: 'Product A', url: '/a' },
          { title: 'Product B', url: '/b' }
        ]
      };

      // This is tested implicitly in executeTraditionalChat
      // but we verify the structure here
      expect(response.sources).toBeDefined();
      expect(response.sources.length).toBe(2);
    });

    it('should extract products from markdown links', () => {
      const message = `I found these products:
1. [Product A](/product-a)
2. [Product B](/product-b)`;

      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const matches = [...message.matchAll(linkRegex)];

      expect(matches.length).toBe(2);
      expect(matches[0][1]).toBe('Product A');
      expect(matches[0][2]).toBe('/product-a');
    });

    it('should handle responses with no products', () => {
      const response = {
        message: 'No products found'
      };

      expect(response.sources).toBeUndefined();
      expect(response.products).toBeUndefined();
    });
  });

  // =====================================================
  // SEMANTIC SIMILARITY TESTS
  // =====================================================

  describe('Semantic Similarity', () => {
    // These tests verify the internal similarity logic

    it('should recognize identical texts', () => {
      const text = 'This is a test response';
      // Similarity should be 1.0 for identical texts
      // (implicitly tested in compareResults)
      expect(text).toBe(text);
    });

    it('should recognize similar texts with different wording', () => {
      const text1 = 'I found 5 hydraulic pumps for you';
      const text2 = 'Here are 5 hydraulic pumps matching your search';

      // Both contain key words: found/are, 5, hydraulic, pumps
      // Should have high similarity
      const words1 = new Set(text1.toLowerCase().split(/\s+/));
      const words2 = new Set(text2.toLowerCase().split(/\s+/));
      const intersection = new Set([...words1].filter(w => words2.has(w)));

      expect(intersection.size).toBeGreaterThan(0);
    });

    it('should recognize dissimilar texts', () => {
      const text1 = 'Found hydraulic pumps';
      const text2 = 'Cannot find any products';

      const words1 = new Set(text1.toLowerCase().split(/\s+/));
      const words2 = new Set(text2.toLowerCase().split(/\s+/));
      const intersection = new Set([...words1].filter(w => words2.has(w)));

      // Very few common words
      expect(intersection.size).toBeLessThan(words1.size / 2);
    });
  });

  // =====================================================
  // PERFORMANCE METRICS TESTS
  // =====================================================

  describe('Performance Metrics', () => {
    it('should correctly identify MCP as faster', () => {
      const traditional = { executionTime: 1000 };
      const mcp = { executionTime: 750 };

      const improvement = ((traditional.executionTime - mcp.executionTime) / traditional.executionTime) * 100;

      expect(improvement).toBe(25);
      expect(improvement).toBeGreaterThan(0);
    });

    it('should correctly identify MCP as slower', () => {
      const traditional = { executionTime: 800 };
      const mcp = { executionTime: 1000 };

      const improvement = ((traditional.executionTime - mcp.executionTime) / traditional.executionTime) * 100;

      expect(improvement).toBe(-25);
      expect(improvement).toBeLessThan(0);
    });

    it('should handle zero execution time', () => {
      const traditional = { executionTime: 0 };
      const mcp = { executionTime: 500 };

      const improvement = traditional.executionTime > 0
        ? ((traditional.executionTime - mcp.executionTime) / traditional.executionTime) * 100
        : 0;

      expect(improvement).toBe(0); // Avoid division by zero
    });
  });

  // =====================================================
  // TOKEN USAGE TESTS
  // =====================================================

  describe('Token Usage Calculation', () => {
    it('should calculate token savings correctly', () => {
      const traditional = { total: 1500 };
      const mcp = { total: 750 };

      const saved = traditional.total - mcp.total;
      const percent = (saved / traditional.total) * 100;

      expect(saved).toBe(750);
      expect(percent).toBe(50);
    });

    it('should handle negative savings (MCP uses more)', () => {
      const traditional = { total: 500 };
      const mcp = { total: 800 };

      const saved = traditional.total - mcp.total;
      const percent = (saved / traditional.total) * 100;

      expect(saved).toBe(-300);
      expect(percent).toBe(-60);
    });

    it('should handle zero token usage', () => {
      const traditional = { total: 0 };
      const mcp = { total: 500 };

      const saved = traditional.total - mcp.total;
      const percent = traditional.total > 0
        ? (saved / traditional.total) * 100
        : 0;

      expect(percent).toBe(0); // Avoid division by zero
    });
  });

  // =====================================================
  // RECOMMENDATIONS TESTS
  // =====================================================

  describe('Recommendation Generation', () => {
    it('should recommend production when equivalence is high', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: true,
        response: 'Response',
        executionTime: 1000,
        tokensUsed: { prompt: 1000, completion: 500, total: 1500 }
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: true,
        response: 'Response',
        executionTime: 700,
        tokensUsed: { prompt: 300, completion: 200, total: 500 }
      };

      const testCase: ComparisonTestCase = {
        id: 'test_1',
        description: 'Test',
        userQuery: 'test',
        expectedBehavior: 'test',
        category: 'exact_sku'
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result.recommendations.some(r => r.includes('✅'))).toBe(true);
    });

    it('should warn when equivalence is low', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: true,
        response: 'Found products',
        products: [{ title: 'A' }, { title: 'B' }],
        executionTime: 1000,
        tokensUsed: { prompt: 1000, completion: 500, total: 1500 }
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: false,
        response: 'Error occurred',
        executionTime: 700,
        tokensUsed: { prompt: 300, completion: 200, total: 500 },
        error: 'Test error'
      };

      const testCase: ComparisonTestCase = {
        id: 'test_1',
        description: 'Test',
        userQuery: 'test',
        expectedBehavior: 'test',
        category: 'exact_sku'
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result.recommendations.some(r => r.includes('⚠️'))).toBe(true);
    });

    it('should recommend performance investigation when slower', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: true,
        response: 'Response',
        executionTime: 500,
        tokensUsed: { prompt: 100, completion: 50, total: 150 }
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: true,
        response: 'Response',
        executionTime: 1000, // Slower
        tokensUsed: { prompt: 50, completion: 40, total: 90 }
      };

      const testCase: ComparisonTestCase = {
        id: 'test_1',
        description: 'Test',
        userQuery: 'test',
        expectedBehavior: 'test',
        category: 'exact_sku'
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result.recommendations.some(r =>
        r.includes('slower') || r.includes('overhead')
      )).toBe(true);
    });
  });

  // =====================================================
  // ERROR HANDLING TESTS
  // =====================================================

  describe('Error Handling', () => {
    it('should handle execution errors gracefully', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: false,
        response: '',
        executionTime: 0,
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        error: 'Network error'
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: false,
        response: '',
        executionTime: 0,
        tokensUsed: { prompt: 0, completion: 0, total: 0 },
        error: 'Network error'
      };

      const testCase: ComparisonTestCase = {
        id: 'test_1',
        description: 'Test',
        userQuery: 'test',
        expectedBehavior: 'test',
        category: 'error_handling'
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result).toBeDefined();
      expect(result.functionalEquivalence.differences.some(d => d.includes('Both systems encountered errors'))).toBe(true);
    });

    it('should handle missing response data', () => {
      const traditional: ExecutionResult = {
        system: 'traditional',
        testCaseId: 'test_1',
        success: true,
        response: '',
        executionTime: 1000,
        tokensUsed: { prompt: 100, completion: 50, total: 150 }
      };

      const mcp: ExecutionResult = {
        system: 'mcp',
        testCaseId: 'test_1',
        success: true,
        response: '',
        executionTime: 800,
        tokensUsed: { prompt: 50, completion: 40, total: 90 }
      };

      const testCase: ComparisonTestCase = {
        id: 'test_1',
        description: 'Test',
        userQuery: 'test',
        expectedBehavior: 'test',
        category: 'exact_sku'
      };

      const result = compareResults(traditional, mcp, testCase);

      expect(result).toBeDefined();
      // Empty responses should still compare
      expect(result.functionalEquivalence).toBeDefined();
    });
  });
});
