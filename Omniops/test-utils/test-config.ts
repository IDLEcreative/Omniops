import { NextRequest } from 'next/server'
import { headers } from 'next/headers'

/**
 * Common test configuration and utilities
 */

// Test environment constants
export const TEST_ENV = {
  SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  OPENAI_API_KEY: 'test-openai-key',
  ENCRYPTION_KEY: 'test-encryption-key-exactly-32ch',
  WOOCOMMERCE_URL: 'https://test-store.com',
  WOOCOMMERCE_CONSUMER_KEY: 'test-consumer-key',
  WOOCOMMERCE_CONSUMER_SECRET: 'test-consumer-secret',
}

// Mock data generators
export const generateMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
  ...overrides,
})

export const generateMockSession = (overrides = {}) => ({
  user: generateMockUser(),
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Date.now() + 3600000,
  ...overrides,
})

export const generateMockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Test Product',
  slug: 'test-product',
  price: '19.99',
  regular_price: '19.99',
  sale_price: '',
  description: 'Test product description',
  short_description: 'Short description',
  sku: 'TEST-SKU-001',
  stock_quantity: 100,
  stock_status: 'instock',
  ...overrides,
})

export const generateMockOrder = (overrides = {}) => ({
  id: 1,
  status: 'processing',
  currency: 'USD',
  total: '19.99',
  customer_id: 1,
  billing: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
  },
  shipping: {
    first_name: 'John',
    last_name: 'Doe',
    address_1: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    postcode: '12345',
    country: 'US',
  },
  line_items: [],
  ...overrides,
})

// Helper functions for async testing
export const waitForAsync = (ms: number = 0) => 
  new Promise(resolve => setTimeout(resolve, ms))

export const flushPromises = () => 
  new Promise(resolve => setImmediate(resolve))

// Mock Supabase client factory
export const createMockSupabaseClient = (overrides = {}) => ({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
  },
  rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  ...overrides,
})

// Mock OpenAI client factory
export const createMockOpenAIClient = (overrides = {}) => ({
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Mock AI response',
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
      }),
    },
  },
  embeddings: {
    create: jest.fn().mockResolvedValue({
      data: [{
        embedding: Array(1536).fill(0.1),
      }],
    }),
  },
  ...overrides,
})

// Mock WooCommerce client factory
export const createMockWooCommerceClient = (overrides = {}) => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: { deleted: true } }),
  ...overrides,
})

// NextRequest helper for API route testing
export const createMockNextRequest = (
  url: string,
  options: {
    method?: string
    headers?: Record<string, string>
    body?: any
    searchParams?: Record<string, string>
  } = {}
) => {
  const { method = 'GET', headers = {}, body, searchParams = {} } = options
  
  // Build URL with search params
  const fullUrl = new URL(url, 'http://localhost:3000')
  Object.entries(searchParams).forEach(([key, value]) => {
    fullUrl.searchParams.set(key, value)
  })
  
  // Create request init object
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  }
  
  // Add body if provided
  if (body && method !== 'GET' && method !== 'HEAD') {
    init.body = JSON.stringify(body)
  }
  
  // Try to create NextRequest, fallback to Request if it fails
  try {
    return new NextRequest(fullUrl.toString(), init as any)
  } catch (error) {
    // If NextRequest fails (e.g., due to polyfill issues), create a mock
    const request = new Request(fullUrl.toString(), init as any) as any
    // Add NextRequest-specific properties
    request.nextUrl = {
      href: fullUrl.href,
      origin: fullUrl.origin,
      protocol: fullUrl.protocol,
      hostname: fullUrl.hostname,
      port: fullUrl.port,
      pathname: fullUrl.pathname,
      search: fullUrl.search,
      searchParams: fullUrl.searchParams,
      hash: fullUrl.hash,
    }
    return request
  }
}

// Mock headers for Next.js 15
export const createMockHeaders = (customHeaders: Record<string, string> = {}) => {
  const headerStore = new Map(Object.entries({
    'content-type': 'application/json',
    ...customHeaders,
  }))
  
  return {
    get: (key: string) => headerStore.get(key.toLowerCase()) || null,
    has: (key: string) => headerStore.has(key.toLowerCase()),
    set: (key: string, value: string) => headerStore.set(key.toLowerCase(), value),
    delete: (key: string) => headerStore.delete(key.toLowerCase()),
    forEach: (callback: (value: string, key: string) => void) => {
      headerStore.forEach((value, key) => callback(value, key))
    },
    entries: () => headerStore.entries(),
    keys: () => headerStore.keys(),
    values: () => headerStore.values(),
  }
}

// Error matchers for testing
export const expectError = (fn: () => void, message?: string) => {
  if (message) {
    expect(fn).toThrow(message)
  } else {
    expect(fn).toThrow()
  }
}

export const expectAsyncError = async (fn: () => Promise<any>, message?: string) => {
  await expect(fn()).rejects.toThrow(message)
}

// Database mock helpers
export const mockDatabaseQuery = (result: any, error: any = null) => ({
  data: result,
  error,
  count: Array.isArray(result) ? result.length : null,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK',
})

// Test cleanup utilities
export const cleanupMocks = () => {
  jest.clearAllMocks()
  jest.restoreAllMocks()
}

// Common test patterns
export const testApiRoute = async (
  handler: (req: NextRequest) => Promise<Response>,
  request: NextRequest,
  expectedStatus: number,
  expectedBody?: any
) => {
  const response = await handler(request)
  expect(response.status).toBe(expectedStatus)
  
  if (expectedBody !== undefined) {
    const body = await response.json()
    expect(body).toEqual(expectedBody)
  }
  
  return response
}

// Timeout helpers for async operations
export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = 5000,
  errorMessage: string = 'Operation timed out'
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  
  return Promise.race([promise, timeout])
}

// Mock timers helper
export const useFakeTimers = () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })
  
  return {
    advance: (ms: number) => jest.advanceTimersByTime(ms),
    runAll: () => jest.runAllTimers(),
    runPending: () => jest.runOnlyPendingTimers(),
  }
}

// Export common test utilities from testing library
export { screen, render, waitFor, fireEvent } from '@testing-library/react'
export { renderHook, act } from '@testing-library/react'