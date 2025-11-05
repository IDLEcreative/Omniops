/**
 * Tests for MCP Tool: searchByCategory
 *
 * Test Coverage:
 * - Valid category searches
 * - Empty results handling
 * - Input validation
 * - Context validation
 * - Domain normalization
 * - Error handling
 * - Threshold customization
 * - Execution time tracking
 */

import { searchByCategory } from '../searchByCategory';
import { ExecutionContext } from '../../shared/types';
import { searchSimilarContent } from '@/lib/embeddings-optimized';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

// Mock dependencies
jest.mock('@/lib/embeddings-optimized');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('../../shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    elapsed: () => 150
  }))
}));

const mockSearchSimilarContent = searchSimilarContent as jest.MockedFunction<typeof searchSimilarContent>;
const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;

describe('searchByCategory MCP Tool', () => {
  const mockContext: ExecutionContext = {
    customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
    domain: 'thompsonseparts.co.uk',
    platform: 'woocommerce',
    traceId: 'test-trace-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
  });

  // =====================================================
  // SECTION 1: Valid Category Searches
  // =====================================================

  describe('Valid Category Searches', () => {
    it('should find products in valid category', async () => {
      const mockResults = [
        {
          content: 'Hydraulic pump A4VTG90',
          url: 'https://thompsonseparts.co.uk/product/a4vtg90',
          title: 'A4VTG90 Hydraulic Pump',
          similarity: 0.92
        },
        {
          content: 'Hydraulic pump BP-001',
          url: 'https://thompsonseparts.co.uk/product/bp-001',
          title: 'BP-001 Pump',
          similarity: 0.87
        }
      ];

      mockSearchSimilarContent.mockResolvedValue(mockResults);

      const result = await searchByCategory(
        { category: 'hydraulic-pumps', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data.results).toEqual(mockResults);
      expect(result.data.totalMatches).toBe(2);
      expect(result.data.category).toBe('hydraulic-pumps');
      expect(result.data.source).toBe('semantic');
      expect(result.data.threshold).toBe(0.15);
      expect(result.data.executionTime).toBeGreaterThan(0);
      expect(result.metadata.executionTime).toBeGreaterThan(0);

      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'hydraulic-pumps',
        'thompsonseparts.co.uk',
        10,
        0.15
      );
    });

    it('should handle category with spaces', async () => {
      const mockResults = [
        {
          content: 'Spare part 123',
          url: 'https://example.com/part-123',
          title: 'Part 123',
          similarity: 0.85
        }
      ];

      mockSearchSimilarContent.mockResolvedValue(mockResults);

      const result = await searchByCategory(
        { category: 'spare parts', limit: 20 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data.results).toEqual(mockResults);
      expect(result.data.category).toBe('spare parts');
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'spare parts',
        'thompsonseparts.co.uk',
        20,
        0.15
      );
    });

    it('should handle category with special characters', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: 'parts-&-accessories', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data.category).toBe('parts-&-accessories');
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'parts-&-accessories',
        'thompsonseparts.co.uk',
        10,
        0.15
      );
    });

    it('should handle category search with no results', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: 'nonexistent-category', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data.results).toEqual([]);
      expect(result.data.totalMatches).toBe(0);
      expect(result.data.category).toBe('nonexistent-category');
      expect(result.data.source).toBe('semantic');
    });
  });

  // =====================================================
  // SECTION 2: Limit Parameter Validation
  // =====================================================

  describe('Limit Parameter Validation', () => {
    it('should apply default limit of 100 when not provided', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: 'pumps' },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'pumps',
        'thompsonseparts.co.uk',
        100, // default limit
        0.15
      );
    });

    it('should accept custom limit value', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: 'pumps', limit: 50 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'pumps',
        'thompsonseparts.co.uk',
        50,
        0.15
      );
    });

    it('should enforce maximum limit of 1000', async () => {
      const result = await searchByCategory(
        { category: 'pumps', limit: 5000 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEARCH_BY_CATEGORY_ERROR');
    });

    it('should reject negative limit', async () => {
      const result = await searchByCategory(
        { category: 'pumps', limit: -10 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEARCH_BY_CATEGORY_ERROR');
    });

    it('should reject zero limit', async () => {
      const result = await searchByCategory(
        { category: 'pumps', limit: 0 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEARCH_BY_CATEGORY_ERROR');
    });
  });

  // =====================================================
  // SECTION 3: Threshold Parameter Validation
  // =====================================================

  describe('Threshold Parameter Validation', () => {
    it('should apply default threshold of 0.15', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: 'pumps', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data.threshold).toBe(0.15);
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'pumps',
        'thompsonseparts.co.uk',
        10,
        0.15
      );
    });

    it('should accept custom threshold value', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: 'pumps', limit: 10, threshold: 0.5 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data.threshold).toBe(0.5);
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'pumps',
        'thompsonseparts.co.uk',
        10,
        0.5
      );
    });

    it('should allow minimum threshold of 0', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: 'pumps', limit: 10, threshold: 0 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data.threshold).toBe(0);
    });

    it('should allow maximum threshold of 1', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: 'pumps', limit: 10, threshold: 1 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data.threshold).toBe(1);
    });

    it('should reject threshold above 1', async () => {
      const result = await searchByCategory(
        { category: 'pumps', limit: 10, threshold: 1.5 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEARCH_BY_CATEGORY_ERROR');
    });

    it('should reject negative threshold', async () => {
      const result = await searchByCategory(
        { category: 'pumps', limit: 10, threshold: -0.1 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEARCH_BY_CATEGORY_ERROR');
    });
  });

  // =====================================================
  // SECTION 4: Category Input Validation
  // =====================================================

  describe('Category Input Validation', () => {
    it('should reject empty category string', async () => {
      const result = await searchByCategory(
        { category: '', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEARCH_BY_CATEGORY_ERROR');
    });

    it('should reject category longer than 200 characters', async () => {
      const longCategory = 'a'.repeat(201);
      const result = await searchByCategory(
        { category: longCategory, limit: 10 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEARCH_BY_CATEGORY_ERROR');
    });

    it('should accept category at maximum length (200 chars)', async () => {
      const maxCategory = 'a'.repeat(200);
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: maxCategory, limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data.category).toBe(maxCategory);
    });
  });

  // =====================================================
  // SECTION 5: Context Validation
  // =====================================================

  describe('Context Validation', () => {
    it('should reject missing domain in context', async () => {
      const invalidContext = {
        ...mockContext,
        domain: undefined as any
      };

      const result = await searchByCategory(
        { category: 'pumps', limit: 10 },
        invalidContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEARCH_BY_CATEGORY_ERROR');
      expect(result.error?.message).toContain('Missing required context: domain');
    });

    it('should handle invalid domain (localhost)', async () => {
      mockNormalizeDomain.mockReturnValue('');

      const result = await searchByCategory(
        { category: 'pumps', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data.source).toBe('invalid-domain');
      expect(result.error?.code).toBe('INVALID_DOMAIN');
      expect(result.error?.message).toContain('Invalid or localhost domain');
    });

    it('should handle null domain from normalization', async () => {
      mockNormalizeDomain.mockReturnValue('');

      const result = await searchByCategory(
        { category: 'pumps', limit: 10 },
        { ...mockContext, domain: 'localhost:3000' }
      );

      expect(result.success).toBe(false);
      expect(result.data.source).toBe('invalid-domain');
    });
  });

  // =====================================================
  // SECTION 6: Error Handling
  // =====================================================

  describe('Error Handling', () => {
    it('should handle database query errors', async () => {
      mockSearchSimilarContent.mockRejectedValue(new Error('Database connection failed'));

      const result = await searchByCategory(
        { category: 'pumps', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data.source).toBe('error');
      expect(result.data.results).toEqual([]);
      expect(result.data.totalMatches).toBe(0);
      expect(result.error?.code).toBe('SEARCH_BY_CATEGORY_ERROR');
      expect(result.error?.message).toContain('Database connection failed');
    });

    it('should handle embeddings generation errors', async () => {
      mockSearchSimilarContent.mockRejectedValue(new Error('OpenAI API error'));

      const result = await searchByCategory(
        { category: 'pumps', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data.source).toBe('error');
      expect(result.error?.message).toContain('OpenAI API error');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockSearchSimilarContent.mockRejectedValue(new Error('Unknown error'));

      const result = await searchByCategory(
        { category: 'pumps', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.data.source).toBe('error');
      expect(result.error?.code).toBe('SEARCH_BY_CATEGORY_ERROR');
    });
  });

  // =====================================================
  // SECTION 7: Response Format Validation
  // =====================================================

  describe('Response Format Validation', () => {
    it('should return proper ToolResult structure on success', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: 'pumps', limit: 10 },
        mockContext
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result.data).toHaveProperty('results');
      expect(result.data).toHaveProperty('totalMatches');
      expect(result.data).toHaveProperty('executionTime');
      expect(result.data).toHaveProperty('category');
      expect(result.data).toHaveProperty('source');
      expect(result.data).toHaveProperty('threshold');
      expect(result.metadata).toHaveProperty('executionTime');
    });

    it('should return proper ToolResult structure on error', async () => {
      mockSearchSimilarContent.mockRejectedValue(new Error('Test error'));

      const result = await searchByCategory(
        { category: 'pumps', limit: 10 },
        mockContext
      );

      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('metadata');
      expect(result.error).toHaveProperty('code');
      expect(result.error).toHaveProperty('message');
    });

    it('should include execution time in all responses', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: 'pumps', limit: 10 },
        mockContext
      );

      expect(result.data.executionTime).toBeGreaterThan(0);
      expect(result.metadata.executionTime).toBeGreaterThan(0);
      expect(result.data.executionTime).toBe(result.metadata.executionTime);
    });

    it('should include category in response data', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result = await searchByCategory(
        { category: 'test-category', limit: 10 },
        mockContext
      );

      expect(result.data.category).toBe('test-category');
    });
  });

  // =====================================================
  // SECTION 8: Integration Scenarios
  // =====================================================

  describe('Integration Scenarios', () => {
    it('should handle large result sets efficiently', async () => {
      const largeResults = Array.from({ length: 500 }, (_, i) => ({
        content: `Product ${i}`,
        url: `https://example.com/product-${i}`,
        title: `Product ${i}`,
        similarity: 0.8
      }));

      mockSearchSimilarContent.mockResolvedValue(largeResults);

      const result = await searchByCategory(
        { category: 'all-products', limit: 1000 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data.results.length).toBe(500);
      expect(result.data.totalMatches).toBe(500);
    });

    it('should preserve similarity scores from search', async () => {
      const mockResults = [
        { content: 'Product 1', url: 'url1', title: 'Title 1', similarity: 0.95 },
        { content: 'Product 2', url: 'url2', title: 'Title 2', similarity: 0.75 },
        { content: 'Product 3', url: 'url3', title: 'Title 3', similarity: 0.55 }
      ];

      mockSearchSimilarContent.mockResolvedValue(mockResults);

      const result = await searchByCategory(
        { category: 'pumps', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data.results[0].similarity).toBe(0.95);
      expect(result.data.results[1].similarity).toBe(0.75);
      expect(result.data.results[2].similarity).toBe(0.55);
    });

    it('should handle case-insensitive category matching', async () => {
      mockSearchSimilarContent.mockResolvedValue([]);

      const result1 = await searchByCategory(
        { category: 'PUMPS', limit: 10 },
        mockContext
      );

      const result2 = await searchByCategory(
        { category: 'pumps', limit: 10 },
        mockContext
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockSearchSimilarContent).toHaveBeenCalledTimes(2);
    });
  });
});
