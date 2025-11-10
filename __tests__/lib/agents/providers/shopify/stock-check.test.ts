/**
 * Shopify Provider - Stock Check Tests
 * Tests for inventory stock checking by ID and SKU
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';
import type { ShopifyAPI } from '@/lib/shopify-api';
import {
  mockShopifyClient,
  createMockShopifyProduct,
  createOrderNotFoundError,
  createShopifyAPIError,
} from '@/test-utils/shopify-test-helpers';

describe('ShopifyProvider - Stock Check', () => {
  let provider: ShopifyProvider;
  let mockClient: jest.Mocked<Partial<ShopifyAPI>>;

  beforeEach(() => {
    mockClient = mockShopifyClient() as jest.Mocked<Partial<ShopifyAPI>>;
    provider = new ShopifyProvider(mockClient as ShopifyAPI);
    jest.clearAllMocks();
  });

  describe('checkStock by ID', () => {
    it('should retrieve product stock by numeric ID', async () => {
      const mockProduct = createMockShopifyProduct({
        id: 123,
        title: 'Stock Test Product',
        variants: [{
          id: 1,
          product_id: 123,
          title: 'Default Variant',
          sku: 'SKU-123',
          price: '99.99',
          inventory_quantity: 50,
          inventory_management: 'shopify',
          inventory_policy: 'deny',
        } as any],
      });

      (mockClient.getProduct as jest.Mock).mockResolvedValue(mockProduct);

      const result = await provider.checkStock('123');

      expect(mockClient.getProduct).toHaveBeenCalledWith(123);
      expect(result).toEqual({
        productName: 'Stock Test Product',
        sku: 'SKU-123',
        stockStatus: 'instock',
        stockQuantity: 50,
        manageStock: true,
        backorders: 'no',
      });
    });

    it('should return out of stock status', async () => {
      const mockProduct = createMockShopifyProduct({
        id: 789,
        variants: [{
          id: 3,
          product_id: 789,
          sku: 'OUT-OF-STOCK',
          inventory_quantity: 0,
          inventory_policy: 'deny',
        } as any],
      });

      (mockClient.getProduct as jest.Mock).mockResolvedValue(mockProduct);

      const result = await provider.checkStock('789');

      expect(result?.stockStatus).toBe('outofstock');
      expect(result?.stockQuantity).toBe(0);
    });
  });

  describe('checkStock by SKU', () => {
    it('should find product by SKU if ID not found', async () => {
      const mockProduct = createMockShopifyProduct({
        id: 456,
        title: 'SKU Search Product',
        variants: [{
          id: 2,
          product_id: 456,
          sku: 'UNIQUE-SKU-456',
          inventory_quantity: 25,
          inventory_policy: 'continue',
        } as any],
      });

      (mockClient.getProducts as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await provider.checkStock('UNIQUE-SKU-456');

      expect(mockClient.getProducts).toHaveBeenCalledWith({ limit: 250 });
      expect(result?.sku).toBe('UNIQUE-SKU-456');
      expect(result?.backorders).toBe('yes');
    });
  });

  describe('error handling', () => {
    it('should return null if product not found', async () => {
      (mockClient.getProduct as jest.Mock).mockRejectedValue(
        createOrderNotFoundError()
      );
      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      const result = await provider.checkStock('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (mockClient.getProduct as jest.Mock).mockRejectedValue(
        createShopifyAPIError('API Error')
      );
      (mockClient.getProducts as jest.Mock).mockRejectedValue(
        createShopifyAPIError('API Error')
      );

      const result = await provider.checkStock('123');

      expect(result).toBeNull();
    });

    it('should handle product without variants', async () => {
      const mockProduct = createMockShopifyProduct({
        id: 999,
        variants: [],
      });

      (mockClient.getProduct as jest.Mock).mockResolvedValue(mockProduct);

      const result = await provider.checkStock('999');

      expect(result).toBeNull();
    });
  });
});
