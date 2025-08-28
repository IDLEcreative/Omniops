import { WooCommerceAPI } from './woocommerce-api';
import { getDynamicWooCommerceClient } from './woocommerce-dynamic';
import { DataMasker, CustomerVerification } from './customer-verification';

export interface CustomerSearchResult {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  date_created: string;
  orders_count: number;
  total_spent: string;
  avatar_url?: string;
  billing?: any;
  shipping?: any;
}

export interface OrderSummary {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  line_items_count: number;
  customer_note?: string;
}

export interface OrderDetail {
  id: number;
  number: string;
  status: string;
  date_created: string;
  date_modified: string;
  total: string;
  currency: string;
  payment_method_title: string;
  billing: any;
  shipping: any;
  line_items: any[];
  shipping_lines: any[];
  coupon_lines: any[];
  customer_note?: string;
  tracking?: any;
}

export class WooCommerceCustomer {
  private wc: WooCommerceAPI;
  private domain?: string;

  constructor(wooCommerceClient: WooCommerceAPI, domain?: string) {
    this.wc = wooCommerceClient;
    this.domain = domain;
  }

  /**
   * Create instance for a specific domain
   */
  static async forDomain(domain: string): Promise<WooCommerceCustomer | null> {
    const client = await getDynamicWooCommerceClient(domain);
    if (!client) {
      return null;
    }
    return new WooCommerceCustomer(client, domain);
  }

  /**
   * Create instance using environment variables
   */
  static fromEnvironment(): WooCommerceCustomer {
    return new WooCommerceCustomer(new WooCommerceAPI());
  }

  /**
   * Search for customer by email
   */
  async searchCustomerByEmail(
    email: string,
    conversationId?: string
  ): Promise<CustomerSearchResult | null> {
    try {
      const customer = await this.wc.getCustomerByEmail(email);
      
      if (!customer) {
        return null;
      }

      // Ensure the customer object has all required properties
      // Note: orders_count and total_spent are not available from single customer fetch
      // These would need to be fetched separately or from customer list endpoint
      const result: CustomerSearchResult = {
        id: customer.id,
        email: customer.email || email,
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        username: customer.username,
        date_created: customer.date_created,
        orders_count: 0, // Would need separate API call to get actual count
        total_spent: '0.00', // Would need separate API call to get actual total
        avatar_url: customer.avatar_url,
        billing: customer.billing,
        shipping: customer.shipping
      };
      
      if (conversationId) {
        // Log the access
        await CustomerVerification.logAccess(
          conversationId,
          email,
          customer.id,
          ['profile_search'],
          'Customer lookup by email',
          'email_verification'
        );

        // Cache the result
        await CustomerVerification.cacheCustomerData(
          conversationId,
          email,
          customer.id,
          result,
          'profile'
        );
      }

      return result;
    } catch (error) {
      console.error('Error searching customer by email:', error);
      return null;
    }
  }

  /**
   * Get customer orders
   */
  async getCustomerOrders(
    customerId: number,
    limit: number = 10,
    conversationId?: string,
    customerEmail?: string
  ): Promise<OrderSummary[]> {
    try {
      const orders = await this.wc.getOrders({
        customer: customerId,
        per_page: limit,
        orderby: 'date',
        order: 'desc'
      });

      const orderSummaries: OrderSummary[] = orders.map(order => ({
        id: order.id,
        number: order.number,
        status: order.status,
        date_created: order.date_created,
        total: order.total,
        currency: order.currency,
        line_items_count: order.line_items?.length || 0,
        customer_note: order.customer_note
      }));

      if (conversationId && customerEmail) {
        // Log the access
        await CustomerVerification.logAccess(
          conversationId,
          customerEmail,
          customerId,
          ['order_history'],
          'Customer orders lookup',
          'email_verification'
        );

        // Cache the result
        await CustomerVerification.cacheCustomerData(
          conversationId,
          customerEmail,
          customerId,
          orderSummaries,
          'orders'
        );
      }

      return orderSummaries;
    } catch (error) {
      console.error('Error getting customer orders:', error);
      return [];
    }
  }

  /**
   * Get specific order details
   */
  async getOrderDetails(
    orderId: number,
    conversationId?: string,
    customerEmail?: string
  ): Promise<OrderDetail | null> {
    try {
      const order = await this.wc.getOrder(orderId);

      if (!order) {
        return null;
      }

      const orderDetail: OrderDetail = {
        id: order.id,
        number: order.number,
        status: order.status,
        date_created: order.date_created,
        date_modified: order.date_modified,
        total: order.total,
        currency: order.currency,
        payment_method_title: order.payment_method_title,
        billing: DataMasker.maskAddress(order.billing),
        shipping: DataMasker.maskAddress(order.shipping),
        line_items: order.line_items?.map((item: any) => ({
          id: item.id,
          name: item.name,
          product_id: item.product_id,
          quantity: item.quantity,
          total: item.total,
          sku: item.sku,
          price: item.price
        })) || [],
        shipping_lines: order.shipping_lines || [],
        coupon_lines: order.coupon_lines || [],
        customer_note: order.customer_note
      };

      if (conversationId && customerEmail) {
        // Log the access
        await CustomerVerification.logAccess(
          conversationId,
          customerEmail,
          order.customer_id,
          ['order_detail', `order_${orderId}`],
          'Order details lookup',
          'email_verification'
        );

        // Cache the result
        await CustomerVerification.cacheCustomerData(
          conversationId,
          customerEmail,
          order.customer_id,
          orderDetail,
          'order_detail'
        );
      }

      return orderDetail;
    } catch (error) {
      console.error('Error getting order details:', error);
      return null;
    }
  }

