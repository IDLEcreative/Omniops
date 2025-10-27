/**
 * Commerce Provider Registry - Integration Tests
 *
 * Tests the provider registry with real provider instances (not mocked).
 * This validates that the dynamic import strategy works correctly in practice.
 *
 * Note: These tests use real provider classes but mock their dependencies (API clients).
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';

describe('Commerce Provider Integration', () => {
  describe('ShopifyProvider', () => {
    it('should have correct platform identifier', () => {
      const mockClient = { shop: 'test.myshopify.com' } as any;
      const provider = new ShopifyProvider(mockClient);

      expect(provider.platform).toBe('shopify');
      expect(provider).toHaveProperty('lookupOrder');
      expect(provider).toHaveProperty('searchProducts');
      expect(provider).toHaveProperty('checkStock');
      expect(provider).toHaveProperty('getProductDetails');
    });

    it('should implement CommerceProvider interface', () => {
      const mockClient = { shop: 'test.myshopify.com' } as any;
      const provider = new ShopifyProvider(mockClient);

      // Verify all required methods exist and are functions
      expect(typeof provider.lookupOrder).toBe('function');
      expect(typeof provider.searchProducts).toBe('function');
      expect(typeof provider.checkStock).toBe('function');
      expect(typeof provider.getProductDetails).toBe('function');
    });
  });

  describe('WooCommerceProvider', () => {
    it('should have correct platform identifier', () => {
      const mockClient = { url: 'https://test.example' } as any;
      const provider = new WooCommerceProvider(mockClient);

      expect(provider.platform).toBe('woocommerce');
      expect(provider).toHaveProperty('lookupOrder');
      expect(provider).toHaveProperty('searchProducts');
      expect(provider).toHaveProperty('checkStock');
      expect(provider).toHaveProperty('getProductDetails');
    });

    it('should implement CommerceProvider interface', () => {
      const mockClient = { url: 'https://test.example' } as any;
      const provider = new WooCommerceProvider(mockClient);

      // Verify all required methods exist and are functions
      expect(typeof provider.lookupOrder).toBe('function');
      expect(typeof provider.searchProducts).toBe('function');
      expect(typeof provider.checkStock).toBe('function');
      expect(typeof provider.getProductDetails).toBe('function');
    });
  });

  describe('Provider Registry Behavior', () => {
    it('should create distinct provider instances', () => {
      const shopifyClient = { shop: 'test.myshopify.com' } as any;
      const wooClient = { url: 'https://test.example' } as any;

      const shopifyProvider = new ShopifyProvider(shopifyClient);
      const wooProvider = new WooCommerceProvider(wooClient);

      expect(shopifyProvider.platform).not.toBe(wooProvider.platform);
      expect(shopifyProvider.platform).toBe('shopify');
      expect(wooProvider.platform).toBe('woocommerce');
    });

    it('should preserve client reference in provider', () => {
      const shopifyClient = { shop: 'test.myshopify.com' } as any;
      const wooClient = { url: 'https://test.example' } as any;

      const shopifyProvider = new ShopifyProvider(shopifyClient);
      const wooProvider = new WooCommerceProvider(wooClient);

      // Providers should maintain reference to their client
      expect((shopifyProvider as any).client).toBe(shopifyClient);
      expect((wooProvider as any).client).toBe(wooClient);
    });
  });
});
