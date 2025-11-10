/**
 * CSV Exporter
 *
 * Exports analytics data to CSV format
 * Simple, universal format compatible with Excel, Google Sheets, etc.
 */

import type { MessageAnalytics } from '@/lib/dashboard/analytics';
import type { UserAnalyticsResult } from '@/lib/dashboard/analytics/user-analytics';

export interface CSVExportOptions {
  includeMessageAnalytics?: boolean;
  includeUserAnalytics?: boolean;
  includeDailyMetrics?: boolean;
  includeTopQueries?: boolean;
  includeLanguageDistribution?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Convert analytics data to CSV format
 */
export function exportToCSV(
  messageAnalytics: MessageAnalytics | null,
  userAnalytics: UserAnalyticsResult | null,
  options: CSVExportOptions = {}
): string {
  const {
    includeMessageAnalytics = true,
    includeUserAnalytics = true,
    includeDailyMetrics = true,
    includeTopQueries = true,
    includeLanguageDistribution = true,
  } = options;

  const sections: string[] = [];

  // Header with metadata
  sections.push('# Analytics Report');
  sections.push(`# Generated: ${new Date().toISOString()}`);
  if (options.dateRange) {
    sections.push(`# Date Range: ${options.dateRange.start} to ${options.dateRange.end}`);
  }
  sections.push('');

  // Message Analytics Summary
  if (includeMessageAnalytics && messageAnalytics) {
    sections.push('## Message Analytics');
    sections.push('Metric,Value');
    sections.push(`Total Messages,${messageAnalytics.totalMessages}`);
    sections.push(`User Messages,${messageAnalytics.userMessages}`);
    sections.push(`Response Time (seconds),${messageAnalytics.avgResponseTimeSeconds.toFixed(2)}`);
    sections.push(`Satisfaction Score,${messageAnalytics.satisfactionScore.toFixed(2)}`);
    sections.push(`Resolution Rate,${(messageAnalytics.resolutionRate * 100).toFixed(1)}%`);
    sections.push(`Positive Messages,${messageAnalytics.positiveMessages}`);
    sections.push(`Negative Messages,${messageAnalytics.negativeMessages}`);
    sections.push('');
  }

  // User Analytics Summary
  if (includeUserAnalytics && userAnalytics) {
    sections.push('## User Analytics');
    sections.push('Metric,Value');
    sections.push(`Total Unique Users,${userAnalytics.total_unique_users}`);
    sections.push(`Average Daily Users,${userAnalytics.avg_daily_users.toFixed(0)}`);
    sections.push(`Growth Rate,${(userAnalytics.growth.growth_rate * 100).toFixed(1)}%`);
    sections.push(`Average Session Duration (seconds),${userAnalytics.session_stats.avg_duration_seconds.toFixed(0)}`);
    sections.push(`Bounce Rate,${(userAnalytics.session_stats.bounce_rate * 100).toFixed(1)}%`);
    sections.push(`Total Page Views,${userAnalytics.page_view_stats.total_views}`);
    sections.push(`Unique Pages,${userAnalytics.page_view_stats.unique_pages}`);
    sections.push(`Product Views,${userAnalytics.shopping_behavior.product_page_views}`);
    sections.push(`Conversion Rate,${(userAnalytics.shopping_behavior.conversion_rate * 100).toFixed(1)}%`);
    sections.push('');
  }

  // Top Queries
  if (includeTopQueries && messageAnalytics && messageAnalytics.topQueries.length > 0) {
    sections.push('## Top Queries');
    sections.push('Query,Count,Percentage');
    messageAnalytics.topQueries.forEach(query => {
      const escapedQuery = escapeCSV(query.query);
      sections.push(`"${escapedQuery}",${query.count},${query.percentage.toFixed(1)}%`);
    });
    sections.push('');
  }

  // Language Distribution
  if (includeLanguageDistribution && messageAnalytics && messageAnalytics.languageDistribution.length > 0) {
    sections.push('## Language Distribution');
    sections.push('Language,Count,Percentage');
    messageAnalytics.languageDistribution.forEach(lang => {
      sections.push(`${lang.language},${lang.count},${lang.percentage.toFixed(1)}%`);
    });
    sections.push('');
  }

  // Daily Metrics
  if (includeDailyMetrics && userAnalytics && userAnalytics.daily_metrics.length > 0) {
    sections.push('## Daily User Metrics');
    sections.push('Date,Unique Users,New Users,Returning Users,Sessions,Avg Session Duration (seconds),Page Views');
    userAnalytics.daily_metrics.forEach(metric => {
      sections.push(
        `${metric.date},${metric.unique_users},${metric.new_users},${metric.returning_users},` +
        `${metric.total_sessions},${metric.avg_session_duration.toFixed(0)},${metric.total_page_views}`
      );
    });
    sections.push('');
  }

  // Daily Sentiment (if available in message analytics)
  if (messageAnalytics && messageAnalytics.dailySentiment && messageAnalytics.dailySentiment.length > 0) {
    sections.push('## Daily Sentiment');
    sections.push('Date,Positive,Negative,Neutral,Total,Satisfaction Score');
    messageAnalytics.dailySentiment.forEach(day => {
      sections.push(
        `${day.date},${day.positive},${day.negative},${day.neutral},` +
        `${day.total},${day.satisfactionScore.toFixed(2)}`
      );
    });
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Escape special characters in CSV fields
 */
function escapeCSV(value: string): string {
  return value.replace(/"/g, '""');
}

/**
 * Generate filename for CSV export
 */
export function generateCSVFilename(prefix: string = 'analytics'): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `${prefix}_${timestamp}.csv`;
}
