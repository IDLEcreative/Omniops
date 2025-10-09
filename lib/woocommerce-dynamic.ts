import { WooCommerceAPI } from './woocommerce-api';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { decryptWooCommerceConfig } from '@/lib/encryption';

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
  
  // Fetch configuration for this domain
  const { data: config, error } = await supabase
    .from('customer_configs')
    .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
    .eq('domain', domain)
    .single();

  if (error || !config || !config.woocommerce_url) {
    return null;
  }

  if (!config.woocommerce_url || !config.woocommerce_consumer_key || !config.woocommerce_consumer_secret) {
    throw new Error('WooCommerce configuration is incomplete');
  }

  // Decrypt the credentials
  const decryptedConfig = decryptWooCommerceConfig({
    enabled: true, // If we have a URL, it's enabled
    url: config.woocommerce_url,
    consumer_key: config.woocommerce_consumer_key,
    consumer_secret: config.woocommerce_consumer_secret,
  });

  if (!decryptedConfig.consumer_key || !decryptedConfig.consumer_secret) {
    throw new Error('Failed to decrypt WooCommerce credentials');
  }

  return new WooCommerceAPI({
    url: decryptedConfig.url!,
    consumerKey: decryptedConfig.consumer_key,
    consumerSecret: decryptedConfig.consumer_secret,
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

// Note: Order lookup has been moved to the CommerceProvider pattern
// See: lib/agents/commerce-provider.ts and lib/agents/providers/woocommerce-provider.ts
// This enables multi-platform support (WooCommerce, Shopify, etc.)