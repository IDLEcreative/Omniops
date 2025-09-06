import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';

/**
 * Creates a properly configured mock Supabase client for testing
 */
export function mockSupabaseClient(overrides?: any): any {
  const defaultClient = {
    auth: {
      signInWithPassword: jest.fn<any>().mockResolvedValue({ 
        data: { 
          user: { id: 'test-user-id', email: 'test@example.com' }, 
          session: { access_token: 'test-token', refresh_token: 'refresh-token' } 
        }, 
        error: null 
      }),
      signUp: jest.fn<any>().mockResolvedValue({ 
        data: { 
          user: { id: 'new-user-id', email: 'new@example.com' }, 
          session: null 
        }, 
        error: null 
      }),
      signOut: jest.fn<any>().mockResolvedValue({ error: null }),
      getSession: jest.fn<any>().mockResolvedValue({ 
        data: { 
          session: { access_token: 'test-token', refresh_token: 'refresh-token' } 
        }, 
        error: null 
      }),
      getUser: jest.fn<any>().mockResolvedValue({ 
        data: { 
          user: { id: 'test-user-id', email: 'test@example.com' } 
        }, 
        error: null 
      }),
      onAuthStateChange: jest.fn<any>().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
    from: jest.fn<any>(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn<any>().mockResolvedValue({ data: null, error: null }),
      then: jest.fn<any>().mockResolvedValue({ data: [], error: null }),
    })),
    rpc: jest.fn<any>().mockResolvedValue({ data: [], error: null }),
    storage: {
      from: jest.fn<any>().mockReturnValue({
        upload: jest.fn<any>().mockResolvedValue({ 
          data: { path: 'test/path' }, 
          error: null 
        }),
        getPublicUrl: jest.fn<any>().mockReturnValue({ 
          data: { publicUrl: 'https://example.com/file' } 
        }),
      }),
    },
  };

  return { ...defaultClient, ...overrides };
}

/**
 * Creates a properly configured mock WooCommerce client for testing
 */
export function mockWooCommerceClient(overrides?: any) {
  const defaultClient = {
    get: jest.fn<any>().mockImplementation((endpoint: string, params?: any) => {
      // Provide sensible default responses based on endpoint
      if (endpoint.startsWith('products/')) {
        const idString = endpoint.split('/')[1];
        const id = idString ? parseInt(idString) : 1;
        return Promise.resolve({
          data: {
            id,
            name: `Product ${id}`,
            slug: `product-${id}`,
            permalink: `https://store.com/product-${id}`,
            type: 'simple',
            status: 'publish',
            description: 'Product description',
            short_description: 'Short description',
            sku: `SKU-${id}`,
            price: '19.99',
            regular_price: '19.99',
            sale_price: '',
            stock_quantity: 100,
            stock_status: 'instock',
            categories: [],
            images: [],
            attributes: []
          }
        });
      }
      
      if (endpoint === 'products') {
        return Promise.resolve({
          data: [{
            id: 1,
            name: 'Test Product',
            slug: 'test-product',
            permalink: 'https://store.com/test-product',
            type: 'simple',
            status: 'publish',
            description: 'Test description',
            short_description: 'Short desc',
            sku: 'TEST-001',
            price: '19.99',
            regular_price: '19.99',
            sale_price: '',
            stock_quantity: 100,
            stock_status: 'instock',
            categories: [],
            images: [],
            attributes: []
          }]
        });
      }
      
      if (endpoint === 'orders') {
        return Promise.resolve({ data: [] });
      }
      
      if (endpoint === 'customers') {
        return Promise.resolve({ data: [] });
      }
      
      return Promise.resolve({ data: [] });
    }),
    post: jest.fn<any>().mockResolvedValue({ data: {} }),
    put: jest.fn<any>().mockResolvedValue({ data: {} }),
    delete: jest.fn<any>().mockResolvedValue({ data: { deleted: true } }),
  };

  return { ...defaultClient, ...overrides };
}

