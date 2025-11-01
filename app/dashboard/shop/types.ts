/**
 * Shop Page Type Definitions
 */

export interface WooCommerceDashboardData {
  kpis: {
    revenue: {
      today: string;
      yesterday: string;
      change: string;
      currency: string;
      currencySymbol: string;
    };
    abandonedCarts: {
      value: string;
      count: number;
    };
    orders: {
      processing: number;
      completedToday: number;
      total: number;
    };
    conversion: {
      rate: string;
      label: string;
    };
  };
  revenueHistory: Array<{ date: string; revenue: number }>;
  abandonedCarts: Array<{
    orderId: number;
    customerName: string;
    customerEmail: string;
    value: string;
    timeAgo: string;
    items: number;
  }>;
  lowStock: Array<{
    id: number;
    name: string;
    stock: number;
    price: string;
  }>;
}

export interface ConnectedPlatforms {
  woocommerce: boolean;
  shopify: boolean;
}
