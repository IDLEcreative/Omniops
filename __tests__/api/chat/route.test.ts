import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import OpenAI from 'openai'
import {
  mockChatSupabaseClient,
  mockOpenAIClient,
  mockCommerceProvider,
  createMockProduct
} from '@/test-utils/api-test-helpers'
import {
  resetTestEnvironment,
  createFreshOpenAIMock,
  configureDefaultOpenAIResponse,
  createFreshSupabaseMock,
  createFreshCommerceProviderMock,
  createFreshEmbeddingsSearchMock,
  createFreshRateLimitMock,
} from '@/__tests__/setup/isolated-test-setup'

// Mock dependencies - use manual mocks from __mocks__/
jest.mock('@/lib/supabase-server')
jest.mock('@/lib/rate-limit')
jest.mock('openai')
jest.mock('@/lib/embeddings')
jest.mock('@/lib/agents/commerce-provider', () => ({
  getCommerceProvider: jest.fn().mockResolvedValue(null),
}))
jest.mock('@/lib/link-sanitizer', () => ({
  sanitizeOutboundLinks: jest.fn((message) => message),
}))
jest.mock('@/lib/search-wrapper', () => ({
  extractQueryKeywords: jest.fn((q) => [q]),
  isPriceQuery: jest.fn(() => false),
  extractPriceRange: jest.fn(() => null),
}))
jest.mock('@/lib/chat-telemetry', () => ({
  ChatTelemetry: jest.fn(),
  telemetryManager: {
    createSession: jest.fn(() => ({
      log: jest.fn(),
      trackIteration: jest.fn(),
      trackSearch: jest.fn(),
      complete: jest.fn(),
    })),
  },
}))
jest.mock('@/lib/monitoring/performance-tracker', () => ({
  trackAsync: jest.fn((fn) => fn()),
}))
jest.mock('@/lib/redis-fallback', () => ({
  getRedisClientWithFallback: jest.fn(() => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    setex: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
  })),
}))

// Set environment variables
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

