/**
 * WooCommerce customer actions main module
 *
 * Coordinates customer information and address management operations.
 * Exports all action classes for unified access.
 */

import { WooCommerceCustomer } from './woocommerce-customer';
import { getDynamicWooCommerceClient } from './woocommerce-dynamic';
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
   * Update customer shipping address
   */
  static async updateShippingAddress(
    email: string,
    domain: string,
    newAddress: ShippingAddressUpdate
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
   * Update customer billing address
   */
  static async updateBillingAddress(
    email: string,
    domain: string,
    newAddress: ShippingAddressUpdate
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

      // Update billing address
      const updatedCustomer = await wc.updateCustomer(customer.id, {
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
  static async updateProfile(
    email: string,
    domain: string,
    updates: {
      first_name?: string;
      last_name?: string;
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

      // Update customer profile
      const updatedCustomer = await wc.updateCustomer(customer.id, updates);

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
