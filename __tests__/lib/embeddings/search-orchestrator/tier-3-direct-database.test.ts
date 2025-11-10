/**
 * Tier 3: Direct Database Lookup with Fuzzy Matching
 * Tests fallback to direct database queries when cache is exhausted
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

describe('Tier 3: Direct Database Lookup with Fuzzy Matching', () => {
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

  it('should attempt database lookup when cache exhausted', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({
      data: { id: 'domain-db-123', domain: 'example.com' },
      error: null,
    });

    const result = await searchSimilarContentOptimized('test', 'example.com', 10);

    // Verify search completed
    expect(result).toEqual([]);
    // Verify domain cache was called
    expect((domainCache.getDomainId as jest.Mock).mock.calls.length).toBeGreaterThan(0);
  });

  it('should handle domain lookup attempts gracefully', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({
      data: { id: 'domain-fuzzy-123', domain: 'www.example.com' },
      error: null,
    });

    const result = await searchSimilarContentOptimized('test', 'example.com', 10);

    expect(result).toEqual([]);
  });

  it('should try all fallback tiers before direct DB query', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({
      data: { id: 'domain-final-123', domain: 'example.com' },
      error: null,
    });

    await searchSimilarContentOptimized('test', 'example.com', 10);

    const logs = consoleLogSpy.mock.calls.map((call) => call[0]);
    const cacheFailIndex = logs.findIndex((log) =>
      log?.includes('Cache lookup failed')
    );
    const alternativesIndex = logs.findIndex((log) =>
      log?.includes('Trying alternative domain formats')
    );
    const dbLookupIndex = logs.findIndex((log) =>
      log?.includes('Cache exhausted, trying direct database lookup')
    );

    expect(cacheFailIndex).toBeLessThan(alternativesIndex);
    expect(alternativesIndex).toBeLessThan(dbLookupIndex);

    consoleLogSpy.mockRestore();
  });

  it('should handle database lookup errors gracefully', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: new Error('Database connection failed'),
    });

    const result = await searchSimilarContentOptimized('test', 'example.com', 10);

    // Verify no exception was thrown and empty results returned
    expect(result).toEqual([]);
  });

  it('should handle PGRST116 (not found) error as expected', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    });

    await searchSimilarContentOptimized('test', 'example.com', 10);

    const errorLogs = consoleErrorSpy.mock.calls.filter(
      (call) => call[0]?.includes('Direct database query error')
    );
    expect(errorLogs.length).toBe(0);

    consoleErrorSpy.mockRestore();
  });

  it('should handle successful direct database lookup gracefully', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({
      data: { id: 'domain-db-456', domain: 'www.example.com' },
      error: null,
    });

    const result = await searchSimilarContentOptimized('test', 'example.com', 10);

    // Verify search completed without error
    expect(result).toEqual([]);
  });
});
