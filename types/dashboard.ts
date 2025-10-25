export type DashboardConversationStatus = 'active' | 'waiting' | 'resolved';

export interface DashboardTrendPoint {
  date: string;
  conversations: number;
  satisfactionScore: number;
}

export interface DashboardRecentConversation {
  id: string;
  createdAt: string;
  status: DashboardConversationStatus;
  lastMessagePreview: string;
  lastMessageAt: string;
  customerName: string | null;
}

export interface DashboardLanguageDistribution {
  language: string;
  percentage: number;
  count: number;
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

export interface DashboardAnalyticsTopQuery {
  query: string;
  count: number;
  percentage: number;
}

export interface DashboardAnalyticsData {
  responseTime: number;
  satisfactionScore: number;
  resolutionRate: number;
  topQueries: DashboardAnalyticsTopQuery[];
  failedSearches: string[];
  languageDistribution: Array<DashboardLanguageDistribution & { color: string }>;
  dailySentiment: Array<{
    date: string;
    positive: number;
    negative: number;
    neutral: number;
    total: number;
    satisfactionScore: number;
  }>;
  metrics: {
    totalMessages: number;
    userMessages: number;
    avgMessagesPerDay: number;
    positiveMessages: number;
    negativeMessages: number;
  };
}

export interface DashboardConversation {
  id: string;
  message: string;
  timestamp: string;
  status: DashboardConversationStatus;
  customerName: string | null;
  metadata?: {
    language?: string;
    [key: string]: unknown;
  };
}

export interface DashboardConversationsData {
  total: number;
  change: number;
  statusCounts: Record<DashboardConversationStatus, number>;
  languages: Array<{ language: string; count: number; percentage: number }>;
  peakHours: Array<{ hour: number; label: string; level: string; count: number }>;
  recent: DashboardConversation[];
  pagination?: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

export interface DashboardTelemetryOverview {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  errorRate: number;
  activeSessions: number;
  timeRange: string;
}

export interface DashboardTelemetryCost {
  total: string;
  average: string;
  projectedDaily: string;
  projectedMonthly: string;
  perHour: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface DashboardTelemetryTokens {
  totalInput: number;
  totalOutput: number;
  total: number;
  avgPerRequest: number;
}

export interface DashboardTelemetryPerformance {
  avgResponseTime: number;
  totalSearches: number;
  avgSearchesPerRequest: string;
  avgIterations: string;
}

export interface DashboardTelemetryModelUsage {
  model: string;
  count: number;
  cost: string | number;
  tokens: number;
  percentage: number;
}

export interface DashboardTelemetryDomainBreakdown {
  domain: string;
  requests: number;
  cost: string | number;
}

export interface DashboardTelemetryHourlyPoint {
  hour: string;
  cost: number;
  requests: number;
}

export interface DashboardTelemetryLiveSession {
  id: string;
  uptime: number;
  cost: string;
  model: string;
}

export interface DashboardTelemetryLive {
  activeSessions: number;
  currentCost: string;
  sessionsData: DashboardTelemetryLiveSession[];
}

export interface DashboardTelemetryHealth {
  rollupFreshnessMinutes: number | null;
  rollupSource: 'rollup' | 'raw';
  stale: boolean;
}

export interface DashboardTelemetryData {
  overview: DashboardTelemetryOverview;
  cost: DashboardTelemetryCost;
  tokens: DashboardTelemetryTokens;
  performance: DashboardTelemetryPerformance;
  modelUsage: DashboardTelemetryModelUsage[];
  domainBreakdown: DashboardTelemetryDomainBreakdown[];
  hourlyTrend: DashboardTelemetryHourlyPoint[];
  live: DashboardTelemetryLive;
  health: DashboardTelemetryHealth;
}

export interface GdprAuditLogEntry {
  id: string;
  domain: string;
  request_type: 'export' | 'delete';
  session_id: string | null;
  email: string | null;
  actor: string | null;
  status: string;
  deleted_count: number | null;
  message: string | null;
  created_at: string;
}

export interface GdprAuditLogFilters {
  domain?: string;
  request_type?: 'export' | 'delete';
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

export interface GdprAuditLogResponse {
  data: GdprAuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    sources?: string[];
    products?: number[];
    orders?: number[];
    [key: string]: string[] | number[] | string | number | boolean | null | undefined;
  };
  created_at: string;
}

export interface ConversationTranscript {
  conversationId: string;
  messages: ConversationMessage[];
  metadata?: {
    customerName?: string | null;
    status?: DashboardConversationStatus;
    language?: string;
    [key: string]: unknown;
  };
}
