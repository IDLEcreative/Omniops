/**
 * Get customer order history operation
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult
} from './types';
import { extractOrderInfo } from '../../woocommerce-tool-formatters';
import { calculatePagination, formatPaginationMessage, offsetToPage } from '../../pagination-utils';
import { formatOrderListMessage, formatFiltersMessage } from './order-formatter';

/**
 * Get customer order history
 * Retrieves all orders for a customer email with optional filtering
 * Most complex order tool - requires customer resolution and aggregation
 */
export async function getCustomerOrders(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.email) {
    return {
      success: false,
      data: null,
      message: "Customer email is required for order history"
    };
  }

  try {
    // Handle pagination parameters
    let page = params.page || 1;
    const perPage = params.per_page || params.limit || 20; // Default to 20 for orders

    // If offset is provided, convert to page number
    if (params.offset !== undefined) {
      page = offsetToPage(params.offset, perPage);
    }

    // Build query parameters
    const queryParams: any = {
      per_page: Math.min(perPage, 100), // Cap at 100 per WooCommerce API limits
      page: page,
      orderby: 'date',
      order: 'desc'
    };

    // Filter by email (WooCommerce will search billing email)
    queryParams.search = params.email;

    // Filter by status if provided
    if (params.status) {
      queryParams.status = params.status;
    }

    // Filter by date range if provided
    if (params.dateFrom) {
      queryParams.after = params.dateFrom + 'T00:00:00';
    }

    if (params.dateTo) {
      queryParams.before = params.dateTo + 'T23:59:59';
    }

    // Get orders
    const orders = await wc.getOrders(queryParams);

    if (orders && orders.length > 0) {
      // Extract order information
      const orderList = orders.map((order: any) => extractOrderInfo(order));

      // Estimate total for pagination
      const estimatedTotal = orders.length < perPage
        ? (page - 1) * perPage + orders.length
        : page * perPage + perPage;

      const pagination = calculatePagination(page, perPage, estimatedTotal);

      // Calculate summary statistics
      const totalOrders = orderList.length;
      const totalSpent = orderList.reduce((sum: number, o: any) => sum + parseFloat(o.total), 0);
      const averageOrderValue = totalSpent / totalOrders;

      // Count by status
      const statusCounts: Record<string, number> = {};
      orderList.forEach((order: any) => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      // Format message
      let message = formatOrderListMessage(orderList, params, statusCounts);
      message += formatFiltersMessage(params);
      message += formatPaginationMessage(pagination);

      return {
        success: true,
        data: {
          orders: orderList,
          summary: {
            totalOrders,
            totalSpent,
            averageOrderValue,
            statusCounts
          }
        },
        message,
        pagination
      };
    } else {
      // No orders found
      const pagination = calculatePagination(page, perPage, 0);

      let message = `No orders found for ${params.email}`;

      if (params.status || params.dateFrom || params.dateTo) {
        message += ` with the specified filters:\n`;
        if (params.status) message += `  - Status: ${params.status}\n`;
        if (params.dateFrom) message += `  - From: ${params.dateFrom}\n`;
        if (params.dateTo) message += `  - To: ${params.dateTo}\n`;
      }

      return {
        success: true,
        data: { orders: [], summary: { totalOrders: 0, totalSpent: 0, averageOrderValue: 0, statusCounts: {} } },
        message,
        pagination
      };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Customer orders error:', error);
    return {
      success: false,
      data: null,
      message: `Failed to retrieve order history for ${params.email}`
    };
  }
}
