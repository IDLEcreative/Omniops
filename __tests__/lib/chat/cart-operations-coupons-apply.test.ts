/**
 * Cart Operations Tests: Coupon Application - Happy Path & Validation
 *
 * Tests successful coupon application and basic validation.
 * Coverage: Valid coupons, invalid codes, missing parameters.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { applyCouponToCartDirect } from '@/lib/chat/cart-operations-transactional';
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
    appliedCoupons: cart.coupons,
  })),
  formatApplyCouponMessage: jest.fn((cart, coupon) =>
    `✅ Coupon Applied! Code: ${coupon.code}`
  ),
  handleCartError: jest.fn((error) => ({
    success: false,
    data: null,
    message: `Apply coupon failed: ${error.message}`,
  })),
}));

describe('Cart Operations - Coupon Application: Happy Path & Validation', () => {
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
      getSessionNonce: jest.fn(() => 'test-session-nonce'),
    } as any;

    baseParams = {
      domain: 'test-store.com',
    };
  });

  describe('applyCouponToCartDirect - Happy Path', () => {
    it('should successfully apply valid coupon', async () => {
      const mockCart = {
        items: [
          {
            id: 123,
            key: 'item-1',
            name: 'Product',
            quantity: 1,
            prices: { price: '100.00' },
            totals: { line_total: '100.00' },
          },
        ],
        items_count: 1,
        totals: {
          total_items: '100.00',
          total_discount: '10.00',
          total_price: '90.00',
          currency_symbol: '$',
        },
        coupons: [
          {
            code: 'SAVE10',
            discount_type: 'percent',
            totals: {
              total_discount: '10.00',
              currency_symbol: '$',
            },
          },
        ],
      };

      mockStoreAPI.applyCoupon.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await applyCouponToCartDirect(mockStoreAPI, {
        ...baseParams,
        couponCode: 'SAVE10',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('SAVE10');
      expect(mockStoreAPI.applyCoupon).toHaveBeenCalledWith('SAVE10');
    });

    it('should handle free shipping coupon', async () => {
      const mockCart = {
        items: [{ id: 123, key: 'item-1', name: 'Product', quantity: 1, prices: { price: '100.00' }, totals: { line_total: '100.00' } }],
        items_count: 1,
        totals: {
          total_items: '100.00',
          total_shipping: '0.00', // Free shipping
          total_price: '100.00',
          currency_symbol: '$',
        },
        coupons: [
          {
            code: 'FREESHIP',
            discount_type: 'free_shipping',
            totals: { total_discount: '0.00', currency_symbol: '$' },
          },
        ],
      };

      mockStoreAPI.applyCoupon.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await applyCouponToCartDirect(mockStoreAPI, {
        ...baseParams,
        couponCode: 'FREESHIP',
      });

      expect(result.success).toBe(true);
    });

    it('should handle case-sensitive coupon codes', async () => {
      const mockCart = {
        items: [{ id: 123, key: 'item-1', name: 'Product', quantity: 1, prices: { price: '100.00' }, totals: { line_total: '100.00' } }],
        items_count: 1,
        totals: { total_price: '90.00', currency_symbol: '$' },
        coupons: [{ code: 'save10', totals: { total_discount: '10.00', currency_symbol: '$' } }],
      };

      mockStoreAPI.applyCoupon.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await applyCouponToCartDirect(mockStoreAPI, {
        ...baseParams,
        couponCode: 'save10',
      });

      expect(result.success).toBe(true);
      expect(mockStoreAPI.applyCoupon).toHaveBeenCalledWith('save10');
    });
  });

  describe('applyCouponToCartDirect - Input Validation', () => {
    it('should return error if couponCode is missing', async () => {
      const result = await applyCouponToCartDirect(mockStoreAPI, baseParams);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Coupon code is required');
      expect(mockStoreAPI.applyCoupon).not.toHaveBeenCalled();
    });

    it('should handle invalid coupon code', async () => {
      mockStoreAPI.applyCoupon.mockResolvedValue({
        success: false,
        error: {
          code: 'invalid_coupon',
          message: 'Coupon code does not exist',
        },
      });

      const result = await applyCouponToCartDirect(mockStoreAPI, {
        ...baseParams,
        couponCode: 'INVALID',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Coupon code does not exist');
    });

    it('should handle coupon not found in cart after application', async () => {
      const mockCart = {
        items: [{ id: 123, quantity: 1 }],
        items_count: 1,
        totals: { total_price: '100.00' },
        coupons: [], // Empty coupons array
      };

      mockStoreAPI.applyCoupon.mockResolvedValue({
        success: true,
        data: mockCart,
      });

      const result = await applyCouponToCartDirect(mockStoreAPI, {
        ...baseParams,
        couponCode: 'SAVE10',
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('was not found in cart');
    });
  });
});
