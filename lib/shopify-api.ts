/**
 * Shopify Admin API Client
 * Main entry point for Shopify Admin REST API integration
 *
 * Provides type-safe access to Shopify Admin REST API with operations for:
 * - Products (list, get, search)
 * - Orders (list, get)
 * - Customers (list, get, search)
 * - Inventory (levels)
 *
 * @see https://shopify.dev/docs/api/admin-rest
 *
 * @example
 * ```typescript
 * const shopify = new ShopifyAPI({
 *   shop: 'mystore.myshopify.com',
 *   accessToken: 'shpat_xxxxx',
 *   apiVersion: '2025-01'
 * });
 *
 * // Get products
 * const products = await shopify.getProducts({ limit: 10 });
 *
 * // Search products
 * const results = await shopify.searchProducts('shirt', 5);
 *
 * // Get orders
 * const orders = await shopify.getOrders({ status: 'open' });
 * ```
 */

import { ShopifyAPIOperations } from './shopify-api-operations';

/**
 * Main Shopify API Class
 * Extends operations class to provide full API functionality
 */
export class ShopifyAPI extends ShopifyAPIOperations {}

/**
 * Re-export all types, schemas, and interfaces
 */
export type {
  ShopifyConfig,
  ShopifyProduct,
  ShopifyProductVariant,
  ShopifyProductImage,
  ShopifyOrder,
  ShopifyLineItem,
  ShopifyCustomer,
  ShopifyInventoryLevel,
} from './shopify-api-types';

export {
  ShopifyProductSchema,
  ShopifyProductVariantSchema,
  ShopifyProductImageSchema,
  ShopifyOrderSchema,
  ShopifyLineItemSchema,
  ShopifyCustomerSchema,
  ShopifyInventoryLevelSchema,
} from './shopify-api-types';

export type {
  GetProductsParams,
  GetOrdersParams,
  GetCustomersParams,
  GetInventoryLevelParams,
} from './shopify-api-operations';

/**
 * Re-export client and operations for advanced use cases
 */
export { ShopifyAPIClient } from './shopify-api-client';
export { ShopifyAPIOperations } from './shopify-api-operations';
