/**
 * Shopify Provider - Product Search Tests
 * Tests for product search functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';
import type { ShopifyAPI } from '@/lib/shopify-api';
import {
  mockShopifyClient,
  createMockShopifyProduct,
  createShopifyAPIError,
} from '@/test-utils/shopify-test-helpers';

describe('ShopifyProvider - Product Search', () => {
  let provider: ShopifyProvider;
  let mockClient: jest.Mocked<Partial<ShopifyAPI>>;

  beforeEach(() => {
    mockClient = mockShopifyClient() as jest.Mocked<Partial<ShopifyAPI>>;
    provider = new ShopifyProvider(mockClient as ShopifyAPI);
    jest.clearAllMocks();
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const mockProducts = [
        createMockShopifyProduct({
          id: 1,
          title: 'Test Product 1',
          vendor: 'Test Vendor',
        }),
        createMockShopifyProduct({
          id: 2,
          title: 'Test Product 2',
          vendor: 'Test Vendor',
        }),
      ];

      (mockClient.searchProducts as jest.Mock).mockResolvedValue(mockProducts);

      const result = await provider.searchProducts('test', 10);

      expect(mockClient.searchProducts).toHaveBeenCalledWith('test', 10);
      expect(result).toEqual(mockProducts);
      expect(result).toHaveLength(2);
    });

    it('should use default limit of 10', async () => {
      (mockClient.searchProducts as jest.Mock).mockResolvedValue([]);

      await provider.searchProducts('query');

      expect(mockClient.searchProducts).toHaveBeenCalledWith('query', 10);
    });

    it('should respect custom limit', async () => {
      (mockClient.searchProducts as jest.Mock).mockResolvedValue([]);

      await provider.searchProducts('query', 25);

      expect(mockClient.searchProducts).toHaveBeenCalledWith('query', 25);
    });

    it('should return empty array on error', async () => {
      (mockClient.searchProducts as jest.Mock).mockRejectedValue(
        createShopifyAPIError('Search failed')
      );

      const result = await provider.searchProducts('test');

      expect(result).toEqual([]);
    });

    it('should handle empty search results', async () => {
      (mockClient.searchProducts as jest.Mock).mockResolvedValue([]);

      const result = await provider.searchProducts('nonexistent');

      expect(result).toEqual([]);
    });

    it('should handle large result sets', async () => {
      const largeProductSet = Array.from({ length: 50 }, (_, i) =>
        createMockShopifyProduct({
          id: i + 1,
          title: `Product ${i + 1}`,
        })
      );

      (mockClient.searchProducts as jest.Mock).mockResolvedValue(largeProductSet);

      const result = await provider.searchProducts('product', 50);

      expect(result).toHaveLength(50);
    });
  });
});
