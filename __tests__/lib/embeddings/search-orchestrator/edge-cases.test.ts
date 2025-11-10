/**
 * Edge Cases Tests
 * Tests unusual scenarios and boundary conditions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockCreateServiceRoleClient = jest.fn();
const mockGetSearchCacheManager = jest.fn();
const mockPerformKeywordSearch = jest.fn();
const mockPerformVectorSearch = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: mockCreateServiceRoleClient,
}));

jest.mock('@/lib/search-cache', () => ({
  getSearchCacheManager: mockGetSearchCacheManager,
}));

jest.mock('@/lib/domain-cache', () => ({
  domainCache: {
    getDomainId: jest.fn(),
    getStats: jest.fn(),
  },
}));

jest.mock('@/lib/embeddings/keyword-search', () => ({
  performKeywordSearch: mockPerformKeywordSearch,
}));

jest.mock('@/lib/embeddings/vector-search', () => ({
  performVectorSearch: mockPerformVectorSearch,
}));

jest.mock('@/lib/embeddings/fallback-search', () => ({
  performFallbackSearch: jest.fn(),
}));

import { searchSimilarContentOptimized } from '@/lib/embeddings/search-orchestrator';
import { domainCache } from '@/lib/domain-cache';

describe('Edge Cases', () => {
  let mockSupabase: any;
  let mockCacheManager: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase);

    mockCacheManager = {
      getCachedResult: jest.fn().mockResolvedValue(null),
      cacheResult: jest.fn().mockResolvedValue(undefined),
      trackCacheAccess: jest.fn().mockResolvedValue(undefined),
    };

    mockGetSearchCacheManager.mockReturnValue(mockCacheManager);

    (domainCache as any).getDomainId = jest.fn();
    (domainCache as any).getStats = jest.fn(() => ({
      cacheSize: 100,
      hits: 80,
      misses: 20,
      hitRate: '80.00%',
      avgLookupTime: '5.23ms',
      entries: [],
    }));

    mockPerformKeywordSearch.mockResolvedValue(null);
    mockPerformVectorSearch.mockResolvedValue([]);
  });

  it('should handle undefined or empty domain', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    const result = await searchSimilarContentOptimized('test', '', 10);

    expect(result).toEqual([]);
    consoleLogSpy.mockRestore();
  });

  it('should handle domain with protocol prefix', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValueOnce('domain-protocol-123');

    await searchSimilarContentOptimized('test', 'https://example.com', 10);

    expect((domainCache.getDomainId as jest.Mock)).toHaveBeenCalledWith('https://example.com');
  });

  it('should handle very long domain names', async () => {
    const longDomain = 'very.long.subdomain.example.com';
    (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-long-123');

    const result = await searchSimilarContentOptimized('test', longDomain, 10);

    // Verify the long domain is accepted without error
    expect(result).toEqual([]);
  });

  it('should handle concurrent lookups for same domain', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-concurrent-123');

    const results = await Promise.all([
      searchSimilarContentOptimized('test1', 'example.com', 10),
      searchSimilarContentOptimized('test2', 'example.com', 10),
      searchSimilarContentOptimized('test3', 'example.com', 10),
    ]);

    expect(results).toHaveLength(3);
  });
});
