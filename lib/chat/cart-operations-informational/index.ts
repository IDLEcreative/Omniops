/**
 * WooCommerce Cart Operations - Informational Mode (Legacy)
 *
 * Provides URL-based cart guidance when Store API is unavailable or disabled.
 * These functions do not manipulate the cart directly - they provide links
 * for customers to take action on the store website.
 *
 * Use Cases:
 * - Store API disabled or unavailable
 * - No session management infrastructure
 * - Simple integration requirements
 *
 * Note: This mode validates data but directs users to the store for actual cart actions.
 */

export { addToCartInformational } from './add-to-cart';
export {
  getCartInformational,
  removeFromCartInformational,
  updateCartQuantityInformational
} from './cart-viewing';
export { applyCouponToCartInformational } from './coupon-application';

export type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  AddToCartInfo
} from './types';
