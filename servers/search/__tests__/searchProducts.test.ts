/**
 * Unit tests for searchProducts MCP tool
 */

import { searchProducts, metadata } from '../searchProducts';
import { ExecutionContext } from '../../shared/types';
import * as embeddings from '@/lib/embeddings-optimized';
import * as commerceProvider from '@/lib/agents/commerce-provider';
import * as exactMatch from '@/lib/search/exact-match-search';
import * as productFormatters from '@/lib/chat/product-formatters';

// Mock all dependencies
jest.mock('@/lib/embeddings-optimized');
jest.mock('@/lib/agents/commerce-provider');
jest.mock('@/lib/search/exact-match-search');
jest.mock('@/lib/chat/product-formatters');
jest.mock('@/lib/chat/tool-handlers/domain-utils', () => ({
  normalizeDomain: (domain: string) => {
    if (domain.includes('localhost')) return null;
    return domain.replace(/^https?:\/\//, '').replace('www.', '');
  }
}));
jest.mock('../../shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    elapsed: jest.fn(() => 100)
  }))
}));

describe('searchProducts MCP Tool', () => {
  const mockContext: ExecutionContext = {
    customerId: 'test-customer-123',
    domain: 'example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Metadata', () => {
    it('should have correct metadata structure', () => {
      expect(metadata.name).toBe('searchProducts');
      expect(metadata.category).toBe('search');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.capabilities.requiresContext).toContain('domain');
    });

    it('should have examples', () => {
      expect(metadata.examples.length).toBeGreaterThan(0);
      expect(metadata.examples[0]).toHaveProperty('description');
      expect(metadata.examples[0]).toHaveProperty('input');
    });
  });

  describe('Input Validation', () => {
    it('should accept valid input', async () => {
      (embeddings.searchSimilarContent as jest.Mock).mockResolvedValue([]);
      (commerceProvider.getCommerceProvider as jest.Mock).mockResolvedValue(null);
      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(false);

      const result = await searchProducts(
        { query: 'test product', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
    });

    it('should reject empty query', async () => {
      const result = await searchProducts(
        { query: '', limit: 10 } as any,
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should reject query exceeding max length', async () => {
      const longQuery = 'a'.repeat(501);
      const result = await searchProducts(
        { query: longQuery, limit: 10 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Validation failed');
    });

    it('should use default limit when not provided', async () => {
      (embeddings.searchSimilarContent as jest.Mock).mockResolvedValue([]);
      (commerceProvider.getCommerceProvider as jest.Mock).mockResolvedValue(null);
      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(false);

      const result = await searchProducts(
        { query: 'test' } as any,
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.adaptiveLimit).toBeDefined();
    });
  });

  describe('Context Validation', () => {
    it('should require domain in context', async () => {
      const result = await searchProducts(
        { query: 'test', limit: 10 },
        {} as ExecutionContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('domain');
    });

    it('should reject localhost domains', async () => {
      const result = await searchProducts(
        { query: 'test', limit: 10 },
        { ...mockContext, domain: 'localhost:3000' }
      );

      expect(result.success).toBe(false);
      expect(result.data?.source).toBe('invalid-domain');
    });
  });

  describe('Exact SKU Match Strategy', () => {
    it('should try exact match for SKU patterns', async () => {
      const mockExactResults = [
        {
          url: 'http://example.com/product/123',
          title: 'Product ABC',
          content: 'SKU: ABC123',
          similarity: 1.0
        }
      ];

      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(true);
      (exactMatch.exactMatchSearch as jest.Mock).mockResolvedValue(mockExactResults);

      const result = await searchProducts(
        { query: 'ABC123', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('exact-match');
      expect(result.data?.results).toEqual(mockExactResults);
      expect(exactMatch.exactMatchSearch).toHaveBeenCalledWith('ABC123', 'example.com', 10);
    });

    it('should fallback if no exact matches found', async () => {
      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(true);
      (exactMatch.exactMatchSearch as jest.Mock).mockResolvedValue([]);
      (commerceProvider.getCommerceProvider as jest.Mock).mockResolvedValue(null);
      (embeddings.searchSimilarContent as jest.Mock).mockResolvedValue([]);

      const result = await searchProducts(
        { query: 'ABC123', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('semantic');
    });
  });

  describe('Commerce Provider Strategy', () => {
    it('should use WooCommerce provider when available', async () => {
      const mockProviderResults = [{ id: 1, name: 'Product 1', price: '10.00' }];
      const mockFormattedResults = [{
        url: 'http://example.com/product/1',
        title: 'Product 1',
        content: 'Product 1\nPrice: 10.00',
        similarity: 0.9
      }];

      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockResolvedValue(mockProviderResults)
      };

      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(false);
      (commerceProvider.getCommerceProvider as jest.Mock).mockResolvedValue(mockProvider);
      (productFormatters.formatProviderProducts as jest.Mock).mockReturnValue(mockFormattedResults);

      const result = await searchProducts(
        { query: 'test', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('woocommerce');
      expect(mockProvider.searchProducts).toHaveBeenCalledWith('test', 10);
      expect(productFormatters.formatProviderProducts).toHaveBeenCalledWith('woocommerce', mockProviderResults, 'example.com');
    });

    it('should fallback to semantic if provider returns empty', async () => {
      const mockProvider = {
        platform: 'shopify',
        searchProducts: jest.fn().mockResolvedValue([])
      };

      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(false);
      (commerceProvider.getCommerceProvider as jest.Mock).mockResolvedValue(mockProvider);
      (embeddings.searchSimilarContent as jest.Mock).mockResolvedValue([]);

      const result = await searchProducts(
        { query: 'test', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('semantic');
    });

    it('should fallback to semantic if provider throws error', async () => {
      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockRejectedValue(new Error('Provider error'))
      };

      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(false);
      (commerceProvider.getCommerceProvider as jest.Mock).mockResolvedValue(mockProvider);
      (embeddings.searchSimilarContent as jest.Mock).mockResolvedValue([]);

      const result = await searchProducts(
        { query: 'test', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('semantic');
    });
  });

  describe('Semantic Search Fallback', () => {
    it('should use semantic search when no provider available', async () => {
      const mockSemanticResults = [{
        url: 'http://example.com/page',
        title: 'Test Page',
        content: 'Test content',
        similarity: 0.75
      }];

      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(false);
      (commerceProvider.getCommerceProvider as jest.Mock).mockResolvedValue(null);
      (embeddings.searchSimilarContent as jest.Mock).mockResolvedValue(mockSemanticResults);

      const result = await searchProducts(
        { query: 'test', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.source).toBe('semantic');
      expect(result.data?.results).toEqual(mockSemanticResults);
      expect(embeddings.searchSimilarContent).toHaveBeenCalledWith('test', 'example.com', 10, 0.2);
    });
  });

  describe('Adaptive Limit', () => {
    it('should reduce limit for longer queries', async () => {
      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(false);
      (commerceProvider.getCommerceProvider as jest.Mock).mockResolvedValue(null);
      (embeddings.searchSimilarContent as jest.Mock).mockResolvedValue([]);

      const result = await searchProducts(
        { query: 'this is a long query with many words', limit: 100 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.adaptiveLimit).toBe(50);
    });

    it('should use full limit for short queries', async () => {
      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(false);
      (commerceProvider.getCommerceProvider as jest.Mock).mockResolvedValue(null);
      (embeddings.searchSimilarContent as jest.Mock).mockResolvedValue([]);

      const result = await searchProducts(
        { query: 'pump', limit: 100 },
        mockContext
      );

      expect(result.success).toBe(true);
      expect(result.data?.adaptiveLimit).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      (exactMatch.isSkuPattern as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      const result = await searchProducts(
        { query: 'test', limit: 10 },
        mockContext
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SEARCH_ERROR');
      expect(result.error?.message).toContain('Test error');
    });
  });

  describe('Response Structure', () => {
    it('should return proper ToolResult structure', async () => {
      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(false);
      (commerceProvider.getCommerceProvider as jest.Mock).mockResolvedValue(null);
      (embeddings.searchSimilarContent as jest.Mock).mockResolvedValue([]);

      const result = await searchProducts(
        { query: 'test', limit: 10 },
        mockContext
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata).toHaveProperty('executionTime');
    });

    it('should include execution metadata', async () => {
      (exactMatch.isSkuPattern as jest.Mock).mockReturnValue(false);
      (commerceProvider.getCommerceProvider as jest.Mock).mockResolvedValue(null);
      (embeddings.searchSimilarContent as jest.Mock).mockResolvedValue([]);

      const result = await searchProducts(
        { query: 'test', limit: 10 },
        mockContext
      );

      expect(result.metadata?.executionTime).toBeDefined();
      expect(result.metadata?.source).toBe('semantic');
      expect(result.metadata?.cached).toBe(false);
    });
  });
});
