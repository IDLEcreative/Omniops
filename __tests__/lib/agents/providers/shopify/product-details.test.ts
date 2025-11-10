/**
 * Shopify Provider - Product Details Tests
 * Tests for retrieving detailed product information
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

describe('ShopifyProvider - Product Details', () => {
  let provider: ShopifyProvider;
  let mockClient: jest.Mocked<Partial<ShopifyAPI>>;

  beforeEach(() => {
    mockClient = mockShopifyClient() as jest.Mocked<Partial<ShopifyAPI>>;
    provider = new ShopifyProvider(mockClient as ShopifyAPI);
    jest.clearAllMocks();
  });

  describe('getProductDetails by ID', () => {
    it('should retrieve product details by numeric ID', async () => {
      const mockProduct = createMockShopifyProduct({
        id: 456,
        title: 'Detailed Product',
        vendor: 'Detail Vendor',
        product_type: 'Electronics',
      });

      (mockClient.getProduct as jest.Mock).mockResolvedValue(mockProduct);

      const result = await provider.getProductDetails('456');

      expect(mockClient.getProduct).toHaveBeenCalledWith(456);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('getProductDetails by SKU', () => {
    it('should search by SKU if ID not found', async () => {
      const mockProduct = createMockShopifyProduct({
        id: 789,
        title: 'SKU Detail Product',
        variants: [
          {
            id: 5,
            product_id: 789,
            title: 'Variant',
            sku: 'DETAIL-SKU-789',
            price: '149.99',
            inventory_quantity: 10,
            inventory_management: 'shopify',
            inventory_policy: 'deny',
            position: 1,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            taxable: true,
            barcode: '',
            grams: 0,
            image_id: null,
            weight: 0,
            weight_unit: 'lb',
            requires_shipping: true,
            old_inventory_quantity: 10,
            fulfillment_service: 'manual',
            compare_at_price: null,
            option1: null,
            option2: null,
            option3: null,
          },
        ],
      });

      (mockClient.getProducts as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await provider.getProductDetails('DETAIL-SKU-789');

      expect(mockClient.getProducts).toHaveBeenCalledWith({ limit: 250 });
      expect(result?.title).toBe('SKU Detail Product');
    });

    it('should match product by variant SKU', async () => {
      const targetProduct = createMockShopifyProduct({
        id: 101,
        title: 'Multi-Variant Product',
        variants: [
          {
            id: 10,
            product_id: 101,
            title: 'Red Variant',
            sku: 'MULTI-RED',
            price: '99.99',
            inventory_quantity: 20,
            inventory_management: 'shopify',
            inventory_policy: 'deny',
            position: 1,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            taxable: true,
            barcode: '',
            grams: 0,
            image_id: null,
            weight: 0,
            weight_unit: 'lb',
            requires_shipping: true,
            old_inventory_quantity: 20,
            fulfillment_service: 'manual',
            compare_at_price: null,
            option1: 'Red',
            option2: null,
            option3: null,
          },
          {
            id: 11,
            product_id: 101,
            title: 'Blue Variant',
            sku: 'MULTI-BLUE',
            price: '99.99',
            inventory_quantity: 15,
            inventory_management: 'shopify',
            inventory_policy: 'deny',
            position: 2,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            taxable: true,
            barcode: '',
            grams: 0,
            image_id: null,
            weight: 0,
            weight_unit: 'lb',
            requires_shipping: true,
            old_inventory_quantity: 15,
            fulfillment_service: 'manual',
            compare_at_price: null,
            option1: 'Blue',
            option2: null,
            option3: null,
          },
        ],
      });

      (mockClient.getProduct as jest.Mock).mockRejectedValue(
        createOrderNotFoundError()
      );
      (mockClient.getProducts as jest.Mock).mockResolvedValue([targetProduct]);

      const result = await provider.getProductDetails('MULTI-BLUE');

      expect(result?.id).toBe(101);
      expect(result?.title).toBe('Multi-Variant Product');
    });
  });

  describe('error handling', () => {
    it('should return null if product not found by ID or SKU', async () => {
      (mockClient.getProduct as jest.Mock).mockRejectedValue(
        createOrderNotFoundError()
      );
      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      const result = await provider.getProductDetails('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (mockClient.getProduct as jest.Mock).mockRejectedValue(
        createShopifyAPIError('API Error')
      );
      (mockClient.getProducts as jest.Mock).mockRejectedValue(
        createShopifyAPIError('API Error')
      );

      const result = await provider.getProductDetails('123');

      expect(result).toBeNull();
    });
  });
});
