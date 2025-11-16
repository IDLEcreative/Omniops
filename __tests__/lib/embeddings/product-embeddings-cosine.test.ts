/**
 * Product Embeddings - Cosine Similarity Tests
 * Validates cosine similarity calculation logic
 */

import { calculateCosineSimilarity } from '@/lib/embeddings/product-embeddings';

describe('Product Embeddings - Cosine Similarity', () => {
  describe('calculateCosineSimilarity', () => {
    describe('Happy Path Cases', () => {
      it('returns 1.0 for identical vectors', () => {
        const vectorA = [1, 2, 3, 4, 5];
        const vectorB = [1, 2, 3, 4, 5];

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        expect(similarity).toBe(1);
      });

      it('returns ~0.0 for orthogonal vectors', () => {
        // Orthogonal vectors have dot product of 0
        const vectorA = [1, 0, 0];
        const vectorB = [0, 1, 0];

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        expect(similarity).toBe(0);
      });

      it('returns value between 0 and 1 for similar vectors', () => {
        const vectorA = [1, 2, 3];
        const vectorB = [1, 2, 4]; // Similar but not identical

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        expect(similarity).toBeGreaterThan(0);
        expect(similarity).toBeLessThan(1);
        // These vectors should be quite similar (>0.9)
        expect(similarity).toBeGreaterThan(0.9);
      });

      it('handles normalized vectors correctly', () => {
        // Unit vectors
        const vectorA = [0.6, 0.8]; // Magnitude = 1
        const vectorB = [0.6, 0.8]; // Magnitude = 1

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        expect(similarity).toBe(1);
      });

      it('returns correct similarity for opposite direction vectors', () => {
        const vectorA = [1, 2, 3];
        const vectorB = [-1, -2, -3]; // Opposite direction

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        // Opposite vectors should have negative cosine similarity,
        // but our function clamps to [0, 1], so expect 0
        expect(similarity).toBe(0);
      });
    });

    describe('Edge Cases', () => {
      it('handles empty vectors', () => {
        const vectorA: number[] = [];
        const vectorB: number[] = [];

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        // Empty vectors have no magnitude, should return 0
        expect(similarity).toBe(0);
      });

      it('handles single-element vectors', () => {
        const vectorA = [5];
        const vectorB = [5];

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        expect(similarity).toBe(1);
      });

      it('handles vectors with negative values', () => {
        const vectorA = [-1, -2, -3];
        const vectorB = [-1, -2, -3];

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        expect(similarity).toBe(1);
      });

      it('handles vectors with all zeros', () => {
        const vectorA = [0, 0, 0];
        const vectorB = [0, 0, 0];

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        // Zero vectors have zero magnitude, should return 0
        expect(similarity).toBe(0);
      });

      it('handles one zero vector and one non-zero vector', () => {
        const vectorA = [0, 0, 0];
        const vectorB = [1, 2, 3];

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        expect(similarity).toBe(0);
      });

      it('handles very large numbers without overflow', () => {
        const vectorA = [1e10, 1e10, 1e10];
        const vectorB = [1e10, 1e10, 1e10];

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        // Use toBeCloseTo for floating point comparison
        expect(similarity).toBeCloseTo(1, 10);
      });

      it('handles very small numbers (near zero)', () => {
        const vectorA = [1e-10, 1e-10, 1e-10];
        const vectorB = [1e-10, 1e-10, 1e-10];

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        expect(similarity).toBe(1);
      });

      it('clamps result to [0, 1] range', () => {
        // Test with vectors that might produce values slightly outside [0,1] due to floating point
        const vectorA = [0.1, 0.2, 0.3];
        const vectorB = [0.1, 0.2, 0.3];

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        expect(similarity).toBeGreaterThanOrEqual(0);
        expect(similarity).toBeLessThanOrEqual(1);
      });
    });

    describe('Error Conditions', () => {
      it('throws error for vectors of different lengths', () => {
        const vectorA = [1, 2, 3];
        const vectorB = [1, 2, 3, 4]; // Different length

        expect(() => calculateCosineSimilarity(vectorA, vectorB)).toThrow(
          'Vectors must have the same length'
        );
      });

      it('throws error when first vector is longer', () => {
        const vectorA = [1, 2, 3, 4, 5];
        const vectorB = [1, 2, 3];

        expect(() => calculateCosineSimilarity(vectorA, vectorB)).toThrow(
          'Vectors must have the same length'
        );
      });

      it('throws error when second vector is longer', () => {
        const vectorA = [1, 2];
        const vectorB = [1, 2, 3, 4];

        expect(() => calculateCosineSimilarity(vectorA, vectorB)).toThrow(
          'Vectors must have the same length'
        );
      });
    });

    describe('Mathematical Correctness', () => {
      it('computes correct dot product', () => {
        // For vectors [1, 2, 3] and [4, 5, 6]:
        // Dot product = 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
        // Magnitude A = sqrt(1 + 4 + 9) = sqrt(14)
        // Magnitude B = sqrt(16 + 25 + 36) = sqrt(77)
        // Cosine similarity = 32 / (sqrt(14) * sqrt(77))
        const vectorA = [1, 2, 3];
        const vectorB = [4, 5, 6];

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        const expectedDotProduct = 32;
        const expectedMagnitudeA = Math.sqrt(14);
        const expectedMagnitudeB = Math.sqrt(77);
        const expectedSimilarity = expectedDotProduct / (expectedMagnitudeA * expectedMagnitudeB);

        expect(similarity).toBeCloseTo(expectedSimilarity, 10);
      });

      it('is commutative (order does not matter)', () => {
        const vectorA = [1, 2, 3, 4];
        const vectorB = [5, 6, 7, 8];

        const similarityAB = calculateCosineSimilarity(vectorA, vectorB);
        const similarityBA = calculateCosineSimilarity(vectorB, vectorA);

        expect(similarityAB).toBe(similarityBA);
      });

      it('produces consistent results for scaled vectors', () => {
        const vectorA = [1, 2, 3];
        const vectorB = [2, 4, 6]; // 2x scaled version of vectorA

        const similarity = calculateCosineSimilarity(vectorA, vectorB);

        // Cosine similarity is scale-invariant (direction matters, not magnitude)
        expect(similarity).toBe(1);
      });
    });
  });
});
