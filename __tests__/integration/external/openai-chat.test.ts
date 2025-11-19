/**
 * OpenAI API Integration Tests
 *
 * Comprehensive tests for OpenAI API integration covering:
 * - Chat completions (GPT-4)
 * - Streaming responses
 * - Embeddings generation
 * - Error handling (rate limits, API failures)
 * - Retry logic
 * - Timeout handling
 * - Token counting
 * - Cost tracking
 * - Function calling
 * - Context window management
 * - Response validation
 * - Fallback models
 *
 * Uses MSW for HTTP-level mocking to test actual API integration code.
 */

import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'

// Unmock OpenAI for these tests (it's mocked globally in jest.setup.integration.js)
jest.unmock('openai')
import OpenAI from 'openai'

describe('OpenAI API Integration', () => {
  // Setup MSW
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  describe('Chat Completions', () => {
    test('should successfully create chat completion', async () => {
      const openai = new OpenAI({
        apiKey: 'test-key',
        baseURL: 'https://api.openai.com/v1',
        dangerouslyAllowBrowser: true  // Safe for tests with MSW
      })

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello, world!' }]
      })

      expect(response).toBeDefined()
      expect(response.choices[0]?.message.content).toBeDefined()
      expect(response.model).toBe('gpt-4')
      expect(response.usage).toBeDefined()
      expect(response.usage?.total_tokens).toBeGreaterThan(0)
    })

    test('should handle streaming responses', async () => {
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          const encoder = new TextEncoder()
          const stream = new ReadableStream({
            start(controller) {
              // Simulate streaming chunks
              const chunks = [
                'data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n',
                'data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
                'data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}\n\n',
                'data: {"id":"chatcmpl-test","object":"chat.completion.chunk","created":1234567890,"model":"gpt-4","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n',
                'data: [DONE]\n\n'
              ]

              chunks.forEach(chunk => controller.enqueue(encoder.encode(chunk)))
              controller.close()
            }
          })

          return new HttpResponse(stream, {
            headers: { 'Content-Type': 'text/event-stream' }
          })
        })
      )

      const openai = new OpenAI({
        apiKey: 'test-key',
        baseURL: 'https://api.openai.com/v1'
      })

      const stream = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        stream: true
      })

      const chunks: string[] = []
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          chunks.push(content)
        }
      }

      expect(chunks.join('')).toBe('Hello world')
    })

    test('should handle function calling', async () => {
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json({
            id: 'chatcmpl-test',
            object: 'chat.completion',
            created: Date.now(),
            model: 'gpt-4',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: null,
                  function_call: {
                    name: 'get_weather',
                    arguments: '{"location":"San Francisco","unit":"celsius"}'
                  }
                },
                finish_reason: 'function_call'
              }
            ],
            usage: { prompt_tokens: 100, completion_tokens: 20, total_tokens: 120 }
          })
        })
      )

      const openai = new OpenAI({ apiKey: 'test-key', dangerouslyAllowBrowser: true })

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'What is the weather in SF?' }],
        functions: [
          {
            name: 'get_weather',
            description: 'Get the current weather',
            parameters: {
              type: 'object',
              properties: {
                location: { type: 'string' },
                unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
              },
              required: ['location']
            }
          }
        ]
      })

      expect(response.choices[0]?.finish_reason).toBe('function_call')
      expect(response.choices[0]?.message.function_call).toBeDefined()
      expect(response.choices[0]?.message.function_call?.name).toBe('get_weather')
    })

    test('should track token usage correctly', async () => {
      const openai = new OpenAI({ apiKey: 'test-key', dangerouslyAllowBrowser: true })

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test message' }]
      })

      expect(response.usage).toBeDefined()
      expect(response.usage?.prompt_tokens).toBeDefined()
      expect(response.usage?.completion_tokens).toBeDefined()
      expect(response.usage?.total_tokens).toBe(
        (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0)
      )
    })
  })

  describe('Error Handling', () => {
    test('should handle rate limit errors (429)', async () => {
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Rate limit exceeded. Please retry after 20 seconds.',
                type: 'rate_limit_error',
                param: null,
                code: 'rate_limit_exceeded'
              }
            },
            {
              status: 429,
              headers: {
                'Retry-After': '20',
                'X-RateLimit-Limit-Requests': '3500',
                'X-RateLimit-Remaining-Requests': '0',
                'X-RateLimit-Reset-Requests': '20s'
              }
            }
          )
        })
      )

      const openai = new OpenAI({ apiKey: 'test-key', dangerouslyAllowBrowser: true })

      await expect(
        openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Test' }]
        })
      ).rejects.toThrow()
    })

    test('should handle invalid API key (401)', async () => {
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Incorrect API key provided',
                type: 'invalid_request_error',
                param: null,
                code: 'invalid_api_key'
              }
            },
            { status: 401 }
          )
        })
      )

      const openai = new OpenAI({ apiKey: 'invalid-key', dangerouslyAllowBrowser: true })

      await expect(
        openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Test' }]
        })
      ).rejects.toThrow()
    })

    test('should handle server errors (500)', async () => {
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json(
            {
              error: {
                message: 'The server had an error while processing your request',
                type: 'server_error',
                param: null,
                code: 'server_error'
              }
            },
            { status: 500 }
          )
        })
      )

      const openai = new OpenAI({ apiKey: 'test-key', dangerouslyAllowBrowser: true })

      await expect(
        openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Test' }]
        })
      ).rejects.toThrow()
    })

    test('should handle context length exceeded', async () => {
      server.use(
        http.post('https://api.openai.com/v1/chat/completions', () => {
          return HttpResponse.json(
            {
              error: {
                message: "This model's maximum context length is 8192 tokens. Your messages resulted in 9000 tokens.",
                type: 'invalid_request_error',
                param: 'messages',
                code: 'context_length_exceeded'
              }
            },
            { status: 400 }
          )
        })
      )

      const openai = new OpenAI({ apiKey: 'test-key', dangerouslyAllowBrowser: true })

      await expect(
        openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'x'.repeat(10000) }]
        })
      ).rejects.toThrow()
    })
  })

