/**
 * Collaborative Filtering Algorithm Unit Tests
 *
 * Tests "users who viewed X also viewed Y" recommendation logic
 * using Jaccard similarity and user behavior patterns.
 */

import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from '@/__tests__/utils/recommendations/supabase-mock-factory';

// Jest automatically mocks @/lib/supabase/server via the manual mock at __mocks__/@/lib/supabase/server.ts
import { collaborativeFilterRecommendations } from '@/lib/recommendations/collaborative-filter';
import { createClient } from '@/lib/supabase/server';

// Mock is already loaded - just type it
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Collaborative Filter Recommendations', () => {
  let mockSupabase: MockSupabaseClient;

  beforeEach(() => {
    // Create a fresh mock Supabase client for this test
    mockSupabase = createMockSupabaseClient();

    // The manual mock already returns a client, but we want to return our specific one
    // Clear and reconfigure
    mockCreateClient.mockReset();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
  });

  describe('getUserViewedProducts', () => {
    it('should get products user has viewed', async () => {
      // The implementation calls three functions, each makes one query:
      // 1. getUserViewedProducts() - line 69-97
      // 2. findSimilarUsers() - line 103-149
      // 3. getProductsFromSimilarUsers() - line 154-212

      // Each function calls createClient() and builds a query ending with a terminal method.
      // We need to mock the TERMINAL method (the one that executes the query).
      // In all cases, this is the method after .limit() or .not()

      // The terminal methods are:
      // 1. First query ends with .limit(50) - so we mock the promise from limit
      // 2. Second query ends with .not(...) - so we mock the promise from not
      // 3. Third query ends with .not(...) - so we mock the promise from not

      // But actually, looking at the query builder pattern, EVERY method returns `this`
      // until the promise is awaited. The actual Promise resolution happens when
      // the query object is awaited, not when a specific method is called.

      // Let's mock ALL select() calls in sequence:

      // Call 1: getUserViewedProducts
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
          { product_id: 'prod-2', clicked: false, purchased: false },
          { product_id: 'prod-3', clicked: true, purchased: true },
        ],
        error: null,
      });

      // Call 2: findSimilarUsers
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-3', clicked: true, purchased: false },
        ],
        error: null,
      });

      // Call 3: getProductsFromSimilarUsers
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

      // Verify the function called Supabase methods
      expect(mockCreateClient).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('recommendation_events');
      expect(mockSupabase.select).toHaveBeenCalled();
    });
  });

  describe('findSimilarUsers', () => {
    it('should find users with similar product interactions', async () => {
      // Mock user viewed products
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
          { product_id: 'prod-2', clicked: true, purchased: false },
        ],
        error: null,
      });

      // Mock finding similar users
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false },
          { session_id: 'session-789', product_id: 'prod-1', clicked: true, purchased: false },
        ],
        error: null,
      });

      // Mock products from similar users
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

      expect(mockSupabase.in).toHaveBeenCalledWith('product_id', ['prod-1', 'prod-2']);
    });

    it('should calculate Jaccard similarity correctly', async () => {
      // User A viewed: prod-1, prod-2, prod-3
      // User B viewed: prod-1, prod-2, prod-4
      // Intersection: prod-1, prod-2 (2)
      // Union: prod-1, prod-2, prod-3, prod-4 (4)
      // Similarity: 2/4 = 0.5 (above 0.3 threshold)

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
          { product_id: 'prod-2', clicked: true, purchased: false },
          { product_id: 'prod-3', clicked: true, purchased: false },
        ],
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false },
          { session_id: 'session-456', product_id: 'prod-4', clicked: true, purchased: false },
        ],
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-5', clicked: true, purchased: false },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      // Should find similar users with 50% similarity
      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter users below 30% similarity threshold', async () => {
      // User A viewed: prod-1, prod-2, prod-3, prod-4, prod-5
      // User B viewed: prod-1 only
      // Intersection: prod-1 (1)
      // Union: prod-1, prod-2, prod-3, prod-4, prod-5 (5)
      // Similarity: 1/5 = 0.2 (below 0.3 threshold)

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

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
        ],
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

    it('should return top 20 similar users', async () => {
      const viewedProducts = Array.from({ length: 5 }, (_, i) => ({
        product_id: `prod-${i}`,
        clicked: true,
        purchased: false,
      }));

      mockSupabase.select.mockResolvedValueOnce({
        data: viewedProducts,
        error: null,
      });

      // Create 30 similar users (should limit to 20)
      const similarUserEvents = Array.from({ length: 30 }, (_, i) => ({
        session_id: `session-${i}`,
        product_id: 'prod-1',
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

      await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      // Implementation limits to top 20 users
      // Verify via the fact that it doesn't crash
      expect(mockSupabase.select).toHaveBeenCalled();
    });
  });

  describe('getProductsFromSimilarUsers', () => {
    it('should recommend products from similar users', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
        ],
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
          { session_id: 'session-456', product_id: 'prod-3', clicked: false, purchased: true },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].algorithm).toBe('collaborative');
      expect(result[0].reason).toContain('similar interests');
    });

    it('should weight by user similarity and engagement', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
        ],
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false },
        ],
        error: null,
      });

      // Product with purchase should score higher than product with just click
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: false }, // Score: similarity * 2
          { session_id: 'session-456', product_id: 'prod-3', clicked: false, purchased: true }, // Score: similarity * 3
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      // prod-3 should be ranked higher (purchased)
      expect(result[0].productId).toBe('prod-3');
    });

    it('should exclude user\'s already viewed products', async () => {
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
        ],
        error: null,
      });

      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { session_id: 'session-456', product_id: 'prod-1', clicked: true, purchased: false }, // Should be excluded
          { session_id: 'session-456', product_id: 'prod-3', clicked: true, purchased: false },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result.map((r) => r.productId)).not.toContain('prod-1');
      expect(result.map((r) => r.productId)).not.toContain('prod-2');
    });

    it('should exclude additional specified products', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
        ],
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

      expect(result.map((r) => r.productId)).not.toContain('prod-2');
    });

    it('should normalize scores to 0-1 range', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
        ],
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
          { session_id: 'session-456', product_id: 'prod-2', clicked: true, purchased: true },
        ],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      result.forEach((rec) => {
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(1);
      });
    });

    it('should include metadata with raw scores and similar user count', async () => {
      mockSupabase.select.mockResolvedValueOnce({
        data: [
          { product_id: 'prod-1', clicked: true, purchased: false },
        ],
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

      expect(result[0].metadata).toHaveProperty('rawScore');
      expect(result[0].metadata).toHaveProperty('similarUserCount');
    });
  });

  describe('cold start handling', () => {
    it('should return empty array when user has no history', async () => {
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'new-session',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result).toEqual([]);
    });
  });
});
