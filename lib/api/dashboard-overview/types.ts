/**
 * Dashboard Overview API Types
 * Shared type definitions for dashboard overview endpoints
 */

export interface ConversationRecord {
  id: string;
  session_id: string | null;
  customer_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  ended_at: string | null;
}

export interface ConversationMetadata {
  status?: string;
  customer?: { name?: string | null };
  customer_name?: string | null;
}

export interface RecentConversationEntry {
  id: string;
  createdAt: string;
  status: 'active' | 'waiting' | 'resolved';
  lastMessagePreview: string;
  lastMessageAt: string;
  customerName: string | null;
}

export interface TelemetryRow {
  success: boolean | null;
  cost_usd: number | null;
  search_count: number | null;
  total_tokens: number | null;
  model: string | null;
  created_at: string;
}

export interface DashboardOverview {
  summary: {
    totalConversations: number;
    conversationChange: number;
    activeUsers: number;
    activeUsersChange: number;
    avgResponseTime: number;
    avgResponseTimeChange: number;
    resolutionRate: number;
    resolutionRateChange: number;
    satisfactionScore: number;
  };
  trend: Array<{ date: string; conversations: number; satisfactionScore: number }>;
  recentConversations: RecentConversationEntry[];
  languageDistribution: Array<{ language: string; count: number; percentage: number }>;
  quickStats: {
    satisfaction: number;
    avgResponseTime: number;
    conversationsToday: number;
    successRate: number;
    totalTokens: number;
    totalCostUSD: number;
    avgSearchesPerRequest: number;
  };
  telemetry: {
    totalRequests: number;
    successfulRequests: number;
    successRate: number;
    avgSearchesPerRequest: number;
    totalTokens: number;
    totalCostUSD: number;
  };
  botStatus: {
    online: boolean;
    uptimePercent: number;
    primaryModel: string;
    lastTrainingAt: string | null;
  };
}
