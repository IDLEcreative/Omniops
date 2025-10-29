/**
 * WooCommerce Analytics Operations
 * Handles customer analytics and insights (top customers, LTV, purchase patterns)
 * Part of Phase 4: Business Intelligence Tools
 */

import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  CustomerInsightsInfo
} from './woocommerce-tool-types';

/**
 * Get customer insights
 * Analyzes customer behavior, identifies top customers, and calculates lifetime value
 * Admin-facing tool for customer relationship management
 */
export async function getCustomerInsights(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    const currencySymbol = getCurrencySymbol(params);
    const limit = params.limit || 10;

    // Get all customers
    const customers = await wc.getCustomers({
      per_page: 100,
      orderby: 'registered_date',
      order: 'desc'
    });

    if (!customers || customers.length === 0) {
      return {
        success: true,
        data: {
          topCustomers: [],
          totalCustomers: 0,
          totalRevenue: 0,
          averageLTV: 0
        },
        message: "No customers found"
      };
    }

    // Get orders for all customers (completed only)
    const orders = await wc.getOrders({
      per_page: 100,
      status: 'completed'
    });

    // Aggregate customer data
    const customerData = new Map<number, {
      email: string;
      name: string;
      totalSpent: number;
      orderCount: number;
    }>();

    // Initialize with all customers
    customers.forEach((customer: any) => {
      customerData.set(customer.id, {
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`.trim() || customer.username,
        totalSpent: 0,
        orderCount: 0
      });
    });

    // Aggregate order data
    if (orders && orders.length > 0) {
      orders.forEach((order: any) => {
        const customerId = order.customer_id;
        if (customerId && customerData.has(customerId)) {
          const data = customerData.get(customerId)!;
          data.totalSpent += parseFloat(order.total);
          data.orderCount += 1;
        }
      });
    }

    // Calculate top customers
    const topCustomers = Array.from(customerData.entries())
      .filter(([_, data]) => data.orderCount > 0)  // Only customers with orders
      .map(([customerId, data]) => ({
        customerId,
        email: data.email,
        name: data.name,
        totalSpent: data.totalSpent,
        orderCount: data.orderCount,
        averageOrderValue: data.totalSpent / data.orderCount
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);

    // Calculate metrics
    const totalRevenue = topCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageLTV = topCustomers.length > 0
      ? totalRevenue / topCustomers.length
      : 0;

    // Build message
    let message = `📊 Customer Insights (Top ${limit} Customers)\n\n`;

    message += `👥 Overview:\n`;
    message += `   Total Customers: ${customers.length}\n`;
    message += `   Active Customers: ${topCustomers.length}\n`;
    message += `   Average Lifetime Value: ${currencySymbol}${averageLTV.toFixed(2)}\n\n`;

    if (topCustomers.length > 0) {
      message += `🏆 Top ${topCustomers.length} Customers by Spend:\n\n`;
      topCustomers.forEach((customer, index) => {
        message += `${index + 1}. ${customer.name}\n`;
        message += `   Email: ${customer.email}\n`;
        message += `   Total Spent: ${currencySymbol}${customer.totalSpent.toFixed(2)}\n`;
        message += `   Orders: ${customer.orderCount}\n`;
        message += `   Avg Order Value: ${currencySymbol}${customer.averageOrderValue.toFixed(2)}\n\n`;
      });
    } else {
      message += `No customers with completed orders found.\n`;
    }

    const insightsData: CustomerInsightsInfo = {
      topCustomers,
      totalCustomers: customers.length,
      totalRevenue,
      averageLTV
    };

    return {
      success: true,
      data: insightsData,
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Customer insights error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to retrieve customer insights"
    };
  }
}
