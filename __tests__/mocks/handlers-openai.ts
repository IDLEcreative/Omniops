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
  http.post('https://api.openai.com/v1/chat/completions', async ({ request }) => {
    const body = await request.json() as any;

    // Detect if this is an AI quote analysis request (uses json_object response format)
    const isJsonRequest = body.response_format?.type === 'json_object';

    let content: string;
    if (isJsonRequest) {
      // Return proper JSON structure for AI quote analyzer
      content = JSON.stringify({
        tier: 'sme',
        confidence: 85,
        estimatedCompletions: 2250,
        reasoning: [
          'Mock traffic analysis indicates medium-sized business',
          'Estimated conversation volume fits SME tier',
          'Company profile suggests established business',
          'Domain maturity indicates stable customer base'
        ],
        signals: {
          trafficSignal: 'medium',
          employeeSignal: 'medium',
          revenueSignal: 'medium',
          contentSignal: 'extensive',
          domainAgeSignal: 'established'
        }
      });
    } else {
      // Default chat response for regular chat completions
      content = 'This is a test response from the AI assistant.';
    }

    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: body.model || 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: content,
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
