import { WooCommerceCustomer } from './woocommerce-customer';
import { getDynamicWooCommerceClient } from './woocommerce-dynamic';
import { createServiceRoleClient } from '@/lib/supabase-server';

export interface CustomerActionResult {
  success: boolean;
  message: string;
  data?: any;
  requiresVerification?: boolean;
}

/**
 * Customer actions that can be performed after verification
 */
export class WooCommerceCustomerActions {
  
  /**
   * Get full customer information including addresses
   */
  static async getCustomerInfo(
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

      const customer = await wcCustomer.searchCustomerByEmail(email);
      if (!customer) {
        return {
          success: false,
          message: 'Customer not found'
        };
      }

      return {
        success: true,
        message: 'Customer information retrieved',
        data: {
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email,
          billing_address: customer.billing,
          shipping_address: customer.shipping,
          created: customer.date_created,
          total_orders: customer.orders_count,
          total_spent: customer.total_spent
        }
      };
    } catch (error: any) {
      console.error('Error fetching customer info:', error);
      return {
        success: false,
        message: 'Failed to retrieve customer information'
      };
    }
  }

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
      
      // Format tracking information
      let trackingInfo = '';
      if (orderDetails.tracking) {
        trackingInfo = `\nTracking: ${orderDetails.tracking.carrier} - ${orderDetails.tracking.number}`;
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
   * Update customer shipping address
   */
  static async updateShippingAddress(
    email: string,
    domain: string,
    newAddress: {
      first_name?: string;
      last_name?: string;
      address_1?: string;
      address_2?: string;
      city?: string;
      state?: string;
      postcode?: string;
      country?: string;
      phone?: string;
    }
  ): Promise<CustomerActionResult> {
    try {
      const wc = await getDynamicWooCommerceClient(domain);
      if (!wc) {
        return {
          success: false,
          message: 'WooCommerce not configured for this domain'
        };
      }

      // First, find the customer
      const customer = await wc.getCustomerByEmail(email);
      if (!customer) {
        return {
          success: false,
          message: 'Customer not found'
        };
      }

      // Update shipping address
      const updatedCustomer = await wc.updateCustomer(customer.id, {
        shipping: {
          ...customer.shipping,
          ...newAddress
        }
      });

      return {
        success: true,
        message: 'Shipping address updated successfully',
        data: {
          new_address: updatedCustomer.shipping
        }
      };
    } catch (error: any) {
      console.error('Error updating shipping address:', error);
      return {
        success: false,
        message: 'Failed to update shipping address'
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
      const trackingData = {
        status: orderDetails.status,
        date_shipped: null as string | null,
        carrier: null as string | null,
        tracking_number: null as string | null,
        tracking_url: null as string | null,
        estimated_delivery: null as string | null
      };

      // Check if order has shipment tracking (this depends on your tracking plugin)
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
        trackingData.tracking_url = generateTrackingUrl(trackingData.carrier, trackingData.tracking_number);
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

/**
 * Generate tracking URL based on carrier
 */
function generateTrackingUrl(carrier: string, trackingNumber: string): string {
  const carriers: Record<string, string> = {
    'ups': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'fedex': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'usps': `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`,
    'dhl': `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`,
    'royal-mail': `https://www.royalmail.com/track-your-item#/tracking-results/${trackingNumber}`,
    'dpd': `https://www.dpd.co.uk/tracking/?parcel=${trackingNumber}`,
    'hermes': `https://www.evri.com/track-parcel/${trackingNumber}`
  };

  const carrierLower = carrier.toLowerCase().replace(/\s+/g, '-');
  return carriers[carrierLower] || `#tracking-${trackingNumber}`;
}