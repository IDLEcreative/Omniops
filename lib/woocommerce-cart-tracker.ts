import { WooCommerceAPI } from './woocommerce-api';
import { Order } from './woocommerce-full';

export interface AbandonedCart {
  orderId: number;
  status: string;
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
  cart: {
    total: string;
    currency: string;
    itemCount: number;
    items: Array<{
      name: string;
      quantity: number;
      price: string;
      total: string;
    }>;
  };
  dates: {
    created: string;
    modified: string;
    abandoned_duration: string;
  };
  recovery: {
    priority: 'high' | 'medium' | 'low';
    suggested_action: string;
    recovery_url?: string;
  };
}

export class WooCommerceCartTracker {
  private wc: WooCommerceAPI;

  constructor(woocommerce?: WooCommerceAPI) {
    this.wc = woocommerce || new WooCommerceAPI();
  }

  /**
   * Get abandoned carts (pending, on-hold, and failed orders)
   */
  async getAbandonedCarts(options?: {
    limit?: number;
    includeStatuses?: string[];
    minValue?: number;
    hoursOld?: number;
  }): Promise<AbandonedCart[]> {
    const {
      limit = 20,
      includeStatuses = ['pending', 'on-hold', 'failed'],
      minValue = 0,
      hoursOld = 1
    } = options || {};

    try {
      // Fetch orders with abandoned-like statuses
      const orders = await this.wc.getOrders({
        status: includeStatuses,
        per_page: limit,
        orderby: 'date',
        order: 'desc'
      });

      const now = new Date();
      const cutoffTime = new Date(now.getTime() - (hoursOld * 60 * 60 * 1000));

      // Transform orders into abandoned cart format
      const abandonedCarts: AbandonedCart[] = orders
        .filter(order => {
          const orderDate = new Date(order.date_created);
          const orderValue = parseFloat(order.total);
          return orderDate < cutoffTime && orderValue >= minValue;
        })
        .map(order => this.transformOrderToCart(order));

      return abandonedCarts;
    } catch (error) {
      console.error('Error fetching abandoned carts:', error);
      throw error;
    }
  }

  /**
   * Get a specific abandoned cart by order ID
   */
  async getAbandonedCart(orderId: number): Promise<AbandonedCart | null> {
    try {
      const order = await this.wc.getOrder(orderId);
      
      // Check if order has an abandoned-like status
      if (!['pending', 'on-hold', 'failed'].includes(order.status)) {
        return null;
      }

      return this.transformOrderToCart(order);
    } catch (error) {
      console.error(`Error fetching cart for order ${orderId}:`, error);
      return null;
    }
  }

  /**
   * Get cart recovery statistics
   */
  async getCartRecoveryStats(days: number = 7): Promise<{
    total_abandoned: number;
    total_value: number;
    average_cart_value: number;
    by_status: Record<string, number>;
    top_abandoned_products: Array<{ name: string; count: number }>;
    recovery_rate?: number;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch abandoned orders
      const abandonedOrders = await this.wc.getOrders({
        status: ['pending', 'on-hold', 'failed'],
        after: startDate.toISOString(),
        per_page: 100
      });

      // Fetch recovered orders (completed in same period)
      const completedOrders = await this.wc.getOrders({
        status: ['completed', 'processing'],
        after: startDate.toISOString(),
        per_page: 100
      });

      // Calculate statistics
      const stats = {
        total_abandoned: abandonedOrders.length,
        total_value: abandonedOrders.reduce((sum, order) => sum + parseFloat(order.total), 0),
        average_cart_value: 0,
        by_status: {} as Record<string, number>,
        top_abandoned_products: [] as Array<{ name: string; count: number }>,
        recovery_rate: 0
      };

      stats.average_cart_value = stats.total_abandoned > 0 
        ? stats.total_value / stats.total_abandoned 
        : 0;

      // Count by status
      abandonedOrders.forEach(order => {
        stats.by_status[order.status] = (stats.by_status[order.status] || 0) + 1;
      });

      // Find top abandoned products
      const productCounts: Record<string, number> = {};
      abandonedOrders.forEach(order => {
        order.line_items?.forEach(item => {
          productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
        });
      });

      stats.top_abandoned_products = Object.entries(productCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate recovery rate
      const totalCarts = abandonedOrders.length + completedOrders.length;
      stats.recovery_rate = totalCarts > 0 
        ? (completedOrders.length / totalCarts) * 100 
        : 0;

      return stats;
    } catch (error) {
      console.error('Error calculating cart recovery stats:', error);
      throw error;
    }
  }

  /**
   * Send cart recovery reminder (requires email integration)
   */
  async sendRecoveryReminder(orderId: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const cart = await this.getAbandonedCart(orderId);
      
      if (!cart) {
        return {
          success: false,
          message: 'Cart not found or already recovered'
        };
      }

      // Add a note to the order
      await this.wc.createOrderNote(orderId, {
        note: `Cart recovery reminder scheduled for ${cart.customer.email}`,
        customer_note: false
      });

      // In a real implementation, this would trigger an email
      // For now, we just mark it as reminder sent
      return {
        success: true,
        message: `Recovery reminder marked for ${cart.customer.email}`
      };
    } catch (error) {
      console.error('Error sending recovery reminder:', error);
      return {
        success: false,
        message: 'Failed to send recovery reminder'
      };
    }
  }

  /**
   * Transform WooCommerce order to abandoned cart format
   */
  private transformOrderToCart(order: Order): AbandonedCart {
    const now = new Date();
    const createdDate = new Date(order.date_created);
    const hoursSinceCreated = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    const orderValue = parseFloat(order.total);
    
    // Simple priority calculation
    const { priority, suggested_action } = this.calculatePriority(orderValue, hoursSinceCreated);
    
    // Format duration
    const duration = hoursSinceCreated < 24
      ? `${Math.round(hoursSinceCreated)} hours`
      : `${Math.round(hoursSinceCreated / 24)} days`;

    return {
      orderId: order.id,
      status: order.status,
      customer: {
        email: order.billing.email,
        name: `${order.billing.first_name} ${order.billing.last_name}`.trim() || 'Guest',
        phone: order.billing.phone
      },
      cart: {
        total: order.total,
        currency: order.currency,
        itemCount: order.line_items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        items: order.line_items?.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: String(item.price),
          total: item.total
        })) || []
      },
      dates: {
        created: order.date_created,
        modified: order.date_modified,
        abandoned_duration: duration
      },
      recovery: {
        priority,
        suggested_action,
        recovery_url: order.order_key 
          ? `/checkout/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`
          : undefined
      }
    };
  }

  /**
   * Calculate cart priority based on value and age
   */
  private calculatePriority(value: number, hoursOld: number): {
    priority: 'high' | 'medium' | 'low';
    suggested_action: string;
  } {
    if (value > 100 && hoursOld < 24) {
      return { 
        priority: 'high', 
        suggested_action: 'Send immediate recovery email with discount code' 
      };
    }
    if (value > 50 || hoursOld < 48) {
      return { 
        priority: 'medium', 
        suggested_action: 'Send friendly reminder email' 
      };
    }
    return { 
      priority: 'low', 
      suggested_action: 'Add to weekly recovery campaign' 
    };
  }
}

// Export singleton instance
export const cartTracker = new WooCommerceCartTracker();