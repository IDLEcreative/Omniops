/**
 * Tests for WooCommerce Fuzzy Matching Integration
 *
 * CRITICAL: Product lookup accuracy - tests SKU suggestion functionality
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';

describe('WooCommerceProvider - Fuzzy Matching', () => {
  let provider: WooCommerceProvider;
  let mockClient: jest.Mocked<Partial<WooCommerceAPI>>;

  beforeEach(() => {
    mockClient = {
      getProducts: jest.fn(),
    } as jest.Mocked<Partial<WooCommerceAPI>>;

    provider = new WooCommerceProvider(mockClient as WooCommerceAPI);
    jest.clearAllMocks();
  });

  describe('getProductDetails - Fuzzy Matching', () => {
    it('should return suggestions when product not found but similar SKUs exist', async () => {
      const catalogProducts = [
        { id: 1, name: 'Product 1', sku: 'MU110667602', price: '100.00' },
        { id: 2, name: 'Product 2', sku: 'MU110667611', price: '150.00' },
        { id: 3, name: 'Product 3', sku: 'MU110667501', price: '200.00' },
        { id: 4, name: 'Product 4', sku: 'BP-001', price: '50.00' },
      ];

      // Mock SKU search (fails), name search (fails), then catalog fetch for fuzzy match
      (mockClient.getProducts as jest.Mock)
        .mockResolvedValueOnce([])  // SKU search fails
        .mockResolvedValueOnce([])  // Name search fails
        .mockResolvedValueOnce(catalogProducts);  // Catalog for fuzzy matching

      const result = await provider.getProductDetails('MU110667601');

      expect(result).toEqual({
        suggestions: ['MU110667602', 'MU110667611', 'MU110667501']
      });
    });

    it('should limit suggestions to top 3 closest matches', async () => {
      const catalogProducts = [
        { id: 1, name: 'Product 1', sku: 'ABC1', price: '10.00' },
        { id: 2, name: 'Product 2', sku: 'ABC2', price: '20.00' },
        { id: 3, name: 'Product 3', sku: 'ABC3', price: '30.00' },
        { id: 4, name: 'Product 4', sku: 'ABC4', price: '40.00' },
        { id: 5, name: 'Product 5', sku: 'ABC5', price: '50.00' },
      ];

      (mockClient.getProducts as jest.Mock)
        .mockResolvedValueOnce([])  // SKU search fails
        .mockResolvedValueOnce([])  // Name search fails
        .mockResolvedValueOnce(catalogProducts);  // Catalog for fuzzy matching

      const result = await provider.getProductDetails('ABC0');

      expect(result.suggestions).toHaveLength(3);
      expect(result.suggestions).toEqual(['ABC1', 'ABC2', 'ABC3']);
    });

    it('should return null when no similar SKUs found', async () => {
      const catalogProducts = [
        { id: 1, name: 'Product 1', sku: 'ZZZZZ', price: '100.00' },
        { id: 2, name: 'Product 2', sku: 'YYYYY', price: '150.00' },
      ];

      (mockClient.getProducts as jest.Mock)
        .mockResolvedValueOnce([])  // SKU search fails
        .mockResolvedValueOnce([])  // Name search fails
        .mockResolvedValueOnce(catalogProducts);  // Catalog for fuzzy matching

      const result = await provider.getProductDetails('ABC123');

      expect(result).toBeNull();
    });

    it('should not return suggestions when exact SKU match found', async () => {
      const exactProduct = {
        id: 1,
        name: 'Exact Product',
        sku: 'MU110667601',
        price: '100.00'
      };

      (mockClient.getProducts as jest.Mock).mockResolvedValueOnce([exactProduct]);

      const result = await provider.getProductDetails('MU110667601');

      expect(result).toEqual(exactProduct);
      expect(result).not.toHaveProperty('suggestions');
    });

    it('should not return suggestions when name search succeeds', async () => {
      const foundProduct = {
        id: 1,
        name: '10mtr extension cables',
        sku: 'CABLE-10M',
        price: '45.00'
      };

      (mockClient.getProducts as jest.Mock)
        .mockResolvedValueOnce([])  // SKU search fails
        .mockResolvedValueOnce([foundProduct]);  // Name search succeeds

      const result = await provider.getProductDetails('10mtr extension cables');

      expect(result).toEqual(foundProduct);
      expect(result).not.toHaveProperty('suggestions');
    });

    it('should cache SKU list for performance', async () => {
      const catalogProducts = [
        { id: 1, name: 'Product 1', sku: 'ABC1', price: '10.00' },
        { id: 2, name: 'Product 2', sku: 'ABC2', price: '20.00' },
      ];

      (mockClient.getProducts as jest.Mock)
        .mockResolvedValueOnce([])  // First query: SKU search fails
        .mockResolvedValueOnce([])  // First query: Name search fails
        .mockResolvedValueOnce(catalogProducts)  // First query: Catalog fetch
        .mockResolvedValueOnce([])  // Second query: SKU search fails
        .mockResolvedValueOnce([]);  // Second query: Name search fails
        // No third call - should use cache

      // First call - should fetch catalog
      await provider.getProductDetails('ABC0');

      // Second call - should use cached SKUs
      await provider.getProductDetails('ABC9');

      // Should have been called 5 times total (not 6)
      expect(mockClient.getProducts).toHaveBeenCalledTimes(5);
    });

    it('should handle products without SKUs gracefully', async () => {
      const catalogProducts = [
        { id: 1, name: 'Product 1', sku: null, price: '10.00' },
        { id: 2, name: 'Product 2', sku: '', price: '20.00' },
        { id: 3, name: 'Product 3', sku: 'ABC123', price: '30.00' },
      ];

      (mockClient.getProducts as jest.Mock)
        .mockResolvedValueOnce([])  // SKU search fails
        .mockResolvedValueOnce([])  // Name search fails
        .mockResolvedValueOnce(catalogProducts);  // Catalog for fuzzy matching

      const result = await provider.getProductDetails('ABC124');

      // Should only use 'ABC123' for fuzzy matching
      expect(result).toEqual({
        suggestions: ['ABC123']
      });
    });

    it('should use case-insensitive fuzzy matching', async () => {
      const catalogProducts = [
        { id: 1, name: 'Product 1', sku: 'abc123', price: '10.00' },
        { id: 2, name: 'Product 2', sku: 'ABC124', price: '20.00' },
      ];

      (mockClient.getProducts as jest.Mock)
        .mockResolvedValueOnce([])  // SKU search fails
        .mockResolvedValueOnce([])  // Name search fails
        .mockResolvedValueOnce(catalogProducts);  // Catalog for fuzzy matching

      const result = await provider.getProductDetails('ABC123');

      // Should find both (case-insensitive), but filter out exact match
      expect(result.suggestions).toContain('ABC124');
    });

    it('should prioritize closer matches in suggestions', async () => {
      const catalogProducts = [
        { id: 1, name: 'Product 1', sku: 'MU110667699', price: '100.00' },  // distance: 2
        { id: 2, name: 'Product 2', sku: 'MU110667602', price: '150.00' },  // distance: 1
        { id: 3, name: 'Product 3', sku: 'MU110667611', price: '200.00' },  // distance: 2
      ];

      (mockClient.getProducts as jest.Mock)
        .mockResolvedValueOnce([])  // SKU search fails
        .mockResolvedValueOnce([])  // Name search fails
        .mockResolvedValueOnce(catalogProducts);  // Catalog for fuzzy matching

      const result = await provider.getProductDetails('MU110667601');

      // 'MU110667602' should be first (distance 1)
      expect(result.suggestions[0]).toBe('MU110667602');
    });

    it('should handle errors during fuzzy matching gracefully', async () => {
      (mockClient.getProducts as jest.Mock)
        .mockResolvedValueOnce([])  // SKU search fails
        .mockResolvedValueOnce([])  // Name search fails
        .mockRejectedValueOnce(new Error('API Error'));  // Catalog fetch fails

      const result = await provider.getProductDetails('ABC123');

      expect(result).toBeNull();
    });
  });
});
