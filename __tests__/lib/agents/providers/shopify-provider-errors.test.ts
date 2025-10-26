/**
 * Shopify Provider: Error Handling Tests
 * Tests for graceful error handling and edge cases
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';

// Mock the Shopify dynamic client
const mockGetDynamicShopifyClient = jest.fn();

jest.mock('@/lib/shopify-dynamic', () => ({
  getDynamicShopifyClient: mockGetDynamicShopifyClient
}));

describe('ShopifyProvider - Error Handling', () => {
  let provider: ShopifyProvider;
  const mockDomain = 'test-shop.myshopify.com';

  beforeEach(() => {
    provider = new ShopifyProvider(mockDomain);
    jest.clearAllMocks();
  });

  describe('lookupOrder errors', () => {
    it('should return null if order not found', async () => {
      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('Not found')),
        getOrders: jest.fn().mockResolvedValue([])
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('API Error'))
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('error');

      expect(result).toBeNull();
    });

    it('should handle missing data fields', async () => {
      const mockOrder = {
        id: 200,
        name: '#2000',
        financial_status: 'paid',
        created_at: '2025-01-01',
        total_price: '75.00',
        currency: 'GBP',
        email: 'nobilling@example.com',
        line_items: [],
        billing_address: null,
        shipping_address: undefined
      };

      const mockClient = {
        getOrder: jest.fn().mockResolvedValue(mockOrder)
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('200');

      expect(result?.billing).toBeUndefined();
      expect(result?.shipping).toBeUndefined();
    });
  });

  describe('searchProducts errors', () => {
    it('should handle search errors gracefully', async () => {
      const mockClient = {
        searchProducts: jest.fn().mockRejectedValue(new Error('Search failed'))
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.searchProducts('error');

      expect(result).toEqual([]);
    });

    it('should return empty array on failure', async () => {
      const mockClient = {
        searchProducts: jest.fn().mockRejectedValue(new Error('Network error'))
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.searchProducts('test');

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('checkStock errors', () => {
    it('should return null if product not found', async () => {
      const mockClient = {
        getProduct: jest.fn().mockRejectedValue(new Error('Not found')),
        getProducts: jest.fn().mockResolvedValue([])
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.checkStock('NOTFOUND');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockClient = {
        getProduct: jest.fn().mockRejectedValue(new Error('API Error'))
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.checkStock('error');

      expect(result).toBeNull();
    });

    it('should handle network failures', async () => {
      const mockClient = {
        getProduct: jest.fn().mockRejectedValue(new Error('Network timeout')),
        getProducts: jest.fn().mockRejectedValue(new Error('Network timeout'))
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.checkStock('SKU123');

      expect(result).toBeNull();
    });
  });

  describe('getProductDetails errors', () => {
    it('should return null if product not found', async () => {
      const mockClient = {
        getProducts: jest.fn().mockResolvedValue([])
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.getProductDetails('NOTFOUND');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockClient = {
        getProduct: jest.fn().mockRejectedValue(new Error('Failed'))
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.getProductDetails('error');

      expect(result).toBeNull();
    });

    it('should handle API failures', async () => {
      const mockClient = {
        getProduct: jest.fn().mockRejectedValue(new Error('API rate limit'))
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.getProductDetails('123');

      expect(result).toBeNull();
    });

    it('should handle malformed responses', async () => {
      const mockClient = {
        getProducts: jest.fn().mockResolvedValue(null)
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.getProductDetails('MALFORMED');

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string identifiers', async () => {
      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('Invalid')),
        getOrders: jest.fn().mockResolvedValue([])
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('');

      expect(result).toBeNull();
    });

    it('should handle whitespace-only identifiers', async () => {
      const mockClient = {
        getProduct: jest.fn().mockRejectedValue(new Error('Invalid')),
        getProducts: jest.fn().mockResolvedValue([])
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.checkStock('   ');

      expect(result).toBeNull();
    });

    it('should handle very long identifiers', async () => {
      const longId = 'X'.repeat(1000);
      const mockClient = {
        getProducts: jest.fn().mockResolvedValue([])
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.getProductDetails(longId);

      expect(result).toBeNull();
    });
  });
});
