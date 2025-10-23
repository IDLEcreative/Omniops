// Manual mock for @/lib/embeddings
// Default returns empty array - tests can override with mockResolvedValue
export const searchSimilarContent = jest.fn().mockResolvedValue([]);
