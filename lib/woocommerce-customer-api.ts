/**
 * WooCommerce Customer API Operations
 * API interaction methods for customer and order management
 */

import { WooCommerceAPI } from './woocommerce-api';
import { CustomerVerification, DataMasker } from './customer-verification';
import {
  CustomerSearchResult,
  OrderSummary,
  OrderDetail,
  Purchase,
  OrderVerification
} from './woocommerce-customer-types';
import { CustomerDataFormatter } from './woocommerce-customer-utils';

export class CustomerAPIOperations {
  constructor(private wc: WooCommerceAPI) {}

  /**
   * Search for customer by email
   */
  async searchByEmail(
    email: string,
    conversationId?: string
  ): Promise<CustomerSearchResult | null> {
    try {
      const customer = await this.wc.getCustomerByEmail(email);

      if (!customer) {
        return null;
      }

      const result = CustomerDataFormatter.mapToCustomerSearchResult(customer, email);

      if (conversationId) {
        await CustomerVerification.logAccess(
          conversationId,
          email,
          customer.id,
          ['profile_search'],
          'Customer lookup by email',
          'email_verification'
        );

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
   * Get customer orders by customer ID
   */
  async getOrdersByCustomerId(
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

      const orderSummaries = orders.map(CustomerDataFormatter.mapToOrderSummary);

      if (conversationId && customerEmail) {
        await CustomerVerification.logAccess(
          conversationId,
          customerEmail,
          customerId,
          ['order_history'],
          'Customer orders lookup',
          'email_verification'
        );

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
   * Get orders by billing email (for guest checkouts)
   */
  async getOrdersByEmail(
    email: string,
    limit: number = 10
  ): Promise<OrderSummary[]> {
    try {
      const orders = await this.wc.getOrders({
        per_page: limit,
        orderby: 'date',
        order: 'desc',
        search: email
      });

      const filteredOrders = CustomerDataFormatter.filterOrdersByEmail(orders, email);
      return filteredOrders.map(CustomerDataFormatter.mapToOrderSummary);
    } catch (error) {
      console.error('[CustomerAPIOperations] Error searching orders by email:', error);
      return [];
    }
  }

  /**
   * Get specific order details
   */
  async getOrderDetail(
    orderId: number,
    conversationId?: string,
    customerEmail?: string
  ): Promise<OrderDetail | null> {
    try {
      const order = await this.wc.getOrder(orderId);

      if (!order) {
        return null;
      }

      const orderDetail = CustomerDataFormatter.mapToOrderDetail(order);

      if (conversationId && customerEmail) {
        await CustomerVerification.logAccess(
          conversationId,
          customerEmail,
          order.customer_id,
          ['order_detail', `order_${orderId}`],
          'Order details lookup',
          'email_verification'
        );

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
  ): Promise<Purchase[]> {
    try {
      const orders = await this.wc.getOrders({
        customer: customerId,
        per_page: limit,
        orderby: 'date',
        order: 'desc',
        status: 'completed' as const
      });

      const purchases = CustomerDataFormatter.extractPurchases(orders);
      const limitedPurchases = purchases.slice(0, limit);

      if (conversationId && customerEmail) {
        await CustomerVerification.logAccess(
          conversationId,
          customerEmail,
          customerId,
          ['recent_purchases'],
          'Recent purchases lookup',
          'email_verification'
        );

        await CustomerVerification.cacheCustomerData(
          conversationId,
          customerEmail,
          customerId,
          limitedPurchases,
          'recent_purchases'
        );
      }

      return limitedPurchases;
    } catch (error) {
      console.error('Error getting recent purchases:', error);
      return [];
    }
  }

  /**
   * Verify order ownership by order number and email
   */
  async verifyOrderOwnership(
    orderNumber: string,
    email: string
  ): Promise<OrderVerification> {
    try {
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
}
