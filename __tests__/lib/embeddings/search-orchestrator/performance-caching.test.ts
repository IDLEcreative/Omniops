/**
 * Performance and Caching Tests
 * Tests performance characteristics and caching behavior
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

describe('Performance and Caching', () => {
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

  it('should track cache stats correctly', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-stats-123');

    await searchSimilarContentOptimized('test', 'example.com', 10);

    expect(domainCache.getStats).toHaveBeenCalled();
  });

  it('should skip database query if domain found in cache', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-cached-123');

    await searchSimilarContentOptimized('test', 'example.com', 10);

    expect(mockSupabase.from).toHaveBeenCalledTimes(0);
  });

  it('should prefer cache over database for performance', async () => {
    const startTime = Date.now();
    (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-fast-123');

    await searchSimilarContentOptimized('test', 'example.com', 10);

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(100);
  });
});
