/**
 * Shopify Provider Setup Tests
 * Tests initialization and configuration
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';

describe('ShopifyProvider - Setup', () => {
  let provider: ShopifyProvider;
  let mockClient: {
    getOrder: jest.Mock;
    getOrders: jest.Mock;
    getProduct: jest.Mock;
    getProducts: jest.Mock;
    searchProducts: jest.Mock;
  };

  beforeEach(() => {
    // Create simple mock client object
    mockClient = {
      getOrder: jest.fn(),
      getOrders: jest.fn(),
      getProduct: jest.fn(),
      getProducts: jest.fn(),
      searchProducts: jest.fn()
    };

    provider = new ShopifyProvider(mockClient as any);
    jest.clearAllMocks();
  });

  describe('constructor and properties', () => {
    it('should set platform to shopify', () => {
      expect(provider.platform).toBe('shopify');
    });

    it('should accept client via constructor', () => {
      const customClient = {
        getOrder: jest.fn(),
        getOrders: jest.fn(),
        getProduct: jest.fn(),
        getProducts: jest.fn(),
        searchProducts: jest.fn()
      };
      const customProvider = new ShopifyProvider(customClient as any);
      expect(customProvider.platform).toBe('shopify');
    });
  });

  describe('CommerceProvider interface compliance', () => {
    it('should implement all required methods', () => {
      expect(typeof provider.lookupOrder).toBe('function');
      expect(typeof provider.searchProducts).toBe('function');
      expect(typeof provider.checkStock).toBe('function');
      expect(typeof provider.getProductDetails).toBe('function');
    });

    it('should have platform property', () => {
      expect(provider.platform).toBe('shopify');
    });
  });

  describe('error handling with failing client', () => {
    it('should handle errors from lookupOrder gracefully', async () => {
      mockClient.getOrder.mockRejectedValue(new Error('API Error'));
      mockClient.getOrders.mockResolvedValue([]);

      const result = await provider.lookupOrder('123');

      expect(result).toBeNull();
    });

    it('should handle errors from searchProducts gracefully', async () => {
      mockClient.searchProducts.mockRejectedValue(new Error('API Error'));

      const result = await provider.searchProducts('test');

      expect(result).toEqual([]);
    });

    it('should handle errors from checkStock gracefully', async () => {
      mockClient.getProduct.mockRejectedValue(new Error('API Error'));
      mockClient.getProducts.mockResolvedValue([]);

      const result = await provider.checkStock('SKU123');

      expect(result).toBeNull();
    });

    it('should handle errors from getProductDetails gracefully', async () => {
      mockClient.getProduct.mockRejectedValue(new Error('API Error'));
      mockClient.getProducts.mockResolvedValue([]);

      const result = await provider.getProductDetails('123');

      expect(result).toBeNull();
    });
  });
});
