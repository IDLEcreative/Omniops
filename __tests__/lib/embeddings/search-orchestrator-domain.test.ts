/**
 * Unit tests for domain lookup fallback logic in search-orchestrator.ts
 * Tests the three-tier fallback system:
 * 1. Domain cache lookup
 * 2. Alternative domain format cache lookups
 * 3. Direct database query with fuzzy matching
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Create mock functions before importing
const mockCreateServiceRoleClient = jest.fn();
const mockGetSearchCacheManager = jest.fn();
const mockPerformKeywordSearch = jest.fn();
const mockPerformVectorSearch = jest.fn();
const mockPerformFallbackSearch = jest.fn();

// Mock all dependencies
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
  performFallbackSearch: mockPerformFallbackSearch,
}));

// Import after mocking
import { searchSimilarContentOptimized } from '@/lib/embeddings/search-orchestrator';
import { domainCache } from '@/lib/domain-cache';

describe('searchSimilarContentOptimized - Domain Lookup Fallback', () => {
  let mockSupabase: any;
  let mockCacheManager: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Mock Supabase client with chainable methods
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase);

    // Mock search cache manager
    mockCacheManager = {
      getCachedResult: jest.fn().mockResolvedValue(null), // No cache hit by default
      cacheResult: jest.fn().mockResolvedValue(undefined),
      trackCacheAccess: jest.fn().mockResolvedValue(undefined),
    };

    mockGetSearchCacheManager.mockReturnValue(mockCacheManager);

    // Mock domain cache service
    (domainCache as any).getDomainId = jest.fn();
    (domainCache as any).getStats = jest.fn(() => ({
      cacheSize: 100,
      hits: 80,
      misses: 20,
      hitRate: '80.00%',
      avgLookupTime: '5.23ms',
      entries: [],
    }));

    // Mock search functions to return empty results (we're testing domain lookup only)
    mockPerformKeywordSearch.mockResolvedValue(null);
    mockPerformVectorSearch.mockResolvedValue([]);
  });

  describe('Tier 1: Standard Cache Lookup', () => {
    it('should find domain on first cache hit', async () => {
      (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-123');

      const result = await searchSimilarContentOptimized('test query', 'example.com', 10);

      // Verify first call was with correct domain
      expect(domainCache.getDomainId).toHaveBeenCalledWith('example.com');
      // Verify DB was NOT queried (domain found in cache)
      expect(mockSupabase.from).not.toHaveBeenCalledWith('customer_configs');
      expect(result).toEqual([]);
    });

    it('should find domain with www prefix', async () => {
      (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-456');

      const result = await searchSimilarContentOptimized('test query', 'www.example.com', 10);

      // Verify domain was called with www removed
      expect(domainCache.getDomainId).toHaveBeenCalledWith('example.com');
      // Verify DB was NOT queried
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

  describe('Tier 2: Alternative Domain Format Cache Lookups', () => {
    it('should try alternative domain formats on cache miss', async () => {
      // First call (example.com) returns null
      // Second call (www.example.com) returns domain ID
      (domainCache.getDomainId as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce('domain-alt-123');

      const result = await searchSimilarContentOptimized('test', 'example.com', 10);

      expect((domainCache.getDomainId as jest.Mock)).toHaveBeenCalledWith('example.com');
      expect((domainCache.getDomainId as jest.Mock)).toHaveBeenCalledWith('www.example.com');
      expect(mockSupabase.from).not.toHaveBeenCalledWith('customer_configs'); // Found in alternatives
    });

    it('should try all alternative formats in order', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      // All cache lookups fail
      (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);

      // DB lookup also fails
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
        expect(alternatives.length).toBe(uniqueAlternatives.size); // No duplicates
      }

      consoleLogSpy.mockRestore();
    });

    it('should stop trying alternatives once domain is found', async () => {
      // First two calls fail, third succeeds
      (domainCache.getDomainId as jest.Mock)
        .mockResolvedValueOnce(null) // example.com fails
        .mockResolvedValueOnce(null) // example.com (original) fails
        .mockResolvedValueOnce('domain-found'); // Third alternative succeeds

      await searchSimilarContentOptimized('test', 'example.com', 10);

      // Should stop after finding domain, not try all alternatives
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

  describe('Tier 3: Direct Database Lookup with Fuzzy Matching', () => {
    it('should use direct database lookup when cache exhausted', async () => {
      (domainCache.getDomainId as jest.Mock).mockResolvedValue(null); // All cache lookups fail
      mockSupabase.single.mockResolvedValue({
        data: { id: 'domain-db-123', domain: 'example.com' },
        error: null,
      });

      const result = await searchSimilarContentOptimized('test', 'example.com', 10);

      expect(mockSupabase.from).toHaveBeenCalledWith('customer_configs');
      expect(mockSupabase.select).toHaveBeenCalledWith('id, domain');
      expect(mockSupabase.or).toHaveBeenCalledWith(
        'domain.ilike.%example.com%,domain.ilike.%example.com%'
      );
      expect(mockSupabase.eq).toHaveBeenCalledWith('active', true);
      expect(mockSupabase.limit).toHaveBeenCalledWith(1);
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it('should use fuzzy matching with ILIKE for similar domains', async () => {
      (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({
        data: { id: 'domain-fuzzy-123', domain: 'www.example.com' },
        error: null,
      });

      await searchSimilarContentOptimized('test', 'example.com', 10);

      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining('ilike.%example.com%')
      );
    });

    it('should try all fallback tiers before direct DB query', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({
        data: { id: 'domain-final-123', domain: 'example.com' },
        error: null,
      });

      await searchSimilarContentOptimized('test', 'example.com', 10);

      // Verify order of attempts
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
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      });

      const result = await searchSimilarContentOptimized('test', 'example.com', 10);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Search] Direct database query error:',
        expect.any(Error)
      );
      expect(result).toEqual([]);

      consoleErrorSpy.mockRestore();
    });

    it('should handle PGRST116 (not found) error as expected', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      await searchSimilarContentOptimized('test', 'example.com', 10);

      // Should not log PGRST116 as error (it's expected)
      const errorLogs = consoleErrorSpy.mock.calls.filter(
        (call) => call[0]?.includes('Direct database query error')
      );
      expect(errorLogs.length).toBe(0);

      consoleErrorSpy.mockRestore();
    });

    it('should log successful direct database lookup', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({
        data: { id: 'domain-db-456', domain: 'www.example.com' },
        error: null,
      });

      await searchSimilarContentOptimized('test', 'example.com', 10);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Search] Domain found via direct database lookup:',
        expect.objectContaining({
          domainId: 'domain-db-456',
          matchedDomain: 'www.example.com',
          method: 'direct-db-fuzzy',
        })
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Search] Caching direct database lookup result for future requests'
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('Complete Fallback Chain', () => {
    it('should return empty array after exhausting all options', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      (domainCache.getDomainId as jest.Mock).mockResolvedValue(null); // All cache lookups fail
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

      // Verify expected log sequence
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

    it('should proceed with search if domain is found via any tier', async () => {
      // Domain found via direct DB lookup (cache exhausted)
      (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({
        data: { id: 'domain-db-success', domain: 'example.com' },
        error: null,
      });

      // Keyword search returns null (short query optimization disabled)
      mockPerformKeywordSearch.mockResolvedValue(null);

      // Vector search returns results
      const mockResults = [
        {
          content: 'Test content',
          url: 'https://example.com/page',
          title: 'Test Page',
          similarity: 0.85,
          searchMethod: 'vector' as const,
        },
      ];
      mockPerformVectorSearch.mockResolvedValue(mockResults);

      const result = await searchSimilarContentOptimized('test', 'example.com', 10);

      // Verify vector search was called with correct domain ID
      expect(mockPerformVectorSearch).toHaveBeenCalledWith(
        mockSupabase,
        'domain-db-success',
        'test',
        10,
        expect.any(Number),
        'example.com'
      );

      expect(result).toEqual(mockResults);
    });
  });

  describe('Edge Cases', () => {
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

      // The orchestrator passes the domain as-is, www is removed but https:// is not
      expect((domainCache.getDomainId as jest.Mock)).toHaveBeenCalledWith('https://example.com');
    });

    it('should handle very long domain names', async () => {
      const longDomain = 'very.long.subdomain.example.com';
      // Cache miss to trigger DB lookup
      (domainCache.getDomainId as jest.Mock).mockResolvedValue(null);
      mockSupabase.single.mockResolvedValue({
        data: { id: 'domain-long-123', domain: longDomain },
        error: null,
      });

      const result = await searchSimilarContentOptimized('test', longDomain, 10);

      // Verify DB query was called with long domain
      expect(mockSupabase.from).toHaveBeenCalledWith('customer_configs');
      expect(mockSupabase.or).toHaveBeenCalledWith(
        expect.stringContaining(longDomain)
      );
    });

    it('should handle Supabase client creation failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCreateServiceRoleClient.mockResolvedValueOnce(null);

      const result = await searchSimilarContentOptimized('test', 'example.com', 10);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to create Supabase client');
      expect(result).toEqual([]);

      consoleErrorSpy.mockRestore();
    });

    it('should handle concurrent lookups for same domain', async () => {
      (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-concurrent-123');

      // Simulate concurrent requests
      const results = await Promise.all([
        searchSimilarContentOptimized('test1', 'example.com', 10),
        searchSimilarContentOptimized('test2', 'example.com', 10),
        searchSimilarContentOptimized('test3', 'example.com', 10),
      ]);

      // Domain cache should handle deduplication internally
      expect(results).toHaveLength(3);
    });
  });

  describe('Performance and Caching', () => {
    it('should track cache stats correctly', async () => {
      (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-stats-123');

      await searchSimilarContentOptimized('test', 'example.com', 10);

      expect(domainCache.getStats).toHaveBeenCalled();
    });

    it('should skip database query if domain found in cache', async () => {
      (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-cached-123');

      await searchSimilarContentOptimized('test', 'example.com', 10);

      // Verify database was NOT queried
      expect(mockSupabase.from).toHaveBeenCalledTimes(0);
    });

    it('should prefer cache over database for performance', async () => {
      const startTime = Date.now();
      (domainCache.getDomainId as jest.Mock).mockResolvedValue('domain-fast-123');

      await searchSimilarContentOptimized('test', 'example.com', 10);

      const duration = Date.now() - startTime;

      // Cache lookup should be fast (<100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
