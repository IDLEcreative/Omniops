/**
 * Content-Based Filtering Algorithm Unit Tests - Scoring
 *
 * Tests filtering, ranking, and score calculation.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockCreateClient = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

import { contentBasedRecommendations } from '@/lib/recommendations/content-filter';

describe('Content-Based Filter - Scoring', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    // Use jest.requireMock to get the mocked module and configure it
    const supabaseModule = jest.requireMock('@/lib/supabase/server');
    supabaseModule.createClient.mockResolvedValue(mockSupabase);
  });

  describe('filtering and ranking', () => {
    it('should filter products with score < 0.2', async () => {
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: { categories: ['cat-1', 'cat-2', 'cat-3'], tags: [] },
          },
        ],
        error: null,
      });

      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: { categories: ['cat-1'], tags: [] }, // Low similarity
          },
        ],
        error: null,
      });

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
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: { categories: ['cat-1'], tags: [] },
          },
        ],
        error: null,
      });

      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: { categories: ['cat-1'], tags: [] },
          },
          {
            product_id: 'prod-2',
            metadata: { categories: ['cat-1'], tags: [] },
          },
        ],
        error: null,
      });

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        excludeProductIds: ['prod-1'],
        limit: 5,
      });

      expect(result.map((r) => r.productId)).not.toContain('prod-1');
    });

    it('should sort by score descending', async () => {
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: { categories: ['cat-1', 'cat-2'], tags: [] },
          },
        ],
        error: null,
      });

      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: { categories: ['cat-1', 'cat-2'], tags: [] }, // High score
          },
          {
            product_id: 'prod-2',
            metadata: { categories: ['cat-1'], tags: [] }, // Medium score
          },
          {
            product_id: 'prod-3',
            metadata: { categories: ['cat-3'], tags: [] }, // Low score (filtered)
          },
        ],
        error: null,
      });

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
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: { categories: ['cat-1'], tags: [] },
          },
        ],
        error: null,
      });

      mockSupabase.eq.mockResolvedValueOnce({
        data: Array.from({ length: 10 }, (_, i) => ({
          product_id: `prod-${i}`,
          metadata: { categories: ['cat-1'], tags: [] },
        })),
        error: null,
      });

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 3,
      });

      expect(result.length).toBeLessThanOrEqual(3);
    });
  });
});
