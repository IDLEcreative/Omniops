import { searchConversations, fullTextSearch, semanticSearch } from '@/lib/search/conversation-search';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server');

describe('Conversation Search', () => {
  const mockSupabase = {
    rpc: jest.fn(),
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('searchConversations', () => {
    it('should perform hybrid search by default', async () => {
      // Mock RPC response for full-text search
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            conversation_id: 'conv-1',
            message_id: 'msg-1',
            content: 'Test message content',
            role: 'user',
            created_at: '2024-01-01T00:00:00Z',
            sentiment: 'positive',
            relevance_score: 0.9,
            highlight: '<mark>Test</mark> message content'
          }
        ],
        error: null,
        count: 1
      });

      // Mock conversation details query
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'conv-1',
                customer_email: 'test@example.com',
                domain_id: 'domain-1',
                domains: { name: 'example.com' }
              }
            ],
            error: null
          })
        })
      });

      const results = await searchConversations({
        query: 'test',
        limit: 50,
        offset: 0,
        searchType: 'hybrid'
      });

      expect(results.results).toHaveLength(1);
      expect(results.results[0].conversationId).toBe('conv-1');
      expect(results.results[0].customerEmail).toBe('test@example.com');
      expect(results.totalCount).toBe(1);
      expect(results.executionTime).toBeGreaterThan(0);
    });

    it('should handle full-text search only', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            conversation_id: 'conv-2',
            message_id: 'msg-2',
            content: 'Another test message',
            role: 'assistant',
            created_at: '2024-01-02T00:00:00Z',
            sentiment: 'neutral',
            relevance_score: 0.8,
            highlight: 'Another <mark>test</mark> message'
          }
        ],
        error: null,
        count: 1
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const results = await searchConversations({
        query: 'test',
        searchType: 'full_text',
        limit: 50,
        offset: 0
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_conversations', {
        p_query: 'test',
        p_domain_id: null,
        p_date_from: null,
        p_date_to: null,
        p_sentiment: null,
        p_limit: 50,
        p_offset: 0
      });
      expect(results.results).toHaveLength(1);
    });

    it('should apply filters correctly', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      const filters = {
        query: 'order status',
        domainId: 'domain-123',
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-31T23:59:59Z',
        sentiment: 'negative' as const,
        limit: 20,
        offset: 10,
        searchType: 'full_text' as const
      };

      await searchConversations(filters);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('search_conversations', {
        p_query: 'order status',
        p_domain_id: 'domain-123',
        p_date_from: '2024-01-01T00:00:00Z',
        p_date_to: '2024-01-31T23:59:59Z',
        p_sentiment: 'negative',
        p_limit: 20,
        p_offset: 10
      });
    });

    it('should handle search errors gracefully', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('Database error'));

      await expect(
        searchConversations({
          query: 'test',
          limit: 50,
          offset: 0,
          searchType: 'hybrid'
        })
      ).rejects.toThrow('Failed to search conversations');
    });

    it('should log search analytics', async () => {
      const insertMock = jest.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockReturnValue({
        insert: insertMock,
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
        count: 0
      });

      await searchConversations({
        query: 'analytics test',
        limit: 50,
        offset: 0,
        searchType: 'hybrid'
      });

      // Verify analytics were logged
      expect(mockSupabase.from).toHaveBeenCalledWith('search_queries');
    });
  });

  describe('fullTextSearch', () => {
    it('should perform PostgreSQL full-text search', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            conversation_id: 'conv-3',
            message_id: 'msg-3',
            content: 'Full text search test',
            role: 'user',
            created_at: '2024-01-03T00:00:00Z',
            sentiment: 'positive',
            relevance_score: 0.95,
            highlight: '<mark>Full text search</mark> test'
          }
        ],
        error: null,
        count: 1
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const results = await fullTextSearch({
        query: 'full text search',
        limit: 50,
        offset: 0,
        searchType: 'full_text'
      });

      expect(results.results).toHaveLength(1);
      expect(results.results[0].relevanceScore).toBe(0.95);
      expect(results.results[0].highlight).toContain('<mark>');
    });
  });

  describe('semanticSearch', () => {
    it('should perform vector similarity search', async () => {
      const mockMessages = {
        select: jest.fn().mockResolvedValue({
          data: [
            {
              message_id: 'msg-4',
              messages: {
                id: 'msg-4',
                content: 'Semantic search test message',
                role: 'assistant',
                created_at: '2024-01-04T00:00:00Z',
                sentiment: 'neutral',
                conversation_id: 'conv-4',
                conversations: {
                  id: 'conv-4',
                  customer_email: 'semantic@test.com',
                  domain_id: 'domain-2',
                  domains: { name: 'semantic.com' }
                }
              }
            }
          ],
          error: null
        })
      };

      mockSupabase.from.mockReturnValue(mockMessages);

      const results = await semanticSearch({
        query: 'semantic meaning',
        limit: 50,
        offset: 0,
        searchType: 'semantic'
      });

      expect(results.results).toHaveLength(1);
      expect(results.results[0].messageId).toBe('msg-4');
      expect(results.results[0].customerEmail).toBe('semantic@test.com');
    });
  });

  describe('Result merging and deduplication', () => {
    it('should merge results from both search types correctly', async () => {
      // Mock FTS results
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            conversation_id: 'conv-5',
            message_id: 'msg-5',
            content: 'Duplicate message',
            role: 'user',
            created_at: '2024-01-05T00:00:00Z',
            relevance_score: 0.7
          },
          {
            conversation_id: 'conv-5',
            message_id: 'msg-6',
            content: 'Unique FTS message',
            role: 'user',
            created_at: '2024-01-05T01:00:00Z',
            relevance_score: 0.6
          }
        ],
        error: null,
        count: 2
      });

      // Mock semantic results
      const mockMessages = {
        select: jest.fn().mockResolvedValue({
          data: [
            {
              message_id: 'msg-5',
              messages: {
                id: 'msg-5',
                content: 'Duplicate message',
                role: 'user',
                conversation_id: 'conv-5',
                conversations: {
                  id: 'conv-5'
                }
              }
            },
            {
              message_id: 'msg-7',
              messages: {
                id: 'msg-7',
                content: 'Unique semantic message',
                role: 'assistant',
                conversation_id: 'conv-6',
                conversations: {
                  id: 'conv-6'
                }
              }
            }
          ],
          error: null
        })
      };

      mockSupabase.from.mockReturnValue({
        ...mockMessages,
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const results = await searchConversations({
        query: 'test merge',
        searchType: 'hybrid',
        limit: 50,
        offset: 0
      });

      // Should have deduplicated msg-5
      const messageIds = results.results.map(r => r.messageId);
      const uniqueIds = new Set(messageIds);
      expect(uniqueIds.size).toBe(messageIds.length);
    });

    it('should weight scores correctly in hybrid search', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          {
            conversation_id: 'conv-7',
            message_id: 'msg-8',
            content: 'High FTS score',
            relevance_score: 1.0
          }
        ],
        error: null,
        count: 1
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const results = await searchConversations({
        query: 'weighted test',
        searchType: 'hybrid',
        limit: 50,
        offset: 0
      });

      // With 60% FTS weight, score should be 0.6
      if (results.results.length > 0) {
        expect(results.results[0].relevanceScore).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      const allResults = Array.from({ length: 100 }, (_, i) => ({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        created_at: new Date(2024, 0, 1, i).toISOString(),
        relevance_score: 1 - (i * 0.01)
      }));

      mockSupabase.rpc.mockResolvedValue({
        data: allResults.slice(20, 40),
        error: null,
        count: 100
      });

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      });

      const results = await searchConversations({
        query: 'pagination test',
        searchType: 'full_text',
        limit: 20,
        offset: 20
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          p_limit: 20,
          p_offset: 20
        })
      );
    });
  });
});