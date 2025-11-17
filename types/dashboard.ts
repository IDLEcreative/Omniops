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