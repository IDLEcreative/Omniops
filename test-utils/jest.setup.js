// Polyfills for MSW
import './jest.setup.msw'

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { server } from '../__tests__/mocks/server'

// Set test environment
process.env.NODE_ENV = 'test'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.ENCRYPTION_KEY = 'test-encryption-key-exactly-32ch'
process.env.WOOCOMMERCE_URL = 'https://test-store.com'
process.env.WOOCOMMERCE_CONSUMER_KEY = 'test-consumer-key'
process.env.WOOCOMMERCE_CONSUMER_SECRET = 'test-consumer-secret'

// Mock ioredis FIRST to prevent real Redis connections during test imports
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
    quit: jest.fn().mockResolvedValue('OK'),
    disconnect: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    status: 'ready',
  }));
});

// Mock OpenAI to avoid browser detection issues in tests
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Mocked response',
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
  }));
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '',
}))

// Mock Next.js headers and cookies
// IMPORTANT: Next.js 15 made cookies() async, so the mock must return a Promise
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn((name) => {
      // Return Supabase auth cookies for authenticated tests
      if (name === 'sb-access-token' || name.startsWith('sb-')) {
        return { name, value: 'mock-access-token' };
      }
      return { name, value: 'mock-cookie-value' };
    }),
    getAll: jest.fn(() => [
      // Supabase SSR client expects these cookies for authentication
      { name: 'sb-access-token', value: 'mock-access-token' },
      { name: 'sb-refresh-token', value: 'mock-refresh-token' },
    ]),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn((name) => name.startsWith('sb-')),
  })),
  headers: jest.fn(() => ({
    get: jest.fn(() => null),
    has: jest.fn(() => false),
    set: jest.fn(),
    delete: jest.fn(),
    forEach: jest.fn(),
  })),
}))

// Establish API mocking before all tests (guarded for Node/MSW compatibility)
beforeAll(() => {
  try {
    // Use 'bypass' to allow module-level mocks (OpenAI, Supabase) to work without MSW interception
    // This prevents tests from hanging when unhandled requests occur
    server.listen({ onUnhandledRequest: 'bypass' })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[MSW] Disabled in test environment:', e?.message || e)
  }
})

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  try { server.resetHandlers() } catch {}
  jest.clearAllMocks()
})

// Clean up after the tests are finished
afterAll(() => { try { server.close() } catch {} })
