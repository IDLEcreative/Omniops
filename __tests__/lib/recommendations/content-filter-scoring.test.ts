/**
 * Content-Based Filtering Algorithm Unit Tests - Scoring
 *
 * Tests filtering, ranking, and score calculation.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  createMockSupabaseClient,
  setupSupabaseMock,
  mockReferenceProducts,
  mockAllProducts,
} from '@/__tests__/utils/recommendations/content-filter-helpers';

const mockCreateClient = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

import { contentBasedRecommendations } from '@/lib/recommendations/content-filter';

describe('Content-Based Filter - Scoring', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    setupSupabaseMock(mockCreateClient, mockSupabase);
  });

  describe('filtering and ranking', () => {
    it('should filter products with score < 0.2', async () => {
      mockReferenceProducts(mockSupabase, [
        { productId: 'ref-1', categories: ['cat-1', 'cat-2', 'cat-3'], tags: [] },
      ]);

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: ['cat-1'], tags: [] }, // Low similarity
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      // Products with very low similarity should be filtered
      result.forEach((rec) => {
        expect(rec.score).toBeGreaterThanOrEqual(0.2);
      });
    });

    it('should exclude specified products', async () => {
      mockReferenceProducts(mockSupabase, [
        { productId: 'ref-1', categories: ['cat-1'], tags: [] },
      ]);

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: ['cat-1'], tags: [] },
        { productId: 'prod-2', categories: ['cat-1'], tags: [] },
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        excludeProductIds: ['prod-1'],
        limit: 5,
      });

      expect(result.map((r) => r.productId)).not.toContain('prod-1');
    });

    it('should sort by score descending', async () => {
      mockReferenceProducts(mockSupabase, [
        { productId: 'ref-1', categories: ['cat-1', 'cat-2'], tags: [] },
      ]);

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: ['cat-1', 'cat-2'], tags: [] }, // High score
        { productId: 'prod-2', categories: ['cat-1'], tags: [] }, // Medium score
        { productId: 'prod-3', categories: ['cat-3'], tags: [] }, // Low score (filtered)
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      // Verify descending order
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
      }
    });

    it('should respect limit parameter', async () => {
      mockReferenceProducts(mockSupabase, [
        { productId: 'ref-1', categories: ['cat-1'], tags: [] },
      ]);

      mockAllProducts(mockSupabase, [
        ...Array.from({ length: 10 }, (_, i) => ({
          productId: `prod-${i}`,
          categories: ['cat-1'],
          tags: [],
        })),
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 3,
      });

      expect(result.length).toBeLessThanOrEqual(3);
    });
  });
});
