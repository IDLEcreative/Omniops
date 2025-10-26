import { http, HttpResponse } from 'msw'

/**
 * OpenAI API Mock Handlers
 *
 * Handles:
 * - Chat completions (GPT-4)
 * - Embeddings generation (text-embedding-ada-002)
 */

export const openaiHandlers = [
  // OpenAI Chat Completions API
  http.post('https://api.openai.com/v1/chat/completions', () => {
    // Can vary response based on request content for more realistic testing
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
            content: 'This is a test response from the AI assistant.',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150
      }
    })
  }),

  // OpenAI Embeddings API
  http.post('https://api.openai.com/v1/embeddings', async ({ request }) => {
    const body = await request.json() as { input: string | string[]; model?: string }
    const input = Array.isArray(body.input) ? body.input : [body.input]

    return HttpResponse.json({
      object: 'list',
      data: input.map((_, index) => ({
        object: 'embedding',
        index,
        embedding: Array(1536).fill(0.1), // Mock embedding vector
      })),
      model: body.model || 'text-embedding-ada-002',
      usage: {
        prompt_tokens: input.length * 10,
        total_tokens: input.length * 10
      }
    })
  })
]
