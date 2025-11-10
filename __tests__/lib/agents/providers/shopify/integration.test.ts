/**
 * Shopify Provider - Integration Tests
 * Tests for constructor and cross-functional integration scenarios
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';
import type { ShopifyAPI } from '@/lib/shopify-api';
import {
  mockShopifyClient,
  createMockShopifyOrder,
  createMockShopifyProduct,
} from '@/test-utils/shopify-test-helpers';

describe('ShopifyProvider - Integration', () => {
  let provider: ShopifyProvider;
  let mockClient: jest.Mocked<Partial<ShopifyAPI>>;

  beforeEach(() => {
    mockClient = mockShopifyClient() as jest.Mocked<Partial<ShopifyAPI>>;
    provider = new ShopifyProvider(mockClient as ShopifyAPI);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with platform name', () => {
      expect(provider.platform).toBe('shopify');
    });
  });

  describe('multi-product searches', () => {
    it('should handle multi-product searches with mixed results', async () => {
      const products = [
        createMockShopifyProduct({ id: 1, title: 'Widget A' }),
        createMockShopifyProduct({ id: 2, title: 'Widget B' }),
        createMockShopifyProduct({ id: 3, title: 'Widget C' }),
      ];

      (mockClient.searchProducts as jest.Mock).mockResolvedValue(products);

      const result = await provider.searchProducts('widget', 10);

      expect(result).toHaveLength(3);
      expect(result[0].title).toBe('Widget A');
    });
  });

  describe('complex orders', () => {
    it('should handle order with multiple line items', async () => {
      const mockOrder = createMockShopifyOrder({
        id: 1,
        line_items: [
          {
            id: 1,
            product_id: 100,
            title: 'Product 1',
            quantity: 2,
            price: '49.99',
            sku: 'SKU-1',
            variant_id: 1,
            variant_title: 'Variant 1',
            vendor: 'Vendor 1',
            fulfillment_service: 'manual',
            fulfillment_status: null,
            fulfillment_line_item_id: null,
            grams: 0,
            product_exists: true,
            requires_shipping: true,
            tax_lines: [],
            properties: [],
            gift_card: false,
            taxable: true,
            image: null,
          },
          {
            id: 2,
            product_id: 101,
            title: 'Product 2',
            quantity: 1,
            price: '99.99',
            sku: 'SKU-2',
            variant_id: 2,
            variant_title: 'Variant 2',
            vendor: 'Vendor 2',
            fulfillment_service: 'manual',
            fulfillment_status: null,
            fulfillment_line_item_id: null,
            grams: 0,
            product_exists: true,
            requires_shipping: true,
            tax_lines: [],
            properties: [],
            gift_card: false,
            taxable: true,
            image: null,
          },
        ],
      });

      (mockClient.getOrder as jest.Mock).mockResolvedValue(mockOrder);

      const result = await provider.lookupOrder('1');

      expect(result?.items).toHaveLength(2);
      expect(result?.items[0].quantity).toBe(2);
      expect(result?.items[1].quantity).toBe(1);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent operations without cross-contamination', async () => {
      const order1 = createMockShopifyOrder({ id: 1, order_number: 1 });
      const order2 = createMockShopifyOrder({ id: 2, order_number: 2 });

      (mockClient.getOrder as jest.Mock)
        .mockResolvedValueOnce(order1)
        .mockResolvedValueOnce(order2);

      const [result1, result2] = await Promise.all([
        provider.lookupOrder('1'),
        provider.lookupOrder('2'),
      ]);

      expect(result1?.id).toBe(1);
      expect(result2?.id).toBe(2);
    });
  });
});
