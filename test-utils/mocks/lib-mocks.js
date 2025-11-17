/**
 * Library Mocks Configuration
 *
 * Provides mock implementations for internal library modules:
 * - Recommendation algorithms (vector similarity, collaborative filtering, content-based)
 * - Follow-ups module for cron job tests
 */

const recommendationMocks = {
  '@/lib/recommendations/vector-similarity': {
    vectorSimilarityRecommendations: jest.fn().mockResolvedValue([]),
  },
  '@/lib/recommendations/collaborative-filter': {
    collaborativeFilterRecommendations: jest.fn().mockResolvedValue([]),
  },
  '@/lib/recommendations/content-filter': {
    contentBasedRecommendations: jest.fn().mockResolvedValue([]),
  },
};

const followUpsMock = {
  '@/lib/follow-ups': {
    sendPendingFollowUps: jest.fn().mockResolvedValue({ sent: 0, failed: 0 }),
  },
};

module.exports = {
  recommendationMocks,
  followUpsMock,
};
