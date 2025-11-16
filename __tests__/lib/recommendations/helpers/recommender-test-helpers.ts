/**
 * Test Helpers for Product Recommender Tests
 *
 * Shared mock generators and utilities for recommendation testing
 */

import type { CommerceProduct } from '@/lib/search/result-consolidator';
import type { EmbeddingProvider } from '@/lib/recommendations/product-recommender';

/**
 * Create a mock product with default values
 */
export const createMockProduct = (overrides: Partial<CommerceProduct> = {}): CommerceProduct => ({
  id: 1,
  name: 'Hydraulic Pump A4VTG90',
  price: '450.00',
  categories: [{ name: 'Hydraulic Pumps', slug: 'hydraulic-pumps' }],
  short_description: 'Industrial hydraulic pump',
  ...overrides,
});

/**
 * Create mock embedding provider that returns predefined embeddings based on product name.
 * This allows us to control similarity scores for testing.
 */
export const createMockEmbeddingProvider = (
  embeddingMap: Record<string, number[]>
): EmbeddingProvider => {
  return jest.fn().mockImplementation(async (productText: string) => {
    // Find matching embedding based on product name in text
    for (const [key, embedding] of Object.entries(embeddingMap)) {
      if (productText.includes(key)) {
        return embedding;
      }
    }
    // Default embedding if no match
    return [0, 0, 0];
  });
};

/**
 * Calculate actual cosine similarity for testing.
 * This duplicates the implementation but ensures our expected values match reality.
 */
export const calculateTestSimilarity = (vectorA: number[], vectorB: number[]): number => {
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
};
