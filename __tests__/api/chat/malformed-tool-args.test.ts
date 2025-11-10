import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'

// Mock all dependencies
jest.mock('@/lib/rate-limit')
jest.mock('openai')
jest.mock('@/lib/embeddings')
jest.mock('@/lib/agents/commerce-provider')
jest.mock('@/lib/link-sanitizer')
jest.mock('@/lib/search-wrapper')
jest.mock('@/lib/chat-telemetry')
jest.mock('@/lib/monitoring/performance-tracker')

describe('Chat API - Malformed Tool Arguments', () => {
  let mockOpenAIInstance: any
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup Supabase mocks
    mockSupabaseClient = {
      from: jest.fn((table: string) => {
        const mockChain = {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: table === 'conversations' ? { id: 'test-conv-id' } : null,
            error: null
          }),
        }
        return mockChain
      }),
    }

    const supabaseModule = jest.requireMock('@/lib/supabase-server')
    supabaseModule.createServiceRoleClient = jest.fn().mockResolvedValue(mockSupabaseClient)
    supabaseModule.validateSupabaseEnv = jest.fn().mockReturnValue(true)

    // Setup rate limit mock
    const rateLimitModule = jest.requireMock('@/lib/rate-limit')
    rateLimitModule.checkDomainRateLimit = jest.fn().mockReturnValue({
      allowed: true,
      remaining: 99,
      resetTime: Date.now() + 3600000,
    })

    // Setup OpenAI mock - returns tool call with missing required argument
    mockOpenAIInstance = {
      chat: {
        completions: {
          create: jest.fn()
            // First call: AI tries to use tool with missing required argument
            .mockResolvedValueOnce({
              choices: [{
                message: {
                  role: 'assistant',
                  content: null,
                  tool_calls: [{
                    id: 'call_123',
                    type: 'function',
                    function: {
                      name: 'search_products',
                      arguments: '{"limit": 5}', // Missing required "query" field
                    },
                  }],
                },
              }],
            })
            // Second call: AI responds with helpful message after seeing error
            .mockResolvedValueOnce({
              choices: [{
                message: {
                  content: 'I need a product name to search for you.',
                },
              }],
            }),
        },
      },
    }

    const OpenAI = jest.requireMock('openai')
    OpenAI.default = jest.fn(() => mockOpenAIInstance)

    // Setup other mocks
    const embeddingsModule = jest.requireMock('@/lib/embeddings')
    embeddingsModule.searchSimilarContent = jest.fn().mockResolvedValue([])

    const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')
    commerceModule.getCommerceProvider = jest.fn().mockResolvedValue(null)

    const linkSanitizerModule = jest.requireMock('@/lib/link-sanitizer')
    linkSanitizerModule.sanitizeOutboundLinks = jest.fn((msg: string) => msg)

    const searchWrapperModule = jest.requireMock('@/lib/search-wrapper')
    searchWrapperModule.extractQueryKeywords = jest.fn((q: string) => [q])
    searchWrapperModule.isPriceQuery = jest.fn(() => false)
    searchWrapperModule.extractPriceRange = jest.fn(() => null)

    const telemetryModule = jest.requireMock('@/lib/chat-telemetry')
    telemetryModule.telemetryManager = {
      createSession: jest.fn(() => ({
        log: jest.fn(),
        trackIteration: jest.fn(),
        trackSearch: jest.fn(),
        complete: jest.fn().mockResolvedValue(undefined),
      })),
    }

    const performanceModule = jest.requireMock('@/lib/monitoring/performance-tracker')
    performanceModule.trackAsync = jest.fn((fn: any) => fn())
  })

  it('should gracefully handle missing required tool arguments', async () => {
    const requestBody = {
      message: 'Show me spare parts',
      session_id: 'test-session-123',
      domain: 'example.com',
    }

    const request = new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    const response = await POST(request)
    const data = await response.json()

    // Should return 200 with a helpful message
    expect(response.status).toBe(200)
    expect(data.message).toBeTruthy()
    expect(data.message).toContain('product name')

    // OpenAI should have been called twice (initial + follow-up)
    expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledTimes(2)

    // Search functions should NOT have been called (validation prevented execution)
    const commerceModule = jest.requireMock('@/lib/agents/commerce-provider')
    const embeddingsModule = jest.requireMock('@/lib/embeddings')

    expect(commerceModule.getCommerceProvider).not.toHaveBeenCalled()
    expect(embeddingsModule.searchSimilarContent).not.toHaveBeenCalled()
  })
})
