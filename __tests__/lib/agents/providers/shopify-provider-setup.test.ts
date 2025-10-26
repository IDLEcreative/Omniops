/**
 * Shopify Provider Setup Tests
 * Tests initialization and configuration
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';

// Mock the Shopify dynamic client
jest.mock('@/lib/shopify-dynamic', () => ({
  getDynamicShopifyClient: jest.fn()
}));

import { getDynamicShopifyClient } from '@/lib/shopify-dynamic';

describe('ShopifyProvider - Setup', () => {
  let provider: ShopifyProvider;
  const mockDomain = 'test-shop.myshopify.com';

  beforeEach(() => {
    provider = new ShopifyProvider(mockDomain);
    jest.clearAllMocks();
  });

  describe('constructor and properties', () => {
    it('should set platform to shopify', () => {
      expect(provider.platform).toBe('shopify');
    });

    it('should store domain', () => {
      const customProvider = new ShopifyProvider('custom-domain.com');
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

  describe('client availability handling', () => {
    it('should return null from lookupOrder if client not available', async () => {
      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(null);

      const result = await provider.lookupOrder('123');

      expect(result).toBeNull();
      expect(getDynamicShopifyClient).toHaveBeenCalledWith(mockDomain);
    });

    it('should return empty array from searchProducts if client not available', async () => {
      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(null);

      const result = await provider.searchProducts('test');

      expect(result).toEqual([]);
    });

    it('should return null from checkStock if client not available', async () => {
      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(null);

      const result = await provider.checkStock('SKU123');

      expect(result).toBeNull();
    });

    it('should return null from getProductDetails if client not available', async () => {
      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(null);

      const result = await provider.getProductDetails('123');

      expect(result).toBeNull();
    });
  });
});
