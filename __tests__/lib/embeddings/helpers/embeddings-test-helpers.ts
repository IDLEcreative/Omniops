/**
 * Test Helpers for Product Embeddings Tests
 *
 * Shared mock generators and test utilities for embeddings testing
 */

import { generateQueryEmbedding } from '@/lib/embeddings/query-embedding';

// Type for the mocked function
export const mockGenerateQueryEmbedding = generateQueryEmbedding as jest.MockedFunction<
  typeof generateQueryEmbedding
>;

/**
 * Create a mock embedding of specified length
 */
export function createMockEmbedding(length: number, value: number = 0.1): number[] {
  return new Array(length).fill(value);
}

/**
 * Calculate cosine similarity for test verification
 * This duplicates the implementation but ensures our expected values match reality.
 */
export function calculateTestCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  let dotProduct = 0;
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }

  let magnitudeA = 0;
  let magnitudeB = 0;
  for (let i = 0; i < vectorA.length; i++) {
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  const similarity = dotProduct / (magnitudeA * magnitudeB);
  return Math.max(0, Math.min(1, similarity));
}

/**
 * Setup mock to return specific embeddings for different products
 */
export function setupProductEmbeddingMocks(
  mockFn: jest.MockedFunction<typeof generateQueryEmbedding>,
  embeddingMap: Record<string, number[]>
): void {
  mockFn.mockImplementation(async (text: string) => {
    for (const [key, embedding] of Object.entries(embeddingMap)) {
      if (text.includes(key)) {
        return embedding;
      }
    }
    // Default embedding if no match
    return [0, 0, 0];
  });
}

/**
 * Creates a mock Supabase client for caching tests
 */
export const createMockSupabaseClient = () => {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn(),
    raw: jest.fn((sql: string) => sql),
  };
};

/**
 * Creates a mock product for embeddings caching testing
 */
export const createMockEmbeddingProduct = (options: {
  id: string;
  name: string;
  short_description?: string;
  description?: string;
}) => ({
  id: options.id,
  name: options.name,
  short_description: options.short_description || '',
  description: options.description,
});

/**
 * Calculates expected MD5 hash for product text
 */
export const calculateExpectedHash = (productText: string): string => {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(productText).digest('hex');
};

/**
 * Sets up mock for cache hit scenario
 */
export const setupCacheHitMock = (
  mockClient: any,
  embedding: number[],
  hash: string
) => {
  mockClient.single.mockResolvedValueOnce({
    data: {
      embedding,
      product_text_hash: hash,
    },
    error: null,
  });
  mockClient.update.mockResolvedValueOnce({ data: null, error: null });
};

/**
 * Sets up mock for cache miss scenario
 */
export const setupCacheMissMock = (mockClient: any) => {
  mockClient.single.mockResolvedValueOnce({
    data: null,
    error: { code: 'PGRST116' }, // Not found error
  });
  mockClient.upsert.mockResolvedValueOnce({ data: null, error: null });
};

/**
 * Sets up mock for hash mismatch scenario
 */
export const setupHashMismatchMock = (mockClient: any, oldHash: string, oldEmbedding: number[]) => {
  mockClient.single.mockResolvedValueOnce({
    data: {
      embedding: oldEmbedding,
      product_text_hash: oldHash,
    },
    error: null,
  });
  mockClient.upsert.mockResolvedValueOnce({ data: null, error: null });
};

/**
 * Sets up mock for database error scenario
 */
export const setupDatabaseErrorMock = (mockClient: any, errorMessage: string) => {
  mockClient.single.mockRejectedValueOnce(new Error(errorMessage));
  mockClient.upsert.mockResolvedValueOnce({ data: null, error: null });
};

/**
 * Verifies cache save operation was called correctly
 */
export const verifyCacheSave = (mockClient: any, expectedDomain?: string) => {
  expect(mockClient.upsert).toHaveBeenCalled();

  const upsertCall = mockClient.upsert.mock.calls[0][0];
  expect(upsertCall).toHaveProperty('product_text_hash');
  expect(upsertCall).toHaveProperty('embedding');

  if (expectedDomain) {
    expect(upsertCall.domain).toBe(expectedDomain);
  }
};

/**
 * Verifies access tracking update was called
 */
export const verifyAccessTracking = (mockClient: any) => {
  expect(mockClient.update).toHaveBeenCalled();
  expect(mockClient.update).toHaveBeenCalledWith({
    last_accessed_at: expect.any(String),
    access_count: 'access_count + 1',
  });
};
