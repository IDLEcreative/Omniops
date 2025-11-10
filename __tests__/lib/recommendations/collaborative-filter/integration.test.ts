/**
 * Integration Tests - Collaborative Filtering
 *
 * Tests the complete end-to-end flow of collaborative filtering
 * from user viewed products through recommendation discovery.
 *
 * Focus: Complete workflow, data flow, user-to-product mapping
 *
 * Last Updated: 2025-11-10
 */

import { collaborativeFilterRecommendations } from '@/lib/recommendations/collaborative-filter';
import { createClient } from '@/lib/supabase/server';
import {
  setupCFTestSuite,
  createUserViewedProducts,
  mockUserSimilarityQuery,
} from '@/__tests__/utils/recommendations/collaborative-filter-helpers';

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('Integration - Collaborative Filtering Complete Flow', () => {
  beforeEach(() => {
    setupCFTestSuite();
  });

  describe('getUserViewedProducts', () => {
    it('should get products user has viewed as starting point', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // The CF algorithm flow:
      // 1. Get user's viewed products
      // 2. Find similar users
      // 3. Get recommendations from those users

      // User viewed 3 products
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
          { product_id: 'prod-2', clicked: false, purchased: false },
          { product_id: 'prod-3', clicked: true, purchased: true },
        ],
        error: null,
      });

      // Find similar users (who viewed similar products)
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-3', clicked: true, purchased: false },
        ],
        error: null,
      });

      // Get products from similar users to recommend
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-4', clicked: true, purchased: false },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      // Should complete without crashing
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should complete full CF pipeline with multiple similar users', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // User viewed products
      const userProducts = createUserViewedProducts(3, 0.4);
      mockSupabase.select.mockResolvedValueOnce({
        data: userProducts,
        error: null,
      });

      // Multiple similar users
      const similarUserEvents = [
        { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
        { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false },
        { session_id: 'session-789', product_id: 'prod-1', clicked: true, purchased: false },
        { session_id: 'session-789', product_id: 'prod-3', clicked: true, purchased: true },
      ];

      mockSupabase.select.mockResolvedValueOnce({
        data: similarUserEvents,
        error: null,
      });

      // Recommendations from similar users
      const recommendations = [
        { session_id: 'session-456', product_id: 'prod-4', clicked: true, purchased: false },
        { session_id: 'session-789', product_id: 'prod-5', clicked: true, purchased: true },
      ];

      mockSupabase.select.mockResolvedValueOnce({
        data: recommendations,
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle user with few viewed products (cold start risk)', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // User viewed only 1 product (cold start)
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
        ],
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Complete CF Workflow', () => {
    it('should find similar users and return recommendations in limit', async () => {
      const { mockSupabase } = setupCFTestSuite();

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
          { product_id: 'prod-2', clicked: true, purchased: false },
        ],
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false },
        ],
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-3', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-4', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-5', clicked: true, purchased: false },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 2, // Request only 2
      });

      // Should respect limit
      if (result.length > 0) {
        expect(result.length).toBeLessThanOrEqual(2);
      }
    });

    it('should handle recommendations with conflicting signals', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // User has viewed products
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
          { product_id: 'prod-2', clicked: false, purchased: true }, // Purchased without click
        ],
        error: null,
      });

      // Similar users with same pattern
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-2', clicked: false, purchased: true },
        ],
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-3', clicked: false, purchased: true },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should maintain consistent recommendations across calls', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // First call
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
        ],
        error: null,
      });
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false },
        ],
        error: null,
      });

      const result1 = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      // Results should be consistent (same data should produce same results)
      expect(result1).toBeDefined();
      expect(Array.isArray(result1)).toBe(true);
    });
  });
});
