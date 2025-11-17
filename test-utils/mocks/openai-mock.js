/**
 * OpenAI Mock Configuration
 *
 * Provides mock OpenAI client to avoid browser detection issues in tests.
 * Mocks chat completions and embeddings endpoints.
 */

module.exports = jest.fn().mockImplementation(() => ({
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Mocked response',
            role: 'assistant',
          },
          finish_reason: 'stop',
        }],
      }),
    },
  },
  embeddings: {
    create: jest.fn().mockResolvedValue({
      data: [{
        embedding: Array(1536).fill(0.1),
      }],
    }),
  },
}));
