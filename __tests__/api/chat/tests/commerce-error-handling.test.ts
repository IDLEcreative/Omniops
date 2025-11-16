import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { POST } from '@/app/api/chat/route'
import OpenAI from 'openai'
import { mockCommerceProvider } from '@/test-utils/api-test-helpers'
import { resetTestEnvironment, configureDefaultOpenAIResponse } from '@/__tests__/setup/isolated-test-setup'
import { setupBeforeEach, createRequest } from './shared-commerce-setup'

describe('Commerce Error Handling', () => {
  let mockOpenAIInstance: jest.Mocked<OpenAI>
  let commerceModule: any

  beforeEach(() => {
    resetTestEnvironment()
    const setup = setupBeforeEach()
    mockOpenAIInstance = setup.mockOpenAIInstance
    commerceModule = setup.commerceModule
    mockOpenAIInstance.chat.completions.create.mockClear()
    configureDefaultOpenAIResponse(mockOpenAIInstance)
  })

  it('should handle commerce provider errors gracefully and fallback to semantic search', async () => {
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
        // First call: AI uses search_website_content tool (which uses commerce provider + semantic fallback)
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
                  arguments: '{"query": "products", "limit": 100}',
                },
              }],
            },
          }]
        } as any
      } else {
        // Second call: AI responds with final answer
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
    // Verify provider.searchProducts was called and failed
    expect(provider.searchProducts).toHaveBeenCalled()
    // Verify fallback to semantic search was triggered
    expect(mockSearchSimilarContent).toHaveBeenCalled()
  })
})
