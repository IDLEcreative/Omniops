/**
 * WooCommerce Product Search and Category Operations
 * Handles product searching, filtering, and category browsing
 *
 * This file is a proxy to the refactored module structure.
 * All logic is now split into focused modules under product-search-operations/
 */

export {
  getProductCategories,
  searchProducts
} from './product-search-operations/index';

export type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  CategoryInfo,
  SearchProductsInfo
} from './product-search-operations/index';
