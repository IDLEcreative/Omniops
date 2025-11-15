/**
 * Full-Text Search Tests
 * Tests PostgreSQL full-text search functionality
 */

import { searchConversations, fullTextSearch } from '@/lib/search/conversation-search';
import { createClient } from '@/lib/supabase/server';
import {
  mockSupabase,
  createMockRPCResponse,
  createMockFromResponse,
  createMockMessage
} from './helpers/test-helpers';

jest.mock('@/lib/supabase/server');

describe('Conversation Search - Full-Text Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should handle full-text search only', async () => {
    const message = createMockMessage({
      conversation_id: 'conv-2',
      message_id: 'msg-2',
      content: 'Another test message',
      role: 'assistant',
      created_at: '2024-01-02T00:00:00Z',
      sentiment: 'neutral',
      relevance_score: 0.8,
      highlight: 'Another <mark>test</mark> message'
    });

    mockSupabase.rpc.mockResolvedValue(createMockRPCResponse([message]));
    mockSupabase.from.mockReturnValue(createMockFromResponse([]));

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

  it('should perform PostgreSQL full-text search', async () => {
    const message = createMockMessage({
      conversation_id: 'conv-3',
      message_id: 'msg-3',
      content: 'Full text search test',
      role: 'user',
      created_at: '2024-01-03T00:00:00Z',
      sentiment: 'positive',
      relevance_score: 0.95,
      highlight: '<mark>Full text search</mark> test'
    });

    mockSupabase.rpc.mockResolvedValue(createMockRPCResponse([message]));
    mockSupabase.from.mockReturnValue(createMockFromResponse([]));

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
