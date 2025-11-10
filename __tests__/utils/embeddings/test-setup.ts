/**
 * Common test setup for search orchestrator tests
 * Mocks all dependencies and provides initialization helpers
 */

import { jest } from '@jest/globals';

// Create mock functions before importing
export const mockCreateServiceRoleClient = jest.fn();
export const mockGetSearchCacheManager = jest.fn();
export const mockPerformKeywordSearch = jest.fn();
export const mockPerformVectorSearch = jest.fn();
export const mockPerformFallbackSearch = jest.fn();

// Setup all mocks
export const setupAllMocks = () => {
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
};
