/**
 * WooCommerce Customer Types
 * Type definitions and interfaces for customer management
 */

export interface CustomerSearchResult {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username?: string;
  date_created: string;
  orders_count: number;
  total_spent: string;
  avatar_url?: string;
  billing?: any;
  shipping?: any;
}

export interface OrderSummary {
  id: number;
  number: string;
  status: string;
  date_created: string;
  total: string;
  currency: string;
  line_items_count: number;
  customer_note?: string;
}

export interface OrderDetail {
  id: number;
  number: string;
  status: string;
  date_created: string;
  date_modified: string;
  total: string;
  currency: string;
  payment_method_title: string;
  billing: any;
  shipping: any;
  line_items: any[];
  shipping_lines: any[];
  coupon_lines: any[];
  customer_note?: string;
  tracking?: any;
}

export interface Purchase {
  order_id: number;
  order_number: string;
  order_date: string;
  product_id: number;
  product_name: string;
  quantity: number;
  price: string;
  total: string;
  sku: string;
}

export interface OrderVerification {
  verified: boolean;
  orderId?: number;
  customerId?: number;
}

export interface CustomerContext {
  customer?: CustomerSearchResult | GuestCustomer;
  recentOrders?: OrderSummary[];
  recentPurchases?: Purchase[];
}

export interface GuestCustomer {
  email: string;
  first_name: string;
  last_name: string;
  date_created: string;
  orders_count: number;
  total_spent: string;
}
