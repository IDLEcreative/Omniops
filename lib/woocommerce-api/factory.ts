/**
 * WooCommerce Factory Pattern for Dependency Injection
 *
 * Enables testing by allowing injection of mock implementations while
 * maintaining backward compatibility with production code.
 */

import type { Database } from '@/types/supabase';
import type { WooCommerceAPI } from './index';

type CustomerConfig = Database['public']['Tables']['customer_configs']['Row'];

/**
 * WooCommerce credentials structure
 */
export interface WooCommerceCredentials {
  url: string;
  consumerKey: string;
  consumerSecret: string;
  version?: string;
}

/**
 * Factory interface for WooCommerce client creation
 *
 * This interface enables dependency injection for testing by allowing
 * mock implementations to be provided instead of real database/encryption calls.
 */
export interface WooCommerceClientFactory {
  /**
   * Get customer configuration for a domain
   *
   * @param domain - Customer domain to fetch config for
   * @returns Customer config or null if not found
   */
  getConfigForDomain(domain: string): Promise<CustomerConfig | null>;

  /**
   * Create WooCommerce API client from credentials
   *
   * @param credentials - WooCommerce store credentials
   * @returns Configured WooCommerce API client
   */
  createClient(credentials: WooCommerceCredentials): WooCommerceAPI;

  /**
   * Decrypt WooCommerce credentials from encrypted format
   *
   * @param config - Customer config containing encrypted credentials
   * @returns Decrypted credentials or null if unavailable
   */
  decryptCredentials(config: CustomerConfig): Promise<WooCommerceCredentials | null>;
}

/**
 * Production implementation of WooCommerce factory
 *
 * Uses real Supabase database and encryption for production use.
 */
export class ProductionWooCommerceFactory implements WooCommerceClientFactory {
  async getConfigForDomain(domain: string): Promise<CustomerConfig | null> {
    // Dynamic import to avoid build-time errors
    const { createServiceRoleClient } = await import('@/lib/supabase-server');
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return null;
    }

    const { data: config, error } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('domain', domain)
      .single();

    if (error || !config) {
      return null;
    }

    return config;
  }

  createClient(credentials: WooCommerceCredentials): WooCommerceAPI {
    // Dynamic import to avoid circular dependencies
    const { WooCommerceAPI } = require('./index');

    return new WooCommerceAPI({
      url: credentials.url,
      consumerKey: credentials.consumerKey,
      consumerSecret: credentials.consumerSecret,
    });
  }

  async decryptCredentials(config: CustomerConfig): Promise<WooCommerceCredentials | null> {
    // Dynamic import to avoid build-time errors
    const { tryDecryptCredentials, decryptWooCommerceConfig } = await import('@/lib/encryption');

    let storeUrl: string | undefined;
    let consumerKey: string | undefined;
    let consumerSecret: string | undefined;

    // NEW FORMAT: Try encrypted_credentials first
    if (config.encrypted_credentials) {
      // Convert Json type to string for tryDecryptCredentials
      const encryptedStr = typeof config.encrypted_credentials === 'string'
        ? config.encrypted_credentials
        : JSON.stringify(config.encrypted_credentials);

      const credentials = tryDecryptCredentials(encryptedStr);
      if (credentials.woocommerce) {
        storeUrl = credentials.woocommerce.store_url;
        consumerKey = credentials.woocommerce.consumer_key;
        consumerSecret = credentials.woocommerce.consumer_secret;
      }
    }

    // LEGACY FORMAT: Use individual columns if new format not available
    if (!consumerKey && config.woocommerce_consumer_key) {
      const decryptedConfig = decryptWooCommerceConfig({
        enabled: true,
        url: config.woocommerce_url ?? undefined,
        consumer_key: config.woocommerce_consumer_key ?? undefined,
        consumer_secret: config.woocommerce_consumer_secret ?? undefined,
      });

      storeUrl = decryptedConfig.url;
      consumerKey = decryptedConfig.consumer_key;
      consumerSecret = decryptedConfig.consumer_secret;
    }

    // Validate we have all required credentials
    if (!storeUrl || !consumerKey || !consumerSecret) {
      return null;
    }

    return {
      url: storeUrl,
      consumerKey,
      consumerSecret,
      version: 'wc/v3',
    };
  }
}

/**
 * Default factory instance for production use
 */
export const defaultWooCommerceFactory = new ProductionWooCommerceFactory();
