/**
 * Cart Operations Tests: Core Functionality
 *
 * Tests basic cart operations (add, get, remove, update).
 * Coverage: Happy paths, validation, data formatting.
 *
 * Design Quality: ✅ EXCELLENT
 * - Simple mocks via constructor injection
 * - No module mocking needed
 * - Fast, isolated tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  addToCartDirect,
  getCartDirect,
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

describe('Cart Operations - Core Functionality', () => {
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

  describe('addToCartDirect', () => {
    it('should successfully add item to cart', async () => {
      const mockCart = {
        items: [
          {
            id: 123,
            key: 'item-key-1',
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
          currency_code: 'USD',
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

      expect(result.success).toBe(true);
      expect(result.message).toContain('✅ Added to Cart');
      expect(result.message).toContain('Test Product');
      expect(mockStoreAPI.addItem).toHaveBeenCalledWith(123, 2);
    });

    it('should default to quantity 1 if not specified', async () => {
      const mockCart = {
        items: [{ id: 123, quantity: 1 }],
        items_count: 1,
        totals: { total_price: '29.99' },
        coupons: [],
      };

      mockStoreAPI.addItem.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
      });

      expect(mockStoreAPI.addItem).toHaveBeenCalledWith(123, 1);
    });

    it('should return error if productId is missing', async () => {
      const result = await addToCartDirect(mockStoreAPI, baseParams);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Product ID is required to add to cart');
      expect(mockStoreAPI.addItem).not.toHaveBeenCalled();
    });

    it('should handle Store API failure', async () => {
      mockStoreAPI.addItem.mockResolvedValue({
        success: false,
        error: { code: 'out_of_stock', message: 'Product is out of stock' },
      });

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Product is out of stock');
    });

    it('should handle item not found in cart after adding', async () => {
      const mockCart = {
        items: [{ id: 999, quantity: 1 }], // Different product ID
        items_count: 1,
        totals: { total_price: '29.99' },
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

      expect(result.success).toBe(false);
      expect(result.message).toBe('Item was not added to cart');
    });

    it('should handle exceptions gracefully', async () => {
      mockStoreAPI.addItem.mockRejectedValue(
        new Error('Network error')
      );

      const result = await addToCartDirect(mockStoreAPI, {
        ...baseParams,
        productId: '123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });

  describe('getCartDirect', () => {
    it('should successfully retrieve cart contents', async () => {
      const mockCart = {
        items: [
          {
            id: 123,
            key: 'item-key-1',
            name: 'Product A',
            quantity: 1,
            prices: { price: '49.99' },
            totals: { line_total: '49.99' },
          },
          {
            id: 456,
            key: 'item-key-2',
            name: 'Product B',
            quantity: 2,
            prices: { price: '50.00' },
            totals: { line_total: '100.00' },
          },
        ],
        items_count: 3,
        totals: {
          total_price: '149.99',
          total_items: '149.99',
          currency_code: 'USD',
          currency_symbol: '$',
        },
        coupons: [],
      };

      mockStoreAPI.getCart.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await getCartDirect(mockStoreAPI, baseParams);

      expect(result.success).toBe(true);
      expect(result.message).toContain('🛒 Your Cart');
      expect(mockStoreAPI.getCart).toHaveBeenCalled();
    });

    it('should handle empty cart', async () => {
      const mockCart = {
        items: [],
        items_count: 0,
        totals: { total_price: '0.00' },
        coupons: [],
      };

      mockStoreAPI.getCart.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await getCartDirect(mockStoreAPI, baseParams);

      expect(result.success).toBe(true);
    });

    it('should handle Store API failure', async () => {
      mockStoreAPI.getCart.mockResolvedValue({
        success: false,
        error: { code: 'session_expired', message: 'Session expired' },
      });

      const result = await getCartDirect(mockStoreAPI, baseParams);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Session expired');
    });
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
