/**
 * Shopify Provider Tests
 * Comprehensive tests for ShopifyProvider commerce integration
 */

import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';
import type { ShopifyAPI } from '@/lib/shopify-api';

describe('ShopifyProvider', () => {
  let provider: ShopifyProvider;
  let mockClient: jest.Mocked<ShopifyAPI>;

  beforeEach(() => {
    mockClient = {
      getOrder: jest.fn(),
      getOrders: jest.fn(),
      getProduct: jest.fn(),
      getProducts: jest.fn(),
      searchProducts: jest.fn(),
    } as any;

    provider = new ShopifyProvider(mockClient);
  });

  describe('Initialization', () => {
    it('should initialize with correct platform', () => {
      expect(provider.platform).toBe('shopify');
    });

    it('should implement CommerceProvider interface', () => {
      expect(typeof provider.lookupOrder).toBe('function');
      expect(typeof provider.searchProducts).toBe('function');
      expect(typeof provider.checkStock).toBe('function');
      expect(typeof provider.getProductDetails).toBe('function');
    });
  });

  describe('lookupOrder()', () => {
    const mockOrder = {
      id: 1001,
      name: '#1001',
      order_number: 1001,
      email: 'customer@example.com',
      created_at: '2025-01-01T00:00:00Z',
      total_price: '99.99',
      currency: 'USD',
      financial_status: 'paid',
      line_items: [
        {
          id: 1,
          title: 'Test Product',
          quantity: 2,
          price: '49.99',
        },
      ],
      billing_address: {
        first_name: 'John',
        last_name: 'Doe',
      },
      shipping_address: {
        address1: '123 Main St',
        city: 'Portland',
        province: 'OR',
        zip: '97201',
      },
    };

    describe('By Numeric ID', () => {
      it('should find order by numeric ID', async () => {
        mockClient.getOrder.mockResolvedValueOnce(mockOrder as any);

        const result = await provider.lookupOrder('1001');

        expect(mockClient.getOrder).toHaveBeenCalledWith(1001);
        expect(result).not.toBeNull();
        expect(result?.id).toBe(1001);
        expect(result?.number).toBe('#1001');
      });

      it('should handle order not found by ID', async () => {
        mockClient.getOrder.mockRejectedValueOnce(new Error('Not found'));
        mockClient.getOrders.mockResolvedValueOnce([]);

        const result = await provider.lookupOrder('9999');

        expect(result).toBeNull();
      });
    });

    describe('By Email', () => {
      it('should find order by email when ID lookup fails', async () => {
        mockClient.getOrder.mockRejectedValueOnce(new Error('Not found'));
        mockClient.getOrders.mockResolvedValueOnce([mockOrder] as any);

        const result = await provider.lookupOrder('1001', 'customer@example.com');

        expect(mockClient.getOrders).toHaveBeenCalled();
        expect(result).not.toBeNull();
        expect(result?.id).toBe(1001);
      });

      it('should filter orders by email client-side', async () => {
        const orders = [
          { ...mockOrder, id: 1, email: 'other@example.com' },
          { ...mockOrder, id: 2, email: 'customer@example.com' },
        ];

        mockClient.getOrder.mockRejectedValueOnce(new Error('Not found'));
        mockClient.getOrders.mockResolvedValueOnce(orders as any);

        const result = await provider.lookupOrder('1001', 'customer@example.com');

        expect(result).not.toBeNull();
        expect(result?.id).toBe(2);
      });

      it('should return null if email does not match', async () => {
        mockClient.getOrder.mockRejectedValueOnce(new Error('Not found'));
        mockClient.getOrders.mockResolvedValueOnce([
          { ...mockOrder, email: 'other@example.com' },
        ] as any);

        const result = await provider.lookupOrder('1001', 'customer@example.com');

        expect(result).toBeNull();
      });
    });

    describe('By Order Name/Number', () => {
      it('should find order by exact name match', async () => {
        mockClient.getOrder.mockRejectedValueOnce(new Error('Not found'));
        // Only one call - name search (no email provided so email search is skipped)
        mockClient.getOrders.mockResolvedValueOnce([mockOrder] as any);

        const result = await provider.lookupOrder('#1001');

        expect(result).not.toBeNull();
        expect(result?.number).toBe('#1001');
      });

      it('should find order by number without hash', async () => {
        mockClient.getOrder.mockRejectedValueOnce(new Error('Not found'));
        mockClient.getOrders.mockResolvedValueOnce([mockOrder] as any);

        const result = await provider.lookupOrder('1001');

        expect(result).not.toBeNull();
      });

      it('should find order by adding hash prefix', async () => {
        mockClient.getOrder.mockRejectedValueOnce(new Error('Not found'));
        mockClient.getOrders.mockResolvedValueOnce([{ ...mockOrder, name: '#1001' }] as any);

        const result = await provider.lookupOrder('1001');

        expect(result).not.toBeNull();
      });

      it('should find order by order_number field', async () => {
        mockClient.getOrder.mockRejectedValueOnce(new Error('Not found'));
        mockClient.getOrders.mockResolvedValueOnce([
          { ...mockOrder, name: '#ABC', order_number: 1001 },
        ] as any);

        const result = await provider.lookupOrder('1001');

        expect(result).not.toBeNull();
      });
    });

    describe('OrderInfo Conversion', () => {
      it('should convert to standard OrderInfo format', async () => {
        mockClient.getOrder.mockResolvedValueOnce(mockOrder as any);

        const result = await provider.lookupOrder('1001');

        expect(result).toMatchObject({
          id: 1001,
          number: '#1001',
          status: 'paid',
          date: '2025-01-01T00:00:00Z',
          total: '99.99',
          currency: 'USD',
        });
      });

      it('should convert line items correctly', async () => {
        mockClient.getOrder.mockResolvedValueOnce(mockOrder as any);

        const result = await provider.lookupOrder('1001');

        expect(result?.items).toHaveLength(1);
        expect(result?.items[0]).toMatchObject({
          name: 'Test Product',
          quantity: 2,
          total: '49.99',
        });
      });

      it('should convert billing address', async () => {
        mockClient.getOrder.mockResolvedValueOnce(mockOrder as any);

        const result = await provider.lookupOrder('1001');

        expect(result?.billing).toMatchObject({
          firstName: 'John',
          lastName: 'Doe',
          email: 'customer@example.com',
        });
      });

      it('should include shipping address', async () => {
        mockClient.getOrder.mockResolvedValueOnce(mockOrder as any);

        const result = await provider.lookupOrder('1001');

        expect(result?.shipping).toBeDefined();
        expect(result?.shipping).toMatchObject({
          address1: '123 Main St',
          city: 'Portland',
        });
      });

      it('should handle missing billing address', async () => {
        const orderWithoutBilling = { ...mockOrder, billing_address: null };
        mockClient.getOrder.mockResolvedValueOnce(orderWithoutBilling as any);

        const result = await provider.lookupOrder('1001');

        expect(result?.billing).toBeUndefined();
      });

      it('should handle empty line items', async () => {
        const orderWithoutItems = { ...mockOrder, line_items: [] };
        mockClient.getOrder.mockResolvedValueOnce(orderWithoutItems as any);

        const result = await provider.lookupOrder('1001');

        expect(result?.items).toEqual([]);
      });
    });

    describe('Error Handling', () => {
      it('should return null on API errors', async () => {
        mockClient.getOrder.mockRejectedValueOnce(new Error('API Error'));
        mockClient.getOrders.mockRejectedValueOnce(new Error('API Error'));

        const result = await provider.lookupOrder('1001');

        expect(result).toBeNull();
      });

      it('should handle non-numeric order IDs', async () => {
        mockClient.getOrders.mockResolvedValueOnce([]);

        const result = await provider.lookupOrder('ABC123');

        // Should skip numeric ID lookup
        expect(mockClient.getOrder).not.toHaveBeenCalled();
        expect(mockClient.getOrders).toHaveBeenCalled();
      });
    });
  });

  // See shopify-provider-operations.test.ts for searchProducts, checkStock, and getProductDetails tests
});
