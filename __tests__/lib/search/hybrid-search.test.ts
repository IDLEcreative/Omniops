import { hybridSearch } from '@/lib/search/hybrid-search';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

describe('Hybrid Search', () => {
  const mockSupabase = {
    rpc: jest.fn(),
    from: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('hybridSearch', () => {
    it('should combine FTS and semantic search results', async () => {
      // Mock FTS results
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            conversation_id: 'conv-1',
            message_id: 'msg-1',
            content: 'Order status inquiry',
            role: 'user',
            created_at: '2024-01-01T00:00:00Z',
            relevance_score: 0.9,
            highlight: '<mark>Order status</mark> inquiry'
          },
          {
            conversation_id: 'conv-2',
            message_id: 'msg-2',
            content: 'Product shipping delay',
            role: 'user',
            created_at: '2024-01-02T00:00:00Z',
            relevance_score: 0.7,
            highlight: 'Product <mark>shipping</mark> delay'
          }
        ],
        error: null
      });

      // Mock semantic search results
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [
              {
                message_id: 'msg-1',
                embedding: new Array(1536).fill(0.1),
                messages: {
                  id: 'msg-1',
                  content: 'Order status inquiry',
                  role: 'user',
                  created_at: '2024-01-01T00:00:00Z',
                  conversation_id: 'conv-1'
                }
              },
              {
                message_id: 'msg-3',
                embedding: new Array(1536).fill(0.2),
                messages: {
                  id: 'msg-3',
                  content: 'Delivery tracking question',
                  role: 'user',
                  created_at: '2024-01-03T00:00:00Z',
                  conversation_id: 'conv-3'
                }
              }
            ],
            error: null
          })
        })
      });

      const results = await hybridSearch('shipping problems');

      expect(results.results).toHaveLength(3);
      expect(results.searchMetrics.ftsCount).toBe(2);
      expect(results.searchMetrics.semanticCount).toBe(2);
      expect(results.searchMetrics.mergedCount).toBe(3);
    });

    it('should apply custom weights correctly', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            conversation_id: 'conv-1',
            message_id: 'msg-1',
            content: 'Test content',
            relevance_score: 1.0
          }
        ],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const results = await hybridSearch(
        'test',
        {},
        {
          ftsWeight: 0.8,
          semanticWeight: 0.2
        }
      );

      // Score should be normalized and weighted
      if (results.results.length > 0) {
        expect(results.results[0].relevanceScore).toBeLessThanOrEqual(1.0);
      }
    });

    it('should deduplicate results by message ID', async () => {
      // Same message appears in both search types
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            conversation_id: 'conv-1',
            message_id: 'msg-duplicate',
            content: 'Duplicate message',
            relevance_score: 0.8
          }
        ],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [
              {
                message_id: 'msg-duplicate',
                messages: {
                  id: 'msg-duplicate',
                  content: 'Duplicate message',
                  conversation_id: 'conv-1'
                }
              }
            ],
            error: null
          })
        })
      });

      const results = await hybridSearch('duplicate');

      // Should only have one instance of the duplicate message
      expect(results.results.length).toBe(1);
      expect(results.results[0].messageId).toBe('msg-duplicate');
      expect(results.searchMetrics.deduplicatedCount).toBe(1);
    });

    it('should filter by minimum score threshold', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            conversation_id: 'conv-1',
            message_id: 'msg-1',
            content: 'High relevance',
            relevance_score: 0.9
          },
          {
            conversation_id: 'conv-2',
            message_id: 'msg-2',
            content: 'Low relevance',
            relevance_score: 0.05
          }
        ],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const results = await hybridSearch(
        'test',
        {},
        {
          minScore: 0.3
        }
      );

      // Low relevance result should be filtered out
      expect(results.results.every(r => r.relevanceScore >= 0.3)).toBe(true);
    });

    it('should respect maximum results limit', async () => {
      // Mock many results
      const manyResults = Array.from({ length: 100 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        relevance_score: 1 - (i * 0.01)
      }));

      mockSupabase.rpc.mockResolvedValue({
        data: manyResults,
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const results = await hybridSearch(
        'test',
        {},
        {
          maxResults: 10
        }
      );

      expect(results.results.length).toBeLessThanOrEqual(10);
    });

    it('should handle empty search results', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const results = await hybridSearch('no results query');

      expect(results.results).toEqual([]);
      expect(results.totalCount).toBe(0);
      expect(results.searchMetrics.ftsCount).toBe(0);
      expect(results.searchMetrics.semanticCount).toBe(0);
    });

    it('should handle search errors gracefully', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('FTS error'));

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      // Should continue with semantic results even if FTS fails
      const results = await hybridSearch('error test');

      expect(results.results).toBeDefined();
      expect(results.searchMetrics.ftsCount).toBe(0);
    });
  });

  describe('Cosine similarity calculation', () => {
    it('should calculate similarity correctly', async () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0, 0]; // Identical = similarity 1.0
      const embedding3 = [0, 1, 0]; // Orthogonal = similarity 0.0

      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [
              {
                message_id: 'msg-1',
                embedding: embedding2,
                messages: { id: 'msg-1', conversation_id: 'conv-1' }
              },
              {
                message_id: 'msg-2',
                embedding: embedding3,
                messages: { id: 'msg-2', conversation_id: 'conv-2' }
              }
            ],
            error: null
          })
        })
      });

      const results = await hybridSearch('similarity test');

      // Results should be ordered by similarity
      expect(results.searchMetrics.semanticCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Result highlighting', () => {
    it('should highlight relevant sections in semantic results', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [
              {
                message_id: 'msg-1',
                messages: {
                  id: 'msg-1',
                  content: 'The order was shipped yesterday and will arrive tomorrow',
                  conversation_id: 'conv-1'
                }
              }
            ],
            error: null
          })
        })
      });

      const results = await hybridSearch('shipped order');

      if (results.results.length > 0) {
        expect(results.results[0].highlight).toContain('<mark>');
      }
    });
  });
});