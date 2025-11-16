/**
 * Isolated Test Setup Utility
 *
 * Provides jest.isolateModules() wrapped functions to ensure complete
 * mock isolation between tests. This prevents mock state bleeding that
 * causes tests to pass individually but fail in batch mode.
 */

import { jest } from '@jest/globals'
import type OpenAI from 'openai'

/**
 * Creates a fresh OpenAI mock instance WITHOUT default configuration.
 * This prevents conflicts between default responses and test-specific responses.
 * Each test must configure its own mock behavior.
 */
export function createFreshOpenAIMock() {
  const mockInstance = {
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  } as any as jest.Mocked<OpenAI>

  return mockInstance
}

/**
 * Configure OpenAI mock with a default simple response.
 * Use this for tests that don't need specific AI behavior.
 */
export function configureDefaultOpenAIResponse(mockInstance: jest.Mocked<OpenAI>) {
  mockInstance.chat.completions.create.mockResolvedValue({
    choices: [{
      message: {
        role: 'assistant',
        content: 'This is a helpful response from the AI assistant.',
      }
    }]
  })
}

/**
 * Creates a fresh Supabase client mock with default successful responses.
 * Can be customized per test by passing options.
 */
export function createFreshSupabaseMock(options?: {
  conversationId?: string
  messages?: Array<{ role: string; content: string }>
  shouldError?: boolean
}) {
  const conversationId = options?.conversationId || '550e8400-e29b-41d4-a716-446655440000'
  const messages = options?.messages || []

  return {
    from: jest.fn((table: string) => {
      if (table === 'conversations') {
        const chainable = {
          insert: jest.fn(function() { return this }),
          select: jest.fn(function() { return this }),
          update: jest.fn(function() { return this }),
          eq: jest.fn(function() { return this }),
          single: jest.fn().mockResolvedValue({
            data: { id: conversationId, session_id: 'test-session' },
            error: options?.shouldError ? new Error('DB error') : null,
          }),
          // Allow awaiting the chain
          then: jest.fn((resolve) => resolve({
            data: { id: conversationId, session_id: 'test-session' },
            error: options?.shouldError ? new Error('DB error') : null,
          })),
        }
        return chainable
      }

      if (table === 'messages') {
        const chainable = {
          insert: jest.fn(function() { return this }),
          select: jest.fn(function() { return this }),
          eq: jest.fn(function() { return this }),
          order: jest.fn(function() { return this }),
          limit: jest.fn(function() { return this }),
          single: jest.fn().mockResolvedValue({
            data: { id: '123', content: 'test' },
            error: null,
          }),
          // Allow the whole chain to be awaited
          then: jest.fn((resolve) => resolve({
            data: messages.length > 0 ? messages : [],
            error: null,
          })),
        }
        return chainable
      }

      // Default for other tables - use chainable pattern
      const defaultChainable = {
        select: jest.fn(function() { return this }),
        insert: jest.fn(function() { return this }),
        update: jest.fn(function() { return this }),
        delete: jest.fn(function() { return this }),
        eq: jest.fn(function() { return this }),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        // Allow awaiting the chain
        then: jest.fn((resolve) => resolve({ data: null, error: null })),
      }
      return defaultChainable
    }),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    auth: {
      // User session methods
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),

      // Admin methods
      admin: {
        createUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        deleteUser: jest.fn().mockResolvedValue({ data: null, error: null }),
        updateUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        listUsers: jest.fn().mockResolvedValue({ data: { users: [] }, error: null }),
        getUserById: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        inviteUserByEmail: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    },
  }
}

/**
 * Creates a fresh commerce provider mock.
 */
export function createFreshCommerceProviderMock(options?: {
  platform?: 'woocommerce' | 'shopify'
  products?: any[]
  shouldError?: boolean
}) {
  const searchProducts = options?.shouldError
    ? jest.fn().mockRejectedValue(new Error('Commerce API error'))
    : jest.fn().mockResolvedValue(options?.products || [])

  return {
    platform: options?.platform || 'woocommerce',
    searchProducts,
    getProduct: jest.fn(),
  }
}

/**
 * Creates a fresh embeddings search mock.
 */
export function createFreshEmbeddingsSearchMock(results: any[] = []) {
  return jest.fn().mockResolvedValue(results)
}

/**
 * Creates a fresh rate limit mock.
 */
export function createFreshRateLimitMock(allowed: boolean = true) {
  return jest.fn().mockReturnValue({
    allowed,
    remaining: allowed ? 99 : 0,
    resetTime: Date.now() + 3600000,
  })
}

/**
 * Sets up all base mocks needed for chat route tests.
 * Call this in beforeEach for each test suite.
 */
export function setupBaseMocks() {
  // Clear all mocks (but don't reset modules to preserve singleton references)
  jest.clearAllMocks()
  jest.restoreAllMocks()
}

/**
 * Complete test environment reset.
 * Use this before each test to ensure isolation.
 */
export function resetTestEnvironment() {
  setupBaseMocks()

  // Reset environment variables
  process.env.OPENAI_API_KEY = 'test-openai-key'
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
}
