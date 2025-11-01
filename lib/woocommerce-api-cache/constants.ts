/**
 * Cache TTL Configuration
 */

export const CACHE_TTL = {
  search_products: 300,      // 5 minutes - products don't change often
  get_product_details: 600,  // 10 minutes - detailed info is stable
  check_stock: 60,          // 1 minute - stock levels more dynamic
  get_categories: 1800,      // 30 minutes - categories rarely change
  get_shipping_options: 3600, // 1 hour - shipping rates are stable
  default: 300              // 5 minutes default
} as const;

export const COMMON_WC_QUERIES = [
  { operation: 'search_products', params: { query: 'pump', limit: 20 } },
  { operation: 'search_products', params: { query: 'brake', limit: 20 } },
  { operation: 'search_products', params: { query: 'hydraulic', limit: 20 } },
  { operation: 'search_products', params: { query: 'filter', limit: 20 } },
  { operation: 'get_categories', params: {} },
  { operation: 'get_shipping_options', params: {} }
];
