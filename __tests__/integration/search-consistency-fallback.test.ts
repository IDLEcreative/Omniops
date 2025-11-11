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

  // Consistency tests are covered in search-consistency.test.ts.

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
      await executeSearchProducts(longQuery, 200, 'example.com', deps);

      // Assert: Adaptive limit should cap at 100 for long queries
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        longQuery,
        'example.com',
        100,
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
      mockSearchSimilarContent.mockResolvedValue([
        {
          url: 'https://example.com/sanitized',
          title: 'Sanitized Fallback Result',
          content: 'Semantic fallback content',
          similarity: 0.81,
        },
      ]);

      // Act: Execute search
      const result = await executeSearchProducts('test', 100, 'example.com', deps);

      // Assert: Should handle gracefully (may fallback or filter bad data)
      expect(result.success).toBe(true);
      expect(result.source).toBe('semantic');
      expect(result.results.length).toBeGreaterThan(0);

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
      await executeSearchProducts('show me hydraulic pumps with pressure rating', 200, 'example.com', deps);

      // Assert: Used adaptive limit
      expect(mockSearchSimilarContent).toHaveBeenLastCalledWith(
        'show me hydraulic pumps with pressure rating',
        'example.com',
        100,
        0.2
      );

      console.log('[Test] Adaptive limit optimization verified');
    });
  });
});
