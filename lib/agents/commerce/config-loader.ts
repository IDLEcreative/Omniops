/**
 * Customer configuration loading and platform detection
 * Handles database queries and environment variable fallbacks
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type { CustomerConfig } from './types';

export function normalizeDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .trim()
    .toLowerCase();
}

export async function loadCustomerConfig(domain: string): Promise<CustomerConfig | null> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('customer_configs')
      .select('woocommerce_url, shopify_shop')
      .eq('domain', domain)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[Commerce Provider] Failed to load configuration:', error);
      }
      return null;
    }

    return data as CustomerConfig;
  } catch (error) {
    console.error('[Commerce Provider] Error loading configuration:', error);
    return null;
  }
}

export function hasWooCommerceSupport(config: CustomerConfig | null): boolean {
  // Check if database has WooCommerce configuration (presence of URL indicates it's configured)
  if (config?.woocommerce_url) {
    return true;
  }

  // Fallback to environment variables for backward compatibility
  return Boolean(
    process.env.WOOCOMMERCE_URL &&
      process.env.WOOCOMMERCE_CONSUMER_KEY &&
      process.env.WOOCOMMERCE_CONSUMER_SECRET
  );
}

export function hasShopifySupport(config: CustomerConfig | null): boolean {
  // Check if database has Shopify configuration (presence of shop indicates it's configured)
  if (config?.shopify_shop) {
    return true;
  }

  // Fallback to environment variables for backward compatibility
  return Boolean(process.env.SHOPIFY_SHOP && process.env.SHOPIFY_ACCESS_TOKEN);
}
