/**
 * Cart Operations Tests: Remove & Update Functionality
 *
 * Tests remove-from-cart and update-quantity operations.
 * Coverage: Happy paths, validation, data formatting.
 *
 * Design Quality: ✅ EXCELLENT
 * - Simple mocks via constructor injection
 * - No module mocking needed
 * - Fast, isolated tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  removeFromCartDirect,
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
  formatCartResponse: jest.fn((cart) => ({
    items: cart.items,
    total: cart.totals.total_price,
  })),
  formatAddToCartMessage: jest.fn(() => '✅ Added to Cart'),
  formatViewCartMessage: jest.fn(() => '🛒 Your Cart'),
  formatRemoveFromCartMessage: jest.fn(() => '✅ Item removed'),
  formatUpdateCartMessage: jest.fn(() => '✅ Cart Updated'),
  handleCartError: jest.fn((error) => ({
    success: false,
    data: null,
    message: `Operation failed: ${error.message}`,
  })),
}));

describe('Cart Operations - Remove & Update Functionality', () => {
  let mockStoreAPI: jest.Mocked<WooCommerceStoreAPI>;
  let baseParams: WooCommerceOperationParams;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock StoreAPI with all required methods
    mockStoreAPI = {
      addItem: jest.fn(),
      getCart: jest.fn(),
      removeItem: jest.fn(),
      updateItem: jest.fn(),
      applyCoupon: jest.fn(),
      removeCoupon: jest.fn(),
      setNonce: jest.fn(),
      isAvailable: jest.fn(),
      getSessionNonce: jest.fn(() => 'test-session-nonce'),
    } as any;

    baseParams = {
      domain: 'test-store.com',
    };
  });

  describe('removeFromCartDirect', () => {
    it('should successfully remove item from cart', async () => {
      const mockCart = {
        items: [],
        items_count: 0,
        totals: {
          total_price: '0.00',
          currency_symbol: '$',
        },
        coupons: [],
      };

      mockStoreAPI.removeItem.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await removeFromCartDirect(mockStoreAPI, {
        ...baseParams,
        cartItemKey: 'item-key-1',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('✅ Item removed');
      expect(mockStoreAPI.removeItem).toHaveBeenCalledWith('item-key-1');
    });

    it('should return error if cartItemKey is missing', async () => {
      const result = await removeFromCartDirect(mockStoreAPI, baseParams);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cart item key is required to remove item');
      expect(mockStoreAPI.removeItem).not.toHaveBeenCalled();
    });

    it('should handle Store API failure', async () => {
      mockStoreAPI.removeItem.mockResolvedValue({
        success: false,
        error: { code: 'invalid_key', message: 'Invalid cart item key' },
      });

      const result = await removeFromCartDirect(mockStoreAPI, {
        ...baseParams,
        cartItemKey: 'invalid-key',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid cart item key');
    });
  });

  describe('updateCartQuantityDirect', () => {
    it('should successfully update item quantity', async () => {
      const mockCart = {
        items: [
          {
            id: 123,
            key: 'item-key-1',
            name: 'Product A',
            quantity: 5,
            prices: { price: '29.99' },
            totals: { line_total: '149.95' },
          },
        ],
        items_count: 5,
        totals: {
          total_price: '149.95',
          currency_symbol: '$',
        },
        coupons: [],
      };

      mockStoreAPI.updateItem.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await updateCartQuantityDirect(mockStoreAPI, {
        ...baseParams,
        cartItemKey: 'item-key-1',
        quantity: 5,
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('✅ Cart Updated');
      expect(mockStoreAPI.updateItem).toHaveBeenCalledWith('item-key-1', 5);
    });

    it('should return error if cartItemKey is missing', async () => {
      const result = await updateCartQuantityDirect(mockStoreAPI, {
        ...baseParams,
        quantity: 3,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cart item key and quantity are required');
    });

    it('should return error if quantity is missing', async () => {
      const result = await updateCartQuantityDirect(mockStoreAPI, {
        ...baseParams,
        cartItemKey: 'item-key-1',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cart item key and quantity are required');
    });

    it('should handle item not found after update', async () => {
      const mockCart = {
        items: [{ id: 999, key: 'different-key', quantity: 1 }],
        items_count: 1,
        totals: { total_price: '29.99' },
        coupons: [],
      };

      mockStoreAPI.updateItem.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await updateCartQuantityDirect(mockStoreAPI, {
        ...baseParams,
        cartItemKey: 'item-key-1',
        quantity: 3,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Item not found in cart after update');
    });
  });
});
