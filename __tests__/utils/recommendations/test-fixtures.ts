/**
 * Recommendation Engine Test Fixtures
 *
 * Provides reusable test data for recommendation engine tests.
 */

/**
 * Mock recommendation with common fields
 */
export function createMockRecommendation(overrides = {}) {
  return {
    productId: 'prod-1',
    score: 0.9,
    algorithm: 'vector_similarity',
    reason: 'Similar to viewed products',
    ...overrides,
  };
}

/**
 * Create multiple mock recommendations
 */
export function createMockRecommendations(count: number, scoreOffset = 0) {
  return Array.from({ length: count }, (_, i) => ({
    productId: `prod-${i + 1}`,
    score: Math.max(0, 0.9 - i * 0.05 + scoreOffset),
    algorithm: 'vector',
  }));
}

/**
 * Mock context analysis result
 */
export function createMockContext(overrides = {}) {
  return {
    detectedIntent: 'Looking for hydraulic pumps',
    categories: ['hydraulics'],
    tags: ['pump', 'industrial'],
    ...overrides,
  };
}

/**
 * Mock recommendation metrics
 */
export function createMockMetrics(overrides = {}) {
  return {
    totalShown: 100,
    totalClicked: 20,
    totalPurchased: 5,
    clickThroughRate: 0.2,
    conversionRate: 0.05,
    ...overrides,
  };
}

/**
 * Mock recommendation event for database
 */
export function createMockRecommendationEvent(overrides = {}) {
  return {
    session_id: 'session-123',
    conversation_id: 'conv-456',
    product_id: 'prod-1',
    algorithm_used: 'hybrid',
    shown: true,
    clicked: false,
    purchased: false,
    ...overrides,
  };
}

/**
 * Standard test parameters for getRecommendations
 */
export function createGetRecommendationsParams(overrides = {}) {
  return {
    domainId: 'domain-123',
    algorithm: 'hybrid' as const,
    limit: 5,
    supabaseClient: {},
    ...overrides,
  };
}
