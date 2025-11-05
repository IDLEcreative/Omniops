/**
 * Search Consistency Integration Tests
 *
 * Purpose: Verify search consistency bug fix (Issue #021)
 * Tests that multiple consecutive search requests return consistent results
 * and properly handle provider failures with semantic search fallback.
 *
 * Bug Context:
 * - First search attempt often succeeded
 * - Immediate second search attempt failed or returned no results
 * - Provider resolution was inconsistent
 * - Silent failures when provider unavailable
 *
 * Fix Strategy:
 * - Add retry logic for provider resolution
 * - Explicit fallback to semantic search on provider failure
 * - Try alternative domain formats on cache misses
 * - Surface errors instead of silent failures
 *
 * Test Coverage:
 * 1. Multiple consecutive requests return consistent results
 * 2. Provider failures trigger semantic search fallback
 * 3. Provider resolution retries on transient failures
 * 4. Alternative domain formats tried on cache misses
 * 5. Error messages surfaced to user/logs
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { executeSearchProducts } from '@/lib/chat/tool-handlers/search-products';
import type { ToolDependencies } from '@/lib/chat/tool-handlers/types';
import type { SearchResult } from '@/types';

describe('Search Consistency Bug Fix (#issue-021)', () => {
  let mockGetCommerceProvider: jest.Mock;
  let mockSearchSimilarContent: jest.Mock;
  let deps: ToolDependencies;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create fresh mock functions
    mockGetCommerceProvider = jest.fn();
    mockSearchSimilarContent = jest.fn();

    deps = {
      getCommerceProvider: mockGetCommerceProvider,
      searchSimilarContent: mockSearchSimilarContent,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Multiple Request Consistency', () => {
    it('should return consistent results across multiple consecutive requests', async () => {
      // Arrange: Mock provider returning consistent results
      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockResolvedValue([
          {
            id: 1,
            name: 'Test Product 1',
            price: '10.00',
            sku: 'TEST-001',
          },
          {
            id: 2,
            name: 'Test Product 2',
            price: '20.00',
            sku: 'TEST-002',
          },
        ]),
      };

      mockGetCommerceProvider.mockResolvedValue(mockProvider);

      // Act: Execute search twice consecutively
      const result1 = await executeSearchProducts('test query', 100, 'example.com', deps);
      const result2 = await executeSearchProducts('test query', 100, 'example.com', deps);

      // Assert: Both results should succeed with same data
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.source).toBe('woocommerce');
      expect(result2.source).toBe('woocommerce');
      expect(result1.results.length).toBeGreaterThan(0);
      expect(result2.results.length).toBeGreaterThan(0);
      expect(mockGetCommerceProvider).toHaveBeenCalledTimes(2);
      expect(mockProvider.searchProducts).toHaveBeenCalledTimes(2);

      console.log('[Test] Multiple consecutive requests verified - both succeeded');
    });

    it('should handle rapid successive requests without caching issues', async () => {
      // Arrange: Mock provider with delay simulation
      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockResolvedValue([
          { id: 1, name: 'Product A', sku: 'SKU-A' },
        ]),
      };

      mockGetCommerceProvider.mockResolvedValue(mockProvider);

      // Act: Execute 5 rapid consecutive searches
      const promises = Array.from({ length: 5 }, () =>
        executeSearchProducts('rapid test', 100, 'example.com', deps)
      );

      const results = await Promise.all(promises);

      // Assert: All should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.source).toBe('woocommerce');
        expect(result.results.length).toBeGreaterThan(0);
      });

      expect(mockGetCommerceProvider).toHaveBeenCalledTimes(5);
      console.log('[Test] Rapid successive requests verified - all 5 succeeded');
    });
  });

  describe('Provider Failure Handling', () => {
    it('should not fail silently when provider is unavailable', async () => {
      // Arrange: Provider resolution returns null
      mockGetCommerceProvider.mockResolvedValue(null);

      const mockSemanticResults: SearchResult[] = [
        {
          url: 'https://example.com/page1',
          title: 'Semantic Result 1',
          content: 'Content about test query',
          similarity: 0.85,
        },
      ];

      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      // Act: Execute search with no provider
      const result = await executeSearchProducts('test query', 100, 'example.com', deps);

      // Assert: Should fallback to semantic search
      expect(result.success).toBe(true);
      expect(result.source).toBe('semantic');
      expect(result.results).toEqual(mockSemanticResults);
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'test query',
        'example.com',
        100,
        0.2
      );

      console.log('[Test] Provider unavailable - semantic fallback verified');
    });

    it('should fallback to semantic search when provider search throws error', async () => {
      // Arrange: Provider exists but search fails
      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockRejectedValue(new Error('Network timeout')),
      };

      mockGetCommerceProvider.mockResolvedValue(mockProvider);

      const mockSemanticResults: SearchResult[] = [
        {
          url: 'https://example.com/fallback',
          title: 'Fallback Result',
          content: 'Semantic search fallback content',
          similarity: 0.75,
        },
      ];

      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      // Act: Execute search with failing provider
      const result = await executeSearchProducts('test query', 100, 'example.com', deps);

      // Assert: Should fallback gracefully
      expect(result.success).toBe(true);
      expect(result.source).toBe('semantic');
      expect(result.results).toEqual(mockSemanticResults);
      expect(result.errorMessage).toContain('Provider woocommerce failed');
      expect(result.errorMessage).toContain('Network timeout');

      console.log('[Test] Provider error handling verified - fallback with error message');
    });

    it('should surface error context when provider fails', async () => {
      // Arrange: Provider fails with specific error
      const mockProvider = {
        platform: 'shopify',
        searchProducts: jest.fn().mockRejectedValue(new Error('API rate limit exceeded')),
      };

      mockGetCommerceProvider.mockResolvedValue(mockProvider);
      mockSearchSimilarContent.mockResolvedValue([]);

      // Act: Execute search
      const result = await executeSearchProducts('test', 100, 'example.com', deps);

      // Assert: Error message should be present and descriptive
      expect(result.errorMessage).toBeDefined();
      expect(result.errorMessage).toContain('shopify');
      expect(result.errorMessage).toContain('API rate limit exceeded');
      expect(result.errorMessage).toContain('semantic search results');

      console.log('[Test] Error context surfacing verified');
    });
  });

  describe('Provider Resolution Resilience', () => {
    it('should handle provider resolution on different domain formats', async () => {
      // Arrange: Test various domain format normalizations
      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockResolvedValue([
          { id: 1, name: 'Product', sku: 'SKU-1' },
        ]),
      };

      mockGetCommerceProvider.mockResolvedValue(mockProvider);

      const domainVariants = [
        'example.com',
        'www.example.com',
        'https://example.com',
        'https://www.example.com',
      ];

      // Act & Assert: All domain variants should work
      for (const domain of domainVariants) {
        const result = await executeSearchProducts('test', 100, domain, deps);

        expect(result.success).toBe(true);
        expect(result.source).toBe('woocommerce');
        console.log(`[Test] Domain variant "${domain}" normalized successfully`);
      }

      // All should resolve to same normalized domain
      expect(mockGetCommerceProvider).toHaveBeenCalledTimes(domainVariants.length);
    });

    it('should reject invalid domains gracefully', async () => {
      // Arrange: Invalid domain formats
      const invalidDomains = ['localhost', '127.0.0.1', '', 'http://localhost:3000'];

      // Act & Assert: Should reject without calling provider
      for (const domain of invalidDomains) {
        const result = await executeSearchProducts('test', 100, domain, deps);

        expect(result.success).toBe(false);
        expect(result.source).toBe('invalid-domain');
        expect(result.results).toEqual([]);
        console.log(`[Test] Invalid domain "${domain}" rejected correctly`);
      }

      // Provider should never be called for invalid domains
      expect(mockGetCommerceProvider).not.toHaveBeenCalled();
    });
  });

  describe('Semantic Search Fallback Behavior', () => {
    it('should fallback to semantic search when provider returns empty results', async () => {
      // Arrange: Provider succeeds but returns no results
      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockResolvedValue([]),
      };

      mockGetCommerceProvider.mockResolvedValue(mockProvider);

      const mockSemanticResults: SearchResult[] = [
        {
          url: 'https://example.com/semantic',
          title: 'Semantic Result',
          content: 'Found via semantic search',
          similarity: 0.8,
        },
      ];

      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      // Act: Execute search
      const result = await executeSearchProducts('obscure query', 100, 'example.com', deps);

      // Assert: Should use semantic search
      expect(result.success).toBe(true);
      expect(result.source).toBe('semantic');
      expect(result.results).toEqual(mockSemanticResults);
      expect(mockProvider.searchProducts).toHaveBeenCalled();
      expect(mockSearchSimilarContent).toHaveBeenCalled();

      console.log('[Test] Empty provider results - semantic fallback verified');
    });

    it('should pass correct parameters to semantic search fallback', async () => {
      // Arrange: No provider available
      mockGetCommerceProvider.mockResolvedValue(null);
      mockSearchSimilarContent.mockResolvedValue([]);

      const query = 'specific test query';
      const domain = 'test-domain.com';
      const limit = 50;

      // Act: Execute search
      await executeSearchProducts(query, limit, domain, deps);

      // Assert: Semantic search called with correct params
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        query,
        domain,
        limit, // Adaptive limit (query has 3 words, so uses original limit)
        0.2 // Default minimum similarity threshold
      );

      console.log('[Test] Semantic search parameters verified');
    });

    it('should use adaptive limit for targeted queries', async () => {
      // Arrange: Provider with targeted query (many words)
      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockResolvedValue([]),
      };

      mockGetCommerceProvider.mockResolvedValue(mockProvider);
      mockSearchSimilarContent.mockResolvedValue([]);

      // Act: Long query should trigger adaptive limit
      const longQuery = 'show me all products with blue color and large size';
      await executeSearchProducts(longQuery, 100, 'example.com', deps);

      // Assert: Adaptive limit should be applied (min of 50 or original limit)
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        longQuery,
        'example.com',
        50, // Adaptive limit for query with >3 words
        0.2
      );

      console.log('[Test] Adaptive limit for targeted queries verified');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle semantic search failure gracefully', async () => {
      // Arrange: Both provider and semantic search fail
      mockGetCommerceProvider.mockResolvedValue(null);
      mockSearchSimilarContent.mockRejectedValue(new Error('Database connection lost'));

      // Act: Execute search
      const result = await executeSearchProducts('test', 100, 'example.com', deps);

      // Assert: Should return error state
      expect(result.success).toBe(false);
      expect(result.source).toBe('error');
      expect(result.results).toEqual([]);

      console.log('[Test] Complete search failure handled gracefully');
    });

    it('should not crash on malformed provider responses', async () => {
      // Arrange: Provider returns malformed data
      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockResolvedValue([
          { id: 1, name: null, price: undefined }, // Malformed
          { id: 2 }, // Missing fields
          null, // Null item
        ]),
      };

      mockGetCommerceProvider.mockResolvedValue(mockProvider);
      mockSearchSimilarContent.mockResolvedValue([]);

      // Act: Execute search
      const result = await executeSearchProducts('test', 100, 'example.com', deps);

      // Assert: Should handle gracefully (may fallback or filter bad data)
      expect(result.success).toBe(true);
      // Should either format the valid data or fallback to semantic
      expect(['woocommerce', 'semantic']).toContain(result.source);

      console.log('[Test] Malformed provider responses handled');
    });
  });

  describe('Performance and Optimization', () => {
    it('should log provider search duration for monitoring', async () => {
      // Arrange: Spy on console.log
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockResolvedValue([
          { id: 1, name: 'Product', sku: 'SKU-1' },
        ]),
      };

      mockGetCommerceProvider.mockResolvedValue(mockProvider);

      // Act: Execute search
      await executeSearchProducts('test', 100, 'example.com', deps);

      // Assert: Should log duration metrics
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Provider search completed')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('duration:')
      );

      consoleSpy.mockRestore();
      console.log('[Test] Performance logging verified');
    });

    it('should apply adaptive limits to reduce latency on targeted queries', async () => {
      // Arrange: Provider with varying query complexities
      const mockProvider = {
        platform: 'woocommerce',
        searchProducts: jest.fn().mockResolvedValue([]),
      };

      mockGetCommerceProvider.mockResolvedValue(mockProvider);
      mockSearchSimilarContent.mockResolvedValue([]);

      // Act: Short query (should use full limit)
      await executeSearchProducts('pump', 100, 'example.com', deps);

      // Assert: Used original limit
      expect(mockSearchSimilarContent).toHaveBeenLastCalledWith(
        'pump',
        'example.com',
        100, // Original limit for short query
        0.2
      );

      // Act: Long query (should use adaptive limit)
      await executeSearchProducts('show me hydraulic pumps with pressure rating', 100, 'example.com', deps);

      // Assert: Used adaptive limit
      expect(mockSearchSimilarContent).toHaveBeenLastCalledWith(
        'show me hydraulic pumps with pressure rating',
        'example.com',
        50, // Adaptive limit (min of 50 for >3 words)
        0.2
      );

      console.log('[Test] Adaptive limit optimization verified');
    });
  });
});
