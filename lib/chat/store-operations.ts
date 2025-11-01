/**
 * WooCommerce Store Operations - Proxy Export
 *
 * This file maintains backward compatibility while the implementation
 * has been refactored into a modular structure in lib/chat/store-operations/
 *
 * Original file: 389 LOC (backed up to .old)
 * New structure: 3 focused operation modules totaling ~420 LOC
 */

export {
  validateCoupon,
  getPaymentMethods,
  getShippingMethods,
} from './store-operations/';
