/**
 * Recommendation Engine Mock Setup Utilities
 *
 * Provides reusable mock setup and factory functions for recommendation engine tests.
 */

import { jest } from '@jest/globals';

/**
 * Create a chainable mock Supabase client with common methods
 */
export function createMockSupabaseClient() {
  return {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    rpc: jest.fn(),
  };
}

/**
 * Get all mocked algorithm functions
 */
export function getAlgorithmMocks() {
  return {
    vectorSimilarity: jest.requireMock(
      '@/lib/recommendations/vector-similarity'
    ).vectorSimilarityRecommendations,
    collaborativeFilter: jest.requireMock(
      '@/lib/recommendations/collaborative-filter'
    ).collaborativeFilterRecommendations,
    contentBased: jest.requireMock('@/lib/recommendations/content-filter')
      .contentBasedRecommendations,
    hybridRanker: jest.requireMock('@/lib/recommendations/hybrid-ranker')
      .hybridRanker,
  };
}

/**
 * Reset all algorithm mocks
 */
export function resetAlgorithmMocks() {
  const mocks = getAlgorithmMocks();
  Object.values(mocks).forEach((mock) => {
    if (mock && typeof mock.mockReset === 'function') {
      mock.mockReset();
    }
  });
}
