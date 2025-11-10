// Debug test to isolate the 500 error issue
import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

// Mock everything first
jest.mock('@/lib/rate-limit')
jest.mock('openai')
jest.mock('@/lib/embeddings')
jest.mock('@/lib/agents/commerce-provider')
jest.mock('@/lib/link-sanitizer')
jest.mock('@/lib/search-wrapper')
jest.mock('@/lib/chat-telemetry')
jest.mock('@/lib/monitoring/performance-tracker')
jest.mock('@/lib/redis-fallback')

async function testBasicRequest() {
  // Setup mocks
  const mockModule = await import('@/lib/supabase-server')
  const rateLimitModule = await import('@/lib/rate-limit')
  const OpenAI = (await import('openai')).default

  // Mock Supabase
  const mockClient = {
    from: jest.fn((table: string) => {
      if (table === 'conversations') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'new-conv-id' },
                error: null
              })
            }))
          })),
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn().mockResolvedValue({
                data: { id: 'new-conv-id' },
                error: null
              })
            }))
          }))
        }
      }
      if (table === 'messages') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn().mockResolvedValue({ data: [], error: null })
              }))
            }))
          })),
          insert: jest.fn().mockResolvedValue({ data: {}, error: null })
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      }
    }),
    rpc: jest.fn().mockResolvedValue({ data: [], error: null })
  }

  ;(mockModule.createServiceRoleClient as jest.Mock).mockResolvedValue(mockClient)
  ;(mockModule.validateSupabaseEnv as jest.Mock).mockReturnValue(true)

  // Mock rate limit
  ;(rateLimitModule.checkDomainRateLimit as jest.Mock).mockReturnValue({
    allowed: true,
    remaining: 99,
    resetTime: Date.now() + 3600000
  })

  // Mock OpenAI
  const mockOpenAI = {
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.1) }]
      })
    },
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Test response',
              role: 'assistant'
            }
          }]
        })
      }
    }
  }

  ;(OpenAI as any).mockImplementation(() => mockOpenAI)

  // Create request
  const request = new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Hello',
      session_id: 'test-123',
      config: {
        features: {
          websiteScraping: { enabled: false },
          woocommerce: { enabled: false }
        }
      }
    })
  })

  try {
    const response = await POST(request)
    const data = await response.json()

    console.log('✅ Response Status:', response.status)
    console.log('📦 Response Data:', JSON.stringify(data, null, 2))

    if (response.status !== 200) {
      console.error('❌ ERROR DETAILS:', data)
    }
  } catch (error) {
    console.error('❌ EXCEPTION:', error)
  }
}

testBasicRequest()
