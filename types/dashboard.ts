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
  DashboardTelemetryFull,
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

// Import types needed for backward compatibility aliases
import type { DashboardAnalytics } from './dashboard-analytics';
import type { DashboardConversationItem, DashboardConversationMetrics, DashboardConversationStatus, DashboardLanguageDistribution } from './dashboard-conversations';
import type { DashboardTelemetrySnapshot, DashboardTelemetryFull } from './dashboard-overview';

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
export type DashboardTelemetryData = DashboardTelemetryFull;

// Additional type exports
export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export type DateRangePreset = 'last-7-days' | 'last-30-days' | 'last-90-days' | 'this-month' | 'last-month' | 'this-quarter' | 'custom';

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
  requests: number;
  cost: string;
}

export interface DashboardTelemetryHourlyPoint {
  hour: string;
  cost: number;
  requests: number;
}

export interface DashboardTelemetryModelUsage {
  model: string;
  count: number;
  cost: string;
  tokens: number;
  percentage: number;
}