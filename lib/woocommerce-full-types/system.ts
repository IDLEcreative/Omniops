import { z } from 'zod';
import { BaseSchema, MetaDataSchema } from './base';

/**
 * WooCommerce System, Tax, Shipping, Payment, Webhook, and Report schemas
 */

// Tax schemas
export const TaxRateSchema = z.object({
  id: z.number(),
  country: z.string(),
  state: z.string(),
  postcode: z.string(),
  city: z.string(),
  rate: z.string(),
  name: z.string(),
  priority: z.number(),
  compound: z.boolean(),
  shipping: z.boolean(),
  order: z.number(),
  class: z.string(),
});

export const TaxClassSchema = z.object({
  slug: z.string(),
  name: z.string(),
});

// Shipping schemas
export const ShippingZoneSchema = z.object({
  id: z.number(),
  name: z.string(),
  order: z.number(),
});

export const ShippingMethodSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
});

// Payment Gateway schema
export const PaymentGatewaySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number(),
  enabled: z.boolean(),
  method_title: z.string(),
  method_description: z.string(),
  method_supports: z.array(z.string()),
  settings: z.record(z.any()),
});

// Webhook schema
export const WebhookSchema = BaseSchema.extend({
  name: z.string(),
  status: z.enum(['active', 'paused', 'disabled']),
  topic: z.string(),
  resource: z.string(),
  event: z.string(),
  hooks: z.array(z.string()),
  delivery_url: z.string(),
  secret: z.string(),
  date_created_gmt: z.string(),
  date_modified_gmt: z.string(),
});

// System Status schema
export const SystemStatusSchema = z.object({
  environment: z.object({
    home_url: z.string(),
    site_url: z.string(),
    version: z.string(),
    log_directory: z.string(),
    log_directory_writable: z.boolean(),
    wp_version: z.string(),
    wp_multisite: z.boolean(),
    wp_memory_limit: z.number(),
    wp_debug_mode: z.boolean(),
    wp_cron: z.boolean(),
    language: z.string(),
    server_info: z.string(),
    php_version: z.string(),
    php_post_max_size: z.number(),
    php_max_execution_time: z.number(),
    php_max_input_vars: z.number(),
    curl_version: z.string(),
    suhosin_installed: z.boolean(),
    max_upload_size: z.number(),
    mysql_version: z.string(),
    default_timezone: z.string(),
    fsockopen_or_curl_enabled: z.boolean(),
    soapclient_enabled: z.boolean(),
    domdocument_enabled: z.boolean(),
    gzip_enabled: z.boolean(),
    mbstring_enabled: z.boolean(),
  }),
  database: z.object({
    wc_database_version: z.string(),
    database_prefix: z.string(),
    database_tables: z.record(z.union([z.boolean(), z.object({}).passthrough()])),
  }),
  active_plugins: z.array(z.object({
    plugin: z.string(),
    name: z.string(),
    version: z.string(),
    version_latest: z.string(),
    url: z.string(),
    author_name: z.string(),
    author_url: z.string(),
    network_activated: z.boolean(),
  })),
  theme: z.object({
    name: z.string(),
    version: z.string(),
    version_latest: z.union([z.string(), z.number()]),
    author_url: z.string(),
    is_child_theme: z.boolean(),
    has_woocommerce_support: z.boolean(),
    has_woocommerce_file: z.boolean(),
    has_outdated_templates: z.boolean(),
    overrides: z.array(z.any()),
    parent_name: z.string(),
    parent_version: z.string(),
    parent_version_latest: z.union([z.string(), z.number()]),
    parent_author_url: z.string(),
  }),
  settings: z.object({
    api_enabled: z.boolean(),
    force_ssl: z.boolean(),
    currency: z.string(),
    currency_symbol: z.string(),
    currency_position: z.string(),
    thousand_separator: z.string(),
    decimal_separator: z.string(),
    number_of_decimals: z.number(),
    geolocation_enabled: z.boolean(),
    taxonomies: z.record(z.string()),
  }),
  security: z.object({
    secure_connection: z.boolean(),
    hide_errors: z.boolean(),
  }),
  pages: z.array(z.object({
    page_name: z.string(),
    page_id: z.string(),
    page_set: z.boolean(),
    page_exists: z.boolean(),
    page_visible: z.boolean(),
    shortcode: z.string(),
    shortcode_required: z.boolean(),
    shortcode_present: z.boolean(),
  })),
});

// Report schemas
export const SalesReportSchema = z.object({
  total_sales: z.string(),
  net_sales: z.string(),
  total_orders: z.number(),
  total_items: z.number(),
  total_tax: z.string(),
  total_shipping: z.string(),
  total_refunds: z.number(),
  total_discount: z.string(),
  totals_grouped_by: z.string(),
  totals: z.record(z.any()),
});

export const TopSellersReportSchema = z.object({
  title: z.string(),
  product_id: z.number(),
  quantity: z.number(),
});

export const CouponsReportSchema = z.object({
  coupon_id: z.number(),
  amount: z.number(),
  order_count: z.number(),
});

export const CustomersReportSchema = z.object({
  customer_id: z.number(),
  user_id: z.number(),
  name: z.string(),
  username: z.string(),
  email: z.string(),
  orders_count: z.number(),
  total_spent: z.string(),
  avatar_url: z.string(),
});

export const StockReportSchema = z.object({
  id: z.number(),
  parent_id: z.number(),
  name: z.string(),
  sku: z.string(),
  stock_quantity: z.number(),
  stock_status: z.string(),
});

export const ReviewsReportSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  product_name: z.string(),
  product_permalink: z.string(),
  reviewer: z.string(),
  reviewer_email: z.string(),
  review: z.string(),
  rating: z.number(),
  verified: z.boolean(),
  date_created: z.string(),
});

// Type exports
export type TaxRate = z.infer<typeof TaxRateSchema>;
export type TaxClass = z.infer<typeof TaxClassSchema>;
export type ShippingZone = z.infer<typeof ShippingZoneSchema>;
export type ShippingMethod = z.infer<typeof ShippingMethodSchema>;
export type PaymentGateway = z.infer<typeof PaymentGatewaySchema>;
export type Webhook = z.infer<typeof WebhookSchema>;
export type SystemStatus = z.infer<typeof SystemStatusSchema>;
export type SalesReport = z.infer<typeof SalesReportSchema>;
export type TopSellersReport = z.infer<typeof TopSellersReportSchema>;
export type CouponsReport = z.infer<typeof CouponsReportSchema>;
export type CustomersReport = z.infer<typeof CustomersReportSchema>;
export type StockReport = z.infer<typeof StockReportSchema>;
export type ReviewsReport = z.infer<typeof ReviewsReportSchema>;
