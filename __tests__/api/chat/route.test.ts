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

// Mock dependencies
jest.mock('@/lib/supabase-server')
jest.mock('@/lib/rate-limit', () => ({
  checkDomainRateLimit: jest.fn(),
}))
jest.mock('openai')
jest.mock('@/lib/embeddings', () => ({
  searchSimilarContent: jest.fn().mockResolvedValue([]),
}))
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

  beforeEach(() => {
    jest.clearAllMocks()

    // Use standardized OpenAI mock
    mockOpenAIInstance = mockOpenAIClient({
      chatResponse: 'This is a helpful response from the AI assistant.',
    }) as any

    // Mock the OpenAI constructor
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
    MockedOpenAI.mockClear()
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance)

    // Configure Supabase mock - use simpler inline approach for better reliability
    const mockModule = jest.requireMock('@/lib/supabase-server')

    // Create a basic mock that works for most tables
    const createBasicMock = () => ({
      from: jest.fn((table: string) => {
        // Conversations table
        if (table === 'conversations') {
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'conv-123', session_id: 'session-123', created_at: new Date().toISOString() },
                  error: null,
                }),
              }),
            }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'conv-123', session_id: 'session-123' },
                  error: null,
                }),
              }),
            }),
          };
        }
        // Messages table
        if (table === 'messages') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        // Domains table
        if (table === 'domains') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'domain-123' },
                  error: null,
                }),
              }),
            }),
          };
        }
        // Default fallback
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
      rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const mockSupabase = createBasicMock();
    mockModule.createClient.mockResolvedValue(mockSupabase)
    mockModule.createServiceRoleClient.mockResolvedValue(mockSupabase)
    mockModule.requireClient.mockResolvedValue(mockSupabase)
    mockModule.requireServiceRoleClient.mockResolvedValue(mockSupabase)
    mockModule.validateSupabaseEnv.mockReturnValue(true)

    // Configure commerce provider mock
    const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')
    commerceModule.getCommerceProvider.mockReset()
    commerceModule.getCommerceProvider.mockResolvedValue(null)

    // Mock rate limiting (allow by default)
    const rateLimitModule = jest.requireMock('@/lib/rate-limit')
    rateLimitModule.checkDomainRateLimit.mockReturnValue({
      allowed: true,
      remaining: 99,
      resetTime: Date.now() + 3600000,
    })
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

      const response = await POST(createRequest(requestBody))
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

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.conversation_id).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('should include relevant content from embeddings search', async () => {
      const requestBody = {
        message: 'What are your business hours?',
        session_id: 'test-session-123',
      }

      // Mock embeddings search results
      const { searchSimilarContent } = await import('@/lib/embeddings')
      const mockSearchSimilarContent = searchSimilarContent as jest.Mock
      mockSearchSimilarContent.mockResolvedValue([
        {
          content: 'Our business hours are Monday-Friday 9AM-5PM',
          url: 'https://example.com/hours',
          title: 'Business Hours',
          similarity: 0.85,
        },
      ])

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sources).toBeDefined()
      expect(data.sources.length).toBeGreaterThan(0)
    })

    it('should recover gracefully when tool arguments are missing', async () => {
      const { searchSimilarContent } = await import('@/lib/embeddings')
      const mockSearchSimilarContent = searchSimilarContent as jest.Mock
      mockSearchSimilarContent.mockClear()

      const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')
      const mockGetCommerceProvider = commerceModule.getCommerceProvider as jest.Mock
      mockGetCommerceProvider.mockClear()

      mockOpenAIInstance.chat.completions.create.mockReset()
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: {
                      name: 'search_products',
                      arguments: '{"limit": 5}', // Missing required 'query' parameter
                    },
                  },
                ],
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'I need a product name to start searching for you.',
              },
            },
          ],
        } as any)

      const requestBody = {
        message: 'Show me spare parts',
        session_id: 'test-session-123',
        domain: 'example.com',
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toContain('product name')
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledTimes(2)
      expect(mockGetCommerceProvider).not.toHaveBeenCalled()
      expect(mockSearchSimilarContent).not.toHaveBeenCalled()
    })

    it('should handle rate limiting', async () => {
      const rateLimitModule = jest.requireMock('@/lib/rate-limit')
      rateLimitModule.checkDomainRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000,
      })

      const requestBody = {
        message: 'Hello',
        session_id: 'test-session-123',
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded. Please try again later.')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    })

    it('should validate request data', async () => {
      const invalidRequestBody = {
        message: '', // Empty message
      }

      const response = await POST(createRequest(invalidRequestBody))
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

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request format')
    })

    it('should include WooCommerce products when provider is configured', async () => {
      const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')

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

      // Mock OpenAI to trigger tool call
      mockOpenAIInstance.chat.completions.create.mockReset()
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: {
                      name: 'search_products',
                      arguments: '{"query": "product", "limit": 100}',
                    },
                  },
                ],
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Here are the products I found for you.',
              },
            },
          ],
        } as any)

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(provider.searchProducts).toHaveBeenCalled()
      expect(data.message).toBe('Here are the products I found for you.')
    })

    it('should include Shopify products when provider is configured', async () => {
      const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')

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

      // Mock OpenAI to trigger tool call
      mockOpenAIInstance.chat.completions.create.mockReset()
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: {
                      name: 'search_products',
                      arguments: '{"query": "widgets", "limit": 100}',
                    },
                  },
                ],
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Here are the widgets available.',
              },
            },
          ],
        } as any)

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(provider.searchProducts).toHaveBeenCalled()
    })

    it('should handle commerce provider errors gracefully and fallback to semantic search', async () => {
      const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')
      const { searchSimilarContent } = await import('@/lib/embeddings')
      const mockSearchSimilarContent = searchSimilarContent as jest.Mock

      const provider = mockCommerceProvider({
        platform: 'woocommerce',
        searchProducts: jest.fn().mockRejectedValue(new Error('Commerce API error')),
      })

      commerceModule.getCommerceProvider.mockResolvedValue(provider)

      // Mock semantic search fallback
      mockSearchSimilarContent.mockResolvedValue([
        {
          content: 'Fallback semantic search result',
          url: 'https://example.com/page',
          title: 'Product Page',
          similarity: 0.75,
        },
      ])

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

      // Mock OpenAI to trigger tool call
      mockOpenAIInstance.chat.completions.create.mockReset()
      mockOpenAIInstance.chat.completions.create
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                role: 'assistant',
                content: null,
                tool_calls: [
                  {
                    id: 'call_1',
                    type: 'function',
                    function: {
                      name: 'search_products',
                      arguments: '{"query": "products", "limit": 100}',
                    },
                  },
                ],
              },
            },
          ],
        } as any)
        .mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: 'Here are the products from our catalog.',
              },
            },
          ],
        } as any)

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Here are the products from our catalog.')
      expect(provider.searchProducts).toHaveBeenCalled()
      expect(mockSearchSimilarContent).toHaveBeenCalled()
    })

    it('should handle Supabase errors gracefully', async () => {
      const mockModule = jest.requireMock('@/lib/supabase-server')

      // Create a mock that throws on insert
      const errorSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockRejectedValue(new Error('Database connection failed')),
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database connection failed'),
          }),
        }),
        rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      mockModule.createServiceRoleClient.mockResolvedValue(errorSupabase)
      mockModule.requireServiceRoleClient.mockResolvedValue(errorSupabase)

      const requestBody = {
        message: 'Hello',
        session_id: 'test-session-123',
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process chat message')
    })

    it('should handle OpenAI API errors', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API error')
      )

      const requestBody = {
        message: 'Hello',
        session_id: 'test-session-123',
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to process chat message')
    })
  })
})
