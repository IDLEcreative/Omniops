/**
 * Collaborative Filter Test Helpers
 *
 * Shared utilities for CF algorithm testing including:
 * - Mock Supabase client setup
 * - Common test data fixtures
 * - Helper functions for user/product interaction simulation
 *
 * Last Updated: 2025-11-10
 * Related: __tests__/lib/recommendations/collaborative-filter/
 */

import {
  createMockSupabaseClient,
  type MockSupabaseClient,
} from '@/__tests__/utils/recommendations/supabase-mock-factory';

/**
 * Setup CF test suite with fresh mock client
 *
 * Clears all previous mocks and creates new Supabase client
 * to ensure test isolation and prevent state leakage.
 *
 * Usage:
 * ```typescript
 * beforeEach(() => {
 *   const { mockSupabase, mockCreateClient } = setupCFTestSuite();
 * });
 * ```
 */
export function setupCFTestSuite() {
  jest.clearAllMocks();

  const mockSupabase = createMockSupabaseClient();
  const supabaseModule = jest.requireMock('@/lib/supabase/server');
  supabaseModule.createClient.mockResolvedValue(mockSupabase as any);

  return { mockSupabase, supabaseModule };
}

/**
 * Creates user viewed products fixture
 *
 * Represents products a single user has viewed/interacted with.
 * Used to test user-based collaborative filtering.
 *
 * @param productCount - Number of products to generate
 * @param purchaseRate - Fraction of products that are purchased (0.0-1.0)
 */
export function createUserViewedProducts(
  productCount = 3,
  purchaseRate = 0.3
) {
  return Array.from({ length: productCount }, (_, i) => ({
    product_id: `prod-${i + 1}`,
    clicked: true,
    purchased: i < Math.floor(productCount * purchaseRate),
  }));
}

/**
 * Creates similar users fixture
 *
 * Represents multiple users with overlapping product interests.
 * Models Jaccard similarity scenarios.
 *
 * @param baseProductIds - Products the target user viewed
 * @param userCount - Number of similar users to create
 * @param overlapFraction - Fraction of baseProducts each user shares
 */
export function createSimilarUsersFixture(
  baseProductIds: string[],
  userCount = 3,
  overlapFraction = 0.6
) {
  const events = [];
  const overlapCount = Math.ceil(baseProductIds.length * overlapFraction);

  for (let u = 0; u < userCount; u++) {
    // Add overlapping products
    for (let i = 0; i < overlapCount; i++) {
      events.push({
        session_id: `session-${456 + u}`,
        product_id: baseProductIds[i],
        clicked: true,
        purchased: false,
      });
    }

    // Add unique product
    events.push({
      session_id: `session-${456 + u}`,
      product_id: `prod-unique-${u}`,
      clicked: true,
      purchased: false,
    });
  }

  return events;
}

/**
 * Creates recommendation candidates fixture
 *
 * Products from similar users that are candidates for recommendation.
 * Includes engagement metrics (click vs purchase).
 *
 * @param productIds - Product IDs to recommend
 * @param similarUserIds - Sessions that viewed these products
 */
export function createRecommendationCandidates(
  productIds: string[],
  similarUserIds: string[]
) {
  const events = [];

  for (let i = 0; i < productIds.length; i++) {
    const userIdx = i % similarUserIds.length;
    events.push({
      session_id: similarUserIds[userIdx],
      product_id: productIds[i],
      clicked: i % 2 === 0, // Alternate clicked/not clicked
      purchased: i % 3 === 0, // Some purchased
    });
  }

  return events;
}

/**
 * Test data: User with moderate product interests
 *
 * Base fixture for typical user scenarios.
 * 5 products with ~40% purchase rate.
 */
export const CF_USER_MODERATE = createUserViewedProducts(5, 0.4);

/**
 * Test data: High-engagement user
 *
 * User with many viewed products and higher purchase rate.
 */
export const CF_USER_HIGH_ENGAGEMENT = createUserViewedProducts(10, 0.6);

/**
 * Test data: Low-engagement user
 *
 * User with few viewed products and low purchase rate.
 */
export const CF_USER_LOW_ENGAGEMENT = createUserViewedProducts(2, 0.2);

/**
 * Test data: New user (cold start)
 *
 * User with no viewing history.
 */
export const CF_USER_NEW = [];

/**
 * Calculates Jaccard similarity manually for verification
 *
 * Used to verify algorithm correctness in tests.
 *
 * @param setA - User A's product set
 * @param setB - User B's product set
 * @returns Similarity score 0-1
 */
export function calculateJaccardSimilarity(
  setA: string[],
  setB: string[]
): number {
  const aSet = new Set(setA);
  const bSet = new Set(setB);

  const intersection = [...aSet].filter((x) => bSet.has(x)).length;
  const union = new Set([...aSet, ...bSet]).size;

  return union === 0 ? 0 : intersection / union;
}

/**
 * Mock setup for user similarity discovery test
 *
 * Configures three sequential Supabase calls for:
 * 1. User's viewed products
 * 2. Similar users' interactions
 * 3. Recommendations from similar users
 */
export function mockUserSimilarityQuery(
  mockSupabase: MockSupabaseClient,
  userProducts: any[],
  similarUserEvents: any[],
  recommendationEvents: any[]
) {
  mockSupabase.select.mockResolvedValueOnce({
    data: userProducts,
    error: null,
  });

  mockSupabase.select.mockResolvedValueOnce({
    data: similarUserEvents,
    error: null,
  });

  mockSupabase.select.mockResolvedValueOnce({
    data: recommendationEvents,
    error: null,
  });
}

/**
 * Assertion helper: verify recommendation structure
 *
 * @param recommendation - Recommendation object to validate
 */
export function assertRecommendationStructure(recommendation: any) {
  expect(recommendation).toHaveProperty('productId');
  expect(recommendation).toHaveProperty('score');
  expect(recommendation).toHaveProperty('algorithm', 'collaborative');
  expect(recommendation).toHaveProperty('reason');
  expect(recommendation).toHaveProperty('metadata');
  expect(typeof recommendation.score).toBe('number');
  expect(recommendation.score).toBeGreaterThanOrEqual(0);
  expect(recommendation.score).toBeLessThanOrEqual(1);
}

/**
 * Assertion helper: verify score normalization (0-1 range)
 *
 * @param scores - Array of scores to validate
 */
export function assertScoresNormalized(scores: number[]) {
  scores.forEach((score) => {
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
}
