import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import OpenAI from 'openai'
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

describe('/api/chat - Error Handling', () => {
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
    it('should handle rate limiting', async () => {
      const mockCheckDomainRateLimit = jest.fn(() => ({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 3600000,
      }))

      const requestBody = {
        message: 'Hello',
        session_id: 'test-session-123',
        domain: 'example.com', // Domain is required
      }

      const response = await POST(createRequest(requestBody), {
        deps: {
          checkDomainRateLimit: mockCheckDomainRateLimit,
        },
      })
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Rate limit exceeded. Please try again later.')
      expect(mockCheckDomainRateLimit).toHaveBeenCalled()
    })

    it('should handle Supabase errors gracefully', async () => {
      const dbError = new Error('Database connection failed')
      const errorSupabase = {
        from: jest.fn((table: string) => {
          if (table === 'conversations') {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: dbError,
                  }),
                }),
              }),
            }
          }
          return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({ error: null }),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }
        }),
        rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      const mockCreateSupabaseClient = jest.fn().mockResolvedValue(errorSupabase)

      const requestBody = {
        message: 'Hello',
        session_id: 'test-session-123',
        domain: 'example.com',
      }

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
