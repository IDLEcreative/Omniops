import { OperationGroup } from './types';

export const OPERATION_GROUPS: OperationGroup[] = [
  {
    title: 'CATEGORY: PRODUCT OPERATIONS (9 operations)',
    operations: [
      { name: 'check_stock', category: 'Product', operation: 'check_stock', params: { productId: '77424' } },
      { name: 'get_stock_quantity', category: 'Product', operation: 'get_stock_quantity', params: { productId: '77424' } },
      { name: 'get_product_details (by ID)', category: 'Product', operation: 'get_product_details', params: { productId: '77424' } },
      { name: 'get_product_details (by SKU)', category: 'Product', operation: 'get_product_details', params: { productId: 'A4VTG90' } },
      { name: 'check_price', category: 'Product', operation: 'check_price', params: { productId: '77424' } },
      { name: 'get_product_variations', category: 'Product', operation: 'get_product_variations', params: { productId: '77424' } },
      { name: 'get_product_categories', category: 'Product', operation: 'get_product_categories', params: {} },
      { name: 'get_product_reviews', category: 'Product', operation: 'get_product_reviews', params: { productId: '77424' } },
      { name: 'get_low_stock_products', category: 'Product', operation: 'get_low_stock_products', params: { threshold: 10, limit: 5 } },
      { name: 'search_products', category: 'Product', operation: 'search_products', params: { query: 'pump', limit: 5 } },
    ],
  },
  {
    title: 'CATEGORY: ORDER OPERATIONS (6 operations)',
    operations: [
      { name: 'check_order (by ID)', category: 'Order', operation: 'check_order', params: { orderId: '99999' } },
      { name: 'check_order (by email)', category: 'Order', operation: 'check_order', params: { email: 'test@example.com' } },
      { name: 'get_shipping_info', category: 'Order', operation: 'get_shipping_info', params: {} },
      { name: 'get_customer_orders', category: 'Order', operation: 'get_customer_orders', params: { email: 'test@example.com' } },
      { name: 'get_order_notes', category: 'Order', operation: 'get_order_notes', params: { orderId: '99999' } },
      { name: 'check_refund_status', category: 'Order', operation: 'check_refund_status', params: { orderId: '99999' } },
      { name: 'cancel_order', category: 'Order', operation: 'cancel_order', params: { orderId: '99999', reason: 'Customer requested cancellation' } },
    ],
  },
  {
    title: 'CATEGORY: STORE CONFIGURATION (3 operations)',
    operations: [
      { name: 'validate_coupon', category: 'Store', operation: 'validate_coupon', params: { couponCode: 'TESTCODE' } },
      { name: 'get_shipping_methods', category: 'Store', operation: 'get_shipping_methods', params: {} },
      { name: 'get_payment_methods', category: 'Store', operation: 'get_payment_methods', params: {} },
    ],
  },
  {
    title: 'CATEGORY: CART OPERATIONS (5 operations)',
    operations: [
      { name: 'add_to_cart', category: 'Cart', operation: 'add_to_cart', params: { productId: '77424', quantity: 1 } },
      { name: 'get_cart', category: 'Cart', operation: 'get_cart', params: {} },
      { name: 'remove_from_cart', category: 'Cart', operation: 'remove_from_cart', params: { productId: '77424' } },
      { name: 'update_cart_quantity', category: 'Cart', operation: 'update_cart_quantity', params: { productId: '77424', quantity: 2 } },
      { name: 'apply_coupon_to_cart', category: 'Cart', operation: 'apply_coupon_to_cart', params: { couponCode: 'TESTCODE' } },
    ],
  },
  {
    title: 'CATEGORY: ANALYTICS (2 operations)',
    operations: [
      { name: 'get_customer_insights', category: 'Analytics', operation: 'get_customer_insights', params: { limit: 5 } },
      { name: 'get_sales_report', category: 'Analytics', operation: 'get_sales_report', params: { period: 'week' } },
    ],
  },
];
