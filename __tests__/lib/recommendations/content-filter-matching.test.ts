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

    // Mock Supabase client with chainable methods
    // Note: .eq() is terminal for second query, .in() is terminal for first query
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
      // Mock reference product metadata (first query ends with .in())
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: {
              categories: ['hydraulics', 'pumps'],
              tags: ['industrial'],
            },
          },
        ],
        error: null,
      });

      // Mock all products for comparison (second query ends with .eq())
      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: {
              categories: ['hydraulics', 'motors'],
              tags: ['industrial', 'heavy-duty'],
            },
          },
          {
            product_id: 'prod-2',
            metadata: {
              categories: ['electrical'],
              tags: ['light-duty'],
            },
          },
        ],
        error: null,
      });

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
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: {
              categories: ['cat-1', 'cat-2'],
              tags: [],
            },
          },
        ],
        error: null,
      });

      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: {
              categories: ['cat-1', 'cat-2'], // Perfect match (Jaccard = 1.0)
              tags: [],
            },
          },
          {
            product_id: 'prod-2',
            metadata: {
              categories: ['cat-1'], // Partial match (Jaccard = 0.5)
              tags: [],
            },
          },
        ],
        error: null,
      });

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
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: {
              categories: ['cat-1'],
              tags: ['tag-1'],
            },
          },
        ],
        error: null,
      });

      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: {
              categories: ['cat-1'], // Category match only
              tags: ['tag-2'],
            },
          },
          {
            product_id: 'prod-2',
            metadata: {
              categories: ['cat-2'],
              tags: ['tag-1'], // Tag match only
            },
          },
        ],
        error: null,
      });

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
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: {
              categories: [],
              tags: ['industrial', 'heavy-duty', 'hydraulic'],
            },
          },
        ],
        error: null,
      });

      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: {
              categories: [],
              tags: ['industrial', 'heavy-duty'],
            },
          },
        ],
        error: null,
      });

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].metadata?.matchedTags).toContain('industrial');
    });

    it('should be case-insensitive for tag matching', async () => {
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: {
              categories: [],
              tags: ['Industrial', 'HEAVY-DUTY'],
            },
          },
        ],
        error: null,
      });

      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: {
              categories: [],
              tags: ['industrial', 'heavy-duty'],
            },
          },
        ],
        error: null,
      });

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
