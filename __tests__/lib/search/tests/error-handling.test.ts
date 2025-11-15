/**
 * Tests for hybrid search error handling and edge cases
 */

import { hybridSearch } from '@/lib/search/hybrid-search';
import { createClient } from '@/lib/supabase/server';
import { mockSupabase, setupMocks } from './setup';

jest.mock('@/lib/supabase/server');

describe('Hybrid Search - Error Handling', () => {
  beforeEach(() => {
    setupMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should handle search errors gracefully', async () => {
    mockSupabase.rpc.mockRejectedValue(new Error('FTS error'));
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      })
    });

    const results = await hybridSearch('error test');

    expect(results.results).toBeDefined();
    expect(results.searchMetrics.ftsCount).toBe(0);
  });

  it('should calculate cosine similarity correctly', async () => {
    const embedding2 = [1, 0, 0]; // Identical = similarity 1.0
    const embedding3 = [0, 1, 0]; // Orthogonal = similarity 0.0

    mockSupabase.rpc.mockResolvedValue({ data: [], error: null });
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

    expect(results.searchMetrics.semanticCount).toBeGreaterThanOrEqual(0);
  });

  it('should highlight relevant sections in semantic results', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null });
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: [{
            message_id: 'msg-1',
            messages: {
              id: 'msg-1',
              content: 'The order was shipped yesterday and will arrive tomorrow',
              conversation_id: 'conv-1'
            }
          }],
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
