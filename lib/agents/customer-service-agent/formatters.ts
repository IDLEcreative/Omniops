/**
 * Data formatting utilities for customer service agent
 */

/**
 * Format order data for AI consumption
 */
export function formatOrdersForAI(orders: any[]): string {
  if (!orders || orders.length === 0) {
    return 'No recent orders found.';
  }

  return orders.map((order, index) => `
Order ${index + 1}:
- Order Number: #${order.number}
- Date: ${new Date(order.date_created).toLocaleDateString()}
- Status: ${order.status}
- Total: ${order.currency} ${order.total}
- Items: ${order.line_items_count || 'N/A'} items
${order.tracking ? `- Tracking: ${order.tracking.carrier} - ${order.tracking.number}` : ''}
${order.customer_note ? `- Note: ${order.customer_note}` : ''}
    `).join('\n');
}
