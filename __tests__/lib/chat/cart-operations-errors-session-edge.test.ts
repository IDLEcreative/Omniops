/**
 * Cart Operations Tests: Session, Price & Edge Case Errors
 *
 * Tests error scenarios for authentication, pricing, race conditions, and null handling.
 * Coverage: Session expiry, price changes, concurrent modifications, malformed responses.
 *
 * REVENUE-CRITICAL: These error scenarios must be handled correctly
 * to prevent lost sales, incorrect charges, or data corruption.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  addToCartDirect,
  getCartDirect,
  removeFromCartDirect,
  updateCartQuantityDirect,
  applyCouponToCartDirect,
} from '@/lib/chat/cart-operations-transactional';
import type { WooCommerceStoreAPI } from '@/lib/woocommerce-store-api';
import type { WooCommerceOperationParams } from '@/lib/chat/woocommerce-types';

// Mock analytics tracking
jest.mock('@/lib/cart-analytics', () => ({
  trackCartOperation: jest.fn(),
}));

// Mock formatter utilities
jest.mock('@/lib/chat/cart-operations-utils', () => ({
  formatCartResponse: jest.fn((cart) => ({ items: cart.items })),
  formatAddToCartMessage: jest.fn(() => '✅ Added'),
  formatViewCartMessage: jest.fn(() => '🛒 Cart'),
  formatRemoveFromCartMessage: jest.fn(() => '✅ Removed'),
  formatUpdateCartMessage: jest.fn(() => '✅ Updated'),
  formatApplyCouponMessage: jest.fn(() => '✅ Coupon Applied'),
  handleCartError: jest.fn((error, operation) => ({
    success: false,
    data: null,
    message: `${operation} failed: ${error.message}`,
  })),
}));

describe('Cart Operations - Session, Price & Edge Case Errors', () => {
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
      getSessionNonce: jest.fn(() => 'session-123'),
    } as any;

    baseParams = {
      domain: 'test-store.com',
    };
  });

  describe('Session & Authentication Errors', () => {
    it('should handle expired session', async () => {
      mockStoreAPI.getCart.mockResolvedValue({
        success: false,
        error: {
          code: 'session_expired',
          message: 'Your session has expired',
        },
      });

      const result = await getCartDirect(mockStoreAPI, baseParams);

      expect(result.success).toBe(false);
      expect(result.message).toContain('expired');
    });

    it('should handle invalid session token', async () => {
      mockStoreAPI.addItem.mockResolvedValue({
        success: false,
        error: {
          code: 'invalid_token',
          message: 'Invalid session token',
        },
      });

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid session');
    });

    it('should handle cart ownership mismatch', async () => {
      mockStoreAPI.removeItem.mockResolvedValue({
        success: false,
        error: {
          code: 'permission_denied',
          message: 'Cart item does not belong to this session',
        },
      });

      const result = await removeFromCartDirect(mockStoreAPI, {
        ...baseParams,
        cartItemKey: 'other-user-item',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('does not belong');
    });
  });

  describe('Price & Currency Errors', () => {
    it('should handle price change during checkout', async () => {
      mockStoreAPI.addItem.mockResolvedValue({
        success: false,
        error: {
          code: 'price_changed',
          message: 'Product price has changed since you added it',
        },
      });

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('price has changed');
    });

    it('should handle currency conversion failure', async () => {
      mockStoreAPI.getCart.mockResolvedValue({
        success: false,
        error: {
          code: 'currency_error',
          message: 'Unable to convert currency',
        },
      });

      const result = await getCartDirect(mockStoreAPI, baseParams);

      expect(result.success).toBe(false);
      expect(result.message).toContain('currency');
    });
  });

  describe('Edge Cases & Race Conditions', () => {
    it('should handle missing cart data in successful response', async () => {
      mockStoreAPI.getCart.mockResolvedValue({
        success: true,
        data: undefined,
      });

      const result = await getCartDirect(mockStoreAPI, baseParams);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to retrieve cart');
    });

    it('should handle null cart data', async () => {
      mockStoreAPI.addItem.mockResolvedValue({
        success: true,
        data: null as any,
      });

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
      });

      expect(result.success).toBe(false);
    });

    it('should handle malformed cart response', async () => {
      mockStoreAPI.getCart.mockResolvedValue({
        success: true,
        data: { items: null } as any, // Malformed
      });

      const result = await getCartDirect(mockStoreAPI, baseParams);

      // Should throw TypeError when trying to access items.find
      expect(result.success).toBe(false);
    });

    it('should handle concurrent cart modifications', async () => {
      // Simulate race condition: item removed between requests
      mockStoreAPI.updateItem.mockResolvedValue({
        success: true,
        data: {
          items: [], // Item was removed by another request
          items_count: 0,
          totals: { total_price: '0.00' },
          coupons: [],
        },
      });

      const result = await updateCartQuantityDirect(mockStoreAPI, {
        ...baseParams,
        cartItemKey: 'item-1',
        quantity: 5,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('Undefined & Null Handling', () => {
    it('should handle undefined domain', async () => {
      const result = await addToCartDirect(mockStoreAPI, {
        productId: '123',
      } as any);

      // Should not crash, trackCartOperation will receive empty string
      expect(result).toBeDefined();
    });

    it('should handle empty string productId', async () => {
      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '',
      });

      expect(result.success).toBe(false);
    });

    it('should handle empty string cartItemKey', async () => {
      const result = await removeFromCartDirect(mockStoreAPI, {
        ...baseParams,
        cartItemKey: '',
      });

      expect(result.success).toBe(false);
    });

    it('should handle empty string couponCode', async () => {
      const result = await applyCouponToCartDirect(mockStoreAPI, {
        ...baseParams,
        couponCode: '',
      });

      expect(result.success).toBe(false);
    });
  });
});
