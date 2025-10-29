/**
 * WooCommerce Analytics Types
 * Type definitions for analytics and reporting operations
 */

// Customer insights info type
export interface CustomerInsightsInfo {
  topCustomers: Array<{
    customerId: number;
    email: string;
    name: string;
    totalSpent: number;
    orderCount: number;
    averageOrderValue: number;
  }>;
  totalCustomers: number;
  totalRevenue: number;
  averageLTV: number;
}

// Sales report info type
export interface SalesReportInfo {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: Array<{
    productId: number;
    productName: string;
    quantitySold: number;
    revenue: number;
  }>;
  period: string;
  startDate: string;
  endDate: string;
}
