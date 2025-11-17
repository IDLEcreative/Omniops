/**
 * Dashboard Types - Main Export File
 *
 * Re-exports all dashboard-related types from their respective modules
 */

// Conversation Types
export type {
  DashboardConversationStatus,
  DashboardRecentConversation,
  DashboardLanguageDistribution,
  DashboardConversationFilter,
  DashboardConversationMetrics,
  DashboardConversationItem
} from './dashboard-conversations';

// Overview Types
export type {
  DashboardTrendPoint,
  DashboardSummaryMetrics,
  DashboardQuickStats,
  DashboardTelemetrySnapshot,
  DashboardBotStatus,
  DashboardOverview
} from './dashboard-overview';

// Analytics Types
export type {
  DashboardAnalyticsTopQuery,
  DashboardAnomaly,
  ComparisonMetric,
  MetricComparison,
  DashboardAnalyticsComparison,
  DashboardUserMetrics,
  DashboardSessionMetrics,
  DashboardPageViews,
  DashboardShoppingBehavior,
  DashboardUserAnalytics,
  DashboardAnalytics
} from './dashboard-analytics';

// Annotations and Goals Types
export type {
  ChartAnnotation,
  MetricGoal,
  ConversationTranscript
} from './dashboard-annotations';

// Re-export AnomalySeverity for backward compatibility
export type { AnomalySeverity } from '@/lib/analytics/anomaly-types';

// Backward compatibility aliases
export type DashboardAnalyticsData = DashboardAnalytics;
export type DashboardConversation = DashboardConversationItem;
export type DashboardConversationsData = {
  conversations: DashboardConversationItem[];
  recent: DashboardConversationItem[];
  metrics: DashboardConversationMetrics;
  statusCounts: Record<DashboardConversationStatus, number>;
  languages: DashboardLanguageDistribution[];
};
export type DashboardTelemetryData = DashboardTelemetrySnapshot;

// Additional type exports
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export type AnnotationCategory = 'campaign' | 'release' | 'incident' | 'event' | 'other';

export interface CreateAnnotationInput {
  annotation_date: string;
  title: string;
  description?: string;
  category: AnnotationCategory;
  color?: string;
}

export interface UpdateAnnotationInput {
  id: string;
  annotation_date?: string;
  title?: string;
  description?: string;
  category?: AnnotationCategory;
  color?: string;
}

export interface MetricGoalInput {
  metric_name: string;
  target_value: number;
  period: MetricGoalPeriod;
}

export type MetricGoalPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface MetricProgress {
  current: number;
  target: number;
  percentage: number;
  status: 'on-track' | 'at-risk' | 'behind' | 'achieved';
  trend?: 'up' | 'down' | 'stable';
}

export interface DashboardTelemetryDomainBreakdown {
  domain: string;
  count: number;
  percentage: number;
}

export interface DashboardTelemetryHourlyPoint {
  hour: string;
  count: number;
}

export interface DashboardTelemetryModelUsage {
  model: string;
  count: number;
  percentage: number;
}