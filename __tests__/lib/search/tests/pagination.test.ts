/**
 * Tests for hybrid search cursor-based pagination
 */

import { hybridSearchPaginated } from '@/lib/search/hybrid-search';
import { createClient } from '@/lib/supabase/server';
import { mockSupabase, setupMocks } from './setup';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/search/search-algorithms', () => ({
  generateEmbedding: jest.fn().mockResolvedValue(new Array(1536).fill(0.1)),
  calculateCosineSimilarity: jest.fn().mockReturnValue(0.8),
  scoreAndMergeResults: jest.fn((fts, semantic) => {
    const merged = [...fts, ...semantic];
    return merged.map((r, idx) => ({
      ...r,
      combinedScore: 0.9 - (idx * 0.1)
    }));
  }),
  deduplicateResults: jest.fn(results => results),
  highlightRelevantSection: jest.fn(content => content)
}));

describe('Hybrid Search - Cursor-based Pagination', () => {
  beforeEach(() => {
    setupMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('First page (no cursor)', () => {
    it('should return first page of results with nextCursor', async () => {
      // Mock 15 results total
      const ftsResults = Array.from({ length: 8 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user',
        created_at: new Date().toISOString(),
        relevance_score: 0.9 - (i * 0.05),
        highlight: `Message ${i}`
      }));

      const semanticResults = Array.from({ length: 7 }, (_, i) => ({
        message_id: `msg-sem-${i}`,
        embedding: new Array(1536).fill(0.1),
        messages: {
          id: `msg-sem-${i}`,
          content: `Semantic ${i}`,
          role: 'user',
          created_at: new Date().toISOString(),
          conversation_id: `conv-sem-${i}`
        }
      }));

      mockSupabase.rpc.mockResolvedValue({ data: ftsResults, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: semanticResults, error: null })
        })
      });

      const result = await hybridSearchPaginated('test query', {}, {}, { limit: 10 });

      expect(result.results).toHaveLength(10);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBeDefined();
      expect(result.searchMetrics.returnedCount).toBe(10);
    });

    it('should return all results if total < limit', async () => {
      const ftsResults = Array.from({ length: 3 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user',
        created_at: new Date().toISOString(),
        relevance_score: 0.9 - (i * 0.1),
        highlight: `Message ${i}`
      }));

      mockSupabase.rpc.mockResolvedValue({ data: ftsResults, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await hybridSearchPaginated('test', {}, {}, { limit: 10 });

      expect(result.results.length).toBeLessThanOrEqual(10);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeUndefined();
    });
  });

  describe('Subsequent pages (with cursor)', () => {
    it('should paginate through results using cursor', async () => {
      const allResults = Array.from({ length: 25 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user',
        created_at: new Date().toISOString(),
        relevance_score: 0.95 - (i * 0.01),
        highlight: `Message ${i}`
      }));

      mockSupabase.rpc.mockResolvedValue({ data: allResults, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      // Get first page
      const page1 = await hybridSearchPaginated('test', {}, {}, { limit: 10 });
      expect(page1.results).toHaveLength(10);
      expect(page1.pagination.hasMore).toBe(true);
      expect(page1.pagination.nextCursor).toBeDefined();

      // Get second page using cursor
      const page2 = await hybridSearchPaginated(
        'test',
        {},
        {},
        { limit: 10, cursor: page1.pagination.nextCursor }
      );

      expect(page2.results).toHaveLength(10);
      expect(page2.results[0].messageId).not.toBe(page1.results[0].messageId);
      expect(page2.pagination.hasMore).toBe(true);
    });

    it('should handle last page correctly', async () => {
      const results = Array.from({ length: 15 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user',
        created_at: new Date().toISOString(),
        relevance_score: 0.9 - (i * 0.01),
        highlight: `Message ${i}`
      }));

      mockSupabase.rpc.mockResolvedValue({ data: results, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      // Get first page
      const page1 = await hybridSearchPaginated('test', {}, {}, { limit: 10 });

      // Get last page
      const page2 = await hybridSearchPaginated(
        'test',
        {},
        {},
        { limit: 10, cursor: page1.pagination.nextCursor }
      );

      expect(page2.results.length).toBeLessThanOrEqual(10);
      expect(page2.pagination.hasMore).toBe(false);
      expect(page2.pagination.nextCursor).toBeUndefined();
    });

    it('should handle invalid cursor gracefully', async () => {
      const results = Array.from({ length: 5 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user',
        created_at: new Date().toISOString(),
        relevance_score: 0.9,
        highlight: `Message ${i}`
      }));

      mockSupabase.rpc.mockResolvedValue({ data: results, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      // Use invalid cursor - should fall back to first page
      const result = await hybridSearchPaginated(
        'test',
        {},
        {},
        { limit: 10, cursor: 'invalid-cursor-!!!!' }
      );

      expect(result.results.length).toBeGreaterThan(0);
      // Should not throw error
    });
  });

  describe('Cursor encoding/decoding', () => {
    it('should encode and decode cursor consistently', async () => {
      const results = Array.from({ length: 20 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user',
        created_at: new Date().toISOString(),
        relevance_score: 0.95 - (i * 0.02),
        highlight: `Message ${i}`
      }));

      mockSupabase.rpc.mockResolvedValue({ data: results, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const page1 = await hybridSearchPaginated('test', {}, {}, { limit: 5 });
      const cursor = page1.pagination.nextCursor;

      expect(cursor).toBeDefined();
      expect(typeof cursor).toBe('string');

      // Cursor should be base64 encoded
      expect(() => Buffer.from(cursor!, 'base64')).not.toThrow();
    });
  });

  describe('Pagination metadata', () => {
    it('should include correct search metrics', async () => {
      const ftsResults = Array.from({ length: 10 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user',
        created_at: new Date().toISOString(),
        relevance_score: 0.9,
        highlight: `Message ${i}`
      }));

      const semanticResults = Array.from({ length: 8 }, (_, i) => ({
        message_id: `msg-sem-${i}`,
        embedding: new Array(1536).fill(0.1),
        messages: {
          id: `msg-sem-${i}`,
          content: `Semantic ${i}`,
          role: 'user',
          created_at: new Date().toISOString(),
          conversation_id: `conv-sem-${i}`
        }
      }));

      mockSupabase.rpc.mockResolvedValue({ data: ftsResults, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: semanticResults, error: null })
        })
      });

      const result = await hybridSearchPaginated('test', {}, {}, { limit: 5 });

      expect(result.searchMetrics).toBeDefined();
      expect(result.searchMetrics.ftsCount).toBe(10);
      expect(result.searchMetrics.semanticCount).toBe(8);
      expect(result.searchMetrics.returnedCount).toBe(5);
    });

    it('should include totalCount in pagination metadata', async () => {
      const results = Array.from({ length: 15 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user',
        created_at: new Date().toISOString(),
        relevance_score: 0.9,
        highlight: `Message ${i}`
      }));

      mockSupabase.rpc.mockResolvedValue({ data: results, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await hybridSearchPaginated('test', {}, {}, { limit: 5 });

      expect(result.pagination.totalCount).toBeDefined();
      expect(result.pagination.totalCount).toBeGreaterThan(result.results.length);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty results', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await hybridSearchPaginated('test', {}, {}, { limit: 10 });

      expect(result.results).toHaveLength(0);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeUndefined();
      expect(result.pagination.totalCount).toBe(0);
    });

    it('should handle limit = 1', async () => {
      const results = Array.from({ length: 10 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user',
        created_at: new Date().toISOString(),
        relevance_score: 0.9,
        highlight: `Message ${i}`
      }));

      mockSupabase.rpc.mockResolvedValue({ data: results, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await hybridSearchPaginated('test', {}, {}, { limit: 1 });

      expect(result.results).toHaveLength(1);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBeDefined();
    });

    it('should use default limit when not specified', async () => {
      const results = Array.from({ length: 30 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: 'user',
        created_at: new Date().toISOString(),
        relevance_score: 0.9,
        highlight: `Message ${i}`
      }));

      mockSupabase.rpc.mockResolvedValue({ data: results, error: null });
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await hybridSearchPaginated('test', {}, {}, {});

      expect(result.results).toHaveLength(20); // Default limit
      expect(result.pagination.hasMore).toBe(true);
    });
  });
});
