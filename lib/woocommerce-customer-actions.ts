/**
 * WooCommerce customer actions main module
 *
 * Coordinates customer information and address management operations.
 * Exports all action classes for unified access.
 */

import { WooCommerceCustomer } from './woocommerce-customer';
import { getDynamicWooCommerceClient } from './woocommerce-dynamic';
import type { WooCommerceAPI } from './woocommerce-api';
import {
  CustomerActionResult,
  ShippingAddressUpdate
} from './woocommerce-customer-actions-types';

// Re-export types
export type { CustomerActionResult, ShippingAddressUpdate } from './woocommerce-customer-actions-types';

// Re-export action classes
export { WooCommerceOrderActions } from './woocommerce-customer-actions-orders';
export { WooCommerceCartActions } from './woocommerce-customer-actions-cart';

/**
 * Main customer actions class for account and profile management
 *
 * Refactored to use dependency injection for better testability
 *
 * @param client - Injected WooCommerce API client (explicit dependency)
 * @param domain - Customer domain (for WooCommerceCustomer operations)
 *
 * @example
 * // Production usage
 * const actions = await createWooCommerceCustomerActions('example.com');
 *
 * @example
 * // Testing usage
 * const mockClient = createMockWooCommerceClient();
 * const actions = new WooCommerceCustomerActions(mockClient, 'example.com');
 */
export class WooCommerceCustomerActions {
  private wcCustomer: WooCommerceCustomer;

  constructor(
    private client: WooCommerceAPI,
    private domain: string
  ) {
    this.wcCustomer = new WooCommerceCustomer(client, domain);
  }

  /**
   * Get full customer information including addresses
   */
  async getCustomerInfo(email: string): Promise<CustomerActionResult> {
    try {
      const customer = await this.wcCustomer.searchCustomerByEmail(email);
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
   * Update customer shipping address
   */
  async updateShippingAddress(
    email: string,
    newAddress: ShippingAddressUpdate
  ): Promise<CustomerActionResult> {
    try {
      // First, find the customer
      const customer = await this.client.getCustomerByEmail(email);
      if (!customer) {
        return {
          success: false,
          message: 'Customer not found'
        };
      }

      // Update shipping address
      const updatedCustomer = await this.client.updateCustomer(customer.id, {
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
   * Update customer billing address
   */
  async updateBillingAddress(
    email: string,
    newAddress: ShippingAddressUpdate
  ): Promise<CustomerActionResult> {
    try {
      // First, find the customer
      const customer = await this.client.getCustomerByEmail(email);
      if (!customer) {
        return {
          success: false,
          message: 'Customer not found'
        };
      }

      // Update billing address
      const updatedCustomer = await this.client.updateCustomer(customer.id, {
        billing: {
          ...customer.billing,
          ...newAddress
        }
      });

      return {
        success: true,
        message: 'Billing address updated successfully',
        data: {
          new_address: updatedCustomer.billing
        }
      };
    } catch (error: any) {
      console.error('Error updating billing address:', error);
      return {
        success: false,
        message: 'Failed to update billing address'
      };
    }
  }

  /**
   * Update customer profile information
   */
  async updateProfile(
    email: string,
    updates: {
      first_name?: string;
      last_name?: string;
      phone?: string;
    }
  ): Promise<CustomerActionResult> {
    try {
      // First, find the customer
      const customer = await this.client.getCustomerByEmail(email);
      if (!customer) {
        return {
          success: false,
          message: 'Customer not found'
        };
      }

      // Update customer profile
      const updatedCustomer = await this.client.updateCustomer(customer.id, updates);

      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          first_name: updatedCustomer.first_name,
          last_name: updatedCustomer.last_name,
          email: updatedCustomer.email
        }
      };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return {
        success: false,
        message: 'Failed to update profile'
      };
    }
  }
}

/**
 * Factory function to create WooCommerceCustomerActions with production dependencies
 */
export async function createWooCommerceCustomerActions(
  domain: string
): Promise<WooCommerceCustomerActions | null> {
  const client = await getDynamicWooCommerceClient(domain);
  if (!client) {
    return null;
  }
  return new WooCommerceCustomerActions(client, domain);
}
