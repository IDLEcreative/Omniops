import { z } from 'zod';

// Base schemas for common types
const BaseSchema = z.object({
  id: z.number(),
  date_created: z.string(),
  date_modified: z.string(),
});

const MetaDataSchema = z.object({
  id: z.number(),
  key: z.string(),
  value: z.any(),
});

// Enhanced Product schemas
export const ProductVariationSchema = z.object({
  id: z.number(),
  sku: z.string().optional(),
  price: z.string(),
  regular_price: z.string(),
  sale_price: z.string().optional(),
  stock_quantity: z.number().nullable(),
  stock_status: z.string(),
  attributes: z.array(z.object({
    id: z.number(),
    name: z.string(),
    option: z.string(),
  })),
  image: z.object({
    id: z.number(),
    src: z.string(),
    alt: z.string(),
  }).optional(),
});

export const ProductAttributeSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  type: z.string(),
  has_archives: z.boolean(),
  options: z.array(z.string()).optional(),
});

export const ProductTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  count: z.number(),
});

export const ProductShippingClassSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  count: z.number(),
});

// Enhanced Product schema with all fields
export const ProductSchema = BaseSchema.extend({
  name: z.string(),
  slug: z.string(),
  permalink: z.string(),
  type: z.enum([
    'simple', 'grouped', 'external', 'variable',
    'variation', 'bundle', 'subscription', 'booking', 'composite'
  ]).or(z.string()), // Fallback for unknown product types
  status: z.enum(['draft', 'pending', 'private', 'publish']),
  featured: z.boolean(),
  catalog_visibility: z.enum(['visible', 'catalog', 'search', 'hidden']),
  description: z.string(),
  short_description: z.string(),
  sku: z.string().optional(),
  price: z.string(),
  regular_price: z.string(),
  sale_price: z.string().optional(),
  on_sale: z.boolean().optional(),
  date_on_sale_from: z.string().nullable(),
  date_on_sale_to: z.string().nullable(),
  virtual: z.boolean(),
  downloadable: z.boolean(),
  downloads: z.array(z.object({
    id: z.string(),
    name: z.string(),
    file: z.string(),
  })),
  download_limit: z.number(),
  download_expiry: z.number(),
  stock_quantity: z.number().nullable(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']),
  manage_stock: z.boolean(),
  backorders: z.enum(['no', 'notify', 'yes']),
  sold_individually: z.boolean(),
  weight: z.string(),
  dimensions: z.object({
    length: z.string(),
    width: z.string(),
    height: z.string(),
  }),
  shipping_class: z.string(),
  shipping_class_id: z.number(),
  reviews_allowed: z.boolean(),
  average_rating: z.string(),
  rating_count: z.number(),
  categories: z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  })),
  tags: z.array(z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  })),
  images: z.array(z.object({
    id: z.number(),
    src: z.string(),
    alt: z.string(),
  })),
  attributes: z.array(z.object({
    id: z.number(),
    name: z.string(),
    position: z.number().optional(),
    visible: z.boolean().optional(),
    variation: z.boolean().optional(),
    options: z.array(z.string()).optional(),
  })),
  default_attributes: z.array(z.object({
    id: z.number(),
    name: z.string(),
    option: z.string(),
  })),
  variations: z.array(z.number()),
  grouped_products: z.array(z.number()),
  related_ids: z.array(z.number()),
  upsell_ids: z.array(z.number()),
  cross_sell_ids: z.array(z.number()),
  parent_id: z.number(),
  meta_data: z.array(MetaDataSchema),
});

// Order schemas
export const OrderNoteSchema = z.object({
  id: z.number(),
  author: z.string(),
  date_created: z.string(),
  note: z.string(),
  customer_note: z.boolean(),
});

export const RefundSchema = BaseSchema.extend({
  amount: z.string(),
  reason: z.string(),
  refunded_by: z.number(),
  line_items: z.array(z.object({
    id: z.number(),
    name: z.string(),
    product_id: z.number(),
    variation_id: z.number(),
    quantity: z.number(),
    tax_class: z.string(),
    subtotal: z.string(),
    total: z.string(),
    taxes: z.array(z.any()),
    meta_data: z.array(MetaDataSchema),
    refund_total: z.number(),
  })),
});

