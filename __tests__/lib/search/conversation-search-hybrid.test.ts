/**
 * Hybrid Search Tests (Full-Text + Semantic)
 * Tests for combined search functionality
 */

import { searchConversations } from '@/lib/search/conversation-search';
import { createClient } from '@/lib/supabase/server';
import {
  mockSupabase,
  createMockRPCResponse,
  createMockFromResponse,
  createMockMessage,
  createMockConversationDetails
} from './helpers/test-helpers';

jest.mock('@/lib/supabase/server');

describe('Conversation Search - Hybrid Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should perform hybrid search by default', async () => {
    mockSupabase.rpc.mockResolvedValue(
      createMockRPCResponse([createMockMessage()])
    );

    mockSupabase.from.mockReturnValue(
      createMockFromResponse([createMockConversationDetails()])
    );

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

  it('should apply filters correctly', async () => {
    mockSupabase.rpc.mockResolvedValue(createMockRPCResponse([]));

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

    mockSupabase.rpc.mockResolvedValue(createMockRPCResponse([]));

    await searchConversations({
      query: 'analytics test',
      limit: 50,
      offset: 0,
      searchType: 'hybrid'
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('search_queries');
  });
});
