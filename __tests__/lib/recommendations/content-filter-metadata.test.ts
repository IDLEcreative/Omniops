/**
 * Content-Based Filtering Algorithm Unit Tests - Metadata
 *
 * Tests metadata extraction, reason building, and error handling.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { contentBasedRecommendations } from '@/lib/recommendations/content-filter';
import * as supabaseServer from '@/lib/supabase/server';

describe('Content-Based Filter - Metadata', () => {
  let mockSupabase: any;
  let createClientSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create fresh mocks for each test
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };

    // Spy on createClient and mock its return value
    createClientSpy = jest.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as any);
  });

  afterEach(() => {
    // Cleanup spy if it exists
    if (createClientSpy?.mockRestore) {
      createClientSpy.mockRestore();
    }
  });

  describe('metadata extraction', () => {
    it('should extract categories from multiple reference products', async () => {
      // First query: get reference products (ends with .in())
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: { categories: ['cat-1'], tags: [] },
          },
          {
            product_id: 'ref-2',
            metadata: { categories: ['cat-2'], tags: [] },
          },
        ],
        error: null,
      });

      // Second query: get all products (ends with .eq())
      // Include products that match the extracted categories
      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: { categories: ['cat-1'], tags: [] },
          },
          {
            product_id: 'ref-2',
            metadata: { categories: ['cat-2'], tags: [] },
          },
          {
            product_id: 'prod-1',
            metadata: { categories: ['cat-1', 'cat-2'], tags: [] },
          },
        ],
        error: null,
      });

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1', 'ref-2'],
        limit: 5,
      });

      // Should find products matching either cat-1 or cat-2
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle products without metadata', async () => {
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: null, // No metadata
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
        ],
        error: null,
      });

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      // Should handle gracefully, return empty results
      expect(result).toEqual([]);
    });

    it('should accept categories parameter directly', async () => {
      // When no productIds, first query returns empty but doesn't error
      // Only one query is made (to get all products)
      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: { categories: ['hydraulics'], tags: [] },
          },
          {
            product_id: 'prod-2',
            metadata: { categories: ['other'], tags: [] },
          },
        ],
        error: null,
      });

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        categories: ['hydraulics'],
        limit: 5,
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('should accept tags parameter directly', async () => {
      // When no productIds, only one query is made (to get all products)
      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'prod-1',
            metadata: { categories: [], tags: ['industrial'] },
          },
          {
            product_id: 'prod-2',
            metadata: { categories: [], tags: ['other'] },
          },
        ],
        error: null,
      });

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        tags: ['industrial'],
        limit: 5,
      });

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('reason building', () => {
    it('should build reason for category and tag matches', async () => {
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: { categories: ['hydraulics'], tags: ['industrial'] },
          },
        ],
        error: null,
      });

      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: { categories: ['hydraulics'], tags: ['industrial'] },
          },
          {
            product_id: 'prod-1',
            metadata: { categories: ['hydraulics'], tags: ['industrial'] },
          },
        ],
        error: null,
      });

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      expect(result[0].reason).toContain('category');
      expect(result[0].reason).toContain('tags');
    });

    it('should build reason for category match only', async () => {
      mockSupabase.in.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: { categories: ['hydraulics'], tags: ['tag-1'] },
          },
        ],
        error: null,
      });

      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: { categories: ['hydraulics'], tags: ['tag-1'] },
          },
          {
            product_id: 'prod-1',
            metadata: { categories: ['hydraulics'], tags: ['tag-2'] },
          },
        ],
        error: null,
      });

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      expect(result[0].reason).toContain('Same category');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.in.mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      });

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      expect(result).toEqual([]);
    });

    it('should handle empty product list', async () => {
      // When productIds is empty, only second query is made
      mockSupabase.eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: [],
        limit: 5,
      });

      expect(result).toEqual([]);
    });
  });
});
