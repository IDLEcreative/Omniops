/**
 * Mock utilities for enhanced context testing
 */

export const createMockChunk = (overrides: Record<string, unknown> = {}) => ({
  content: 'Mock content for testing enhanced context window',
  url: `https://example.com/product/${overrides.id || 1}`,
  title: `Mock Product ${overrides.id || 1}`,
  similarity: overrides.similarity || 0.85,
  page_id: `page-${overrides.id || 1}`,
  chunk_index: overrides.chunk_index || 0,
  metadata: { source: 'test' },
  ...overrides
});

export const createMockChunks = (count: number, baseSimil: number = 0.8) => {
  return Array.from({ length: count }, (_, i) =>
    createMockChunk({
      id: i + 1,
      similarity: baseSimil - (i * 0.02), // Decreasing similarity
      chunk_index: i
    })
  );
};

export const calculateTokens = (chunks: ReturnType<typeof createMockChunk>[]) =>
  chunks.reduce((sum, chunk) => sum + Math.ceil(chunk.content.length / 4), 0);
