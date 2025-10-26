/**
 * Dashboard Overview API Utilities
 * Helper functions for data formatting and parsing
 */

import type { ConversationMetadata } from './types';

export const formatChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / Math.abs(previous)) * 100;
};

export const toDateKey = (isoDate: string): string => {
  return new Date(isoDate).toISOString().slice(0, 10);
};

export const parseConversationMetadata = (
  metadata: Record<string, unknown> | null
): ConversationMetadata => {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return metadata as ConversationMetadata;
};

export const getDefaultOverview = () => ({
  summary: {
    totalConversations: 0,
    conversationChange: 0,
    activeUsers: 0,
    activeUsersChange: 0,
    avgResponseTime: 0,
    avgResponseTimeChange: 0,
    resolutionRate: 0,
    resolutionRateChange: 0,
    satisfactionScore: 3
  },
  trend: [],
  recentConversations: [],
  languageDistribution: [],
  quickStats: {
    satisfaction: 3,
    avgResponseTime: 0,
    conversationsToday: 0,
    successRate: 100,
    totalTokens: 0,
    totalCostUSD: 0,
    avgSearchesPerRequest: 0
  },
  telemetry: {
    totalRequests: 0,
    successfulRequests: 0,
    successRate: 100,
    avgSearchesPerRequest: 0,
    totalTokens: 0,
    totalCostUSD: 0
  },
  botStatus: {
    online: false,
    uptimePercent: 0,
    primaryModel: 'gpt-5-mini',
    lastTrainingAt: null
  }
});
