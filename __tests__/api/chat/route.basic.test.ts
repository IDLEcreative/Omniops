import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import OpenAI from 'openai'
import { mockChatSupabaseClient } from '@/test-utils/api-test-helpers'
import {
  resetTestEnvironment,
  createFreshOpenAIMock,
  configureDefaultOpenAIResponse,
  createFreshSupabaseMock,
  createFreshRateLimitMock,
} from '@/__tests__/setup/isolated-test-setup'

// Mock dependencies
jest.mock('@/lib/supabase/server')
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

describe('/api/chat - Basic Functionality', () => {
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

    const supabaseModule = jest.requireMock('@/lib/supabase/server')
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
  })
})
