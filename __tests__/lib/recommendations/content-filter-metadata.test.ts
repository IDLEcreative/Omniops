/**
 * Content-Based Filtering Algorithm Unit Tests - Metadata
 *
 * Tests metadata extraction, reason building, and error handling.
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

describe('Content-Based Filter - Metadata', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    setupSupabaseMock(mockCreateClient, mockSupabase);
  });

  describe('metadata extraction', () => {
    it('should extract categories from multiple reference products', async () => {
      mockSupabase.select.mockResolvedValueOnce({
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

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: ['cat-1', 'cat-2'], tags: [] },
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1', 'ref-2'],
        limit: 5,
      });

      // Should find products matching either cat-1 or cat-2
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle products without metadata', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          {
            product_id: 'ref-1',
            metadata: null, // No metadata
          },
        ],
        error: null,
      });

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: ['cat-1'], tags: [] },
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      // Should handle gracefully, return empty results
      expect(result).toEqual([]);
    });

    it('should accept categories parameter directly', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: ['hydraulics'], tags: [] },
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        categories: ['hydraulics'],
        limit: 5,
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('should accept tags parameter directly', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: [], tags: ['industrial'] },
      ]);

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
      mockReferenceProducts(mockSupabase, [
        { productId: 'ref-1', categories: ['hydraulics'], tags: ['industrial'] },
      ]);

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: ['hydraulics'], tags: ['industrial'] },
      ]);

      const result = await contentBasedRecommendations({
        domainId: 'domain-123',
        productIds: ['ref-1'],
        limit: 5,
      });

      expect(result[0].reason).toContain('category');
      expect(result[0].reason).toContain('tags');
    });

    it('should build reason for category match only', async () => {
      mockReferenceProducts(mockSupabase, [
        { productId: 'ref-1', categories: ['hydraulics'], tags: ['tag-1'] },
      ]);

      mockAllProducts(mockSupabase, [
        { productId: 'prod-1', categories: ['hydraulics'], tags: ['tag-2'] },
      ]);

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
      mockSupabase.select.mockResolvedValue({
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
      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
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
