/**
 * WooCommerce customer search test handler
 */

import { WooCommerceCustomer } from '@/lib/woocommerce-customer';
import { DataMasker } from '@/lib/customer-verification';
import type { TestResult } from '../types';

export async function runCustomerTest(email?: string, domain?: string): Promise<{
  search: TestResult;
  orders: TestResult;
}> {
  if (!email) {
    return {
      search: {
        success: false,
        error: 'Email parameter required',
      },
      orders: {
        success: false,
        error: 'Email parameter required',
      },
    };
  }

  try {
    const wcCustomer = domain
      ? await WooCommerceCustomer.forDomain(domain)
      : WooCommerceCustomer.fromEnvironment();

    if (!wcCustomer) {
      return {
        search: {
          success: false,
          error: 'WooCommerce not configured',
        },
        orders: {
          success: false,
          error: 'WooCommerce not configured',
        },
      };
    }

    const customer = await wcCustomer.searchCustomerByEmail(email);

    if (!customer) {
      return {
        search: {
          success: true,
          found: false,
          message: 'Customer not found',
        },
        orders: {
          success: false,
          error: 'Customer not found',
        },
      };
    }

    // Test order retrieval
    const orders = await wcCustomer.getCustomerOrders(customer.id, 3);

    return {
      search: {
        success: true,
        found: true,
        customer: {
          id: customer.id,
          email: DataMasker.maskEmail(customer.email),
          name: `${customer.first_name} ${customer.last_name}`,
          ordersCount: customer.orders_count,
          totalSpent: customer.total_spent,
        },
      },
      orders: {
        success: true,
        count: orders.length,
        orders: orders.map((o) => ({
          number: o.number,
          status: o.status,
          total: o.total,
          date: o.date_created,
        })),
      },
    };
  } catch (error: any) {
    return {
      search: {
        success: false,
        error: error.message,
      },
      orders: {
        success: false,
        error: error.message,
      },
    };
  }
}