  /**
   * Get recent purchases for a customer
   */
  async getRecentPurchases(
    customerId: number,
    limit: number = 5,
    conversationId?: string,
    customerEmail?: string
  ): Promise<any[]> {
    try {
      const orders = await this.wc.getOrders({
        customer: customerId,
        per_page: limit,
        orderby: 'date',
        order: 'desc',
        status: 'completed' as const
      });

      const purchases: any[] = [];
      
      for (const order of orders) {
        if (order.line_items) {
          for (const item of order.line_items) {
            purchases.push({
              order_id: order.id,
              order_number: order.number,
              order_date: order.date_created,
              product_id: item.product_id,
              product_name: item.name,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              sku: item.sku
            });
          }
        }
      }

      if (conversationId && customerEmail) {
        // Log the access
        await CustomerVerification.logAccess(
          conversationId,
          customerEmail,
          customerId,
          ['recent_purchases'],
          'Recent purchases lookup',
          'email_verification'
        );

        // Cache the result
        await CustomerVerification.cacheCustomerData(
          conversationId,
          customerEmail,
          customerId,
          purchases.slice(0, limit),
          'recent_purchases'
        );
      }

      return purchases.slice(0, limit);
    } catch (error) {
      console.error('Error getting recent purchases:', error);
      return [];
    }
  }

  /**
   * Verify order ownership
   */
  async verifyOrderOwnership(
    orderNumber: string,
    email: string
  ): Promise<{ verified: boolean; orderId?: number; customerId?: number }> {
    try {
      // Search for the order
      const orders = await this.wc.getOrders({
        search: orderNumber,
        per_page: 1
      });

      if (orders.length === 0) {
        return { verified: false };
      }

      const order = orders[0];
      if (!order) {
        return { verified: false };
      }
      
      // Check if email matches
      if (order.billing?.email?.toLowerCase() === email.toLowerCase()) {
        return {
          verified: true,
          orderId: order.id,
          customerId: order.customer_id
        };
      }

      return { verified: false };
    } catch (error) {
      console.error('Error verifying order ownership:', error);
      return { verified: false };
    }
  }

  /**
   * Get customer context for chat
   */
  async getCustomerContext(
    email: string,
    conversationId: string
  ): Promise<string> {
    try {
      // First check cache
      const cached = await CustomerVerification.getCachedData(conversationId);
      if (cached) {
        return this.formatCustomerContext(cached);
      }

      // Search for customer
      const customer = await this.searchCustomerByEmail(email, conversationId);
      if (!customer) {
        return '';
      }

      // Get recent orders
      const orders = await this.getCustomerOrders(customer.id, 3, conversationId, email);
      
      // Get recent purchases
      const purchases = await this.getRecentPurchases(customer.id, 5, conversationId, email);

      const context = {
        customer: DataMasker.maskCustomerData(customer),
        recentOrders: orders,
        recentPurchases: purchases
      };

      return this.formatCustomerContext(context);
    } catch (error) {
      console.error('Error getting customer context:', error);
      return '';
    }
  }

  /**
   * Format customer context for AI
   */
  private formatCustomerContext(data: any): string {
    let context = '\n\nCustomer Information:\n';

    if (data.customer) {
      context += `- Name: ${data.customer.first_name} ${data.customer.last_name || ''}\n`;
      context += `- Email: ${data.customer.email}\n`;
      context += `- Customer since: ${new Date(data.customer.date_created).toLocaleDateString()}\n`;
      context += `- Total orders: ${data.customer.orders_count || 0}\n`;
      context += `- Total spent: ${data.customer.total_spent || '0'}\n`;
    }

    if (data.recentOrders && data.recentOrders.length > 0) {
      context += '\nRecent Orders:\n';
      for (const order of data.recentOrders) {
        context += `- Order #${order.number} (${order.status}) - ${order.total} ${order.currency} - ${new Date(order.date_created).toLocaleDateString()}\n`;
      }
    }

    if (data.recentPurchases && data.recentPurchases.length > 0) {
      context += '\nRecent Purchases:\n';
      for (const purchase of data.recentPurchases.slice(0, 3)) {
        context += `- ${purchase.product_name} (Qty: ${purchase.quantity}) - Order #${purchase.order_number}\n`;
      }
    }

    return context;
  }

  /**
   * Search for order by number and email
   */
  async searchOrderByNumberAndEmail(
    orderNumber: string,
    email: string,
    conversationId?: string
  ): Promise<OrderDetail | null> {
    try {
      const verification = await this.verifyOrderOwnership(orderNumber, email);
      
      if (!verification.verified || !verification.orderId) {
        return null;
      }

      return await this.getOrderDetails(
        verification.orderId,
        conversationId,
        email
      );
    } catch (error) {
      console.error('Error searching order:', error);
      return null;
    }
  }
}