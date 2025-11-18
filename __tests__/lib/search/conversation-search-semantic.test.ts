/**
 * Semantic Search Tests
 * Tests vector similarity search functionality
 */

import { semanticSearch } from '@/lib/search/conversation-search';
import { createClient } from '@/lib/supabase/server';
import { mockSupabase } from './helpers/test-helpers';

jest.mock('@/lib/supabase/server');

// TEMPORARY: Skipped due to Supabase mocking issue - needs refactoring
describe('Conversation Search - Semantic Mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

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
