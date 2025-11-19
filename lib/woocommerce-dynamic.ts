/**
 * WooCommerce Dynamic Client - AI-optimized header for fast comprehension
 *
 * @purpose Dynamic WooCommerce client creation with domain-based configuration and credential decryption
 *
 * @flow
 *   1. Domain → getConfigForDomain (fetch customer_configs)
 *   2. → decryptCredentials (decrypt WooCommerce API keys)
 *   3. → createClient (instantiate WooCommerceAPI/StoreAPI)
 *   4. → Return configured client OR null if not configured
 *
 * @keyFunctions
 *   - getDynamicWooCommerceClient (line 56): Creates REST API client from domain config
 *   - searchProductsDynamic (line 86): Searches products using dynamic client
 *   - getDynamicStoreAPIClient (line 109): Creates Store API client (cart/checkout operations)
 *   - isStoreAPIAvailable (line 145): Checks if Store API is available for domain
 *
 * @handles
 *   - REST API: Product search, catalog access via WooCommerceAPI
 *   - Store API: Cart operations, session management via WooCommerceStoreAPI
 *   - Dependency Injection: Factory pattern for testing (mock vs real database)
 *   - Error handling: Returns null if config/credentials missing
 *
 * @returns
 *   - getDynamicWooCommerceClient: WooCommerceAPI | null
 *   - searchProductsDynamic: Product[] (empty array on error)
 *   - getDynamicStoreAPIClient: WooCommerceStoreAPI | null
 *   - isStoreAPIAvailable: boolean
 *
 * @dependencies
 *   - Database: customer_configs table (WooCommerce credentials)
 *   - Encryption: AES-256 decryption for API keys
 *   - WooCommerce: REST API v3 + Store API
 *   - Factory: WooCommerceClientFactory for dependency injection
 *
 * @consumers
 *   - lib/agents/providers/woocommerce-provider.ts: Uses dynamic client for agent queries
 *   - app/api/woocommerce/products/route.ts: Product search endpoint
 *   - app/api/cart/route.ts: Cart operations via Store API
 *
 * @testingStrategy
 *   - Production: Pass defaultWooCommerceFactory (uses real database)
 *   - Testing: Pass mockFactory (injects test config/credentials)
 *
 * @security
 *   - Credentials: AES-256-GCM encrypted in database (customer_configs table)
 *   - Decryption: Only server-side with service role access (never sent to client)
 *   - API keys: WooCommerce consumerKey + consumerSecret encrypted before storage
 *   - Domain validation: Only loads config for valid customer domains
 *   - Factory pattern: Prevents direct database access in tests (injection)
 *   - Error handling: Returns null if credentials missing (no exception leaks)
 *   - Service role required: Bypasses RLS to access encrypted credentials
 *
 * @totalLines 180
 * @estimatedTokens 1,200 (without header), 450 (with header - 62% savings)
 */

import { WooCommerceAPI } from './woocommerce-api';
import { WooCommerceStoreAPI } from './woocommerce-store-api';
import { getCartSessionManager } from './cart-session-manager';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { EncryptedCredentials } from '@/types/encrypted-credentials';
import {
  WooCommerceClientFactory,
  defaultWooCommerceFactory,
} from './woocommerce-api/factory';

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

/**
 * Get WooCommerce client with dynamic configuration
 *
 * @param domain - Customer domain
 * @param factory - Optional factory for dependency injection (defaults to production)
 * @returns WooCommerce API client or null if configuration not found
 *
 * @example
 * // Production usage (uses real database)
 * const client = await getDynamicWooCommerceClient('example.com');
 *
 * @example
 * // Testing usage (uses mock factory)
 * const mockFactory = createMockWooCommerceFactory({ hasConfig: true });
 * const client = await getDynamicWooCommerceClient('example.com', mockFactory);
 */
export async function getDynamicWooCommerceClient(
  domain: string,
  factory: WooCommerceClientFactory = defaultWooCommerceFactory
): Promise<WooCommerceAPI | null> {
  try {
    // Get config using factory (allows test injection)
    const config = await factory.getConfigForDomain(domain);
    if (!config) {
      console.log(`No configuration found for domain: ${domain}`);
      return null;
    }

    // Decrypt credentials using factory (allows test injection)
    const credentials = await factory.decryptCredentials(config);
    if (!credentials) {
      console.log(`No WooCommerce credentials found for domain: ${domain}`);
      return null;
    }

    // Create client using factory (allows test injection)
    const client = factory.createClient(credentials);

    return client;
  } catch (error) {
    console.error('Error creating WooCommerce client:', error);
    return null;
  }
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