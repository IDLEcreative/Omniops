/**
 * Cart Operations Tests: Analytics Integration
 *
 * Tests that cart operations complete successfully when analytics is enabled.
 * Coverage: Verifies operations don't fail due to analytics calls.
 *
 * NOTE: Detailed analytics tracking logic is tested separately in cart-analytics.test.ts
 * These tests verify cart operations work correctly with analytics module present.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  addToCartDirect,
  getCartDirect,
} from '@/lib/chat/cart-operations-transactional';
import type { WooCommerceStoreAPI } from '@/lib/woocommerce-store-api';
import type { WooCommerceOperationParams } from '@/lib/chat/woocommerce-types';

// Mock analytics module to prevent real database calls
jest.mock('@/lib/cart-analytics');

// Mock formatter utilities
jest.mock('@/lib/chat/cart-operations-utils', () => ({
  formatCartResponse: jest.fn((cart) => ({ items: cart.items, total: cart.totals.total_price })),
  formatAddToCartMessage: jest.fn(() => 'Added'),
  formatViewCartMessage: jest.fn(() => 'Cart'),
  handleCartError: jest.fn((error) => ({
    success: false,
    data: null,
    message: error.message,
  })),
}));

describe('Cart Operations - Analytics Integration', () => {
  let mockStoreAPI: jest.Mocked<WooCommerceStoreAPI>;
  let baseParams: WooCommerceOperationParams;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStoreAPI = {
      addItem: jest.fn(),
      getCart: jest.fn(),
      removeItem: jest.fn(),
      updateItem: jest.fn(),
      applyCoupon: jest.fn(),
      removeCoupon: jest.fn(),
      setNonce: jest.fn(),
      isAvailable: jest.fn(),
      getSessionNonce: jest.fn(() => 'session-abc123'),
    } as any;

    baseParams = {
      domain: 'store.example.com',
    };
  });

  describe('Operations Complete Successfully with Analytics', () => {
    it('should complete add to cart successfully', async () => {
      const mockCart = {
        items: [
          {
            id: 123,
            key: 'item-1',
            name: 'Test Product',
            quantity: 2,
            prices: { price: '29.99' },
            totals: { line_total: '59.98' },
          },
        ],
        items_count: 2,
        totals: {
          total_price: '59.98',
          total_items: '59.98',
          currency_symbol: '$',
        },
        coupons: [],
      };

      mockStoreAPI.addItem.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
        quantity: 2,
      });

      // Verify operation succeeded
      expect(result.success).toBe(true);
      expect(mockStoreAPI.addItem).toHaveBeenCalledWith(123, 2);
    });

    it('should complete add to cart on failure', async () => {
      const mockCart = {
        items: [], // Item not added
        items_count: 0,
        totals: { total_price: '0.00' },
        coupons: [],
      };

      mockStoreAPI.addItem.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
      });

      // Verify operation returned failure correctly
      expect(result.success).toBe(false);
      expect(result.message).toContain('was not added');
    });

    it('should handle exceptions without crashing', async () => {
      mockStoreAPI.addItem.mockRejectedValue(
        new Error('Network error')
      );

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
      });

      // Verify operation handled error gracefully
      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });

    it('should complete get cart successfully', async () => {
      const mockCart = {
        items: [{ id: 123, key: 'item-1', name: 'Product', quantity: 1, prices: { price: '99.99' }, totals: { line_total: '99.99' } }],
        items_count: 1,
        totals: { total_price: '99.99', total_items: '99.99', currency_symbol: '$' },
        coupons: [],
      };

      mockStoreAPI.getCart.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await getCartDirect(mockStoreAPI, baseParams);

      // Verify operation succeeded
      expect(result.success).toBe(true);
    });

    it('should handle get cart failure', async () => {
      mockStoreAPI.getCart.mockResolvedValue({
        success: false,
        error: { code: 'error', message: 'Failed' },
      });

      const result = await getCartDirect(mockStoreAPI, baseParams);

      // Verify operation returned failure correctly
      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed');
    });
  });

  describe('Operations Work with Missing Analytics Data', () => {
    it('should work when domain is undefined', async () => {
      const mockCart = {
        items: [{ id: 123, key: 'item-1', name: 'Product', quantity: 1, prices: { price: '29.99' }, totals: { line_total: '29.99' } }],
        items_count: 1,
        totals: { total_price: '29.99', currency_symbol: '$' },
        coupons: [],
      };

      mockStoreAPI.addItem.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      // Call without domain
      const result = await addToCartDirect(mockStoreAPI, {
        productId: '123',
      } as any);

      // Should still succeed even with missing analytics data
      expect(result.success).toBe(true);
    });

    it('should work when session ID is empty', async () => {
      mockStoreAPI.getSessionNonce.mockReturnValue('');

      const mockCart = {
        items: [{ id: 123, key: 'item-1', name: 'Product', quantity: 1, prices: { price: '29.99' }, totals: { line_total: '29.99' } }],
        items_count: 1,
        totals: { total_price: '29.99', currency_symbol: '$' },
        coupons: [],
      };

      mockStoreAPI.getCart.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await getCartDirect(mockStoreAPI, baseParams);

      // Should still succeed even with empty session ID
      expect(result.success).toBe(true);
    });
  });
});