describe('/api/chat', () => {
  let mockOpenAIInstance: jest.Mocked<OpenAI>

  // CRITICAL: Create mock instance ONCE at suite level to preserve singleton references
  // This ensures the route's cached OpenAI instance always points to our mock
  beforeAll(() => {
    mockOpenAIInstance = createFreshOpenAIMock()

    // Configure the OpenAI constructor to always return our mock instance
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance)
  })

  beforeEach(() => {
    // CRITICAL: Complete environment reset for true isolation
    resetTestEnvironment()

    // Clear the mock's call history but keep the same instance
    mockOpenAIInstance.chat.completions.create.mockClear()

    // Configure default response for tests that don't specify custom behavior
    configureDefaultOpenAIResponse(mockOpenAIInstance)

    // Reset Supabase mock to default working state with fresh instance
    const supabaseModule = jest.requireMock('@/lib/supabase-server')
    const mockSupabase = createFreshSupabaseMock()
    supabaseModule.createClient.mockResolvedValue(mockSupabase)
    supabaseModule.createServiceRoleClient.mockResolvedValue(mockSupabase)
    supabaseModule.requireClient.mockResolvedValue(mockSupabase)
    supabaseModule.requireServiceRoleClient.mockResolvedValue(mockSupabase)
    supabaseModule.validateSupabaseEnv.mockReturnValue(true)

    // Reset commerce provider mock to null (no provider by default)
    const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')
    commerceModule.getCommerceProvider.mockReset()
    commerceModule.getCommerceProvider.mockResolvedValue(null)

    // Reset embeddings mock to default empty state
    const embeddingsModule = jest.requireMock('@/lib/embeddings')
    embeddingsModule.searchSimilarContent.mockReset()
    embeddingsModule.searchSimilarContent.mockResolvedValue([])

    // Reset rate limiting (allow by default)
    const rateLimitModule = jest.requireMock('@/lib/rate-limit')
    const mockRateLimit = createFreshRateLimitMock(true)
    rateLimitModule.checkDomainRateLimit.mockClear()
    rateLimitModule.checkDomainRateLimit.mockImplementation(mockRateLimit)
  })

  describe('POST', () => {
    const createRequest = (body: unknown) => {
      return new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
    }

    it('should handle a basic chat request', async () => {
      const requestBody = {
        message: 'Hello, I need help',
        session_id: 'test-session-123',
        config: {
          features: {
            websiteScraping: { enabled: false },
            woocommerce: { enabled: false },
          },
        },
      }

      const response = await POST(createRequest(requestBody), { params: Promise.resolve({}), deps: {} })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('conversation_id')
      expect(data.message).toBe('This is a helpful response from the AI assistant.')
      expect(data.conversation_id).toBeDefined()

      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalled()
    })

    it('should handle existing conversation', async () => {
      const requestBody = {
        message: 'Follow up question',
        session_id: 'test-session-123',
        conversation_id: '550e8400-e29b-41d4-a716-446655440000',
        config: {
          features: {
            websiteScraping: { enabled: false },
            woocommerce: { enabled: false },
          },
        },
      }

      // Setup mock with conversation history
      const mockModule = jest.requireMock('@/lib/supabase-server')
      const mockSupabase = mockChatSupabaseClient({
        conversationId: requestBody.conversation_id,
        messages: [
          { role: 'user', content: 'Previous question' },
          { role: 'assistant', content: 'Previous answer' },
        ],
      })
      mockModule.createServiceRoleClient.mockResolvedValue(mockSupabase)
      mockModule.requireServiceRoleClient.mockResolvedValue(mockSupabase)

      const response = await POST(createRequest(requestBody), { params: Promise.resolve({}), deps: {} })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.conversation_id).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('should include relevant content from embeddings search', async () => {
      const requestBody = {
        message: 'What are your business hours?',
        session_id: 'test-session-123',
        domain: 'example.com',
      }

      // CRITICAL: Create fresh embeddings search mock for this test
      const mockSearchSimilarContent = createFreshEmbeddingsSearchMock([
        {
          content: 'Our business hours are Monday-Friday 9AM-5PM',
          url: 'https://example.com/hours',
          title: 'Business Hours',
          similarity: 0.85,
        },
      ])

      // CRITICAL: Configure OpenAI to return tool calls first, then final response
      // Don't reset - just reconfigure to avoid clearing the mock reference
      let callCount = 0
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          // First call: AI decides to search products (which falls back to semantic search)
          return {
            choices: [{
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [{
                  id: 'call_123',
                  type: 'function',
                  function: {
                    name: 'search_products',
                    arguments: JSON.stringify({ query: 'business hours' })
                  }
                }]
              },
              finish_reason: 'tool_calls'
            }]
          }
        } else {
          // Second call: AI provides final response with context
          return {
            choices: [{
              message: {
                role: 'assistant',
                content: 'Based on our information, we are open Monday-Friday 9AM-5PM.'
              },
              finish_reason: 'stop'
            }]
          }
        }
      }) as any

      // Pass fresh mock via dependency injection for isolation
      const response = await POST(createRequest(requestBody), {
        deps: {
          searchSimilarContent: mockSearchSimilarContent,
        },
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sources).toBeDefined()
      expect(data.sources.length).toBeGreaterThan(0)
      expect(mockSearchSimilarContent).toHaveBeenCalledWith(
        'business hours',
        expect.anything(), // domain
        expect.anything(),  // limit
        expect.anything()  // min similarity
      )
    })

    it('should recover gracefully when tool arguments are missing', async () => {
      // CRITICAL: Reconfigure OpenAI mock using mockImplementation for complete isolation
      let callCount = 0
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            choices: [{
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [{
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'search_products',
                    arguments: '{"limit": 5}', // Missing required 'query' parameter
                  },
                }],
              },
            }]
          } as any
        } else {
          return {
            choices: [{
              message: {
                content: 'I need a product name to start searching for you.',
              },
            }]
          } as any
        }
      })

      const requestBody = {
        message: 'Show me spare parts',
        session_id: 'test-session-123',
        domain: 'example.com',
      }

      // CRITICAL: Create fresh mock spies to verify these functions aren't called
      const mockGetCommerceProvider = jest.fn().mockResolvedValue(null)
      const mockSearchSimilarContent = jest.fn().mockResolvedValue([])

      const response = await POST(createRequest(requestBody), {
        deps: {
          getCommerceProvider: mockGetCommerceProvider,
          searchSimilarContent: mockSearchSimilarContent,
        },
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('product name')
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledTimes(2)
      // When tool arguments are missing, functions should not be called
      expect(mockGetCommerceProvider).not.toHaveBeenCalled()
      expect(mockSearchSimilarContent).not.toHaveBeenCalled()
    })

    it('should handle rate limiting', async () => {
      // Create a mock function that denies the request
      const mockCheckDomainRateLimit = jest.fn(() => ({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000,
      }))

      const requestBody = {
        message: 'Hello',
        session_id: 'test-session-123',
      }

      const response = await POST(createRequest(requestBody), {
        deps: {
          checkDomainRateLimit: mockCheckDomainRateLimit,
        },
      })
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded. Please try again later.')
      // Headers might not be accessible in test environment
      expect(mockCheckDomainRateLimit).toHaveBeenCalled()
    })

    it('should validate request data', async () => {
      const invalidRequestBody = {
        message: '', // Empty message
      }

      const response = await POST(createRequest(invalidRequestBody), { deps: {} })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request format')
      expect(data.details).toBeDefined()
    })

    it('should handle long messages', async () => {
      const requestBody = {
        message: 'a'.repeat(5001), // Exceeds max length
        session_id: 'test-session-123',
      }

      const response = await POST(createRequest(requestBody), { params: Promise.resolve({}), deps: {} })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request format')
    })

    it('should include WooCommerce products when provider is configured', async () => {
      // CRITICAL: Reset commerce module for this specific test
      const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')
      commerceModule.getCommerceProvider.mockReset()

      const testProduct = createMockProduct({
        id: 1,
        name: 'Test Product',
        price: '19.99',
        sku: 'SKU-123',
        permalink: 'https://example.com/product/test-product',
      })

      const provider = mockCommerceProvider({
        platform: 'woocommerce',
        products: [testProduct],
      })

      // Configure commerce provider for this test only
      commerceModule.getCommerceProvider.mockResolvedValue(provider)

      const requestBody = {
        message: 'I want to buy a product',
        session_id: 'test-session-123',
        domain: 'example.com',
        config: {
          features: {
            woocommerce: { enabled: true },
          },
        },
      }

      // CRITICAL: Reconfigure OpenAI mock using mockImplementation for complete isolation
      let callCount = 0
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            choices: [{
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [{
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'search_products',
                    arguments: '{"query": "product", "limit": 100}',
                  },
                }],
              },
            }]
          } as any
        } else {
          return {
            choices: [{
              message: {
                content: 'Here are the products I found for you.',
              },
            }]
          } as any
        }
      })

      // Pass commerce provider via dependency injection for isolation
      const response = await POST(createRequest(requestBody), {
        deps: {
          getCommerceProvider: commerceModule.getCommerceProvider,
        },
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(provider.searchProducts).toHaveBeenCalled()
      expect(data.message).toBe('Here are the products I found for you.')
    })

    it('should include Shopify products when provider is configured', async () => {
      // CRITICAL: Reset commerce module for this specific test
      const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')
      commerceModule.getCommerceProvider.mockReset()

      const shopifyProduct = {
        id: 7,
        title: 'Premium Shopify Widget',
        handle: 'premium-shopify-widget',
        body_html: '<p>High quality widget</p>',
        variants: [{ price: '49.99', sku: 'SHOP-001' }],
      }

      const provider = mockCommerceProvider({
        platform: 'shopify',
        products: [shopifyProduct],
      })

      // Configure commerce provider for this test only
      commerceModule.getCommerceProvider.mockResolvedValue(provider)

      const requestBody = {
        message: 'Show me widgets',
        session_id: 'test-session-123',
        domain: 'brand.com',
        config: {
          features: {
            woocommerce: { enabled: false },
          },
        },
      }

      // CRITICAL: Reconfigure OpenAI mock using mockImplementation for complete isolation
      let callCount = 0
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            choices: [{
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [{
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'search_products',
                    arguments: '{"query": "widgets", "limit": 100}',
                  },
                }],
              },
            }]
          } as any
        } else {
          return {
            choices: [{
              message: {
                content: 'Here are the widgets available.',
              },
            }]
          } as any
        }
      })

      // Pass commerce provider via dependency injection for isolation
      const response = await POST(createRequest(requestBody), {
        deps: {
          getCommerceProvider: commerceModule.getCommerceProvider,
        },
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(provider.searchProducts).toHaveBeenCalled()
    })

    it('should handle commerce provider errors gracefully and fallback to semantic search', async () => {
      // CRITICAL: Reset commerce and embeddings modules for this specific test
      const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')
      commerceModule.getCommerceProvider.mockReset()

      // Create a fresh mock for search similar content
      const mockSearchSimilarContent = jest.fn().mockResolvedValue([
        {
          content: 'Fallback semantic search result',
          url: 'https://example.com/page',
          title: 'Product Page',
          similarity: 0.75,
        },
      ])

      // Create provider that will throw error
      const provider = mockCommerceProvider({
        platform: 'woocommerce',
        searchProducts: jest.fn().mockRejectedValue(new Error('Commerce API error')),
      })

      // Configure commerce provider to return error-throwing provider
      commerceModule.getCommerceProvider.mockResolvedValue(provider)

      const requestBody = {
        message: 'Show me products',
        session_id: 'test-session-123',
        domain: 'example.com',
        config: {
          features: {
            woocommerce: { enabled: true },
          },
        },
      }

      // CRITICAL: Reconfigure OpenAI mock using mockImplementation for complete isolation
      let callCount = 0
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            choices: [{
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [{
                  id: 'call_1',
                  type: 'function',
                  function: {
                    name: 'search_products',
                    arguments: '{"query": "products", "limit": 100}',
                  },
                }],
              },
            }]
          } as any
        } else {
          return {
            choices: [{
              message: {
                content: 'Here are the products from our catalog.',
              },
            }]
          } as any
        }
      })

      // Pass both commerce provider and semantic search via DI for isolation
      const response = await POST(createRequest(requestBody), {
        deps: {
          getCommerceProvider: commerceModule.getCommerceProvider,
          searchSimilarContent: mockSearchSimilarContent,
        },
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Here are the products from our catalog.')
      expect(provider.searchProducts).toHaveBeenCalled()
      expect(mockSearchSimilarContent).toHaveBeenCalled()
    })

    it('should handle Supabase errors gracefully', async () => {
      // CRITICAL: Create isolated error-throwing Supabase client for this test
      // Supabase returns { data, error } objects, NOT rejected promises!
      const dbError = new Error('Database connection failed')
      const errorSupabase = {
        from: jest.fn((table: string) => {
          if (table === 'conversations') {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  // Supabase returns { data: null, error: Error }
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: dbError,
                  }),
                }),
              }),
            }
          }
          // Default for other tables
          return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({ error: null }),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }
        }),
        rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      // Create a fresh mock function that returns our error Supabase
      const mockCreateSupabaseClient = jest.fn().mockResolvedValue(errorSupabase)

      const requestBody = {
        message: 'Hello',
        session_id: 'test-session-123',
        domain: 'example.com',
      }

      // Inject the error-throwing Supabase client via dependency injection
      const response = await POST(createRequest(requestBody), {
        deps: {
          createServiceRoleClient: mockCreateSupabaseClient,
        },
      })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process chat message')
      expect(mockCreateSupabaseClient).toHaveBeenCalled()
    })

    it('should handle OpenAI API errors', async () => {
      // CRITICAL: Reconfigure OpenAI mock to throw error using mockImplementation
      mockOpenAIInstance.chat.completions.create.mockImplementation(async () => {
        throw new Error('OpenAI API error')
      })

      const requestBody = {
        message: 'Hello',
        session_id: 'test-session-123',
        domain: 'example.com',
      }

      const response = await POST(createRequest(requestBody), { params: Promise.resolve({}), deps: {} })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process chat message')
    })
  })
})
