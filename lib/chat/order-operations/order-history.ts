/**
 * WooCommerce Order History Operations
 * Handles customer order history and order notes retrieval
 *
 * This file is a proxy to the refactored module structure.
 * All logic is now split into focused modules under order-history/
 */

export {
  getCustomerOrders,
  getOrderNotes
} from './order-history/index';

export type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  OrderNoteInfo
} from './order-history/index';
