/**
 * Analytics Aggregators
 *
 * Provides aggregation functions for analytics data:
 * - Overview metrics calculation (totals, averages, rates)
 * - Daily metrics computation for trend analysis
 * - Multi-conversation metric aggregation
 */

import { Message } from '@/types/database';
import { AnalyticsOverview, DailyMetric } from '@/types/analytics';
import { ResponseTimeAnalyzer } from './response-time-analyzer';
import { EngagementAnalyzer } from './engagement-analyzer';
import { CompletionAnalyzer } from './completion-analyzer';

export class AnalyticsAggregators {
  /**
   * Calculate dashboard overview metrics
   */
  public static calculateOverview(
    conversations: Array<{ messages: Message[]; created_at: string }>,
    startDate: Date,
    endDate: Date
  ): AnalyticsOverview {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);

    // Calculate averages
    const allResponseTimes = conversations.map(conv =>
      ResponseTimeAnalyzer.calculate(conv.messages)
    );
    const avgResponseTime = allResponseTimes.reduce((sum, rt) => sum + rt.average_ms, 0) / totalConversations || 0;

    const avgMessagesPerConv = totalMessages / totalConversations || 0;

    const allEngagement = conversations.map(conv =>
      EngagementAnalyzer.calculate(conv.messages)
    );
    const avgEngagementScore = allEngagement.reduce((sum, eng) => sum + eng.score, 0) / totalConversations || 0;

    const allCompletion = conversations.map(conv =>
      CompletionAnalyzer.calculate(conv.messages)
    );
    const completionRate = allCompletion.filter(c => c.completed).length / totalConversations || 0;
    const resolutionRate = allCompletion.filter(c => c.resolution_achieved).length / totalConversations || 0;

    return {
      time_period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
      totals: {
        conversations: totalConversations,
        sessions: 0, // To be filled by caller with session data
        messages: totalMessages,
        unique_users: 0, // To be filled by caller
      },
      averages: {
        response_time_ms: Math.floor(avgResponseTime),
        messages_per_conversation: Math.floor(avgMessagesPerConv),
        session_duration_seconds: 0, // To be filled by caller
        engagement_score: Math.floor(avgEngagementScore),
      },
      rates: {
        completion_rate: Math.round(completionRate * 100) / 100,
        resolution_rate: Math.round(resolutionRate * 100) / 100,
        satisfaction_score: 0, // To be filled by caller
      },
    };
  }

  /**
   * Calculate daily metrics for trends
   */
  public static calculateDailyMetrics(
    conversations: Array<{ messages: Message[]; created_at: string }>,
    startDate: Date,
    endDate: Date
  ): DailyMetric[] {
    const dailyMap = new Map<string, Array<{ messages: Message[] }>>();

    // Group conversations by date
    conversations.forEach(conv => {
      const date = new Date(conv.created_at).toISOString().split('T')[0] ?? '';
      if (!date) return;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, []);
      }
      dailyMap.get(date)!.push(conv);
    });

    // Calculate metrics for each day
    const dailyMetrics: DailyMetric[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0] ?? '';
      if (!dateStr) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      const dayConversations = dailyMap.get(dateStr) || [];

      const totalMessages = dayConversations.reduce((sum, conv) => sum + conv.messages.length, 0);

      const responseTimes = dayConversations.map(conv =>
        ResponseTimeAnalyzer.calculate(conv.messages)
      );
      const avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt.average_ms, 0) / dayConversations.length || 0;

      const completions = dayConversations.map(conv =>
        CompletionAnalyzer.calculate(conv.messages)
      );
      const completionRate = completions.filter(c => c.completed).length / dayConversations.length || 0;

      dailyMetrics.push({
        date: dateStr,
        conversations: dayConversations.length,
        messages: totalMessages,
        avg_response_time_ms: Math.floor(avgResponseTime),
        completion_rate: Math.round(completionRate * 100) / 100,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dailyMetrics;
  }
}
