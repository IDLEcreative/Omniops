/**
 * Tests for hybrid search result merging and deduplication
 */

import { hybridSearch } from '@/lib/search/hybrid-search';
import { createClient } from '@/lib/supabase/server';
import { mockSupabase, setupMocks, sampleFtsResults, sampleSemanticResults } from './setup';

jest.mock('@/lib/supabase/server');

describe('Hybrid Search - Result Merging', () => {
  beforeEach(() => {
    setupMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should combine FTS and semantic search results', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: sampleFtsResults, error: null });
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: sampleSemanticResults, error: null })
      })
    });

    const results = await hybridSearch('shipping problems');

    expect(results.results).toHaveLength(3);
    expect(results.searchMetrics.ftsCount).toBe(2);
    expect(results.searchMetrics.semanticCount).toBe(2);
    expect(results.searchMetrics.mergedCount).toBe(3);
  });

  it('should deduplicate results by message ID', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [{
        conversation_id: 'conv-1',
        message_id: 'msg-duplicate',
        content: 'Duplicate message',
        relevance_score: 0.8
      }],
      error: null
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({
          data: [{
            message_id: 'msg-duplicate',
            messages: {
              id: 'msg-duplicate',
              content: 'Duplicate message',
              conversation_id: 'conv-1'
            }
          }],
          error: null
        })
      })
    });

    const results = await hybridSearch('duplicate');

    expect(results.results.length).toBe(1);
    expect(results.results[0].messageId).toBe('msg-duplicate');
    expect(results.searchMetrics.deduplicatedCount).toBe(1);
  });

  it('should handle empty search results', async () => {
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null });
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      })
    });

    const results = await hybridSearch('no results query');

    expect(results.results).toEqual([]);
    expect(results.totalCount).toBe(0);
    expect(results.searchMetrics.ftsCount).toBe(0);
    expect(results.searchMetrics.semanticCount).toBe(0);
  });
});
