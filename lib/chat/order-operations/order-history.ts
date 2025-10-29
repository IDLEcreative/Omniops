/**
 * WooCommerce Order History Operations
 * Handles customer order history and order notes retrieval
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  OrderNoteInfo
} from '../woocommerce-tool-types';
import { extractOrderInfo } from '../woocommerce-tool-formatters';

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
    // Build query parameters
    const queryParams: any = {
      per_page: params.limit || 10,
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

      // Calculate summary statistics
      const totalOrders = orderList.length;
      const totalSpent = orderList.reduce((sum, o) => sum + parseFloat(o.total), 0);
      const averageOrderValue = totalSpent / totalOrders;

      // Count by status
      const statusCounts: Record<string, number> = {};
      orderList.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      // Format message
      let message = `📦 Order History for ${params.email}\n\n`;

      message += `📊 Summary:\n`;
      message += `   Total Orders: ${totalOrders}\n`;
      message += `   Total Spent: £${totalSpent.toFixed(2)}\n`;
      message += `   Average Order: £${averageOrderValue.toFixed(2)}\n\n`;

      // Show status breakdown
      message += `📈 Status Breakdown:\n`;
      Object.entries(statusCounts).forEach(([status, count]) => {
        const statusEmoji = status === 'completed' ? '✅' :
                           status === 'processing' ? '⚙️' :
                           status === 'pending' ? '⏳' :
                           status === 'cancelled' ? '❌' :
                           status === 'refunded' ? '💸' : '📋';
        message += `   ${statusEmoji} ${status}: ${count}\n`;
      });

      message += `\n📋 Recent Orders:\n\n`;

      // Show individual orders
      orderList.forEach((order, index) => {
        const statusEmoji = order.status === 'completed' ? '✅' :
                           order.status === 'processing' ? '⚙️' :
                           order.status === 'pending' ? '⏳' :
                           order.status === 'cancelled' ? '❌' :
                           order.status === 'refunded' ? '💸' : '📋';

        message += `${index + 1}. Order #${order.number} ${statusEmoji}\n`;
        message += `   Date: ${new Date(order.date).toLocaleDateString()}\n`;
        message += `   Total: £${parseFloat(order.total).toFixed(2)}\n`;
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

      // Add filters applied note
      const filters = [];
      if (params.status) filters.push(`status: ${params.status}`);
      if (params.dateFrom) filters.push(`from: ${params.dateFrom}`);
      if (params.dateTo) filters.push(`to: ${params.dateTo}`);

      if (filters.length > 0) {
        message += `🔍 Filters applied: ${filters.join(', ')}\n`;
      }

      if (orders.length >= (params.limit || 10)) {
        message += `\n⚠️ Showing first ${params.limit || 10} orders. There may be more.`;
      }

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
        message
      };
    } else {
      // No orders found
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
        message
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

/**
 * Get order notes
 * Retrieves all notes (customer-facing and internal) for an order
 */
export async function getOrderNotes(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.orderId) {
    return {
      success: false,
      data: null,
      message: "Order ID is required for order notes"
    };
  }

  try {
    const orderId = parseInt(params.orderId, 10);
    if (isNaN(orderId)) {
      return {
        success: false,
        data: null,
        message: "Invalid order ID format"
      };
    }

    // First verify the order exists
    let order;
    try {
      order = await wc.getOrder(orderId);
    } catch (error) {
      return {
        success: false,
        data: null,
        message: `Order #${orderId} not found`
      };
    }

    // Get order notes
    const notes = await wc.getOrderNotes(orderId);

    if (notes && notes.length > 0) {
      const noteList: OrderNoteInfo[] = notes.map((note: any) => ({
        id: note.id,
        author: note.author || 'System',
        dateCreated: note.date_created,
        note: note.note,
        customerNote: note.customer_note
      }));

      // Separate customer notes from internal notes
      const customerNotes = noteList.filter(n => n.customerNote);
      const internalNotes = noteList.filter(n => !n.customerNote);

      // Build message
      let message = `📝 Order Notes for Order #${orderId}\n\n`;
      message += `Order Status: ${order.status}\n`;
      message += `Total Notes: ${noteList.length} (${customerNotes.length} customer-facing, ${internalNotes.length} internal)\n\n`;

      // Show customer-facing notes first
      if (customerNotes.length > 0) {
        message += `👤 Customer-Facing Notes (${customerNotes.length}):\n\n`;
        customerNotes.forEach((note, index) => {
          const date = new Date(note.dateCreated).toLocaleDateString();
          const time = new Date(note.dateCreated).toLocaleTimeString();

          message += `${index + 1}. ${note.author} - ${date} at ${time}\n`;
          message += `   ${note.note}\n\n`;
        });
      }

      // Show internal notes
      if (internalNotes.length > 0) {
        message += `🔒 Internal Notes (${internalNotes.length}):\n\n`;
        internalNotes.forEach((note, index) => {
          const date = new Date(note.dateCreated).toLocaleDateString();
          const time = new Date(note.dateCreated).toLocaleTimeString();

          message += `${index + 1}. ${note.author} - ${date} at ${time}\n`;
          message += `   ${note.note}\n\n`;
        });
      }

      return {
        success: true,
        data: {
          notes: noteList,
          customerNotes,
          internalNotes
        },
        message
      };
    } else {
      return {
        success: true,
        data: {
          notes: [],
          customerNotes: [],
          internalNotes: []
        },
        message: `No notes found for Order #${orderId}\n\nOrder Status: ${order.status}`
      };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Order notes error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve order notes"
    };
  }
}
