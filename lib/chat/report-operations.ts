/**
 * WooCommerce Report Operations
 * Handles reporting and analytics operations (sales reports, revenue analysis)
 * Part of Phase 4: Business Intelligence Tools
 */

import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  SalesReportInfo
} from './woocommerce-tool-types';

/**
 * Get sales report
 * Provides revenue analytics and top products for a given period
 * Admin-facing tool for business intelligence
 */
export async function getSalesReport(
  wc: any,
  params: WooCommerceOperationParams
): Promise<WooCommerceOperationResult> {
  try {
    const period = params.period || 'week';

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 7); // Default to week
    }

    // Get orders for the period
    const orders = await wc.getOrders({
      after: startDate.toISOString(),
      before: endDate.toISOString(),
      status: 'completed',
      per_page: 100
    });

    if (!orders || orders.length === 0) {
      return {
        success: true,
        data: {
          totalRevenue: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          topProducts: [],
          period,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        message: `No completed orders in the ${period} period`
      };
    }

    // Calculate revenue metrics
    const totalRevenue = orders.reduce((sum: number, order: any) =>
      sum + parseFloat(order.total), 0
    );
    const totalOrders = orders.length;
    const averageOrderValue = totalRevenue / totalOrders;

    // Aggregate product sales
    const productSales = new Map<number, {
      name: string;
      quantity: number;
      revenue: number;
    }>();

    orders.forEach((order: any) => {
      order.line_items.forEach((item: any) => {
        const productId = item.product_id;
        if (!productSales.has(productId)) {
          productSales.set(productId, {
            name: item.name,
            quantity: 0,
            revenue: 0
          });
        }
        const product = productSales.get(productId)!;
        product.quantity += item.quantity;
        product.revenue += parseFloat(item.total);
      });
    });

    // Get top 10 products by revenue
    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantitySold: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Build message
    let message = `📊 Sales Report (${period})\n\n`;
    message += `📅 Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n\n`;

    message += `💰 Revenue Summary:\n`;
    message += `   Total Revenue: £${totalRevenue.toFixed(2)}\n`;
    message += `   Total Orders: ${totalOrders}\n`;
    message += `   Average Order Value: £${averageOrderValue.toFixed(2)}\n\n`;

    if (topProducts.length > 0) {
      message += `🏆 Top ${topProducts.length} Products by Revenue:\n\n`;
      topProducts.forEach((product, index) => {
        message += `${index + 1}. ${product.productName}\n`;
        message += `   Units Sold: ${product.quantitySold}\n`;
        message += `   Revenue: £${product.revenue.toFixed(2)}\n\n`;
      });
    }

    const reportData: SalesReportInfo = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      topProducts,
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };

    return {
      success: true,
      data: reportData,
      message
    };
  } catch (error) {
    console.error('[WooCommerce Agent] Sales report error:', error);
    return {
      success: false,
      data: null,
      message: "Failed to generate sales report"
    };
  }
}
