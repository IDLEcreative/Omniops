/**
 * Dynamic Shopify Client Loader
 * Loads Shopify configuration from database based on domain
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
