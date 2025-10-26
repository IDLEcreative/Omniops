/**
 * WooCommerce customer order operations
 *
 * Handles order status, tracking, cancellation, and order history.
 */

import { WooCommerceCustomer } from './woocommerce-customer';
import { getDynamicWooCommerceClient } from './woocommerce-dynamic';
import {
  CustomerActionResult,
  OrderTrackingData,
  generateTrackingUrl
} from './woocommerce-customer-actions-types';

export class WooCommerceOrderActions {
  /**
   * Get order status and tracking information
   */
  static async getOrderStatus(
    orderNumber: string,
    email: string,
    domain: string
  ): Promise<CustomerActionResult> {
    try {
      const wcCustomer = await WooCommerceCustomer.forDomain(domain);
      if (!wcCustomer) {
        return {
          success: false,
          message: 'WooCommerce not configured for this domain'
        };
      }

      const order = await wcCustomer.searchOrderByNumberAndEmail(orderNumber, email);
      if (!order) {
        return {
          success: false,
          message: `Order #${orderNumber} not found for this email`
        };
      }

      const orderDetails = await wcCustomer.getOrderDetails(order.id);

      if (!orderDetails) {
        return {
          success: false,
          message: `Could not retrieve details for order #${orderNumber}`
        };
      }

      return {
        success: true,
        message: `Order #${orderNumber} Status`,
        data: {
          order_number: orderDetails.number,
          status: orderDetails.status,
          date: orderDetails.date_created,
          total: `${orderDetails.currency} ${orderDetails.total}`,
          payment_method: orderDetails.payment_method_title,
          shipping_address: orderDetails.shipping,
          items: orderDetails.line_items.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          tracking: orderDetails.tracking,
          customer_note: orderDetails.customer_note
        }
      };
    } catch (error: any) {
      console.error('Error fetching order status:', error);
      return {
        success: false,
        message: 'Failed to retrieve order status'
      };
    }
  }

  /**
   * Get recent orders for a customer
   */
  static async getRecentOrders(
    email: string,
    domain: string,
    limit: number = 5
  ): Promise<CustomerActionResult> {
    try {
      const wcCustomer = await WooCommerceCustomer.forDomain(domain);
      if (!wcCustomer) {
        return {
          success: false,
          message: 'WooCommerce not configured for this domain'
        };
      }

      const customer = await wcCustomer.searchCustomerByEmail(email);
      if (!customer) {
        return {
          success: false,
          message: 'Customer not found'
        };
      }

      const orders = await wcCustomer.getCustomerOrders(customer.id, limit);

      return {
        success: true,
        message: `Found ${orders.length} recent orders`,
        data: {
          orders: orders.map(order => ({
            number: order.number,
            date: order.date_created,
            status: order.status,
            total: `${order.currency} ${order.total}`,
            items_count: order.line_items_count
          }))
        }
      };
    } catch (error: any) {
      console.error('Error fetching recent orders:', error);
      return {
        success: false,
        message: 'Failed to retrieve recent orders'
      };
    }
  }

  /**
   * Get order tracking information
   */
  static async getOrderTracking(
    orderNumber: string,
    email: string,
    domain: string
  ): Promise<CustomerActionResult> {
    try {
      const wcCustomer = await WooCommerceCustomer.forDomain(domain);
      if (!wcCustomer) {
        return {
          success: false,
          message: 'WooCommerce not configured for this domain'
        };
      }

      const order = await wcCustomer.searchOrderByNumberAndEmail(orderNumber, email);
      if (!order) {
        return {
          success: false,
          message: `Order #${orderNumber} not found`
        };
      }

      const orderDetails = await wcCustomer.getOrderDetails(order.id);

      if (!orderDetails) {
        return {
          success: false,
          message: `Could not retrieve details for order #${orderNumber}`
        };
      }

      // Check for tracking information
      const trackingData: OrderTrackingData = {
        status: orderDetails.status,
        date_shipped: null,
        carrier: null,
        tracking_number: null,
        tracking_url: null,
        estimated_delivery: null
      };

      // Check if order has shipment tracking (depends on tracking plugin)
      if ((orderDetails as any).meta_data) {
        (orderDetails as any).meta_data.forEach((meta: any) => {
          if (meta.key === '_tracking_number') {
            trackingData.tracking_number = meta.value;
          }
          if (meta.key === '_tracking_carrier') {
            trackingData.carrier = meta.value;
          }
          if (meta.key === '_date_shipped') {
            trackingData.date_shipped = meta.value;
          }
        });
      }

      // Generate tracking URL based on carrier
      if (trackingData.tracking_number && trackingData.carrier) {
        trackingData.tracking_url = generateTrackingUrl(
          trackingData.carrier,
          trackingData.tracking_number
        );
      }

      return {
        success: true,
        message: 'Order tracking information',
        data: {
          order_number: orderNumber,
          order_status: orderDetails.status,
          tracking: trackingData,
          shipping_method: orderDetails.shipping_lines[0]?.method_title || 'Standard',
          shipping_address: `${orderDetails.shipping.address_1}, ${orderDetails.shipping.city}, ${orderDetails.shipping.postcode}`
        }
      };
    } catch (error: any) {
      console.error('Error fetching tracking info:', error);
      return {
        success: false,
        message: 'Failed to retrieve tracking information'
      };
    }
  }

  /**
   * Cancel an order (if allowed)
   */
  static async cancelOrder(
    orderNumber: string,
    email: string,
    domain: string,
    reason?: string
  ): Promise<CustomerActionResult> {
    try {
      const wc = await getDynamicWooCommerceClient(domain);
      if (!wc) {
        return {
          success: false,
          message: 'WooCommerce not configured for this domain'
        };
      }

      // Find the order by searching
      const orders = await wc.getOrders({ search: orderNumber });
      const order = Array.isArray(orders) ? orders.find((o: any) =>
        o.number === orderNumber && o.billing.email === email
      ) : undefined;

      if (!order) {
        return {
          success: false,
          message: `Order #${orderNumber} not found`
        };
      }

      // Check if order can be cancelled
      const cancellableStatuses = ['pending', 'on-hold', 'processing'];
      if (!cancellableStatuses.includes(order.status)) {
        return {
          success: false,
          message: `Order cannot be cancelled. Current status: ${order.status}`
        };
      }

      // Cancel the order
      const updatedOrder = await wc.updateOrder(order.id, {
        status: 'cancelled',
        customer_note: reason || 'Cancelled by customer request'
      });

      return {
        success: true,
        message: `Order #${orderNumber} has been cancelled`,
        data: {
          order_number: orderNumber,
          new_status: updatedOrder.status,
          refund_info: 'A refund will be processed within 3-5 business days'
        }
      };
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      return {
        success: false,
        message: 'Failed to cancel order'
      };
    }
  }
}
