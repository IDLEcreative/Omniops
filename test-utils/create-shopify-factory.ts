/**
 * Mock Shopify Factory for Testing
 *
 * Provides mock implementations of ShopifyClientFactory for dependency injection in tests.
 * Eliminates need for complex module mocking while maintaining type safety.
 */

import type {
  ShopifyClientFactory,
  ShopifyCredentials,
} from '@/lib/shopify-api/factory';
import type { Database } from '@/types/supabase';

type CustomerConfig = Database['public']['Tables']['customer_configs']['Row'];

/**
 * Mock Shopify factory for testing
 *
 * Provides configurable mock implementations for all factory methods.
 */
export class MockShopifyFactory implements ShopifyClientFactory {
  private mockConfig: CustomerConfig | null;
  private mockClient: any;
  private mockCredentials: ShopifyCredentials;

  constructor(config?: {
    config?: CustomerConfig | null;
    client?: any;
    credentials?: ShopifyCredentials;
  }) {
    this.mockConfig = config?.config || null;
    this.mockClient = config?.client || this.createDefaultMockClient();
    this.mockCredentials = config?.credentials || this.createDefaultCredentials();
  }

  /**
   * Create default mock Shopify client with jest functions
   */
  private createDefaultMockClient() {
    return {
      getProducts: jest.fn().mockResolvedValue({ products: [] }),
      getProduct: jest.fn().mockResolvedValue({ product: null }),
      searchProducts: jest.fn().mockResolvedValue([]),
      getOrders: jest.fn().mockResolvedValue({ orders: [] }),
      getOrder: jest.fn().mockResolvedValue({ order: null }),
      getCustomers: jest.fn().mockResolvedValue({ customers: [] }),
      getCustomer: jest.fn().mockResolvedValue({ customer: null }),
      searchCustomers: jest.fn().mockResolvedValue([]),
      getInventoryLevels: jest.fn().mockResolvedValue({ inventory_levels: [] }),
    };
  }

  /**
   * Create default test credentials
   */
  private createDefaultCredentials(): ShopifyCredentials {
    return {
      shop: 'test-shop.myshopify.com',
      accessToken: 'shpat_test_token',
      apiVersion: '2025-01',
    };
  }

  /**
   * Get customer configuration for a domain (mock implementation)
   */
  async getConfigForDomain(domain: string): Promise<CustomerConfig | null> {
    return this.mockConfig;
  }

  /**
   * Create Shopify API client (mock implementation)
   */
  createClient(credentials: ShopifyCredentials): any {
    return this.mockClient;
  }

  /**
   * Decrypt credentials (mock implementation)
   */
  async decryptCredentials(config: CustomerConfig): Promise<ShopifyCredentials | null> {
    // If config has credentials, return mock credentials
    if (config.encrypted_credentials || config.shopify_access_token) {
      return this.mockCredentials;
    }
    return null;
  }

  // ==================== TEST HELPERS ====================

  /**
   * Update mock config (for test scenarios)
   */
  setConfig(config: CustomerConfig | null) {
    this.mockConfig = config;
  }

  /**
   * Update mock client (for test scenarios)
   */
  setClient(client: any) {
    this.mockClient = client;
  }

  /**
   * Update mock credentials (for test scenarios)
   */
  setCredentials(credentials: ShopifyCredentials) {
    this.mockCredentials = credentials;
  }

  /**
   * Get the mock client instance (for assertions)
   */
  getMockClient() {
    return this.mockClient;
  }
}

/**
 * Create mock factory with sensible defaults
 *
 * @param overrides - Optional overrides for default behavior
 * @returns Configured mock factory ready for testing
 *
 * @example
 * // Create factory with config present and products
 * const factory = createMockShopifyFactory({
 *   hasConfig: true,
 *   products: [{ id: 1, title: 'Test Product', variants: [] }]
 * });
 *
 * @example
 * // Create factory with no config (simulates unconfigured domain)
 * const factory = createMockShopifyFactory({ hasConfig: false });
 */
export function createMockShopifyFactory(overrides?: {
  hasConfig?: boolean;
  products?: any[];
  orders?: any[];
  customers?: any[];
  domain?: string;
  customClient?: any;
}): MockShopifyFactory {
  const domain = overrides?.domain || 'test-domain.com';

  // Create mock client with overridable responses
  const mockClient = overrides?.customClient || {
    getProducts: jest.fn(async () => ({ products: overrides?.products || [] })),
    getProduct: jest.fn(async (id: string) => {
      const products = overrides?.products || [];
      return { product: products.find((p: any) => p.id === id) || null };
    }),
    searchProducts: jest.fn(async (query: string, limit: number) => {
      const products = overrides?.products || [];
      return products.slice(0, limit);
    }),
    getOrders: jest.fn(async () => ({ orders: overrides?.orders || [] })),
    getOrder: jest.fn(async (id: string) => {
      const orders = overrides?.orders || [];
      return { order: orders.find((o: any) => o.id === id) || null };
    }),
    getCustomers: jest.fn(async () => ({ customers: overrides?.customers || [] })),
    getCustomer: jest.fn(async (id: string) => {
      const customers = overrides?.customers || [];
      return { customer: customers.find((c: any) => c.id === id) || null };
    }),
    searchCustomers: jest.fn(async (query: string) => {
      const customers = overrides?.customers || [];
      return customers;
    }),
    getInventoryLevels: jest.fn(async () => ({ inventory_levels: [] })),
  };

  // Create mock config if hasConfig is not explicitly false
  const mockConfig: CustomerConfig | null = overrides?.hasConfig !== false
    ? {
        id: 'test-config-id',
        domain,
        customer_id: 'test-customer-id',
        business_name: 'Test Business',
        business_description: 'Test business description',
        welcome_message: 'Welcome to our test store!',
        primary_color: '#000000',
        suggested_questions: null,
        shopify_shop: 'test-shop.myshopify.com',
        shopify_access_token: 'shpat_test_token',
        woocommerce_url: null,
        woocommerce_consumer_key: null,
        woocommerce_consumer_secret: null,
        encrypted_credentials: {
          shopify: {
            store_url: 'test-shop.myshopify.com',
            access_token: 'shpat_test_token',
          },
        },
        active: true,
        rate_limit: 100,
        allowed_origins: ['*'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null;

  return new MockShopifyFactory({
    config: mockConfig,
    client: mockClient,
  });
}

/**
 * Create factory that simulates credential decryption failure
 */
export function createMockShopifyFactoryWithDecryptionError(): MockShopifyFactory {
  const factory = createMockShopifyFactory({ hasConfig: true });

  // Override decryptCredentials to return null (simulates decryption failure)
  factory.decryptCredentials = jest.fn().mockResolvedValue(null);

  return factory;
}

/**
 * Create factory that simulates database connection error
 */
export function createMockShopifyFactoryWithDatabaseError(): MockShopifyFactory {
  const factory = createMockShopifyFactory({ hasConfig: false });

  // Override getConfigForDomain to throw error
  factory.getConfigForDomain = jest.fn().mockRejectedValue(new Error('Database connection failed'));

  return factory;
}
