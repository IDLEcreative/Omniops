/**
 * Shared mock setup for search orchestrator tests
 * Provides reusable mock factories for common dependencies
 */

import { jest } from '@jest/globals';

export const createMockSupabaseClient = () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
});

export const createMockCacheManager = () => ({
  getCachedResult: jest.fn().mockResolvedValue(null),
  cacheResult: jest.fn().mockResolvedValue(undefined),
  trackCacheAccess: jest.fn().mockResolvedValue(undefined),
});

export const createMockDomainCacheStats = () => ({
  cacheSize: 100,
  hits: 80,
  misses: 20,
  hitRate: '80.00%',
  avgLookupTime: '5.23ms',
  entries: [],
});

export const setupSearchMocks = (
  mockPerformKeywordSearch: jest.Mock,
  mockPerformVectorSearch: jest.Mock,
  mockPerformFallbackSearch: jest.Mock
) => {
  mockPerformKeywordSearch.mockResolvedValue(null);
  mockPerformVectorSearch.mockResolvedValue([]);
  mockPerformFallbackSearch.mockResolvedValue([]);
};

export const createMockVectorSearchResult = () => [
  {
    content: 'Test content',
    url: 'https://example.com/page',
    title: 'Test Page',
    similarity: 0.85,
    searchMethod: 'vector' as const,
  },
];
