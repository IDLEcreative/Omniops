/**
 * API Test Helpers
 * Standardized utilities for testing API routes consistently
 *
 * Usage:
 * import { mockSupabaseClient, mockWooCommerceClient } from '@/test-utils/api-test-helpers';
 *
 * const mockClient = mockSupabaseClient({
 *   users: { data: [mockUser], error: null }
 * });
 */

export interface MockSupabaseOptions {
  user?: any;
  authError?: Error | null;
  tables?: Record<string, any>;
}

export interface MockWooCommerceOptions {
  orders?: any[];
  products?: any[];
  getOrderError?: Error | null;
  getProductsError?: Error | null;
}

/**
 * Create a mock Supabase client with standard structure
 */
export function mockSupabaseClient(options: MockSupabaseOptions = {}) {
  const {
    user = { id: 'test-user-123', email: 'test@example.com' },
    authError = null,
    tables = {}
  } = options;

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: authError ? null : user },
        error: authError,
      }),
    },
    from: jest.fn((table: string) => {
      // Check if specific table mock provided
      if (tables[table]) {
        return tables[table];
      }

      // Default query builder
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
        then: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
  };
}

/**
 * Create a mock WooCommerce client
 */
export function mockWooCommerceClient(options: MockWooCommerceOptions = {}) {
  const {
    orders = [],
    products = [],
    getOrderError = null,
    getProductsError = null,
  } = options;

  return {
    getOrder: jest.fn().mockImplementation((id: number) => {
      if (getOrderError) {
        return Promise.reject(getOrderError);
      }
      const order = orders.find((o) => o.id === id);
      return order ? Promise.resolve(order) : Promise.reject(new Error('Order not found'));
    }),
    getOrders: jest.fn().mockImplementation(() => {
      if (getOrderError) {
        return Promise.reject(getOrderError);
      }
      return Promise.resolve(orders);
    }),
    getProduct: jest.fn().mockImplementation((id: number) => {
      const product = products.find((p) => p.id === id);
      return product ? Promise.resolve(product) : Promise.reject(new Error('Product not found'));
    }),
    getProducts: jest.fn().mockImplementation(() => {
      if (getProductsError) {
        return Promise.reject(getProductsError);
      }
      return Promise.resolve(products);
    }),
  };
}

/**
 * Create a NextRequest for testing
 */
export function buildRequest(url: string, options: {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
} = {}) {
  const {
    method = 'POST',
    body,
    headers = { 'Content-Type': 'application/json' },
  } = options;

  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Mock OpenAI client
 */
export function mockOpenAIClient(options: {
  chatResponse?: string;
  embeddingVector?: number[];
} = {}) {
  const {
    chatResponse = 'Mocked AI response',
    embeddingVector = Array(1536).fill(0.1),
  } = options;

  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: chatResponse,
              role: 'assistant',
            },
          }],
        }),
      },
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: embeddingVector }],
      }),
    },
  };
}

/**
 * Create mock organization data
 */
