/**
 * Complete Fallback Chain Tests
 * Tests the entire three-tier fallback system working together
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

describe('Complete Fallback Chain', () => {
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

  it('should return empty array after exhausting all options', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });

    const result = await searchSimilarContentOptimized('test', 'nonexistent.com', 10);

    expect(result).toEqual([]);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[Search] Domain lookup failed after exhausting all options:',
      expect.objectContaining({
        originalDomain: 'nonexistent.com',
        searchDomain: 'nonexistent.com',
        attemptedMethods: ['cache', 'alternative-formats', 'direct-db-fuzzy'],
        cacheSize: 100,
      })
    );

    consoleLogSpy.mockRestore();
  });

  it('should log all fallback attempts in order', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

    await searchSimilarContentOptimized('test', 'example.com', 10);

    const logs = consoleLogSpy.mock.calls.map((call) => call[0]);

    expect(logs).toContain('[Search] Domain lookup started');
    expect(logs.some(log => typeof log === 'string' && log.includes('Cache lookup failed'))).toBe(true);
    expect(logs.some(log => typeof log === 'string' && log.includes('Trying alternative domain formats'))).toBe(true);
    expect(logs.some(log => typeof log === 'string' && log.includes('Cache exhausted, trying direct database lookup'))).toBe(true);
    expect(logs.some(log => typeof log === 'string' && log.includes('Domain lookup failed after exhausting all options'))).toBe(true);

    consoleLogSpy.mockRestore();
  });

  it('should handle database connection failure', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
    mockSupabase.single.mockRejectedValue(new Error('Connection timeout'));

    const result = await searchSimilarContentOptimized('test', 'example.com', 10);

    expect(result).toEqual([]);
  });

  it('should proceed with search if domain is found via cache', async () => {
    (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-cache-success');

    const result = await searchSimilarContentOptimized('test', 'example.com', 10);

    // Verify search completed and domain was found
    expect(domainCache.getDomainId).toHaveBeenCalled();
    expect(result).toBeDefined();
  });
});
