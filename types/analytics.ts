/**
 * Analytics and Session Tracking Type Definitions
 *
 * Type definitions for Phase 3 enhancements including session tracking,
 * analytics metrics, performance monitoring, and multi-tab synchronization.
 */

// ============================================================================
// Session Tracking Types
// ============================================================================

export interface SessionMetadata {
  session_id: string;
  domain: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  page_views: PageView[];
  total_pages: number;
  conversation_ids: string[];
  user_agent?: string;
  initial_referrer?: string;
  browser_info?: BrowserInfo;
}

export interface PageView {
  url: string;
  title: string;
  timestamp: string;
  duration_seconds?: number;
  scroll_depth?: number;
  interactions?: number;
}

export interface BrowserInfo {
  name: string;
  version: string;
  os: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  viewport_width: number;
  viewport_height: number;
}

// ============================================================================
// Analytics Metrics Types
// ============================================================================

export interface ConversationMetrics {
  conversation_id: string;
  session_id: string;
  metrics: {
    response_times: ResponseTimeMetrics;
    engagement: EngagementMetrics;
    completion: CompletionMetrics;
    sentiment?: SentimentMetrics;
    topics: TopicMetrics;
  };
  calculated_at: string;
}

export interface ResponseTimeMetrics {
  average_ms: number;
  median_ms: number;
  p95_ms: number;
  p99_ms: number;
  slowest_ms: number;
  fastest_ms: number;
  total_responses: number;
}

export interface EngagementMetrics {
  score: number; // 0-100
  total_messages: number;
  user_messages: number;
  assistant_messages: number;
  average_message_length: number;
  conversation_depth: number;
  time_between_messages_avg_seconds: number;
  quick_replies_used: number;
}

export interface CompletionMetrics {
  completed: boolean;
  completion_rate: number; // 0-1
  abandonment_point?: number; // Message index where user left
  resolution_achieved: boolean;
  user_satisfaction?: number; // 0-100
}

export interface SentimentMetrics {
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number; // -1 to 1
  sentiment_progression: SentimentPoint[];
  escalation_detected: boolean;
}

export interface SentimentPoint {
  message_index: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;
  timestamp: string;
}

export interface TopicMetrics {
  primary_topics: string[];
  topic_distribution: Record<string, number>;
  product_mentions: string[];
  order_mentions: string[];
  support_categories: string[];
}

// ============================================================================
// Performance Monitoring Types
// ============================================================================

export interface PerformanceMetrics {
  conversation_id: string;
  metrics: {
    render_performance: RenderPerformance;
    memory_usage: MemoryUsage;
    network_performance: NetworkPerformance;
  };
  timestamp: string;
}

export interface RenderPerformance {
  message_render_time_ms: number;
  scroll_performance_fps: number;
  dom_nodes: number;
  rerender_count: number;
  virtual_scroll_enabled: boolean;
}

export interface MemoryUsage {
  heap_used_mb: number;
  heap_total_mb: number;
  message_count: number;
  memory_per_message_kb: number;
  gc_events?: number;
}

export interface NetworkPerformance {
  api_calls: number;
  total_bytes_sent: number;
  total_bytes_received: number;
  average_latency_ms: number;
  failed_requests: number;
}

// ============================================================================
// Multi-Tab Synchronization Types
// ============================================================================

export interface TabSyncMessage {
  type: TabSyncMessageType;
  payload: TabSyncPayload;
  sender_tab_id: string;
  timestamp: string;
}

export type TabSyncMessageType =
  | 'NEW_MESSAGE'
  | 'CONVERSATION_STATE_UPDATE'
  | 'TYPING_INDICATOR'
  | 'TAB_FOCUS_CHANGE'
  | 'TAB_CLOSE'
  | 'CONVERSATION_OPENED'
  | 'CONVERSATION_CLOSED';

export type TabSyncPayload =
  | NewMessagePayload
  | ConversationStatePayload
  | TypingIndicatorPayload
  | TabFocusPayload
  | ConversationControlPayload;

export interface NewMessagePayload {
  conversation_id: string;
  message: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  };
}

export interface ConversationStatePayload {
  conversation_id: string;
  state: {
    is_open: boolean;
    unread_count: number;
    last_message_at: string;
  };
}

export interface TypingIndicatorPayload {
  conversation_id: string;
  is_typing: boolean;
  user_type: 'user' | 'assistant';
}

export interface TabFocusPayload {
  has_focus: boolean;
  tab_id: string;
}

export interface ConversationControlPayload {
  conversation_id: string;
  action: 'open' | 'close' | 'minimize';
}

export interface TabState {
  tab_id: string;
  is_active: boolean;
  has_focus: boolean;
  conversation_open: boolean;
  last_activity: string;
}

// ============================================================================
// Analytics Dashboard Types
// ============================================================================

export interface AnalyticsDashboardData {
  overview: AnalyticsOverview;
  trends: AnalyticsTrends;
  top_performers: TopPerformers;
  alerts: AnalyticsAlert[];
}

export interface AnalyticsOverview {
  time_period: {
    start: string;
    end: string;
    days: number;
  };
  totals: {
    conversations: number;
    sessions: number;
    messages: number;
    unique_users: number;
  };
  averages: {
    response_time_ms: number;
    messages_per_conversation: number;
    session_duration_seconds: number;
    engagement_score: number;
  };
  rates: {
    completion_rate: number;
    resolution_rate: number;
    satisfaction_score: number;
  };
}

export interface AnalyticsTrends {
  daily_metrics: DailyMetric[];
  hourly_distribution: HourlyDistribution[];
  growth_indicators: GrowthIndicators;
}

export interface DailyMetric {
  date: string;
  conversations: number;
  messages: number;
  avg_response_time_ms: number;
  completion_rate: number;
}

export interface HourlyDistribution {
  hour: number;
  conversations: number;
  avg_response_time_ms: number;
}

export interface GrowthIndicators {
  conversation_growth_rate: number; // Percentage change
  engagement_trend: 'up' | 'down' | 'stable';
  response_time_trend: 'improving' | 'degrading' | 'stable';
}

export interface TopPerformers {
  fastest_responses: ConversationSummary[];
  highest_engagement: ConversationSummary[];
  most_completed: ConversationSummary[];
}

export interface ConversationSummary {
  conversation_id: string;
  session_id: string;
  created_at: string;
  metric_value: number;
  metric_type: string;
}

export interface AnalyticsAlert {
  id: string;
  type: 'warning' | 'critical' | 'info';
  category: 'performance' | 'engagement' | 'errors';
  message: string;
  value: number;
  threshold: number;
  created_at: string;
}

// ============================================================================
// Export Configuration Types
// ============================================================================

export interface AnalyticsExportOptions {
  format: 'csv' | 'json' | 'excel';
  date_range: {
    start: string;
    end: string;
  };
  include_metrics: ExportMetrics;
  grouping: 'daily' | 'weekly' | 'monthly' | 'none';
}

export interface ExportMetrics {
  sessions: boolean;
  conversations: boolean;
  response_times: boolean;
  engagement: boolean;
  completion_rates: boolean;
  topics: boolean;
  sentiment: boolean;
}

// ============================================================================
// Feature Flags for Phase 3
// ============================================================================

export interface Phase3FeatureFlags {
  enableTabSync: boolean;
  enablePerformanceMode: boolean;
  enableSessionTracking: boolean;
  enableAnalytics: boolean;
  enableVirtualScrolling: boolean;
  enableMessagePagination: boolean;
  enableSentimentAnalysis: boolean;
}
