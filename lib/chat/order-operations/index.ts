/**
 * WooCommerce Order Operations Module
 * Main export barrel for all order-related operations
 * Modularized to comply with 300 LOC file size limits
 */

// Order lookup and basic operations
export {
  checkOrder,
  getShippingInfo
} from './order-lookup';

// Order history and notes
export {
  getCustomerOrders,
  getOrderNotes
} from './order-history';

// Refunds and cancellation
export {
  checkRefundStatus,
  cancelOrder
} from './order-refunds-cancellation';
