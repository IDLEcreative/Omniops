/**
 * Dynamic Shopify Client Loader
 * Loads Shopify configuration from database based on domain
 */

import { ShopifyAPI, ShopifyProduct } from './shopify-api';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { decrypt } from '@/lib/encryption';

/**
 * Get Shopify client with dynamic configuration from database
 * @param domain - The customer domain
 * @returns ShopifyAPI instance or null if not configured
 */
export async function getDynamicShopifyClient(domain: string): Promise<ShopifyAPI | null> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    return null;
  }

  // Fetch configuration for this domain
  const { data: config, error } = await supabase
    .from('customer_configs')
    .select('shopify_shop, shopify_access_token')
    .eq('domain', domain)
    .single();

  if (error || !config || !config.shopify_shop) {
    return null;
  }

  if (!config.shopify_shop || !config.shopify_access_token) {
    throw new Error('Shopify configuration is incomplete');
  }

  // Decrypt the access token
  let accessToken: string;
  try {
    accessToken = decrypt(config.shopify_access_token);
  } catch (error) {
    throw new Error('Failed to decrypt Shopify credentials');
  }

  if (!accessToken) {
    throw new Error('Failed to decrypt Shopify access token');
  }

  return new ShopifyAPI({
    shop: config.shopify_shop,
    accessToken,
  });
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
