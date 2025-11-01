/**
 * WooCommerce Cart Operations - Informational Mode (Legacy)
 *
 * This file is a proxy to the refactored module structure.
 * All logic is now split into focused modules under cart-operations-informational/
 */

export {
  addToCartInformational,
  getCartInformational,
  removeFromCartInformational,
  updateCartQuantityInformational,
  applyCouponToCartInformational
} from './cart-operations-informational/index';

export type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  AddToCartInfo
} from './cart-operations-informational/index';
