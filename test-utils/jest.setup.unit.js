// Unit test setup WITHOUT MSW - optimized for speed
// This file is used by jest.unit.config.js for fast unit tests

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

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
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({
    get: jest.fn((name) => {
      if (name === 'sb-access-token' || name.startsWith('sb-')) {
        return { name, value: 'mock-access-token' };
      }
      return { name, value: 'mock-cookie-value' };
    }),
    getAll: jest.fn(() => [
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

// Mock window.matchMedia for tests that use it (only in jsdom environment)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Note: MSW mocks removed - tests needing MSW should use integration test config
// Unit tests are optimized for speed and don't include MSW dependencies

// Clear mocks between tests
afterEach(() => {
  jest.clearAllMocks()
})
