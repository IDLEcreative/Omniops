import { WooCommerceAPI } from './woocommerce-api';
import { WooCommerceStoreAPI } from './woocommerce-store-api';
import { getCartSessionManager } from './cart-session-manager';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { decryptWooCommerceConfig, tryDecryptCredentials } from '@/lib/encryption';
import type { EncryptedCredentials } from '@/types/encrypted-credentials';

// Product interface
interface Product {
  id: number;
  name: string;
  price: string;
  regular_price?: string;
  sale_price?: string;
  on_sale?: boolean;
  description?: string;
  short_description?: string;
  sku?: string;
  stock_status?: string;
  stock_quantity?: number | null;
  manage_stock?: boolean;
  backorders?: string;
  categories?: Array<{ id: number; name: string }>;
  images?: Array<{ src: string; alt?: string }>;
  permalink?: string;
  attributes?: Array<{ 
    id: number;
    name: string;
    position?: number;
    visible?: boolean;
    variation?: boolean;
    options?: string[];
  }>;
  variations?: number[];
}

// Get WooCommerce client with dynamic configuration
export async function getDynamicWooCommerceClient(domain: string): Promise<WooCommerceAPI | null> {
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    return null;
  }
  
  // Fetch configuration for this domain (include both new and legacy formats)
  const { data: config, error } = await supabase
    .from('customer_configs')
    .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret, encrypted_credentials')
    .eq('domain', domain)
    .single();

  if (error || !config) {
    return null;
  }

  let storeUrl: string | undefined;
  let consumerKey: string | undefined;
  let consumerSecret: string | undefined;

  // NEW: Try encrypted_credentials first
  if (config.encrypted_credentials) {
    const credentials = tryDecryptCredentials(config.encrypted_credentials);
    if (credentials.woocommerce) {
      storeUrl = credentials.woocommerce.store_url;
      consumerKey = credentials.woocommerce.consumer_key;
      consumerSecret = credentials.woocommerce.consumer_secret;
    }
  }

  // FALLBACK: Use legacy individual columns if new format not available
  if (!consumerKey && config.woocommerce_consumer_key) {
    const decryptedConfig = decryptWooCommerceConfig({
      enabled: true,
      url: config.woocommerce_url,
      consumer_key: config.woocommerce_consumer_key,
      consumer_secret: config.woocommerce_consumer_secret,
    });

    storeUrl = decryptedConfig.url;
    consumerKey = decryptedConfig.consumer_key;
    consumerSecret = decryptedConfig.consumer_secret;
  }

  // Validate we have all required credentials
  if (!storeUrl || !consumerKey || !consumerSecret) {
    return null;
  }

  return new WooCommerceAPI({
    url: storeUrl,
    consumerKey,
    consumerSecret,
  });
}

// Dynamic search products function
export async function searchProductsDynamic(domain: string, query: string, limit: number = 10): Promise<Product[]> {
  const wc = await getDynamicWooCommerceClient(domain);

  if (!wc) {
    return [];
  }

  try {
    return await wc.getProducts({
      search: query,
      per_page: limit,
      status: 'publish',
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

/**
 * Get WooCommerce Store API client with dynamic configuration
 * Used for cart operations (not admin operations)
 */
export async function getDynamicStoreAPIClient(
  domain: string,
  userId?: string
): Promise<WooCommerceStoreAPI | null> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    return null;
  }

  // Fetch configuration for this domain
  const { data: config, error } = await supabase
    .from('customer_configs')
    .select('woocommerce_url')
    .eq('domain', domain)
    .single();

  if (error || !config || !config.woocommerce_url) {
    return null;
  }

  // Get or create session for this user
  const sessionManager = getCartSessionManager();
  const guestUserId = userId || sessionManager.generateGuestId();
  const session = await sessionManager.getSession(guestUserId, domain);

  // Create Store API client with session nonce
  return new WooCommerceStoreAPI({
    url: config.woocommerce_url,
    nonce: session.nonce,
  });
}

/**
 * Check if Store API is available for a domain
 */
export async function isStoreAPIAvailable(domain: string): Promise<boolean> {
  try {
    const storeAPI = await getDynamicStoreAPIClient(domain);
    if (!storeAPI) {
      return false;
    }
    return await storeAPI.isAvailable();
  } catch (error) {
    console.error('[WooCommerce Store API] Availability check failed:', error);
    return false;
  }
}

// Note: Order lookup has been moved to the CommerceProvider pattern
// See: lib/agents/commerce-provider.ts and lib/agents/providers/woocommerce-provider.ts
// This enables multi-platform support (WooCommerce, Shopify, etc.)