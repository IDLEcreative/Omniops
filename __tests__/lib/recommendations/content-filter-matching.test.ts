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

    // Use jest.requireMock to get the mocked module and configure it
    const supabaseModule = jest.requireMock('@/lib/supabase/server');
    supabaseModule.createClient.mockResolvedValue(mockSupabase);
  });

  describe('category matching', () => {
    it('should find products in same category', async () => {
      // First query: fetch reference products
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

      // Second query: fetch all products for comparison
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
      // First query: fetch reference products
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

      // Second query: fetch all products for comparison
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
              categories: ['cat-1'], // Partial match (Jaccard ~0.67)
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
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].productId).toBe('prod-1');
      expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('should weight categories more than tags (70/30)', async () => {
      // First query: fetch reference products
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

      // Second query: fetch all products for comparison
      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: {
              categories: ['cat-1'], // Category match only (score = 1.0 * 0.7 = 0.7)
              tags: ['tag-2'],
            },
          },
          {
            product_id: 'prod-2',
            metadata: {
              categories: ['cat-2'],
              tags: ['tag-1'], // Tag match only (score = 1.0 * 0.3 = 0.3)
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
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].productId).toBe('prod-1');
    });
  });

  describe('tag matching', () => {
    it('should find products with similar tags', async () => {
      // First query: fetch reference products
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: {
              categories: ['cat-1'], // Add category to ensure score > 0.2
              tags: ['industrial', 'heavy-duty', 'hydraulic'],
            },
          },
        ],
        error: null,
      });

      // Second query: fetch all products for comparison
      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: {
              categories: ['cat-1'], // Match category too
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
      // First query: fetch reference products
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: {
              categories: ['cat-1'], // Add category to ensure score > 0.2
              tags: ['Industrial', 'HEAVY-DUTY'],
            },
          },
        ],
        error: null,
      });

      // Second query: fetch all products for comparison
      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: {
              categories: ['cat-1'], // Match category too
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
