/**
 * Analytics Engine
 *
 * Comprehensive analytics system for conversation and session metrics:
 * - Response time calculation
 * - Engagement scoring
 * - Completion tracking
 * - Topic extraction
 * - Data export utilities
 *
 * Provides real-time and historical analytics for the dashboard.
 *
 * This is the main orchestrator that delegates to specialized modules.
 */

import { Message } from '@/types/database';
import {
  ConversationMetrics,
  AnalyticsOverview,
  DailyMetric,
  AnalyticsExportOptions,
} from '@/types/analytics';

// Import specialized analyzers
import { ResponseTimeAnalyzer } from './engine/response-time-analyzer';
import { EngagementAnalyzer } from './engine/engagement-analyzer';
import { CompletionAnalyzer } from './engine/completion-analyzer';
import { TopicExtractor } from './engine/topic-extractor';
import { AnalyticsAggregators } from './engine/aggregators';
import { AnalyticsExporters } from './engine/exporters';

// Re-export analyzers for backward compatibility
export { ResponseTimeAnalyzer } from './engine/response-time-analyzer';
export { EngagementAnalyzer } from './engine/engagement-analyzer';
export { CompletionAnalyzer } from './engine/completion-analyzer';
export { TopicExtractor } from './engine/topic-extractor';

// ============================================================================
// Main Analytics Engine
// ============================================================================

export class AnalyticsEngine {
  /**
   * Calculate complete conversation metrics
   */
  public static calculateConversationMetrics(
    conversationId: string,
    sessionId: string,
    messages: Message[]
  ): ConversationMetrics {
    return {
      conversation_id: conversationId,
      session_id: sessionId,
      metrics: {
        response_times: ResponseTimeAnalyzer.calculate(messages),
        engagement: EngagementAnalyzer.calculate(messages),
        completion: CompletionAnalyzer.calculate(messages),
        topics: TopicExtractor.extract(messages),
      },
      calculated_at: new Date().toISOString(),
    };
  }

  /**
   * Calculate dashboard overview metrics
   */
  public static calculateOverview(
    conversations: Array<{ messages: Message[]; created_at: string }>,
    startDate: Date,
    endDate: Date
  ): AnalyticsOverview {
    return AnalyticsAggregators.calculateOverview(conversations, startDate, endDate);
  }

  /**
   * Calculate daily metrics for trends
   */
  public static calculateDailyMetrics(
    conversations: Array<{ messages: Message[]; created_at: string }>,
    startDate: Date,
    endDate: Date
  ): DailyMetric[] {
    return AnalyticsAggregators.calculateDailyMetrics(conversations, startDate, endDate);
  }

  /**
   * Export analytics data in specified format
   */
  public static exportData(
    conversations: ConversationMetrics[],
    options: AnalyticsExportOptions
  ): string {
    return AnalyticsExporters.exportData(conversations, options);
  }
}
