/**
 * Shopify Factory Pattern for Dependency Injection
 *
 * Enables testing by allowing injection of mock implementations while
 * maintaining backward compatibility with production code.
 */

import type { Database } from '@/types/supabase';
import type { ShopifyAPI } from '../shopify-api';

type CustomerConfig = Database['public']['Tables']['customer_configs']['Row'];

/**
 * Shopify credentials structure
 */
export interface ShopifyCredentials {
  shop: string;
  accessToken: string;
  apiVersion?: string;
}

/**
 * Factory interface for Shopify client creation
 *
 * This interface enables dependency injection for testing by allowing
 * mock implementations to be provided instead of real database/encryption calls.
 */
export interface ShopifyClientFactory {
  /**
   * Get customer configuration for a domain
   *
   * @param domain - Customer domain to fetch config for
   * @returns Customer config or null if not found
   */
  getConfigForDomain(domain: string): Promise<CustomerConfig | null>;

  /**
   * Create Shopify API client from credentials
   *
   * @param credentials - Shopify store credentials
   * @returns Configured Shopify API client
   */
  createClient(credentials: ShopifyCredentials): ShopifyAPI;

  /**
   * Decrypt Shopify credentials from encrypted format
   *
   * @param config - Customer config containing encrypted credentials
   * @returns Decrypted credentials or null if unavailable
   */
  decryptCredentials(config: CustomerConfig): Promise<ShopifyCredentials | null>;
}

/**
 * Production implementation of Shopify factory
 *
 * Uses real Supabase database and encryption for production use.
 */
export class ProductionShopifyFactory implements ShopifyClientFactory {
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

  createClient(credentials: ShopifyCredentials): ShopifyAPI {
    // Dynamic import to avoid circular dependencies
    const { ShopifyAPI } = require('../shopify-api');

    return new ShopifyAPI({
      shop: credentials.shop,
      accessToken: credentials.accessToken,
      apiVersion: credentials.apiVersion || '2025-01',
    });
  }

  async decryptCredentials(config: CustomerConfig): Promise<ShopifyCredentials | null> {
    // Dynamic import to avoid build-time errors
    const { tryDecryptCredentials, decrypt } = await import('@/lib/encryption');

    let shopUrl: string | undefined;
    let accessToken: string | undefined;

    // NEW FORMAT: Try encrypted_credentials first
    if (config.encrypted_credentials) {
      // Convert Json type to string for tryDecryptCredentials
      const encryptedStr = typeof config.encrypted_credentials === 'string'
        ? config.encrypted_credentials
        : JSON.stringify(config.encrypted_credentials);

      const credentials = tryDecryptCredentials(encryptedStr);
      if (credentials.shopify) {
        shopUrl = credentials.shopify.store_url;
        accessToken = credentials.shopify.access_token;
      }
    }

    // LEGACY FORMAT: Use individual columns if new format not available
    if (!accessToken && config.shopify_access_token) {
      try {
        shopUrl = config.shopify_shop || undefined;
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

    return {
      shop: shopUrl,
      accessToken,
      apiVersion: '2025-01',
    };
  }
}

/**
 * Default factory instance for production use
 */
export const defaultShopifyFactory = new ProductionShopifyFactory();
