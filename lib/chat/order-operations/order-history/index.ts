/**
 * WooCommerce Order History Operations
 * Handles customer order history and order notes retrieval
 */

export { getCustomerOrders } from './customer-orders';
export { getOrderNotes } from './order-notes';

export type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  OrderNoteInfo
} from './types';
