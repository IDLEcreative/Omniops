import { DashboardAnalyticsData } from '@/hooks/use-dashboard-analytics';

export function createMockAnalytics(overrides?: Partial<DashboardAnalyticsData>): DashboardAnalyticsData {
  return {
    responseTime: 1500,
    satisfactionScore: 4.2,
    resolutionRate: 88,
    topQueries: [
      { query: 'How to reset password?', count: 25, percentage: 15 },
      { query: 'Shipping information', count: 20, percentage: 12 },
    ],
    failedSearches: [
      'obscure product SKU',
      'invalid category name',
    ],
    languageDistribution: [
      { language: 'en', percentage: 65, count: 130, color: '#3b82f6' },
      { language: 'es', percentage: 35, count: 70, color: '#10b981' },
    ],
    dailySentiment: [
      {
        date: '2025-10-18',
        positive: 30,
        negative: 5,
        neutral: 15,
        total: 50,
        satisfactionScore: 4.1,
      },
      {
        date: '2025-10-19',
        positive: 35,
        negative: 3,
        neutral: 12,
        total: 50,
        satisfactionScore: 4.3,
      },
    ],
    metrics: {
      totalMessages: 500,
      userMessages: 250,
      avgMessagesPerDay: 71,
      positiveMessages: 180,
      negativeMessages: 20,
    },
    ...overrides,
  };
}
