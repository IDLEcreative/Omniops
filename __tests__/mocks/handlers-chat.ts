/**
 * MSW Mock Handlers - Chat API
 *
 * Mock handlers for /api/chat endpoint used in chat page tests.
 */

import { http, HttpResponse } from 'msw'

export const chatHandlers = [
  // Default chat API response
  http.post('/api/chat', () => {
    return HttpResponse.json({
      message: 'This is a helpful response from the AI assistant.',
      conversation_id: 'mock-conv-123',
    })
  }),
]
