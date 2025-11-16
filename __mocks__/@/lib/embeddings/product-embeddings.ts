/**
 * Manual mock for @/lib/embeddings/product-embeddings
 * Used in WooCommerceProvider tests to prevent actual OpenAI API calls
 */

// Export proper jest mock functions
export const scoreProductsBySimilarity = jest.fn().mockResolvedValue([]);
export const generateProductEmbedding = jest.fn().mockResolvedValue([]);
export const calculateCosineSimilarity = jest.fn().mockReturnValue(0);
