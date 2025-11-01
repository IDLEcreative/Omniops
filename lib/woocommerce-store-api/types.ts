/**
 * WooCommerce Store API Types
 */

export interface StoreAPICartResponse {
  items: StoreAPICartItem[];
  items_count: number;
  items_weight: number;
  cross_sells: Array<{ id: number; name: string; prices: any }>;
  needs_payment: boolean;
  needs_shipping: boolean;
  has_calculated_shipping: boolean;
  fees: any[];
  totals: StoreAPICartTotals;
  shipping_address: any;
  billing_address: any;
  coupons: StoreAPICoupon[];
  errors: any[];
  payment_methods: string[];
  payment_requirements: string[];
  extensions: Record<string, any>;
}

export interface StoreAPICartItem {
  key: string;
  id: number;
  quantity: number;
  quantity_limits: {
    minimum: number;
    maximum: number;
    multiple_of: number;
    editable: boolean;
  };
  name: string;
  short_description: string;
  description: string;
  sku: string;
  low_stock_remaining: number | null;
  backorders_allowed: boolean;
  show_backorder_badge: boolean;
  sold_individually: boolean;
  permalink: string;
  images: Array<{
    id: number;
    src: string;
    thumbnail: string;
    srcset: string;
    sizes: string;
    name: string;
    alt: string;
  }>;
  variation: Array<{
    attribute: string;
    value: string;
  }>;
  item_data: any[];
  prices: {
    price: string;
    regular_price: string;
    sale_price: string;
    price_range: any;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
    raw_prices: {
      precision: number;
      price: string;
      regular_price: string;
      sale_price: string;
    };
  };
  totals: {
    line_subtotal: string;
    line_subtotal_tax: string;
    line_total: string;
    line_total_tax: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
  };
  catalog_visibility: string;
  extensions: Record<string, any>;
}

export interface StoreAPICartTotals {
  total_items: string;
  total_items_tax: string;
  total_fees: string;
  total_fees_tax: string;
  total_discount: string;
  total_discount_tax: string;
  total_shipping: string;
  total_shipping_tax: string;
  total_price: string;
  total_tax: string;
  tax_lines: Array<{
    name: string;
    price: string;
    rate: string;
  }>;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

export interface StoreAPICoupon {
  code: string;
  discount_type: string;
  totals: {
    total_discount: string;
    total_discount_tax: string;
    currency_code: string;
    currency_symbol: string;
    currency_minor_unit: number;
    currency_decimal_separator: string;
    currency_thousand_separator: string;
    currency_prefix: string;
    currency_suffix: string;
  };
}

export interface StoreAPIError {
  code: string;
  message: string;
  data?: {
    status: number;
    params?: Record<string, any>;
  };
}

export interface StoreAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: StoreAPIError;
}
