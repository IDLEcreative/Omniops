/**
 * Shopify Dynamic Client - AI-optimized header for fast comprehension
 *
 * @purpose Dynamic Shopify client creation with domain-based configuration and credential decryption
 *
 * @flow
 *   1. Domain → getConfigForDomain (fetch customer_configs)
 *   2. → decryptCredentials (decrypt Shopify API credentials)
 *   3. → createClient (instantiate ShopifyAPI)
 *   4. → Return configured client OR null if not configured
 *
 * @keyFunctions
 *   - getDynamicShopifyClient (line 15): Creates Shopify Admin API client from domain config
 *   - searchProductsDynamic (line 43): Searches products using dynamic client
 *
 * @handles
 *   - Admin API: Product search, catalog access, order lookup via ShopifyAPI
 *   - Dependency Injection: Factory pattern for testing (mock vs real database)
 *   - Error handling: Returns null/empty array if config/credentials missing
 *
 * @returns
 *   - getDynamicShopifyClient: ShopifyAPI | null
 *   - searchProductsDynamic: ShopifyProduct[] (empty array on error)
 *
 * @dependencies
 *   - Database: customer_configs table (Shopify credentials)
 *   - Encryption: AES-256 decryption for API access tokens
 *   - Shopify: Admin API 2024-01
 *   - Factory: ShopifyClientFactory for dependency injection
 *
 * @consumers
 *   - lib/agents/providers/shopify-provider.ts: Uses dynamic client for agent queries
 *   - app/api/shopify/products/route.ts: Product search endpoint
 *   - app/api/shopify/orders/route.ts: Order lookup endpoint
 *
 * @testingStrategy
 *   - Production: Pass defaultShopifyFactory (uses real database)
 *   - Testing: Pass mockFactory (injects test config/credentials)
 *
 * @security
 *   - Credentials: AES-256-GCM encrypted in database (customer_configs table)
 *   - Decryption: Only server-side with service role access (never sent to client)
 *   - API token: Shopify Admin API access token encrypted before storage
 *   - Domain validation: Only loads config for valid customer domains
 *   - Factory pattern: Prevents direct database access in tests (injection)
 *   - Error handling: Returns null/empty array if credentials missing (no leaks)
 *   - Service role required: Bypasses RLS to access encrypted credentials
 *
 * @totalLines 60
 * @estimatedTokens 600 (without header), 250 (with header - 58% savings)
 */

import { ShopifyAPI, ShopifyProduct } from './shopify-api';
import { ShopifyClientFactory, defaultShopifyFactory } from './shopify-api/factory';

/**
 * Get Shopify client with dynamic configuration from database
 * @param domain - The customer domain
 * @param factory - Optional factory for dependency injection (testing)
 * @returns ShopifyAPI instance or null if not configured
 */
export async function getDynamicShopifyClient(
  domain: string,
  factory: ShopifyClientFactory = defaultShopifyFactory
): Promise<ShopifyAPI | null> {
  try {
    const config = await factory.getConfigForDomain(domain);
    if (!config) {
      return null;
    }

    const credentials = await factory.decryptCredentials(config);
    if (!credentials) {
      return null;
    }

    return factory.createClient(credentials);
  } catch (error) {
    console.error('Error creating Shopify client:', error);
    return null;
  }
}

/**
 * Dynamic search products function
 * @param domain - The customer domain
 * @param query - Search query
 * @param limit - Number of results
 */
export async function searchProductsDynamic(
  domain: string,
  query: string,
  limit: number = 10
): Promise<ShopifyProduct[]> {
  const shopify = await getDynamicShopifyClient(domain);

  if (!shopify) {
    return [];
  }

  try {
    return await shopify.searchProducts(query, limit);
  } catch (error) {
    console.error('[Shopify] Product search error:', error);
    return [];
  }
}
