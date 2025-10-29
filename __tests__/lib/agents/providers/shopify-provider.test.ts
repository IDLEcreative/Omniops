/**
 * Tests for Shopify Provider
 * CRITICAL: E-commerce integration - order lookup and product search
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';
import type { ShopifyAPI } from '@/lib/shopify-api';
import {
  mockShopifyClient,
  createMockShopifyOrder,
  createMockShopifyProduct,
  createOrderNotFoundError,
  createShopifyAPIError,
} from '@/test-utils/shopify-test-helpers';

describe('ShopifyProvider', () => {
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

  describe('lookupOrder', () => {
    it('should lookup order by numeric ID', async () => {
      const mockOrder = createMockShopifyOrder({
        id: 123,
        order_number: 123,
        name: '#123',
        email: 'customer@example.com',
        total_price: '99.99',
        financial_status: 'paid',
      });

      (mockClient.getOrder as jest.Mock).mockResolvedValue(mockOrder);

      const result = await provider.lookupOrder('123');

      expect(mockClient.getOrder).toHaveBeenCalledWith(123);
      expect(result).toEqual({
        id: 123,
        number: '#123',
        status: 'paid',
        date: '2025-01-01T00:00:00Z',
        total: '99.99',
        currency: 'USD',
        items: expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Product',
            quantity: 1,
            total: '99.99',
          }),
        ]),
        billing: expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          email: 'customer@example.com',
        }),
        shipping: expect.any(Object),
        trackingNumber: null,
        permalink: null,
      });
    });

    it('should search for order by email if ID lookup fails', async () => {
      const mockOrder = createMockShopifyOrder({
        id: 456,
        order_number: 456,
        name: '#456',
        email: 'jane@example.com',
        total_price: '49.99',
      });

      (mockClient.getOrder as jest.Mock).mockRejectedValue(
        createOrderNotFoundError()
      );
      (mockClient.getOrders as jest.Mock).mockResolvedValue([mockOrder]);

      const result = await provider.lookupOrder('999', 'jane@example.com');

      expect(mockClient.getOrder).toHaveBeenCalledWith(999);
      expect(mockClient.getOrders).toHaveBeenCalledWith({
        limit: 1,
        status: 'any',
      });
      expect(result?.id).toBe(456);
      expect(result?.billing?.email).toBe('jane@example.com');
    });

    it('should search by order name if not found by ID', async () => {
      const mockOrder = createMockShopifyOrder({
        id: 789,
        order_number: 789,
        name: '#789',
        email: 'test@example.com',
      });

      (mockClient.getOrder as jest.Mock).mockRejectedValue(
        createOrderNotFoundError()
      );
      (mockClient.getOrders as jest.Mock).mockResolvedValue([mockOrder]);

      const result = await provider.lookupOrder('#789');

      expect(mockClient.getOrders).toHaveBeenCalledWith({
        limit: 50,
        status: 'any',
      });
      expect(result?.number).toBe('#789');
    });

    it('should match order by name with # prefix', async () => {
      const mockOrder = createMockShopifyOrder({
        id: 999,
        order_number: 999,
        name: '#999',
        email: 'test@example.com',
      });

      (mockClient.getOrder as jest.Mock).mockRejectedValue(
        createOrderNotFoundError()
      );
      (mockClient.getOrders as jest.Mock).mockResolvedValue([mockOrder]);

      const result = await provider.lookupOrder('999');

      expect(result?.number).toBe('#999');
    });

    it('should return null if order not found', async () => {
      (mockClient.getOrder as jest.Mock).mockRejectedValue(
        createOrderNotFoundError()
      );
      (mockClient.getOrders as jest.Mock).mockResolvedValue([]);

      const result = await provider.lookupOrder('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully and return null', async () => {
      (mockClient.getOrder as jest.Mock).mockRejectedValue(
        createShopifyAPIError('API Error')
      );
      (mockClient.getOrders as jest.Mock).mockRejectedValue(
        createShopifyAPIError('API Error')
      );

      const result = await provider.lookupOrder('123');

      expect(result).toBeNull();
    });

    it('should convert order to standard OrderInfo format', async () => {
      const mockOrder = createMockShopifyOrder({
        id: 111,
        order_number: 111,
        name: '#111',
        email: 'john@example.com',
        total_price: '199.99',
        currency: 'CAD',
        financial_status: 'authorized',
      });

      (mockClient.getOrder as jest.Mock).mockResolvedValue(mockOrder);

      const result = await provider.lookupOrder('111');

      expect(result?.id).toBe(111);
      expect(result?.number).toBe('#111');
      expect(result?.status).toBe('authorized');
      expect(result?.total).toBe('199.99');
      expect(result?.currency).toBe('CAD');
    });

    it('should handle orders without billing address', async () => {
      const mockOrder = createMockShopifyOrder({
        id: 222,
        billing_address: null,
      });

      (mockClient.getOrder as jest.Mock).mockResolvedValue(mockOrder);

      const result = await provider.lookupOrder('222');

      expect(result?.billing).toBeUndefined();
    });

    it('should handle orders without line items', async () => {
      const mockOrder = createMockShopifyOrder({
        id: 333,
        line_items: [],
      });

      (mockClient.getOrder as jest.Mock).mockResolvedValue(mockOrder);

      const result = await provider.lookupOrder('333');

      expect(result?.items).toEqual([]);
    });
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

  describe('checkStock', () => {
    it('should retrieve product stock by numeric ID', async () => {
      const mockProduct = createMockShopifyProduct({
        id: 123,
        title: 'Stock Test Product',
        variants: [
          {
            id: 1,
            product_id: 123,
            title: 'Default Variant',
            sku: 'SKU-123',
            price: '99.99',
            inventory_quantity: 50,
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
            old_inventory_quantity: 50,
            fulfillment_service: 'manual',
            compare_at_price: null,
            option1: null,
            option2: null,
            option3: null,
          },
        ],
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

    it('should find product by SKU if ID not found', async () => {
      const mockProduct = createMockShopifyProduct({
        id: 456,
        title: 'SKU Search Product',
        variants: [
          {
            id: 2,
            product_id: 456,
            title: 'Variant',
            sku: 'UNIQUE-SKU-456',
            price: '49.99',
            inventory_quantity: 25,
            inventory_management: 'shopify',
            inventory_policy: 'continue',
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
            old_inventory_quantity: 25,
            fulfillment_service: 'manual',
            compare_at_price: null,
            option1: null,
            option2: null,
            option3: null,
          },
        ],
      });

      (mockClient.getProducts as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await provider.checkStock('UNIQUE-SKU-456');

      expect(mockClient.getProducts).toHaveBeenCalledWith({ limit: 250 });
      expect(result?.sku).toBe('UNIQUE-SKU-456');
      expect(result?.backorders).toBe('yes');
    });

    it('should return null if product not found', async () => {
      (mockClient.getProduct as jest.Mock).mockRejectedValue(
        createOrderNotFoundError()
      );
      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      const result = await provider.checkStock('nonexistent');

      expect(result).toBeNull();
    });

    it('should return out of stock status', async () => {
      const mockProduct = createMockShopifyProduct({
        id: 789,
        variants: [
          {
            id: 3,
            product_id: 789,
            title: 'Out of Stock Variant',
            sku: 'OUT-OF-STOCK',
            price: '29.99',
            inventory_quantity: 0,
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
            old_inventory_quantity: 0,
            fulfillment_service: 'manual',
            compare_at_price: null,
            option1: null,
            option2: null,
            option3: null,
          },
        ],
      });

      (mockClient.getProduct as jest.Mock).mockResolvedValue(mockProduct);

      const result = await provider.checkStock('789');

      expect(result?.stockStatus).toBe('outofstock');
      expect(result?.stockQuantity).toBe(0);
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

  describe('getProductDetails', () => {
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

  describe('integration scenarios', () => {
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