export function createMockOrganization(overrides: Partial<any> = {}) {
  return {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    settings: {},
    plan_type: 'free',
    seat_limit: 5,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create mock user data
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create mock WooCommerce order
 */
export function createMockOrder(overrides: Partial<any> = {}) {
  return {
    id: 123,
    number: '123',
    status: 'completed',
    date_created: '2025-01-01T00:00:00',
    total: '99.99',
    currency: 'USD',
    line_items: [
      {
        name: 'Test Product',
        quantity: 1,
        total: '99.99',
      },
    ],
    billing: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    },
    shipping: {
      address_1: '123 Main St',
      city: 'Test City',
      state: 'TS',
      postcode: '12345',
      country: 'US',
    },
    ...overrides,
  };
}

/**
 * Create mock WooCommerce product
 */
export function createMockProduct(overrides: Partial<any> = {}) {
  return {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    price: '29.99',
    regular_price: '29.99',
    sale_price: '',
    status: 'publish',
    stock_status: 'instock',
    stock_quantity: 100,
    manage_stock: true,
    description: 'A test product',
    short_description: 'Test product',
    categories: [{ id: 1, name: 'Test Category', slug: 'test-category' }],
    images: [
      {
        src: 'https://example.com/image.jpg',
        alt: 'Test Product',
      },
    ],
    ...overrides,
  };
}

/**
 * Create mock Commerce Provider
 * Mocks the unified commerce provider interface that works with WooCommerce, Shopify, etc.
 *
 * Usage:
 * ```typescript
 * const mockProvider = mockCommerceProvider({
 *   platform: 'woocommerce',
 *   products: [createMockProduct()],
 *   orders: [createMockOrder()]
 * });
 *
 * // Mock the getCommerceProvider function
 * jest.mock('@/lib/agents/commerce-provider', () => ({
 *   getCommerceProvider: jest.fn().mockResolvedValue(mockProvider)
 * }));
 * ```
 */
export interface MockCommerceProviderOptions {
  platform?: 'woocommerce' | 'shopify' | null;
  products?: any[];
  orders?: any[];
  searchProducts?: jest.Mock;
  lookupOrder?: jest.Mock;
  checkStock?: jest.Mock;
  getProductDetails?: jest.Mock;
}

export function mockCommerceProvider(options: MockCommerceProviderOptions = {}) {
  const {
    platform = 'woocommerce',
    products = [],
    orders = [],
    searchProducts,
    lookupOrder,
    checkStock,
    getProductDetails,
  } = options;

  // If platform is null, return null (no provider)
  if (platform === null) {
    return null;
  }

  return {
    platform,
    searchProducts: searchProducts || jest.fn().mockResolvedValue(products),
    lookupOrder: lookupOrder || jest.fn().mockImplementation(async (orderId: string) => {
      const order = orders.find((o) => o.id.toString() === orderId || o.number === orderId);
      return order || null;
    }),
    checkStock: checkStock || jest.fn().mockResolvedValue({
      productName: 'Test Product',
      sku: 'TEST-SKU',
      stockStatus: 'instock',
      stockQuantity: 100,
      manageStock: true,
      backorders: 'no',
    }),
    getProductDetails: getProductDetails || jest.fn().mockImplementation(async (productId: string) => {
      const product = products.find((p) => p.id.toString() === productId || p.sku === productId);
      return product || null;
    }),
  };
}

/**
 * Create enhanced mock Supabase client for chat routes
 * Includes support for conversations, messages, domains, and customer_configs tables
 */
export function mockChatSupabaseClient(options: {
  conversationId?: string;
  sessionId?: string;
  domainId?: string;
  messages?: Array<{ role: string; content: string }>;
  hasWooCommerce?: boolean;
  hasShopify?: boolean;
} = {}) {
  const {
    conversationId = 'conv-123',
    sessionId = 'session-123',
    domainId = 'domain-123',
    messages = [],
    hasWooCommerce = false,
    hasShopify = false,
  } = options;

  const tables = {
    conversations: {
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: conversationId, session_id: sessionId, created_at: new Date().toISOString() },
            error: null,
          }),
        }),
      }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: conversationId, session_id: sessionId },
            error: null,
          }),
        }),
      }),
    },
    messages: {
      insert: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: messages,
              error: null,
            }),
          }),
        }),
      }),
    },
    domains: {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: domainId ? { id: domainId } : null,
            error: null,
          }),
        }),
      }),
    },
    customer_configs: {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              woocommerce_enabled: hasWooCommerce,
              woocommerce_url: hasWooCommerce ? 'https://example.com' : null,
              shopify_enabled: hasShopify,
              shopify_shop: hasShopify ? 'example.myshopify.com' : null,
            },
            error: null,
          }),
        }),
      }),
    },
  };

  const client = mockSupabaseClient({ tables });

  // Add rpc method for embeddings search
  (client as any).rpc = jest.fn().mockResolvedValue({ data: [], error: null });

  return client;
}
