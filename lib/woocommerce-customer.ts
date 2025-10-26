/**
 * WooCommerce Customer Management
 * Main class for customer and order operations
 */

import { WooCommerceAPI } from './woocommerce-api';
import { getDynamicWooCommerceClient } from './woocommerce-dynamic';
import { CustomerVerification, DataMasker } from './customer-verification';
import { CustomerAPIOperations } from './woocommerce-customer-api';
import { CustomerDataFormatter } from './woocommerce-customer-utils';
import {
  CustomerSearchResult,
  OrderSummary,
  OrderDetail,
  Purchase,
  OrderVerification,
  CustomerContext
} from './woocommerce-customer-types';

// Re-export types for backward compatibility
export type {
  CustomerSearchResult,
  OrderSummary,
  OrderDetail,
  Purchase,
  OrderVerification,
  CustomerContext
};

export class WooCommerceCustomer {
  private wc: WooCommerceAPI;
  private domain?: string;
  private api: CustomerAPIOperations;

  constructor(wooCommerceClient: WooCommerceAPI, domain?: string) {
    this.wc = wooCommerceClient;
    this.domain = domain;
    this.api = new CustomerAPIOperations(wooCommerceClient);
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
    return this.api.searchByEmail(email, conversationId);
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
    return this.api.getOrdersByCustomerId(
      customerId,
      limit,
      conversationId,
      customerEmail
    );
  }

  /**
   * Get customer orders by email (finds customer first, then gets orders)
   */
  async getCustomerOrdersByEmail(
    email: string,
    limit: number = 10,
    conversationId?: string
  ): Promise<OrderSummary[]> {
    try {
      const customer = await this.searchCustomerByEmail(email, conversationId);

      if (!customer) {
        return this.api.getOrdersByEmail(email, limit);
      }

      return await this.getCustomerOrders(
        customer.id,
        limit,
        conversationId,
        email
      );
    } catch (error) {
      console.error('Error getting customer orders by email:', error);
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
    return this.api.getOrderDetail(orderId, conversationId, customerEmail);
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
    return this.api.getRecentPurchases(
      customerId,
      limit,
      conversationId,
      customerEmail
    );
  }

  /**
   * Verify order ownership
   */
  async verifyOrderOwnership(
    orderNumber: string,
    email: string
  ): Promise<OrderVerification> {
    return this.api.verifyOrderOwnership(orderNumber, email);
  }

  /**
   * Get customer context for chat
   */
  async getCustomerContext(
    email: string,
    conversationId: string
  ): Promise<string> {
    try {
      // Check cache first
      const cached = await CustomerVerification.getCachedData(conversationId);
      if (cached) {
        return CustomerDataFormatter.formatCustomerContext(cached);
      }

      // Search for customer
      const customer = await this.searchCustomerByEmail(email, conversationId);

      // Get orders (works for both registered customers and guests)
      const orders = customer
        ? await this.getCustomerOrders(customer.id, 3, conversationId, email)
        : await this.getCustomerOrdersByEmail(email, 3, conversationId);

      // Get recent purchases only if we have a customer ID
      const purchases = customer
        ? await this.getRecentPurchases(customer.id, 5, conversationId, email)
        : [];

      // If we found orders but no customer, create a minimal guest customer object
      if (!customer && orders.length > 0) {
        const guestCustomer = CustomerDataFormatter.createGuestCustomer(email, orders);
        const context: CustomerContext = {
          customer: guestCustomer,
          recentOrders: orders,
          recentPurchases: purchases
        };
        return CustomerDataFormatter.formatCustomerContext(context);
      }

      if (!customer) {
        return '';
      }

      const context: CustomerContext = {
        customer: DataMasker.maskCustomerData(customer),
        recentOrders: orders,
        recentPurchases: purchases
      };

      return CustomerDataFormatter.formatCustomerContext(context);
    } catch (error) {
      console.error('Error getting customer context:', error);
      return '';
    }
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
