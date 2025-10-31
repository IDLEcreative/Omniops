/**
 * Dynamic Shopify Client Loader
 * Loads Shopify configuration from database based on domain
 */

import { ShopifyAPI, ShopifyProduct } from './shopify-api';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { decrypt, tryDecryptCredentials } from '@/lib/encryption';
import type { EncryptedCredentials } from '@/types/encrypted-credentials';

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

  // Fetch configuration for this domain (include both new and legacy formats)
  const { data: config, error } = await supabase
    .from('customer_configs')
    .select('shopify_shop, shopify_access_token, encrypted_credentials')
    .eq('domain', domain)
    .single();

  if (error || !config) {
    return null;
  }

  let shopUrl: string | undefined;
  let accessToken: string | undefined;

  // NEW: Try encrypted_credentials first
  if (config.encrypted_credentials) {
    const credentials = tryDecryptCredentials(config.encrypted_credentials);
    if (credentials.shopify) {
      shopUrl = credentials.shopify.store_url;
      accessToken = credentials.shopify.access_token;
    }
  }

  // FALLBACK: Use legacy individual columns if new format not available
  if (!accessToken && config.shopify_access_token) {
    try {
      shopUrl = config.shopify_shop;
      accessToken = decrypt(config.shopify_access_token);
    } catch (error) {
      console.error('Failed to decrypt legacy Shopify credentials:', error);
      return null;
    }
  }

  // Validate we have all required credentials
  if (!shopUrl || !accessToken) {
    return null;
  }

  return new ShopifyAPI({
    shop: shopUrl,
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