export const OrderSchema = BaseSchema.extend({
  parent_id: z.number(),
  number: z.string(),
  order_key: z.string(),
  created_via: z.string(),
  version: z.string(),
  status: z.enum(['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed', 'trash']),
  currency: z.string(),
  date_paid: z.string().nullable(),
  date_completed: z.string().nullable(),
  cart_hash: z.string(),
  customer_id: z.number(),
  customer_ip_address: z.string(),
  customer_user_agent: z.string(),
  customer_note: z.string(),
  billing: z.object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string(),
    address_1: z.string(),
    address_2: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
  shipping: z.object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string(),
    address_1: z.string(),
    address_2: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string(),
  }),
  payment_method: z.string(),
  payment_method_title: z.string(),
  transaction_id: z.string(),
  line_items: z.array(z.object({
    id: z.number(),
    name: z.string(),
    product_id: z.number(),
    variation_id: z.number(),
    quantity: z.number(),
    tax_class: z.string(),
    subtotal: z.string(),
    subtotal_tax: z.string(),
    total: z.string(),
    total_tax: z.string(),
    taxes: z.array(z.any()),
    meta_data: z.array(MetaDataSchema),
    sku: z.string().optional(),
    price: z.number(),
  })),
  tax_lines: z.array(z.object({
    id: z.number(),
    rate_code: z.string(),
    rate_id: z.number(),
    label: z.string(),
    compound: z.boolean(),
    tax_total: z.string(),
    shipping_tax_total: z.string(),
    meta_data: z.array(MetaDataSchema),
  })),
  shipping_lines: z.array(z.object({
    id: z.number(),
    method_title: z.string(),
    method_id: z.string(),
    total: z.string(),
    total_tax: z.string(),
    taxes: z.array(z.any()),
    meta_data: z.array(MetaDataSchema),
  })),
  fee_lines: z.array(z.any()),
  coupon_lines: z.array(z.object({
    id: z.number(),
    code: z.string(),
    discount: z.string(),
    discount_tax: z.string(),
    meta_data: z.array(MetaDataSchema),
  })),
  refunds: z.array(z.object({
    id: z.number(),
    reason: z.string(),
    total: z.string(),
  })),
  total: z.string(),
  total_tax: z.string(),
  discount_total: z.string(),
  discount_tax: z.string(),
  shipping_total: z.string(),
  shipping_tax: z.string(),
  prices_include_tax: z.boolean(),
  meta_data: z.array(MetaDataSchema),
});

// Customer schema
export const CustomerSchema = BaseSchema.extend({
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  username: z.string(),
  role: z.string(),
  billing: z.object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string(),
    address_1: z.string(),
    address_2: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
  shipping: z.object({
    first_name: z.string(),
    last_name: z.string(),
    company: z.string(),
    address_1: z.string(),
    address_2: z.string(),
    city: z.string(),
    state: z.string(),
    postcode: z.string(),
    country: z.string(),
  }),
  is_paying_customer: z.boolean(),
  avatar_url: z.string(),
  meta_data: z.array(MetaDataSchema),
});

// Coupon schema
export const CouponSchema = BaseSchema.extend({
  code: z.string(),
  amount: z.string(),
  discount_type: z.enum(['percent', 'fixed_cart', 'fixed_product']),
  description: z.string(),
  date_expires: z.string().nullable(),
  usage_count: z.number(),
  individual_use: z.boolean(),
  product_ids: z.array(z.number()),
  excluded_product_ids: z.array(z.number()),
  usage_limit: z.number().nullable(),
  usage_limit_per_user: z.number().nullable(),
  limit_usage_to_x_items: z.number().nullable(),
  free_shipping: z.boolean(),
  product_categories: z.array(z.number()),
  excluded_product_categories: z.array(z.number()),
  exclude_sale_items: z.boolean(),
  minimum_amount: z.string(),
  maximum_amount: z.string(),
  email_restrictions: z.array(z.string()),
  used_by: z.array(z.string()),
  meta_data: z.array(MetaDataSchema),
});

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
export type Product = z.infer<typeof ProductSchema>;
export type ProductVariation = z.infer<typeof ProductVariationSchema>;
export type ProductAttribute = z.infer<typeof ProductAttributeSchema>;
export type ProductTag = z.infer<typeof ProductTagSchema>;
export type ProductShippingClass = z.infer<typeof ProductShippingClassSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type OrderNote = z.infer<typeof OrderNoteSchema>;
export type Refund = z.infer<typeof RefundSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type Coupon = z.infer<typeof CouponSchema>;
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

// Batch operation types
export interface BatchOperation<T> {
  create?: Partial<T>[];
  update?: Array<{ id: number } & Partial<T>>;
  delete?: number[];
}

export interface BatchResponse<T> {
  create: T[];
  update: T[];
  delete: Array<{ id: number }>;
}
