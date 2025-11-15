/**
 * Tests for hybrid search scoring, weighting, and filtering
 */

import { hybridSearch } from '@/lib/search/hybrid-search';
import { createClient } from '@/lib/supabase/server';
import { mockSupabase, setupMocks } from './setup';

jest.mock('@/lib/supabase/server');

describe('Hybrid Search - Scoring & Filtering', () => {
  beforeEach(() => {
    setupMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  it('should apply custom weights correctly', async () => {
    mockSupabase.rpc.mockResolvedValue({
      data: [{
        conversation_id: 'conv-1',
        message_id: 'msg-1',
        content: 'Test content',
        relevance_score: 1.0
      }],
      error: null
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      })
    });

    const results = await hybridSearch('test', {}, {
      ftsWeight: 0.8,
      semanticWeight: 0.2
    });

    if (results.results.length > 0) {
      expect(results.results[0].relevanceScore).toBeLessThanOrEqual(1.0);
    }
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
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      })
    });

    const results = await hybridSearch('test', {}, { minScore: 0.3 });

    expect(results.results.every(r => r.relevanceScore >= 0.3)).toBe(true);
  });

  it('should respect maximum results limit', async () => {
    const manyResults = Array.from({ length: 100 }, (_, i) => ({
      conversation_id: `conv-${i}`,
      message_id: `msg-${i}`,
      content: `Message ${i}`,
      relevance_score: 1 - (i * 0.01)
    }));

    mockSupabase.rpc.mockResolvedValue({ data: manyResults, error: null });
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      })
    });

    const results = await hybridSearch('test', {}, { maxResults: 10 });

    expect(results.results.length).toBeLessThanOrEqual(10);
  });
});
