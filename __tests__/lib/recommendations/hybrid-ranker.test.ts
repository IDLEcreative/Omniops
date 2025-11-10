/**
 * Hybrid Ranker Algorithm Unit Tests
 *
 * Tests the combination of multiple recommendation algorithms
 * with weighted scoring and diversity filtering.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Import the modules (mocked in jest.setup.js)
import { vectorSimilarityRecommendations } from '@/lib/recommendations/vector-similarity';
import { collaborativeFilterRecommendations } from '@/lib/recommendations/collaborative-filter';
import { contentBasedRecommendations } from '@/lib/recommendations/content-filter';
import { hybridRanker } from '@/lib/recommendations/hybrid-ranker';

// Use jest.mocked to get typed mock functions
const mockVector = jest.mocked(vectorSimilarityRecommendations);
const mockCollab = jest.mocked(collaborativeFilterRecommendations);
const mockContent = jest.mocked(contentBasedRecommendations);

describe('Hybrid Ranker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parallel algorithm execution', () => {
    it('should run all algorithms in parallel', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 0.9, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([
        { productId: 'prod-2', score: 0.85, algorithm: 'collaborative' },
      ]);
      mockContent.mockResolvedValue([
        { productId: 'prod-3', score: 0.8, algorithm: 'content_based' },
      ]);

      await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(mockVector).toHaveBeenCalled();
      expect(mockCollab).toHaveBeenCalled();
      expect(mockContent).toHaveBeenCalled();
    });

    it('should request 2x limit from each algorithm for better mixing', async () => {
      mockVector.mockResolvedValue([]);
      mockCollab.mockResolvedValue([]);
      mockContent.mockResolvedValue([]);

      await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(mockVector).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 })
      );
      expect(mockCollab).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 })
      );
      expect(mockContent).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10 })
      );
    });

    it('should pass through all request parameters', async () => {
      mockVector.mockResolvedValue([]);
      mockCollab.mockResolvedValue([]);
      mockContent.mockResolvedValue([]);

      const context = { detectedIntent: 'test' };

      await hybridRanker({
        domainId: 'domain-123',
        sessionId: 'session-123',
        userId: 'user-456',
        productIds: ['prod-1'],
        categories: ['cat-1'],
        tags: ['tag-1'],
        excludeProductIds: ['prod-2'],
        context,
        limit: 5,
      });

      expect(mockVector).toHaveBeenCalledWith(
        expect.objectContaining({
          domainId: 'domain-123',
          productIds: ['prod-1'],
          context,
          excludeProductIds: ['prod-2'],
        })
      );

      expect(mockCollab).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'session-123',
          userId: 'user-456',
          context,
        })
      );

      expect(mockContent).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: ['cat-1'],
          tags: ['tag-1'],
        })
      );
    });
  });

  describe('score combination', () => {
    it('should apply default weights (50% vector, 30% collaborative, 20% content)', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 1.0, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([
        { productId: 'prod-1', score: 1.0, algorithm: 'collaborative' },
      ]);
      mockContent.mockResolvedValue([
        { productId: 'prod-1', score: 1.0, algorithm: 'content_based' },
      ]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      // Combined score: 1.0*0.5 + 1.0*0.3 + 1.0*0.2 = 1.0
      // Plus algorithm bonus: 1.0 + 0.1 = 1.1, capped at 1.0
      expect(result[0].score).toBe(1.0);
    });

    it('should combine scores from multiple algorithms', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 0.8, algorithm: 'vector_similarity' },
        { productId: 'prod-2', score: 0.6, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([
        { productId: 'prod-1', score: 0.9, algorithm: 'collaborative' },
      ]);
      mockContent.mockResolvedValue([
        { productId: 'prod-2', score: 0.7, algorithm: 'content_based' },
      ]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      // prod-1: (0.8*0.5 + 0.9*0.3) = 0.67 + 0.1 bonus = 0.77
      // prod-2: (0.6*0.5 + 0.7*0.2) = 0.44 + 0.1 bonus = 0.54
      expect(result[0].productId).toBe('prod-1');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('should boost score when multiple algorithms agree', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 0.5, algorithm: 'vector_similarity' },
        { productId: 'prod-2', score: 0.9, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([
        { productId: 'prod-1', score: 0.5, algorithm: 'collaborative' },
      ]);
      mockContent.mockResolvedValue([
        { productId: 'prod-1', score: 0.5, algorithm: 'content_based' },
      ]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      // prod-1: all 3 algorithms agree, gets +0.1 bonus
      // prod-2: only 1 algorithm, no bonus
      expect(result[0].productId).toBe('prod-1');
      expect(result[0].metadata?.algorithmCount).toBe(3);
    });

    it('should cap final score at 1.0', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 1.0, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([
        { productId: 'prod-1', score: 1.0, algorithm: 'collaborative' },
      ]);
      mockContent.mockResolvedValue([
        { productId: 'prod-1', score: 1.0, algorithm: 'content_based' },
      ]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      // Even with bonus, score should not exceed 1.0
      expect(result[0].score).toBeLessThanOrEqual(1.0);
    });

    it('should include score breakdown in metadata', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 0.9, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([
        { productId: 'prod-1', score: 0.8, algorithm: 'collaborative' },
      ]);
      mockContent.mockResolvedValue([]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result[0].metadata).toMatchObject({
        algorithms: expect.arrayContaining(['vector', 'collaborative']),
        scores: {
          vector: 0.9,
          collaborative: 0.8,
        },
      });
    });
  });

  describe('diversity filtering', () => {
    it('should not apply diversity for <=5 recommendations', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 0.9, algorithm: 'vector_similarity' },
        { productId: 'prod-2', score: 0.8, algorithm: 'vector_similarity' },
        { productId: 'prod-3', score: 0.7, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([]);
      mockContent.mockResolvedValue([]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      // All results should be included as-is
      expect(result).toHaveLength(3);
    });

    it('should ensure algorithm diversity for >5 recommendations', async () => {
      mockVector.mockResolvedValue(
        Array.from({ length: 4 }, (_, i) => ({
          productId: `vec-${i}`,
          score: 0.9 - i * 0.05,
          algorithm: 'vector_similarity',
        }))
      );
      mockCollab.mockResolvedValue(
        Array.from({ length: 2 }, (_, i) => ({
          productId: `collab-${i}`,
          score: 0.85 - i * 0.05,
          algorithm: 'collaborative',
        }))
      );
      mockContent.mockResolvedValue([
        { productId: 'content-1', score: 0.75, algorithm: 'content_based' },
      ]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 10,
      });

      // First 3 are always top scores
      // After that, should prefer algorithm diversity
      const algorithms = result.map((r) => r.metadata?.algorithms?.[0]);
      const uniqueAlgorithms = new Set(algorithms);
      expect(uniqueAlgorithms.size).toBeGreaterThan(1);
    });

    it('should always include top 3 regardless of diversity', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 0.95, algorithm: 'vector_similarity' },
        { productId: 'prod-2', score: 0.92, algorithm: 'vector_similarity' },
        { productId: 'prod-3', score: 0.90, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([
        { productId: 'prod-4', score: 0.85, algorithm: 'collaborative' },
      ]);
      mockContent.mockResolvedValue([]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 10,
      });

      // Top 3 should all be vector results
      expect(result.slice(0, 3).every((r) =>
        r.metadata?.algorithms?.includes('vector')
      )).toBe(true);
    });
  });

  describe('reason building', () => {
    it('should build reason for 3 algorithms agreeing', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 0.9, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([
        { productId: 'prod-1', score: 0.85, algorithm: 'collaborative' },
      ]);
      mockContent.mockResolvedValue([
        { productId: 'prod-1', score: 0.8, algorithm: 'content_based' },
      ]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result[0].reason).toBe('Highly recommended based on multiple factors');
    });

    it('should build reason for 2 algorithms agreeing', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 0.9, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([
        { productId: 'prod-1', score: 0.85, algorithm: 'collaborative' },
      ]);
      mockContent.mockResolvedValue([]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result[0].reason).toContain('vector and collaborative analysis');
    });

    it('should build reason for single algorithm', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 0.9, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([]);
      mockContent.mockResolvedValue([]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result[0].reason).toContain('Semantically similar');
    });
  });

  describe('error handling', () => {
    it('should handle algorithm failures gracefully', async () => {
      mockVector.mockRejectedValue(new Error('Vector failed'));
      mockCollab.mockResolvedValue([
        { productId: 'prod-1', score: 0.85, algorithm: 'collaborative' },
      ]);
      mockContent.mockResolvedValue([]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      // Should return empty array on error
      expect(result).toEqual([]);
    });

    it('should handle all algorithms returning empty', async () => {
      mockVector.mockResolvedValue([]);
      mockCollab.mockResolvedValue([]);
      mockContent.mockResolvedValue([]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result).toEqual([]);
    });
  });

  describe('sorting and limiting', () => {
    it('should sort results by combined score descending', async () => {
      mockVector.mockResolvedValue([
        { productId: 'prod-1', score: 0.7, algorithm: 'vector_similarity' },
        { productId: 'prod-2', score: 0.9, algorithm: 'vector_similarity' },
        { productId: 'prod-3', score: 0.5, algorithm: 'vector_similarity' },
      ]);
      mockCollab.mockResolvedValue([]);
      mockContent.mockResolvedValue([]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 5,
      });

      // Verify descending order
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      }
    });

    it('should respect limit parameter', async () => {
      mockVector.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({
          productId: `prod-${i}`,
          score: 0.9 - i * 0.01,
          algorithm: 'vector_similarity',
        }))
      );
      mockCollab.mockResolvedValue([]);
      mockContent.mockResolvedValue([]);

      const result = await hybridRanker({
        domainId: 'domain-123',
        limit: 3,
      });

      expect(result).toHaveLength(3);
    });
  });
});