/**
 * Creates a properly configured mock NextRequest for testing API routes
 */
export function mockNextRequest(
  url: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    searchParams?: Record<string, string>;
  }
): NextRequest {
  const baseUrl = 'http://localhost:3000';
  const fullUrl = new URL(url, baseUrl);
  
  // Add search params if provided
  if (options?.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      fullUrl.searchParams.append(key, value);
    });
  }

  // Create headers
  const headers = new Headers(options?.headers || {});
  if (options?.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  // Create the request
  const init = {
    method: options?.method || 'GET',
    headers,
    body: undefined as string | undefined,
  };

  // Add body if provided
  if (options?.body) {
    init.body = typeof options.body === 'string' 
      ? options.body 
      : JSON.stringify(options.body);
  }

  return new NextRequest(fullUrl, init as any);
}

/**
 * Mock response helper for streaming responses
 */
export function mockStreamResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        // Simulate delay between chunks
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Helper to create mock product data
 */
export function createMockProduct(overrides?: Partial<any>) {
  return {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    permalink: 'https://store.com/test-product',
    type: 'simple',
    status: 'publish',
    description: 'Test product description',
    short_description: 'Short description',
    sku: 'TEST-001',
    price: '19.99',
    regular_price: '19.99',
    sale_price: '',
    stock_quantity: 100,
    stock_status: 'instock',
    categories: [{ id: 1, name: 'Test Category', slug: 'test-category' }],
    images: [{ id: 1, src: 'https://example.com/image.jpg', alt: 'Test' }],
    attributes: [],
    ...overrides
  };
}

/**
 * Helper to create mock order data
 */
export function createMockOrder(overrides?: Partial<any>) {
  return {
    id: 1,
    status: 'processing',
    currency: 'USD',
    total: '19.99',
    date_created: '2024-01-01T00:00:00',
    date_modified: '2024-01-01T00:00:00',
    customer_id: 1,
    billing: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      address_1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postcode: '12345',
      country: 'US'
    },
    shipping: {
      first_name: 'John',
      last_name: 'Doe',
      address_1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postcode: '12345',
      country: 'US'
    },
    line_items: [
      {
        id: 1,
        name: 'Test Product',
        product_id: 1,
        quantity: 1,
        total: '19.99',
      }
    ],
    ...overrides
  };
}

/**
 * Helper to create mock customer data
 */
export function createMockCustomer(overrides?: Partial<any>) {
  return {
    id: 1,
    email: 'customer@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    username: 'janedoe',
    date_created: '2024-01-01T00:00:00',
    date_modified: '2024-01-01T00:00:00',
    billing: {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'customer@example.com',
      phone: '555-0123',
      address_1: '456 Oak St',
      city: 'Somewhere',
      state: 'NY',
      postcode: '54321',
      country: 'US'
    },
    shipping: {
      first_name: 'Jane',
      last_name: 'Doe',
      address_1: '456 Oak St',
      city: 'Somewhere',
      state: 'NY',
      postcode: '54321',
      country: 'US'
    },
    ...overrides
  };
}

/**
 * Helper to set up common test environment variables
 */
export function setupTestEnv() {
  process.env.WOOCOMMERCE_URL = 'https://test-store.com';
  process.env.WOOCOMMERCE_CONSUMER_KEY = 'test-consumer-key';
  process.env.WOOCOMMERCE_CONSUMER_SECRET = 'test-consumer-secret';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  process.env.OPENAI_API_KEY = 'test-openai-key';
}

/**
 * Helper to clean up test environment
 */
export function cleanupTestEnv() {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset modules if needed
  jest.resetModules();
}

export default {
  mockSupabaseClient,
  mockWooCommerceClient,
  mockNextRequest,
  mockStreamResponse,
  createMockProduct,
  createMockOrder,
  createMockCustomer,
  setupTestEnv,
  cleanupTestEnv,
};