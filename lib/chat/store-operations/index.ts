/**
 * WooCommerce Store Operations - Main Export
 * Composed from modular operation files
 *
 * Original file: lib/chat/store-operations.ts (389 LOC)
 * Refactored into 3 focused operation modules:
 * - coupon-operations.ts (139 LOC) - Coupon validation
 * - payment-operations.ts (114 LOC) - Payment method retrieval
 * - shipping-operations.ts (167 LOC) - Shipping method retrieval
 */

// Re-export all store operations
export { validateCoupon } from './coupon-operations';
export { getPaymentMethods } from './payment-operations';
export { getShippingMethods } from './shipping-operations';
