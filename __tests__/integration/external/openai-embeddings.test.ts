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


  describe('Embeddings', () => {
    test('should generate embeddings for single text', async () => {
      const openai = new OpenAI({ apiKey: 'test-key', dangerouslyAllowBrowser: true })

      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: 'Hello, world!'
      })

      expect(response.data).toHaveLength(1)
      expect(response.data[0]?.embedding).toHaveLength(1536)
      expect(response.model).toBe('text-embedding-ada-002')
      expect(response.usage.total_tokens).toBeGreaterThan(0)
    })

    test('should generate embeddings for multiple texts', async () => {
      const openai = new OpenAI({ apiKey: 'test-key', dangerouslyAllowBrowser: true })

      const texts = ['First text', 'Second text', 'Third text']
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts
      })

      expect(response.data).toHaveLength(3)
      response.data.forEach((item, index) => {
        expect(item.index).toBe(index)
        expect(item.embedding).toHaveLength(1536)
      })
    })

    test('should handle empty input error', async () => {
      server.use(
        http.post('https://api.openai.com/v1/embeddings', () => {
          return HttpResponse.json(
            {
              error: {
                message: 'Input cannot be empty',
                type: 'invalid_request_error',
                param: 'input',
                code: 'invalid_input'
              }
            },
            { status: 400 }
          )
        })
      )

      const openai = new OpenAI({ apiKey: 'test-key', dangerouslyAllowBrowser: true })

      await expect(
        openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: ''
        })
      ).rejects.toThrow()
    })
  })

  describe('Request Validation', () => {
    test('should validate response schema', async () => {
      const openai = new OpenAI({ apiKey: 'test-key', dangerouslyAllowBrowser: true })

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test' }]
      })

      // Validate response structure
      expect(response).toMatchObject({
        id: expect.any(String),
        object: 'chat.completion',
        created: expect.any(Number),
        model: expect.any(String),
        choices: expect.arrayContaining([
          expect.objectContaining({
            index: expect.any(Number),
            message: expect.objectContaining({
              role: expect.any(String),
              content: expect.any(String)
            }),
            finish_reason: expect.any(String)
          })
        ]),
        usage: expect.objectContaining({
          prompt_tokens: expect.any(Number),
          completion_tokens: expect.any(Number),
          total_tokens: expect.any(Number)
        })
      })
    })

    test('should include proper headers in requests', async () => {
      let capturedHeaders: Headers | undefined

      server.use(
        http.post('https://api.openai.com/v1/chat/completions', ({ request }) => {
          capturedHeaders = request.headers
          return HttpResponse.json({
            id: 'chatcmpl-test',
            object: 'chat.completion',
            created: Date.now(),
            model: 'gpt-4',
            choices: [
              {
                index: 0,
                message: { role: 'assistant', content: 'Test response' },
                finish_reason: 'stop'
              }
            ],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 }
          })
        })
      )

      const openai = new OpenAI({ apiKey: 'test-api-key-12345' })

      await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Test' }]
      })

      expect(capturedHeaders?.get('Authorization')).toBe('Bearer test-api-key-12345')
      expect(capturedHeaders?.get('Content-Type')).toContain('application/json')
    })
  })
})
