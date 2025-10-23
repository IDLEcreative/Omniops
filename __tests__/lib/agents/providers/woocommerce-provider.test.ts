/**
 * Tests for WooCommerce Provider
 * CRITICAL: E-commerce integration - order lookup and product search
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';

jest.mock('@/lib/woocommerce-dynamic', () => ({
  getDynamicWooCommerceClient: jest.fn(),
}));

describe('WooCommerceProvider', () => {
  let provider: WooCommerceProvider;
  const testDomain = 'test-shop.com';

  beforeEach(() => {
    provider = new WooCommerceProvider(testDomain);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with platform and domain', () => {
      expect(provider.platform).toBe('woocommerce');
    });
  });

  describe('lookupOrder', () => {
    it('should return null if WooCommerce client is unavailable', async () => {
      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(null);

      const result = await provider.lookupOrder('123');

      expect(result).toBeNull();
    });

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

      const mockClient = {
        getOrder: jest.fn().mockResolvedValue(mockOrder),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

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

      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('Not found')),
        getOrders: jest.fn().mockResolvedValue([mockOrder]),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

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

      const mockClient = {
        getOrders: jest.fn().mockResolvedValue([mockOrder]),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('ORD-789');

      expect(mockClient.getOrders).toHaveBeenCalledWith({
        search: 'ORD-789',
        per_page: 1,
      });
      expect(result?.number).toBe('ORD-789');
    });

    it('should return null if order not found', async () => {
      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('Not found')),
        getOrders: jest.fn().mockResolvedValue([]),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('999');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('API Error')),
        getOrders: jest.fn().mockRejectedValue(new Error('API Error')),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

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

      const mockClient = {
        getOrder: jest.fn().mockResolvedValue(mockOrder),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('111');

      expect(result?.trackingNumber).toBe('TRACK123456');
    });
  });

  describe('searchProducts', () => {
    it('should return empty array if WooCommerce client is unavailable', async () => {
      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(null);

      const result = await provider.searchProducts('test');

      expect(result).toEqual([]);
    });

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

      const mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.searchProducts('test', 10);

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'test',
        per_page: 10,
        status: 'publish',
      });
      expect(result).toEqual(mockProducts);
    });

    it('should use default limit of 10', async () => {
      const mockClient = {
        getProducts: jest.fn().mockResolvedValue([]),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

      await provider.searchProducts('query');

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'query',
        per_page: 10,
        status: 'publish',
      });
    });

    it('should respect custom limit', async () => {
      const mockClient = {
        getProducts: jest.fn().mockResolvedValue([]),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

      await provider.searchProducts('query', 25);

      expect(mockClient.getProducts).toHaveBeenCalledWith({
        search: 'query',
        per_page: 25,
        status: 'publish',
      });
    });

    it('should handle search errors gracefully', async () => {
      const mockClient = {
        getProducts: jest.fn().mockRejectedValue(new Error('API Error')),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.searchProducts('test');

      expect(result).toEqual([]);
    });

    it('should only search published products', async () => {
      const mockClient = {
        getProducts: jest.fn().mockResolvedValue([]),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

      await provider.searchProducts('test');

      expect(mockClient.getProducts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'publish',
        })
      );
    });
  });

  describe('checkStock', () => {
    it('should retrieve product stock information', async () => {
      const mockProduct = {
        id: 123,
        name: 'Test Product',
        stock_status: 'instock',
        stock_quantity: 50,
        manage_stock: true
      };

      const mockClient = {
        getProduct: jest.fn().mockResolvedValue(mockProduct),
      };

      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.checkStock('123');

      expect(result).toEqual(mockProduct);
    });

    it('should return null if client unavailable', async () => {
      (getDynamicWooCommerceClient as jest.Mock).mockResolvedValue(null);

      const result = await provider.checkStock('123');

      expect(result).toBeNull();
    });
  });
});
