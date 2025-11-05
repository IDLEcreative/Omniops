/**
 * Mock WooCommerce Factory for Testing
 *
 * Provides mock implementations of WooCommerceClientFactory for dependency injection in tests.
 * Eliminates need for complex module mocking while maintaining type safety.
 */

import type {
  WooCommerceClientFactory,
  WooCommerceCredentials,
} from '@/lib/woocommerce-api/factory';
import type { Database } from '@/types/supabase';

type CustomerConfig = Database['public']['Tables']['customer_configs']['Row'];

/**
 * Mock WooCommerce factory for testing
 *
 * Provides configurable mock implementations for all factory methods.
 */
export class MockWooCommerceFactory implements WooCommerceClientFactory {
  private mockConfig: CustomerConfig | null;
  private mockClient: any;
  private mockCredentials: WooCommerceCredentials;

  constructor(config?: {
    config?: CustomerConfig | null;
    client?: any;
    credentials?: WooCommerceCredentials;
  }) {
    this.mockConfig = config?.config || null;
    this.mockClient = config?.client || this.createDefaultMockClient();
    this.mockCredentials = config?.credentials || this.createDefaultCredentials();
  }

  /**
   * Create default mock WooCommerce client with jest functions
   */
  private createDefaultMockClient() {
    return {
      getProducts: jest.fn().mockResolvedValue([]),
      getProduct: jest.fn().mockResolvedValue(null),
      createProduct: jest.fn().mockResolvedValue({}),
      updateProduct: jest.fn().mockResolvedValue({}),
      deleteProduct: jest.fn().mockResolvedValue({}),
      batchProducts: jest.fn().mockResolvedValue({ create: [], update: [], delete: [] }),
      getOrders: jest.fn().mockResolvedValue([]),
      getOrder: jest.fn().mockResolvedValue(null),
      createOrder: jest.fn().mockResolvedValue({}),
      updateOrder: jest.fn().mockResolvedValue({}),
      deleteOrder: jest.fn().mockResolvedValue({}),
    };
  }

  /**
   * Create default test credentials
   */
  private createDefaultCredentials(): WooCommerceCredentials {
    return {
      url: 'https://test.example.com',
      consumerKey: 'test_consumer_key',
      consumerSecret: 'test_consumer_secret',
      version: 'wc/v3',
    };
  }

  /**
   * Get customer configuration for a domain (mock implementation)
   */
  async getConfigForDomain(domain: string): Promise<CustomerConfig | null> {
    return this.mockConfig;
  }

  /**
   * Create WooCommerce API client (mock implementation)
   */
  createClient(credentials: WooCommerceCredentials): any {
    return this.mockClient;
  }

  /**
   * Decrypt credentials (mock implementation)
   */
  async decryptCredentials(config: CustomerConfig): Promise<WooCommerceCredentials | null> {
    // If config has credentials, return mock credentials
    if (config.encrypted_credentials || config.woocommerce_consumer_key) {
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
  setCredentials(credentials: WooCommerceCredentials) {
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
 * const factory = createMockWooCommerceFactory({
 *   hasConfig: true,
 *   products: [{ id: 1, name: 'Test Product', price: '10.00' }]
 * });
 *
 * @example
 * // Create factory with no config (simulates unconfigured domain)
 * const factory = createMockWooCommerceFactory({ hasConfig: false });
 */
export function createMockWooCommerceFactory(overrides?: {
  hasConfig?: boolean;
  products?: any[];
  orders?: any[];
  domain?: string;
  customClient?: any;
}): MockWooCommerceFactory {
  const domain = overrides?.domain || 'test-domain.com';

  // Create mock client with overridable responses
  const mockClient = overrides?.customClient || {
    getProducts: jest.fn(async () => overrides?.products || []),
    getProduct: jest.fn(async (id: number) => {
      const products = overrides?.products || [];
      return products.find((p: any) => p.id === id) || null;
    }),
    createProduct: jest.fn(async (data: any) => ({ id: 1, ...data })),
    updateProduct: jest.fn(async (id: number, data: any) => ({ id, ...data })),
    deleteProduct: jest.fn(async () => ({ id: 1 })),
    batchProducts: jest.fn(async () => ({
      create: [],
      update: [],
      delete: [],
    })),
    getOrders: jest.fn(async () => overrides?.orders || []),
    getOrder: jest.fn(async (id: number) => {
      const orders = overrides?.orders || [];
      return orders.find((o: any) => o.id === id) || null;
    }),
    createOrder: jest.fn(async (data: any) => ({ id: 1, ...data })),
    updateOrder: jest.fn(async (id: number, data: any) => ({ id, ...data })),
    deleteOrder: jest.fn(async () => ({ id: 1 })),
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
        woocommerce_url: 'https://test.example.com',
        woocommerce_consumer_key: 'test_consumer_key',
        woocommerce_consumer_secret: 'test_consumer_secret',
        encrypted_credentials: {
          woocommerce: {
            store_url: 'https://test.example.com',
            consumer_key: 'test_consumer_key',
            consumer_secret: 'test_consumer_secret',
          },
        },
        active: true,
        rate_limit: 100,
        allowed_origins: ['*'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null;

  return new MockWooCommerceFactory({
    config: mockConfig,
    client: mockClient,
  });
}

/**
 * Create factory that simulates credential decryption failure
 */
export function createMockWooCommerceFactoryWithDecryptionError(): MockWooCommerceFactory {
  const factory = createMockWooCommerceFactory({ hasConfig: true });

  // Override decryptCredentials to return null (simulates decryption failure)
  factory.decryptCredentials = jest.fn().mockResolvedValue(null);

  return factory;
}

/**
 * Create factory that simulates database connection error
 */
export function createMockWooCommerceFactoryWithDatabaseError(): MockWooCommerceFactory {
  const factory = createMockWooCommerceFactory({ hasConfig: false });

  // Override getConfigForDomain to throw error
  factory.getConfigForDomain = jest.fn().mockRejectedValue(new Error('Database connection failed'));

  return factory;
}
