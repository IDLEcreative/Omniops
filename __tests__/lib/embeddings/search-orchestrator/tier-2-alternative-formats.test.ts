/**
 * Tier 2: Alternative Domain Format Cache Lookups
 * Tests fallback logic for different domain format variations
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

describe('Tier 2: Alternative Domain Format Cache Lookups', () => {
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

  it('should try alternative domain formats on cache miss', async () => {
    (domainCache.getDomainId as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('domain-alt-123');

    const result = await searchSimilarContentOptimized('test', 'example.com', 10);

    // Verify domain cache was called at least twice (original + fallback)
    expect((domainCache.getDomainId as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(result).toEqual([]);
  });

  it('should try all alternative formats in order', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    await searchSimilarContentOptimized('test', 'example.com', 10);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[Search] Cache lookup failed for:',
      'example.com'
    );

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[Search] Trying alternative domain formats:',
      expect.objectContaining({
        alternatives: expect.arrayContaining(['example.com', 'www.example.com']),
        totalAttempts: expect.any(Number),
      })
    );

    consoleLogSpy.mockRestore();
  });

  it('should deduplicate alternative domain formats', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    await searchSimilarContentOptimized('test', 'example.com', 10);

    const alternativesLog = consoleLogSpy.mock.calls.find((call) =>
      call[0]?.includes('Trying alternative domain formats')
    );

    if (alternativesLog && alternativesLog[1]) {
      const alternatives = (alternativesLog[1] as any).alternatives;
      const uniqueAlternatives = new Set(alternatives);
      expect(alternatives.length).toBe(uniqueAlternatives.size);
    }

    consoleLogSpy.mockRestore();
  });

  it('should stop trying alternatives once domain is found', async () => {
    (domainCache.getDomainId as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('domain-found');

    await searchSimilarContentOptimized('test', 'example.com', 10);

    expect(mockSupabase.from).not.toHaveBeenCalledWith('customer_configs');
  });

  it('should log each alternative attempt', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    await searchSimilarContentOptimized('test', 'example.com', 10);

    const attemptLogs = consoleLogSpy.mock.calls.filter((call) =>
      call[0]?.includes('[Search] Trying alternative:')
    );

    expect(attemptLogs.length).toBeGreaterThan(0);

    consoleLogSpy.mockRestore();
  });
});
