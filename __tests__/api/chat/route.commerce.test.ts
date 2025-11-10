import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import OpenAI from 'openai'
import { mockCommerceProvider, createMockProduct } from '@/test-utils/api-test-helpers'
import {
  resetTestEnvironment,
  createFreshOpenAIMock,
  configureDefaultOpenAIResponse,
  createFreshSupabaseMock,
  createFreshRateLimitMock,
} from '@/__tests__/setup/isolated-test-setup'

// Mock dependencies
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

describe('/api/chat - Commerce Integration', () => {
  let mockOpenAIInstance: jest.Mocked<OpenAI>

  beforeAll(() => {
    mockOpenAIInstance = createFreshOpenAIMock()
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance)
  })

  beforeEach(() => {
    resetTestEnvironment()
    mockOpenAIInstance.chat.completions.create.mockClear()
    configureDefaultOpenAIResponse(mockOpenAIInstance)

    const supabaseModule = jest.requireMock('@/lib/supabase-server')
    const mockSupabase = createFreshSupabaseMock()
    supabaseModule.createClient.mockResolvedValue(mockSupabase)
    supabaseModule.createServiceRoleClient.mockResolvedValue(mockSupabase)
    supabaseModule.requireClient.mockResolvedValue(mockSupabase)
    supabaseModule.requireServiceRoleClient.mockResolvedValue(mockSupabase)
    supabaseModule.validateSupabaseEnv.mockReturnValue(true)

    const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')
    commerceModule.getCommerceProvider.mockReset()
    commerceModule.getCommerceProvider.mockResolvedValue(null)

    const embeddingsModule = jest.requireMock('@/lib/embeddings')
    embeddingsModule.searchSimilarContent.mockReset()
    embeddingsModule.searchSimilarContent.mockResolvedValue([])

    const rateLimitModule = jest.requireMock('@/lib/rate-limit')
    const mockRateLimit = createFreshRateLimitMock(true)
    rateLimitModule.checkDomainRateLimit.mockClear()
    rateLimitModule.checkDomainRateLimit.mockImplementation(mockRateLimit)
  })

  const createRequest = (body: unknown) => {
    return new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('POST', () => {
    it('should include WooCommerce products when provider is configured', async () => {
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
      const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')
      commerceModule.getCommerceProvider.mockReset()

      const mockSearchSimilarContent = jest.fn().mockResolvedValue([
        {
          content: 'Fallback semantic search result',
          url: 'https://example.com/page',
          title: 'Product Page',
          similarity: 0.75,
        },
      ])

      const provider = mockCommerceProvider({
        platform: 'woocommerce',
        searchProducts: jest.fn().mockRejectedValue(new Error('Commerce API error')),
      })

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
  })
})
