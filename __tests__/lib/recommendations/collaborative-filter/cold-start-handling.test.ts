/**
 * Cold Start and Error Handling Tests
 *
 * Tests edge cases including new users with no history,
 * database errors, and error recovery.
 *
 * Focus: Robustness, graceful degradation, error handling
 *
 * Last Updated: 2025-11-10
 */

import { collaborativeFilterRecommendations } from '@/lib/recommendations/collaborative-filter';
import { createClient } from '@/lib/supabase/server';
import { setupCFTestSuite } from '@/__tests__/utils/recommendations/collaborative-filter-helpers';

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;

describe('Cold Start and Error Handling - Collaborative Filtering', () => {
  beforeEach(() => {
    setupCFTestSuite();
  });

  describe('Cold Start Scenarios', () => {
    it('should return empty array when user has no viewing history', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // User has no viewed products
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'new-session',
        domainId: 'domain-123',
        limit: 5,
      });

      // Should gracefully return empty instead of crashing
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle completely new domain with no user data', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // Domain has no interaction history
      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-xyz',
        domainId: 'new-domain-123',
        limit: 5,
      });

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle null session ID gracefully', async () => {
      const { mockSupabase } = setupCFTestSuite();

      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: '',
        domainId: 'domain-123',
        limit: 5,
      });

      // Should not crash, return empty
      expect(result).toEqual([]);
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // Simulate database error
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('DB connection failed'),
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      // Should return empty instead of throwing
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle partial query failure (first query succeeds, second fails)', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // First query succeeds - user has viewed products
      mockSupabase.select.mockResolvedValueOnce({
        data: [{ product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });

      // Second query fails - similar users lookup
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: new Error('Query timeout'),
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      // Should return empty on error
      expect(result).toEqual([]);
    });

    it('should handle Supabase connection timeout', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // Simulate connection timeout
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Request timeout after 30s'),
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle authentication errors gracefully', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // Simulate auth error
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('Unauthorized: Invalid JWT'),
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result).toEqual([]);
    });

    it('should handle RLS (Row Level Security) violations', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // Simulate RLS violation
      mockSupabase.select.mockResolvedValue({
        data: null,
        error: new Error('new row violates row-level security policy'),
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle limit of 0', async () => {
      const { mockSupabase } = setupCFTestSuite();

      mockSupabase.select.mockResolvedValue({
        data: [{ product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 0,
      });

      // Should return empty when limit is 0
      expect(result).toEqual([]);
    });

    it('should handle very large limit', async () => {
      const { mockSupabase } = setupCFTestSuite();

      mockSupabase.select.mockResolvedValue({
        data: [{ product_id: 'prod-1', clicked: true, purchased: false }],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 10000,
      });

      // Should not crash with large limit
      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty excludeProductIds array', async () => {
      const { mockSupabase } = setupCFTestSuite();

      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        excludeProductIds: [],
        limit: 5,
      });

      expect(result).toEqual([]);
    });

    it('should handle undefined excludeProductIds parameter', async () => {
      const { mockSupabase } = setupCFTestSuite();

      mockSupabase.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result).toEqual([]);
    });
  });

  describe('Recovery and Fallback', () => {
    it('should still work after recovering from a temporary error', async () => {
      const { mockSupabase } = setupCFTestSuite();

      // First attempt fails
      mockSupabase.select.mockResolvedValueOnce({
        data: null,
        error: new Error('Temporary network error'),
      });

      const result1 = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result1).toEqual([]);

      // Reset mocks and try again
      jest.clearAllMocks();
      const { mockSupabase: mockSupabase2 } = setupCFTestSuite();

      // Second attempt succeeds
      mockSupabase2.select.mockResolvedValue({
        data: [],
        error: null,
      });

      const result2 = await collaborativeFilterRecommendations({
        sessionId: 'session-123',
        domainId: 'domain-123',
        limit: 5,
      });

      expect(result2).toEqual([]);
    });
  });
});
