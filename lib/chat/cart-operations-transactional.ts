/**
 * WooCommerce Cart Operations - Transactional Mode
 *
 * Provides direct cart manipulation via WooCommerce Store API.
 * These functions require Store API availability and session management.
 *
 * Key Features:
 * - Direct cart manipulation (no URL-based workarounds)
 * - Session-based persistence
 * - Real-time cart totals
 * - Support for guest and authenticated users
 *
 * Requirements:
 * - WooCommerce Store API enabled
 * - Redis for session storage
 * - WOOCOMMERCE_STORE_API_ENABLED=true environment variable
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
} from './woocommerce-tool-types';
import type { WooCommerceStoreAPI } from '../woocommerce-store-api';
import {
  formatCartResponse,
  formatAddToCartMessage,
  formatViewCartMessage,
  formatRemoveFromCartMessage,
  formatUpdateCartMessage,
  formatApplyCouponMessage,
  handleCartError
} from './cart-operations-utils';

/**
 * Add to cart (transactional)
 * Directly adds item to cart via Store API
 */
export async function addToCartDirect(
  storeAPI: WooCommerceStoreAPI,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    if (!params.productId) {
      return {
        success: false,
        data: null,
        message: "Product ID is required to add to cart"
      };
    }

    const quantity = params.quantity || 1;
    const productId = parseInt(params.productId);
    const result = await storeAPI.addItem(productId, quantity);

    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        message: result.error?.message || "Failed to add item to cart"
      };
    }

    const cart = result.data;
    const addedItem = cart.items.find(item => item.id === productId);

    if (!addedItem) {
      return {
        success: false,
        data: null,
        message: "Item was not added to cart"
      };
    }

    return {
      success: true,
      data: formatCartResponse(cart),
      message: formatAddToCartMessage(cart, addedItem)
    };
  } catch (error) {
    return handleCartError(error, 'Add to cart');
  }
}

/**
 * Get cart contents (transactional)
 * Retrieves actual cart state from Store API
 */
export async function getCartDirect(
  storeAPI: WooCommerceStoreAPI,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    const result = await storeAPI.getCart();

    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        message: result.error?.message || "Failed to retrieve cart"
      };
    }

    const cart = result.data;

    return {
      success: true,
      data: formatCartResponse(cart),
      message: formatViewCartMessage(cart)
    };
  } catch (error) {
    return handleCartError(error, 'Get cart');
  }
}

/**
 * Remove from cart (transactional)
 * Directly removes item from cart via Store API
 */
export async function removeFromCartDirect(
  storeAPI: WooCommerceStoreAPI,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    if (!params.cartItemKey) {
      return {
        success: false,
        data: null,
        message: "Cart item key is required to remove item"
      };
    }

    const result = await storeAPI.removeItem(params.cartItemKey);

    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        message: result.error?.message || "Failed to remove item from cart"
      };
    }

    const cart = result.data;

    return {
      success: true,
      data: formatCartResponse(cart),
      message: formatRemoveFromCartMessage(cart)
    };
  } catch (error) {
    return handleCartError(error, 'Remove from cart');
  }
}

/**
 * Update cart quantity (transactional)
 * Directly updates item quantity via Store API
 */
export async function updateCartQuantityDirect(
  storeAPI: WooCommerceStoreAPI,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    if (!params.cartItemKey || !params.quantity) {
      return {
        success: false,
        data: null,
        message: "Cart item key and quantity are required"
      };
    }

    const result = await storeAPI.updateItem(params.cartItemKey, params.quantity);

    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        message: result.error?.message || "Failed to update cart quantity"
      };
    }

    const cart = result.data;
    const updatedItem = cart.items.find(item => item.key === params.cartItemKey);

    if (!updatedItem) {
      return {
        success: false,
        data: null,
        message: "Item not found in cart after update"
      };
    }

    return {
      success: true,
      data: formatCartResponse(cart),
      message: formatUpdateCartMessage(cart, updatedItem)
    };
  } catch (error) {
    return handleCartError(error, 'Update cart quantity');
  }
}

/**
 * Apply coupon to cart (transactional)
 * Directly applies coupon via Store API
 */
export async function applyCouponToCartDirect(
  storeAPI: WooCommerceStoreAPI,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    if (!params.couponCode) {
      return {
        success: false,
        data: null,
        message: "Coupon code is required"
      };
    }

    const result = await storeAPI.applyCoupon(params.couponCode);

    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        message: result.error?.message || `Coupon "${params.couponCode}" could not be applied`
      };
    }

    const cart = result.data;
    const appliedCoupon = cart.coupons.find(c => c.code === params.couponCode);

    if (!appliedCoupon) {
      return {
        success: false,
        data: null,
        message: `Coupon "${params.couponCode}" was not found in cart after application`
      };
    }

    return {
      success: true,
      data: formatCartResponse(cart),
      message: formatApplyCouponMessage(cart, appliedCoupon)
    };
  } catch (error) {
    return handleCartError(error, 'Apply coupon');
  }
}
