/**
 * Mock OpenAI client
 */
export function mockOpenAIClient(options: { chatResponse?: string; embeddingVector?: number[] } = {}) {
  const {
    chatResponse = 'Mocked AI response',
    embeddingVector = Array(1536).fill(0.1),
  } = options;

  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: chatResponse,
                role: 'assistant',
              },
            },
          ],
        }),
      },
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: embeddingVector }],
      }),
    },
  };
}
