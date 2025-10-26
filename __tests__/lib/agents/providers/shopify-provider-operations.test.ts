/**
 * Shopify Provider Operations Tests
 * Tests CRUD operations for orders and products
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Create mock function BEFORE imports (Jest hoisting)
const mockGetDynamicShopifyClient = jest.fn();

// Mock the shopify-dynamic module
jest.mock('@/lib/shopify-dynamic', () => ({
  getDynamicShopifyClient: (...args: any[]) => mockGetDynamicShopifyClient(...args),
  searchProductsDynamic: jest.fn().mockResolvedValue([])
}));

import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';

describe('ShopifyProvider - Operations', () => {
  let provider: ShopifyProvider;
  const mockDomain = 'test-shop.myshopify.com';

  beforeEach(() => {
    provider = new ShopifyProvider(mockDomain);
    jest.clearAllMocks();
  });

  describe('lookupOrder', () => {
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
        getOrder: jest.fn().mockResolvedValue(mockOrder)
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

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

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

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

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('1003');

      expect(result).toBeDefined();
      expect(result?.number).toBe('#1003');
      expect(result?.total).toBe('200.00');
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

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.lookupOrder('200');

      expect(result?.billing).toBeUndefined();
      expect(result?.shipping).toBeNull();
    });
  });

  describe('searchProducts', () => {
    it('should search products successfully', async () => {
      const mockProducts = [
        { id: 1, title: 'Product 1', variants: [] },
        { id: 2, title: 'Product 2', variants: [] }
      ];

      const mockClient = {
        searchProducts: jest.fn().mockResolvedValue(mockProducts)
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.searchProducts('test query', 10);

      expect(result).toEqual(mockProducts);
      expect(mockClient.searchProducts).toHaveBeenCalledWith('test query', 10);
    });

  });

  describe('checkStock', () => {
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
        getProduct: jest.fn().mockResolvedValue(mockProduct)
      };

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

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

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

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
  });

  describe('getProductDetails', () => {
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

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

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

      mockGetDynamicShopifyClient.mockResolvedValue(mockClient);

      const result = await provider.getProductDetails('DETAIL-SKU');

      expect(result).toEqual(mockProducts[0]);
    });
  });
});
