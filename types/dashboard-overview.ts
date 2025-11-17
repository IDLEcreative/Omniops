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

export interface DashboardTelemetrySnapshot {
  totalRequests: number;
  successfulRequests: number;
  successRate: number;
  avgSearchesPerRequest: number;
  totalTokens: number;
  totalCostUSD: number;
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