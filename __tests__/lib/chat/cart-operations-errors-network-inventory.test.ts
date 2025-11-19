/**
 * Cart Operations Tests: Network, Inventory & Validation Errors
 *
 * Tests error scenarios for network issues, stock/inventory, and input validation.
 * Coverage: Network timeouts, DNS failures, stock errors, validation errors.
 *
 * REVENUE-CRITICAL: These error scenarios must be handled correctly
 * to prevent lost sales, incorrect charges, or data corruption.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  addToCartDirect,
  getCartDirect,
  updateCartQuantityDirect,
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

describe('Cart Operations - Network, Inventory & Validation Errors', () => {
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

  describe('Network & Communication Errors', () => {
    it('should handle network timeout on add to cart', async () => {
      mockStoreAPI.addItem.mockRejectedValue(
        new Error('ETIMEDOUT: Network request timeout')
      );

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('timeout');
    });

    it('should handle connection refused error', async () => {
      mockStoreAPI.getCart.mockRejectedValue(
        new Error('ECONNREFUSED: Connection refused')
      );

      const result = await getCartDirect(mockStoreAPI, baseParams);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection refused');
    });

    it('should handle DNS resolution failure', async () => {
      mockStoreAPI.addItem.mockRejectedValue(
        new Error('ENOTFOUND: DNS lookup failed')
      );

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('DNS lookup');
    });
  });

  describe('Inventory & Stock Errors', () => {
    it('should handle out of stock error', async () => {
      mockStoreAPI.addItem.mockResolvedValue({
        success: false,
        error: {
          code: 'out_of_stock',
          message: 'This product is currently out of stock',
        },
      });

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('out of stock');
    });

    it('should handle insufficient stock for quantity', async () => {
      mockStoreAPI.addItem.mockResolvedValue({
        success: false,
        error: {
          code: 'insufficient_stock',
          message: 'Only 2 items remaining in stock',
        },
      });

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
        quantity: 10,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('2 items remaining');
    });

    it('should handle product discontinued', async () => {
      mockStoreAPI.addItem.mockResolvedValue({
        success: false,
        error: {
          code: 'product_unavailable',
          message: 'This product is no longer available',
        },
      });

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '999',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('no longer available');
    });
  });

  describe('Data Validation Errors', () => {
    it('should handle invalid product ID format', async () => {
      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: 'invalid-id',
      });

      // parseInt('invalid-id') returns NaN
      expect(mockStoreAPI.addItem).toHaveBeenCalledWith(NaN, 1);
    });

    it('should handle negative quantity', async () => {
      const result = await updateCartQuantityDirect(mockStoreAPI, {
        ...baseParams,
        cartItemKey: 'item-1',
        quantity: -5,
      });

      // Function should pass negative value to API
      // API is responsible for validation
      expect(mockStoreAPI.updateItem).toHaveBeenCalledWith('item-1', -5);
    });

    it('should handle zero quantity', async () => {
      const result = await updateCartQuantityDirect(mockStoreAPI, {
        ...baseParams,
        cartItemKey: 'item-1',
        quantity: 0,
      });

      // quantity: 0 is falsy, treated as missing parameter
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cart item key and quantity are required');
    });

    it('should handle extremely large quantity', async () => {
      const result = await updateCartQuantityDirect(mockStoreAPI, {
        ...baseParams,
        cartItemKey: 'item-1',
        quantity: 999999,
      });

      expect(mockStoreAPI.updateItem).toHaveBeenCalledWith('item-1', 999999);
    });
  });
});
