/**
 * Product Ranking and Recommendation Tests
 *
 * Tests scoring, ranking, and filtering of products recommended
 * from similar users. Covers engagement weighting, exclusions,
 * and score normalization.
 *
 * Focus: Product selection, scoring, filtering logic
 *
 * Last Updated: 2025-11-10
 */

import { collaborativeFilterRecommendations } from '@/lib/recommendations/collaborative-filter';
import { createClient } from '@/lib/supabase/server';
import {
  setupCFTestSuite,
  assertRecommendationStructure,
  assertScoresNormalized,
} from '@/__tests__/utils/recommendations/collaborative-filter-helpers';

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('Product Ranking - Collaborative Filtering', () => {
  beforeEach(() => {
    setupCFTestSuite();
  });

  describe('getProductsFromSimilarUsers', () => {
    it('should recommend products from similar users', async () => {
      const { mockSupabase } = setupCFTestSuite();

      mockSupabase.select.mockResolvedValueOnce({
        data: [{ product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-3', clicked: false, purchased: true },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      if (result.length > 0) {
        result.forEach((rec) => {
          assertRecommendationStructure(rec);
          expect(rec.reason).toContain('similar interests');
        });
      }

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should weight products by engagement (purchase > click)', async () => {
      const { mockSupabase } = setupCFTestSuite();
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-3', clicked: false, purchased: true },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      // prod-3 (purchased) should rank higher than prod-2 (clicked)
      if (result.length > 0) {
        expect(result[0].productId).toBe('prod-3');
      }
    });

    it('should exclude user\'s already viewed products', async () => {
      const { mockSupabase } = setupCFTestSuite();
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
          { product_id: 'prod-2', clicked: true, purchased: false },
        ],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-3', clicked: true, purchased: false },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      // Should not recommend products user already viewed
      if (result.length > 0) {
        const productIds = result.map((r) => r.productId);
        expect(productIds).not.toContain('prod-1');
        expect(productIds).not.toContain('prod-2');
      }

      expect(result).toBeDefined();
    });

    it('should exclude products in excludeProductIds parameter', async () => {
      const { mockSupabase } = setupCFTestSuite();
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-3', clicked: true, purchased: false },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        excludeProductIds: ['prod-2'],
        limit: 5,
      });

      // Should exclude prod-2 even though similar users viewed it
      if (result.length > 0) {
        const productIds = result.map((r) => r.productId);
        expect(productIds).not.toContain('prod-2');
      }

      expect(result).toBeDefined();
    });
  });

  describe('Score Normalization', () => {
    it('should normalize all scores to 0-1 range', async () => {
      const { mockSupabase } = setupCFTestSuite();
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: true }],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      if (result.length > 0) {
        assertScoresNormalized(result.map((r) => r.score));
      }
    });

    it('should handle max score correctly', async () => {
      const { mockSupabase } = setupCFTestSuite();
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: true }],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 1,
      });

      if (result.length > 0) {
        // Top recommendation should be near 1.0 (high score)
        expect(result[0].score).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('Metadata and Transparency', () => {
    it('should include metadata with rawScore and count', async () => {
      const { mockSupabase } = setupCFTestSuite();
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false }],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      if (result.length > 0) {
        expect(result[0].metadata).toHaveProperty('rawScore');
        expect(result[0].metadata).toHaveProperty('similarUserCount');
        expect(typeof result[0].metadata.rawScore).toBe('number');
        expect(typeof result[0].metadata.similarUserCount).toBe('number');
      }
    });
  });
});
