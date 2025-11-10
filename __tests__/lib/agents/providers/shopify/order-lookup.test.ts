/**
 * Shopify Provider - Order Lookup Tests
 * Tests for order lookup by ID, email, and name
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ShopifyProvider } from '@/lib/agents/providers/shopify-provider';
import type { ShopifyAPI } from '@/lib/shopify-api';
import {
  mockShopifyClient,
  createMockShopifyOrder,
  createOrderNotFoundError,
  createShopifyAPIError,
} from '@/test-utils/shopify-test-helpers';

describe('ShopifyProvider - Order Lookup', () => {
  let provider: ShopifyProvider;
  let mockClient: jest.Mocked<Partial<ShopifyAPI>>;

  beforeEach(() => {
    mockClient = mockShopifyClient() as jest.Mocked<Partial<ShopifyAPI>>;
    provider = new ShopifyProvider(mockClient as ShopifyAPI);
    jest.clearAllMocks();
  });

  describe('lookupOrder by ID', () => {
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
      expect(result?.id).toBe(123);
      expect(result?.number).toBe('#123');
      expect(result?.status).toBe('paid');
      expect(result?.total).toBe('99.99');
      expect(result?.currency).toBe('USD');
      expect(result?.billing?.email).toBe('customer@example.com');
    });

    it('should convert order to standard OrderInfo format', async () => {
      const mockOrder = createMockShopifyOrder({
        id: 111,
        name: '#111',
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
  });

  describe('lookupOrder by email', () => {
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
  });

  describe('lookupOrder by name', () => {
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
  });

  describe('error handling', () => {
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
  });

  describe('edge cases', () => {
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
});
