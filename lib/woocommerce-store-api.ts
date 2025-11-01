/**
 * WooCommerce Store API - Proxy for Backward Compatibility
 * Re-exports from modularized implementation
 */

export { WooCommerceStoreAPI } from './woocommerce-store-api/index';
export type {
  StoreAPICartResponse,
  StoreAPICartItem,
  StoreAPICartTotals,
  StoreAPICoupon,
  StoreAPIError,
  StoreAPIResponse
} from './woocommerce-store-api/types';
