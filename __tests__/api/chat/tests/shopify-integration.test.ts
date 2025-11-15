import { describe, it, expect, beforeEach } from '@jest/globals'
import { POST } from '@/app/api/chat/route'
import OpenAI from 'openai'
import { mockCommerceProvider } from '@/test-utils/api-test-helpers'
import { resetTestEnvironment, configureDefaultOpenAIResponse } from '@/__tests__/setup/isolated-test-setup'
import { setupBeforeEach, createRequest } from './shared-commerce-setup'

describe('Shopify Integration', () => {
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

  it('should include Shopify products when provider is configured', async () => {
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
})
