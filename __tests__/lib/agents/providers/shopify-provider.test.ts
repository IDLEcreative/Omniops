/**
 * Tests for Shopify Commerce Provider
 * CRITICAL: Shopify integration for order lookup and product search
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';
import type { OrderInfo } from '@/lib/agents/commerce-provider';

// Mock the Shopify dynamic client
jest.mock('@/lib/shopify-dynamic', () => ({
  getDynamicShopifyClient: jest.fn()
}));

import { getDynamicShopifyClient } from '@/lib/shopify-dynamic';

describe('ShopifyProvider', () => {
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

  describe('lookupOrder', () => {
    it('should return null if Shopify client not available', async () => {
      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(null);

      const result = await provider.lookupOrder('123');

      expect(result).toBeNull();
      expect(getDynamicShopifyClient).toHaveBeenCalledWith(mockDomain);
    });

    it('should lookup order by numeric ID', async () => {
      const mockOrder = {
        id: 123,
        name: '#1001',
        financial_status: 'paid',
        created_at: '2025-01-01T00:00:00Z',
        total_price: '99.99',
        currency: 'USD',
        email: 'customer@example.com',
        line_items: [
          { title: 'Product A', quantity: 2, price: '49.99' }
        ],
        billing_address: {
          first_name: 'John',
          last_name: 'Doe'
        },
        shipping_address: { address1: '123 Main St' }
      };

      const mockClient = {
        getOrder: jest.fn().mockResolvedValue(mockOrder),
        getOrders: jest.fn()
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('123');

      expect(result).toEqual({
        id: 123,
        number: '#1001',
        status: 'paid',
        date: '2025-01-01T00:00:00Z',
        total: '99.99',
        currency: 'USD',
        items: [{ name: 'Product A', quantity: 2, total: '49.99' }],
        billing: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'customer@example.com'
        },
        shipping: { address1: '123 Main St' },
        trackingNumber: null,
        permalink: null
      });

      expect(mockClient.getOrder).toHaveBeenCalledWith(123);
    });

    it('should search by email if ID lookup fails', async () => {
      const mockOrders = [
        {
          id: 456,
          name: '#1002',
          email: 'search@example.com',
          financial_status: 'pending',
          created_at: '2025-01-02',
          total_price: '150.00',
          currency: 'USD',
          line_items: []
        }
      ];

      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('Not found')),
        getOrders: jest.fn().mockResolvedValue(mockOrders)
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('999', 'search@example.com');

      expect(result).toBeDefined();
      expect(result?.number).toBe('#1002');
      expect(result?.status).toBe('pending');
    });

    it('should search by order name if ID and email fail', async () => {
      const mockOrders = [
        {
          id: 789,
          name: '#1003',
          order_number: 1003,
          email: 'other@example.com',
          financial_status: 'refunded',
          created_at: '2025-01-03',
          total_price: '200.00',
          currency: 'EUR',
          line_items: []
        }
      ];

      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('Not found')),
        getOrders: jest.fn().mockResolvedValue(mockOrders)
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('1003');

      expect(result).toBeDefined();
      expect(result?.number).toBe('#1003');
      expect(result?.total).toBe('200.00');
    });

    it('should match order name with # prefix', async () => {
      const mockOrders = [
        {
          id: 100,
          name: '#1001',
          order_number: 1001,
          financial_status: 'paid',
          created_at: '2025-01-01',
          total_price: '50.00',
          currency: 'USD',
          line_items: []
        }
      ];

      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('Not found')),
        getOrders: jest.fn().mockResolvedValue(mockOrders)
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('#1001');

      expect(result).toBeDefined();
      expect(result?.number).toBe('#1001');
    });

    it('should return null if order not found', async () => {
      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('Not found')),
        getOrders: jest.fn().mockResolvedValue([])
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle missing billing address', async () => {
      const mockOrder = {
        id: 200,
        name: '#2000',
        financial_status: 'paid',
        created_at: '2025-01-01',
        total_price: '75.00',
        currency: 'GBP',
        email: 'nobilling@example.com',
        line_items: [],
        billing_address: null,
        shipping_address: null
      };

      const mockClient = {
        getOrder: jest.fn().mockResolvedValue(mockOrder)
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('200');

      expect(result?.billing).toBeUndefined();
      expect(result?.shipping).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockClient = {
        getOrder: jest.fn().mockRejectedValue(new Error('API Error'))
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('error');

      expect(result).toBeNull();
    });
  });

  describe('searchProducts', () => {
    it('should return empty array if client not available', async () => {
      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(null);

      const result = await provider.searchProducts('test');

      expect(result).toEqual([]);
    });

    it('should search products successfully', async () => {
      const mockProducts = [
        { id: 1, title: 'Product 1', variants: [] },
        { id: 2, title: 'Product 2', variants: [] }
      ];

      const mockClient = {
        searchProducts: jest.fn().mockResolvedValue(mockProducts)
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.searchProducts('test query', 10);

      expect(result).toEqual(mockProducts);
      expect(mockClient.searchProducts).toHaveBeenCalledWith('test query', 10);
    });

    it('should use default limit of 10', async () => {
      const mockClient = {
        searchProducts: jest.fn().mockResolvedValue([])
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      await provider.searchProducts('query');

      expect(mockClient.searchProducts).toHaveBeenCalledWith('query', 10);
    });

    it('should handle search errors gracefully', async () => {
      const mockClient = {
        searchProducts: jest.fn().mockRejectedValue(new Error('Search failed'))
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.searchProducts('error');

      expect(result).toEqual([]);
    });
  });

  describe('checkStock', () => {
    it('should return null if client not available', async () => {
      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(null);

      const result = await provider.checkStock('SKU123');

      expect(result).toBeNull();
    });

    it('should check stock by product ID', async () => {
      const mockProduct = {
        id: 100,
        title: 'Test Product',
        variants: [
          {
            id: 1,
            sku: 'SKU-001',
            inventory_quantity: 50,
            inventory_management: 'shopify',
            inventory_policy: 'deny'
          }
        ]
      };

      const mockClient = {
        getProduct: jest.fn().mockResolvedValue(mockProduct),
        getProducts: jest.fn()
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.checkStock('100');

      expect(result).toEqual({
        productName: 'Test Product',
        sku: 'SKU-001',
        stockStatus: 'instock',
        stockQuantity: 50,
        manageStock: true,
        backorders: 'no'
      });
    });

    it('should check stock by SKU', async () => {
      const mockProducts = [
        {
          id: 200,
          title: 'SKU Product',
          variants: [
            {
              id: 2,
              sku: 'CUSTOM-SKU',
              inventory_quantity: 0,
              inventory_management: null,
              inventory_policy: 'continue'
            }
          ]
        }
      ];

      const mockClient = {
        getProduct: jest.fn().mockRejectedValue(new Error('Not found')),
        getProducts: jest.fn().mockResolvedValue(mockProducts)
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.checkStock('CUSTOM-SKU');

      expect(result).toEqual({
        productName: 'SKU Product',
        sku: 'CUSTOM-SKU',
        stockStatus: 'outofstock',
        stockQuantity: 0,
        manageStock: false,
        backorders: 'yes'
      });
    });

    it('should return null if product not found', async () => {
      const mockClient = {
        getProduct: jest.fn().mockRejectedValue(new Error('Not found')),
        getProducts: jest.fn().mockResolvedValue([])
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.checkStock('NOTFOUND');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockClient = {
        getProduct: jest.fn().mockRejectedValue(new Error('API Error'))
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.checkStock('error');

      expect(result).toBeNull();
    });
  });

  describe('getProductDetails', () => {
    it('should return null if client not available', async () => {
      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(null);

      const result = await provider.getProductDetails('123');

      expect(result).toBeNull();
    });

    it('should get product by numeric ID', async () => {
      const mockProduct = {
        id: 300,
        title: 'Detailed Product',
        description: 'Full details',
        variants: []
      };

      const mockClient = {
        getProduct: jest.fn().mockResolvedValue(mockProduct)
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.getProductDetails('300');

      expect(result).toEqual(mockProduct);
      expect(mockClient.getProduct).toHaveBeenCalledWith(300);
    });

    it('should search by SKU if ID is not numeric', async () => {
      const mockProducts = [
        {
          id: 400,
          title: 'SKU Product',
          variants: [{ sku: 'DETAIL-SKU' }]
        }
      ];

      const mockClient = {
        getProducts: jest.fn().mockResolvedValue(mockProducts)
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.getProductDetails('DETAIL-SKU');

      expect(result).toEqual(mockProducts[0]);
    });

    it('should return null if product not found', async () => {
      const mockClient = {
        getProducts: jest.fn().mockResolvedValue([])
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.getProductDetails('NOTFOUND');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockClient = {
        getProduct: jest.fn().mockRejectedValue(new Error('Failed'))
      };

      (getDynamicShopifyClient as jest.Mock).mockResolvedValue(mockClient);

      const result = await provider.getProductDetails('error');

      expect(result).toBeNull();
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
});
