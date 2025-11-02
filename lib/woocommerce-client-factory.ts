/**
 * WooCommerce Client Factory
 *
 * Factory pattern with dependency injection for testable WooCommerce client creation.
 * Separates configuration loading from client instantiation.
 */

import { WooCommerceAPI } from './woocommerce-api';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { decryptWooCommerceConfig, tryDecryptCredentials } from '@/lib/encryption';
import type { SupabaseClient } from '@/types/supabase';

/**
 * Configuration data structure returned from database
 */
export interface WooCommerceConfigData {
  woocommerce_url?: string;
  woocommerce_consumer_key?: string;
  woocommerce_consumer_secret?: string;
  encrypted_credentials?: any;
}

/**
 * Function type for fetching configuration
 * Injected dependency for testability
 */
export type ConfigProvider = (domain: string) => Promise<WooCommerceConfigData | null>;

/**
 * Factory class for creating WooCommerce API clients
 * Uses dependency injection for testability
 */
export class WooCommerceClientFactory {
  /**
   * @param configProvider - Function to fetch configuration from database
   */
  constructor(private configProvider: ConfigProvider) {}

  /**
   * Create WooCommerce API client for a domain
   * @param domain - Customer domain
   * @returns WooCommerceAPI instance or null if not configured
   */
  async createClient(domain: string): Promise<WooCommerceAPI | null> {
    const config = await this.configProvider(domain);

    if (!config) {
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
}

/**
 * Default configuration provider using Supabase
 * @param domain - Customer domain
 * @returns Configuration data or null
 */
export async function defaultConfigProvider(domain: string): Promise<WooCommerceConfigData | null> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    return null;
  }

  const { data: config, error } = await supabase
    .from('customer_configs')
    .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret, encrypted_credentials')
    .eq('domain', domain)
    .single();

  if (error || !config) {
    return null;
  }

  return config;
}

/**
 * Singleton factory instance using default Supabase config provider
 * Use this for production code
 */
export const defaultWooCommerceFactory = new WooCommerceClientFactory(defaultConfigProvider);
