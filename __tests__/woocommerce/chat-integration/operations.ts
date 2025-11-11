import { OperationTest } from './types';

export const OPERATION_GROUPS: Array<{ title: string; tests: OperationTest[] }> = [
  {
    title: '📦 CATEGORY 1: PRODUCT OPERATIONS',
    tests: [
      { category: 'Product', operation: 'get_stock_quantity', query: 'How many units of A4VTG90 do you have in stock?' },
      { category: 'Product', operation: 'check_stock', query: 'Is the A4VTG71 pump in stock?' },
      { category: 'Product', operation: 'get_product_details', query: 'Can you give me full details on product SKU A4VTG90?' },
      { category: 'Product', operation: 'check_price', query: 'What is the price of A4VTG90?' },
      { category: 'Product', operation: 'search_products', query: 'Show me all hydraulic pumps under £500' },
      { category: 'Product', operation: 'get_product_categories', query: 'What product categories do you have?' },
      { category: 'Product', operation: 'get_product_variations', query: 'What variations are available for product A4VTG90?' },
    ],
  },
  {
    title: '📋 CATEGORY 2: ORDER OPERATIONS',
    tests: [
      { category: 'Order', operation: 'check_order', query: 'What is the status of order #1234?' },
      { category: 'Order', operation: 'check_order', query: 'Can you look up orders for test@example.com?' },
      { category: 'Order', operation: 'get_customer_orders', query: 'Show me all orders for customer@example.com in the last 30 days' },
      { category: 'Order', operation: 'get_order_notes', query: 'What are the notes on order #1234?' },
      { category: 'Order', operation: 'check_refund_status', query: 'Has order #1234 been refunded?' },
    ],
  },
  {
    title: '🛒 CATEGORY 3: CART & COUPON OPERATIONS',
    tests: [
      { category: 'Cart', operation: 'add_to_cart', query: 'I want to add 2 units of A4VTG90 to my cart' },
      { category: 'Cart', operation: 'get_cart', query: 'Show me my shopping cart' },
      { category: 'Coupon', operation: 'validate_coupon', query: 'Is coupon code SAVE10 valid?' },
      { category: 'Coupon', operation: 'apply_coupon_to_cart', query: 'How do I apply coupon SAVE10 to my order?' },
    ],
  },
  {
    title: '🏪 CATEGORY 4: STORE OPERATIONS',
    tests: [
      { category: 'Store', operation: 'get_shipping_methods', query: 'What shipping options do you offer to the UK?' },
      { category: 'Store', operation: 'get_payment_methods', query: 'What payment methods do you accept?' },
      { category: 'Product', operation: 'get_product_reviews', query: 'What do customers say about A4VTG90?' },
    ],
  },
];
