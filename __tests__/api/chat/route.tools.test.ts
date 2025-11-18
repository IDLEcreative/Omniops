import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import OpenAI from 'openai'
import {
  resetTestEnvironment,
  createFreshOpenAIMock,
  configureDefaultOpenAIResponse,
  createFreshSupabaseMock,
  createFreshEmbeddingsSearchMock,
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

describe('/api/chat - Tool Execution', () => {
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
    it('should include relevant content from embeddings search', async () => {
      const requestBody = {
        message: 'What are your business hours?',
        session_id: 'test-session-123',
        domain: 'example.com',
      }

      const mockSearchSimilarContent = createFreshEmbeddingsSearchMock([
        {
          content: 'Our business hours are Monday-Friday 9AM-5PM',
          url: 'https://example.com/hours',
          title: 'Business Hours',
          similarity: 0.85,
        },
      ])

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
                  id: 'call_123',
                  type: 'function',
                  function: {
                    name: 'search_website_content',
                    arguments: JSON.stringify({ query: 'business hours' })
                  }
                }]
              },
              finish_reason: 'tool_calls'
            }]
          }
        } else {
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
        expect.anything(),
        expect.anything(),
        expect.anything()
      )
    })

    it('should recover gracefully when tool arguments are missing', async () => {
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
                    name: 'search_website_content',
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
      expect(mockGetCommerceProvider).not.toHaveBeenCalled()
      expect(mockSearchSimilarContent).not.toHaveBeenCalled()
    })
  })
})
