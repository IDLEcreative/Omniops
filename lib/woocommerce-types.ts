// Additional WooCommerce type definitions

export interface ProductAttributeTerm {
  id: number;
  name: string;
  slug: string;
  description?: string;
  menu_order?: number;
  count?: number;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  parent?: number;
  description?: string;
  display?: string;
  image?: {
    id: number;
    date_created: string;
    date_modified: string;
    src: string;
    name: string;
    alt: string;
  };
  menu_order?: number;
  count?: number;
}

export interface ProductReview {
  id: number;
  date_created: string;
  date_created_gmt: string;
  product_id: number;
  status: string;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified: boolean;
  reviewer_avatar_urls?: Record<string, string>;
}

export interface ShippingZoneLocation {
  code: string;
  type: 'postcode' | 'state' | 'country' | 'continent';
}

export interface ShippingZoneMethod {
  instance_id: number;
  title: string;
  order: number;
  enabled: boolean;
  method_id: string;
  method_title: string;
  method_description: string;
  method_supports?: string[];
  settings?: Record<string, {
    id: string;
    label: string;
    description: string;
    type: string;
    value: string;
    default: string;
    tip?: string;
    placeholder?: string;
  }>;
}

export interface SettingsGroup {
  id: string;
  label: string;
  description: string;
  parent_id: string;
  sub_groups: string[];
}

export interface SettingOption {
  id: string;
  label: string;
  description: string;
  type: string;
  default: string;
  options?: Record<string, string>;
  tip?: string;
  value?: unknown;
  group_id?: string;
}

export interface SystemStatusTool {
  id: string;
  name: string;
  action: string;
  description: string;
  success?: boolean;
  message?: string;
}

export interface CustomerDownload {
  download_id: string;
  download_url: string;
  product_id: number;
  product_name: string;
  download_name: string;
  order_id: number;
  order_key: string;
  downloads_remaining: string;
  access_expires: string | null;
  access_expires_gmt: string | null;
  file?: {
    name: string;
    file: string;
  };
}

export interface CountryData {
  code: string;
  name: string;
  states?: Array<{
    code: string;
    name: string;
  }>;
}

export interface CurrencyData {
  code: string;
  name: string;
  symbol: string;
  _links?: {
    self: Array<{ href: string }>;
    collection: Array<{ href: string }>;
  };
}

export interface ContinentData {
  code: string;
  name: string;
  countries?: Array<{
    code: string;
    name: string;
    states?: Array<{
      code: string;
      name: string;
    }>;
  }>;
}

// Orders report data
export interface OrdersReportData {
  date: string;
  orders_count: number;
  num_items_sold: number;
  gross_sales: string;
  total_sales: string;
  net_sales: string;
  average_sales: string;
  total_tax: string;
  total_shipping: string;
  total_refunds: number;
  total_discount: string;
  totals_grouped_by: string;
  totals?: Record<string, {
    sales: string;
    orders: number;
    items: number;
    tax: string;
    shipping: string;
    discount: string;
    customers: number;
  }>;
}

// Products report data  
export interface ProductsReportData {
  title: string;
  product_id: number;
  items_sold: number;
  net_revenue: string;
  orders_count: number;
  variations?: Array<{
    product_id: number;
    items_sold: number;
    net_revenue: string;
    orders_count: number;
  }>;
}

// Type for generic WooCommerce API client
export type WooCommerceClient = {
  get: (path: string, params?: Record<string, unknown>) => Promise<{ data: unknown }>;
  post: (path: string, data?: unknown) => Promise<{ data: unknown }>;
  put: (path: string, data?: unknown) => Promise<{ data: unknown }>;
  delete: (path: string, params?: Record<string, unknown>) => Promise<{ data: unknown }>;
};

// Common parameter types
export interface ListParams {
  context?: 'view' | 'edit';
  page?: number;
  per_page?: number;
  search?: string;
  after?: string;
  before?: string;
  exclude?: number[];
  include?: number[];
  offset?: number;
  order?: 'asc' | 'desc';
  orderby?: string;
}

export interface ProductListParams extends ListParams {
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug' | 'price' | 'popularity' | 'rating';
  parent?: number[];
  parent_exclude?: number[];
  slug?: string;
  status?: 'any' | 'draft' | 'pending' | 'private' | 'publish';
  type?: 'simple' | 'grouped' | 'external' | 'variable';
  sku?: string;
  featured?: boolean;
  category?: string;
  tag?: string;
  shipping_class?: string;
  attribute?: string;
  attribute_term?: string;
  tax_class?: string;
  on_sale?: boolean;
  min_price?: string;
  max_price?: string;
  stock_status?: 'instock' | 'outofstock' | 'onbackorder';
}

export interface OrderListParams extends ListParams {
  orderby?: 'date' | 'id' | 'include' | 'title' | 'slug' | 'modified';
  parent?: number[];
  parent_exclude?: number[];
  status?: 'any' | 'pending' | 'processing' | 'on-hold' | 'completed' | 'cancelled' | 'refunded' | 'failed' | 'trash';
  customer?: number;
  product?: number;
  dp?: number;
}

export interface CustomerListParams extends ListParams {
  orderby?: 'id' | 'include' | 'name' | 'registered_date';
  email?: string;
  role?: 'all' | 'administrator' | 'editor' | 'author' | 'contributor' | 'subscriber' | 'customer' | 'shop_manager';
}

export interface CouponListParams extends ListParams {
  code?: string;
}

export interface ReportParams {
  context?: 'view';
  period?: 'week' | 'month' | 'last_month' | 'year';
  date_min?: string;
  date_max?: string;
}

export interface SettingUpdateData {
  id: string;
  value: unknown;
}