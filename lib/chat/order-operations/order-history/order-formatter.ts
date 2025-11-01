/**
 * Order formatting utilities
 */

import { getCurrencySymbol } from '../../currency-utils';
import type { WooCommerceOperationParams } from './types';

/**
 * Get emoji for order status
 */
export function getStatusEmoji(status: string): string {
  switch (status) {
    case 'completed': return '✅';
    case 'processing': return '⚙️';
    case 'pending': return '⏳';
    case 'cancelled': return '❌';
    case 'refunded': return '💸';
    default: return '📋';
  }
}

/**
 * Format order list message
 */
export function formatOrderListMessage(
  orderList: any[],
  params: WooCommerceOperationParams,
  statusCounts: Record<string, number>
): string {
  const currencySymbol = getCurrencySymbol(params);
  const totalOrders = orderList.length;
  const totalSpent = orderList.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const averageOrderValue = totalSpent / totalOrders;

  let message = `📦 Order History for ${params.email}\n\n`;

  message += `📊 Summary:\n`;
  message += `   Total Orders: ${totalOrders}\n`;
  message += `   Total Spent: ${currencySymbol}${totalSpent.toFixed(2)}\n`;
  message += `   Average Order: ${currencySymbol}${averageOrderValue.toFixed(2)}\n\n`;

  // Show status breakdown
  message += `📈 Status Breakdown:\n`;
  Object.entries(statusCounts).forEach(([status, count]) => {
    const statusEmoji = getStatusEmoji(status);
    message += `   ${statusEmoji} ${status}: ${count}\n`;
  });

  message += `\n📋 Recent Orders:\n\n`;

  // Show individual orders
  orderList.forEach((order, index) => {
    const statusEmoji = getStatusEmoji(order.status);

    message += `${index + 1}. Order #${order.number} ${statusEmoji}\n`;
    message += `   Date: ${new Date(order.date).toLocaleDateString()}\n`;
    message += `   Total: ${currencySymbol}${parseFloat(order.total).toFixed(2)}\n`;
    message += `   Status: ${order.status}\n`;

    // Show items (limit to 3)
    if (order.items && order.items.length > 0) {
      message += `   Items:\n`;
      order.items.slice(0, 3).forEach((item: any) => {
        message += `     • ${item.name} (${item.quantity}x)\n`;
      });
      if (order.items.length > 3) {
        message += `     • ...and ${order.items.length - 3} more item(s)\n`;
      }
    }

    message += `\n`;
  });

  return message;
}

/**
 * Format filters applied message
 */
export function formatFiltersMessage(params: WooCommerceOperationParams): string {
  const filters = [];
  if (params.status) filters.push(`status: ${params.status}`);
  if (params.dateFrom) filters.push(`from: ${params.dateFrom}`);
  if (params.dateTo) filters.push(`to: ${params.dateTo}`);

  if (filters.length > 0) {
    return `🔍 Filters applied: ${filters.join(', ')}\n`;
  }

  return '';
}
