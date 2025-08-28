// Polyfills for MSW
import './jest.setup.msw'

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { server } from '../__tests__/mocks/server'

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.ENCRYPTION_KEY = 'test-encryption-key-exactly-32ch'

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

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers()
  jest.clearAllMocks()
})

// Clean up after the tests are finished
afterAll(() => server.close())