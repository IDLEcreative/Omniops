import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { checkDomainRateLimit } from '@/lib/rate-limit'
import OpenAI from 'openai'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
  createServiceRoleClient: jest.fn(),
}))
jest.mock('@/lib/rate-limit', () => ({
  checkDomainRateLimit: jest.fn(),
}))
jest.mock('openai')
jest.mock('@/lib/woocommerce', () => ({
  searchProducts: jest.fn().mockResolvedValue([]),
}))
jest.mock('@/lib/woocommerce-dynamic', () => ({
  searchProductsDynamic: jest.fn().mockResolvedValue([]),
}))

// Set environment variable
process.env.OPENAI_API_KEY = 'test-openai-key'

// Mock OpenAI responses
const mockEmbeddingResponse = {
  data: [{ embedding: Array(1536).fill(0.1) }],
}

const mockChatResponse = {
  choices: [
    {
      message: {
        content: 'This is a helpful response from the AI assistant.',
      },
    },
  ],
}

describe('/api/chat', () => {
  let mockSupabaseClient: any
  let mockAdminSupabaseClient: any
  let mockOpenAIInstance: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Supabase clients
    mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    }

    mockAdminSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
    }

    ;(createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
    ;(createServiceRoleClient as jest.Mock).mockReturnValue(mockAdminSupabaseClient)

    // Mock OpenAI
    mockOpenAIInstance = {
      embeddings: {
        create: jest.fn().mockResolvedValue(mockEmbeddingResponse),
      },
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(mockChatResponse),
        },
      },
    }
    
    // Mock the OpenAI constructor
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
    MockedOpenAI.mockClear()
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance)

    // Mock rate limiting (allow by default)
    ;(checkDomainRateLimit as jest.Mock).mockReturnValue({
      allowed: true,
      remaining: 99,
      resetTime: Date.now() + 3600000,
    })
  })

  describe('POST', () => {
    const createRequest = (body: any) => {
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

      // Mock conversation creation
      mockAdminSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'new-conversation-id' },
              error: null,
            }),
          }
        }
        if (table === 'messages') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }
      })
      
      // Mock RPC call for embeddings search
      mockAdminSupabaseClient.rpc.mockResolvedValue({ data: [], error: null })

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('message')
      expect(data).toHaveProperty('conversation_id')
      expect(data.message).toBe('This is a helpful response from the AI assistant.')
      expect(data.conversation_id).toBe('new-conversation-id')

      // Verify OpenAI was called
      expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalled()
      expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalled()
    })

    it('should handle existing conversation', async () => {
      const requestBody = {
        message: 'Follow up question',
        session_id: 'test-session-123',
        conversation_id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        config: {
          features: {
            websiteScraping: { enabled: false },
            woocommerce: { enabled: false },
          },
        },
      }

      // Mock conversation history
      mockAdminSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'messages') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [
                { role: 'user', content: 'Previous question' },
                { role: 'assistant', content: 'Previous answer' },
              ],
              error: null,
            }),
          }
        }
        return mockAdminSupabaseClient.from(table)
      })

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
      mockAdminSupabaseClient.rpc.mockResolvedValue({
        data: [
          {
            chunk_text: 'Our business hours are Monday-Friday 9AM-5PM',
            page_id: 'page-1',
            similarity: 0.85,
          },
        ],
        error: null,
      })

      // Mock page data
      mockAdminSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'scraped_pages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { url: 'https://example.com/hours', title: 'Business Hours' },
              error: null,
            }),
          }
        }
        if (table === 'conversations') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'new-conversation-id' },
              error: null,
            }),
          }
        }
        if (table === 'messages') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return mockAdminSupabaseClient.from(table)
      })

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sources).toBeDefined()
      expect(data.sources).toHaveLength(1)
      expect(data.sources[0]).toEqual({
        url: 'https://example.com/hours',
        title: 'Business Hours',
        relevance: 0.85,
      })
    })

    it('should handle rate limiting', async () => {
      // Mock rate limit exceeded
      ;(checkDomainRateLimit as jest.Mock).mockReturnValue({
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
        // Missing required fields
        message: '',
      }

      const response = await POST(createRequest(invalidRequestBody))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
    })

    it('should handle long messages', async () => {
      const requestBody = {
        message: 'a'.repeat(1001), // Exceeds max length
        session_id: 'test-session-123',
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should include WooCommerce products when enabled', async () => {
      const { searchProducts } = await import('@/lib/woocommerce')
      const mockSearchProducts = searchProducts as jest.Mock

      mockSearchProducts.mockResolvedValue([
        {
          id: 1,
          name: 'Test Product',
          price: '19.99',
          stock_status: 'instock',
        },
      ])

      const requestBody = {
        message: 'I want to buy a product',
        session_id: 'test-session-123',
        config: {
          features: {
            woocommerce: { enabled: true },
          },
        },
      }

      // Mock conversation creation
      mockAdminSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'new-conversation-id' },
              error: null,
            }),
          }
        }
        if (table === 'messages') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return mockAdminSupabaseClient.from(table)
      })

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(mockSearchProducts).toHaveBeenCalledWith('I want to buy a product', 3)
    })

    it('should handle WooCommerce errors gracefully', async () => {
      const { searchProducts } = await import('@/lib/woocommerce')
      const mockSearchProducts = searchProducts as jest.Mock

      mockSearchProducts.mockRejectedValue(new Error('WooCommerce API error'))

      const requestBody = {
        message: 'Show me products',
        session_id: 'test-session-123',
        config: {
          features: {
            woocommerce: { enabled: true },
          },
        },
      }

      // Mock conversation creation
      mockAdminSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'new-conversation-id' },
              error: null,
            }),
          }
        }
        if (table === 'messages') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return mockAdminSupabaseClient.from(table)
      })

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      // Should still succeed, just without WooCommerce data
      expect(response.status).toBe(200)
      expect(data.message).toBeDefined()
    })

    it('should handle database errors', async () => {
      mockAdminSupabaseClient.from.mockImplementation(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed'),
        }),
      }))

      const requestBody = {
        message: 'Hello',
        session_id: 'test-session-123',
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle OpenAI API errors', async () => {
      mockOpenAIInstance.chat.completions.create.mockRejectedValue(
        new Error('OpenAI API error')
      )

      // Mock successful conversation creation
      mockAdminSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'new-conversation-id' },
              error: null,
            }),
          }
        }
        if (table === 'messages') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: [], error: null }),
          }
        }
        return mockAdminSupabaseClient.from(table)
      })

      const requestBody = {
        message: 'Hello',
        session_id: 'test-session-123',
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})