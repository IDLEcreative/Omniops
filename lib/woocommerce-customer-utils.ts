/**
 * WooCommerce Customer Utilities
 * Utility functions for customer data formatting and transformation
 */

import {
  CustomerSearchResult,
  OrderSummary,
  Purchase,
  CustomerContext,
  GuestCustomer
} from './woocommerce-customer-types';
import { DataMasker } from './customer-verification';

export class CustomerDataFormatter {
  /**
   * Format customer context for AI consumption
   */
  static formatCustomerContext(data: CustomerContext): string {
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
   * Map raw customer data to CustomerSearchResult
   */
  static mapToCustomerSearchResult(
    customer: any,
    email: string
  ): CustomerSearchResult {
    return {
      id: customer.id,
      email: customer.email || email,
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      username: customer.username,
      date_created: customer.date_created,
      orders_count: 0,
      total_spent: '0.00',
      avatar_url: customer.avatar_url,
      billing: customer.billing,
      shipping: customer.shipping
    };
  }

  /**
   * Map raw order data to OrderSummary
   */
  static mapToOrderSummary(order: any): OrderSummary {
    return {
      id: order.id,
      number: order.number,
      status: order.status,
      date_created: order.date_created,
      total: order.total,
      currency: order.currency,
      line_items_count: order.line_items?.length || 0,
      customer_note: order.customer_note
    };
  }

  /**
   * Map raw order data to OrderDetail with data masking
   */
  static mapToOrderDetail(order: any): any {
    return {
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
  }

  /**
   * Create guest customer object from order data
   */
  static createGuestCustomer(
    email: string,
    orders: OrderSummary[]
  ): GuestCustomer {
    return {
      email,
      first_name: 'Guest',
      last_name: 'Customer',
      date_created: '',
      orders_count: orders.length,
      total_spent: orders
        .reduce((sum, order) => sum + parseFloat(order.total), 0)
        .toFixed(2)
    };
  }

  /**
   * Extract purchases from orders
   */
  static extractPurchases(orders: any[]): Purchase[] {
    const purchases: Purchase[] = [];

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

    return purchases;
  }

  /**
   * Filter orders by billing email
   */
  static filterOrdersByEmail(orders: any[], email: string): any[] {
    return orders.filter(order =>
      order.billing?.email?.toLowerCase() === email.toLowerCase()
    );
  }
}
