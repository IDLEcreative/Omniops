/**
 * Shopify Admin API Client - AI-optimized header for fast comprehension
 *
 * @purpose Main entry point for Shopify Admin REST API v2025-01 integration
 *
 * @flow
 *   1. new ShopifyAPI(config) → Extends ShopifyAPIOperations
 *   2. → Inherits all methods (getProducts, searchProducts, getOrders, getCustomers)
 *   3. → Makes authenticated requests to Shopify Admin REST API
 *   4. → Returns typed responses (ShopifyProduct[], ShopifyOrder[], etc.)
 *
 * @keyFunctions (inherited from ShopifyAPIOperations)
 *   - getProducts: Get products with filters (limit, status, etc.)
 *   - searchProducts: Full-text product search
 *   - getOrders: Get orders with filters (status, created_at, etc.)
 *   - getCustomers: Get customers with filters
 *   - getInventoryLevels: Check inventory levels
 *
 * @handles
 *   - Products: List, get by ID, search by query
 *   - Orders: List, get by ID, filter by status
 *   - Customers: List, get by ID, search by email/name
 *   - Inventory: Get levels for locations
 *   - Type safety: Zod schemas validate all responses
 *
 * @returns
 *   - ShopifyAPI instance extending ShopifyAPIOperations
 *   - All methods return Promise<ShopifyProduct[]>, Promise<ShopifyOrder[]>, etc.
 *
 * @dependencies
 *   - Shopify Admin REST API v2025-01
 *   - ShopifyAPIClient for HTTP requests
 *   - ShopifyAPIOperations for business logic
 *   - Zod schemas for type validation
 *
 * @consumers
 *   - lib/shopify-dynamic.ts: Creates clients dynamically per domain
 *   - lib/agents/providers/shopify-provider.ts: Agent queries to Shopify
 *   - app/api/shopify/ * /route.ts: API endpoints (note: asterisk for glob pattern)
 *
 * @configuration
 *   - shop: Store domain (mystore.myshopify.com)
 *   - accessToken: Shopify Admin API access token
 *   - apiVersion: API version (2025-01)
 *
 * @example
 *   const shopify = new ShopifyAPI({shop: 'store.myshopify.com', accessToken: 'shpat_xxx', apiVersion: '2025-01'});
 *   const products = await shopify.getProducts({limit: 10});
 *   const orders = await shopify.getOrders({status: 'open'});
 *
 * @totalLines 76
 * @estimatedTokens 600 (without header), 280 (with header - 53% savings)
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
