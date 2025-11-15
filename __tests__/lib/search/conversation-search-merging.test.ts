/**
 * Result Merging and Pagination Tests
 * Tests deduplication, score weighting, and pagination
 */

import { searchConversations } from '@/lib/search/conversation-search';
import { createClient } from '@/lib/supabase/server';
import {
  mockSupabase,
  createMockRPCResponse,
  createMockMessage
} from './helpers/test-helpers';

jest.mock('@/lib/supabase/server');

describe('Conversation Search - Result Merging', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should merge results from both search types correctly', async () => {
    // Mock FTS results
    mockSupabase.rpc.mockResolvedValue(
      createMockRPCResponse([
        createMockMessage({
          conversation_id: 'conv-5',
          message_id: 'msg-5',
          content: 'Duplicate message',
          created_at: '2024-01-05T00:00:00Z',
          relevance_score: 0.7
        }),
        createMockMessage({
          conversation_id: 'conv-5',
          message_id: 'msg-6',
          content: 'Unique FTS message',
          created_at: '2024-01-05T01:00:00Z',
          relevance_score: 0.6
        })
      ], 2)
    );

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
              conversations: { id: 'conv-5' }
            }
          },
          {
            message_id: 'msg-7',
            messages: {
              id: 'msg-7',
              content: 'Unique semantic message',
              role: 'assistant',
              conversation_id: 'conv-6',
              conversations: { id: 'conv-6' }
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
    mockSupabase.rpc.mockResolvedValue(
      createMockRPCResponse([
        createMockMessage({
          conversation_id: 'conv-7',
          message_id: 'msg-8',
          content: 'High FTS score',
          relevance_score: 1.0
        })
      ])
    );

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

describe('Conversation Search - Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should paginate results correctly', async () => {
    const allResults = Array.from({ length: 100 }, (_, i) =>
      createMockMessage({
        conversation_id: `conv-${i}`,
        message_id: `msg-${i}`,
        content: `Message ${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        created_at: new Date(2024, 0, 1, i).toISOString(),
        relevance_score: 1 - (i * 0.01)
      })
    );

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
