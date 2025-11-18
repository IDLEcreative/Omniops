/**
 * Dashboard Overview Types
 */

import type {
  DashboardConversationStatus,
  DashboardRecentConversation,
  DashboardLanguageDistribution
} from './dashboard-conversations';

export interface DashboardTrendPoint {
  date: string;
  conversations: number;
  satisfactionScore: number;
}

export interface DashboardSummaryMetrics {
  totalConversations: number;
  conversationChange: number;
  activeUsers: number;
  activeUsersChange: number;
  avgResponseTime: number;
  avgResponseTimeChange: number;
  resolutionRate: number;
  resolutionRateChange: number;
  satisfactionScore: number;
}

export interface DashboardQuickStats {
  satisfaction: number;
  avgResponseTime: number;
  conversationsToday: number;
  successRate: number;
  totalTokens: number;
  totalCostUSD: number;
  avgSearchesPerRequest: number;
}

// Simple telemetry snapshot for dashboard overview
export interface DashboardTelemetrySnapshot {
  totalRequests: number;
  successfulRequests: number;
  successRate: number;
  avgSearchesPerRequest: number;
  totalTokens: number;
  totalCostUSD: number;
}

// Full telemetry data structure (matches API response)
export interface DashboardTelemetryFull {
  overview: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    errorRate: number;
    activeSessions: number;
    timeRange: string;
  };
  cost: {
    total: string;
    average: string;
    projectedDaily: string;
    projectedMonthly: string;
    perHour: string;
    trend: string;
  };
  tokens: {
    totalInput: number;
    totalOutput: number;
    total: number;
    avgPerRequest: number;
  };
  performance: {
    avgResponseTime: number;
    totalSearches: number;
    avgSearchesPerRequest: string;
    avgIterations: string;
  };
  modelUsage: Array<{
    model: string;
    count: number;
    cost: string;
    tokens: number;
    percentage: number;
  }>;
  domainBreakdown: Array<{
    domain: string;
    requests: number;
    cost: string;
  }>;
  hourlyTrend: Array<{
    hour: string;
    cost: number;
    requests: number;
  }>;
  live: {
    activeSessions: number;
    currentCost: string;
    sessionsData: Array<{
      id: string;
      uptime: number;
      cost: string;
      model: string;
    }>;
  };
  health: {
    rollupFreshnessMinutes: number | null;
    rollupSource: 'rollup' | 'raw';
    stale: boolean;
  };
}

export interface DashboardBotStatus {
  online: boolean;
  uptimePercent: number;
  primaryModel: string;
  lastTrainingAt: string | null;
}

export interface DashboardOverview {
  summary: DashboardSummaryMetrics;
  trend: DashboardTrendPoint[];
  recentConversations: DashboardRecentConversation[];
  languageDistribution: DashboardLanguageDistribution[];
  quickStats: DashboardQuickStats;
  telemetry: DashboardTelemetrySnapshot;
  botStatus: DashboardBotStatus;
}