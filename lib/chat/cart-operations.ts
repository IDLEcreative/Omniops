/**
 * WooCommerce Cart Operations
 * Provides cart-related operations with dual mode support:
 *
 * 1. INFORMATIONAL MODE (default, legacy):
 *    - Provides "add to cart" URLs for user to click
 *    - No session management required
 *    - Works immediately without complex setup
 *
 * 2. TRANSACTIONAL MODE (Store API):
 *    - Direct cart manipulation via WooCommerce Store API
 *    - Session-based persistence
 *    - Real-time cart totals
 *    - Requires: WOOCOMMERCE_STORE_API_ENABLED=true
 *
 * Feature Flag: WOOCOMMERCE_STORE_API_ENABLED
 * - Set to 'true' to enable transactional mode
 * - Defaults to informational mode if unset or 'false'
 *
 * Note: WooCommerce REST API v3 does NOT support cart operations.
 * Cart operations require WooCommerce Store API and session management.
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
} from './woocommerce-tool-types';

// Import informational mode functions
import {
  addToCartInformational,
  getCartInformational,
  removeFromCartInformational,
  updateCartQuantityInformational,
  applyCouponToCartInformational
} from './cart-operations-informational';

// Feature flag check
const USE_STORE_API = process.env.WOOCOMMERCE_STORE_API_ENABLED === 'true';

// ==================== PUBLIC API (MODE-AWARE) ====================

/**
 * Add to cart (mode-aware)
 * Automatically switches between informational and transactional modes
 */
export async function addToCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (USE_STORE_API && params.storeAPI) {
    // Transactional mode (requires Store API client)
    const { addToCartDirect } = await import('./cart-operations-transactional');
    return addToCartDirect(params.storeAPI, params);
  } else {
    // Informational mode (default)
    return addToCartInformational(wc, params);
  }
}

/**
 * Get cart (mode-aware)
 */
export async function getCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (USE_STORE_API && params.storeAPI) {
    const { getCartDirect } = await import('./cart-operations-transactional');
    return getCartDirect(params.storeAPI, params);
  } else {
    return getCartInformational(wc, params);
  }
}

/**
 * Remove from cart (mode-aware)
 */
export async function removeFromCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (USE_STORE_API && params.storeAPI) {
    const { removeFromCartDirect } = await import('./cart-operations-transactional');
    return removeFromCartDirect(params.storeAPI, params);
  } else {
    return removeFromCartInformational(wc, params);
  }
}

/**
 * Update cart quantity (mode-aware)
 */
export async function updateCartQuantity(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (USE_STORE_API && params.storeAPI) {
    const { updateCartQuantityDirect } = await import('./cart-operations-transactional');
    return updateCartQuantityDirect(params.storeAPI, params);
  } else {
    return updateCartQuantityInformational(wc, params);
  }
}

/**
 * Apply coupon to cart (mode-aware)
 */
export async function applyCouponToCart(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (USE_STORE_API && params.storeAPI) {
    const { applyCouponToCartDirect } = await import('./cart-operations-transactional');
    return applyCouponToCartDirect(params.storeAPI, params);
  } else {
    return applyCouponToCartInformational(wc, params);
  }
}
