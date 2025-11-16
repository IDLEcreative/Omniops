/**
 * Manual mock for @/lib/embeddings/query-embedding
 * Used in WooCommerceProvider tests to prevent actual OpenAI API calls
 */

console.log('[MOCK] Loading query-embedding mock');

// Export a proper jest mock function
export const generateQueryEmbedding = jest.fn().mockResolvedValue([]);
