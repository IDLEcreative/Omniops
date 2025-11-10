/**
 * Tier 1: Standard Cache Lookup Tests
 * Tests direct domain cache lookup functionality
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

describe('Tier 1: Standard Cache Lookup', () => {
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

  it('should find domain on first cache hit', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-123');

    const result = await searchSimilarContentOptimized('test query', 'example.com', 10);

    expect(domainCache.getDomainId).toHaveBeenCalledWith('example.com');
    expect(mockSupabase.from).not.toHaveBeenCalledWith('customer_configs');
    expect(result).toEqual([]);
  });

  it('should find domain with www prefix', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-456');

    const result = await searchSimilarContentOptimized('test query', 'www.example.com', 10);

    expect(domainCache.getDomainId).toHaveBeenCalledWith('example.com');
    expect(mockSupabase.from).not.toHaveBeenCalledWith('customer_configs');
  });

  it('should log cache stats on cache hit', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    (domainCache.getDomainId as jest.Mock).mockResolvedValueOnce('domain-789');

    await searchSimilarContentOptimized('test query', 'example.com', 10);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[Search] Domain lookup started',
      expect.objectContaining({
        originalDomain: 'example.com',
        searchDomain: 'example.com',
        cacheSize: 100,
        cacheHitRate: '80.00%',
      })
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[Search] Domain lookup succeeded',
      expect.objectContaining({
        domainId: 'domain-789',
        method: 'cache-hit',
      })
    );

    consoleLogSpy.mockRestore();
  });
});
