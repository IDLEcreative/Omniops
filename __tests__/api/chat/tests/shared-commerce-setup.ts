import { jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import {
  createFreshOpenAIMock,
  createFreshSupabaseMock,
  createFreshRateLimitMock,
} from '@/__tests__/setup/isolated-test-setup'

// Mock dependencies
jest.mock('@/lib/rate-limit')
jest.mock('openai')
jest.mock('@/lib/embeddings')
jest.mock('@/lib/supabase-server')
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

// Initialize OpenAI mock once
const mockOpenAIInstance = createFreshOpenAIMock()
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
MockedOpenAI.mockImplementation(() => mockOpenAIInstance)

export function setupBeforeEach() {
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

  return { mockOpenAIInstance, commerceModule, embeddingsModule }
}

export function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}
