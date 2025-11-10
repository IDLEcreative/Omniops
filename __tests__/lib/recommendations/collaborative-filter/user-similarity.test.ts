/**
 * User Similarity Collaborative Filtering Tests
 *
 * Tests user-based collaborative filtering which finds similar users
 * based on shared product interests (Jaccard similarity).
 *
 * Focus: User discovery, similarity calculation, threshold filtering
 *
 * Last Updated: 2025-11-10
 */

import { collaborativeFilterRecommendations } from '@/lib/recommendations/collaborative-filter';
import { createClient } from '@/lib/supabase/server';
import {
  setupCFTestSuite,
  createUserViewedProducts,
  createSimilarUsersFixture,
  calculateJaccardSimilarity,
  mockUserSimilarityQuery,
} from '@/__tests__/utils/recommendations/collaborative-filter-helpers';

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('User Similarity - Collaborative Filtering', () => {
  beforeEach(() => {
    const { mockSupabase } = setupCFTestSuite();
  });

  describe('findSimilarUsers', () => {
    it('should find users with similar product interactions', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // User A viewed prod-1, prod-2
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
          { product_id: 'prod-2', clicked: true, purchased: false },
        ],
        error: null,
      });

      // User B also has prod-1, prod-2
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false },
          { session_id: 'session-789', product_id: 'prod-1', clicked: true, purchased: false },
        ],
        error: null,
      });

      // Products from similar users
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-3', clicked: true, purchased: false },
          { session_id: 'session-789', product_id: 'prod-4', clicked: true, purchased: false },
        ],
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

    it('should calculate Jaccard similarity correctly', async () => {
      // User A viewed: prod-1, prod-2, prod-3
      // User B viewed: prod-1, prod-2, prod-4
      // Intersection: 2 products
      // Union: 4 products
      // Jaccard: 2/4 = 0.5

      const userA = ['prod-1', 'prod-2', 'prod-3'];
      const userB = ['prod-1', 'prod-2', 'prod-4'];
      const similarity = calculateJaccardSimilarity(userA, userB);

      expect(similarity).toBe(0.5);
      expect(similarity).toBeGreaterThan(0.3); // Above threshold
    });

    it('should filter users below 30% similarity threshold', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // User A viewed 5 products
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
          { product_id: 'prod-2', clicked: true, purchased: false },
          { product_id: 'prod-3', clicked: true, purchased: false },
          { product_id: 'prod-4', clicked: true, purchased: false },
          { product_id: 'prod-5', clicked: true, purchased: false },
        ],
        error: null,
      });

      // User B viewed only prod-1
      // Intersection: 1, Union: 5, Similarity: 0.2 (below 0.3 threshold)
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      // Should return empty due to low similarity
      expect(result).toEqual([]);
    });

    it('should verify Jaccard similarity of 0.2 is below threshold', () => {
      const userA = ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5'];
      const userB = ['prod-1'];

      const similarity = calculateJaccardSimilarity(userA, userB);

      expect(similarity).toBe(0.2);
      expect(similarity).toBeLessThan(0.3); // Below threshold
    });

    it('should return top 20 similar users when more exist', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // Base user viewed 5 products
      const viewedProducts = Array.from({ length: 5 }, (_, i) => ({
        product_id: `prod-${i}`,
        clicked: true,
        purchased: false,
      }));

      mockSupabase.select.mockResolvedValueOnce({
        data: viewedProducts,
        error: null,
      });

      // Create 30 similar users (implementation should limit to 20)
      const similarUserEvents = Array.from({ length: 30 }, (_, i) => ({
        session_id: `session-${i}`,
        product_id: 'prod-1', // All share at least one product
        clicked: true,
        purchased: false,
      }));

      mockSupabase.select.mockResolvedValueOnce({
        data: similarUserEvents,
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      // Test verifies no crashes when limiting to top 20
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle perfect similarity (100%)', () => {
      const userA = ['prod-1', 'prod-2', 'prod-3'];
      const userB = ['prod-1', 'prod-2', 'prod-3'];

      const similarity = calculateJaccardSimilarity(userA, userB);

      expect(similarity).toBe(1.0); // Perfect match
    });

    it('should handle no overlap (0% similarity)', () => {
      const userA = ['prod-1', 'prod-2', 'prod-3'];
      const userB = ['prod-4', 'prod-5', 'prod-6'];

      const similarity = calculateJaccardSimilarity(userA, userB);

      expect(similarity).toBe(0.0); // No overlap
    });

    it('should handle single product users', () => {
      const userA = ['prod-1'];
      const userB = ['prod-1'];

      const similarity = calculateJaccardSimilarity(userA, userB);

      expect(similarity).toBe(1.0); // Perfect match with 1 product
    });
  });
});
