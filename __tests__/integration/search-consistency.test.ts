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
      const mockSemanticResults: SearchResult[] = [
        {
          url: 'https://example.com/semantic-fallback',
          title: 'Semantic fallback',
          content: 'Result provided via semantic search',
          similarity: 0.72,
        },
      ];
      mockSearchSimilarContent.mockResolvedValue(mockSemanticResults);

      // Act: Execute search
      const result = await executeSearchProducts('test', 100, 'example.com', deps);

      // Assert: Error message should be present and descriptive
      expect(result.success).toBe(true);
      expect(result.source).toBe('semantic');
      expect(result.results).toEqual(mockSemanticResults);
      expect(result.errorMessage).toBeDefined();
      expect(result.errorMessage).toContain('shopify');
      expect(result.errorMessage).toContain('API rate limit exceeded');
      expect(result.errorMessage).toContain('semantic search results');

      console.log('[Test] Error context surfacing verified');
    });
  });

  // Additional resilience and performance tests are covered in
  // search-consistency-fallback.test.ts to keep LOC under control.
});
