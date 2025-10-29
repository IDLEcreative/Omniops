/**
 * WooCommerce Order Lookup Operations
 * Handles order status checks and shipping information retrieval
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult
} from '../woocommerce-tool-types';
import {
  formatOrderMessage,
  extractOrderInfo
} from '../woocommerce-tool-formatters';

/**
 * Check order status
 * Retrieves order information by ID or email
 */
export async function checkOrder(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  if (!params.orderId && !params.email) {
    return {
      success: false,
      data: null,
      message: "Order ID or email is required for order lookup"
    };
  }

  try {
    let order = null;

    // Try to get order by ID first
    if (params.orderId) {
      const numericId = parseInt(params.orderId, 10);
      if (!isNaN(numericId)) {
        try {
          order = await wc.getOrder(numericId);
        } catch (error) {
          // Order not found by ID, will try email search
          console.log(`[WooCommerce Agent] Order ID ${numericId} not found`);
        }
      }
    }

    // If not found by ID, try searching by order number or email
    if (!order && (params.orderId || params.email)) {
      const searchTerm = params.email || params.orderId;
      const orders = await wc.getOrders({
        search: searchTerm,
        per_page: 1,
      });

      if (orders && orders.length > 0) {
        order = orders[0];
      }
    }

    if (!order) {
      return {
        success: false,
        data: null,
        message: `No order found for ${params.email ? 'email' : 'order ID'}: ${params.email || params.orderId}`
      };
    }

    const orderInfo = extractOrderInfo(order);
    const message = formatOrderMessage(orderInfo);

    return {
      success: true,
      data: orderInfo,
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Order lookup error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve order information"
    };
  }
}

/**
 * Get shipping information
 * Retrieves shipping zones and methods configured in WooCommerce
 */
export async function getShippingInfo(
  wc: any
): Promise<WooCommerceOperationResult> {
  try {
    const shippingZones = await wc.get('shipping/zones');
    return {
      success: true,
      data: shippingZones,
      message: "Retrieved shipping information"
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: "Failed to get shipping information"
    };
  }
}
