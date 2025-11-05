/**
 * Integration tests for MCP Search tools
 *
 * Tests the complete flow of MCP search tools including:
 * - Tool execution via direct function calls
 * - Integration with real dependencies (mocked)
 * - End-to-end search strategies
 */

import { searchProducts } from '@/servers/search/searchProducts';
import { ExecutionContext } from '@/servers/shared/types';

// Mock external dependencies
jest.mock('@/lib/embeddings-optimized');
jest.mock('@/lib/agents/commerce-provider');
jest.mock('@/lib/search/exact-match-search');
jest.mock('@/lib/chat/product-formatters');
jest.mock('@/servers/shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    elapsed: jest.fn(() => 150)
  }))
}));

describe('MCP Search Integration Tests', () => {
  const mockContext: ExecutionContext = {
    customerId: 'integration-test-customer',
    domain: 'test-store.com',
    sessionId: 'test-session-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchProducts Integration', () => {
    it('should execute searchProducts successfully with minimal input', async () => {
      const { searchSimilarContent } = require('@/lib/embeddings-optimized');
      const { getCommerceProvider } = require('@/lib/agents/commerce-provider');
      const { isSkuPattern } = require('@/lib/search/exact-match-search');

      isSkuPattern.mockReturnValue(false);
      getCommerceProvider.mockResolvedValue(null);
      searchSimilarContent.mockResolvedValue([
        {
          url: 'http://test-store.com/product/1',
          title: 'Test Product 1',
          content: 'This is a test product',
          similarity: 0.85
        }
      ]);

      const result = await searchProducts(
        { query: 'test product', limit: 5 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(1);
      expect(result.data?.source).toBe('semantic');
      expect(result.metadata?.executionTime).toBeDefined();
    });

    it('should handle SKU search workflow', async () => {
      const { isSkuPattern, exactMatchSearch } = require('@/lib/search/exact-match-search');

      isSkuPattern.mockReturnValue(true);
      exactMatchSearch.mockResolvedValue([
        {
          url: 'http://test-store.com/product/abc123',
          title: 'Product ABC123',
          content: 'SKU: ABC123\nPrice: $99.99',
          similarity: 1.0,
          metadata: { searchMethod: 'exact-match', matchedSku: 'ABC123' }
        }
      ]);

      const result = await searchProducts(
        { query: 'ABC123', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('exact-match');
      expect(result.data?.results[0].similarity).toBe(1.0);
      expect(exactMatchSearch).toHaveBeenCalledWith('ABC123', 'test-store.com', 10);
    });

    it('should handle WooCommerce provider workflow', async () => {
      const { getCommerceProvider } = require('@/lib/agents/commerce-provider');
      const { formatProviderProducts } = require('@/lib/chat/product-formatters');
      const { isSkuPattern } = require('@/lib/search/exact-match-search');

      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockResolvedValue([
          { id: 1, name: 'WooCommerce Product', price: '25.00', sku: 'WC001' }
        ])
      };

      isSkuPattern.mockReturnValue(false);
      getCommerceProvider.mockResolvedValue(mockProvider);
      formatProviderProducts.mockReturnValue([
        {
          url: 'http://test-store.com/product/wc001',
          title: 'WooCommerce Product',
          content: 'WooCommerce Product\nPrice: 25.00\nSKU: WC001',
          similarity: 0.9
        }
      ]);

      const result = await searchProducts(
        { query: 'woocommerce product', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('woocommerce');
      expect(mockProvider.searchProducts).toHaveBeenCalled();
      expect(formatProviderProducts).toHaveBeenCalledWith(
        'woocommerce',
        expect.any(Array),
        'test-store.com'
      );
    });

    it('should handle multi-strategy fallback correctly', async () => {
      const { isSkuPattern, exactMatchSearch } = require('@/lib/search/exact-match-search');
      const { getCommerceProvider } = require('@/lib/agents/commerce-provider');
      const { searchSimilarContent } = require('@/lib/embeddings-optimized');

      // SKU detected but no exact match
      isSkuPattern.mockReturnValue(true);
      exactMatchSearch.mockResolvedValue([]);

      // Provider available but returns no results
      const mockProvider = {
        platform: 'shopify',
        searchProducts: jest.fn().mockResolvedValue([])
      };
      getCommerceProvider.mockResolvedValue(mockProvider);

      // Semantic search as final fallback
      searchSimilarContent.mockResolvedValue([
        {
          url: 'http://test-store.com/page/info',
          title: 'Product Information',
          content: 'General product information',
          similarity: 0.6
        }
      ]);

      const result = await searchProducts(
        { query: 'ABC789', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('semantic');
      expect(exactMatchSearch).toHaveBeenCalled();
      expect(mockProvider.searchProducts).toHaveBeenCalled();
      expect(searchSimilarContent).toHaveBeenCalled();
    });

    it('should apply adaptive limit optimization', async () => {
      const { searchSimilarContent } = require('@/lib/embeddings-optimized');
      const { getCommerceProvider } = require('@/lib/agents/commerce-provider');
      const { isSkuPattern } = require('@/lib/search/exact-match-search');

      isSkuPattern.mockReturnValue(false);
      getCommerceProvider.mockResolvedValue(null);
      searchSimilarContent.mockResolvedValue([]);

      // Long query should reduce limit
      const longQuery = 'this is a very long query with many words';
      const result = await searchProducts(
        { query: longQuery, limit: 100 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.adaptiveLimit).toBe(50); // Reduced from 100

      // Short query should use full limit
      const shortQuery = 'pump';
      const result2 = await searchProducts(
        { query: shortQuery, limit: 100 },
        mockContext
      );

      expect(result2.success).toBe(true);
      expect(result2.data?.adaptiveLimit).toBe(100); // Full limit
    });

    it('should validate context requirements', async () => {
      const result = await searchProducts(
        { query: 'test', limit: 10 },
        { customerId: 'test' } as ExecutionContext // Missing domain
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('domain');
    });

    it('should reject invalid domains', async () => {
      const result = await searchProducts(
        { query: 'test', limit: 10 },
        { ...mockContext, domain: 'localhost:3000' }
      );

      expect(result.success).toBe(false);
      expect(result.data?.source).toBe('invalid-domain');
    });

    it('should handle errors gracefully and return error result', async () => {
      const { searchSimilarContent } = require('@/lib/embeddings-optimized');
      const { getCommerceProvider } = require('@/lib/agents/commerce-provider');
      const { isSkuPattern } = require('@/lib/search/exact-match-search');

      isSkuPattern.mockReturnValue(false);
      getCommerceProvider.mockRejectedValue(new Error('Database connection failed'));
      searchSimilarContent.mockRejectedValue(new Error('OpenAI API error'));

      const result = await searchProducts(
        { query: 'test', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEARCH_ERROR');
      expect(result.data?.source).toBe('error');
    });
  });

  describe('Performance Characteristics', () => {
    it('should complete search within reasonable time', async () => {
      const { searchSimilarContent } = require('@/lib/embeddings-optimized');
      const { getCommerceProvider } = require('@/lib/agents/commerce-provider');
      const { isSkuPattern } = require('@/lib/search/exact-match-search');

      isSkuPattern.mockReturnValue(false);
      getCommerceProvider.mockResolvedValue(null);
      searchSimilarContent.mockResolvedValue([]);

      const startTime = Date.now();

      await searchProducts(
        { query: 'performance test', limit: 10 },
        mockContext
      );

      const duration = Date.now() - startTime;

      // Should complete quickly (mocked, so should be < 100ms)
      expect(duration).toBeLessThan(1000);
    });

    it('should track execution time in metadata', async () => {
      const { searchSimilarContent } = require('@/lib/embeddings-optimized');
      const { getCommerceProvider } = require('@/lib/agents/commerce-provider');
      const { isSkuPattern } = require('@/lib/search/exact-match-search');

      isSkuPattern.mockReturnValue(false);
      getCommerceProvider.mockResolvedValue(null);
      searchSimilarContent.mockResolvedValue([]);

      const result = await searchProducts(
        { query: 'test', limit: 10 },
        mockContext
      );

      expect(result.metadata?.executionTime).toBeDefined();
      expect(typeof result.metadata?.executionTime).toBe('number');
      expect(result.data?.executionTime).toBeDefined();
    });
  });

  describe('Result Structure Validation', () => {
    it('should return consistent result structure across all strategies', async () => {
      const { searchSimilarContent } = require('@/lib/embeddings-optimized');
      const { getCommerceProvider } = require('@/lib/agents/commerce-provider');
      const { isSkuPattern } = require('@/lib/search/exact-match-search');

      isSkuPattern.mockReturnValue(false);
      getCommerceProvider.mockResolvedValue(null);
      searchSimilarContent.mockResolvedValue([]);

      const result = await searchProducts(
        { query: 'test', limit: 10 },
        mockContext
      );

      // Validate ToolResult structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');

      // Validate SearchProductsOutput structure
      expect(result.data).toHaveProperty('results');
      expect(result.data).toHaveProperty('totalMatches');
      expect(result.data).toHaveProperty('executionTime');
      expect(result.data).toHaveProperty('source');

      // Validate metadata
      expect(result.metadata).toHaveProperty('executionTime');
      expect(result.metadata).toHaveProperty('source');
      expect(result.metadata).toHaveProperty('cached');
    });
  });
});
