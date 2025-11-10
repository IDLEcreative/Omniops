/**
 * Analytics Data Exporters
 *
 * Handles exporting analytics data in various formats:
 * - JSON export with pretty printing
 * - CSV export with headers and row formatting
 */

import { ConversationMetrics, AnalyticsExportOptions } from '@/types/analytics';

export class AnalyticsExporters {
  /**
   * Export analytics data in specified format
   */
  public static exportData(
    conversations: ConversationMetrics[],
    options: AnalyticsExportOptions
  ): string {
    if (options.format === 'json') {
      return JSON.stringify(conversations, null, 2);
    }

    if (options.format === 'csv') {
      return this.convertToCSV(conversations);
    }

    throw new Error(`Unsupported export format: ${options.format}`);
  }

  private static convertToCSV(conversations: ConversationMetrics[]): string {
    const headers = [
      'Conversation ID',
      'Session ID',
      'Calculated At',
      'Avg Response Time (ms)',
      'Engagement Score',
      'Completed',
      'Resolution Achieved',
      'Total Messages',
      'Primary Topics',
    ];

    const rows = conversations.map(conv => [
      conv.conversation_id,
      conv.session_id,
      conv.calculated_at,
      conv.metrics.response_times.average_ms,
      conv.metrics.engagement.score,
      conv.metrics.completion.completed,
      conv.metrics.completion.resolution_achieved,
      conv.metrics.engagement.total_messages,
      conv.metrics.topics.primary_topics.join('; '),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    return csvContent;
  }
}
