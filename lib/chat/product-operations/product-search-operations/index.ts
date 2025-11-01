/**
 * WooCommerce Product Search and Category Operations
 * Handles product searching, filtering, and category browsing
 */

export { getProductCategories } from './get-categories';
export { searchProducts } from './search-products';

export type {
  WooCommerceOperationParams,
  WooCommerceOperationResult,
  CategoryInfo,
  SearchProductsInfo
} from './types';
