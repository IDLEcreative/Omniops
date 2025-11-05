/**
 * Tests for WooCommerce Provider
 * CRITICAL: E-commerce integration - order lookup and product search
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';

describe('WooCommerceProvider', () => {
  let provider: WooCommerceProvider;
  let mockClient: jest.Mocked<Partial<WooCommerceAPI>>;

  beforeEach(() => {
    mockClient = {
      getOrder: jest.fn(),
      getOrders: jest.fn(),
      getProducts: jest.fn(),
      getProduct: jest.fn(),
    } as jest.Mocked<Partial<WooCommerceAPI>>;

    provider = new WooCommerceProvider(mockClient as WooCommerceAPI);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with platform', () => {
      expect(provider.platform).toBe('woocommerce');
    });
  });

  describe('lookupOrder', () => {
    it('should lookup order by numeric ID', async () => {
      const mockOrder = {
        id: 123,
        number: '123',
        status: 'completed',
        date_created: '2025-01-01T00:00:00',
        total: '99.99',
        currency: 'USD',
        line_items: [
          {
            name: 'Test Product',
            quantity: 2,
            total: '99.99'
          }
        ],
        billing: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        },
        shipping: {
          address_1: '123 Main St'
        }
      };

      (mockClient.getOrder as jest.Mock).mockResolvedValue(mockOrder);

      const result = await provider.lookupOrder('123');

      expect(result).toEqual({
        id: 123,
        number: '123',
        status: 'completed',
        date: '2025-01-01T00:00:00',
        total: '99.99',
        currency: 'USD',
        items: [
          {
            name: 'Test Product',
            quantity: 2,
            total: '99.99'
          }
        ],
        billing: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com'
        },
        shipping: {
          address_1: '123 Main St'
        },
        trackingNumber: null,
        permalink: null
      });
    });

    it('should search for order by email if ID lookup fails', async () => {
      const mockOrder = {
        id: 456,
        number: '456',
        status: 'processing',
        date_created: '2025-01-02T00:00:00',
        total: '49.99',
        currency: 'USD',
        line_items: [],
        billing: {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com'
        }
      };

      (mockClient.getOrder as jest.Mock).mockRejectedValue(new Error('Not found'));
      (mockClient.getOrders as jest.Mock).mockResolvedValue([mockOrder]);

      const result = await provider.lookupOrder('999', 'jane@example.com');

      expect(mockClient.getOrders).toHaveBeenCalledWith({
        search: 'jane@example.com',
        per_page: 1,
      });
      expect(result?.id).toBe(456);
    });

    it('should search by order ID if not numeric', async () => {
      const mockOrder = {
        id: 789,
        number: 'ORD-789',
        status: 'completed',
        date_created: '2025-01-03T00:00:00',
        total: '199.99',
        currency: 'USD',
        line_items: []
      };

      (mockClient.getOrders as jest.Mock).mockResolvedValue([mockOrder]);

      const result = await provider.lookupOrder('ORD-789');

      expect(mockClient.getOrders).toHaveBeenCalledWith({
        search: 'ORD-789',
        per_page: 1,
      });
      expect(result?.number).toBe('ORD-789');
    });

    it('should return null if order not found', async () => {
      (mockClient.getOrder as jest.Mock).mockRejectedValue(new Error('Not found'));
      (mockClient.getOrders as jest.Mock).mockResolvedValue([]);

      const result = await provider.lookupOrder('999');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (mockClient.getOrder as jest.Mock).mockRejectedValue(new Error('API Error'));
      (mockClient.getOrders as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await provider.lookupOrder('123');

      expect(result).toBeNull();
    });

    it('should include tracking number if available', async () => {
      const mockOrder = {
        id: 111,
        number: '111',
        status: 'shipped',
        date_created: '2025-01-04T00:00:00',
        total: '79.99',
        currency: 'USD',
        line_items: [],
        shipping: {
          tracking_number: 'TRACK123456'
        }
      };

      (mockClient.getOrder as jest.Mock).mockResolvedValue(mockOrder);

      const result = await provider.lookupOrder('111');

      expect(result?.trackingNumber).toBe('TRACK123456');
    });
  });

  describe('searchProducts', () => {
    it('should search products by query', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Test Product 1',
          price: '29.99',
          status: 'publish'
        },
        {
          id: 2,
          name: 'Test Product 2',
          price: '39.99',
          status: 'publish'
        }
      ];

      (mockClient.getProducts as jest.Mock).mockResolvedValue(mockProducts);

      const result = await provider.searchProducts('test', 10);

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'test',
        per_page: 10,
        status: 'publish',
      });
      expect(result).toEqual(mockProducts);
    });

    it('should use default limit of 10', async () => {
      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      await provider.searchProducts('query');

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'query',
        per_page: 10,
        status: 'publish',
      });
    });

    it('should respect custom limit', async () => {
      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      await provider.searchProducts('query', 25);

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'query',
        per_page: 25,
        status: 'publish',
      });
    });

    it('should handle search errors gracefully', async () => {
      (mockClient.getProducts as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await provider.searchProducts('test');

      expect(result).toEqual([]);
    });

    it('should only search published products', async () => {
      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      await provider.searchProducts('test');

      expect(mockClient.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'publish',
        })
      );
    });
  });

  describe('checkStock', () => {
    it('should retrieve product stock information by SKU', async () => {
      const mockProduct = {
        id: 123,
        name: 'Test Product',
        sku: 'SKU123',
        stock_status: 'instock',
        stock_quantity: 50,
        manage_stock: true,
        backorders: 'no'
      };

      (mockClient.getProducts as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await provider.checkStock('SKU123');

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        sku: 'SKU123',
        per_page: 1
      });
      expect(result).toEqual({
        productName: 'Test Product',
        sku: 'SKU123',
        stockStatus: 'instock',
        stockQuantity: 50,
        manageStock: true,
        backorders: 'no'
      });
    });

    it('should return null if product not found', async () => {
      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      const result = await provider.checkStock('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (mockClient.getProducts as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await provider.checkStock('SKU123');

      expect(result).toBeNull();
    });
  });

  describe('getProductDetails', () => {
    it('should retrieve product details by SKU when SKU match found', async () => {
      const mockProduct = {
        id: 456,
        name: 'Detailed Product',
        sku: 'DETAIL-SKU',
        price: '99.99',
        description: 'Product description'
      };

      (mockClient.getProducts as jest.Mock).mockResolvedValue([mockProduct]);

      const result = await provider.getProductDetails('DETAIL-SKU');

      // Should try SKU search first
      expect(mockClient.getProducts).toHaveBeenCalledWith({
        sku: 'DETAIL-SKU',
        per_page: 1
      });
      // Should not fall back to name search if SKU found
      expect(mockClient.getProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProduct);
    });

    it('should fallback to name search when SKU search returns no results', async () => {
      const mockProduct = {
        id: 789,
        name: '10mtr extension cables for all TS Camera systems',
        sku: 'CABLE-10M',
        price: '45.00',
        description: 'Extension cable'
      };

      // First call (SKU search) returns empty, second call (name search) returns product
      (mockClient.getProducts as jest.Mock)
        .mockResolvedValueOnce([])  // SKU search fails
        .mockResolvedValueOnce([mockProduct]);  // Name search succeeds

      const result = await provider.getProductDetails('10mtr extension cables for all TS Camera systems');

      // Should try SKU search first
      expect(mockClient.getProducts).toHaveBeenNthCalledWith(1, {
        sku: '10mtr extension cables for all TS Camera systems',
        per_page: 1
      });
      // Should fallback to name search
      expect(mockClient.getProducts).toHaveBeenNthCalledWith(2, {
        search: '10mtr extension cables for all TS Camera systems',
        per_page: 1,
        status: 'publish'
      });
      expect(mockClient.getProducts).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockProduct);
    });

    it('should return null if both SKU and name search fail', async () => {
      (mockClient.getProducts as jest.Mock).mockResolvedValue([]);

      const result = await provider.getProductDetails('NONEXISTENT');

      // Should try SKU search, name search, and catalog fetch for fuzzy matching
      expect(mockClient.getProducts).toHaveBeenCalledTimes(3);
      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      (mockClient.getProducts as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await provider.getProductDetails('DETAIL-SKU');

      expect(result).toBeNull();
    });

    it('should prioritize SKU match over name match for ambiguous queries', async () => {
      const skuProduct = {
        id: 111,
        name: 'Different Product',
        sku: 'PUMP-123',
        price: '100.00'
      };

      (mockClient.getProducts as jest.Mock).mockResolvedValue([skuProduct]);

      const result = await provider.getProductDetails('PUMP-123');

      // Should find by SKU and NOT fallback to name search
      expect(mockClient.getProducts).toHaveBeenCalledTimes(1);
      expect(mockClient.getProducts).toHaveBeenCalledWith({
        sku: 'PUMP-123',
        per_page: 1
      });
      expect(result).toEqual(skuProduct);
    });
  });
});
