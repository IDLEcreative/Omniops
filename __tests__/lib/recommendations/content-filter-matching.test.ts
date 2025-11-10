/**
 * Content-Based Filtering Algorithm Unit Tests - Matching
 *
 * Tests category and tag matching using Jaccard similarity.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockCreateClient = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

import { contentBasedRecommendations } from '@/lib/recommendations/content-filter';

describe('Content-Based Filter - Matching', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  describe('category matching', () => {
    it('should find products in same category', async () => {
      mockReferenceProducts(mockSupabase, [
        { productId: 'ref-1', categories: ['hydraulics', 'pumps'], tags: ['industrial'] },
      ]);

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: ['hydraulics', 'motors'], tags: ['industrial', 'heavy-duty'] },
        { productId: 'prod-2', categories: ['electrical'], tags: ['light-duty'] },
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      // prod-1 should be recommended (shares 'hydraulics' category)
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].productId).toBe('prod-1');
      expect(result[0].reason).toContain('category');
    });

    it('should calculate Jaccard similarity for categories', async () => {
      mockReferenceProducts(mockSupabase, [
        { productId: 'ref-1', categories: ['cat-1', 'cat-2'], tags: [] },
      ]);

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: ['cat-1', 'cat-2'], tags: [] }, // Perfect match (Jaccard = 1.0)
        { productId: 'prod-2', categories: ['cat-1'], tags: [] }, // Partial match (Jaccard = 0.5)
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      // prod-1 should rank higher (perfect category match)
      expect(result[0].productId).toBe('prod-1');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('should weight categories more than tags (70/30)', async () => {
      mockReferenceProducts(mockSupabase, [
        { productId: 'ref-1', categories: ['cat-1'], tags: ['tag-1'] },
      ]);

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: ['cat-1'], tags: ['tag-2'] }, // Category match only
        { productId: 'prod-2', categories: ['cat-2'], tags: ['tag-1'] }, // Tag match only
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      // prod-1 should rank higher (category match is weighted 70%)
      expect(result[0].productId).toBe('prod-1');
    });
  });

  describe('tag matching', () => {
    it('should find products with similar tags', async () => {
      mockReferenceProducts(mockSupabase, [
        { productId: 'ref-1', categories: [], tags: ['industrial', 'heavy-duty', 'hydraulic'] },
      ]);

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: [], tags: ['industrial', 'heavy-duty'] },
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].metadata?.matchedTags).toContain('industrial');
    });

    it('should be case-insensitive for tag matching', async () => {
      mockReferenceProducts(mockSupabase, [
        { productId: 'ref-1', categories: [], tags: ['Industrial', 'HEAVY-DUTY'] },
      ]);

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: [], tags: ['industrial', 'heavy-duty'] },
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      // Should match despite case differences
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
