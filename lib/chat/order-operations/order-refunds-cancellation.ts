/**
 * WooCommerce Order Refunds and Cancellation Operations
 * Handles refund status checks and order cancellation
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  RefundInfo,
  CancelOrderInfo
} from '../woocommerce-tool-types';

/**
 * Check refund status for an order
 * Shows all refunds processed for an order with amounts and reasons
 */
export async function checkRefundStatus(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.orderId) {
    return {
      success: false,
      data: null,
      message: "Order ID is required for refund check"
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

    // Get refunds for this order
    const refunds = await wc.getOrderRefunds(orderId);

    if (refunds && refunds.length > 0) {
      const refundList: RefundInfo[] = refunds.map((refund: any) => ({
        id: refund.id,
        orderId: refund.parent_id || orderId,
        dateCreated: refund.date_created,
        amount: refund.amount,
        reason: refund.reason || 'No reason provided',
        refundedBy: refund.refunded_by,
        lineItems: refund.line_items
      }));

      // Calculate total refunded
      const totalRefunded = refundList.reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const orderTotal = parseFloat(order.total);
      const remainingAmount = orderTotal - totalRefunded;

      // Build message
      let message = `💸 Refund Status for Order #${orderId}\n\n`;
      message += `Order Total: £${orderTotal.toFixed(2)}\n`;
      message += `Total Refunded: £${totalRefunded.toFixed(2)}\n`;
      message += `Remaining: £${remainingAmount.toFixed(2)}\n\n`;

      if (totalRefunded >= orderTotal) {
        message += `✅ Order fully refunded\n\n`;
      } else if (totalRefunded > 0) {
        message += `⚠️ Partial refund (${((totalRefunded / orderTotal) * 100).toFixed(0)}%)\n\n`;
      }

      message += `📋 Refund History (${refundList.length} refund${refundList.length > 1 ? 's' : ''}):\n\n`;

      refundList.forEach((refund, index) => {
        const date = new Date(refund.dateCreated).toLocaleDateString();
        const time = new Date(refund.dateCreated).toLocaleTimeString();

        message += `${index + 1}. Refund #${refund.id}\n`;
        message += `   Amount: £${parseFloat(refund.amount).toFixed(2)}\n`;
        message += `   Date: ${date} at ${time}\n`;
        message += `   Reason: ${refund.reason}\n`;

        // Show refunded items if available
        if (refund.lineItems && refund.lineItems.length > 0) {
          message += `   Items refunded:\n`;
          refund.lineItems.forEach((item: any) => {
            if (item.quantity > 0) {
              message += `     • ${item.name} (${item.quantity}x)\n`;
            }
          });
        }

        message += `\n`;
      });

      return {
        success: true,
        data: { refunds: refundList, totalRefunded, orderTotal, remainingAmount },
        message
      };
    } else {
      return {
        success: true,
        data: { refunds: [], totalRefunded: 0, orderTotal: parseFloat(order.total) },
        message: `No refunds found for Order #${orderId}\n\nOrder Total: £${parseFloat(order.total).toFixed(2)}\nRefunded: £0.00\n\n✅ Order has not been refunded`
      };
    }
  } catch (error) {
    console.error('[WooCommerce Agent] Refund check error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve refund information"
    };
  }
}

/**
 * Cancel order
 * Allows customers to cancel their order if it's still in pending/processing status
 * Cannot cancel orders that are already completed, shipped, or cancelled
 */
export async function cancelOrder(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    if (!params.orderId) {
      return {
        success: false,
        data: null,
        message: "Order ID is required to cancel an order"
      };
    }

    // Get current order status
    const order = await wc.getOrder(params.orderId);

    if (!order) {
      return {
        success: false,
        data: null,
        message: `Order #${params.orderId} not found`
      };
    }

    const currentStatus = order.status;

    // Check if order can be cancelled
    const cancellableStatuses = ['pending', 'processing', 'on-hold'];
    if (!cancellableStatuses.includes(currentStatus)) {
      let message = `Cannot cancel order #${params.orderId}. `;

      if (currentStatus === 'completed') {
        message += "Order is already completed. Please request a return or refund instead.";
      } else if (currentStatus === 'cancelled') {
        message += "Order is already cancelled.";
      } else if (currentStatus === 'refunded') {
        message += "Order has already been refunded.";
      } else if (currentStatus === 'failed') {
        message += "Order has failed and cannot be cancelled.";
      } else {
        message += `Orders with status '${currentStatus}' cannot be cancelled.`;
      }

      return {
        success: false,
        data: null,
        message
      };
    }

    // Update order status to cancelled
    const updateData: any = {
      status: 'cancelled'
    };

    await wc.updateOrder(params.orderId, updateData);

    // Add cancellation note
    const noteText = params.reason
      ? `Order cancelled by customer. Reason: ${params.reason}`
      : 'Order cancelled by customer via chat support';

    await wc.createOrderNote(params.orderId, {
      note: noteText,
      customer_note: true
    });

    // Determine if refund should be initiated
    const refundInitiated = currentStatus === 'processing'; // Only if payment captured

    let message = `✅ Order #${params.orderId} has been successfully cancelled.\n\n`;
    message += `Previous Status: ${currentStatus}\n`;
    message += `New Status: cancelled\n`;

    if (refundInitiated) {
      message += `\n💰 Refund Process: A refund will be initiated and processed within 5-7 business days.\n`;
    } else {
      message += `\n💡 No payment was captured, so no refund is necessary.\n`;
    }

    if (params.reason) {
      message += `\nCancellation Reason: ${params.reason}`;
    }

    const cancelData: CancelOrderInfo = {
      orderId: parseInt(params.orderId),
      previousStatus: currentStatus,
      newStatus: 'cancelled',
      reason: params.reason,
      refundInitiated,
      cancelledAt: new Date().toISOString(),
      message: 'Order cancelled successfully'
    };

    return {
      success: true,
      data: cancelData,
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Cancel order error:', error);
    return {
      success: false,
      data: null,
      message: `Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
