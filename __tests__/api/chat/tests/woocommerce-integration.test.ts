import { describe, it, expect, beforeEach } from '@jest/globals'
import { POST } from '@/app/api/chat/route'
import OpenAI from 'openai'
import { mockCommerceProvider, createMockProduct } from '@/test-utils/api-test-helpers'
import { resetTestEnvironment, configureDefaultOpenAIResponse } from '@/__tests__/setup/isolated-test-setup'
import { setupBeforeEach, createRequest } from './shared-commerce-setup'

describe('WooCommerce Integration', () => {
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

  it('should include WooCommerce products when provider is configured', async () => {
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
                  name: 'search_website_content',
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
})
