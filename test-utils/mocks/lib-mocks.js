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
    detectFollowUpCandidates: jest.fn().mockResolvedValue([]),
    prioritizeFollowUps: jest.fn().mockReturnValue([]),
    scheduleFollowUps: jest.fn().mockResolvedValue({ scheduled: 0 }),
    getFollowUpAnalytics: jest.fn().mockResolvedValue({
      overall: { total_sent: 0, response_rate: 0, avg_response_time_hours: 0, conversion_rate: 0, effectiveness_score: 0 },
      by_reason: {},
      by_channel: {},
      trend: []
    }),
    getFollowUpSummary: jest.fn().mockResolvedValue({
      total_sent_today: 0,
      total_sent_this_week: 0,
      total_sent_this_month: 0,
      avg_response_rate: 0,
      most_effective_reason: 'N/A',
      least_effective_reason: 'N/A',
      pending_count: 0
    }),
  },
};

module.exports = {
  recommendationMocks,
  followUpsMock,
};
